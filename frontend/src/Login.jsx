import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import API_URL from './config'; // Importa a URL centralizada

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');
  const navigate = useNavigate();
  const { user, setUser } = useContext(AuthContext);

  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      const response = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (data.success) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/');
      } else {
        setMensagem(data.message);
      }
    } catch (err) {
      setMensagem('Erro ao conectar com o servidor. ' + err.message);
    }
  };

  return (
    <div className="flex flex-col md:flex-row w-screen min-h-screen bg-background">
      {/* Seção Esquerda (Verde) */}
      <div className="relative flex-grow-0 md:flex-1 bg-green flex flex-col justify-center items-center text-white p-8 md:p-10">
        {/* Logo no canto superior esquerdo */}
        <div className="absolute top-6 left-6 md:top-8 md:left-8 bg-white/90 p-2 md:p-3 rounded-2xl">
          <img src="src/assets/Logo.png" alt="Logo SAPO" className="w-8 h-8 md:w-12 md:h-12" />
        </div>

        {/* Slogan quebrado em linhas */}
        <p className="text-4xl md:text-5xl font-bold leading-tight text-center">
          Onde a<br />
          prática<br />
          encontra o<br />
          cuidado<br />
          humano.
        </p>
      </div>


      {/* Direita (bege/login) */}
      <div className="flex-1 bg-background flex flex-col justify-center items-center p-8 md:p-10 text-center">

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
          <h2 className="text-2xl font-semibold text-gray-700">Login</h2>

          <div>
            <label className="block text-sm font-medium text-gray-600 text-left">E-mail</label>
            <input
              type="email"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 text-left">Senha</label>
            <input
              type="password"
              className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-400"
              value={senha}
              onChange={e => setSenha(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-green text-white py-2 rounded-md hover:bg-green-600 cursor-pointer transition-all font-semibold"
          >
            Entrar
          </button>

          {mensagem && (
            <div className="bg-red-100 text-red-700 p-3 rounded-md text-sm text-center">
              {mensagem}
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default Login;
