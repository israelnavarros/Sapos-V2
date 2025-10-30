import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';

export default function EstMeuPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [modalOpen, setModalOpen] = useState(false);
  const [supervisores, setSupervisores] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [levarPacientes, setLevarPacientes] = useState(false);
  const [justificativa, setJustificativa] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [carregandoSupervisores, setCarregandoSupervisores] = useState(false);

  useEffect(() => {
    fetch('/api/meus_pacientes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPacientes(data))
      .catch(err => console.error('Erro ao carregar pacientes do grupo:', err))
      .finally(() => setLoading(false));
  }, []);

  // buscar supervisores quando abrir o modal
  useEffect(() => {
    if (!modalOpen) return;
    setCarregandoSupervisores(true);
    fetch('/api/consulta_ids_supervisores', { credentials: 'include' })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao carregar supervisores');
        return res.json();
      })
      .then(data => {
        setSupervisores(data || []);
      })
      .catch(err => {
        console.error('Erro ao carregar supervisores:', err);
        setSupervisores([]);
      })
      .finally(() => setCarregandoSupervisores(false));
  }, [modalOpen]);

  const openModal = () => {
    setSelectedSupervisor('');
    setLevarPacientes(false);
    setJustificativa('');
    setModalOpen(true);
  };
  const closeModal = () => setModalOpen(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!selectedSupervisor) return alert('Selecione um supervisor novo.');
    setSubmitLoading(true);
    try {
      const res = await fetch('/api/solicitar_troca_supervisor', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_supervisor_novo: selectedSupervisor,
          levar_pacientes: levarPacientes,
          justificativa
        })
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Erro ao enviar solicitação');
      alert('Solicitação enviada com sucesso.');
      closeModal();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Erro ao enviar solicitação');
    } finally {
      setSubmitLoading(false);
    }
  };

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
          <div className="ml-4 h-4 bg-gray-300 rounded w-3/4"></div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-6 w-20 bg-gray-300 rounded-full"></div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
      </td>
    </tr>
  );

  return (
    <>
      <Header />
      <main className="bg-gray-50 min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
            <h1 className="text-3xl font-bold text-gray-900">Meu Grupo de Pacientes</h1>
            <button
              onClick={() => navigate('/est_adicionar_paciente')}
              className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              Adicionar Paciente
            </button>
            <button
                onClick={openModal}
                className="flex items-center gap-2 bg-yellow-500 text-white px-4 py-2.5 rounded-lg font-semibold shadow-md hover:bg-yellow-600 cursor-pointer transition-transform transform hover:scale-105"
              >
                Solicitar troca de supervisor
              </button>
          </div>

          <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome do Paciente</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data de Entrada</th>
                  <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Última Atividade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <>
                    <SkeletonRow />
                    <SkeletonRow />
                    <SkeletonRow />
                  </>
                ) : pacientes.length > 0 ? (
                  pacientes.map((paciente) => (
                    <tr 
                      key={paciente.id_paciente} 
                      className="hover:bg-blue-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/est_ficha_paciente/${paciente.id_paciente}`)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <img className="h-10 w-10 rounded-full object-cover" src={`/api/uploads/pacientes/${paciente.id_paciente}`} alt="Foto do paciente" />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{paciente.nome_completo}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(paciente.data_criacao).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    String(paciente.status).toLowerCase() === 'true'
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {paciente.atividade_recente || 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-16 px-4">
                      <h3 className="text-lg font-medium text-gray-700">Nenhum paciente encontrado</h3>
                      <p className="text-sm text-gray-500 mt-1">Clique em "Adicionar Paciente" para começar.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
      {/* Modal Solicitar Troca */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold">Solicitar troca de supervisor</h3>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-800">Fechar</button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Supervisor novo</label>
                {carregandoSupervisores ? (
                  <div className="mt-2 text-sm text-gray-500">Carregando supervisores...</div>
                ) : (
                  <select
                    value={selectedSupervisor}
                    onChange={(e) => setSelectedSupervisor(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  >
                    <option value="">— selecione —</option>
                    {supervisores.map(s => (
                      <option key={s.id_supervisor || s.id} value={s.id_supervisor || s.id}>
                        {s.nome}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="flex items-center gap-3">
                <input id="levar" type="checkbox" checked={levarPacientes} onChange={(e) => setLevarPacientes(e.target.checked)} className="h-4 w-4 text-green-600" />
                <label htmlFor="levar" className="text-sm text-gray-700">Levar pacientes com o estagiário</label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Justificativa (opcional)</label>
                <textarea
                  value={justificativa}
                  onChange={(e) => setJustificativa(e.target.value)}
                  rows={4}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                  placeholder="Explique o motivo da solicitação..."
                />
              </div>

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeModal} className="px-4 py-2 bg-gray-200 rounded-md">Cancelar</button>
                <button type="submit" disabled={submitLoading} className="px-4 py-2 bg-green text-white rounded-md">
                  {submitLoading ? 'Enviando...' : 'Enviar solicitação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}