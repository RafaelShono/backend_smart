// Script para iniciar o backend em modo de desenvolvimento
require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Configurar CORS para desenvolvimento
app.use(cors({
  origin: [
    'http://localhost:5173', // Vite dev server
    'http://localhost:3000', // React dev server alternativo
    'http://127.0.0.1:5173', // Localhost alternativo
    'https://www.redacaosmart.com.br' // Produção
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Middleware especial para a rota /webhook, que precisa do corpo bruto da requisição
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

// Middleware para Cross-Origin-Opener-Policy
app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// Rotas
const analyzeRoutes = require('./routes/analyze');
const paymentRoutes = require('./routes/payments');
const webhookRoutes = require('./routes/webhook');
const enviarEmailRouter = require('./routes/enviarEmail');
const enemAgentRoutes = require('./routes/enemAgent');
const corretorEnemRoutes = require('./routes/corretorEnem');

// Usar as rotas
app.use('/api', analyzeRoutes);
app.use('/', paymentRoutes);
app.use('/', webhookRoutes);
app.use('/api', enviarEmailRouter);
app.use('/api', enemAgentRoutes);
app.use('/api', corretorEnemRoutes);

// Rota de teste
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend funcionando!', 
    timestamp: new Date().toISOString(),
    environment: 'development'
  });
});

// Iniciar o servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`🚀 Servidor de desenvolvimento rodando na porta ${PORT}`);
  console.log(`📡 CORS configurado para localhost:5173`);
  console.log(`🔗 Teste: http://localhost:${PORT}/api/test`);
});
