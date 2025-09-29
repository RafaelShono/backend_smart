// backend/routes/enviarEmail.js

const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Configurar o transportador do Nodemailer
const transporter = nodemailer.createTransport({
  service: 'Gmail', // ou outro serviço de email
  auth: {
    user: process.env.EMAIL_USER, // seu email
    pass: process.env.EMAIL_PASS, // sua senha de email ou senha de app
  },
});

// Endpoint para enviar email
router.post('/enviar-email', async (req, res) => {
  const { nome, email, mensagem } = req.body;

  const mailOptions = {
    from: email,
    to: process.env.EMAIL_USER, // email que receberá as mensagens
    subject: `Nova mensagem de contato de ${nome}`,
    text: mensagem,
    html: `<p><strong>Nome:</strong> ${nome}</p>
           <p><strong>Email:</strong> ${email}</p>
           <p><strong>Mensagem:</strong></p>
           <p>${mensagem}</p>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.status(200).send({ message: 'Email enviado com sucesso!' });
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    res.status(500).send({ error: 'Erro ao enviar email.' });
  }
});

module.exports = router;
