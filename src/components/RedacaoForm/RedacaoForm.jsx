// src/components/RedacaoForm/RedacaoForm.jsx

import React from 'react';

function RedacaoForm({
  temas,
  temaSelecionado,
  handleTemaChange,
  texto,
  setTexto,
  handleSubmit,
  isLoading,
}) {
  // Função para limpar o texto
  const handleLimparFolha = () => {
    setTexto('');
  };

  return (
    <div className="w-full bg-white shadow-lg rounded-lg p-5 relative flex flex-col h-full">
      {/* Cabeçalho da Folha */}
      <div className="absolute top-0 left-0 w-full h-12 bg-blue-600 rounded-t-lg flex items-center justify-center">
        <h2 className="text-white text-xl font-semibold">Folha de Redação</h2>
      </div>

      {/* Seleção de Tema */}
      <div className="mt-16 mb-6">
        <label htmlFor="tema" className="block text-gray-700 font-semibold mb-2">
          Selecionar Tema:
        </label>
        <select
          id="tema"
          value={temaSelecionado ? temaSelecionado.id : ''}
          onChange={handleTemaChange}
          className="w-full border border-gray-300 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">-- Selecione um tema --</option>
          {temas.map((tema) => (
            <option key={tema.id} value={tema.id}>
              {tema.titulo}
            </option>
          ))}
        </select>
      </div>

      {/* Área de Escrita Estilizada */}
      <form onSubmit={handleSubmit} className="flex flex-col flex-grow">
        <div className="relative flex-grow">
          {/* Linhas Horizontais */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(#00000020 0px, #00000020 1px, transparent 1px, transparent 40px)',
              backgroundSize: '100% 41px',
              zIndex: 1,
            }}
          ></div>
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            className="w-full h-full p-4 pt-4 bg-transparent resize-none focus:outline-none z-10 relative"
            placeholder="Digite sua redação aqui..."
            required
            style={{
              lineHeight: '32px',
              fontSize: '1.2rem',
              fontFamily: "'Caveat', cursive",
            }}
          ></textarea>
        </div>

        {/* Contador de Caracteres e Botão Limpar Folha */}
        <div className="flex justify-between mt-2">
          <span className="text-gray-500 text-sm">{texto.length} / 30000</span>
          {/* Botão Limpar Folha */}
          <button
            type="button"
            onClick={handleLimparFolha}
            className="text-red-600 hover:text-red-800 font-semibold"
          >
            Limpar Folha
          </button>
        </div>

        {/* Botão de Envio */}
        <button
          type="submit"
          className="mt-6 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-300"
          disabled={isLoading}
        >
          {isLoading ? 'Enviando...' : 'Enviar Redação'}
        </button>
      </form>
    </div>
  );
}

export default RedacaoForm;
