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
          {/* Links de Navegação - Desktop Only */}
          <li className="hidden md:block">
            <NavLink to="/">Página Inicial</NavLink>
          </li>

          {cargo === 0 && (
            <li className="hidden md:block">
              <NavLink to="/administracao">Administração</NavLink>
            </li>
          )}
          {cargo === 1 && (
            <li className="hidden md:block">
              <NavLink to="/meugrupo">Meu Grupo</NavLink>
            </li>
          )}
          {cargo === 2 && (
            <li className="hidden md:block">
              <NavLink to="/meuspacientes">Meus Pacientes</NavLink>
            </li>
          )}

          {/* Perfil do Usuário com Dropdown */}
          <li className="relative mt-auto md:mt-0 pt-4 md:pt-0 border-t md:border-none border-slate-200 w-full md:w-auto"
              onMouseEnter={() => setDropdownOpen(true)}
              onMouseLeave={() => setDropdownOpen(false)}>
            {/* Desktop - Dropdown com Hover */}
            <div
              className="hidden md:flex items-center gap-3 cursor-pointer group"
            >
              <img
                src={`${API_URL}/api/uploads/usuarios/${user.id}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col items-start">
                <span className="text-white text-sm font-normal">
                  Olá, <span className="font-semibold">{user?.nome.split(' ')[0]}</span>
                </span>
                <span className="text-white text-xs font-normal">
                  {['Secretária', 'Supervisor', 'Estagiário', 'Coordenador'][cargo] || 'Usuário'}
                </span>
              </div>
              <svg className="w-4 h-4 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 10l5 5 5-5z" />
              </svg>
            </div>

            {/* Dropdown Menu Desktop - Fora do trigger */}
            {dropdownOpen && (
              <div 
                className="hidden md:block absolute top-full right-4 mt-2 w-56 bg-white rounded-lg shadow-xl z-50 overflow-hidden"
              >
                <Link
                  to="/meuperfil"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <span className="font-medium">Meu Perfil</span>
                </Link>
                
                <Link
                  to="/configuracoes"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span className="font-medium">Configurações</span>
                </Link>
                
                <Link
                  to="/alertas"
                  onClick={() => setDropdownOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-slate-800 hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  <span className="font-medium">Alertas</span>
                </Link>

                <hr className="border-slate-200" />
                
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    handleLogout();
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            )}

            {/* Mobile - Menu integrado - Visual apenas */}
            <div className="md:hidden flex items-center gap-3 py-3 px-4">
              <img
                src={`${API_URL}/api/uploads/usuarios/${user.id}`}
                alt="Profile"
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex flex-col items-start">
                <span className="text-slate-800 text-sm font-semibold">
                  Olá, {user?.nome.split(' ')[0]}
                </span>
                <span className="text-xs text-slate-600">
                  {['Secretária', 'Supervisor', 'Estagiário', 'Coordenador'][cargo] || 'Usuário'}
                </span>
              </div>
            </div>

            {/* Mobile - Seção Sistema */}
            <div className="md:hidden pt-3">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sistema</div>
              
              <Link
                to="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-3m0 0l7-4 7 4M5 9v10a1 1 0 001 1h12a1 1 0 001-1V9m-9 4l4-2m0 0l4 2m-4-2v4" />
                </svg>
                <span className="font-medium text-sm">Página Inicial</span>
              </Link>

              {cargo === 0 && (
                <Link
                  to="/administracao"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                  </svg>
                  <span className="font-medium text-sm">Administração</span>
                </Link>
              )}
              {cargo === 1 && (
                <Link
                  to="/meugrupo"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 12H9m6 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium text-sm">Meu Grupo</span>
                </Link>
              )}
              {cargo === 2 && (
                <Link
                  to="/meuspacientes"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <span className="font-medium text-sm">Meus Pacientes</span>
                </Link>
              )}
            </div>

            {/* Mobile - Divisor */}
            <div className="md:hidden mx-4 my-3 border-t border-slate-200"></div>

            {/* Mobile - Seção Sua Conta */}
            <div className="md:hidden pb-3">
              <div className="px-4 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">Sua Conta</div>
              
              <Link
                to="/meuperfil"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span className="font-medium text-sm">Minha Conta</span>
              </Link>
              
              <Link
                to="/configuracoes"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium text-sm">Configurações</span>
              </Link>
              
              <Link
                to="/alertas"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-3 py-2 px-4 text-slate-800 rounded hover:bg-green-50 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="#3C7E61" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <span className="font-medium text-sm">Alertas</span>
              </Link>

              <div className="mx-4 my-3 border-t border-slate-200"></div>

              <button
                onClick={() => {
                  setMenuOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-3 py-2 px-4 text-red-600 rounded hover:bg-red-50 transition-colors border-none bg-transparent cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span className="font-medium text-sm">Sair</span>
              </button>
            </div>
          </li>
        </ul>
      </nav>
    </header>
  );
}

export default Header;
