// config/firebaseAdmin.js

const admin = require('firebase-admin');
const path = require('path');

// Verificar se o Firebase Admin já foi inicializado
if (!admin.apps.length) {
  try {
    const serviceAccount = require(path.join(__dirname, '../serviceAccountKey.json.json'));

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: 'redacaosmrt' // Projeto redacaoSmrt
    });
    
    console.log('✅ Firebase Admin inicializado com sucesso');
  } catch (error) {
    console.error('❌ Erro ao inicializar Firebase Admin:', error);
    // Em caso de erro, tentar inicializar sem credenciais (para desenvolvimento)
    try {
      admin.initializeApp({
        projectId: 'redacaosmrt'
      });
      console.log('⚠️ Firebase Admin inicializado sem credenciais (modo desenvolvimento)');
    } catch (fallbackError) {
      console.error('❌ Erro crítico ao inicializar Firebase Admin:', fallbackError);
    }
  }
}

module.exports = admin;
