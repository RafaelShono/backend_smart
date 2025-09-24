// src/components/Avaliacao/Avaliacao.jsx
import React from 'react';
import PropTypes from 'prop-types';

function Avaliacao({ avaliacao }) {
  // Log para depuração
  console.log('Avaliacao recebida:', avaliacao);

  // Verifica se a avaliação está disponível
  if (!avaliacao) {
    return (
      <div className="p-2">
        <h2 className="text-xl font-bold mb-2">Avaliação da Redação</h2>
        <p className="text-gray-500">A avaliação ainda não está disponível.</p>
      </div>
    );
  }

  const { competencias, pontuacaoTotal, comentariosGerais } = avaliacao;

  // Verifica se as competências estão disponíveis e são um array
  if (!competencias || !Array.isArray(competencias) || competencias.length === 0) {
    console.error('Competências não disponíveis ou formato inválido na avaliação:', avaliacao);
    return (
      <div className="p-2">
        <h2 className="text-xl font-bold mb-2">Avaliação da Redação</h2>
        <p className="text-gray-500">Dados de competências indisponíveis.</p>
      </div>
    );
  }

  return (
    <div className="p-2 max-h-[70vh] overflow-auto">
      <h2 className="text-xl font-bold mb-2">Avaliação da Redação</h2>
      <div className="bg-white shadow-md rounded-lg p-4">
        {/* Exibição das Competências */}
        <h3 className="text-lg font-semibold mb-2">Competências:</h3>
        <ul className="space-y-3">
          {competencias.map((competencia) => (
            <li key={competencia.id} className="border-b pb-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{`Competência ${competencia.id}`}</span>
                <span className="font-semibold text-blue-600 text-sm">{`${competencia.nota}/200`}</span>
              </div>
              <p className="mt-1 text-gray-700 text-xs">{competencia.descricao}</p>
            </li>
          ))}
        </ul>

        {/* Pontuação Total */}
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Pontuação Total: {pontuacaoTotal}/1000</h3>
        </div>

        {/* Comentários Gerais */}
        {comentariosGerais ? (
          <>
            <h3 className="text-lg font-semibold mt-4 mb-1">Comentários Gerais:</h3>
            <p className="text-gray-700 text-xs">{comentariosGerais}</p>
          </>
        ) : (
          <p className="text-gray-500 text-xs mt-4">Comentários não disponíveis.</p>
        )}
      </div>
    </div>
  );
}

Avaliacao.propTypes = {
  avaliacao: PropTypes.shape({
    competencias: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.number.isRequired,
        descricao: PropTypes.string.isRequired,
        nota: PropTypes.number.isRequired,
      })
    ).isRequired,
    pontuacaoTotal: PropTypes.number.isRequired,
    comentariosGerais: PropTypes.string,
  }),
};

export default Avaliacao;

