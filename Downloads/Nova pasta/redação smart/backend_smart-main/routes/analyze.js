// routes/analyze.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const authenticateFirebaseToken = require('../middlewares/authenticateFirebaseToken');
const admin = require('firebase-admin');

// Configurações da API Brave Search
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || 'BSANe0vJ56EwwgLZ4zE3nf2S2BLOYCd';
const BRAVE_BASE_URL = 'https://api.search.brave.com/res/v1/web/search';

// Cache e Rate Limiting
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hora
const RATE_LIMIT_DELAY = 2000; // 2 segundos entre requisições
let lastRequestTime = 0;

// Função para validar se uma fonte é realmente confiável
function validarFonteConfiavel(url, fonteEsperada) {
  try {
    // 1. Verificar se a URL é válida
    if (!url || typeof url !== 'string') {
      return { isValid: false, reason: 'URL inválida' };
    }

    // 2. Verificar se é HTTPS (segurança)
    if (!url.startsWith('https://')) {
      return { isValid: false, reason: 'URL não é HTTPS' };
    }

    // 3. Lista de domínios oficiais confiáveis
    const dominiosConfiaveis = [
      'gov.br',
      'ibge.gov.br',
      'mec.gov.br',
      'saude.gov.br',
      'ipea.gov.br',
      'cgi.br',
      'who.int', // OMS
      'un.org', // ONU
      'unesco.org',
      'fao.org'
    ];

    // 4. Verificar se o domínio é confiável
    const urlObj = new URL(url);
    const dominioConfiavel = dominiosConfiaveis.some(dominio => 
      urlObj.hostname.includes(dominio)
    );

    if (!dominioConfiavel) {
      return { isValid: false, reason: `Domínio não confiável: ${urlObj.hostname}` };
    }

    // 5. Verificar se a fonte corresponde ao domínio esperado
    const mapeamentoFontes = {
      'IBGE': 'ibge.gov.br',
      'Ministério da Saúde': 'saude.gov.br',
      'IPEA': 'ipea.gov.br',
      'MEC': 'mec.gov.br',
      'CGI.br': 'cgi.br',
      'OMS': 'who.int',
      'Instituto Palavra Aberta': 'palavraaberta.org.br',
      'Ministério das Comunicações': 'gov.br'
    };

    const dominioEsperado = mapeamentoFontes[fonteEsperada];
    if (dominioEsperado && !urlObj.hostname.includes(dominioEsperado)) {
      return { isValid: false, reason: `Domínio não corresponde à fonte esperada: ${fonteEsperada}` };
    }

    // 6. Verificar se não é uma página de erro ou redirecionamento
    const pathname = urlObj.pathname.toLowerCase();
    const paginasInvalidas = [
      '/404',
      '/error',
      '/not-found',
      '/redirect',
      '/login',
      '/search',
      '/busca'
    ];

    if (paginasInvalidas.some(pagina => pathname.includes(pagina))) {
      return { isValid: false, reason: 'URL parece ser uma página de erro ou redirecionamento' };
    }

    // 7. Verificar se tem conteúdo relevante no path
    if (pathname.length < 10) {
      return { isValid: false, reason: 'URL muito curta, provavelmente não é uma página de conteúdo' };
    }

    // 8. Verificar se não é um arquivo (PDF, DOC, etc.)
    const extensoesArquivo = ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'];
    if (extensoesArquivo.some(ext => url.toLowerCase().includes(ext))) {
      return { isValid: false, reason: 'URL aponta para um arquivo, não uma página web' };
    }

    // Se passou em todas as validações
    return { isValid: true, reason: 'Fonte validada com sucesso' };

  } catch (error) {
    return { isValid: false, reason: `Erro na validação: ${error.message}` };
  }
}

