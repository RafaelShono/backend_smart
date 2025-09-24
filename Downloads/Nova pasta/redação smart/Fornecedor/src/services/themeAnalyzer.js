const { generateApproachSuggestions, formatDate } = require('../utils/helpers');

class ThemeAnalyzer {
  constructor() {
    this.enemCriteria = {
      // Temas recorrentes no ENEM
      recurringThemes: [
        'meio ambiente', 'sustentabilidade', 'tecnologia', 'educação',
        'direitos humanos', 'desigualdade social', 'saúde pública',
        'cultura', 'política', 'economia', 'ciência', 'inovação'
      ],
      
      // Competências avaliadas no ENEM
      competencies: [
        'Domínio da norma padrão da língua portuguesa',
        'Compreensão da proposta de redação',
        'Seleção e organização das informações',
        'Demonstração de conhecimento da língua',
        'Elaboração de proposta de intervenção'
      ],
      
      // Eixos temáticos frequentes
      thematicAxes: [
        'Cidadania e direitos humanos',
        'Meio ambiente e sustentabilidade',
        'Tecnologia e sociedade',
        'Educação e cultura',
        'Saúde e bem-estar social',
        'Política e democracia',
        'Economia e desenvolvimento'
      ]
    };
  }

  /**
   * Analisa o potencial de uma notícia para redação ENEM
   * @param {Object} news - Objeto da notícia
   * @returns {Object} - Análise completa do tema
   */
  analyzeEnemPotential(news) {
    const analysis = {
      title: news.title,
      summary: news.snippet,
      sourceUrl: news.url,
      publishedDate: formatDate(news.publishedDate),
      enemRelevance: news.enemRelevance,
      keywords: news.keywords,
      
      // Análise detalhada
      thematicAxis: this.identifyThematicAxis(news),
      complexity: this.assessComplexity(news),
      argumentativePotential: this.assessArgumentativePotential(news),
      socialRelevance: this.assessSocialRelevance(news),
      
      // Sugestões para redação
      suggestedApproaches: generateApproachSuggestions(news.title, news.keywords),
      interventionProposals: this.generateInterventionProposals(news),
      
      // Critérios ENEM
      enemCompatibility: this.checkEnemCompatibility(news),
      difficultyLevel: this.assessDifficultyLevel(news),
      
      // Metadados
      analysisDate: new Date().toISOString(),
      confidence: this.calculateConfidence(news)
    };

    return analysis;
  }

  /**
   * Identifica o eixo temático principal
   * @param {Object} news - Notícia para análise
   * @returns {string} - Eixo temático identificado
   */
  identifyThematicAxis(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    
    const axisKeywords = {
      'Cidadania e direitos humanos': ['direitos', 'cidadania', 'igualdade', 'justiça', 'democracia'],
      'Meio ambiente e sustentabilidade': ['meio ambiente', 'sustentabilidade', 'natureza', 'clima', 'poluição'],
      'Tecnologia e sociedade': ['tecnologia', 'digital', 'internet', 'inovação', 'ciência'],
      'Educação e cultura': ['educação', 'escola', 'cultura', 'conhecimento', 'aprendizado'],
      'Saúde e bem-estar social': ['saúde', 'bem-estar', 'hospital', 'médico', 'doença'],
      'Política e democracia': ['política', 'governo', 'eleição', 'poder', 'corrupção'],
      'Economia e desenvolvimento': ['economia', 'desenvolvimento', 'trabalho', 'empresa', 'mercado']
    };

    let bestMatch = 'Tecnologia e sociedade'; // Default
    let maxScore = 0;

    Object.entries(axisKeywords).forEach(([axis, keywords]) => {
      let score = 0;
      keywords.forEach(keyword => {
        const regex = new RegExp(keyword, 'gi');
        const matches = text.match(regex);
        if (matches) {
          score += matches.length;
        }
      });
      
      if (score > maxScore) {
        maxScore = score;
        bestMatch = axis;
      }
    });

    return bestMatch;
  }

  /**
   * Avalia a complexidade do tema
   * @param {Object} news - Notícia para análise
   * @returns {string} - Nível de complexidade
   */
  assessComplexity(news) {
    const text = `${news.title} ${news.snippet}`;
    const wordCount = text.split(' ').length;
    const technicalTerms = this.countTechnicalTerms(text);
    
    if (technicalTerms > 5 || wordCount > 200) {
      return 'Alta';
    } else if (technicalTerms > 2 || wordCount > 100) {
      return 'Média';
    } else {
      return 'Baixa';
    }
  }

  /**
   * Avalia o potencial argumentativo
   * @param {Object} news - Notícia para análise
   * @returns {number} - Score de potencial argumentativo (0-10)
   */
  assessArgumentativePotential(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    
    // Palavras que indicam debate/controvérsia
    const debateWords = [
      'debate', 'discussão', 'controvérsia', 'polêmica', 'divergência',
      'opinião', 'ponto de vista', 'argumento', 'posição', 'lado',
      'prós', 'contras', 'vantagens', 'desvantagens', 'impacto'
    ];
    
    let score = 0;
    debateWords.forEach(word => {
      if (text.includes(word)) {
        score += 1;
      }
    });
    
    // Bonus por múltiplas perspectivas
    if (text.includes('por um lado') || text.includes('por outro lado')) {
      score += 2;
    }
    
    return Math.min(score, 10);
  }

