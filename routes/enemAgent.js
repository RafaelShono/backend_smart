const express = require('express');
const router = express.Router();
const axios = require('axios');
const admin = require('../config/firebaseAdmin');
const authenticateFirebaseToken = require('../middlewares/authenticateFirebaseToken');

// Configurações da API Brave Search
const BRAVE_API_KEY = process.env.BRAVE_API_KEY || 'BSANe0vJ56EwwgLZ4zE3nf2S2BLOYCd';
const BRAVE_BASE_URL = 'https://api.search.brave.com/res/v1/web/search';

// Cache simples em memória
const cache = new Map();
const CACHE_TTL = 3600000; // 1 hora

/**
 * Classe para busca de notícias ENEM
 */
class EnemNewsSearcher {
  constructor() {
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Busca notícias relacionadas a temas ENEM
   */
  async searchEnemTopics(keywords, limit = 5) {
    try {
      const cacheKey = `enem_${keywords.join('_')}_${limit}`;
      const cached = cache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        console.log('📦 Retornando resultados do cache');
        return cached.data;
      }

      await this.rateLimit();

      const searchQueries = this.buildSearchQueries(keywords);
      const allResults = [];

      for (const query of searchQueries) {
        try {
          const results = await this.searchBraveAPI(query, Math.ceil(limit / searchQueries.length));
          allResults.push(...results);
        } catch (error) {
          console.warn(`⚠️ Erro na busca para query "${query}":`, error.message);
        }
      }

      const filteredResults = this.filterByEnemRelevance(allResults);
      const finalResults = filteredResults.slice(0, limit);

      // Salvar no cache
      cache.set(cacheKey, {
        data: finalResults,
        timestamp: Date.now()
      });

      console.log(`✅ Encontradas ${finalResults.length} notícias relevantes para ENEM`);
      return finalResults;

    } catch (error) {
      console.error('❌ Erro na busca de notícias:', error);
      throw new Error(`Falha na busca de notícias: ${error.message}`);
    }
  }

  /**
   * Constrói queries de busca otimizadas
   */
  buildSearchQueries(keywords) {
    const enemContexts = [
      'Brasil',
      'sociedade brasileira',
      'políticas públicas',
      'educação',
      'sustentabilidade'
    ];

    const queries = [];
    queries.push(keywords.join(' '));
    
    keywords.forEach(keyword => {
      enemContexts.slice(0, 2).forEach(context => {
        queries.push(`${keyword} ${context}`);
      });
    });

    return queries.slice(0, 3);
  }

  /**
   * Executa busca na Brave Search API
   */
  async searchBraveAPI(query, count = 10) {
    const params = {
      q: query,
      count: count,
      country: 'BR',
      search_lang: 'pt',
      ui_lang: 'pt',
      freshness: 'm',
      text_decorations: false,
      text_format: 'Raw'
    };

    const response = await axios.get(BRAVE_BASE_URL, {
      headers: {
        'Accept': 'application/json',
        'Accept-Encoding': 'gzip',
        'X-Subscription-Token': BRAVE_API_KEY
      },
      params
    });

    if (!response.data.web?.results) {
      return [];
    }

    return response.data.web.results.map(result => ({
      title: result.title,
      url: result.url,
      snippet: result.description,
      publishedDate: result.age || new Date().toISOString(),
      source: new URL(result.url).hostname
    }));
  }

  /**
   * Filtra notícias por relevância ENEM
   */
  filterByEnemRelevance(results) {
    return results
      .filter(news => {
        if (!this.isTrustedSource(news.url)) return false;
        if (!this.isWithinLastSixMonths(news.publishedDate)) return false;
        
        const relevance = this.calculateEnemRelevance(news.snippet, news.title);
        return relevance >= 3;
      })
      .map(news => {
        const relevance = this.calculateEnemRelevance(news.snippet, news.title);
        const keywords = this.extractKeywords(`${news.title} ${news.snippet}`);
        
        return {
          ...news,
          enemRelevance: Math.round(relevance * 10) / 10,
          keywords: keywords.slice(0, 5),
          filtered: true
        };
      })
      .sort((a, b) => b.enemRelevance - a.enemRelevance);
  }

