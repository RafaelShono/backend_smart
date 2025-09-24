const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Configurar Firebase Admin
let serviceAccount;

// Tentar carregar credenciais de diferentes formas
try {
  // Opção 1: Arquivo JSON
  serviceAccount = require('./backend_smart-main/serviceAccountKey.json.json');
} catch (error) {
  // Opção 2: Variáveis de ambiente
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  } else {
    console.error('❌ Erro: Credenciais do Firebase não encontradas!');
    console.error('   - Verifique se o arquivo serviceAccountKey.json.json existe');
    console.error('   - Ou configure a variável FIREBASE_SERVICE_ACCOUNT_KEY');
    process.exit(1);
  }
}

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: process.env.FIREBASE_PROJECT_ID || 'redacaosmrt' // Projeto redacaoSmrt
});

const db = admin.firestore();

// Ler estrutura do Firestore
const firestoreStructure = JSON.parse(fs.readFileSync('firestore_structure.json', 'utf8'));

// Função para fazer upload de uma redação
async function uploadRedacao(document) {
  try {
    const docRef = db.collection('redacoes').doc(document.id);
    
    // Preparar dados para upload (remover campos que não devem ser salvos)
    const uploadData = {
      metadata: document.metadata,
      dados: document.dados,
      searchFields: document.searchFields
    };
    
    await docRef.set(uploadData);
    console.log(`✅ Uploaded: ${document.id} - ${document.metadata.temaResumido}`);
    return { success: true, id: document.id };
  } catch (error) {
    console.error(`❌ Error uploading ${document.id}:`, error.message);
    return { success: false, id: document.id, error: error.message };
  }
}

// Função para fazer upload em lotes (mais eficiente)
async function uploadBatch(documents, batchSize = 10) {
  const results = [];
  
  for (let i = 0; i < documents.length; i += batchSize) {
    const batch = db.batch();
    const batchDocs = documents.slice(i, i + batchSize);
    
    console.log(`\n📦 Processando lote ${Math.floor(i/batchSize) + 1}/${Math.ceil(documents.length/batchSize)}`);
    
    batchDocs.forEach(doc => {
      const docRef = db.collection('redacoes').doc(doc.id);
      const uploadData = {
        metadata: doc.metadata,
        dados: doc.dados,
        searchFields: doc.searchFields
      };
      batch.set(docRef, uploadData);
    });
    
    try {
      await batch.commit();
      console.log(`✅ Lote ${Math.floor(i/batchSize) + 1} enviado com sucesso!`);
      results.push(...batchDocs.map(doc => ({ success: true, id: doc.id })));
    } catch (error) {
      console.error(`❌ Erro no lote ${Math.floor(i/batchSize) + 1}:`, error.message);
      results.push(...batchDocs.map(doc => ({ success: false, id: doc.id, error: error.message })));
    }
    
    // Pequena pausa entre lotes para evitar rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  return results;
}

// Função para verificar se as redações já existem
async function checkExistingRedacoes() {
  try {
    const snapshot = await db.collection('redacoes').get();
    const existingIds = snapshot.docs.map(doc => doc.id);
    console.log(`📊 Redações existentes no Firebase: ${existingIds.length}`);
    return existingIds;
  } catch (error) {
    console.error('❌ Erro ao verificar redações existentes:', error.message);
    return [];
  }
}

// Função principal
async function main() {
  console.log('🚀 Iniciando upload das redações para o Firebase...\n');
  
  // Verificar redações existentes
  const existingIds = await checkExistingRedacoes();
  
  // Filtrar redações que ainda não foram enviadas
  const newDocuments = firestoreStructure.documents.filter(doc => !existingIds.includes(doc.id));
  
  if (newDocuments.length === 0) {
    console.log('✅ Todas as redações já estão no Firebase!');
    return;
  }
  
  console.log(`📋 Novas redações para upload: ${newDocuments.length}`);
  console.log(`📋 Redações já existentes: ${existingIds.length}`);
  
  // Fazer upload das novas redações
  const results = await uploadBatch(newDocuments);
  
  // Relatório final
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  
  console.log('\n📊 RELATÓRIO FINAL:');
  console.log(`✅ Sucessos: ${successful}`);
  console.log(`❌ Falhas: ${failed}`);
  
  if (failed > 0) {
    console.log('\n❌ Redações com erro:');
    results.filter(r => !r.success).forEach(r => {
      console.log(`   - ${r.id}: ${r.error}`);
    });
  }
  
  // Salvar relatório
  const report = {
    timestamp: new Date().toISOString(),
    totalProcessed: results.length,
    successful: successful,
    failed: failed,
    results: results
  };
  
  fs.writeFileSync('upload_report.json', JSON.stringify(report, null, 2));
  console.log('\n📄 Relatório salvo em: upload_report.json');
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { uploadRedacao, uploadBatch, checkExistingRedacoes };
