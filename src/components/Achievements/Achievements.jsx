// src/components/Achievements.jsx
import React from 'react';

function Achievements({ redacoes }) {
  // Define achievement criteria
  const achievements = [
    {
      id: 1,
      name: 'Iniciante',
      description: 'Envie sua primeira redação.',
      condition: redacoes.length >= 1,
      icon: '🎉',
    },
    {
      id: 2,
      name: 'Melhoria Contínua',
      description: 'Melhore sua nota total em pelo menos 100 pontos.',
      condition: redacoes.length >= 2 && (redacoes[0].avaliacao.pontuacaoTotal - redacoes[1].avaliacao.pontuacaoTotal) >= 100,
      icon: '📈',
    },
    {
      id: 3,
      name: 'Especialista em Competência',
      description: 'Alcance 200 pontos em pelo menos 3 competências.',
      condition: redacoes.some((redacao) => redacao.avaliacao.competencias.filter(c => c.nota === 200).length >= 3),
      icon: '🏅',
    },
    // Adicione mais conquistas conforme necessário
  ];

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-4">Conquistas</h3>
      <div className="flex space-x-4">
        {achievements.map((achievement) => (
          <div key={achievement.id} className={`p-4 rounded shadow ${achievement.condition ? 'bg-yellow-100' : 'bg-gray-100'}`}>
            <div className="text-3xl mb-2">{achievement.icon}</div>
            <h4 className="text-lg font-bold">{achievement.name}</h4>
            <p className="text-sm">{achievement.description}</p>
            {achievement.condition && <span className="text-green-500 text-sm">Conquistado!</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Achievements;
