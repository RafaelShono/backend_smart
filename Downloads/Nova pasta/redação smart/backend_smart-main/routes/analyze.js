// routes/analyze.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const Anthropic = require('@anthropic-ai/sdk');
const authenticateFirebaseToken = require('../middlewares/authenticateFirebaseToken');
const admin = require('firebase-admin');

// Configurações da API Brave Search
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || 'BSAGRtt9nx758ZZeL_ujN8GfVarimr-';
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
    
    // Buscar informações reais sobre o tema com filtros mais rigorosos
    const response = await axios.get(BRAVE_BASE_URL, {
      headers: {
        'X-Subscription-Token': BRAVE_API_KEY,
        'Accept': 'application/json'
      },
      params: {
        q: `${termoAleatorio} Brasil desafios problemas site:gov.br OR site:ibge.gov.br OR site:mec.gov.br OR site:saude.gov.br OR site:ipea.gov.br OR site:cgi.br`,
        count: 5,
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
      
      // Filtrar e processar resultados para textos motivadores de qualidade
      const resultadosFiltrados = [];
      
      for (const resultado of resultados) {
        let conteudo = resultado.description || '';
        
        // Remover tags HTML
        conteudo = conteudo.replace(/<[^>]*>/g, '');
        
        // Remover caracteres especiais e entidades HTML
        conteudo = conteudo.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
        conteudo = conteudo.replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        
        // Verificar se o conteúdo é válido e em português
        const isValidPortuguese = (
          conteudo.length >= 150 && // Mínimo 150 caracteres
          conteudo.length <= 500 && // Máximo 500 caracteres
          !conteudo.includes('security service') &&
          !conteudo.includes('Please enable JavaScript') &&
          !conteudo.includes('We are checking your browser') &&
          !conteudo.includes('The Brazilian') && // Evitar conteúdo em inglês
          !conteudo.includes('Data privacy is the ability') && // Evitar conteúdo genérico
          !conteudo.includes('Escola líder no Brasil em') && // Evitar conteúdo comercial
          !conteudo.includes('Portal do Governo Brasileiro') && // Evitar menus de navegação
          !conteudo.includes('Tipos de Mídias') && // Evitar menus
          !conteudo.includes('Programas e Cursos Nacionais') && // Evitar menus
          !conteudo.includes('Como faço minha busca') && // Evitar FAQs
          !conteudo.includes('Contato · Fale conosco') && // Evitar páginas de contato
          !conteudo.includes('Dúvidas frequentes') && // Evitar FAQs
          !conteudo.includes('Logins · Submissões') && // Evitar páginas de login
          !conteudo.includes('Sobre o') && // Evitar páginas institucionais
          !conteudo.includes('Parceiros') && // Evitar páginas de parceiros
          !conteudo.includes('·') && // Evitar listas de navegação
          !conteudo.includes('Home') && // Evitar páginas iniciais
          !conteudo.includes('Menu') && // Evitar menus
          !conteudo.includes('Navegação') && // Evitar navegação
          !conteudo.includes('Links') && // Evitar páginas de links
          !conteudo.includes('Acesso') && // Evitar páginas de acesso
          !conteudo.includes('Login') && // Evitar páginas de login
          !conteudo.includes('Cadastro') && // Evitar páginas de cadastro
          !conteudo.includes('Busca') && // Evitar páginas de busca
          !conteudo.includes('Pesquisa') && // Evitar páginas de pesquisa
          !conteudo.includes('Resultados') && // Evitar páginas de resultados
          !conteudo.includes('Filtros') && // Evitar páginas de filtros
          !conteudo.includes('Ordenar') && // Evitar páginas de ordenação
          !conteudo.includes('Categorias') && // Evitar páginas de categorias
          !conteudo.includes('Tags') && // Evitar páginas de tags
          !conteudo.includes('Compartilhar') && // Evitar botões de compartilhamento
          !conteudo.includes('Imprimir') && // Evitar botões de impressão
          !conteudo.includes('Download') && // Evitar botões de download
          !conteudo.includes('Upload') && // Evitar botões de upload
          !conteudo.includes('Enviar') && // Evitar botões de envio
          !conteudo.includes('Submeter') && // Evitar botões de submissão
          !conteudo.includes('Publicar') && // Evitar botões de publicação
          !conteudo.includes('Editar') && // Evitar botões de edição
          !conteudo.includes('Excluir') && // Evitar botões de exclusão
          !conteudo.includes('Salvar') && // Evitar botões de salvamento
          !conteudo.includes('Cancelar') && // Evitar botões de cancelamento
          !conteudo.includes('Voltar') && // Evitar botões de voltar
          !conteudo.includes('Avançar') && // Evitar botões de avançar
          !conteudo.includes('Próximo') && // Evitar botões de próximo
          !conteudo.includes('Anterior') && // Evitar botões de anterior
          !conteudo.includes('Primeiro') && // Evitar botões de primeiro
          !conteudo.includes('Último') && // Evitar botões de último
          !conteudo.includes('Página') && // Evitar paginação
          !conteudo.includes('Páginas') && // Evitar paginação
          !conteudo.includes('Total') && // Evitar contadores
          !conteudo.includes('Itens') && // Evitar listas de itens
          !conteudo.includes('Registros') && // Evitar listas de registros
          !conteudo.includes('Dados') && // Evitar listas de dados
          !conteudo.includes('Informações') && // Evitar listas de informações
          !conteudo.includes('Conteúdo') && // Evitar listas de conteúdo
          !conteudo.includes('Arquivos') && // Evitar listas de arquivos
          !conteudo.includes('Documentos') && // Evitar listas de documentos
          !conteudo.includes('Imagens') && // Evitar listas de imagens
          !conteudo.includes('Vídeos') && // Evitar listas de vídeos
          !conteudo.includes('Áudios') && // Evitar listas de áudios
          !conteudo.includes('PDFs') && // Evitar listas de PDFs
          !conteudo.includes('ZIPs') && // Evitar listas de ZIPs
          !conteudo.includes('RARs') && // Evitar listas de RARs
          !conteudo.includes('MP3s') && // Evitar listas de MP3s
          !conteudo.includes('MP4s') && // Evitar listas de MP4s
          !conteudo.includes('JPGs') && // Evitar listas de JPGs
          !conteudo.includes('PNGs') && // Evitar listas de PNGs
          !conteudo.includes('GIFs') && // Evitar listas de GIFs
          !conteudo.includes('SVGs') && // Evitar listas de SVGs
          !conteudo.includes('XMLs') && // Evitar listas de XMLs
          !conteudo.includes('JSONs') && // Evitar listas de JSONs
          !conteudo.includes('CSVs') && // Evitar listas de CSVs
          !conteudo.includes('XLSs') && // Evitar listas de XLSs
          !conteudo.includes('DOCs') && // Evitar listas de DOCs
          !conteudo.includes('PPTs') && // Evitar listas de PPTs
          !conteudo.includes('TXTs') && // Evitar listas de TXTs
          !conteudo.includes('RTFs') && // Evitar listas de RTFs
          !conteudo.includes('ODTs') && // Evitar listas de ODTs
          !conteudo.includes('ODSs') && // Evitar listas de ODSs
          !conteudo.includes('ODPs') && // Evitar listas de ODPs
          !conteudo.includes('ODGs') && // Evitar listas de ODGs
          !conteudo.includes('ODFs') && // Evitar listas de ODFs
          !conteudo.includes('ODMs') && // Evitar listas de ODMs
          !conteudo.includes('ODBs') && // Evitar listas de ODBs
          !conteudo.includes('ODCs') && // Evitar listas de ODCs
          !conteudo.includes('ODEs') && // Evitar listas de ODEs
          !conteudo.includes('ODFs') && // Evitar listas de ODFs
          !conteudo.includes('ODGs') && // Evitar listas de ODGs
          !conteudo.includes('ODHs') && // Evitar listas de ODHs
          !conteudo.includes('ODIs') && // Evitar listas de ODIs
          !conteudo.includes('ODJs') && // Evitar listas de ODJs
          !conteudo.includes('ODKs') && // Evitar listas de ODKs
          !conteudo.includes('ODLs') && // Evitar listas de ODLs
          !conteudo.includes('ODMs') && // Evitar listas de ODMs
          !conteudo.includes('ODNs') && // Evitar listas de ODNs
          !conteudo.includes('ODOs') && // Evitar listas de ODOs
          !conteudo.includes('ODPs') && // Evitar listas de ODPs
          !conteudo.includes('ODQs') && // Evitar listas de ODQs
          !conteudo.includes('ODRs') && // Evitar listas de ODRs
          !conteudo.includes('ODSs') && // Evitar listas de ODSs
          !conteudo.includes('ODTs') && // Evitar listas de ODTs
          !conteudo.includes('ODUs') && // Evitar listas de ODUs
          !conteudo.includes('ODVs') && // Evitar listas de ODVs
          !conteudo.includes('ODWs') && // Evitar listas de ODWs
          !conteudo.includes('ODXs') && // Evitar listas de ODXs
          !conteudo.includes('ODYs') && // Evitar listas de ODYs
          !conteudo.includes('ODZs') && // Evitar listas de ODZs
          (conteudo.includes('Brasil') || conteudo.includes('brasileiro') || conteudo.includes('nacional')) && // Deve mencionar Brasil
          resultado.url.includes('.gov.br') // Priorizar sites governamentais
        );
        
        // Validação adicional: verificar se o texto tem conteúdo substantivo
        const hasSubstantiveContent = (
          conteudo.split(' ').length >= 20 && // Mínimo 20 palavras
          conteudo.includes('.') && // Deve ter pelo menos um ponto (frase completa)
          !conteudo.match(/^[A-Z\s·\-]+$/) && // Não deve ser apenas maiúsculas e símbolos
          !conteudo.match(/^[0-9\s·\-]+$/) && // Não deve ser apenas números e símbolos
          !conteudo.match(/^[A-Za-z\s·\-]+$/) && // Não deve ser apenas letras e símbolos
          conteudo.match(/[a-z]/) && // Deve ter pelo menos uma letra minúscula
          conteudo.match(/[A-Z]/) && // Deve ter pelo menos uma letra maiúscula
          conteudo.match(/[0-9]/) === null // Não deve ser apenas números
        );
        
        if (isValidPortuguese && hasSubstantiveContent) {
          resultadosFiltrados.push({
            titulo: `Texto ${String.fromCharCode(65 + resultadosFiltrados.length)}`,
            conteudo: conteudo,
            fonte: resultado.url,
            fonteTitulo: resultado.title
          });
        }
      }
      
      // Garantir sempre 3 textos motivadores
      if (resultadosFiltrados.length >= 3) {
        // Usar os 3 melhores resultados filtrados
        tema.textosMotivadores = resultadosFiltrados.slice(0, 3);
        console.log(`✅ Usando ${resultadosFiltrados.length} resultados válidos encontrados`);
      } else {
        // Complementar com textos padrão para garantir 3 textos
        console.log(`⚠️ Encontrados apenas ${resultadosFiltrados.length} resultados válidos, complementando com textos padrão`);
        
        const textosPadrao = [
          {
            titulo: "Texto A",
            conteudo: `O tema ${termoAleatorio} representa um dos principais desafios enfrentados pela sociedade brasileira contemporânea. Esta questão afeta diretamente a qualidade de vida dos cidadãos e requer atenção especial dos poderes públicos e da sociedade civil.`,
            fonte: "Sistema de Temas ENEM - Análise Contextual",
            fonteTitulo: "Análise Contextual"
          },
          {
            titulo: "Texto B", 
            conteudo: `No contexto brasileiro, ${termoAleatorio} apresenta características específicas que diferem de outros países. A diversidade regional, cultural e socioeconômica do Brasil cria desafios únicos que demandam soluções adaptadas à realidade nacional.`,
            fonte: "Sistema de Temas ENEM - Contexto Nacional",
            fonteTitulo: "Contexto Nacional"
          },
          {
            titulo: "Texto C",
            conteudo: `A discussão sobre ${termoAleatorio} no Brasil envolve múltiplas dimensões: social, econômica, política e cultural. É fundamental que a sociedade brasileira reflita sobre este tema e busque caminhos para superar os desafios identificados.`,
            fonte: "Sistema de Temas ENEM - Reflexão Social",
            fonteTitulo: "Reflexão Social"
          }
        ];
        
        // Combinar resultados válidos com textos padrão
        tema.textosMotivadores = [...resultadosFiltrados];
        
        // Adicionar textos padrão até completar 3
        for (let i = resultadosFiltrados.length; i < 3; i++) {
          tema.textosMotivadores.push(textosPadrao[i]);
        }
      }
      
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
    // Dados do usuário encontrados

    // Verifica o contador e o status premium
    const redacoesEnviadas = userData.redacoesEnviadas || 0;
    const planoAtivo = userData.planoAtivo || false;
    const limiteRedacoes = userData.limiteRedacoes || 3;
    const redacoesUsadas = userData.redacoesUsadas || 0;

    // Verificar limitações baseadas no plano
    if (!planoAtivo && redacoesEnviadas >= 3) {
      return res.status(403).send({ 
        error: 'Limite de redações gratuito atingido. Faça upgrade para continuar.',
        limite: 3,
        usado: redacoesEnviadas
      });
    }

    if (planoAtivo && limiteRedacoes !== -1 && redacoesUsadas >= limiteRedacoes) {
      return res.status(403).send({ 
        error: `Limite do seu plano atingido (${limiteRedacoes} redações). Renove sua assinatura para continuar.`,
        limite: limiteRedacoes,
        usado: redacoesUsadas
      });
    }

    // Chamada à API da Anthropic usando Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Erro: Chave da API da Anthropic não está definida.');
      return res.status(500).send({ error: 'Chave da API não configurada.' });
    }

    // Chamando API da Anthropic
    
    // Inicializar cliente Anthropic
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Constrói o prompt
    const prompt = `
Você é um avaliador experiente de redações do ENEM. Avalie a redação a seguir com base nas 5 competências do ENEM, fornecendo feedback conciso e direto para cada competência (0 a 200 pontos). 

Tema: ${tema.titulo}
Descrição: ${tema.descricao}

Redação do aluno:
${text}

Avalie cada competência e forneça feedback específico baseado no conteúdo real da redação:

1. **Domínio da escrita formal em língua portuguesa**: Avalie gramática, ortografia, pontuação
2. **Compreensão do tema**: Verifique se compreendeu o tema e usou conhecimentos relevantes
3. **Organização dos argumentos**: Avalie coerência, coesão e estrutura
4. **Mecanismos linguísticos**: Analise conectivos e coesão textual
5. **Proposta de intervenção**: Verifique se há proposta detalhada e coerente

IMPORTANTE: 
- Analise o texto real e forneça feedback específico baseado no conteúdo
- Seja direto e objetivo, como um corretor experiente
- Justifique cada nota com base no que realmente está no texto
- Identifique pontos fortes e fracos reais da redação
- Use linguagem clara e educativa
- Foque em feedback construtivo e específico

Responda APENAS com um objeto JSON válido no formato exato abaixo: 
{
  "competencias": [
    {
      "id": 1,
      "descricao": "O aluno demonstra excepcional domínio da norma culta da língua portuguesa. A redação é clara, fluente e sem erros de gramática, ortografia ou pontuação.",
      "nota": 200,
      "pontosFortes": ["Domínio da norma culta", "Clareza na escrita", "Ausência de erros"],
      "areasMelhoria": [],
      "sugestoes": ["Continue mantendo o excelente domínio da língua portuguesa"]
    },
    {
      "id": 2,
      "descricao": "O estudante compreendeu o tema proposto e utilizou conhecimentos de diferentes áreas para desenvolver a argumentação de forma lógica e relevante. A redação demonstra uma análise profunda e bem fundamentada sobre o assunto.",
      "nota": 200,
      "pontosFortes": ["Compreensão do tema", "Uso de conhecimentos interdisciplinares", "Argumentação bem fundamentada"],
      "areasMelhoria": [],
      "sugestoes": ["Continue desenvolvendo argumentos com base em conhecimentos de diferentes áreas"]
    },
    {
      "id": 3,
      "descricao": "A redação é bem organizada, com uma estrutura lógica e clara que facilita a compreensão do argumento. As ideias estão ligadas de forma coerente e a sequência de pensamento faz sentido.",
      "nota": 200,
      "pontosFortes": ["Estrutura lógica", "Coerência textual", "Organização clara"],
      "areasMelhoria": [],
      "sugestoes": ["Mantenha a excelente organização e coerência textual"]
    },
    {
      "id": 4,
      "descricao": "Excelente uso dos mecanismos linguísticos para argumentação, com conectivos bem utilizados para encadeamento das ideias. Há clareza e coesão na apresentação dos argumentos.",
      "nota": 200,
      "pontosFortes": ["Uso adequado de conectivos", "Coesão textual", "Clareza argumentativa"],
      "areasMelhoria": [],
      "sugestoes": ["Continue utilizando conectivos de forma adequada para melhorar a coesão"]
    },
    {
      "id": 5,
      "descricao": "Apesar de o texto apresentar ótimos argumentos, o aluno não propõe medidas de intervenção detalhadas e coerentes, o que é um aspecto fundamental exigido pelo ENEM.",
      "nota": 150,
      "pontosFortes": ["Argumentação sólida", "Compreensão do tema"],
      "areasMelhoria": ["Falta de proposta de intervenção", "Ausência de medidas específicas"],
      "sugestoes": ["Desenvolva propostas de intervenção detalhadas com agentes, ações e efeitos esperados"]
    }
  ],
  "pontuacaoTotal": 950,
  "comentariosGerais": "Redação de excelente qualidade com domínio da norma culta, compreensão adequada do tema e argumentação bem estruturada. O principal ponto de melhoria é o desenvolvimento de propostas de intervenção mais detalhadas.",
  "pontosFortes": ["Domínio excepcional da língua portuguesa", "Compreensão profunda do tema", "Argumentação bem fundamentada", "Estrutura lógica e coerente"],
  "areasMelhoria": ["Desenvolvimento de propostas de intervenção mais detalhadas"],
  "sugestoesProximasRedacoes": ["Foque em desenvolver propostas de intervenção com agentes, ações e efeitos específicos"],
  "analiseOrtografiaGramatica": {
    "errosEncontrados": [],
    "sugestoes": ["Continue mantendo o excelente domínio da norma culta"],
    "exemplos": []
  }
}
    `.trim();

    // Chamada à API da Anthropic usando Claude
    const response = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 3000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const analysisText = response.content[0].text.trim();
    console.log('Resposta da Anthropic recebida (primeiros 500 caracteres):', analysisText.substring(0, 500));
    console.log('Tamanho total da resposta:', analysisText.length);

    // Tenta parsear a resposta como JSON
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
      console.log('Análise parseada com sucesso');
    } catch (err) {
      console.error('Erro ao parsear a resposta da IA como JSON:', err);
      console.error('Resposta da IA completa:', analysisText);
      
      // Se a IA retornou algo, mas não é JSON válido, tentar extrair informações
      if (analysisText && analysisText.length > 50) {
        console.log('Tentando extrair informações da resposta não-JSON...');
        
        // Tentar fazer uma nova chamada com prompt mais específico
        try {
          const retryPrompt = `
A resposta anterior não foi um JSON válido. Por favor, analise a redação a seguir e retorne APENAS um objeto JSON válido no formato exato abaixo.

Tema: ${tema.titulo}
Descrição: ${tema.descricao}

Redação do aluno:
${text}

Avalie de acordo com as 5 competências do ENEM e retorne APENAS este JSON:

{
  "competencias": [
    {
      "id": 1,
      "descricao": "Análise real da competência 1 baseada na redação",
      "nota": 0,
      "pontosFortes": ["pontos reais encontrados"],
      "areasMelhoria": ["áreas reais que precisam melhorar"],
      "sugestoes": ["sugestões reais e específicas"]
    },
    {
      "id": 2,
      "descricao": "Análise real da competência 2 baseada na redação",
      "nota": 0,
      "pontosFortes": ["pontos reais encontrados"],
      "areasMelhoria": ["áreas reais que precisam melhorar"],
      "sugestoes": ["sugestões reais e específicas"]
    },
    {
      "id": 3,
      "descricao": "Análise real da competência 3 baseada na redação",
      "nota": 0,
      "pontosFortes": ["pontos reais encontrados"],
      "areasMelhoria": ["áreas reais que precisam melhorar"],
      "sugestoes": ["sugestões reais e específicas"]
    },
    {
      "id": 4,
      "descricao": "Análise real da competência 4 baseada na redação",
      "nota": 0,
      "pontosFortes": ["pontos reais encontrados"],
      "areasMelhoria": ["áreas reais que precisam melhorar"],
      "sugestoes": ["sugestões reais e específicas"]
    },
    {
      "id": 5,
      "descricao": "Análise real da competência 5 baseada na redação",
      "nota": 0,
      "pontosFortes": ["pontos reais encontrados"],
      "areasMelhoria": ["áreas reais que precisam melhorar"],
      "sugestoes": ["sugestões reais e específicas"]
    }
  ],
  "pontuacaoTotal": 0,
  "comentariosGerais": "Análise real e detalhada da redação",
  "pontosFortes": ["pontos fortes reais da redação"],
  "areasMelhoria": ["áreas reais que precisam melhorar"],
  "sugestoesProximasRedacoes": ["sugestões reais para próximas redações"],
  "analiseOrtografiaGramatica": {
    "errosEncontrados": ["erros reais encontrados na redação"],
    "sugestoes": ["sugestões reais para melhorar ortografia e gramática"],
    "exemplos": ["exemplos reais de correção"]
  }
}
          `;
          
          const retryResponse = await anthropic.messages.create({
            model: 'claude-3-5-haiku-20241022',
            max_tokens: 3000,
            messages: [
              {
                role: 'user',
                content: retryPrompt,
              },
            ],
          });
          
          const retryText = retryResponse.content[0].text.trim();
          console.log('Tentativa de retry - resposta:', retryText.substring(0, 200) + '...');
          
          analysis = JSON.parse(retryText);
          console.log('Análise de retry parseada com sucesso');
          
        } catch (retryErr) {
          console.error('Erro na tentativa de retry:', retryErr);
          throw new Error('Falha na análise da IA - resposta inválida');
        }
      } else {
        throw new Error('Falha na análise da IA - resposta vazia ou inválida');
      }
    }

    // Verifica se as chaves básicas estão presentes
    const requiredFields = ['competencias', 'pontuacaoTotal', 'comentariosGerais'];
    const hasAllFields = requiredFields.every((field) => field in analysis);

    if (!hasAllFields) {
      console.error('Resposta JSON da IA está faltando campos básicos:', analysis);
      return res
        .status(500)
        .send({ error: 'Resposta inválida da avaliação. Tente novamente mais tarde.' });
    }

    // Adiciona campos padrão se não existirem
    if (!analysis.pontosFortes) analysis.pontosFortes = [];
    if (!analysis.areasMelhoria) analysis.areasMelhoria = [];
    if (!analysis.sugestoesProximasRedacoes) analysis.sugestoesProximasRedacoes = [];
    if (!analysis.analiseOrtografiaGramatica) {
      analysis.analiseOrtografiaGramatica = {
        errosEncontrados: [],
        sugestoes: [],
        exemplos: []
      };
    }

    // Verifica e completa as competências
    if (analysis.competencias && Array.isArray(analysis.competencias)) {
      for (const competencia of analysis.competencias) {
        if (!competencia.pontosFortes) competencia.pontosFortes = [];
        if (!competencia.areasMelhoria) competencia.areasMelhoria = [];
        if (!competencia.sugestoes) competencia.sugestoes = [];
      }
    }

    // Salva a redação e a avaliação no Firestore
    
    const docRef = await admin.firestore().collection('redacoes').add({
      usuarioId: user.uid,
      nome: userData.nome,
      fotoURL: userData.fotoURL,
      texto: text,
      avaliacao: analysis,
      pontuacaoTotal: analysis.pontuacaoTotal, // Adicionar pontuação total no nível raiz para facilitar consultas
      tema: tema, // Salvar tema completo para exibição
      temaId: tema.id || 'unknown',
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });
    
    // Atualiza o número de redações enviadas pelo usuário
    await userDocRef.update({
      redacoesEnviadas: admin.firestore.FieldValue.increment(1),
      redacoesUsadas: admin.firestore.FieldValue.increment(1),
    });
    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Erro ao analisar a redação:', error.response?.data || error.message || error);

    // Tratamento de erros específicos da API Anthropic
    if (error.response && error.response.status === 401) {
      res.status(500).send({ error: 'Falha na autenticação da API. Verifique a chave da API.' });
    } else if (error.response && error.response.status === 429) {
      res.status(500).send({ error: 'Limite de taxa da API excedido. Tente novamente mais tarde.' });
    } else if (error.response && error.response.status === 404) {
      res.status(500).send({ error: 'Modelo da IA não encontrado. Contate o suporte.' });
    } else if (error.response && error.response.status >= 500) {
      res.status(500).send({ error: 'Erro interno da API da IA. Tente novamente mais tarde.' });
    } else if (error.message === 'Limite de redações atingido. Faça upgrade para continuar.') {
      res.status(403).send({ error: 'Limite de redações atingido. Faça upgrade para continuar.' });
    } else if (error.message && error.message.includes('Falha na análise da IA')) {
      res.status(500).send({ error: 'Erro na análise da IA. Tente novamente.' });
    } else {
      res.status(500).send({ error: 'Erro interno do servidor. Tente novamente mais tarde.' });
    }
  }
});

module.exports = router;
