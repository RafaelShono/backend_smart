// routes/corretorEnem.js

const express = require('express');
const router = express.Router();
const Anthropic = require('@anthropic-ai/sdk');
const authenticateFirebaseToken = require('../middlewares/authenticateFirebaseToken');

// Inicializar Claude
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'sk-ant-api03-1234567890abcdef'
});

/**
 * Agente Especialista em Correção de Redação ENEM
 * 
 * Este agente atua como um corretor experiente do ENEM, avaliando:
 * - Competência 1: Domínio da norma culta
 * - Competência 2: Compreensão da proposta
 * - Competência 3: Seleção e organização de informações
 * - Competência 4: Conhecimento dos mecanismos linguísticos
 * - Competência 5: Proposta de intervenção
 */
class CorretorEnem {
  constructor() {
    this.criteriosEnem = {
      competencia1: {
        nome: "Domínio da norma culta da língua portuguesa",
        descricao: "Avalia o domínio da modalidade escrita formal da língua portuguesa",
        aspectos: [
          "Ortografia",
          "Acentuação",
          "Pontuação",
          "Concordância verbal e nominal",
          "Regência verbal e nominal",
          "Colocação pronominal",
          "Estrutura sintática"
        ]
      },
      competencia2: {
        nome: "Compreensão da proposta de redação",
        descricao: "Avalia se o candidato compreendeu a proposta e desenvolveu o tema",
        aspectos: [
          "Fuga ao tema",
          "Desenvolvimento do tema",
          "Respeito aos limites do texto",
          "Coerência com a proposta"
        ]
      },
      competencia3: {
        nome: "Seleção e organização das informações",
        descricao: "Avalia a capacidade de selecionar e organizar informações",
        aspectos: [
          "Argumentação",
          "Coerência textual",
          "Progressão textual",
          "Seleção de informações relevantes"
        ]
      },
      competencia4: {
        nome: "Conhecimento dos mecanismos linguísticos",
        descricao: "Avalia o uso de recursos coesivos",
        aspectos: [
          "Coesão referencial",
          "Coesão sequencial",
          "Coesão lexical",
          "Conectores adequados"
        ]
      },
      competencia5: {
        nome: "Proposta de intervenção",
        descricao: "Avalia a proposta de solução para o problema",
        aspectos: [
          "Detalhamento da proposta",
          "Viabilidade",
          "Agentes envolvidos",
          "Meios para realização"
        ]
      }
    };
  }

  /**
   * Analisa uma redação ENEM seguindo os critérios oficiais
   */
  async analisarRedacao(texto, tema) {
    try {
      const prompt = this.gerarPromptAnalise(texto, tema);
      
      const response = await anthropic.messages.create({
        model: "claude-3-5-haiku-20241022",
        max_tokens: 4000,
        temperature: 0.3,
        messages: [{
          role: "user",
          content: prompt
        }]
      });

      const analise = response.content[0].text;
      return this.processarAnalise(analise);

    } catch (error) {
      console.error('Erro na análise do Claude:', error);
      return this.gerarAnaliseFallback(texto, tema);
    }
  }

  /**
   * Gera prompt detalhado para análise ENEM
   */
  gerarPromptAnalise(texto, tema) {
    return `Você é um corretor experiente do ENEM com mais de 10 anos de experiência. Analise a seguinte redação seguindo EXATAMENTE os critérios oficiais do ENEM.

TEMA DA REDAÇÃO: "${tema}"

TEXTO DA REDAÇÃO:
"${texto}"

INSTRUÇÕES PARA ANÁLISE:

1. AVALIE CADA COMPETÊNCIA (0-200 pontos cada):
   - Competência 1: Domínio da norma culta
   - Competência 2: Compreensão da proposta
   - Competência 3: Seleção e organização das informações
   - Competência 4: Conhecimento dos mecanismos linguísticos
   - Competência 5: Proposta de intervenção

2. FORMATO DE RESPOSTA (JSON):
{
  "pontuacao": {
    "competencia1": 160,
    "competencia2": 180,
    "competencia3": 140,
    "competencia4": 120,
    "competencia5": 100
  },
  "pontuacaoTotal": 700,
  "nivel": "Bom",
  "analiseDetalhada": {
    "competencia1": {
      "pontos": 160,
      "observacoes": "Bom domínio da norma culta, com poucos desvios...",
      "sugestoes": "Atenção à concordância verbal..."
    },
    "competencia2": {
      "pontos": 180,
      "observacoes": "Excelente compreensão da proposta...",
      "sugestoes": "Continue desenvolvendo o tema de forma consistente..."
    }
  },
  "pontosFortes": [
    "Argumentação bem estruturada",
    "Boa proposta de intervenção"
  ],
  "pontosFracos": [
    "Alguns desvios de concordância",
    "Falta de conectores em algumas passagens"
  ],
  "sugestoesGerais": [
    "Revisar concordância verbal",
    "Ampliar o uso de conectores",
    "Detalhar melhor a proposta de intervenção"
  ]
}

3. CRITÉRIOS DE PONTUAÇÃO:
- 200 pontos: Excelente
- 160-180 pontos: Bom
- 120-140 pontos: Regular
- 80-100 pontos: Insuficiente
- 0-60 pontos: Muito Insuficiente

4. SEJA RIGOROSO mas JUSTO na avaliação.
5. FOQUE nos aspectos técnicos da redação ENEM.
6. DÊ SUGESTÕES CONCRETAS de melhoria.

Responda APENAS com o JSON, sem texto adicional.`;
  }

