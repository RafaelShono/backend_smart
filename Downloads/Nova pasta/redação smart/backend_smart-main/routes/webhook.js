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
      console.log('✅ Webhook recebido: checkout.session.completed');
      console.log('Session ID:', session.id);
      console.log('Metadata:', session.metadata);

      // A metadata que você adicionou em create-checkout-session
      const userId = session.metadata?.userId || null;
      const plano = session.metadata?.plano;

      if (!userId) {
        console.log('❌ Usuário não encontrado nos metadados');
        return res.status(200).send('OK');
      }

      try {
        console.log(`🔄 Ativando plano para usuário: ${userId}, plano: ${plano}`);
        
        // Ativar o plano do usuário
        const userRef = db.collection('users').doc(userId);

        // Verificar se o usuário existe
        const userDoc = await userRef.get();
        if (!userDoc.exists) {
          console.log('❌ Usuário não encontrado no Firestore');
          return res.status(200).send('OK');
        }

        // Definir limitações baseadas no plano
        let limiteRedacoes = 0;
        switch (plano) {
          case '5_redacoes':
            limiteRedacoes = 5;
            break;
          case '10_redacoes':
            limiteRedacoes = 10;
            break;
          case 'ilimitado':
            limiteRedacoes = -1; // -1 significa ilimitado
            break;
          default:
            limiteRedacoes = 0;
        }

        const updateData = {
          planoAtivo: true,
          planoAtual: plano,
          limiteRedacoes: limiteRedacoes,
          redacoesUsadas: 0, // Resetar contador
          dataAtivacao: admin.firestore.FieldValue.serverTimestamp(),
          ultimaAtualizacao: admin.firestore.FieldValue.serverTimestamp()
        };

        await userRef.update(updateData);
        console.log('✅ Plano ativado com sucesso para o usuário:', userId);
        console.log('📊 Dados atualizados:', updateData);

      } catch (error) {
        console.error('❌ Erro ao atualizar plano do usuário:', error);
        // Não retornar erro para o Stripe para evitar reenvios
      }
    }

    // Lidar com outros eventos importantes
    if (event.type === 'invoice.payment_succeeded') {
      console.log('✅ Pagamento de assinatura confirmado:', event.data.object.id);
    }

    if (event.type === 'customer.subscription.deleted') {
      console.log('❌ Assinatura cancelada:', event.data.object.id);
      // Aqui você pode desativar o plano do usuário se necessário
    }

    // Responder ao webhook
    res.status(200).send('OK');
  }
);

module.exports = router;
