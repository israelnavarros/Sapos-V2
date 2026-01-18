import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';
import Modal from './Modal';

function ActionsDropdown({ grupo, onEditVagas, onEditGroup, onManageCoordinators }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        function handleScroll() {
            setIsOpen(false);
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
            window.addEventListener("scroll", handleScroll, true);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("scroll", handleScroll, true);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setPosition({ top: rect.bottom, left: rect.right - 192 }); // w-48 = 192px
        }
        setIsOpen(!isOpen);
    };

    const itemStyle = "group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-green hover:text-white transition-colors cursor-pointer";

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={toggleDropdown} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green cursor-pointer">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>
            {isOpen && createPortal(
                <div 
                    className="fixed mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none z-50"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="p-1">
                        <button onClick={() => { onEditGroup(grupo); setIsOpen(false); }} className={itemStyle}>
                            <i className="bi bi-pencil-square mr-2"></i> Editar Grupo
                        </button>
                        <button onClick={() => { onEditVagas(grupo); setIsOpen(false); }} className={itemStyle}>
                            <i className="bi bi-people mr-2"></i> Editar Vagas
                        </button>
                        <button onClick={() => { onManageCoordinators(grupo); setIsOpen(false); }} className={itemStyle}>
                            <i className="bi bi-person-badge mr-2"></i> Supervisores
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function SecGrupos({ embedded = false }) {
  const [listaGrupos, setListaGrupos] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [vagasNova, setVagasNova] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditGroupModalOpen, setIsEditGroupModalOpen] = useState(false);
  const [isCoordModalOpen, setIsCoordModalOpen] = useState(false);
  const [supervisores, setSupervisores] = useState([]);
  const [editGroupData, setEditGroupData] = useState({});
  const [newGroupData, setNewGroupData] = useState({
    titulo: '',
    vagas_estagiarios: '',
    local: '',
    convenio: '',
    resumo: '',
    objetivos: '',
    atividades: '',
    bibliografia: ''
  });
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

  const handleCreateChange = (e) => {
    const { name, value } = e.target;
    setNewGroupData(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_URL}/api/cadastrar_grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(newGroupData)
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert('Grupo criado com sucesso!');
        setIsCreateModalOpen(false);
        setNewGroupData({
            titulo: '',
            vagas_estagiarios: '',
            local: '',
            convenio: '',
            resumo: '',
            objetivos: '',
            atividades: '',
            bibliografia: ''
        });
        // Recarrega a lista
        const resList = await fetch(`${API_URL}/api/grupos`, { credentials: 'include' });
        const dataList = await resList.json();
        setListaGrupos(dataList);
      } else {
        alert(data.message || 'Erro ao criar grupo.');
      }
    } catch (err) {
      console.error(err);
      alert('Erro de conexão.');
    }
  };

  const handleEditGroupChange = (e) => {
    const { name, value } = e.target;
    setEditGroupData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEditGroup = async (e) => {
    e.preventDefault();
    try {
        const res = await fetch(`${API_URL}/api/atualizar_grupo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(editGroupData)
        });
        const data = await res.json();
        if (data.success) {
            alert('Grupo atualizado com sucesso!');
            setIsEditGroupModalOpen(false);
            // Recarrega a lista
            const resList = await fetch(`${API_URL}/api/grupos`, { credentials: 'include' });
            const dataList = await resList.json();
            setListaGrupos(dataList);
        } else {
            alert(data.message || 'Erro ao atualizar grupo.');
        }
    } catch (err) {
        console.error(err);
        alert('Erro de conexão.');
    }
  };

  const openCoordModal = (grupo) => {
    setGrupoSelecionado(grupo);
    fetch(`${API_URL}/api/lista_supervisores`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
            setSupervisores(data);
            setIsCoordModalOpen(true);
        });
  };

  const handleAssignCoordinator = async (id_supervisor, id_grupo) => {
      await fetch(`${API_URL}/api/atribuir_supervisor_grupo`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ id_supervisor, id_grupo })
      });
      // Refresh list
      const res = await fetch(`${API_URL}/api/lista_supervisores`, { credentials: 'include' });
      const data = await res.json();
      setSupervisores(data);
  };

  return (
    <>
    {!embedded && <Header />}
    <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"}>
      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <h2 className="text-3xl font-bold text-gray-900">Gerenciar Grupos</h2>
        <button 
            className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105" 
            onClick={() => setIsCreateModalOpen(true)}
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
                        <ActionsDropdown 
                            grupo={grupo}
                            onEditVagas={abrirModal}
                            onEditGroup={(g) => { setEditGroupData(g); setIsEditGroupModalOpen(true); }}
                            onManageCoordinators={openCoordModal}
                        />
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

      {/* Modal de Criação de Grupo */}
      {isCreateModalOpen && (
        <Modal onClose={() => setIsCreateModalOpen(false)} title="Criar Novo Grupo">
          <form onSubmit={handleCreateGroup} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input type="text" name="titulo" value={newGroupData.titulo} onChange={handleCreateChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Vagas</label>
                    <input type="number" name="vagas_estagiarios" value={newGroupData.vagas_estagiarios} onChange={handleCreateChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Local</label>
                    <input type="text" name="local" value={newGroupData.local} onChange={handleCreateChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Convênio</label>
                    <input type="text" name="convenio" value={newGroupData.convenio} onChange={handleCreateChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Resumo</label>
                <textarea name="resumo" value={newGroupData.resumo} onChange={handleCreateChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Objetivos</label>
                <textarea name="objetivos" value={newGroupData.objetivos} onChange={handleCreateChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Atividades</label>
                <textarea name="atividades" value={newGroupData.atividades} onChange={handleCreateChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Bibliografia</label>
                <textarea name="bibliografia" value={newGroupData.bibliografia} onChange={handleCreateChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" onClick={() => setIsCreateModalOpen(false)}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green text-white rounded-md hover:bg-green-600 shadow-md">Criar Grupo</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Edição de Grupo */}
      {isEditGroupModalOpen && (
        <Modal onClose={() => setIsEditGroupModalOpen(false)} title="Editar Grupo">
          <form onSubmit={handleSaveEditGroup} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Título</label>
                    <input type="text" name="titulo" value={editGroupData.titulo} onChange={handleEditGroupChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Vagas</label>
                    <input type="number" name="vagas_estagiarios" value={editGroupData.vagas_estagiarios} onChange={handleEditGroupChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Local</label>
                    <input type="text" name="local" value={editGroupData.local} onChange={handleEditGroupChange} required className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Convênio</label>
                    <input type="text" name="convenio" value={editGroupData.convenio} onChange={handleEditGroupChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border" />
                </div>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Resumo</label>
                <textarea name="resumo" value={editGroupData.resumo} onChange={handleEditGroupChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Objetivos</label>
                <textarea name="objetivos" value={editGroupData.objetivos} onChange={handleEditGroupChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Atividades</label>
                <textarea name="atividades" value={editGroupData.atividades} onChange={handleEditGroupChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div>
                <label className="block text-sm font-medium text-gray-700">Bibliografia</label>
                <textarea name="bibliografia" value={editGroupData.bibliografia} onChange={handleEditGroupChange} required rows="3" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border"></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-4">
                <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" onClick={() => setIsEditGroupModalOpen(false)}>Cancelar</button>
                <button type="submit" className="px-4 py-2 bg-green text-white rounded-md hover:bg-green-600 shadow-md">Salvar Alterações</button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal de Coordenadores */}
      {isCoordModalOpen && (
          <Modal onClose={() => setIsCoordModalOpen(false)} title={`Gerenciar Supervisores - ${grupoSelecionado?.titulo}`}>
              <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-gray-600">Selecione os supervisores que atuarão neste grupo.</p>
                  <div className="divide-y divide-gray-200 border rounded-md">
                      {supervisores.map(sup => {
                          const isInGroup = sup.grupo === grupoSelecionado.id_grupo;
                          return (
                              <div key={sup.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                                  <div>
                                      <p className="font-medium text-gray-800">{sup.nome}</p>
                                      <p className="text-xs text-gray-500">{sup.grupo ? (isInGroup ? 'Neste Grupo' : `Em outro grupo (ID: ${sup.grupo})`) : 'Sem grupo'}</p>
                                  </div>
                                  <button 
                                      onClick={() => handleAssignCoordinator(sup.id, isInGroup ? null : grupoSelecionado.id_grupo)}
                                      className={`px-3 py-1 text-sm rounded-md transition-colors ${
                                          isInGroup 
                                          ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                                      }`}
                                  >
                                      {isInGroup ? 'Remover' : 'Adicionar'}
                                  </button>
                              </div>
                          );
                      })}
                  </div>
              </div>
              <div className="flex justify-end pt-4">
                  <button type="button" className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300" onClick={() => setIsCoordModalOpen(false)}>Fechar</button>
              </div>
          </Modal>
      )}
    </div>
    </>
  );
}
