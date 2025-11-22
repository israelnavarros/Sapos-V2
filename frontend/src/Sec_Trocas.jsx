import { useEffect, useState } from 'react';
import Header from './Header';
import API_URL from './config';
import { useNavigate } from 'react-router-dom';

export default function SecTrocas() {
  const [trocas, setTrocas] = useState([]);
  const [usuariosMap, setUsuariosMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // id_troca em ação
  const navigate = useNavigate();

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [r1, r2] = await Promise.all([
        fetch(`${API_URL}/api/trocas_pendentes`, { credentials: 'include' }),
        fetch(`${API_URL}/api/usuarios`, { credentials: 'include' })
      ]);
      const trocasJson = r1.ok ? await r1.json() : [];
      const usuariosJson = r2.ok ? await r2.json() : [];
      const map = {};
      usuariosJson.forEach(u => {
        const id = u.id_usuario ?? u.id ?? u.id_usuario; // tentativa de compatibilidade
        map[id] = u;
      });
      setUsuariosMap(map);
      setTrocas(Array.isArray(trocasJson) ? trocasJson : []);
    } catch (err) {
      console.error('Erro ao carregar trocas ou usuários:', err);
      setTrocas([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (id_troca, action) => {
    if (!window.confirm(`Confirma ${action} desta solicitação?`)) return;
    setActionLoading(id_troca);
    try {
      const res = await fetch(`${API_URL}/api/secretaria_responder_troca/${id_troca}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro');
      // atualizar lista
      await loadAll();
      alert(`Solicitação ${action}da com sucesso.`);
    } catch (err) {
      console.error('Erro ao responder troca:', err);
      alert(err.message || 'Erro ao processar ação');
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (d) => {
    if (!d) return '';
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString('pt-BR');
    } catch { return String(d); }
  };

  return (
    <>
      <div className="w-full">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow mb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">Requisições de Troca de Supervisor</h2>
              <div className="flex gap-2">
                <button onClick={() => loadAll()} className="px-3 py-2 bg-gray-100 rounded hover:bg-gray-200">Atualizar</button>
              </div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Aprovar move o estagiário para o grupo do supervisor escolhido; se "levar pacientes" estiver marcado, os pacientes também terão o supervisor atualizado.</p>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">#</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Estagiário</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Grupo Origem</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Supervisor Atual</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Supervisor Destino</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Levar Pacientes</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Justificativa</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600">Data</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-600">Ações</th>
                  </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    [1,2,3].map(i => (
                      <tr key={i} className="animate-pulse">
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-6" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-10" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-40" /></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20" /></td>
                        <td className="px-4 py-4"><div className="h-8 bg-gray-200 rounded w-24" /></td>
                      </tr>
                    ))
                  ) : trocas.length === 0 ? (
                    <tr>
                      <td colSpan="9" className="text-center py-8 text-gray-500">Nenhuma requisição pendente</td>
                    </tr>
                  ) : (
                    trocas.map((t) => {
                      const est = usuariosMap[t.id_estagiario] ?? {};
                      const supAtual = usuariosMap[t.id_supervisor_atual] ?? {};
                      const supNovo = usuariosMap[t.id_supervisor_novo] ?? {};
                      return (
                        <tr key={t.id_troca} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-700">{t.id_troca}</td>
                          <td className="px-4 py-3 text-sm text-gray-800 font-medium">{est.nome ?? `#${t.id_estagiario}`}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{t.id_grupo_origem ?? '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{supAtual.nome ?? (t.id_supervisor_atual ? `#${t.id_supervisor_atual}` : '—')}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{supNovo.nome ?? `#${t.id_supervisor_novo}`}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{t.levar_pacientes ? 'Sim' : 'Não'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700 max-w-xs truncate" title={t.justificativa || ''}>{t.justificativa || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{formatDate(t.data_solicitacao)}</td>
                          <td className="px-4 py-3 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <button
                                disabled={actionLoading === t.id_troca}
                                onClick={() => handleAction(t.id_troca, 'aprovar')}
                                className="px-3 py-1 text-sm rounded bg-green text-white hover:opacity-90 disabled:opacity-50"
                              >
                                {actionLoading === t.id_troca ? '...' : 'Aprovar'}
                              </button>

                              <button
                                disabled={actionLoading === t.id_troca}
                                onClick={() => handleAction(t.id_troca, 'rejeitar')}
                                className="px-3 py-1 text-sm rounded bg-red-100 text-[#BD4343] hover:bg-red-200 disabled:opacity-50"
                              >
                                {actionLoading === t.id_troca ? '...' : 'Rejeitar'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}