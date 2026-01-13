import { useEffect, useState } from 'react';
import API_URL from './config';
import moment from 'moment';

export default function BannerAlertas() {
  const [alertas, setAlertas] = useState([]);

  useEffect(() => {
    fetch(`${API_URL}/api/alertas`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        const hoje = moment().startOf('day');
        // Filtra apenas alertas que ainda estão dentro da validade
        const validos = data.filter(a => moment(a.validade).isSameOrAfter(hoje));
        setAlertas(validos);
      })
      .catch(err => console.error('Erro ao carregar alertas:', err));
  }, []);

  if (alertas.length === 0) return null;

  return (
    <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md shadow-sm">
      <div className="flex items-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
        </svg>
        <h3 className="text-lg font-bold text-yellow-800">Comunicados Gerais</h3>
      </div>
      <div className="space-y-3">
        {alertas.map(alerta => (
          <div key={alerta.id_alerta} className="bg-white/80 p-3 rounded border border-yellow-200">
            <h4 className="font-semibold text-yellow-900">{alerta.titulo}</h4>
            <p className="text-yellow-800 text-sm mt-1 whitespace-pre-wrap">{alerta.mensagem}</p>
          </div>
        ))}
      </div>
    </div>
  );
}