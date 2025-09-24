// routes/webhook.js (por exemplo)
const express = require('express');
const router = express.Router();
const admin = require('../config/firebaseAdmin'); // Ex.: se tiver Firebase
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const db = admin.firestore();

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }), // body como raw
  async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET; // coloque sua variável de ambiente

    let event;

    try {
      // Constrói e verifica a assinatura do evento
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      console.error('Erro ao verificar a assinatura do webhook:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Analisar o tipo de evento
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      console.log('> Webhook recebeu checkout.session.completed');

      // A metadata que você adicionou em create-checkout-session
      const userId = session.metadata?.userId || null;
      const plano = session.metadata?.plano; // se você salvou também

      if (!userId) {
        console.warn('Nenhum userId na metadata');
        return res.status(200).send('OK');
      }

      try {
        // Exemplo: ativar o plano do usuário
        // Supõe que seu Firestore `users` tenha um doc com id = userId
        const userRef = db.collection('users').doc(userId);

        // Exemplo simples: setar planoAtivo = true
        await userRef.update({
          planoAtivo: true,
          planoAtual: plano, // se quiser gravar qual plano
        });

        console.log(`Plano ativado para o usuário: ${userId}`);
      } catch (error) {
        console.error('Erro ao atualizar plano do usuário:', error);
      }
    }

    // Responder ao webhook
    res.status(200).send('OK');
  }
);

module.exports = router;
