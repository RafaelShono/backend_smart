const axios = require('axios');
const cron = require('node-cron');

// Função para gerar temas automaticamente
async function generateThemes() {
  try {
    console.log('🤖 Iniciando geração automática de temas...');
    
    const response = await axios.post('http://localhost:5000/api/generate-themes', {}, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.success) {
      console.log(`✅ ${response.data.message}`);
      console.log(`📊 Temas gerados: ${response.data.themes.length}`);
      
      response.data.themes.forEach((theme, index) => {
        console.log(`   ${index + 1}. ${theme.titulo} (${theme.categoria})`);
      });
    } else {
      console.error('❌ Erro ao gerar temas:', response.data.message);
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message);
  }
}

// Agendar execução automática
// Executa a cada 6 horas (00:00, 06:00, 12:00, 18:00)
cron.schedule('0 */6 * * *', () => {
  console.log('⏰ Executando geração automática de temas...');
  generateThemes();
});

// Executar uma vez imediatamente (para teste)
console.log('🚀 Iniciando agente de geração automática de temas...');
console.log('📅 Agendado para executar a cada 6 horas');
console.log('🔄 Executando primeira geração...');

generateThemes();

// Manter o processo rodando
process.on('SIGINT', () => {
  console.log('\n👋 Encerrando agente de temas...');
  process.exit(0);
});

console.log('⏳ Agente rodando... Pressione Ctrl+C para sair');
