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

// Função para gerar tema ENEM real e dinâmico
async function gerarTemaEnemReal(areaTema, nivelProva) {
  try {
    console.log(`🎯 Gerando tema ENEM real para área: ${areaTema}`);
    
    // Termos de busca para diferentes áreas
    const termosPorArea = {
      'social': [
        'desigualdade social Brasil',
        'violência urbana',
        'saúde pública',
        'educação básica',
        'trabalho informal',
        'moradia popular',
        'segurança alimentar',
        'direitos humanos'
      ],
      'tecnologia': [
        'inteligência artificial',
        'inclusão digital',
        'desinformação fake news',
        'privacidade dados',
        'algoritmos redes sociais',
        'automação empregos',
        'ciberbullying',
        'dependência tecnológica'
      ],
      'meio ambiente': [
        'mudanças climáticas',
        'desmatamento Amazônia',
        'poluição atmosférica',
        'recursos hídricos',
        'energias renováveis',
        'sustentabilidade urbana',
        'biodiversidade',
        'economia circular'
      ],
      'cultura': [
        'preservação cultural',
        'diversidade cultural',
        'arte educação',
        'tradições populares',
        'identidade nacional',
        'globalização cultura',
        'patrimônio histórico',
        'expressões artísticas'
      ],
      'educação': [
        'acesso educação superior',
        'qualidade ensino',
        'evasão escolar',
        'alfabetização',
        'educação inclusiva',
        'formação professores',
        'tecnologia educação',
        'educação profissional'
      ]
    };
    
    const termos = termosPorArea[areaTema] || termosPorArea['social'];
    const termoAleatorio = termos[Math.floor(Math.random() * termos.length)];
    
    console.log(`🔍 Buscando informações sobre: ${termoAleatorio}`);
    
    // Buscar informações reais sobre o tema
    const response = await axios.get(BRAVE_BASE_URL, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        q: `${termoAleatorio} Brasil`,
        count: 3,
        offset: 0,
        mkt: 'pt-BR',
        safesearch: 'moderate'
      }
    });
    
    if (response.data && response.data.web && response.data.web.results) {
      const resultados = response.data.web.results;
      
      // Gerar tema baseado nos resultados reais
      const tema = {
        id: `tema_real_${Date.now()}`,
        titulo: `Desafios para ${termoAleatorio} no Brasil contemporâneo`,
        areaTema: areaTema,
        nivelProva: nivelProva || 'enem',
        descricao: `Redação ENEM - Proposta de intervenção sobre ${termoAleatorio}`,
        textosMotivadores: [],
        dataCriacao: new Date(),
        fonte: 'Sistema de Temas ENEM - Fontes Reais'
      };
      
      // Criar textos motivadores baseados nos resultados reais
      resultados.slice(0, 4).forEach((resultado, index) => {
        tema.textosMotivadores.push({
          titulo: `Texto ${String.fromCharCode(65 + index)}`,
          conteudo: resultado.description || `Informações sobre ${termoAleatorio} no contexto brasileiro.`,
          fonte: resultado.url,
          fonteTitulo: resultado.title
        });
      });
      
      console.log(`✅ Tema real gerado: "${tema.titulo}"`);
      return tema;
    }
    
  } catch (error) {
    console.error('Erro ao gerar tema real:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
  
  return null;
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

          // Gerar queries variadas para maior diversidade de resultados
          const timestamp = Date.now();
          const randomSeed = Math.floor(Math.random() * 100);
          
          const queriesBase = [
            `${fonte} ${termo} site:gov.br`,
            `${fonte} ${termo} site:ibge.gov.br`,
            `${fonte} ${termo} site:mec.gov.br`,
            `${termo} ${fonte} brasil`,
            `${fonte} ${termo} 2024`,
            `${termo} ${fonte} dados estatísticos`,
            `${fonte} ${termo} relatório`,
            `${termo} ${fonte} política pública`
          ];
          
          // Selecionar 4 queries aleatórias baseadas no timestamp
          const queries = [];
          for (let i = 0; i < 4; i++) {
            const indice = (timestamp + i + randomSeed) % queriesBase.length;
            queries.push(queriesBase[indice]);
          }

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
    
    console.log(`🎯 Gerando tema ENEM REAL para área: ${areaTema || 'social'}`);
    
    // Gerar tema real usando API do Brave Search
    const temaSelecionado = await gerarTemaEnemReal(areaTema || 'social', nivelProva || 'enem');
    
    if (!temaSelecionado) {
      console.log('⚠️ Falha ao gerar tema real, usando fallback');
      
      // Fallback simples se a API falhar
      const temaFallback = {
        id: `tema_fallback_${Date.now()}`,
        titulo: `Desafios para ${areaTema || 'questões sociais'} no Brasil contemporâneo`,
        areaTema: areaTema || 'social',
        nivelProva: nivelProva || 'enem',
        descricao: `Redação ENEM - Proposta de intervenção sobre ${areaTema || 'questões sociais'}`,
        textosMotivadores: [
          {
            titulo: "Texto A",
            conteudo: "Este é um tema relevante para a sociedade brasileira contemporânea, que apresenta diversos desafios e oportunidades para discussão e reflexão.",
            fonte: "Sistema de Temas ENEM - Fallback"
          }
        ],
        dataCriacao: new Date(),
        fonte: 'Sistema de Temas ENEM - Fallback'
      };
      
      return res.json({
        success: true,
        tema: temaFallback
      });
    }
    
    console.log(`✅ Tema real gerado com sucesso: "${temaSelecionado.titulo}"`);
    console.log(`📊 Textos motivadores: ${temaSelecionado.textosMotivadores.length}`);
    
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
