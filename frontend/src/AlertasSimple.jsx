import React, { useEffect, useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import API_URL from './config';
import { AuthContext } from './AuthContext';

export default function AlertasSimple() {
  const [notifs, setNotifs] = useState([]);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;
    fetch(`${API_URL}/api/notificacoes`, { credentials: 'include' })
      .then(r => r.json())
      .then(data => setNotifs(data))
      .catch(console.error);
  }, [user]);

  const handleClick = async (notif) => {
    // marcar vista e remover localmente
    try {
      await fetch(`${API_URL}/api/marcar_notificacao_vista/${notif.id_notificacao}`, {
        method: 'POST',
        credentials: 'include'
      });
    } catch (err) {
      console.error('erro marcando vista', err);
    }
    setNotifs(prev => prev.filter(n => n.id_notificacao !== notif.id_notificacao));

    if (notif.id_paciente) {
      const path = user?.cargo === 1 ? `/sup_ficha_paciente/${notif.id_paciente}` : `/est_ficha_paciente/${notif.id_paciente}`;
      navigate(path);
    }
  };

  const handleMarkAllRead = async () => {
    if (notifs.length === 0) return;
    try {
      await fetch(`${API_URL}/api/marcar_todas_notificacoes_vistas`, {
        method: 'POST',
        credentials: 'include'
      });
      setNotifs([]);
    } catch (err) {
      console.error('Erro ao marcar todas como lidas', err);
    }
  };

  return (
    <>
      <Header />
      <main className="pt-20">
        <div className="p-4 sm:p-6 lg:p-8 bg-[#F4F1EE] min-h-screen">
          <div className="container-geral">
            <div className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800">Notificações</h1>
                {notifs.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm font-semibold text-green-600 hover:text-green-800 transition-colors cursor-pointer"
                  >
                    Marcar todas como lidas
                  </button>
                )}
              </div>

              {notifs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20">
                  <div className="w-24 h-24 md:w-40 md:h-40 rounded-lg flex items-center justify-center">
                    <img src="/LogoSad.png" alt="Sem notificações" className="w-20 h-20 md:w-36 md:h-36 object-contain" />
                  </div>
                  <h3 className="mt-4 md:mt-6 text-lg md:text-2xl font-semibold text-slate-800">Sem notificações</h3>
                  <p className="mt-2 text-sm md:text-base text-slate-600 text-center max-w-sm md:max-w-md">Nenhuma notificação no momento.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifs.map(n => (
                    <div
                      key={n.id_notificacao}
                      className="relative p-5 bg-white border border-gray-200 rounded-lg shadow-sm cursor-pointer hover:bg-green-50 hover:border-green-200 transition-all group"
                      onClick={() => handleClick(n)}
                    >
                      <div className="mb-4 pr-4">
                        <p className="font-medium text-slate-800 text-lg">{n.mensagem}</p>
                        <p className="text-xs font-bold text-gray-500 mt-2 uppercase tracking-wider">{n.tipo}</p>
                      </div>
                      <div className="absolute bottom-3 right-4 text-xs text-gray-400 font-medium">
                        {n.data_criacao ? new Date(n.data_criacao).toLocaleDateString('pt-BR') : ''}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