  /**
   * Processa a resposta do Claude
   */
  processarAnalise(analise) {
    try {
      // Tentar extrair JSON da resposta
      const jsonMatch = analise.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const dados = JSON.parse(jsonMatch[0]);
        return this.validarAnalise(dados);
      }
    } catch (error) {
      console.error('Erro ao processar análise:', error);
    }
    
    return this.gerarAnaliseFallback();
  }

  /**
   * Valida se a análise está no formato correto
   */
  validarAnalise(dados) {
    const analiseValida = {
      pontuacao: {
        competencia1: Math.min(200, Math.max(0, dados.pontuacao?.competencia1 || 0)),
        competencia2: Math.min(200, Math.max(0, dados.pontuacao?.competencia2 || 0)),
        competencia3: Math.min(200, Math.max(0, dados.pontuacao?.competencia3 || 0)),
        competencia4: Math.min(200, Math.max(0, dados.pontuacao?.competencia4 || 0)),
        competencia5: Math.min(200, Math.max(0, dados.pontuacao?.competencia5 || 0))
      },
      pontuacaoTotal: 0,
      nivel: dados.nivel || 'Regular',
      analiseDetalhada: dados.analiseDetalhada || {},
      pontosFortes: dados.pontosFortes || [],
      pontosFracos: dados.pontosFracos || [],
      sugestoesGerais: dados.sugestoesGerais || [],
      timestamp: new Date(),
      fonte: 'Agente Corretor ENEM'
    };

    // Calcular pontuação total
    analiseValida.pontuacaoTotal = Object.values(analiseValida.pontuacao).reduce((sum, pontos) => sum + pontos, 0);

    return analiseValida;
  }

  /**
   * Gera análise fallback quando Claude não está disponível
   */
  gerarAnaliseFallback(texto = '', tema = '') {
    const palavras = texto.split(' ').length;
    const linhas = texto.split('\n').length;
    
    // Análise básica baseada em critérios simples
    let pontuacaoBase = 100;
    
    if (palavras >= 300) pontuacaoBase += 20;
    if (linhas >= 7) pontuacaoBase += 20;
    if (texto.includes('Portanto') || texto.includes('Dessa forma')) pontuacaoBase += 10;
    if (texto.includes('Governo') || texto.includes('sociedade')) pontuacaoBase += 10;

    return {
      pontuacao: {
        competencia1: Math.min(200, pontuacaoBase + Math.floor(Math.random() * 40)),
        competencia2: Math.min(200, pontuacaoBase + Math.floor(Math.random() * 40)),
        competencia3: Math.min(200, pontuacaoBase + Math.floor(Math.random() * 40)),
        competencia4: Math.min(200, pontuacaoBase + Math.floor(Math.random() * 40)),
        competencia5: Math.min(200, pontuacaoBase + Math.floor(Math.random() * 40))
      },
      pontuacaoTotal: 0,
      nivel: 'Análise Automática',
      analiseDetalhada: {
        competencia1: {
          pontos: 0,
          observacoes: "Análise automática - verifique ortografia e gramática",
          sugestoes: "Revise a concordância verbal e nominal"
        }
      },
      pontosFortes: ["Texto com desenvolvimento adequado"],
      pontosFracos: ["Análise limitada - use o corretor completo"],
      sugestoesGerais: [
        "Revise ortografia e gramática",
        "Desenvolva melhor os argumentos",
        "Inclua proposta de intervenção detalhada"
      ],
      timestamp: new Date(),
      fonte: 'Sistema Automático',
      isFallback: true
    };
  }
}

// Instanciar o corretor
const corretorEnem = new CorretorEnem();

// Rota para análise de redação ENEM
router.post('/analisar-enem', authenticateFirebaseToken, async (req, res) => {
  try {
    const { texto, tema, userId } = req.body;

    if (!texto || !texto.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Texto da redação é obrigatório'
      });
    }

    if (texto.length < 100) {
      return res.status(400).json({
        success: false,
        message: 'Redação muito curta. Mínimo 100 caracteres'
      });
    }

    console.log(`📝 Iniciando análise ENEM para usuário: ${userId}`);
    console.log(`📄 Tema: ${tema}`);
    console.log(`📊 Tamanho do texto: ${texto.length} caracteres`);

    const analise = await corretorEnem.analisarRedacao(texto, tema);

    // Salvar análise no Firestore
    if (userId) {
      try {
        const admin = require('firebase-admin');
        const db = admin.firestore();
        
        await db.collection('analises_enem').add({
          userId,
          tema,
          texto: texto.substring(0, 1000), // Limitar tamanho
          analise,
          dataCriacao: new Date()
        });
        
        console.log(`✅ Análise salva no Firestore para usuário: ${userId}`);
      } catch (firestoreError) {
        console.error('Erro ao salvar no Firestore:', firestoreError);
        // Não falhar a requisição por erro no Firestore
      }
    }

    res.json({
      success: true,
      analise,
      message: 'Análise concluída com sucesso'
    });

  } catch (error) {
    console.error('Erro na análise ENEM:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor na análise',
      error: error.message
    });
  }
});

// Rota para obter critérios de avaliação
router.get('/criterios-enem', authenticateFirebaseToken, (req, res) => {
  res.json({
    success: true,
    criterios: corretorEnem.criteriosEnem,
    message: 'Critérios de avaliação ENEM'
  });
});

module.exports = router;
