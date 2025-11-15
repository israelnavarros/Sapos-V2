import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';
import Modal from './Modal';

export default function SupAssumirPaciente() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalState, setModalState] = useState({ isOpen: false, paciente: null });
    const [estagiarios, setEstagiarios] = useState([]);
    const [selectedEstagiarioId, setSelectedEstagiarioId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const navigate = useNavigate();

    const fetchPacientesParaAssumir = () => {
        setLoading(true);
        fetch('/api/sup_pacientes_para_assumir', { credentials: 'include' })
            .then(res => res.json())
            .then(data => setPacientes(Array.isArray(data) ? data : []))
            .catch(err => {
                console.error('Erro ao carregar pacientes:', err);
                setPacientes([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPacientesParaAssumir();
    }, []);

    const handleOpenModal = (paciente) => {
        fetch('/api/sup_estagiarios_do_grupo', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setEstagiarios(data);
                const estagiarioAtual = estagiarios.find(e => e.nome === paciente.estagiario_nome);
                setSelectedEstagiarioId(estagiarioAtual ? estagiarioAtual.id : '');
                setModalState({ isOpen: true, paciente: paciente });
            });
    };

    const handleCloseModal = () => {
        setModalState({ isOpen: false, paciente: null });
        setSelectedEstagiarioId('');
    };

    const handleSaveAssignment = async () => {
        const { paciente } = modalState;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/sup_assumir_ou_atualizar_paciente/${paciente.id_paciente}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ id_estagiario: selectedEstagiarioId })
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Erro ao atualizar paciente');

            alert(json.message);
            handleCloseModal();
            fetchPacientesParaAssumir(); // Recarrega a lista
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setActionLoading(false);
        }
    };

    const SkeletonRow = () => (
        <tr className="animate-pulse">
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-3/4"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-full"></div></td>
            <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-1/2"></div></td>
            <td className="px-6 py-4"><div className="h-8 w-24 bg-gray-300 rounded-md"></div></td>
        </tr>
    );

    return (
        <>
            <Header />
            <main className="bg-gray-50 min-h-screen pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                        <h1 className="text-3xl font-bold text-gray-900">Assumir e Gerenciar Pacientes</h1>
                        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 cursor-pointer">
                            Voltar ao Dashboard
                        </button>
                    </div>

                    <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Idade</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Supervisor Atual</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estagiário Atual</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                                ) : pacientes.length > 0 ? (
                                    pacientes.map((paciente) => (
                                        <tr key={paciente.id_paciente} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{paciente.nome_completo}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.idade}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.supervisor_nome || <span className="text-red-600 font-semibold">Nenhum</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.estagiario_nome || <span className="text-orange-600 font-semibold">Não Atribuído</span>}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleOpenModal(paciente)}
                                                    className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-600 transition-colors cursor-pointer"
                                                >
                                                    Assumir / Atualizar
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-16 px-4">
                                            <h3 className="text-lg font-medium text-gray-700">Nenhum paciente disponível para assumir no momento</h3>
                                            <p className="text-sm text-gray-500 mt-1">Verifique novamente mais tarde.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>

            {modalState.isOpen && (
                <Modal
                    onClose={handleCloseModal}
                    title={`Gerenciar Paciente: ${modalState.paciente.nome_completo}`}
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">Você assumirá a supervisão deste paciente. Selecione um estagiário do seu grupo para atendê-lo.</p>
                        <label htmlFor="estagiario-select" className="block text-sm font-medium text-gray-700">
                            Atribuir ao estagiário:
                        </label>
                        <select
                            id="estagiario-select"
                            value={selectedEstagiarioId}
                            onChange={(e) => setSelectedEstagiarioId(e.target.value)}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green focus:border-green"
                        >
                            <option value="">-- Remover Atribuição --</option>
                            {estagiarios.map(e => <option key={e.id} value={e.id}>{e.nome}</option>)}
                        </select>
                    </div>
                    <div className="mt-6 pt-4 border-t flex justify-end gap-3">
                        <button type="button" className="px-4 py-2 bg-gray-200 rounded-md" onClick={handleCloseModal}>Cancelar</button>
                        <button type="button" onClick={handleSaveAssignment} disabled={actionLoading} className="px-4 py-2 bg-green text-white rounded-md disabled:bg-gray-400">
                            {actionLoading ? 'Salvando...' : 'Salvar Alteração'}
                        </button>
                    </div>
                </Modal>
            )}
        </>
    );
}