import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';
import Modal from './Modal';

export default function SecGrupos({ embedded = false }) {
  const [listaGrupos, setListaGrupos] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [vagasNova, setVagasNova] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Carrega os grupos do backend
    fetch(`${API_URL}/api/grupos`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setListaGrupos(data))
      .catch(err => console.error('Erro ao carregar grupos:', err));
  }, []);

  const abrirModal = (grupo) => {
    setGrupoSelecionado(grupo);
    setVagasNova(grupo.vagas_estagiarios || '');
    setIsModalOpen(true);
  };

  const confirmarEdicao = () => {
    fetch(`${API_URL}/api/atualizar_vaga_grupo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: grupoSelecionado.id_grupo, vagas_estagiarios: vagasNova })
    })
      .then(res => res.json())
      .then(() => {
        setListaGrupos(prev =>
          prev.map(g =>
            g.id_grupo === grupoSelecionado.id_grupo
              ? { ...g, vagas_estagiarios: vagasNova }
              : g
          )
        );
        setIsModalOpen(false);
      })
      .catch(err => {
        console.error('Erro ao atualizar vagas:', err);
        alert('Erro ao atualizar vagas!');
      });
  };

  return (
    <>
    {!embedded && <Header />}
    <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Gerenciar Grupos</h2>
        <button 
            className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105" 
            onClick={() => navigate('/criar_grupo')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Criar Grupo
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-xl overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
                <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">#</th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Título</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Vagas</th>
                <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Opções</th>
                </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
                {listaGrupos.map((grupo, index) => (
                <tr key={grupo.id_grupo} className="hover:bg-blue-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{grupo.titulo}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">{grupo.vagas_estagiarios}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex justify-center gap-2">
                        <button
                        className="text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        onClick={() => abrirModal(grupo)}
                        >
                        Editar Vagas
                        </button>
                        <button
                        className="text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        onClick={() => navigate(`/editar_grupo/${grupo.id_grupo}`)}
                        >
                        Editar Grupo
                        </button>
                        <button
                        className="text-teal-600 hover:text-teal-800 bg-teal-50 hover:bg-teal-100 px-3 py-1 rounded-md text-sm font-medium transition-colors"
                        onClick={() => navigate(`/coordenador_por_grupo/${grupo.id_grupo}`)}
                        >
                        Coordenador
                        </button>
                    </div>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      </div>

      {/* Modal de edição de vagas */}
      {isModalOpen && (
        <Modal onClose={() => setIsModalOpen(false)} title="Editar Vagas">
            <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Quantidade de vagas atual</label>
                  <input
                    type="text"
                    className="mt-1 block w-full rounded-md border-gray-300 bg-gray-100 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                    value={grupoSelecionado?.vagas_estagiarios || ''}
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nova quantidade de vagas</label>
                  <input
                    type="number"
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm p-2 border"
                    value={vagasNova}
                    onChange={e => setVagasNova(e.target.value)}
                    required
                  />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button" 
                        className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        onClick={() => setIsModalOpen(false)}
                    >
                        Cancelar
                    </button>
                    <button
                        type="button" 
                        className="px-4 py-2 bg-green text-white rounded-md hover:bg-green-600 shadow-md transition-colors"
                        onClick={confirmarEdicao}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </div>
    </>
  );
}
