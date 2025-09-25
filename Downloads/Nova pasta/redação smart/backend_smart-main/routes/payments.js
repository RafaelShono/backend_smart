// routes/payments.js

const express = require('express');
const router = express.Router();
const stripe = require('../config/stripe');
const admin = require('../config/firebaseAdmin');

// Configuração dos planos com preços definidos no frontend
const planConfig = {
  '5_redacoes': {
    name: '5 Redações Mensais',
    price: 1499, // R$14,99 em centavos
    description: '5 correções de redação por mês com IA avançada'
  },
  '10_redacoes': {
    name: '10 Redações Mensais', 
    price: 2499, // R$24,99 em centavos
    description: '10 correções de redação por mês com suporte prioritário'
  },
  'ilimitado': {
    name: 'Redações Ilimitadas',
    price: 5499, // R$54,99 em centavos
    description: 'Correções ilimitadas por mês com suporte 24/7'
  }
};

// Endpoint para criar a sessão de checkout
router.post('/create-checkout-session', async (req, res) => {
  const { plano, userId } = req.body;

  // Validar se o plano solicitado existe
  const plan = planConfig[plano];
  if (!plan) {
    return res.status(400).send({ error: 'Plano inválido' });
  }

  try {
    // Buscar produtos existentes primeiro
    const products = await stripe.products.list({ limit: 100 });
    let product = products.data.find(p => p.name === plan.name);
    
    // Se o produto não existir, criar um novo
    if (!product) {
      product = await stripe.products.create({
        name: plan.name,
        description: plan.description,
      });
    }

    // Buscar preços existentes para este produto
    const prices = await stripe.prices.list({ 
      product: product.id,
      limit: 100 
    });
    
    // Verificar se já existe um preço com o valor correto
    let price = prices.data.find(p => 
      p.unit_amount === plan.price && 
      p.currency === 'brl' && 
      p.recurring && 
      p.recurring.interval === 'month'
    );

    // Se o preço não existir, criar um novo
    if (!price) {
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: plan.price,
        currency: 'brl',
        recurring: {
          interval: 'month',
        },
      });
    }

    // Criar sessão de checkout
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: price.id,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/sucesso?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancelado`,
      metadata: {
        userId: userId,
        plano: plano,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Erro ao criar a sessão de checkout:', error);
    res.status(500).send({ error: 'Erro ao criar a sessão de pagamento' });
  }
});

// Endpoint para verificar status do plano
router.get('/check-plan-status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const db = admin.firestore();
    const userRef = db.collection('users').doc(userId);
    const userDoc = await userRef.get();

    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const userData = userDoc.data();
    res.json({
      planoAtivo: userData.planoAtivo || false,
      planoAtual: userData.planoAtual || null,
      limiteRedacoes: userData.limiteRedacoes || 3,
      redacoesUsadas: userData.redacoesUsadas || 0,
      dataAtivacao: userData.dataAtivacao || null
    });
  } catch (error) {
    console.error('Erro ao verificar status do plano:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Webhook removido - usando o webhook.js dedicado

module.exports = router;
