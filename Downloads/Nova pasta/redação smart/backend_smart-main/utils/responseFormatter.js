/**
 * Formata resposta de sucesso
 * @param {Object} data - Dados da resposta
 * @param {string} message - Mensagem de sucesso
 * @param {Object} meta - Metadados adicionais
 * @returns {Object} Resposta formatada
 */
const formatSuccessResponse = (data, message = 'Operação realizada com sucesso', meta = {}) => {
  return {
    success: true,
    message,
    data,
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...meta
    }
  };
};

/**
 * Formata resposta de erro
 * @param {string} message - Mensagem de erro
 * @param {string} code - Código do erro
 * @param {Object} details - Detalhes adicionais do erro
 * @param {number} statusCode - Código de status HTTP
 * @returns {Object} Resposta de erro formatada
 */
const formatErrorResponse = (message, code = 'UNKNOWN_ERROR', details = {}, statusCode = 500) => {
  return {
    success: false,
    error: {
      message,
      code,
      details,
      timestamp: new Date().toISOString()
    },
    statusCode
  };
};

/**
 * Formata resposta de validação
 * @param {Array} errors - Lista de erros de validação
 * @returns {Object} Resposta de validação formatada
 */
const formatValidationResponse = (errors) => {
  return {
    success: false,
    error: {
      message: 'Erro de validação',
      code: 'VALIDATION_ERROR',
      details: {
        validationErrors: errors
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 400
  };
};

/**
 * Formata resposta de rate limit
 * @param {number} retryAfter - Segundos para tentar novamente
 * @returns {Object} Resposta de rate limit formatada
 */
const formatRateLimitResponse = (retryAfter = 900) => {
  return {
    success: false,
    error: {
      message: 'Muitas requisições. Tente novamente mais tarde.',
      code: 'RATE_LIMIT_EXCEEDED',
      details: {
        retryAfter,
        limit: process.env.RATE_LIMIT_MAX || 10,
        window: process.env.RATE_LIMIT_WINDOW || 900000
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 429
  };
};

/**
 * Formata resposta de timeout
 * @param {string} operation - Operação que teve timeout
 * @param {number} timeout - Timeout em milissegundos
 * @returns {Object} Resposta de timeout formatada
 */
const formatTimeoutResponse = (operation = 'Operação', timeout = 120000) => {
  return {
    success: false,
    error: {
      message: `${operation} excedeu o tempo limite`,
      code: 'TIMEOUT_ERROR',
      details: {
        timeout,
        operation
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 408
  };
};

/**
 * Formata resposta de erro de API externa
 * @param {string} service - Nome do serviço
 * @param {string} error - Erro original
 * @returns {Object} Resposta de erro de API formatada
 */
const formatExternalApiError = (service, error) => {
  return {
    success: false,
    error: {
      message: `Erro ao conectar com ${service}`,
      code: 'EXTERNAL_API_ERROR',
      details: {
        service,
        originalError: error.message || error
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 502
  };
};

/**
 * Formata resposta de dados não encontrados
 * @param {string} resource - Recurso não encontrado
 * @returns {Object} Resposta de não encontrado formatada
 */
const formatNotFoundResponse = (resource = 'Recurso') => {
  return {
    success: false,
    error: {
      message: `${resource} não encontrado`,
      code: 'NOT_FOUND',
      details: {
        resource
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 404
  };
};

/**
 * Formata resposta de método não permitido
 * @param {string} method - Método HTTP usado
 * @param {Array} allowedMethods - Métodos permitidos
 * @returns {Object} Resposta de método não permitido formatada
 */
const formatMethodNotAllowedResponse = (method, allowedMethods = ['POST']) => {
  return {
    success: false,
    error: {
      message: `Método ${method} não permitido`,
      code: 'METHOD_NOT_ALLOWED',
      details: {
        method,
        allowedMethods
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 405
  };
};

/**
 * Formata resposta de erro de configuração
 * @param {string} config - Configuração faltando
 * @returns {Object} Resposta de erro de configuração formatada
 */
const formatConfigurationError = (config) => {
  return {
    success: false,
    error: {
      message: 'Erro de configuração do servidor',
      code: 'CONFIGURATION_ERROR',
      details: {
        missingConfig: config
      },
      timestamp: new Date().toISOString()
    },
    statusCode: 500
  };
};

/**
 * Formata resposta de saúde da API
 * @param {Object} health - Status de saúde dos serviços
 * @returns {Object} Resposta de saúde formatada
 */
const formatHealthResponse = (health = {}) => {
  return {
    success: true,
    message: 'API funcionando normalmente',
    data: {
      status: 'healthy',
      services: {
        webSearch: health.webSearch || 'unknown',
        dataExtraction: health.dataExtraction || 'unknown',
        themeGeneration: health.themeGeneration || 'unknown'
      },
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      ...health
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    }
  };
};

/**
 * Formata resposta de informações da API
 * @returns {Object} Resposta de informações formatada
 */
const formatInfoResponse = () => {
  return {
    success: true,
    message: 'Informações da API',
    data: {
      name: 'Research Theme API',
      version: '1.0.0',
      description: 'API para gerar temas de redação ENEM baseados em dados reais',
      endpoints: {
        'POST /api/generate-theme': 'Gerar tema de redação',
        'GET /api/health': 'Status da API',
        'GET /api/info': 'Informações da API'
      },
      areas: [
        'social',
        'environment', 
        'technology',
        'education',
        'health',
        'economics'
      ]
    },
    meta: {
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Formata resposta de tema gerado
 * @param {Object} theme - Tema gerado
 * @param {Object} meta - Metadados adicionais
 * @returns {Object} Resposta de tema formatada
 */
const formatThemeResponse = (theme, meta = {}) => {
  // Adicionar ID único se não existir
  if (!theme.id) {
    theme.id = `tema_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Mapear campos para compatibilidade com o frontend
  const mappedTheme = {
    id: theme.id,
    titulo: theme.title || theme.titulo || 'Tema de Redação ENEM',
    descricao: theme.description || theme.descricao || 'Descrição do contexto social atual.',
    area: theme.area || 'social',
    textosMotivadores: theme.motivatingTexts || theme.textosMotivadores || [],
    propostaRedacao: theme.essayPrompt || theme.propostaRedacao || 'Escreva uma redação sobre o tema apresentado.',
    estatisticas: theme.keyStatistics || theme.estatisticas || [],
    fontes: theme.realSources || theme.fontes || [],
    imagens: theme.relevantImages || theme.imagens || [],
    dataCriacao: new Date(),
    duracaoPesquisa: meta.researchDuration || '45s',
    // Manter campos originais para compatibilidade
    ...theme
  };

  return {
    success: true,
    message: 'Tema gerado com sucesso',
    tema: mappedTheme, // Frontend espera 'tema' no nível raiz
    data: {
      ...mappedTheme,
      generatedAt: new Date().toISOString(),
      researchDuration: meta.researchDuration || '45s',
      sourcesCount: theme.realSources ? theme.realSources.length : 0,
      statisticsCount: theme.keyStatistics ? theme.keyStatistics.length : 0
    },
    meta: {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      ...meta
    }
  };
};

/**
 * Adiciona headers de segurança à resposta
 * @param {Object} res - Objeto de resposta do Express
 * @returns {Object} Resposta com headers de segurança
 */
const addSecurityHeaders = (res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  
  return res;
};

/**
 * Formata resposta com headers de segurança
 * @param {Object} res - Objeto de resposta do Express
 * @param {Object} data - Dados da resposta
 * @param {number} statusCode - Código de status HTTP
 * @returns {Object} Resposta formatada com headers
 */
const sendSecureResponse = (res, data, statusCode = 200) => {
  addSecurityHeaders(res);
  return res.status(statusCode).json(data);
};

module.exports = {
  formatSuccessResponse,
  formatErrorResponse,
  formatValidationResponse,
  formatRateLimitResponse,
  formatTimeoutResponse,
  formatExternalApiError,
  formatNotFoundResponse,
  formatMethodNotAllowedResponse,
  formatConfigurationError,
  formatHealthResponse,
  formatInfoResponse,
  formatThemeResponse,
  addSecurityHeaders,
  sendSecureResponse
};
