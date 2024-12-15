// src/App.jsx

import React from 'react';
import { FaPenFancy, FaSearch, FaChartLine, FaBolt, FaGlobe, FaBullseye } from 'react-icons/fa';

function App() {
  return (
    <div>
      {/* Hero Section */}
      <section
        className="text-white py-20"
        style={{
          backgroundColor: '#124f62', // Cor principal viva
        }}
      >
        <div className="container mx-auto px-6 text-center">
          <h1 className="text-5xl font-bold mb-4">Redação Smart</h1>
          <p className="text-2xl mb-8 italic">
            A maneira inteligente de aprimorar suas habilidades de escrita para o Enem.
          </p>
          <a
            href="/praticar"
            className="px-6 py-3 rounded-full font-semibold hover:opacity-90"
            style={{
              backgroundColor: '#4cad87', // Botão com cor viva
              color: '#ffffff',
            }}
          >
            Comece a Praticar
          </a>
        </div>
      </section>

      {/* Seção Como Funciona */}
      <section id="como-funciona" className="py-20" style={{ backgroundColor: '#dbe4f2' }}>
        <div className="container mx-auto px-6 text-center">
          <h2
            className="text-4xl font-bold mb-12"
            style={{ color: '#124f62' }}
          >
            Como Funciona
          </h2>
          <div className="flex flex-wrap justify-center">
            {/* Passo 1 */}
            <div className="w-full md:w-1/3 px-6 mb-8">
              <FaPenFancy size={48} color="#4cad87" className="mb-4" />
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#124f62' }}>
                1. Escreva Sua Redação
              </h3>
              <p style={{ color: '#6c6a81' }}>
                Escolha um tema e escreva sua redação diretamente no site.
              </p>
            </div>
            {/* Passo 2 */}
            <div className="w-full md:w-1/3 px-6 mb-8">
              <FaSearch size={48} color="#4cad87" className="mb-4" />
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#124f62' }}>
                2. Receba Feedback Inteligente
              </h3>
              <p style={{ color: '#6c6a81' }}>
                Nosso sistema utiliza IA para fornecer feedback detalhado.
              </p>
            </div>
            {/* Passo 3 */}
            <div className="w-full md:w-1/3 px-6 mb-8">
              <FaChartLine size={48} color="#4cad87" className="mb-4" />
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#124f62' }}>
                3. Evolua Constantemente
              </h3>
              <p style={{ color: '#6c6a81' }}>
                Utilize o feedback para melhorar e acompanhe seu progresso.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seção Benefícios */}
      <section id="beneficios" className="py-20" style={{ backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-6 text-center">
          <h2
            className="text-4xl font-bold mb-12"
            style={{ color: '#124f62' }}
          >
            Por que Escolher o Redação Smart?
          </h2>
          <div className="flex flex-wrap justify-center">
            {/* Benefício 1 */}
            <div className="w-full md:w-1/3 px-6 mb-8">
              <FaBolt size={48} color="#4cad87" className="mb-4" />
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#124f62' }}>
                Feedback em Tempo Real
              </h3>
              <p style={{ color: '#6c6a81' }}>
                Receba análises instantâneas para acelerar seu aprendizado.
              </p>
            </div>
            {/* Benefício 2 */}
            <div className="w-full md:w-1/3 px-6 mb-8">
              <FaGlobe size={48} color="#4cad87" className="mb-4" />
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#124f62' }}>
                Tecnologia Avançada
              </h3>
              <p style={{ color: '#6c6a81' }}>
                Utilizamos inteligência artificial para oferecer insights precisos.
              </p>
            </div>
            {/* Benefício 3 */}
            <div className="w-full md:w-1/3 px-6 mb-8">
              <FaBullseye size={48} color="#4cad87" className="mb-4" />
              <h3 className="text-2xl font-semibold mb-2" style={{ color: '#124f62' }}>
                Foco no Seu Sucesso
              </h3>
              <p style={{ color: '#6c6a81' }}>
                Personalize sua experiência e alcance seus objetivos.
              </p>
            </div>
          </div>
        </div>
        
      </section>

      {/* Seção Contato */}
      <section id="contato" className="py-20" style={{ backgroundColor: '#dbe4f2' }}>
        <div className="container mx-auto px-6 text-center">
          <h2
            className="text-4xl font-bold mb-8"
            style={{ color: '#124f62' }}
          >
            Entre em Contato
          </h2>
          <p className="mb-4" style={{ color: '#6c6a81' }}>
            Tem alguma dúvida ou sugestão? Fale conosco!
          </p>
          <a
            href="mailto:contato@redacaosmart.com"
            style={{ color: '#4cad87' }}
            className="hover:underline"
          >
            contato@redacaosmart.com.br
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="text-gray-300 py-6"
        style={{ backgroundColor: '#124f62' }}
      >
        <div className="container mx-auto px-6 text-center">
          <p>&copy; {new Date().getFullYear()} Redação Smart. Todos os direitos reservados.</p>
        </div>
        
      </footer>
      
    </div>
    
  );
}

export default App;
