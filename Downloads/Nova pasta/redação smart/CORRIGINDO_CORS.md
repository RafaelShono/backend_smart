# Corrigindo Problema de CORS

## Problema Identificado

O erro de CORS ocorre porque o servidor em produção está configurado para aceitar apenas requisições de `https://www.redacaosmart.com.br`, mas você está testando localmente em `http://localhost:5173`.

## Soluções Implementadas

### 1. ✅ Middleware CORS no Backend
- Adicionado middleware CORS específico no arquivo `newsAgent.js`
- Configurado para aceitar múltiplos domínios incluindo localhost

### 2. ✅ Detecção Automática de Ambiente
- Criado arquivo `frontend_smart-main/src/config/api.js`
- Detecção automática se está em desenvolvimento ou produção
- URLs diferentes para cada ambiente

### 3. ✅ Script de Desenvolvimento
- Criado `backend_smart-main/start-dev.js` para desenvolvimento local
- Configuração CORS otimizada para desenvolvimento

## Como Resolver

### Opção 1: Usar Backend Local (Recomendado para Desenvolvimento)

1. **Iniciar o backend localmente:**
   ```bash
   cd backend_smart-main
   npm run dev
   ```

2. **Verificar se está funcionando:**
   - Acesse: `http://localhost:5000/api/test`
   - Deve retornar: `{"message": "Backend funcionando!", ...}`

3. **Iniciar o frontend:**
   ```bash
   cd frontend_smart-main
   npm run dev
   ```

### Opção 2: Atualizar CORS no Servidor de Produção

Se você quiser usar o servidor de produção, precisa atualizar a configuração CORS no servidor `https://backend-smart-ys4l.onrender.com` para incluir `http://localhost:5173`.

### Opção 3: Usar Proxy no Frontend

Adicione no `vite.config.js` do frontend:

```javascript
export default {
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
}
```

## Verificação

### 1. Testar Backend Local
```bash
curl http://localhost:5000/api/test
```

### 2. Testar Geração de Tema
```bash
curl -X POST http://localhost:5000/api/generate-theme-ai \
  -H "Content-Type: application/json" \
  -d '{
    "areaTema": "social",
    "nivelProva": "enem",
    "contextoEspecifico": "teste",
    "quantidadeTextos": 3
  }'
```

### 3. Verificar CORS
No navegador, abra o DevTools e verifique se as requisições estão sendo feitas para `http://localhost:5000` em vez de `https://backend-smart-ys4l.onrender.com`.

## Arquivos Modificados

- ✅ `backend_smart-main/routes/newsAgent.js` - Middleware CORS
- ✅ `frontend_smart-main/src/config/api.js` - Configuração de URLs
- ✅ `frontend_smart-main/src/components/RedacaoForm/RedacaoForm.jsx` - URL dinâmica
- ✅ `frontend_smart-main/src/components/ThemeGenerator/ThemeGenerator.jsx` - URL dinâmica
- ✅ `backend_smart-main/start-dev.js` - Script de desenvolvimento
- ✅ `backend_smart-main/package.json` - Scripts npm

## Próximos Passos

1. **Iniciar backend local:** `npm run dev` na pasta backend
2. **Iniciar frontend:** `npm run dev` na pasta frontend
3. **Testar funcionalidade:** Gerar tema no frontend
4. **Verificar logs:** Console do navegador e terminal do backend

## Troubleshooting

### Erro: "Cannot connect to localhost:5000"
- Verifique se o backend está rodando
- Verifique se a porta 5000 não está sendo usada por outro processo

### Erro: "CORS policy" ainda aparece
- Limpe o cache do navegador
- Verifique se está usando a URL correta (localhost:5000)
- Verifique se o middleware CORS está ativo

### Erro: "Failed to fetch"
- Verifique se o backend está rodando
- Verifique se a chave da OpenAI está configurada
- Verifique os logs do backend para mais detalhes
