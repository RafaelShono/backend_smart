/**
 * Utilitários para o Agente ENEM
 */

/**
 * Calcula a relevância de uma notícia para o ENEM baseado em palavras-chave
 * @param {string} text - Texto da notícia
 * @param {string} title - Título da notícia
 * @returns {number} - Score de relevância (0-10)
 */
function calculateEnemRelevance(text, title) {
  const enemKeywords = [
    // Meio Ambiente
    'sustentabilidade', 'meio ambiente', 'mudanças climáticas', 'desmatamento', 
    'poluição', 'energia renovável', 'biodiversidade', 'recursos hídricos',
    
    // Tecnologia
    'tecnologia', 'inteligência artificial', 'digital', 'inovação', 
    'internet', 'smartphone', 'redes sociais', 'transformação digital',
    
    // Sociedade
    'sociedade', 'desigualdade', 'pobreza', 'comunidade', 'cidadania', 
    'direitos humanos', 'inclusão', 'diversidade',
    
    // Educação
    'educação', 'escola', 'professor', 'estudante', 'aprendizado', 
    'conhecimento', 'ensino', 'universidade',
    
    // Saúde
    'saúde', 'hospital', 'médico', 'doença', 'prevenção', 
    'bem-estar', 'saúde mental', 'pandemia',
    
    // Política
    'política', 'governo', 'democracia', 'eleição', 'cidadão', 
    'poder', 'corrupção', 'transparência',
    
    // Economia
    'economia', 'dinheiro', 'trabalho', 'empresa', 'mercado', 
    'desenvolvimento', 'crise', 'inflação'
  ];

  const fullText = `${title} ${text}`.toLowerCase();
  let score = 0;
  
  // Contar ocorrências de palavras-chave
  enemKeywords.forEach(keyword => {
    const regex = new RegExp(keyword, 'gi');
    const matches = fullText.match(regex);
    if (matches) {
      score += matches.length * 0.5;
    }
  });
  
  // Normalizar para escala 0-10
  return Math.min(score, 10);
}

/**
 * Extrai palavras-chave principais de um texto
 * @param {string} text - Texto para análise
 * @returns {Array} - Array de palavras-chave
 */
function extractKeywords(text) {
  const commonWords = [
    'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas', 'de', 'da', 'do', 'das', 'dos',
    'em', 'na', 'no', 'nas', 'nos', 'para', 'por', 'com', 'sem', 'sobre', 'entre',
    'que', 'quem', 'onde', 'quando', 'como', 'porque', 'se', 'mas', 'e', 'ou',
    'é', 'são', 'foi', 'foram', 'será', 'serão', 'tem', 'têm', 'teve', 'tiveram',
    'pode', 'podem', 'deve', 'devem', 'vai', 'vão', 'vem', 'vêm'
  ];
  
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word));
  
  // Contar frequência das palavras
  const wordCount = {};
  words.forEach(word => {
    wordCount[word] = (wordCount[word] || 0) + 1;
  });
  
  // Retornar as 10 palavras mais frequentes
  return Object.entries(wordCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10)
    .map(([word]) => word);
}

/**
 * Verifica se uma data está dentro dos últimos 6 meses
 * @param {string} dateString - Data em formato string
 * @returns {boolean} - True se está dentro do período
 */
function isWithinLastSixMonths(dateString) {
  const newsDate = new Date(dateString);
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  return newsDate >= sixMonthsAgo;
}

/**
 * Formata data para exibição
 * @param {string} dateString - Data em formato string
 * @returns {string} - Data formatada
 */
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Gera sugestões de abordagem para redação ENEM
 * @param {string} topic - Tópico da notícia
 * @param {Array} keywords - Palavras-chave extraídas
 * @returns {Array} - Array de sugestões de abordagem
 */
function generateApproachSuggestions(topic, keywords) {
  const suggestions = [];
  
  // Sugestões baseadas em palavras-chave
  if (keywords.includes('tecnologia') || keywords.includes('digital')) {
    suggestions.push('Impactos da tecnologia na sociedade brasileira');
    suggestions.push('Desafios de acesso à tecnologia');
    suggestions.push('Papel do Estado na democratização da tecnologia');
  }
  
  if (keywords.includes('educação') || keywords.includes('escola')) {
    suggestions.push('Desafios da educação pública no Brasil');
    suggestions.push('Importância da educação para o desenvolvimento');
    suggestions.push('Papel da tecnologia na educação');
  }
  
  if (keywords.includes('meio') || keywords.includes('ambiente')) {
    suggestions.push('Sustentabilidade e desenvolvimento econômico');
    suggestions.push('Preservação ambiental e responsabilidade social');
    suggestions.push('Mudanças climáticas e impactos sociais');
  }
  
  if (keywords.includes('desigualdade') || keywords.includes('pobreza')) {
    suggestions.push('Desigualdades sociais no Brasil contemporâneo');
    suggestions.push('Papel das políticas públicas na redução da desigualdade');
    suggestions.push('Impactos da desigualdade no desenvolvimento nacional');
  }
  
  // Se não houver sugestões específicas, gerar genéricas
  if (suggestions.length === 0) {
    suggestions.push('Análise dos impactos sociais do tema');
    suggestions.push('Papel do Estado na resolução do problema');
    suggestions.push('Importância da participação cidadã');
  }
  
  return suggestions.slice(0, 3); // Retornar máximo 3 sugestões
}

/**
 * Valida se uma URL é de uma fonte confiável
 * @param {string} url - URL para validar
 * @returns {boolean} - True se é fonte confiável
 */
function isTrustedSource(url) {
  const trustedDomains = [
    'g1.globo.com',
    'uol.com.br',
    'folha.uol.com.br',
    'estadao.com.br',
    'oglobo.globo.com',
    'veja.abril.com.br',
    'exame.com',
    'bbc.com',
    'cnn.com',
    'reuters.com',
    'ap.org',
    'ibge.gov.br',
    'mec.gov.br',
    'saude.gov.br',
    'economia.gov.br'
  ];
  
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return trustedDomains.some(trusted => domain.includes(trusted));
  } catch {
    return false;
  }
}

module.exports = {
  calculateEnemRelevance,
  extractKeywords,
  isWithinLastSixMonths,
  formatDate,
  generateApproachSuggestions,
  isTrustedSource
};
