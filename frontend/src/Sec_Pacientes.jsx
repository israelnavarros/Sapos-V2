import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, Link } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';
import Modal from './Modal';

function ActionsDropdown({ paciente, onAssignSupervisor, onAssignIntern, onToggleStatus }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const menuRef = useRef(null);
    const [position, setPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        function handleClickOutside(event) {
            if (
                dropdownRef.current && !dropdownRef.current.contains(event.target) &&
                (!menuRef.current || !menuRef.current.contains(event.target))
            ) {
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
            setPosition({ top: rect.bottom, left: rect.right - 256 }); // w-64 = 256px
        }
        setIsOpen(!isOpen);
    };

    // Estilo base para todos os itens do menu, para manter a consistência
    const itemStyle = "group flex w-full items-center rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-green hover:text-white transition-colors cursor-pointer";

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Botão de ícone (sem grandes alterações) */}
            <button
                onClick={toggleDropdown}
                className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green cursor-pointer"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                </svg>
            </button>

            {/* Menu Dropdown Estilizado */}
            {isOpen && createPortal(
                <div 
                    ref={menuRef}
                    className="fixed mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none z-50"
                    style={{ top: position.top, left: position.left }}
                >
                    <div className="p-1">
                        {/* Grupo de Ações de Navegação */}
                        <Link to={`/sec_ficha_paciente/${paciente.id_paciente}`} className={itemStyle} onClick={() => setIsOpen(false)}>
                            <i className="bi bi-file-earmark-person mr-3 h-5 w-5 text-slate-400 group-hover:text-green-700"></i>
                            Ver Ficha Completa
                        </Link>

                        <div className="my-1 h-px bg-slate-100" />

                        {/* Grupo de Ações de Atribuição */}
                        <button onClick={() => { onAssignSupervisor(paciente); setIsOpen(false); }} className={itemStyle}>
                             <i className="bi bi-person-check mr-3 h-5 w-5 text-slate-400 group-hover:text-green-700"></i>
                            Alterar Supervisor
                        </button>
                        <button onClick={() => { onAssignIntern(paciente); setIsOpen(false); }} className={itemStyle}>
                             <i className="bi bi-person-plus mr-3 h-5 w-5 text-slate-400 group-hover:text-green-700"></i>
                            Alterar Estagiário
                        </button>
                        
                        {/* Divisória */}
                        <div className="my-1 h-px bg-slate-100" />
                        
                        {/* Grupo de Ações de Status */}
                        <button onClick={() => { onToggleStatus(paciente); setIsOpen(false); }} className={itemStyle} title={paciente.status ? "Desativar paciente" : "Ativar paciente"}>
                             <i className={`bi ${paciente.status ? 'bi-person-x' : 'bi-person-check'} mr-3 h-5 w-5 text-slate-400 group-hover:text-green-700`}></i>
                            {paciente.status ? 'Desativar' : 'Ativar'}
                        </button>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

export default function SecPacientes({ embedded = false }) {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [modalState, setModalState] = useState({ isOpen: false, mode: null, paciente: null });
    const [userList, setUserList] = useState([]); // Lista de estagiários ou supervisores
    const [selectedUserId, setSelectedUserId] = useState('');

    const fetchPacientes = () => {
        setLoading(true);
        fetch(`${API_URL}/api/pacientes`, { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setPacientes(data || []);
            })
            .catch(err => console.error("Erro ao carregar pacientes:", err))
            .finally(() => setLoading(false));
    };
    useEffect(() => {
        fetchPacientes();
    }, []);

    const handleAssignSupervisor = (paciente) => {
        setModalState({ isOpen: true, mode: 'supervisor', paciente: paciente });
        fetch(`${API_URL}/api/lista_supervisores`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setUserList(data);
                setSelectedUserId(paciente.id_supervisor || '');
            });
    };

    const handleAssignIntern = (paciente) => {
        console.log(paciente);
        if (!paciente.id_supervisor) {
            alert('Atribua um supervisor a este paciente primeiro!');
            return;
        }
        setModalState({ isOpen: true, mode: 'intern', paciente: paciente });
        fetch(`${API_URL}/api/lista_estagiarios_por_supervisor/${paciente.id_supervisor}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setUserList(data);
                setSelectedUserId(paciente.id_estagiario || '');
            });
    };

    // --- FUNÇÃO PARA SALVAR A ATRIBUIÇÃO ---
    const handleSaveAssignment = async () => {
        const { mode, paciente } = modalState;
        const payload = mode === 'supervisor'
            ? { id_supervisor: selectedUserId }
            : { id_estagiario: selectedUserId };

        try {
            const response = await fetch(`${API_URL}/api/atribuir_paciente/${paciente.id_paciente}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(payload)
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);

            alert('Atribuição salva com sucesso!');
            setModalState({ isOpen: false, mode: null, paciente: null });
            fetchPacientes(); // Recarrega a lista de pacientes para mostrar a mudança
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };

    // --- FUNÇÃO PARA ALTERAR STATUS DO PACIENTE ---
    const handleToggleStatus = async (paciente) => {
        if (!window.confirm(`Deseja ${paciente.status ? 'desativar' : 'ativar'} o paciente ${paciente.nome_completo}?`)) return;

        try {
            const res = await fetch(`${API_URL}/api/mudar_status_paciente/${paciente.id_paciente}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            const data = await res.json();
            if (data.success) {
                setPacientes(prev => prev.map(p => 
                    p.id_paciente === paciente.id_paciente ? { ...p, status: data.status } : p
                ));
            } else {
                alert(data.message || 'Erro ao alterar status.');
            }
        } catch (err) {
            console.error(err);
            alert('Erro de conexão.');
        }
    };

    // Componente para o "esqueleto" da tabela durante o carregamento
    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                    <div className="h-10 w-10 bg-gray-300 rounded-full"></div>
                    <div className="ml-4 h-4 bg-gray-300 rounded w-3/4"></div>
                </div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-center">
                <div className="h-6 w-20 bg-gray-300 rounded-full mx-auto"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-1/2"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-4 bg-gray-300 rounded w-3/4"></div>
            </td>
            <td className="px-6 py-4 whitespace-nowrap">
                <div className="h-8 w-24 bg-gray-300 rounded-md"></div>
            </td>
        </tr>
    );

    // Função utilitária para formatar a data, se necessário
    function formatarData(dataStr) {
        if (!dataStr) return "N/A";
        // Supondo que a data venha como "YYYY-MM-DD"
        const data = new Date(dataStr);
        return data.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    }

    const Content = (
        <div className={embedded ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12"}>
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold text-gray-900">Administração de Pacientes</h1>
                        <Link
                            to="/sec_adicionar_paciente"
                            className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                            </svg>
                            Adicionar Paciente
                        </Link>
                    </div>

                    <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome do Paciente</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data de Criação</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Supervisor</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estagiário</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
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
                                    pacientes.map(paciente => (
                                        <tr key={paciente.id_paciente} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-full object-cover bg-gray-200" src={`${API_URL}/api/uploads/pacientes/${paciente.id_paciente}`} alt="Foto do paciente" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{paciente.nome_completo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                    paciente.status === true || String(paciente.status).toLowerCase() === 'true'
                                                        ? 'bg-green-100 text-green-800' 
                                                        : 'bg-red-100 text-red-800'
                                                    }`}>
                                                    {paciente.status === true || String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatarData(paciente.data_criacao)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.supervisor_nome || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.estagiario_nome || 'Não atribuído'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {/* Usando o componente definido neste mesmo arquivo */}
                                                <ActionsDropdown
                                                    paciente={paciente}
                                                    onAssignSupervisor={handleAssignSupervisor}
                                                    onAssignIntern={handleAssignIntern}
                                                    onToggleStatus={handleToggleStatus} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center py-16 px-4">
                                            <h3 className="text-lg font-medium text-gray-700">Nenhum paciente encontrado</h3>
                                            <p className="text-sm text-gray-500 mt-1">Clique em "Adicionar Paciente" para começar.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
        </div>
    );

    const ModalAssignment = modalState.isOpen && (
        <Modal
            onClose={() => setModalState({ isOpen: false, mode: null, paciente: null })}
            title={`Alterar ${modalState.mode === 'supervisor' ? 'Supervisor' : 'Estagiário'} de ${modalState.paciente.nome_completo}`}
        >
            <div className="space-y-4">
                <label htmlFor="user-select" className="block text-sm font-medium text-gray-700">
                    Selecione o novo {modalState.mode === 'supervisor' ? 'supervisor' : 'estagiário'}:
                </label>
                <select
                    id="user-select"
                    value={selectedUserId}
                    onChange={(e) => setSelectedUserId(e.target.value)}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 sm:text-sm"
                >
                    <option value="">{userList.length > 0 ? `Selecione um ${modalState.mode}` : 'Carregando...'}</option>
                    {userList.map(user => (
                        <option key={user.id} value={user.id}>{user.nome}</option>
                    ))}
                </select>
            </div>
            <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                <button type="button" className="px-4 py-2 bg-gray-200 rounded-md hover:bg-gray-300" onClick={() => setModalState({ isOpen: false, mode: null, paciente: null })}>Cancelar</button>
                <button type="button" className="px-4 py-2 bg-green text-white rounded-md hover:bg-green-600" onClick={handleSaveAssignment}>Salvar Alteração</button>
            </div>
        </Modal>
    );

    if (embedded) return <>{Content}{ModalAssignment}</>;

    return (
        <>
            <Header />
            <main className="bg-gray-50 min-h-screen pt-20">
                {Content}
            </main>
            {ModalAssignment}
        </>
    );
}