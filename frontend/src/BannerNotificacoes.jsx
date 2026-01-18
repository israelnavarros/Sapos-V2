import { useEffect, useState, useContext } from 'react';
import API_URL from './config';
import { AuthContext } from './AuthContext';

export default function BannerNotificacoes() {
  const [notificacoes, setNotificacoes] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    if (!user) return;

    fetch(`${API_URL}/api/notificacoes`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setNotificacoes(data))
      .catch(err => console.error('Erro ao carregar notificações:', err));
  }, [user]);

  if (notificacoes.length === 0) return null;

  const getTipoCor = (tipo) => {
    switch(tipo) {
      case 'alerta':
        return { bg: 'bg-red-50', border: 'border-red-400', text: 'text-red-800', icon: 'text-red-600' };
      case 'aviso':
        return { bg: 'bg-orange-50', border: 'border-orange-400', text: 'text-orange-800', icon: 'text-orange-600' };
      case 'info':
        return { bg: 'bg-blue-50', border: 'border-blue-400', text: 'text-blue-800', icon: 'text-blue-600' };
      default:
        return { bg: 'bg-purple-50', border: 'border-purple-400', text: 'text-purple-800', icon: 'text-purple-600' };
    }
  };

  return (
    <div className="mb-6">
      <div className="space-y-3">
        {notificacoes.map(notif => {
          const cores = getTipoCor(notif.tipo);
          return (
            <div key={notif.id_notificacao} className={`${cores.bg} border-l-4 ${cores.border} p-4 rounded-md shadow-sm`}>
              <div className="flex items-start">
                <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${cores.icon} mr-3 flex-shrink-0 mt-0.5`} fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
                </svg>
                <div className="flex-1">
                  <p className={`font-semibold ${cores.text}`}>
                    {notif.tipo.charAt(0).toUpperCase() + notif.tipo.slice(1)}
                  </p>
                  <p className={`${cores.text} text-sm mt-1 whitespace-pre-wrap`}>{notif.mensagem}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
