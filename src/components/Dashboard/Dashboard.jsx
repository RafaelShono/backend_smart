// src/components/Dashboard.jsx
// src/components/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { db } from '../../firebaseConfig';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import ScoreEvolution from '../ScoreEvolution/ScoreEvolution';
import ScoreDistribution from '../ScoreEvolution/ScoreEvolution';
import Leaderboard from '../LeaderBoard/LeaderBoard';
import Achievements from '../Achievements/Achievements';

function Dashboard() {
  const [redacoes, setRedacoes] = useState([]);
  const [historicalScores, setHistoricalScores] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const { usuarioAtual } = useAuth();

  useEffect(() => {
    const fetchRedacoes = async () => {
      try {
        const q = query(
          collection(db, 'redacoes'),
          where('usuarioId', '==', usuarioAtual.uid),
          orderBy('criadoEm', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const redacoesData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setRedacoes(redacoesData);
      } catch (error) {
        console.error('Erro ao buscar redações:', error);
      }
    };

    const fetchHistoricalScores = async () => {
      try {
        const q = query(collection(db, 'historicalScores'), orderBy('year', 'desc'));
        const querySnapshot = await getDocs(q);
        const historicalData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setHistoricalScores(historicalData);
      } catch (error) {
        console.error('Erro ao buscar scores históricos:', error);
      }
    };

    const fetchLeaderboard = async () => {
      try {
        const q = query(
          collection(db, 'redacoes'),
          orderBy('avaliacao.pontuacaoTotal', 'desc'),
          limit(10)
        );
        const querySnapshot = await getDocs(q);
        const leaderboardData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setLeaderboard(leaderboardData);
      } catch (error) {
        console.error('Erro ao buscar leaderboard:', error);
      }
    };

    if (usuarioAtual) {
      fetchRedacoes();
      fetchHistoricalScores();
      fetchLeaderboard();
    }
  }, [usuarioAtual]);

  return (
    <div className="container mx-auto p-6 flex flex-col md:flex-row">
      {/* Main Content */}
      <div className="flex-1 mr-0 md:mr-4">
        <h2 className="text-3xl font-bold mb-6">Meu Painel de Desempenho</h2>
        <Achievements redacoes={redacoes} />
        <ScoreEvolution redacoes={redacoes} />
       
      </div>

      {/* Leaderboard Sidebar */}
      <div className="w-full md:w-1/3 mt-6 md:mt-0">
        <Leaderboard leaderboard={leaderboard} />
      </div>
    </div>
  );
}

export default Dashboard;