// Função para buscar fontes reais usando API do Brave
async function buscarFonteReal(termo, fonte) {
  try {
    // Verificar cache primeiro
    const cacheKey = `${fonte}_${termo}`;
    const cached = cache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp) < CACHE_TTL) {
      console.log(`💾 Cache hit para ${fonte}: ${cached.url}`);
      return cached;
    }

    // Rate limiting - aguardar se necessário
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const waitTime = RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`⏳ Aguardando ${waitTime}ms para respeitar rate limit...`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Tentar apenas as queries mais eficazes
    const queries = [
      `${fonte} ${termo} site:gov.br`,
      `${fonte} ${termo} site:ibge.gov.br`,
      `${fonte} ${termo} site:mec.gov.br`,
      `${termo} ${fonte} brasil`
    ];

    for (const query of queries) {
      try {
        lastRequestTime = Date.now();
        
        const response = await axios.get(BRAVE_BASE_URL, {
          headers: {
            'X-Subscription-Token': BRAVE_API_KEY,
            'Accept': 'application/json'
          },
          params: {
            q: query,
            count: 3,
            offset: 0,
            mkt: 'pt-BR',
            safesearch: 'moderate'
          }
        });

        if (response.data && response.data.web && response.data.web.results && response.data.web.results.length > 0) {
          // Procurar resultado mais relevante
          const resultado = response.data.web.results.find(r => 
            r.url.includes('.gov.br') || 
            r.url.includes('ibge') || 
            r.url.includes('mec') ||
            r.url.includes('saude') ||
            r.url.includes('ipea') ||
            r.url.includes('cgi')
          ) || response.data.web.results[0];

          if (resultado && resultado.url) {
            // VALIDAÇÃO RIGOROSA: Verificar se a fonte é realmente confiável
            const urlValida = validarFonteConfiavel(resultado.url, fonte);
            
            if (urlValida.isValid) {
              const fonteEncontrada = {
                url: resultado.url,
                titulo: resultado.title,
                descricao: resultado.description,
                timestamp: Date.now(),
                validada: true
              };
              
              // Salvar no cache
              cache.set(cacheKey, fonteEncontrada);
              
              console.log(`✅ Fonte VALIDADA para ${fonte}: ${resultado.url}`);
              return fonteEncontrada;
            } else {
              console.log(`❌ Fonte REJEITADA para ${fonte}: ${resultado.url} - ${urlValida.reason}`);
            }
          }
        }
      } catch (queryError) {
        if (queryError.response && queryError.response.status === 429) {
          console.log(`🚫 Rate limit atingido para ${fonte}, aguardando...`);
          await new Promise(resolve => setTimeout(resolve, 5000)); // Aguardar 5 segundos
          continue;
        }
        console.log(`❌ Query falhou: ${query}`, queryError.message);
        continue;
      }
    }
  } catch (error) {
    console.error('Erro geral ao buscar fonte real:', error.message);
  }
  
  // Fallback para fonte estática se a API falhar
  console.log(`⚠️ Usando fallback para ${fonte} - NENHUMA FONTE REAL ENCONTRADA`);
  return {
    url: null,
    titulo: fonte,
    descricao: null,
    timestamp: Date.now(),
    validada: false,
    isFallback: true
  };
}

// Certifique-se de que o Firebase Admin está inicializado
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   // databaseURL: 'https://appviagens-ec9b1-default-rtdb.firebaseio.com"'
// });

