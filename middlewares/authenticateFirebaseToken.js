// middlewares/authenticateFirebaseToken.js

const admin = require('../config/firebaseAdmin');

const authenticateFirebaseToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).send({ error: 'Token não fornecido ou mal formatado' });
  }

  const idToken = authHeader.split(' ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('Erro ao verificar o token do Firebase:', error);
    return res.status(401).send({ error: 'Token inválido' });
  }
};

module.exports = authenticateFirebaseToken;
