import React from 'react';
import { FaPenFancy, FaSearch, FaChartLine, FaBolt, FaGlobe, FaBullseye, FaUsers, FaGraduationCap, FaCheckCircle, FaStar } from 'react-icons/fa';

function App() {
    return (
        <div className="font-sans">
            {/* Hero Section */}
            <section
                className="text-white py-20 relative overflow-hidden"
                style={{
                    backgroundColor: '#19376D',
                }}
            >
                 <div className="absolute inset-0 bg-gradient-to-r from-blue-700 via-blue-500 to-blue-900 opacity-20"></div>
                <div className="container mx-auto px-6 relative z-10">
                     <div className="flex flex-wrap items-center">
                        <div className="w-full md:w-1/2 mb-8 md:mb-0">
                            <h1 className="text-5xl font-bold mb-4 leading-tight">
                            <span className="text-secondary-500">Destrave</span> sua Aprovação no ENEM com IA
                            </h1>
                            <p className="text-xl mb-8 italic">
                            Redações que Conquistam Vagas. Feedback Inteligente que Transforma.
                            </p>
                            <a
                                href="/praticar"
                                className="px-8 py-4 rounded-full font-semibold hover:opacity-90 text-white transition duration-300 ease-in-out transform hover:scale-105"
                                style={{
                                    backgroundColor: '#57CC99', // Verde vibrante
                                    display: 'inline-block',
                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                                }}
                            >
                                Comece Agora
                            </a>
                        </div>
                       <div className="w-full md:w-1/2">
                            <img
                                src="https://i.imgur.com/7v7z67M.png"
                                alt="Hero"
                                className="max-w-full rounded-lg shadow-2xl ml-auto"
                                style={{
                                    maxWidth: '500px',
                                    filter: 'drop-shadow(5px 5px 5px rgba(0,0,0,0.3))'
                                }}
                             />
                         </div>
                    </div>
                </div>
                 <div className="absolute top-0 left-0 w-full h-full opacity-10"
                     style={{
                         backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 50%, transparent 100%)`,
                     }}
                 ></div>
            </section>

            {/* Dados Relevantes */}
            <section className="py-16 bg-gray-100">
              <div className="container mx-auto px-6 text-center">
                <h2 className="text-4xl font-bold mb-12 text-gray-800">
                      Entenda o ENEM para se destacar
                </h2>

                <div className="flex flex-wrap justify-center items-start text-gray-800">
                    <div className="w-full sm:w-1/3 md:w-1/4 px-4 mb-8">
                        <FaUsers size={48} className="mx-auto mb-4 text-primary-500" />
                        <h3 className="text-2xl font-semibold mb-2">61,3% Mulheres</h3>
                        <p className="text-gray-600">Maioria feminina marcando presença.</p>
                      </div>
                    <div className="w-full sm:w-1/3 md:w-1/4 px-4 mb-8">
                        <FaGraduationCap size={48} className="mx-auto mb-4 text-primary-500" />
                        <h3 className="text-2xl font-semibold mb-2">48,2% Já Formados</h3>
                         <p className="text-gray-600">Experiência de quem busca mais.</p>
                    </div>
                      <div className="w-full sm:w-1/3 md:w-1/4 px-4 mb-8">
                        <FaBolt size={48} className="mx-auto mb-4 text-primary-500" />
                        <h3 className="text-2xl font-semibold mb-2">63% Isentos</h3>
                        <p className="text-gray-600">Acesso facilitado para muitos.</p>
                     </div>
                     <div className="w-full sm:w-1/3 md:w-1/4 px-4 mb-8">
                        <FaPenFancy size={48} className="mx-auto mb-4 text-primary-500" />
                        <h3 className="text-2xl font-semibold mb-2">26,4% Com 17 Anos</h3>
                        <p className="text-gray-600">Jovens trilhando seus futuros.</p>
                     </div>
                  </div>
                </div>
           </section>

            {/* Seção Como Funciona */}
           <section id="como-funciona" className="py-20 relative overflow-hidden" style={{ backgroundColor: '#f0f8ff' }}>
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-100 via-transparent to-indigo-50 opacity-10"></div>
                <div className="container mx-auto px-6 text-center relative z-10">
                    <h2
                        className="text-4xl font-bold mb-12 text-gray-800"
                    >
                       Prepare-se com Inteligência e Precisão
                    </h2>
                    <div className="flex flex-wrap justify-center">
                        {/* Passo 1 */}
                        <div className="w-full md:w-1/3 px-6 mb-8">
                          <div className="relative">
                                <FaPenFancy size={48} className="mb-4 text-secondary-500  mx-auto" />
                                <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-secondary-200 opacity-20 animate-pulse"
                                    style={{ animationDelay: '1s'}}></div>
                          </div>

                            <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                                1. Escreva sua Redação
                            </h3>
                            <p className="text-gray-600">
                                Comece a praticar com temas relevantes do ENEM.
                            </p>
                        </div>
                        {/* Passo 2 */}
                        <div className="w-full md:w-1/3 px-6 mb-8">
                          <div className="relative">
                            <FaSearch size={48} className="mb-4 text-secondary-500 mx-auto" />
                              <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-secondary-200 opacity-20 animate-pulse"
                                style={{ animationDelay: '2s'}}></div>
                          </div>

                            <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                                2. Feedback Detalhado por IA
                            </h3>
                            <p className="text-gray-600">
                                Nossa IA analisa sua redação como um especialista.
                            </p>
                        </div>
                        {/* Passo 3 */}
                        <div className="w-full md:w-1/3 px-6 mb-8">
                           <div className="relative">
                              <FaChartLine size={48} className="mb-4 text-secondary-500 mx-auto" />
                             <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-secondary-200 opacity-20 animate-pulse"
                                style={{ animationDelay: '3s'}}></div>
                          </div>
                            <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                                3. Rumo à Perfeição
                            </h3>
                            <p className="text-gray-600">
                                 Acompanhe seu progresso e veja sua evolução.
                            </p>
                        </div>
                    </div>
                      <div className="mt-12">
                        <img
                            src="https://i.imgur.com/zRz94j0.png"
                             alt="Inteligência Artificial"
                             className="max-w-full rounded-lg shadow-lg mx-auto"
                             style={{ maxWidth: '400px',filter: 'drop-shadow(5px 5px 5px rgba(0,0,0,0.3))'}}
                          />
                      </div>
                </div>
            </section>

            {/* Seção Benefícios */}
          <section id="beneficios" className="py-20 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-gray-50 to-gray-100 opacity-10"></div>
                  <div className="container mx-auto px-6 text-center relative z-10">
                    <h2
                        className="text-4xl font-bold mb-12 text-gray-800"
                    >
                        Por que Nosso Método é a Escolha Certa?
                    </h2>
                    <div className="flex flex-wrap justify-center">
                        {/* Benefício 1 */}
                        <div className="w-full md:w-1/3 px-6 mb-8">
                             <div className="relative">
                             <FaBolt size={48} className="mb-4 text-secondary-500 mx-auto" />
                              <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-secondary-200 opacity-20 animate-pulse"
                                 style={{ animationDelay: '1s'}}></div>
                          </div>

                            <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                                Feedback Instantâneo
                            </h3>
                            <p className="text-gray-600">
                                Análises rápidas que otimizam seu aprendizado.
                            </p>
                        </div>
                        {/* Benefício 2 */}
                        <div className="w-full md:w-1/3 px-6 mb-8">
                         <div className="relative">
                           <FaGlobe size={48} className="mb-4 text-secondary-500 mx-auto" />
                           <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-secondary-200 opacity-20 animate-pulse"
                                 style={{ animationDelay: '2s'}}></div>
                           </div>
                            <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                                IA de Última Geração
                            </h3>
                            <p className="text-gray-600">
                                Tecnologia que reflete os critérios do ENEM.
                            </p>
                        </div>
                        {/* Benefício 3 */}
                        <div className="w-full md:w-1/3 px-6 mb-8">
                          <div className="relative">
                              <FaBullseye size={48} className="mb-4 text-secondary-500 mx-auto" />
                               <div className="absolute top-0 left-0 w-full h-full rounded-full border-2 border-secondary-200 opacity-20 animate-pulse"
                                 style={{ animationDelay: '3s'}}></div>
                           </div>
                            <h3 className="text-2xl font-semibold mb-2 text-gray-800">
                                Alcance sua Meta
                            </h3>
                            <p className="text-gray-600">
                                Ferramentas personalizadas para seu sucesso no ENEM.
                            </p>
                        </div>
                    </div>
                     <div className="mt-12">
                        <img
                             src="https://i.imgur.com/aQ1s9yK.png"
                             alt="Acompanhe seu Progresso"
                             className="max-w-full rounded-lg shadow-lg mx-auto"
                            style={{ maxWidth: '400px', filter: 'drop-shadow(5px 5px 5px rgba(0,0,0,0.3))'}}/>
                        </div>
                </div>

            </section>

             {/* Depoimentos */}
             <section className="py-16 bg-gray-100">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-bold mb-12 text-gray-800">
                        O que Dizem Nossos Alunos?
                    </h2>

                    <div className="flex flex-wrap justify-center">
                        {/* Depoimento 1 */}
                        <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <p className="text-gray-700 italic mb-4">
                                 "O feedback da IA mudou meu jeito de escrever. Consegui entender meus erros e acertos, e minhas redações evoluíram muito!"
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                    <div className="flex flex-col items-start">
                                      <span className="font-semibold text-gray-800">Maria S.</span>
                                      <span className="text-gray-500 text-sm">Aprovada em Medicina</span>
                                   </div>

                                    <div className="flex items-center">
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400" />
                                    </div>
                                </div>

                            </div>
                        </div>

                         {/* Depoimento 2 */}
                        <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8">
                            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <p className="text-gray-700 italic mb-4">
                                "Nunca imaginei que IA poderia ser tão útil! A plataforma é fácil de usar e o feedback é super completo. Indico para todos que querem ir bem no ENEM!"
                                </p>

                                <div className="flex items-center justify-between mt-4">
                                 <div className="flex flex-col items-start">
                                   <span className="font-semibold text-gray-800">João P.</span>
                                    <span className="text-gray-500 text-sm">Aprovado em Direito</span>
                                 </div>
                                    <div className="flex items-center">
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                         <FaStar className="text-yellow-400 mr-1" />
                                    </div>
                                </div>
                            </div>
                        </div>
                         {/* Depoimento 3 */}
                        <div className="w-full md:w-1/2 lg:w-1/3 px-4 mb-8">
                           <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                                <p className="text-gray-700 italic mb-4">
                               "A plataforma me deu a segurança que eu precisava! O acompanhamento do meu progresso foi fundamental para eu conseguir aumentar minha nota. Agradeço demais!"
                                </p>
                                <div className="flex items-center justify-between mt-4">
                                 <div className="flex flex-col items-start">
                                      <span className="font-semibold text-gray-800">Ana L.</span>
                                       <span className="text-gray-500 text-sm">Aprovada em Engenharia</span>
                                    </div>
                                    <div className="flex items-center">
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                        <FaStar className="text-yellow-400 mr-1" />
                                         <FaStar className="text-yellow-400 " />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
           </section>

              {/* Seção Call to Action */}
            <section className="py-20 bg-gradient-to-r from-blue-100 via-blue-50 to-blue-100">
                <div className="container mx-auto px-6 text-center">
                      <h2 className="text-4xl font-bold mb-8 text-gray-800">
                         Não Espere Mais para Garantir sua Vaga!
                    </h2>
                    <p className="mb-8 text-gray-600">
                       Aumente suas chances de aprovação com o melhor feedback de IA.
                    </p>
                     <a
                         href="/praticar"
                         className="px-8 py-4 rounded-full font-semibold hover:opacity-90 text-white transition duration-300 ease-in-out transform hover:scale-105"
                          style={{
                              backgroundColor: '#57CC99',
                              display: 'inline-block',
                              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.2)',
                         }}
                      >
                        Experimente Grátis e Comece a Transformar Seu Futuro
                    </a>

                 </div>
            </section>

            {/* Seção Contato */}
            <section id="contato" className="py-20 bg-gray-100">
                <div className="container mx-auto px-6 text-center">
                    <h2
                        className="text-4xl font-bold mb-8 text-gray-800"
                    >
                        Fale Conosco
                    </h2>
                    <p className="mb-4 text-gray-600">
                        Dúvidas ou sugestões? Estamos aqui para ajudar!
                    </p>
                    <a
                        href="mailto:contato@redacaosmart.com"
                        style={{ color: '#57CC99' }}
                        className="hover:underline"
                    >
                        contato@redacaosmart.com.br
                    </a>
                </div>
            </section>

            {/* Footer */}
            <footer
                className="text-gray-300 py-6"
                style={{ backgroundColor: '#19376D' }}
            >
                <div className="container mx-auto px-6 text-center">
                    <p>© {new Date().getFullYear()} Redação Smart. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;