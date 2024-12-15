// src/components/ScoreEvolution.jsx
import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Paleta de cores para as barras
const COLORS = [
  '#8884d8', // Nota Total
  '#82ca9d', // Competência 1
  '#ffc658', // Competência 2
  '#ff7300', // Competência 3
  '#d0ed57', // Competência 4
  '#a4de6c', // Competência 5
];

// Lista das competências para facilitar a iteração
const COMPETENCIES = [
  { id: 1, name: 'Competência 1' },
  { id: 2, name: 'Competência 2' },
  { id: 3, name: 'Competência 3' },
  { id: 4, name: 'Competência 4' },
  { id: 5, name: 'Competência 5' },
];

function ScoreEvolution({ redacoes }) {
  // Função para preparar os dados do gráfico
  const prepareData = () => {
    return redacoes
      .map((redacao) => {
        const date = new Date(redacao.criadoEm.seconds * 1000);
        const formattedDate = date.toLocaleDateString('pt-BR', {
          month: 'short',
          day: 'numeric',
        });

        // Extrair as notas de cada competência
        const competenciasNotas = {};
        COMPETENCIES.forEach((competencia) => {
          const nota =
            redacao.avaliacao.competencias.find((c) => c.id === competencia.id)
              ?.nota || 0;
          competenciasNotas[`competencia${competencia.id}`] = nota;
        });

        return {
          date: formattedDate,
          totalScore: redacao.avaliacao.pontuacaoTotal,
          ...competenciasNotas,
        };
      })
      .reverse(); // Ordem cronológica
  };

  const data = prepareData();

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-semibold mb-4 text-gray-800">
        Evolução das Notas
      </h3>
      {data.length === 0 ? (
        <p className="text-gray-500">Nenhuma redação disponível para exibir.</p>
      ) : (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="#5550bd" />
            <YAxis stroke="#5550bd" />
            <Tooltip
              contentStyle={{ backgroundColor: '#f5f5f5', borderRadius: '5px' }}
              labelStyle={{ color: '#5550bd', fontWeight: 'bold' }}
            />
            <Legend verticalAlign="top" height={36} />
            {/* Barra para a Nota Total */}
            <Bar
              dataKey="totalScore"
              fill={COLORS[0]}
              name="Nota Total"
              barSize={30}
            />
            {/* Barras para cada Competência */}
            {COMPETENCIES.map((competencia, index) => (
              <Bar
                key={competencia.id}
                dataKey={`competencia${competencia.id}`}
                fill={COLORS[index + 1]}
                name={competencia.name}
                barSize={20}
              />
            ))}
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default ScoreEvolution;


