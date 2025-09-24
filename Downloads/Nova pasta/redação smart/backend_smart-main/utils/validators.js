const { isValidArea } = require('../config/areas');

/**
 * Valida se a área solicitada é válida
 * @param {string} area - Área a ser validada
 * @returns {Object} Resultado da validação
 */
const validateArea = (area) => {
  if (!area) {
    return {
      isValid: false,
      error: 'Área é obrigatória',
      code: 'MISSING_AREA'
    };
  }

  if (typeof area !== 'string') {
    return {
      isValid: false,
      error: 'Área deve ser uma string',
      code: 'INVALID_AREA_TYPE'
    };
  }

  if (!isValidArea(area)) {
    return {
      isValid: false,
      error: `Área '${area}' não é válida. Áreas disponíveis: social, environment, technology, education, health, economics`,
      code: 'INVALID_AREA'
    };
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

/**
 * Valida o corpo da requisição
 * @param {Object} body - Corpo da requisição
 * @returns {Object} Resultado da validação
 */
const validateRequestBody = (body) => {
  if (!body) {
    return {
      isValid: false,
      error: 'Corpo da requisição é obrigatório',
      code: 'MISSING_BODY'
    };
  }

  if (typeof body !== 'object') {
    return {
      isValid: false,
      error: 'Corpo da requisição deve ser um objeto JSON',
      code: 'INVALID_BODY_TYPE'
    };
  }

  // Para compatibilidade com o frontend, aceitar areaTema em vez de area
  const area = body.area || body.areaTema;
  if (!area) {
    return {
      isValid: false,
      error: 'Área do tema é obrigatória',
      code: 'MISSING_AREA'
    };
  }

  // Validar área
  const areaValidation = validateArea(area);
  if (!areaValidation.isValid) {
    return areaValidation;
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

/**
 * Valida se as variáveis de ambiente estão configuradas
 * @returns {Object} Resultado da validação
 */
const validateEnvironment = () => {
  const requiredVars = ['ANTHROPIC_API_KEY'];
  const missing = [];

  requiredVars.forEach(varName => {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  });

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Variáveis de ambiente obrigatórias não configuradas: ${missing.join(', ')}`,
      code: 'MISSING_ENV_VARS'
    };
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

/**
 * Valida se a API key do Anthropic é válida
 * @param {string} apiKey - API key a ser validada
 * @returns {Object} Resultado da validação
 */
const validateApiKey = (apiKey) => {
  if (!apiKey) {
    return {
      isValid: false,
      error: 'API key é obrigatória',
      code: 'MISSING_API_KEY'
    };
  }

  if (typeof apiKey !== 'string') {
    return {
      isValid: false,
      error: 'API key deve ser uma string',
      code: 'INVALID_API_KEY_TYPE'
    };
  }

  if (apiKey.length < 20) {
    return {
      isValid: false,
      error: 'API key parece ser inválida (muito curta)',
      code: 'INVALID_API_KEY_LENGTH'
    };
  }

  if (!apiKey.startsWith('sk-')) {
    return {
      isValid: false,
      error: 'API key deve começar com "sk-"',
      code: 'INVALID_API_KEY_FORMAT'
    };
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

/**
 * Valida dados extraídos
 * @param {Object} extractedData - Dados extraídos
 * @returns {Object} Resultado da validação
 */
const validateExtractedData = (extractedData) => {
  if (!extractedData) {
    return {
      isValid: false,
      error: 'Dados extraídos são obrigatórios',
      code: 'MISSING_EXTRACTED_DATA'
    };
  }

  if (typeof extractedData !== 'object') {
    return {
      isValid: false,
      error: 'Dados extraídos devem ser um objeto',
      code: 'INVALID_EXTRACTED_DATA_TYPE'
    };
  }

  const requiredFields = ['statistics', 'sources', 'keyFindings', 'recentData'];
  const missing = [];

  requiredFields.forEach(field => {
    if (!extractedData[field]) {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Campos obrigatórios ausentes nos dados extraídos: ${missing.join(', ')}`,
      code: 'MISSING_EXTRACTED_DATA_FIELDS'
    };
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

/**
 * Valida tema gerado
 * @param {Object} theme - Tema gerado
 * @returns {Object} Resultado da validação
 */
const validateGeneratedTheme = (theme) => {
  if (!theme) {
    return {
      isValid: false,
      error: 'Tema gerado é obrigatório',
      code: 'MISSING_THEME'
    };
  }

  if (typeof theme !== 'object') {
    return {
      isValid: false,
      error: 'Tema gerado deve ser um objeto',
      code: 'INVALID_THEME_TYPE'
    };
  }

  const requiredFields = ['title', 'description', 'area', 'motivatingTexts', 'essayPrompt'];
  const missing = [];

  requiredFields.forEach(field => {
    if (!theme[field]) {
      missing.push(field);
    }
  });

  if (missing.length > 0) {
    return {
      isValid: false,
      error: `Campos obrigatórios ausentes no tema: ${missing.join(', ')}`,
      code: 'MISSING_THEME_FIELDS'
    };
  }

  // Validar se motivatingTexts é um array
  if (!Array.isArray(theme.motivatingTexts)) {
    return {
      isValid: false,
      error: 'motivatingTexts deve ser um array',
      code: 'INVALID_MOTIVATING_TEXTS_TYPE'
    };
  }

  // Validar se há pelo menos um texto motivador
  if (theme.motivatingTexts.length === 0) {
    return {
      isValid: false,
      error: 'Deve haver pelo menos um texto motivador',
      code: 'EMPTY_MOTIVATING_TEXTS'
    };
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

/**
 * Valida URL
 * @param {string} url - URL a ser validada
 * @returns {Object} Resultado da validação
 */
const validateUrl = (url) => {
  if (!url) {
    return {
      isValid: false,
      error: 'URL é obrigatória',
      code: 'MISSING_URL'
    };
  }

  try {
    new URL(url);
    return {
      isValid: true,
      error: null,
      code: null
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'URL inválida',
      code: 'INVALID_URL'
    };
  }
};

/**
 * Sanitiza entrada do usuário
 * @param {string} input - Entrada a ser sanitizada
 * @returns {string} Entrada sanitizada
 */
const sanitizeInput = (input) => {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return input
    .trim()
    .replace(/[<>]/g, '') // Remove caracteres potencialmente perigosos
    .substring(0, 1000); // Limita tamanho
};

/**
 * Valida timeout
 * @param {number} timeout - Timeout em milissegundos
 * @returns {Object} Resultado da validação
 */
const validateTimeout = (timeout) => {
  if (!timeout) {
    return {
      isValid: false,
      error: 'Timeout é obrigatório',
      code: 'MISSING_TIMEOUT'
    };
  }

  if (typeof timeout !== 'number') {
    return {
      isValid: false,
      error: 'Timeout deve ser um número',
      code: 'INVALID_TIMEOUT_TYPE'
    };
  }

  if (timeout < 1000 || timeout > 300000) {
    return {
      isValid: false,
      error: 'Timeout deve estar entre 1 e 300 segundos',
      code: 'INVALID_TIMEOUT_RANGE'
    };
  }

  return {
    isValid: true,
    error: null,
    code: null
  };
};

module.exports = {
  validateArea,
  validateRequestBody,
  validateEnvironment,
  validateApiKey,
  validateExtractedData,
  validateGeneratedTheme,
  validateUrl,
  sanitizeInput,
  validateTimeout
};
