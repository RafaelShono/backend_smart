// src/components/PracticePage.jsx

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { db } from '../../firebaseConfig';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  increment,
} from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import RedacaoForm from '../RedacaoForm/RedacaoForm';
import Avaliacao from '../Avalicao/Avaliacao';
import Plano from '../PlanoPago/Plano'

function PracticePage() {
  const [texto, setTexto] = useState('');
  const [avaliacao, setAvaliacao] = useState(null);
  const [temas, setTemas] = useState([]);
  const [temaSelecionado, setTemaSelecionado] = useState(null);
  const { usuarioAtual } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();

  // Estado para armazenar a largura da Área de Redação
  const [redacaoWidth, setRedacaoWidth] = useState(70); // Percentual inicial
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  // Fetching themes from Firestore on component mount
  useEffect(() => {
    const fetchTemas = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'temas'));
        const temasData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTemas(temasData);
      } catch (error) {
        console.error('Erro ao buscar temas:', error);
      }
    };

    fetchTemas();
  }, []);

  // Handle theme selection
  const handleTemaChange = (e) => {
    const temaId = e.target.value;
    const tema = temas.find((t) => t.id === temaId);
    setTemaSelecionado(tema);
    setAvaliacao(null); // Limpa a avaliação anterior ao mudar de tema
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verifica o plano do usuário
    const userRef = doc(db, 'users', usuarioAtual.uid);
    const userSnap = await getDoc(userRef);
    const userData = userSnap.data();

    if (!userData.planoAtivo && userData.redacoesEnviadas >= 5) {
      alert(
        'Você atingiu o limite de 2 redações gratuitas. Por favor, faça um upgrade para continuar.'
      );
      navigate('Plano');
      return;
    }

    if (!temaSelecionado) {
      alert('Por favor, selecione um tema antes de enviar a redação.');
      return;
    }
    if (texto.trim() === '') {
      alert('A redação não pode estar vazia.');
      return;
    }
    setIsLoading(true);
    setErrorMessage('');
    try {
      // Obtém o token de autenticação do usuário
      const token = await usuarioAtual.getIdToken();

      // Envia a redação e os detalhes do tema para o backend Express
      const response = await axios.post(
        'http://localhost:5000/analyze',
        {
          text: texto,
          tema: {
            titulo: temaSelecionado.titulo,
            descricao: temaSelecionado.descricao,
            imagem: temaSelecionado.imagem,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log('Resposta do backend:', response.data.analysis);
      setAvaliacao(response.data.analysis);

      // Salva a redação e a avaliação no Firestore
      await addDoc(collection(db, 'redacoes'), {
        usuarioId: usuarioAtual.uid,
        nome: userData.nome,
        fotoURL: userData.fotoURL,
        texto,
        avaliacao: response.data.analysis,
        temaId: temaSelecionado.id,
        criadoEm: new Date(),
      });

      // Atualiza o número de redações enviadas pelo usuário
      await updateDoc(userRef, {
        redacoesEnviadas: increment(1),
      });

      // Opcional: Limpar o campo de texto após o envio
      setTexto('');
    } catch (error) {
      console.error('Erro ao enviar a redação:', error);
      setErrorMessage(
        'Ocorreu um erro ao enviar a redação. Tente novamente mais tarde.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Funções para manejar o redimensionamento
  const handleMouseDown = (e) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current) return;
    if (!containerRef.current) return;

    const containerWidth = containerRef.current.offsetWidth;
    let newRedacaoWidth = (e.clientX / containerWidth) * 100;

    // Definir limites de largura (20% a 80%)
    if (newRedacaoWidth < 20) newRedacaoWidth = 20;
    if (newRedacaoWidth > 80) newRedacaoWidth = 80;

    setRedacaoWidth(newRedacaoWidth);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Funções para manejar eventos de toque (mobile)
  const handleTouchStart = (e) => {
    e.preventDefault();
    isDragging.current = true;
  };

  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    if (!containerRef.current) return;

    const touch = e.touches[0];
    const containerWidth = containerRef.current.offsetWidth;
    let newRedacaoWidth = (touch.clientX / containerWidth) * 100;

    // Definir limites de largura (20% a 80%)
    if (newRedacaoWidth < 20) newRedacaoWidth = 20;
    if (newRedacaoWidth > 80) newRedacaoWidth = 80;

    setRedacaoWidth(newRedacaoWidth);
  };

  const handleTouchEnd = () => {
    isDragging.current = false;
  };

  // Adicionar event listeners para mousemove, mouseup, touchmove, touchend
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    // Remover event listeners ao desmontar o componente
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="flex flex-row h-screen w-full overflow-hidden"
      style={{
        userSelect: isDragging.current ? 'none' : 'auto',
        cursor: isDragging.current ? 'col-resize' : 'auto',
      }}
    >
      {/* Área de Redação */}
      <div
        className="bg-gray-100 flex flex-col justify-center items-center overflow-auto"
        style={{ width: `${redacaoWidth}%` }}
      >
        <RedacaoForm
          temas={temas}
          temaSelecionado={temaSelecionado}
          handleTemaChange={handleTemaChange}
          texto={texto}
          setTexto={setTexto}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
        />
        {errorMessage && (
          <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
            {errorMessage}
          </div>
        )}
      </div>

      {/* Barra Divisória */}
      <div
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        className="w-2 bg-gray-300 cursor-col-resize hover:bg-gray-400 transition-colors duration-200 flex-shrink-0"
      >
        {/* Opcional: Adicionar uma pequena linha ou ícone para melhor indicação */}
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-1 h-6 bg-gray-500 rounded"></div>
        </div>
      </div>

      {/* Área de Avaliação */}
      <div
        className="bg-white flex flex-col p-6 overflow-auto"
        style={{ width: `${100 - redacaoWidth}%` }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <svg
              className="animate-spin h-8 w-8 text-blue-500"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v8H4z"
              ></path>
            </svg>
            <p className="ml-2 text-blue-500">Analisando...</p>
          </div>
        ) : avaliacao ? (
          <Avaliacao avaliacao={avaliacao} />
        ) : temaSelecionado ? (
          <div>
            <h2 className="text-2xl font-bold mb-4">{temaSelecionado.titulo}</h2>
            {temaSelecionado.imagem && (
              <img
                src={temaSelecionado.imagem}
                alt="Imagem do tema"
                className="mb-4 w-full h-auto rounded"
              />
            )}
            <p>{temaSelecionado.descricao}</p>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">Selecione um tema para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PracticePage;
