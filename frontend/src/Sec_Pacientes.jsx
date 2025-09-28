import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom'; // Adicione Link
import Header from './Header';

function ActionsDropdown({ paciente }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);
   return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg z-10 border">
          <div className="py-1">
            <Link to={`/sec_ficha_paciente/${paciente.id_paciente}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>
              Editar Informações
            </Link>
            <Link to={`/adm_editar_paciente/${paciente.id_paciente}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>
              Alterar status
            </Link>
            <Link to={`/adm_editar_paciente/${paciente.id_paciente}`} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" onClick={() => setIsOpen(false)}>
              Alterar responsável
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SecPacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Use a rota correta para buscar os pacientes da secretaria
        fetch("/api/pacientes", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setPacientes(data || []);
            })
            .catch(err => console.error("Erro ao carregar pacientes:", err))
            .finally(() => setLoading(false));
    }, []);

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

    return (
        <>
            <Header />
            <main className="bg-gray-50 min-h-screen pt-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
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
                                                        <img className="h-10 w-10 rounded-full object-cover bg-gray-200" src={`/api/uploads/pacientes/${paciente.id_paciente}`} alt="Foto do paciente" />
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">{paciente.nome_completo}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${String(paciente.status).toLowerCase() === 'true' ? 'bg-green text-white' : 'bg-gray-100 text-gray-800'}`}>
                                                    {String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{formatarData(paciente.data_criacao)}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.supervisor_nome || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{paciente.estagiario_nome || 'Não atribuído'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {/* Usando o componente definido neste mesmo arquivo */}
                                                <ActionsDropdown paciente={paciente} />
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
            </main>
        </>
    );
}