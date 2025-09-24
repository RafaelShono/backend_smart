// src/context/AuthContext.jsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig'

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [usuarioAtual, setUsuarioAtual] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (usuario) => {
      setUsuarioAtual(usuario);
      setCarregando(false);
    });

    return unsubscribe;
  }, []);

  if (carregando) {
    return <p>Carregando...</p>;
  }

  return (
    <AuthContext.Provider value={{ usuarioAtual }}>
      {children}
    </AuthContext.Provider>
  );
}
