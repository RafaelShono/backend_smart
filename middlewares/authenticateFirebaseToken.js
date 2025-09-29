// middlewares/authenticateFirebaseToken.js

const admin = require('../config/firebaseAdmin');

const authenticateFirebaseToken = async (req, res, next) => {
  console.log('🔐 Verificando autenticação...');
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.error('❌ Token não fornecido ou mal formatado');
    return res.status(401).send({ error: 'Token não fornecido ou mal formatado' });
  }

  const idToken = authHeader.split(' ')[1];
  console.log('🔑 Token recebido:', idToken.substring(0, 20) + '...');

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    console.log('✅ Token válido para usuário:', decodedToken.uid);
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error('❌ Erro ao verificar o token do Firebase:', error);
    return res.status(401).send({ error: 'Token inválido' });
  }
};

module.exports = authenticateFirebaseToken;
