const axios = require('axios');
const NodeCache = require('node-cache');
const { BRAVE_API_KEY, BRAVE_BASE_URL, CACHE_TTL, RATE_LIMIT_DELAY } = require('../config/api');
const { calculateEnemRelevance, extractKeywords, isWithinLastSixMonths, isTrustedSource } = require('../utils/helpers');

class NewsSearcher {
  constructor() {
    this.cache = new NodeCache({ stdTTL: CACHE_TTL });
    this.requestCount = 0;
    this.lastRequestTime = Date.now();
  }

  /**
   * Busca notícias relacionadas a temas ENEM usando Brave Search API
   * @param {Array} keywords - Array de palavras-chave para busca
   * @param {number} limit - Número máximo de resultados
   * @returns {Promise<Array>} - Array de notícias relevantes
   */
  async searchEnemTopics(keywords, limit = 5) {
    try {
      const cacheKey = `enem_topics_${keywords.join('_')}_${limit}`;
      const cached = this.cache.get(cacheKey);
      
      if (cached) {
        console.log('📦 Retornando resultados do cache');
        return cached;
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

      this.cache.set(cacheKey, finalResults);
      console.log(`✅ Encontradas ${finalResults.length} notícias relevantes para ENEM`);
      
      return finalResults;

    } catch (error) {
      console.error('❌ Erro na busca de notícias:', error);
      throw new Error(`Falha na busca de notícias: ${error.message}`);
    }
  }

  /**
   * Constrói queries de busca otimizadas para temas ENEM
   * @param {Array} keywords - Palavras-chave base
   * @returns {Array} - Array de queries otimizadas
   */
  buildSearchQueries(keywords) {
    const enemContexts = [
      'Brasil',
      'sociedade brasileira',
      'políticas públicas',
      'desenvolvimento social',
      'educação',
      'sustentabilidade',
      'tecnologia',
      'direitos humanos'
    ];

    const queries = [];
    
    // Query principal com todas as palavras-chave
    queries.push(keywords.join(' '));
    
    // Queries específicas para cada palavra-chave com contexto ENEM
    keywords.forEach(keyword => {
      enemContexts.slice(0, 2).forEach(context => {
        queries.push(`${keyword} ${context}`);
      });
    });

    return queries.slice(0, 5); // Máximo 5 queries para evitar rate limiting
  }

  /**
   * Executa busca na Brave Search API
   * @param {string} query - Query de busca
   * @param {number} count - Número de resultados
   * @returns {Promise<Array>} - Resultados da busca
   */
  async searchBraveAPI(query, count = 10) {
    if (!BRAVE_API_KEY || BRAVE_API_KEY === 'seu_api_key_aqui') {
      throw new Error('BRAVE_API_KEY não configurada. Configure sua chave da API no arquivo .env');
    }

    const params = {
      q: query,
      count: count,
      country: 'BR',
      search_lang: 'pt',
      ui_lang: 'pt',
      freshness: 'm', // Último mês
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
      console.warn(`⚠️ Nenhum resultado encontrado para: ${query}`);
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
   * Filtra notícias por relevância para ENEM
   * @param {Array} results - Resultados brutos da busca
   * @returns {Array} - Notícias filtradas e enriquecidas
   */
  filterByEnemRelevance(results) {
    return results
      .filter(news => {
        // Filtrar por fonte confiável
        if (!isTrustedSource(news.url)) {
          return false;
        }

        // Filtrar por data (últimos 6 meses)
        if (!isWithinLastSixMonths(news.publishedDate)) {
          return false;
        }

        // Calcular relevância ENEM
        const relevance = calculateEnemRelevance(news.snippet, news.title);
        return relevance >= 3; // Mínimo de relevância 3/10
      })
      .map(news => {
        const relevance = calculateEnemRelevance(news.snippet, news.title);
        const keywords = extractKeywords(`${news.title} ${news.snippet}`);
        
        return {
          ...news,
          enemRelevance: Math.round(relevance * 10) / 10,
          keywords: keywords.slice(0, 5), // Top 5 keywords
          filtered: true
        };
      })
      .sort((a, b) => b.enemRelevance - a.enemRelevance); // Ordenar por relevância
  }

  /**
   * Implementa rate limiting para respeitar limites da API
   */
  async rateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    if (timeSinceLastRequest < RATE_LIMIT_DELAY) {
      const delay = RATE_LIMIT_DELAY - timeSinceLastRequest;
      console.log(`⏳ Rate limiting: aguardando ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    this.lastRequestTime = Date.now();
    this.requestCount++;
  }

  /**
   * Limpa o cache
   */
  clearCache() {
    this.cache.flushAll();
    console.log('🗑️ Cache limpo');
  }

  /**
   * Retorna estatísticas do cache
   * @returns {Object} - Estatísticas do cache
   */
  getCacheStats() {
    return {
      keys: this.cache.keys().length,
      hits: this.cache.getStats().hits,
      misses: this.cache.getStats().misses,
      requests: this.requestCount
    };
  }
}

module.exports = NewsSearcher;