// Rota para gerar tema simples (compatibilidade com PracticePage)
router.post('/generate-theme-ai', authenticateFirebaseToken, async (req, res) => {
  try {
    const { areaTema, nivelProva, contextoEspecifico, quantidadeTextos } = req.body;
    
    // Temas ENEM realistas com problematização
    const temasEstaticos = [
      {
        id: `tema_${Date.now()}`,
        titulo: "Desafios para a valorização do trabalho no Brasil contemporâneo",
        areaTema: areaTema || 'social',
        nivelProva: nivelProva || 'enem',
        descricao: "Redação ENEM - Proposta de intervenção sobre valorização do trabalho",
        textosMotivadores: [
          {
            titulo: "Texto I",
            conteudo: "O Brasil possui uma das maiores desigualdades salariais do mundo. Segundo dados do IBGE, a diferença entre os 10% mais ricos e os 10% mais pobres é de 13 vezes. Enquanto executivos recebem salários milionários, trabalhadores essenciais como garis, enfermeiros e professores ganham salários que mal cobrem as despesas básicas. Esta realidade contrasta com países desenvolvidos, onde a valorização do trabalho é uma prioridade social.",
            fonte: "IBGE - Pesquisa Nacional por Amostra de Domicílios, 2023"
          },
          {
            titulo: "Texto II",
            conteudo: "A pandemia de COVID-19 evidenciou a importância de profissões historicamente desvalorizadas. Profissionais da saúde, entregadores, funcionários de supermercados e trabalhadores da limpeza se tornaram essenciais para o funcionamento da sociedade. No entanto, muitos continuam recebendo salários baixos e trabalhando em condições precárias, sem reconhecimento adequado de sua importância social.",
            fonte: "Ministério da Saúde - Relatório sobre Trabalhadores Essenciais, 2024"
          },
          {
            titulo: "Texto III",
            conteudo: "A automação e a inteligência artificial ameaçam milhões de empregos no Brasil. Estudos indicam que até 2030, cerca de 15 milhões de trabalhadores podem ser substituídos por máquinas. Este cenário exige uma redefinição do conceito de trabalho e do valor atribuído às diferentes profissões, especialmente aquelas que requerem habilidades humanas únicas como criatividade, empatia e pensamento crítico.",
            fonte: "Instituto de Pesquisa Econômica Aplicada (IPEA), 2024"
          },
          {
            titulo: "Texto IV",
            conteudo: "A educação profissional e tecnológica surge como alternativa para qualificar trabalhadores e aumentar sua valorização no mercado. Programas como o Pronatec e o Novos Caminhos têm como objetivo formar profissionais técnicos em áreas estratégicas. No entanto, ainda há resistência cultural em relação ao ensino técnico, visto por muitos como inferior ao ensino superior tradicional.",
            fonte: "Ministério da Educação - Política Nacional de Educação Profissional, 2024"
          }
        ],
        dataCriacao: new Date(),
        fonte: 'Sistema de Temas ENEM'
      },
      {
        id: `tema_${Date.now() + 1}`,
        titulo: "Os desafios para combater a desinformação no Brasil",
        areaTema: areaTema || 'tecnologia',
        nivelProva: nivelProva || 'enem',
        descricao: "Redação ENEM - Proposta de intervenção sobre desinformação e fake news",
        textosMotivadores: [
          {
            titulo: "Texto I",
            conteudo: "A desinformação se tornou um dos maiores desafios das sociedades democráticas no século XXI. No Brasil, pesquisas indicam que 62% da população já compartilhou informações falsas nas redes sociais, muitas vezes sem saber. As fake news se espalham 6 vezes mais rápido que informações verdadeiras, criando um ambiente de polarização e desconfiança que ameaça a coesão social e a democracia.",
            fonte: "Instituto de Tecnologia e Sociedade (ITS) - Pesquisa sobre Desinformação, 2024"
          },
          {
            titulo: "Texto II",
            conteudo: "Durante a pandemia de COVID-19, a desinformação sobre vacinas e tratamentos causou milhares de mortes evitáveis. Teorias conspiratórias sobre a origem do vírus e a eficácia das vacinas levaram muitas pessoas a recusar a imunização. Este fenômeno não se limita à saúde: eleições, mudanças climáticas e direitos humanos também são alvos constantes de campanhas de desinformação organizadas.",
            fonte: "Organização Mundial da Saúde (OMS) - Relatório sobre Infodemia, 2024"
          },
          {
            titulo: "Texto III",
            conteudo: "A educação midiática surge como ferramenta fundamental para combater a desinformação. Países como Finlândia e Canadá já implementaram programas de alfabetização midiática nas escolas, ensinando estudantes a identificar fontes confiáveis e verificar informações. No Brasil, iniciativas como o 'EducaMídia' buscam capacitar professores para desenvolver o pensamento crítico dos alunos em relação às informações que consomem.",
            fonte: "Instituto Palavra Aberta - Programa EducaMídia, 2024"
          },
          {
            titulo: "Texto IV",
            conteudo: "As plataformas digitais têm responsabilidade crescente no combate à desinformação. Facebook, Twitter e WhatsApp implementaram medidas como fact-checking e limitação de compartilhamentos, mas críticos argumentam que essas ações são insuficientes e podem limitar a liberdade de expressão. O equilíbrio entre combate à desinformação e preservação da liberdade de expressão permanece um desafio complexo para governos e empresas de tecnologia.",
            fonte: "Comitê Gestor da Internet no Brasil (CGI.br) - Relatório sobre Regulação Digital, 2024"
          }
        ],
        dataCriacao: new Date(),
        fonte: 'Sistema de Temas ENEM'
      },
      {
        id: `tema_${Date.now() + 2}`,
        titulo: "Desafios para a inclusão digital no Brasil",
        areaTema: areaTema || 'tecnologia',
        nivelProva: nivelProva || 'enem',
        descricao: "Redação ENEM - Proposta de intervenção sobre inclusão digital",
        textosMotivadores: [
          {
            titulo: "Texto I",
            conteudo: "A pandemia acelerou a digitalização da sociedade, mas também aprofundou as desigualdades digitais no Brasil. Cerca de 30% da população brasileira não tem acesso à internet, principalmente nas regiões Norte e Nordeste. Entre os que têm acesso, muitos enfrentam conexões lentas e instáveis, limitando suas possibilidades de trabalho remoto, educação online e acesso a serviços públicos digitais.",
            fonte: "Comitê Gestor da Internet no Brasil (CGI.br) - TIC Domicílios, 2023"
          },
          {
            titulo: "Texto II",
            conteudo: "A exclusão digital afeta especialmente idosos, pessoas com deficiência e comunidades rurais. Muitos idosos se sentem excluídos da sociedade digital, incapazes de acessar serviços bancários online, fazer compras pela internet ou usar aplicativos de transporte. Pessoas com deficiência enfrentam barreiras de acessibilidade em sites e aplicativos, enquanto comunidades rurais sofrem com a falta de infraestrutura de telecomunicações.",
            fonte: "Instituto Brasileiro de Geografia e Estatística (IBGE) - Pesquisa Nacional por Amostra de Domicílios, 2023"
          },
          {
            titulo: "Texto III",
            conteudo: "A educação digital se tornou essencial para a cidadania no século XXI. No entanto, muitas escolas públicas não possuem laboratórios de informática adequados ou professores capacitados para ensinar competências digitais. Esta realidade cria um ciclo de exclusão: estudantes sem acesso à tecnologia digital têm dificuldades para acompanhar o ensino remoto e desenvolvem menos habilidades necessárias para o mercado de trabalho moderno.",
            fonte: "Ministério da Educação - Censo Escolar, 2023"
          },
          {
            titulo: "Texto IV",
            conteudo: "Programas como o 'Wi-Fi Brasil' e o 'Internet para Todos' buscam expandir o acesso à internet em áreas remotas, mas enfrentam desafios de infraestrutura e sustentabilidade. A inclusão digital não se limita ao acesso à internet: é necessário também capacitar as pessoas para usar as tecnologias de forma crítica e produtiva, garantindo que todos possam se beneficiar das oportunidades da era digital.",
            fonte: "Ministério das Comunicações - Plano Nacional de Banda Larga, 2024"
          }
        ],
        dataCriacao: new Date(),
        fonte: 'Sistema de Temas ENEM'
      }
    ];
    
    // Selecionar tema aleatório
    const temaSelecionado = temasEstaticos[Math.floor(Math.random() * temasEstaticos.length)];
    
    // Buscar fontes reais apenas para o tema selecionado
    let fontesReais = [];
    
    console.log(`🎯 Tema selecionado: "${temaSelecionado.titulo}"`);
    
    if (temaSelecionado.titulo.includes('valorização do trabalho')) {
      console.log('🔍 Buscando fontes para tema: valorização do trabalho');
      fontesReais = await Promise.all([
        buscarFonteReal('desigualdade renda salário', 'IBGE'),
        buscarFonteReal('trabalhadores essenciais pandemia', 'Ministério da Saúde'),
        buscarFonteReal('automação inteligência artificial empregos', 'IPEA'),
        buscarFonteReal('educação profissional técnica', 'MEC')
      ]);
    } else if (temaSelecionado.titulo.includes('desinformação')) {
      console.log('🔍 Buscando fontes para tema: desinformação');
      fontesReais = await Promise.all([
        buscarFonteReal('desinformação fake news redes sociais', 'ITS'),
        buscarFonteReal('infodemia pandemia vacinas', 'OMS'),
        buscarFonteReal('educação midiática alfabetização', 'Instituto Palavra Aberta'),
        buscarFonteReal('regulação digital plataformas', 'CGI.br')
      ]);
    } else if (temaSelecionado.titulo.includes('inclusão digital')) {
      console.log('🔍 Buscando fontes para tema: inclusão digital');
      fontesReais = await Promise.all([
        buscarFonteReal('inclusão digital acesso internet', 'CGI.br'),
        buscarFonteReal('exclusão digital desigualdade', 'IBGE'),
        buscarFonteReal('educação digital competências', 'MEC'),
        buscarFonteReal('banda larga infraestrutura', 'Ministério das Comunicações')
      ]);
    } else {
      console.log('⚠️ Nenhuma condição de busca de fontes foi atendida');
    }
    
    console.log(`📊 Fontes encontradas: ${fontesReais.length}`);
    
    // Atualizar fontes do tema selecionado APENAS com fontes validadas
    if (fontesReais.length > 0) {
      console.log('🔄 Atualizando fontes do tema...');
      temaSelecionado.textosMotivadores = temaSelecionado.textosMotivadores.map((texto, index) => {
        if (fontesReais[index] && fontesReais[index].validada && fontesReais[index].url) {
          const novaFonte = fontesReais[index].url;
          console.log(`✅ Texto ${index + 1}: ${texto.fonte} → ${novaFonte} (VALIDADA)`);
          return {
            ...texto,
            fonte: novaFonte,
            fonteTitulo: fontesReais[index].titulo || texto.fonte,
            fonteValidada: true
          };
        } else if (fontesReais[index] && fontesReais[index].isFallback) {
          console.log(`⚠️ Texto ${index + 1}: Mantendo fonte estática - ${texto.fonte} (FALLBACK)`);
          return {
            ...texto,
            fonteValidada: false,
            isFallback: true
          };
        } else {
          console.log(`❌ Texto ${index + 1}: Fonte rejeitada, mantendo estática - ${texto.fonte}`);
          return {
            ...texto,
            fonteValidada: false
          };
        }
      });
    } else {
      console.log('⚠️ Nenhuma fonte real foi encontrada, mantendo TODAS as fontes estáticas');
    }
    
    res.json({
      success: true,
      tema: temaSelecionado
    });
    
  } catch (error) {
    console.error('Erro ao gerar tema:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

router.post('/analyze', authenticateFirebaseToken, async (req, res) => {
  let { text, tema } = req.body;

  // Sanitiza o texto de entrada
  text = text.replace(/<[^>]*>?/gm, '');

  // Verifica se o texto não está vazio
  if (!text || text.trim() === '') {
    console.error('Erro: Texto da redação está vazio.');
    return res.status(400).send({ error: 'O texto da redação é obrigatório.' });
  }

  // Verifica se o tema foi fornecido
  if (!tema || !tema.titulo) {
    console.error('Erro: As informações do tema são obrigatórias.');
    return res.status(400).send({ error: 'As informações do tema são obrigatórias.' });
  }

  // Garantir que descricao existe
  if (!tema.descricao) {
    tema.descricao = tema.titulo; // Usar o título como descrição se não houver descrição
  }

  try {
    console.log('Iniciando análise de redação...');
    console.log('Texto recebido:', text.substring(0, 100) + '...');
    console.log('Tema recebido:', tema);
    
    const user = req.user; // Obtém o usuário autenticado

    if (!user) {
      console.error('Usuário não autenticado');
      return res.status(401).send({ error: 'Usuário não autenticado.' });
    }

    // Verificar se o Firebase Admin está disponível
    if (!admin.apps.length) {
      console.error('Firebase Admin não inicializado');
      return res.status(500).send({ error: 'Serviço temporariamente indisponível.' });
    }

    console.log('Usuário autenticado:', user.uid);

    // Obtém o documento do usuário
    console.log('Buscando documento do usuário no Firestore...');
    const userDocRef = admin.firestore().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      console.error('Documento do usuário não encontrado no Firestore');
      return res.status(404).send({ error: 'Usuário não encontrado.' });
    }

    const userData = userDoc.data();
    console.log('Dados do usuário encontrados:', { 
      nome: userData.nome, 
      redacoesEnviadas: userData.redacoesEnviadas || 0,
      planoAtivo: userData.planoAtivo 
    });

    // Verifica o contador e o status premium
    const redacoesEnviadas = userData.redacoesEnviadas || 0;
    if (!userData.planoAtivo && (redacoesEnviadas >= 3)) {
      return res.status(403).send({ error: 'Limite de redações atingido. Faça upgrade para continuar.' });
    }

    // Chamada à API da Anthropic usando Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Erro: Chave da API da Anthropic não está definida.');
      return res.status(500).send({ error: 'Chave da API não configurada.' });
    }

    console.log('Chamando API da Anthropic...');
    
    // Inicializar cliente Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Constrói o prompt
    const prompt = `
Você é um avaliador experiente de redações do ENEM. Avalie a redação a seguir com base nas 5 competências do ENEM, fornecendo feedback detalhado e uma pontuação para cada competência (0 a 200 pontos). Considere o tema, a imagem e a descrição fornecidos.

Tema: ${tema.titulo}

Descrição: ${tema.descricao}

${tema.imagem ? `Imagem relacionada ao tema: ${tema.imagem}` : ''}

Redação do aluno:
${text}

Lembre-se de avaliar de acordo com os seguintes critérios:

1. **Domínio da escrita formal em língua portuguesa**: Avalie o domínio da norma culta, ortografia, gramática, pontuação.

2. **Compreensão do tema e aplicação das áreas de conhecimento**: Verifique se o aluno compreendeu o tema proposto e utilizou conhecimentos de diferentes áreas para desenvolver a argumentação.

3. **Capacidade de interpretação das informações e organização dos argumentos**: Avalie a coerência, coesão e organização das ideias apresentadas.

4. **Domínio dos mecanismos linguísticos de argumentação**: Analise o uso adequado de conectivos, coesão referencial e sequencial.

5. **Capacidade de conclusão com propostas coerentes que respeitem os direitos humanos**: Verifique se o aluno apresentou uma proposta de intervenção detalhada, coerente e respeitosa aos direitos humanos.

Por favor, responda apenas com um objeto JSON contendo as seguintes chaves: 
{
  "competencias": [
    {
      "id": 1,
      "descricao": "Feedback da competência 1",
      "nota": 200
    },
    {
      "id": 2,
      "descricao": "Feedback da competência 2",
      "nota": 120
    },
    // ... mais competências
  ],
  "pontuacaoTotal": 850,
  "comentariosGerais": "Ótima redação! Continue assim."
}
    `.trim();

    // Chamada à API da Anthropic usando Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 1500,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const analysisText = response.content[0].text.trim();
    console.log('Resposta da Anthropic recebida:', analysisText.substring(0, 200) + '...');

    // Tenta parsear a resposta como JSON
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
      console.log('Análise parseada com sucesso');
    } catch (err) {
      console.error('Erro ao parsear a resposta da IA como JSON:', err);
      console.error('Resposta da IA:', analysisText);
      return res
        .status(500)
        .send({ error: 'Erro ao processar a avaliação. Tente novamente mais tarde.' });
    }

    // Verifica se todas as chaves necessárias estão presentes
    const requiredFields = ['competencias', 'pontuacaoTotal', 'comentariosGerais'];
    const hasAllFields = requiredFields.every((field) => field in analysis);

    if (!hasAllFields) {
      console.error('Resposta JSON da IA está faltando campos:', analysis);
      return res
        .status(500)
        .send({ error: 'Resposta inválida da avaliação. Tente novamente mais tarde.' });
    }

    // Salva a redação e a avaliação no Firestore
    console.log('Salvando redação no Firestore...');
    await admin.firestore().collection('redacoes').add({
      usuarioId: user.uid,
      nome: userData.nome,
      fotoURL: userData.fotoURL,
      texto: text,
      avaliacao: analysis,
      temaId: tema.id || 'unknown',
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
    console.log('Redação salva no Firestore');

    // Atualiza o número de redações enviadas pelo usuário
    console.log('Atualizando contador de redações...');
    await userDocRef.update({
      redacoesEnviadas: admin.firestore.FieldValue.increment(1),
    });
    console.log('Contador de redações atualizado');

    console.log('Análise concluída com sucesso!');
    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Erro ao analisar a redação:', error.response?.data || error.message || error);

    // Tratamento de erros
    if (error.response && error.response.status === 401) {
      res.status(500).send({ error: 'Falha na autenticação. Verifique a chave da API.' });
    } else if (error.response && error.response.status === 429) {
      res.status(500).send({ error: 'Limite de taxa excedido. Tente novamente mais tarde.' });
    } else if (error.message === 'Limite de redações atingido. Faça upgrade para continuar.') {
      res.status(403).send({ error: 'Limite de redações atingido. Faça upgrade para continuar.' });
    } else {
      res.status(500).send({ error: 'Erro ao analisar a redação' });
    }
  }
});

module.exports = router;
