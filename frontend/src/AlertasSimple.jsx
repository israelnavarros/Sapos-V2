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

  return (
    <div>
      <Header />
      <main className="max-w-7xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold mb-4">Notificações</h1>
        {notifs.length === 0 ? (
          <p className="text-gray-600">Nenhuma notificação no momento.</p>
        ) : (
          <div className="space-y-4">
            {notifs.map(n => (
              <div
                key={n.id_notificacao}
                className="p-4 bg-white shadow rounded cursor-pointer hover:bg-green-50"
                onClick={() => handleClick(n)}
              >
                <p className="font-medium">{n.mensagem}</p>
                <p className="text-xs text-gray-500 mt-1">{n.tipo}</p>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
