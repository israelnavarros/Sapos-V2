import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from './Header';

export default function EstMeuPacientes() {
  const [pacientes, setPacientes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/meus_pacientes', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setPacientes(data))
      .catch(err => console.error('Erro ao carregar pacientes do grupo:', err));
  }, []);

  return (
    <>
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <h1 className="text-2xl font-bold text-gray-800">Meu Grupo de Pacientes</h1>
          <button
            onClick={() => navigate('/est_adicionar_paciente')}
            className="border border-blue-600 text-blue-600 px-4 py-2 rounded hover:bg-blue-600 hover:text-white transition"
          >
            Adicionar Paciente
          </button>
        </div>

        <div className="overflow-x-auto bg-white shadow-md rounded-lg">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700"></th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Nome</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Data de entrada</th>
                <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Última atividade</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pacientes.map((paciente) => (
                <tr key={paciente.id_paciente} className="hover:bg-gray-50">
                  {/* <td className="px-4 py-2">
                    <Link to={`/est_ficha_paciente/${paciente.id_paciente}`}>
                      <img
                        src={`/api/imagem_paciente/${paciente.id_paciente}`}
                        alt="Foto do paciente"
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    </Link>
                  </td> */}
                  <td className="px-4 py-2 text-center">
                    <Link to={`/est_ficha_paciente/${paciente.id_paciente}`} className="text-blue-600 hover:underline">
                      {paciente.nome_completo}
                    </Link>
                  </td>
                  <td className="px-4 py-2 text-center">
                    {new Date(paciente.data_criacao).toLocaleDateString('pt-BR')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
