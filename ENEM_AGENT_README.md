# Agente Gerador de Temas ENEM

## Visão Geral

O Agente ENEM é um sistema inteligente que gera temas de redação para o ENEM baseado em notícias atuais e relevantes. Ele utiliza a Brave Search API para buscar notícias e analisa sua relevância para temas que podem aparecer no Exame Nacional do Ensino Médio.

## Funcionalidades

### 🔍 Busca Inteligente de Notícias
- Busca notícias atuais usando Brave Search API
- Filtra por relevância para temas ENEM
- Foca em fontes confiáveis e notícias dos últimos 6 meses
- Cache inteligente para otimizar performance

### 📊 Análise de Relevância ENEM
- Calcula score de relevância (0-10) baseado em palavras-chave
- Identifica eixo temático principal
- Avalia complexidade e potencial argumentativo
- Verifica compatibilidade com critérios ENEM

### 💡 Sugestões Inteligentes
- Gera abordagens sugeridas para redação
- Propõe intervenções sociais
- Extrai palavras-chave relevantes
- Classifica nível de dificuldade

## Estrutura da API

### Endpoints Disponíveis

#### `POST /api/generate-enem-themes`
Gera temas ENEM baseados em palavras-chave.

**Request:**
```json
{
  "keywords": ["sustentabilidade", "tecnologia educação"],
  "limit": 5
}
```

**Response:**
```json
{
  "success": true,
  "themes": [
    {
      "title": "IA na Educação: Desafios e Oportunidades no Brasil",
      "summary": "Análise sobre como a inteligência artificial está...",
      "sourceUrl": "https://exemplo.com/noticia",
      "publishedDate": "15 de setembro de 2024",
      "enemRelevance": 8.5,
      "keywords": ["educação", "tecnologia", "futuro", "desigualdade"],
      "thematicAxis": "Tecnologia e sociedade",
      "complexity": "Média",
      "argumentativePotential": 7,
      "socialRelevance": 8,
      "suggestedApproaches": [
        "Impactos positivos da tecnologia na educação",
        "Desafios de acesso à tecnologia educacional"
      ],
      "interventionProposals": [
        "Investimento em políticas públicas educacionais",
        "Formação continuada de professores"
      ],
      "enemCompatibility": {
        "hasSocialRelevance": true,
        "hasArgumentativePotential": true,
        "isCurrent": true,
        "hasMultiplePerspectives": true,
        "allowsIntervention": true,
        "overallCompatibility": 85
      },
      "difficultyLevel": "Intermediário",
      "confidence": 85
    }
  ],
  "total": 1,
  "message": "Temas ENEM gerados com sucesso"
}
```

#### `GET /api/enem-themes`
Busca temas ENEM salvos do usuário.

**Response:**
```json
{
  "success": true,
  "themes": [...],
  "total": 5
}
```

#### `GET /api/enem-agent-stats`
Retorna estatísticas do agente.

**Response:**
```json
{
  "success": true,
  "stats": {
    "cacheSize": 15,
    "requestCount": 42,
    "lastRequestTime": 1703123456789,
    "uptime": 3600,
    "memoryUsage": {...}
  }
}
```

#### `POST /api/enem-agent-clear-cache`
Limpa o cache do agente.

**Response:**
```json
{
  "success": true,
  "message": "Cache limpo com sucesso"
}
```

## Configuração

### Variáveis de Ambiente

Adicione ao arquivo `.env`:

```env
# Brave Search API
BRAVE_API_KEY=seu_api_key_aqui

# Configurações de Cache
CACHE_TTL=3600

# Configurações de Rate Limiting
RATE_LIMIT_DELAY=1000
MAX_REQUESTS_PER_MINUTE=60
```

### Dependências

O agente utiliza as seguintes dependências já presentes no projeto:
- `axios` - Para requisições HTTP
- `firebase-admin` - Para autenticação e Firestore
- `express` - Para rotas da API

## Critérios de Relevância ENEM

### Temas Recorrentes
- Meio ambiente e sustentabilidade
- Tecnologia e sociedade
- Educação e cultura
- Direitos humanos e cidadania
- Saúde e bem-estar social
- Política e democracia
- Economia e desenvolvimento

### Palavras-chave Prioritárias
- Sustentabilidade, meio ambiente, mudanças climáticas
- Tecnologia, inteligência artificial, digital
- Educação, escola, conhecimento, aprendizado
- Direitos humanos, igualdade, justiça
- Saúde, bem-estar, prevenção
- Política, democracia, cidadania
- Economia, trabalho, desenvolvimento

### Fontes Confiáveis
- G1, UOL, Folha de S.Paulo, Estadão
- O Globo, Veja, Exame
- BBC, Reuters, AP
- Sites governamentais (IBGE, MEC, etc.)

## Funcionalidades do Frontend

### Interface do Usuário
- Campo de busca com palavras-chave
- Palavras-chave pré-definidas sugeridas
- Visualização de temas gerados com análise completa
- Estatísticas do agente em tempo real
- Cache management

### Análise Visual
- Score de relevância ENEM (0-10)
- Nível de dificuldade (Básico/Intermediário/Avançado)
- Compatibilidade com critérios ENEM
- Eixo temático identificado
- Palavras-chave extraídas

## Exemplo de Uso

```javascript
// Gerar temas ENEM
const response = await fetch('/api/generate-enem-themes', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    keywords: ['sustentabilidade', 'tecnologia educação'],
    limit: 5
  })
});

const data = await response.json();
console.log('Temas gerados:', data.themes);
```

## Monitoramento e Performance

### Cache
- Cache em memória com TTL de 1 hora
- Reduz requisições desnecessárias à API
- Melhora performance e reduz custos

### Rate Limiting
- Delay de 1 segundo entre requisições
- Respeita limites da Brave Search API
- Previne bloqueios por excesso de requisições

### Logs
- Logs detalhados de operações
- Monitoramento de erros e performance
- Estatísticas de uso em tempo real

## Segurança

### Autenticação
- Todas as rotas protegidas com Firebase Authentication
- Verificação de token em cada requisição
- Isolamento de dados por usuário

### Validação
- Validação de entrada em todas as rotas
- Sanitização de dados
- Tratamento de erros robusto

## Manutenção

### Limpeza de Cache
- Cache automático com TTL
- Limpeza manual via API
- Monitoramento de uso de memória

### Atualizações
- Fácil adição de novos critérios de relevância
- Expansão de fontes confiáveis
- Melhoria de algoritmos de análise

## Troubleshooting

### Problemas Comuns

1. **Erro de API Key**
   - Verificar se BRAVE_API_KEY está configurada
   - Confirmar se a chave é válida

2. **Cache não funciona**
   - Verificar configuração de CACHE_TTL
   - Limpar cache manualmente se necessário

3. **Rate Limiting**
   - Ajustar RATE_LIMIT_DELAY se necessário
   - Monitorar logs de requisições

### Logs Úteis
- `✅ Encontradas X notícias relevantes para ENEM`
- `📦 Retornando resultados do cache`
- `⚠️ Erro na busca para query`
- `❌ Erro ao gerar temas ENEM`

## Roadmap

### Próximas Funcionalidades
- [ ] Integração com mais APIs de notícias
- [ ] Análise de sentimento das notícias
- [ ] Sugestões de argumentos específicos
- [ ] Histórico de temas por usuário
- [ ] Exportação de temas em PDF
- [ ] Notificações de novos temas relevantes