  /**
   * Avalia a relevância social
   * @param {Object} news - Notícia para análise
   * @returns {number} - Score de relevância social (0-10)
   */
  assessSocialRelevance(news) {
    const text = `${news.title} ${news.snippet}`.toLowerCase();
    
    const socialImpactWords = [
      'sociedade', 'comunidade', 'população', 'brasileiros', 'cidadãos',
      'impacto social', 'bem-estar', 'qualidade de vida', 'desenvolvimento',
      'políticas públicas', 'governo', 'estado', 'nação'
    ];
    
    let score = 0;
    socialImpactWords.forEach(word => {
      if (text.includes(word)) {
        score += 1;
      }
    });
    
    return Math.min(score, 10);
  }

  /**
   * Gera propostas de intervenção
   * @param {Object} news - Notícia para análise
   * @returns {Array} - Array de propostas de intervenção
   */
  generateInterventionProposals(news) {
    const proposals = [];
    const keywords = news.keywords;
    
    // Propostas baseadas em palavras-chave
    if (keywords.includes('educação')) {
      proposals.push('Investimento em políticas públicas educacionais');
      proposals.push('Formação continuada de professores');
      proposals.push('Democratização do acesso à educação de qualidade');
    }
    
    if (keywords.includes('tecnologia')) {
      proposals.push('Inclusão digital através de políticas públicas');
      proposals.push('Investimento em infraestrutura tecnológica');
      proposals.push('Educação digital para toda a população');
    }
    
    if (keywords.includes('meio') || keywords.includes('ambiente')) {
      proposals.push('Implementação de políticas de sustentabilidade');
      proposals.push('Educação ambiental nas escolas');
      proposals.push('Incentivos para práticas sustentáveis');
    }
    
    if (keywords.includes('saúde')) {
      proposals.push('Ampliação do acesso aos serviços de saúde');
      proposals.push('Investimento em prevenção e promoção da saúde');
      proposals.push('Formação de profissionais da saúde');
    }
    
    // Propostas genéricas se não houver específicas
    if (proposals.length === 0) {
      proposals.push('Desenvolvimento de políticas públicas específicas');
      proposals.push('Educação e conscientização da população');
      proposals.push('Participação da sociedade civil na solução');
    }
    
    return proposals.slice(0, 3);
  }

  /**
   * Verifica compatibilidade com critérios ENEM
   * @param {Object} news - Notícia para análise
   * @returns {Object} - Análise de compatibilidade
   */
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

  /**
   * Avalia o nível de dificuldade
   * @param {Object} news - Notícia para análise
   * @returns {string} - Nível de dificuldade
   */
  assessDifficultyLevel(news) {
    const complexity = this.assessComplexity(news);
    const argumentativePotential = this.assessArgumentativePotential(news);
    
    if (complexity === 'Alta' && argumentativePotential >= 7) {
      return 'Avançado';
    } else if (complexity === 'Média' && argumentativePotential >= 5) {
      return 'Intermediário';
    } else {
      return 'Básico';
    }
  }

  /**
   * Calcula confiança na análise
   * @param {Object} news - Notícia para análise
   * @returns {number} - Score de confiança (0-100)
   */
  calculateConfidence(news) {
    let confidence = 50; // Base
    
    // Bonus por relevância ENEM
    confidence += news.enemRelevance * 3;
    
    // Bonus por fonte confiável
    if (this.isTrustedSource(news.url)) {
      confidence += 10;
    }
    
    // Bonus por atualidade
    if (this.isRecent(news.publishedDate)) {
      confidence += 10;
    }
    
    // Bonus por múltiplas perspectivas
    if (this.hasMultiplePerspectives(`${news.title} ${news.snippet}`)) {
      confidence += 10;
    }
    
    return Math.min(Math.round(confidence), 100);
  }

  // Métodos auxiliares
  countTechnicalTerms(text) {
    const technicalTerms = [
      'algoritmo', 'inteligência artificial', 'machine learning', 'blockchain',
      'sustentabilidade', 'biodiversidade', 'ecossistema', 'carbono',
      'democracia', 'cidadania', 'constitucional', 'jurisdicional'
    ];
    
    let count = 0;
    technicalTerms.forEach(term => {
      if (text.toLowerCase().includes(term)) {
        count++;
      }
    });
    
    return count;
  }

  isRecent(dateString) {
    const newsDate = new Date(dateString);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return newsDate >= threeMonthsAgo;
  }

  hasMultiplePerspectives(text) {
    const perspectiveWords = [
      'por um lado', 'por outro lado', 'entretanto', 'contudo', 'porém',
      'no entanto', 'embora', 'apesar de', 'diferentes pontos de vista'
    ];
    
    return perspectiveWords.some(word => text.toLowerCase().includes(word));
  }

  allowsIntervention(text) {
    const interventionWords = [
      'solução', 'medida', 'política', 'ação', 'intervenção',
      'governo', 'estado', 'sociedade', 'cidadão', 'responsabilidade'
    ];
    
    return interventionWords.some(word => text.toLowerCase().includes(word));
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

module.exports = ThemeAnalyzer;
