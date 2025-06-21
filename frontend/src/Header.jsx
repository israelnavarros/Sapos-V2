import { useState } from 'react';
import { Link } from 'react-router-dom';

// Exemplo de usuário logado (substitua pelo seu contexto ou props)
const mockUser = {
  nome: 'Usuário',
  id_usuario: 1,
  cargo: 1, // 0: secretaria, 1: supervisor, 2: estagiário
  avatarUrl: '/uploads/SAPO - Logo.png',
};

function Header({ user = mockUser, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-white shadow">
      <nav className="container mx-auto flex items-center justify-between py-2">
        <Link to="/" className="flex items-center gap-2">
          <img src="/uploads/SAPO - Logo.png" alt="Logo SAPO" width={60} height={60} className="bg-transparent" />
          <span className="font-bold text-xl text-teal-700">SAPOS</span>
        </Link>
        <button
          className="md:hidden p-2"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <ul className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 absolute md:static top-16 left-0 w-full md:w-auto bg-white md:bg-transparent z-10 transition-all ${menuOpen ? 'block' : 'hidden md:flex'}`}>
          <li>
            <Link to="/" className="text-gray-800 hover:text-teal-600">Página Inicial</Link>
          </li>
          {user.cargo === 0 && (
            <li>
              <Link to="/administracao" className="text-gray-800 hover:text-teal-600">Administração</Link>
            </li>
          )}
          {user.cargo === 1 && (
            <li>
              <Link to="/meu-grupo" className="text-gray-800 hover:text-teal-600">Meu Grupo</Link>
            </li>
          )}
          {user.cargo === 2 && (
            <li>
              <Link to="/meus-pacientes" className="text-gray-800 hover:text-teal-600">Meus Pacientes</Link>
            </li>
          )}
          <li>
            <Link to={`/meuperfil/${user.id_usuario}`} className="flex items-center text-gray-800 hover:text-teal-600">
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-6 h-6 rounded-full mr-2"
              />
              {user.nome}
            </Link>
          </li>
          <li>
            <button
              onClick={onLogout}
              className="text-gray-800 hover:text-red-600"
            >
              Deslogar
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;