import { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import API_URL from './config'; // Importa a URL centralizada

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const cargo = user?.cargo || 0;
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Fecha o menu ao navegar para outra página
  useEffect(() => {
    setMenuOpen(false);
    setDropdownOpen(false);
  }, [location]);

  const NavLink = ({ to, children }) => {
    return <Link to={to} className="block py-2 px-4 text-slate-800 md:text-white rounded hover:bg-green-50 md:hover:bg-transparent md:hover:text-green-200 transition-colors">{children}</Link>
  };

  return (
    <header className="fixed top-0 left-0 w-full bg-green shadow z-50 font-inter">
      <nav className="max-w-7xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <img src="/Logo.png" alt="Logo SAPO" width={50} height={50} className='bg-amber-50 rounded-2xl' />
          <span className="font-bold text-xl text-white ">SAPO</span>
        </Link>

        {/* Botão do menu mobile */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Abrir menu"
          aria-expanded={menuOpen}
        >
          {menuOpen ? (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Overlay para o menu mobile */}
        {menuOpen && (
          <div 
            className="fixed inset-0 bg-black/30 z-40 md:hidden"
            onClick={() => setMenuOpen(false)}
          ></div>
        )}

        {/* Menu */}
        <ul className={`flex flex-col md:flex-row md:items-center gap-2 md:gap-6 fixed md:static top-0 right-0 h-full w-64 md:w-auto bg-white md:bg-transparent p-6 md:p-0 shadow-xl md:shadow-none transition-transform duration-300 ease-in-out z-50 ${menuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}>
          {/* Links de Navegação */}
          <li>
            <NavLink to="/">Página Inicial</NavLink>
          </li>

          {cargo === 0 && (
            <li>
              <NavLink to="/administracao">Administração</NavLink>
            </li>
          )}
          {cargo === 1 && (
            <li>
              <NavLink to="/meugrupo">Meu Grupo</NavLink>
            </li>
          )}
          {cargo === 2 && (
            <li>
              <NavLink to="/meuspacientes">Meus Pacientes</NavLink>
            </li>
          )}

          {/* Perfil do Usuário com Dropdown */}
          <li className="relative flex items-center gap-3 mt-auto md:mt-0 pt-4 md:pt-0 border-t md:border-none border-slate-200">
            <div
              className="flex items-center gap-3 cursor-pointer md:hover:opacity-80 transition-opacity group"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <img
                src={`${API_URL}/api/uploads/usuarios/${user.id}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col items-start">
                <span className="text-slate-800 md:text-white text-sm font-semibold">
                  {user?.nome}
                </span>
                <span className="text-xs text-slate-500 md:text-green-200">
                  {['Secretária', 'Supervisor', 'Estagiário', 'Coordenador'][cargo] || 'Usuário'}
                </span>
              </div>
            </div>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div 
                className="absolute top-full right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-50 overflow-hidden md:group-hover:block hidden md:block"
                onMouseEnter={() => setDropdownOpen(true)}
                onMouseLeave={() => setDropdownOpen(false)}
              >
                <Link
                  to="/meuperfil"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-3 text-slate-800 hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-sm"
                >
                  👤 Meu Perfil
                </Link>
                
                <Link
                  to="/configuracoes"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-3 text-slate-800 hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-sm"
                >
                  ⚙️ Configurações
                </Link>
                
                <Link
                  to="/alertas"
                  onClick={() => setDropdownOpen(false)}
                  className="block px-4 py-3 text-slate-800 hover:bg-green-50 hover:text-green-700 transition-colors font-medium text-sm"
                >
                  🔔 Alertas
                </Link>

                <hr className="border-slate-200" />
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full text-left px-4 py-3 text-red-600 hover:bg-red-50 transition-colors font-medium text-sm border-none bg-transparent cursor-pointer"
                >
                  🚪 Sair
                </button>
              </div>
            )}

            {/* Versão Mobile - Menu integrado */}
            <div className="md:hidden flex flex-col gap-1 mt-4 pt-4 border-t border-slate-200">
              <Link
                to="/meuperfil"
                onClick={() => setMenuOpen(false)}
                className="block py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors font-medium text-sm"
              >
                👤 Meu Perfil
              </Link>
              
              <Link
                to="/configuracoes"
                onClick={() => setMenuOpen(false)}
                className="block py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors font-medium text-sm"
              >
                ⚙️ Configurações
              </Link>
              
              <Link
                to="/alertas"
                onClick={() => setMenuOpen(false)}
                className="block py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors font-medium text-sm"
              >
                🔔 Alertas
              </Link>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full text-left py-2 px-4 text-red-600 rounded hover:bg-red-50 transition-colors font-medium text-sm border-none bg-transparent cursor-pointer"
              >
                🚪 Sair
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
