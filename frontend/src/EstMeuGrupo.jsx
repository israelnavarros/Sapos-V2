import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';

export default function EstMeuPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/meus_pacientes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPacientes(data))
      .catch(err => console.error('Erro ao carregar pacientes do grupo:', err))
      .finally(() => setLoading(false));
  }, []);

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
                        <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paciente.status = "true" ? 'bg-green text-white' : 'bg-gray-100 text-gray-800'}`}>
                          {paciente.status = "true" ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {paciente.atividade_recente || 'N/A'} {/* Assumindo que essa info virá da API */}
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
    </>
  );
}