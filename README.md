# Backend Smart - Sistema de Correção de Redações ENEM

Backend para o sistema Redação Smart, uma plataforma de correção automática de redações do ENEM usando IA.

## 🚀 Funcionalidades

- **Correção Automática**: Análise e correção de redações usando IA (Anthropic Claude)
- **Sistema de Pagamentos**: Integração com Stripe para planos premium
- **Autenticação**: Sistema de autenticação com Firebase
- **ENEM Agent**: Agente especializado em temas do ENEM
- **Envio de Emails**: Sistema de notificações por email
- **Webhooks**: Processamento de eventos do Stripe

## 🛠️ Tecnologias

- **Node.js** v22.x
- **Express.js** - Framework web
- **Firebase Admin** - Autenticação e banco de dados
- **Stripe** - Processamento de pagamentos
- **Anthropic Claude** - IA para correção
- **Nodemailer** - Envio de emails
- **Mongoose** - ODM para MongoDB

## 📋 Pré-requisitos

- Node.js v22.x ou superior
- Conta no Firebase
- Conta no Stripe
- Chave da API Anthropic
- Conta de email (Gmail recomendado)

## ⚙️ Instalação

1. Clone o repositório:
```bash
git clone https://github.com/RafaelShono/backend_smart.git
cd backend_smart
```

2. Instale as dependências:
```bash
npm install
```

3. Configure as variáveis de ambiente:
```bash
cp .env.example .env
```

4. Edite o arquivo `.env` com suas credenciais:
```env
PORT=5001
ANTHROPIC_API_KEY=sk-ant-your-api-key-here
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
STRIPE_SECRET_KEY=sk_test_your-stripe-secret-key-here
STRIPE_WEBHOOK_SECRET=whsec_your-stripe-webhook-secret-here
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

## 🚀 Execução

### Desenvolvimento
```bash
npm run dev
```

### Produção
```bash
npm start
```

O servidor estará rodando em `http://localhost:5001`

## 📡 Endpoints da API

### Análise de Redação
- `POST /api/analyze` - Analisa uma redação

### Pagamentos
- `POST /create-payment-intent` - Cria intenção de pagamento
- `POST /webhook` - Webhook do Stripe

### Email
- `POST /api/send-email` - Envia email

### ENEM Agent
- `POST /api/enem-agent` - Agente especializado em temas ENEM
- `POST /api/corretor-enem` - Corretor específico para ENEM

## 🔧 Configuração do Render.com

Para deploy no Render.com:

1. Conecte seu repositório GitHub
2. Configure as variáveis de ambiente no painel do Render
3. Use as seguintes configurações:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Node Version**: `22.x`

## 📁 Estrutura do Projeto

```
backend_smart/
├── config/           # Configurações (Firebase, Stripe)
├── controllers/      # Controladores
├── middlewares/      # Middlewares (autenticação, etc.)
├── routes/          # Rotas da API
├── scripts/         # Scripts utilitários
├── utils/           # Utilitários
├── index.js         # Arquivo principal
├── start-dev.js     # Servidor de desenvolvimento
└── package.json     # Dependências
```

## 🔐 Segurança

- Autenticação via Firebase
- Validação de tokens JWT
- Rate limiting
- CORS configurado
- Variáveis de ambiente para credenciais

## 📝 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 👨‍💻 Autor

**Rafael Shono**
- GitHub: [@RafaelShono](https://github.com/RafaelShono)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request