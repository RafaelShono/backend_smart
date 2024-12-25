// routes/analyze.js

const express = require('express');
const router = express.Router();
const axios = require('axios');
const authenticateFirebaseToken = require('../middlewares/authenticateFirebaseToken');
const admin = require('firebase-admin');

// Certifique-se de que o Firebase Admin está inicializado
// admin.initializeApp({
//   credential: admin.credential.applicationDefault(),
//   // databaseURL: 'https://<YOUR_PROJECT_ID>.firebaseio.com'
// });

router.post('/analyze', authenticateFirebaseToken, async (req, res) => {
  let { text, tema } = req.body;

  // Sanitiza o texto de entrada
  text = text.replace(/<[^>]*>?/gm, '');

  // Verifica se o texto não está vazio
  if (!text || text.trim() === '') {
    console.error('Erro: Texto da redação está vazio.');
    return res.status(400).send({ error: 'O texto da redação é obrigatório.' });
  }

  // Verifica se o tema foi fornecido
  if (!tema || !tema.titulo || !tema.descricao) {
    console.error('Erro: As informações do tema são obrigatórias.');
    return res.status(400).send({ error: 'As informações do tema são obrigatórias.' });
  }

  try {
    const user = req.user; // Obtém o usuário autenticado

    if (!user) {
      return res.status(401).send({ error: 'Usuário não autenticado.' });
    }

    // Obtém o documento do usuário
    const userDocRef = admin.firestore().collection('users').doc(user.uid);
    const userDoc = await userDocRef.get();

    if (!userDoc.exists) {
      return res.status(404).send({ error: 'Usuário não encontrado.' });
    }

    const userData = userDoc.data();

    // Verifica o contador e o status premium
    if (!userData.premium && (userData.redacoesCount >= 3)) {
      return res.status(403).send({ error: 'Limite de redações atingido. Faça upgrade para continuar.' });
    }

    // Chamada à API da OpenAI usando gpt-4
    if (!process.env.OPENAI_API_KEY) {
      console.error('Erro: Chave da API da OpenAI não está definida.');
      return res.status(500).send({ error: 'Chave da API não configurada.' });
    }

    // Constrói o prompt
    const prompt = `
Você é um avaliador experiente de redações do ENEM. Avalie a redação a seguir com base nas 5 competências do ENEM, fornecendo feedback detalhado e uma pontuação para cada competência (0 a 200 pontos). Considere o tema, a imagem e a descrição fornecidos.

Tema: ${tema.titulo}

Descrição: ${tema.descricao}

${tema.imagem ? `Imagem relacionada ao tema: ${tema.imagem}` : ''}

Redação do aluno:
${text}

Lembre-se de avaliar de acordo com os seguintes critérios:

1. **Domínio da escrita formal em língua portuguesa**: Avalie o domínio da norma culta, ortografia, gramática, pontuação.

2. **Compreensão do tema e aplicação das áreas de conhecimento**: Verifique se o aluno compreendeu o tema proposto e utilizou conhecimentos de diferentes áreas para desenvolver a argumentação.

3. **Capacidade de interpretação das informações e organização dos argumentos**: Avalie a coerência, coesão e organização das ideias apresentadas.

4. **Domínio dos mecanismos linguísticos de argumentação**: Analise o uso adequado de conectivos, coesão referencial e sequencial.

5. **Capacidade de conclusão com propostas coerentes que respeitem os direitos humanos**: Verifique se o aluno apresentou uma proposta de intervenção detalhada, coerente e respeitosa aos direitos humanos.

Por favor, responda apenas com um objeto JSON contendo as seguintes chaves: 
{
  "competencias": [
    {
      "id": 1,
      "descricao": "Feedback da competência 1",
      "nota": 200
    },
    {
      "id": 2,
      "descricao": "Feedback da competência 2",
      "nota": 120
    },
    // ... mais competências
  ],
  "pontuacaoTotal": 850,
  "comentariosGerais": "Ótima redação! Continue assim."
}
    `.trim();

    // Chamada à API da OpenAI usando gpt-4
    const response = await axios.post(
      'https://api.openai.com/v1/chat/completions',
      {
        model: 'gpt-4', // Use 'gpt-4' se tiver acesso; caso contrário, use 'gpt-3.5-turbo'
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 1500,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
      }
    );

    const analysisText = response.data.choices[0].message.content.trim();

    // Tenta parsear a resposta como JSON
    let analysis;
    try {
      analysis = JSON.parse(analysisText);
    } catch (err) {
      console.error('Erro ao parsear a resposta da IA como JSON:', err);
      console.error('Resposta da IA:', analysisText);
      return res
        .status(500)
        .send({ error: 'Erro ao processar a avaliação. Tente novamente mais tarde.' });
    }

    // Verifica se todas as chaves necessárias estão presentes
    const requiredFields = ['competencias', 'pontuacaoTotal', 'comentariosGerais'];
    const hasAllFields = requiredFields.every((field) => field in analysis);

    if (!hasAllFields) {
      console.error('Resposta JSON da IA está faltando campos:', analysis);
      return res
        .status(500)
        .send({ error: 'Resposta inválida da avaliação. Tente novamente mais tarde.' });
    }

    // Salva a redação e a avaliação no Firestore
    await admin.firestore().collection('redacoes').add({
      usuarioId: user.uid,
      nome: userData.nome,
      fotoURL: userData.fotoURL,
      texto,
      avaliacao: analysis,
      temaId: tema.id,
      criadoEm: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Atualiza o número de redações enviadas pelo usuário
    await userDocRef.update({
      redacoesCount: admin.firestore.FieldValue.increment(1),
    });

    res.status(200).json({ analysis });
  } catch (error) {
    console.error('Erro ao analisar a redação:', error.response?.data || error.message || error);

    // Tratamento de erros
    if (error.response && error.response.status === 401) {
      res.status(500).send({ error: 'Falha na autenticação. Verifique a chave da API.' });
    } else if (error.response && error.response.status === 429) {
      res.status(500).send({ error: 'Limite de taxa excedido. Tente novamente mais tarde.' });
    } else if (error.message === 'Limite de redações atingido. Faça upgrade para continuar.') {
      res.status(403).send({ error: 'Limite de redações atingido. Faça upgrade para continuar.' });
    } else {
      res.status(500).send({ error: 'Erro ao analisar a redação' });
    }
  }
});

module.exports = router;
