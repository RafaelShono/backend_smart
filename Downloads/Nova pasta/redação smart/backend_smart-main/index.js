require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Configurar CORS permitindo múltiplos domínios
app.use(cors({
  origin: [
    'https://www.redacaosmart.com.br', // Produção
    'http://localhost:5173', // Desenvolvimento local
    'http://localhost:3000', // Desenvolvimento alternativo
    'http://127.0.0.1:5173' // Desenvolvimento local alternativo
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
const enviarEmailRouter = require('./routes/enviarEmail');
const enemAgentRoutes = require('./routes/enemAgent');

// Usar as rotas
app.use('/api', analyzeRoutes);
app.use('/', paymentRoutes);
app.use('/api', enviarEmailRouter);
app.use('/api', enemAgentRoutes);

// Iniciar o servidor
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