  /**
   * Calcula relevância ENEM
   */
  calculateEnemRelevance(text, title) {
    const enemKeywords = [
      'sustentabilidade', 'meio ambiente', 'tecnologia', 'educação',
      'direitos humanos', 'desigualdade', 'saúde', 'política', 'economia',
      'sociedade', 'cidadania', 'democracia', 'inovação', 'cultura'
    ];

    const fullText = `${title} ${text}`.toLowerCase();
    let score = 0;
    
    enemKeywords.forEach(keyword => {
      const regex = new RegExp(keyword, 'gi');
      const matches = fullText.match(regex);
      if (matches) {
        score += matches.length * 0.5;
      }
    });
    
    return Math.min(score, 10);
  }

  /**
   * Extrai palavras-chave
   */
  extractKeywords(text) {
    const commonWords = [
      'o', 'a', 'os', 'as', 'um', 'uma', 'de', 'da', 'do', 'das', 'dos',
      'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sobre',
      'que', 'quem', 'onde', 'quando', 'como', 'porque', 'se', 'mas', 'e', 'ou'
    ];
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && !commonWords.includes(word));
    
    const wordCount = {};
    words.forEach(word => {
      wordCount[word] = (wordCount[word] || 0) + 1;
    });
    
    return Object.entries(wordCount)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  /**
   * Verifica se é fonte confiável
   */
  isTrustedSource(url) {
    const trustedDomains = [
      'g1.globo.com', 'uol.com.br', 'folha.uol.com.br', 'estadao.com.br',
      'oglobo.globo.com', 'veja.abril.com.br', 'exame.com', 'bbc.com',
      'ibge.gov.br', 'mec.gov.br', 'saude.gov.br'
    ];
    
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return trustedDomains.some(trusted => domain.includes(trusted));
    } catch {
      return false;
    }
  }

  /**
   * Verifica se está dentro dos últimos 6 meses
   */
  isWithinLastSixMonths(dateString) {
    const newsDate = new Date(dateString);
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    return newsDate >= sixMonthsAgo;
  }

  /**
   * Rate limiting
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < 1000) {
      const delay = 1000 - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }
}

/**
 * Classe para análise de temas ENEM
 */
class EnemThemeAnalyzer {
  /**
   * Analisa potencial ENEM de uma notícia
   */
  analyzeEnemPotential(news) {
    return {
      title: news.title,
      summary: news.snippet,
      sourceUrl: news.url,
      publishedDate: this.formatDate(news.publishedDate),
      enemRelevance: news.enemRelevance,
      keywords: news.keywords,
      
      thematicAxis: this.identifyThematicAxis(news),
      complexity: this.assessComplexity(news),
      argumentativePotential: this.assessArgumentativePotential(news),
      socialRelevance: this.assessSocialRelevance(news),
      
      suggestedApproaches: this.generateApproachSuggestions(news),
      interventionProposals: this.generateInterventionProposals(news),
      
      enemCompatibility: this.checkEnemCompatibility(news),
      difficultyLevel: this.assessDifficultyLevel(news),
      
      analysisDate: new Date().toISOString(),
      confidence: this.calculateConfidence(news)
    };
  }

  identifyThematicAxis(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    
    const axisKeywords = {
      'Cidadania e direitos humanos': ['direitos', 'cidadania', 'igualdade', 'justiça'],
      'Meio ambiente e sustentabilidade': ['meio ambiente', 'sustentabilidade', 'natureza', 'clima'],
      'Tecnologia e sociedade': ['tecnologia', 'digital', 'internet', 'inovação'],
      'Educação e cultura': ['educação', 'escola', 'cultura', 'conhecimento'],
      'Saúde e bem-estar social': ['saúde', 'bem-estar', 'hospital', 'médico'],
      'Política e democracia': ['política', 'governo', 'eleição', 'poder'],
      'Economia e desenvolvimento': ['economia', 'desenvolvimento', 'trabalho', 'empresa']
    };

    let bestMatch = 'Tecnologia e sociedade';
    let maxScore = 0;

    Object.entries(axisKeywords).forEach(([axis, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        if (text.includes(keyword)) score++;
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = axis;
      }
    });

    return bestMatch;
  }

