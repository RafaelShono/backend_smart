require('dotenv').config();

module.exports = {
  BRAVE_API_KEY: process.env.BRAVE_API_KEY,
  BRAVE_BASE_URL: 'https://api.search.brave.com/res/v1/web/search',
  CACHE_TTL: parseInt(process.env.CACHE_TTL) || 3600,
  RATE_LIMIT_DELAY: parseInt(process.env.RATE_LIMIT_DELAY) || 1000,
  MAX_REQUESTS_PER_MINUTE: parseInt(process.env.MAX_REQUESTS_PER_MINUTE) || 60
};
