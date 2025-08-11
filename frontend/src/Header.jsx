import { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const cargo = user?.cargo || 0;

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow z-50">

      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/src/assets/Logo.png" alt="Logo SAPO" width={50} height={50} />
          <span className="font-bold text-xl text-teal-700">SAPOS</span>
        </Link>

        {/* Botão do menu mobile */}
        <button
          className="md:hidden p-2 text-gray-700"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
        >
          <span className="material-icons">menu</span>
        </button>

        {/* Menu */}
        <ul className={`flex flex-col md:flex-row md:items-center gap-4 md:gap-6 absolute md:static top-full left-0 w-full md:w-auto bg-white md:bg-transparent px-4 md:px-0 py-4 md:py-0 transition-all duration-300 ease-in-out ${menuOpen ? 'block' : 'hidden md:flex'}`}>
          <li>
            <Link to="/" className="text-gray-800 hover:text-teal-600">Página Inicial</Link>
          </li>

          {cargo === 0 && (
            <li>
              <Link to="/administracao" className="text-gray-800 hover:text-teal-600">Administração</Link>
            </li>
          )}
          {cargo === 1 && (
            <li>
              <Link to="/meugrupo" className="text-gray-800 hover:text-teal-600">Meu Grupo</Link>
            </li>
          )}
          {cargo === 2 && (
            <li>
              <Link to="/meus-pacientes" className="text-gray-800 hover:text-teal-600">Meus Pacientes</Link>
            </li>
          )}

          <li>
            <Link to="/meuperfil/" className="flex items-center text-gray-800 hover:text-teal-600">
              <img
                src={`/api/uploads/usuarios/${user.id}`}
                alt="Profile"
                className="w-6 h-6 rounded-full mr-2"
              />
              {user?.nome}
            </Link>
          </li>

          <li>
            <button onClick={handleLogout} className="text-gray-800 hover:text-red-600">
              Deslogar
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
