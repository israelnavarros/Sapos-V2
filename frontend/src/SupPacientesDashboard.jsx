import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from './Header';
import Modal from './Modal'; // Importe seu componente Modal

// O menu de ações da tabela
function ActionsDropdown({ paciente, onAtribuir }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [dropdownRef]);

    return (
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full hover:bg-slate-200">
                <i className="bi bi-three-dots-vertical text-slate-600"></i>
            </button>
            {isOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 ring-1 ring-slate-200">
                    <div className="py-1">
                        <Link to={`/sup_ficha_paciente/${paciente.id_paciente}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            Ver Ficha do Paciente
                        </Link>
                        <button onClick={() => { onAtribuir(paciente); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
                            Atribuir/Trocar Estagiário
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}


// O componente principal da página
export default function SupDashboardPacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    
    const [modalState, setModalState] = useState({ isOpen: false, paciente: null });
    const [estagiarios, setEstagiarios] = useState([]);
    const [selectedEstagiarioId, setSelectedEstagiarioId] = useState('');

    const fetchPacientes = () => {
        setLoading(true);
        fetch("/api/sup_pacientes_supervisionados", { credentials: "include" })
            .then(res => res.json())
            .then(data => setPacientes(data || []))
            .catch(err => console.error("Erro ao carregar pacientes:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPacientes();
    }, []);

    const handleOpenAssignModal = (paciente) => {
        fetch('/api/sup_estagiarios_do_grupo', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setEstagiarios(data);
                setSelectedEstagiarioId(paciente.id_estagiario || '');
                setModalState({ isOpen: true, paciente: paciente });
            });
    };

    const handleSaveAssignment = async () => {
        const { paciente } = modalState;
        try {
            const response = await fetch(`/api/sup_atribuir_estagiario/${paciente.id_paciente}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id_estagiario: selectedEstagiarioId })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            alert('Atribuição salva com sucesso!');
            setModalState({ isOpen: false, paciente: null });
            fetchPacientes(); // Recarrega a lista de pacientes
        } catch (error) {
            alert(`Erro: ${error.message}`);
        }
    };
    
    // ... (componente SkeletonRow)

    return (
        <>
            <Header />
            <main className="bg-slate-50 min-h-screen pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <h1 className="text-3xl font-bold text-slate-900 mb-8">Dashboard de Pacientes</h1>
                    
                    <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
                        <table className="min-w-full divide-y divide-slate-200">
                            <thead className="bg-slate-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Paciente</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Estagiário Responsável</th>
                                    <th scope="col" className="px-6 py-3 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {loading ? ( <>{/* Skeleton Rows */}</> ) 
                                : pacientes.length > 0 ? (
                                    pacientes.map(paciente => (
                                        <tr key={paciente.id_paciente} className="hover:bg-slate-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-full object-cover" src={`/api/uploads/pacientes/${paciente.id_paciente}`} alt="" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-slate-900">{paciente.nome_completo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 text-xs font-semibold rounded-full ${String(paciente.status).toLowerCase() === 'true' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-700">
                                                {paciente.estagiario_nome ? (
                                                    <span>{paciente.estagiario_nome}</span>
                                                ) : (
                                                    <span className="font-semibold text-orange-600">Não Atribuído</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                <ActionsDropdown paciente={paciente} onAtribuir={handleOpenAssignModal} />
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="text-center py-16">
                                            <h3 className="font-medium text-slate-700">Nenhum paciente sob sua supervisão.</h3>
                                            <p className="text-sm text-slate-500 mt-1">A secretaria precisa atribuir pacientes a você primeiro.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
            
            {/* Modal para atribuir estagiário */}
            {modalState.isOpen && (
                <Modal onClose={() => setModalState({ isOpen: false, paciente: null })} title={`Atribuir Estagiário para ${modalState.paciente.nome_completo}`}>
                    <div className="space-y-4">
                        <label htmlFor="estagiario-select" className="block text-sm font-medium text-slate-700">
                            Selecione um estagiário da sua equipe:
                        </label>
                        <select 
                            id="estagiario-select" 
                            value={selectedEstagiarioId} 
                            onChange={(e) => setSelectedEstagiarioId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        >
                            <option value="">-- Remover Atribuição --</option>
                            {estagiarios.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                        </select>
                    </div>
                    <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                         <button type="button" className="px-4 py-2 bg-slate-100 rounded-lg" onClick={() => setModalState({isOpen: false, paciente: null})}>Cancelar</button>
                         <button type="button" className="px-6 py-2 bg-green text-white font-semibold rounded-lg" onClick={handleSaveAssignment}>Salvar Atribuição</button>
                    </div>
                </Modal>
            )}
        </>
    );
}
