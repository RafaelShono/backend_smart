require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Configurar CORS permitindo o domínio do seu front-end hospedado no Vercel
app.use(cors({
  origin: 'https://www.redacaosmart.com.br', // Substitua pelo seu domínio real
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
}));


// Middleware especial para a rota /webhook, que precisa do corpo bruto da requisição
app.use((req, res, next) => {
  if (req.originalUrl === '/webhook') {
    next();
  } else {
    express.json({ limit: '1mb' })(req, res, next);
  }
});

app.use((req, res, next) => {
  res.removeHeader('Cross-Origin-Opener-Policy');
  res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
  next();
});

// Rotas
const analyzeRoutes = require('./routes/analyze');
const paymentRoutes = require('./routes/payments');
const enviarEmailRouter = require('./routes/enviarEmail');

// Usar as rotas
app.use('/', analyzeRoutes);
app.use('/', paymentRoutes);
app.use('/api', enviarEmailRouter);

// Iniciar o servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