  assessComplexity(news) {
    const text = `${news.title} ${news.snippet}`;
    const wordCount = text.split(' ').length;
    
    if (wordCount > 200) return 'Alta';
    if (wordCount > 100) return 'Média';
    return 'Baixa';
  }

  assessArgumentativePotential(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    const debateWords = ['debate', 'discussão', 'controvérsia', 'opinião', 'argumento'];
    
    let score = 0;
    debateWords.forEach(word => {
      if (text.includes(word)) score++;
    });
    
    return Math.min(score * 2, 10);
  }

  assessSocialRelevance(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    const socialWords = ['sociedade', 'comunidade', 'população', 'brasileiros', 'impacto social'];
    
    let score = 0;
    socialWords.forEach(word => {
      if (text.includes(word)) score++;
    });
    
    return Math.min(score * 2, 10);
  }

  generateApproachSuggestions(news) {
    const suggestions = [];
    const keywords = news.keywords;
    
    if (keywords.includes('tecnologia')) {
      suggestions.push('Impactos da tecnologia na sociedade brasileira');
      suggestions.push('Desafios de acesso à tecnologia');
    }
    
    if (keywords.includes('educação')) {
      suggestions.push('Desafios da educação pública no Brasil');
      suggestions.push('Importância da educação para o desenvolvimento');
    }
    
    if (keywords.includes('meio') || keywords.includes('ambiente')) {
      suggestions.push('Sustentabilidade e desenvolvimento econômico');
      suggestions.push('Preservação ambiental e responsabilidade social');
    }
    
    if (suggestions.length === 0) {
      suggestions.push('Análise dos impactos sociais do tema');
      suggestions.push('Papel do Estado na resolução do problema');
    }
    
    return suggestions.slice(0, 3);
  }

  generateInterventionProposals(news) {
    const proposals = [];
    const keywords = news.keywords;
    
    if (keywords.includes('educação')) {
      proposals.push('Investimento em políticas públicas educacionais');
      proposals.push('Formação continuada de professores');
    }
    
    if (keywords.includes('tecnologia')) {
      proposals.push('Inclusão digital através de políticas públicas');
      proposals.push('Investimento em infraestrutura tecnológica');
    }
    
    if (proposals.length === 0) {
      proposals.push('Desenvolvimento de políticas públicas específicas');
      proposals.push('Educação e conscientização da população');
    }
    
    return proposals.slice(0, 3);
  }

  checkEnemCompatibility(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    
    return {
      hasSocialRelevance: this.assessSocialRelevance(news) >= 5,
      hasArgumentativePotential: this.assessArgumentativePotential(news) >= 4,
      isCurrent: this.isRecent(news.publishedDate),
      hasMultiplePerspectives: this.hasMultiplePerspectives(text),
      allowsIntervention: this.allowsIntervention(text),
      overallCompatibility: this.calculateOverallCompatibility(news)
    };
  }

  assessDifficultyLevel(news) {
    const complexity = this.assessComplexity(news);
    const argumentativePotential = this.assessArgumentativePotential(news);
    
    if (complexity === 'Alta' && argumentativePotential >= 7) return 'Avançado';
    if (complexity === 'Média' && argumentativePotential >= 5) return 'Intermediário';
    return 'Básico';
  }

  calculateConfidence(news) {
    let confidence = 50;
    confidence += news.enemRelevance * 3;
    
    if (this.isTrustedSource(news.url)) confidence += 10;
    if (this.isRecent(news.publishedDate)) confidence += 10;
    
    return Math.min(Math.round(confidence), 100);
  }

  // Métodos auxiliares
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  isRecent(dateString) {
    const newsDate = new Date(dateString);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return newsDate >= threeMonthsAgo;
  }

