// routes/payments.js

const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const admin = require('../config/firebaseAdmin');

// Mapeamento de preços (IDs de preços obtidos do Stripe)
const priceMap = {
  '5_redacoes': 'price_1QTiG6JMbU7uvnrjffHehLW2', // 5 redações por 25 reais (único)
  'anual': 'price_1QTiCAJMbU7uvnrjWApFFk73',     // Anual por 360 reais (recorrente)
  '10_redacoes': 'price_1QTi64JMbU7uvnrjRsfbwR9Y' // 10 redações por 50 reais/mês (recorrente)
};

// Endpoint para criar a sessão de checkout
router.post('/create-checkout-session', async (req, res) => {
  const { plano, userId } = req.body;

  // Validar se o plano solicitado existe
  const priceId = priceMap[plano];
  if (!priceId) {
    return res.status(400).send({ error: 'Plano inválido' });
  }

  // Determina o modo com base no tipo de plano
  // 5 redações = avulso => 'payment'
  // anual e 10_redacoes = recorrente => 'subscription'
  let mode;
  if (plano === '5_redacoes') {
    mode = 'payment';
  } else {
    mode = 'subscription';
  }

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: mode,
      success_url: `${process.env.FRONTEND_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancelado`,
      metadata: {
        userId: userId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar a sessão de checkout:', error);
    res.status(500).send({ error: 'Erro ao criar a sessão de pagamento' });
  }
});

// Endpoint para lidar com webhooks do Stripe
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Erro ao verificar a assinatura do webhook:', err);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Manipule os eventos relevantes
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;

    // Recupere o userId dos metadados
    const userId = session.metadata.userId;

    // Atualize o campo 'planoAtivo' do usuário no Firestore para 'true'
    await ativarPlanoUsuario(userId);
  }

  res.status(200).end();
});

// Função para atualizar o plano do usuário no Firestore
const db = admin.firestore();

async function ativarPlanoUsuario(userId) {
  try {
    const userRef = db.collection('users').doc(userId);
    await userRef.update({
      planoAtivo: true,
    });
    console.log(`Plano ativado para o usuário ${userId}`);
  } catch (error) {
    console.error(`Erro ao atualizar o plano do usuário ${userId}:`, error);
  }
}

module.exports = router;
