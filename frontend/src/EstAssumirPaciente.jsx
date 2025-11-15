import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from './Header';

export default function EstAssumirPaciente() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null); // ID do paciente em ação
    const navigate = useNavigate();

    const fetchPacientesDisponiveis = () => {
        setLoading(true);
        fetch('/api/pacientes_disponiveis', { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setPacientes(Array.isArray(data) ? data : []);
            })
            .catch(err => {
                console.error('Erro ao carregar pacientes disponíveis:', err);
                setPacientes([]);
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchPacientesDisponiveis();
    }, []);

    const handleAssumir = async (id_paciente) => {
        if (!window.confirm("Tem certeza que deseja assumir este paciente?")) return;

        setActionLoading(id_paciente);
        try {
            const res = await fetch(`/api/assumir_paciente/${id_paciente}`, {
                method: 'POST',
                credentials: 'include',
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.message || 'Erro ao assumir paciente');

            alert(json.message);
            // Navega para a ficha do paciente recém-assumido
            navigate(`/est_ficha_paciente/${id_paciente}`);
        } catch (err) {
            console.error(err);
            alert(err.message);
        } finally {
            setActionLoading(null);
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
                        <h1 className="text-3xl font-bold text-gray-900">Pacientes Disponíveis</h1>
                        <button onClick={() => navigate(-1)} className="text-sm text-gray-500 cursor-pointer">
                            Voltar para Meus Pacientes
                        </button>
                    </div>

                    <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Nome</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Idade</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Motivo da Consulta</th>
                                    <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Supervisor Atual</th>
                                    <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {loading ? (
                                    <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                                ) : pacientes.length > 0 ? (
                                    pacientes.map((paciente) => (
                                        <tr key={paciente.id_paciente} className="hover:bg-blue-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <img className="h-10 w-10 rounded-full object-cover bg-gray-200" 
                                                             src={`/api/uploads/pacientes/${paciente.id_paciente}`} 
                                                             alt="Foto do paciente"
                                                             onError={(e) => { e.target.onerror = null; e.target.src='https://via.placeholder.com/40?text=S/F'; }}/>
                                                    </div>
                                                    <div className="ml-4 text-sm font-medium text-gray-900">{paciente.nome_completo}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.idade}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600 truncate max-w-sm" title={paciente.motivo}>
                                                {paciente.motivo || 'Não informado'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.supervisor_nome || 'Nenhum'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <button
                                                    onClick={() => handleAssumir(paciente.id_paciente)}
                                                    disabled={actionLoading === paciente.id_paciente}
                                                    className="px-4 py-2 bg-green text-white text-sm font-semibold rounded-lg shadow-md hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-wait transition-colors"
                                                >
                                                    {actionLoading === paciente.id_paciente ? 'Assumindo...' : 'Assumir'}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center py-16 px-4">
                                            <h3 className="text-lg font-medium text-gray-700">Nenhum paciente disponível no momento</h3>
                                            <p className="text-sm text-gray-500 mt-1">Verifique novamente mais tarde ou contate a secretaria.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </main>
        </>
    );
}