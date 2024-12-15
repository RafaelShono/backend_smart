// index.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());

// O middleware para o webhook precisa do corpo bruto da requisição
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  // ou para definir como 'unsafe-none'
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});
// Rotas
const analyzeRoutes = require('./routes/analyze');
const paymentRoutes = require('./routes/payments');
const enviarEmailRouter = require('./routes/enviarEmail'); // Novo

// Usar as rotas
app.use('/', analyzeRoutes);
app.use('/', paymentRoutes);
app.use('/api', enviarEmailRouter); // Novo
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