  hasMultiplePerspectives(text) {
    const perspectiveWords = ['por um lado', 'por outro lado', 'entretanto', 'contudo', 'porém'];
    return perspectiveWords.some(word => text.includes(word));
  }

  allowsIntervention(text) {
    const interventionWords = ['solução', 'medida', 'política', 'ação', 'governo', 'estado'];
    return interventionWords.some(word => text.includes(word));
  }

  isTrustedSource(url) {
    const trustedDomains = [
      'g1.globo.com', 'uol.com.br', 'folha.uol.com.br', 'estadao.com.br',
      'oglobo.globo.com', 'veja.abril.com.br', 'exame.com', 'bbc.com'
    ];
    
    try {
      const domain = new URL(url).hostname.toLowerCase();
      return trustedDomains.some(trusted => domain.includes(trusted));
    } catch {
      return false;
    }
  }

  calculateOverallCompatibility(news) {
    const compatibility = this.checkEnemCompatibility(news);
    let score = 0;
    
    if (compatibility.hasSocialRelevance) score += 25;
    if (compatibility.hasArgumentativePotential) score += 25;
    if (compatibility.isCurrent) score += 20;
    if (compatibility.hasMultiplePerspectives) score += 15;
    if (compatibility.allowsIntervention) score += 15;
    
    return score;
  }
}

// Instâncias das classes
const newsSearcher = new EnemNewsSearcher();
const themeAnalyzer = new EnemThemeAnalyzer();

/**
 * Rota para gerar temas ENEM baseados em notícias atuais
 */
router.post('/generate-enem-themes', authenticateFirebaseToken, async (req, res) => {
  try {
    const { keywords, limit = 5 } = req.body;

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Keywords são obrigatórias e devem ser um array não vazio'
      });
    }

    console.log(`🔍 Buscando temas ENEM para keywords: ${keywords.join(', ')}`);

    // Buscar notícias
    const newsResults = await newsSearcher.searchEnemTopics(keywords, limit);

    // Analisar cada notícia
    const analyzedThemes = newsResults.map(news => {
      return themeAnalyzer.analyzeEnemPotential(news);
    });

    // Salvar no Firestore
    const db = admin.firestore();
    const batch = db.batch();

    analyzedThemes.forEach((theme, index) => {
      const themeRef = db.collection('enemThemes').doc();
      batch.set(themeRef, {
        ...theme,
        userId: req.user.uid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        keywords: keywords,
        searchIndex: index
      });
    });

    await batch.commit();

    res.json({
      success: true,
      themes: analyzedThemes,
      total: analyzedThemes.length,
      message: 'Temas ENEM gerados com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao gerar temas ENEM:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Rota para buscar temas ENEM salvos
 */
router.get('/enem-themes', authenticateFirebaseToken, async (req, res) => {
  try {
    const db = admin.firestore();
    const themesRef = db.collection('enemThemes')
      .where('userId', '==', req.user.uid)
      .orderBy('createdAt', 'desc')
      .limit(20);

    const snapshot = await themesRef.get();
    const themes = [];

    snapshot.forEach(doc => {
      themes.push({
        id: doc.id,
        ...doc.data()
      });
    });

    res.json({
      success: true,
      themes: themes,
      total: themes.length
    });

  } catch (error) {
    console.error('❌ Erro ao buscar temas ENEM:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Rota para obter estatísticas do agente
 */
router.get('/enem-agent-stats', authenticateFirebaseToken, async (req, res) => {
  try {
    const stats = {
      cacheSize: cache.size,
      requestCount: newsSearcher.requestCount,
      lastRequestTime: newsSearcher.lastRequestTime,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };

    res.json({
      success: true,
      stats: stats
    });

  } catch (error) {
    console.error('❌ Erro ao obter estatísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

/**
 * Rota para limpar cache
 */
router.post('/enem-agent-clear-cache', authenticateFirebaseToken, async (req, res) => {
  try {
    cache.clear();
    
    res.json({
      success: true,
      message: 'Cache limpo com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao limpar cache:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor',
      error: error.message
    });
  }
});

module.exports = router;
