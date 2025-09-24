// src/components/Header.jsx
import React from 'react';
import { Link } from 'react-router-dom';


function Header() {
  return (
    <header className="bg-white shadow">
      <div className="container mx-auto p-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">Redação Smart</Link>
        <nav>
          <ul className="flex space-x-4">
          <li><Link to="/login" className="hover:text-blue-500">Login</Link></li>
          <li><Link to="/cadastro" className="hover:text-blue-500">Cadastrar-se</Link></li>
          <li><a href="/plano" className="hover:text-blue-500">Assinar</a></li>
            <li><Link to="/praticar" className="hover:text-blue-500">Praticar</Link></li>
            <li><Link to="/dashboard" className="hover:text-blue-500">Dashboard</Link></li>
            <li><Link to="/minhasRedacoes" className="hover:text-blue-500">Minhas Redações</Link></li>
          <ul className="flex space-x-4">
            <li><a href="/contato" className="hover:text-blue-500">Contato</a></li>
          </ul>
     
    
          </ul>
        </nav>
      </div>
    </header>
  );
}

export default Header;
