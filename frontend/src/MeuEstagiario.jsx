import { Link, useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API_URL from './config';
import Header from './Header';
import { Pie } from 'react-chartjs-2';
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

export default function SupMeuEstagiario() {
    const { id_estagiario } = useParams();
    const [info, setInfo] = useState(null);
    const [idadeData, setIdadeData] = useState(null);
    const [generoData, setGeneroData] = useState(null);
    const [escolaridadeData, setEscolaridadeData] = useState(null);
    const [rendaData, setRendaData] = useState(null);
    const [tab, setTab] = useState('pacientes'); // Estado para controlar as abas

    useEffect(() => {
        async function fetchInfo() {
            const res = await fetch(`${API_URL}/api/sup_meu_estagiario/${id_estagiario}`, { credentials: 'include' });
            const data = await res.json();
            setInfo(data);
        }
        fetchInfo();
    }, [id_estagiario]);

    // Função para gerar cores aleatórias
    function getRandomColors(n) {
        return Array.from({ length: n }, () =>
            `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
        );
    }

    // Buscar dados dos gráficos
    useEffect(() => {
        if (!id_estagiario) return;

        // Idade dos pacientes
        fetch(`${API_URL}/api/sup_primeira_estatistica_estagiario/${id_estagiario}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                // data é um array de idades, conte quantos de cada
                const ageCounts = data.reduce((acc, age) => {
                    acc[age] = (acc[age] || 0) + 1;
                    return acc;
                }, {});
                const labels = Object.keys(ageCounts);
                const values = Object.values(ageCounts);
                setIdadeData({
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: getRandomColors(labels.length)
                    }]
                });
            });

        // Gênero dos pacientes
        fetch(`${API_URL}/api/sup_segunda_estatistica_estagiario/${id_estagiario}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const traducaoMap = { 'M': 'Masculino', 'F': 'Feminino' };
                const labels = Object.keys(data).map(key => traducaoMap[key] || key);
                const values = Object.values(data);
                setGeneroData({
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: getRandomColors(labels.length)
                    }]
                });
            });

        // Escolaridade dos pacientes
        fetch(`${API_URL}/api/sup_terceira_estatistica_estagiario/${id_estagiario}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const traducao = {
                    'AN': 'Analfabeto', 'PE': 'Pré-Escolar', 'FI': 'Ensino Fundamental Incompleto',
                    'FC': 'Ensino Fundamental Completo', 'MI': 'Ensino Médio Incompleto',
                    'MC': 'Ensino Médio Completo', 'SI': 'Ensino Superior Incompleto', 'SC': 'Ensino Superior Completo'
                };
                const labels = Object.keys(data).map(key => traducao[key] || key);
                const values = Object.values(data);
                setEscolaridadeData({
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: getRandomColors(labels.length)
                    }]
                });
            });

        // Renda familiar dos pacientes
        fetch(`${API_URL}/api/sup_quarta_estatistica_estagiario/${id_estagiario}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                const translationMap = {
                    '<2000': 'Menor que R$2000',
                    '2000-3000': 'R$2000 a R$3000',
                    '3000-4000': 'R$3000 a R$4000',
                    '4000-5000': 'R$4000 a R$5000',
                    '>5000': 'Maior que R$5000'
                };
                const labels = Object.keys(data).map(key => translationMap[key] || key);
                const values = Object.values(data);
                setRendaData({
                    labels,
                    datasets: [{
                        data: values,
                        backgroundColor: getRandomColors(labels.length)
                    }]
                });
            });

    }, [id_estagiario]);

    if (!info) return <div>Carregando...</div>;

    return (
        <>
            <Header />
            <main className='mt-20 p-4'>
                <div className="container-geral container-principal">
                    {/* Painel Esquerdo com Informações do Estagiário */}
                    <div className="painel-esquerdo">
                        <img
                            src={`${API_URL}/api/uploads/usuarios/${id_estagiario}`}
                            alt={`Foto de ${info.estagiario_info.nome}`}
                            className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
                        />
                        <h2 className="text-xl font-semibold text-gray-800">{info.estagiario_info.nome}</h2>
                        <p className="text-sm text-gray-600">Matrícula: {info.estagiario_info.matricula}</p>
                        <p className="text-sm text-gray-600 mb-4">{info.estagiario_info.email}</p>

                        <div className="text-sm text-gray-500 space-y-2 my-4 text-left w-full">
                            <p><span className="font-semibold">Ingresso:</span> {new Date(info.estagiario_info.criado_em).toLocaleDateString('pt-BR')}</p>
                            <p><span className="font-semibold">Validade:</span> {new Date(info.estagiario_info.valido_ate).toLocaleDateString('pt-BR')}</p>
                        </div>

                        {/* Botões de Navegação das Abas */}
                        <div className="flex flex-col w-full mt-4">
                            <button
                                onClick={() => setTab('pacientes')}
                                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'pacientes' ? 'bg-green text-white' : 'bg-white text-gray-700'}`}
                            >
                                Pacientes do Estagiário
                            </button>
                            <button
                                onClick={() => setTab('estatisticas')}
                                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'estatisticas' ? 'bg-green text-white' : 'bg-white text-gray-700'}`}
                            >
                                Estatísticas
                            </button>
                        </div>
                    </div>

                    {/* Painel Direito com Conteúdo das Abas */}
                    <div className="painel-direito">
                        {/* Aba de Pacientes */}
                        {tab === 'pacientes' && (
                            <div className="pt-3">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Pacientes Atendidos</h3>
                                <p className="text-sm text-gray-500 mb-6">Lista de todos os pacientes sob a responsabilidade deste estagiário.</p>

                                <div className="space-y-3">
                                    {info.pacientes_info && info.pacientes_info.length === 0 ? (
                                        <div className="text-center py-8 px-4 bg-gray-50 rounded-lg">
                                            <p className="text-gray-500">Este estagiário ainda não possui pacientes.</p>
                                        </div>
                                    ) : (
                                        info.pacientes_info && info.pacientes_info.map(paciente => (
                                            <Link
                                                key={paciente.id_paciente}
                                                to={`/sup_ficha_paciente/${paciente.id_paciente}`}
                                                className="flex items-center justify-between p-4 bg-white rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-green-300 transition-all"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <img src={`${API_URL}/api/uploads/pacientes/${paciente.id_paciente}`} alt="" className="w-10 h-10 rounded-full object-cover bg-gray-200" />
                                                    <span className="font-medium text-gray-800">{paciente.nome_completo}</span>
                                                </div>
                                                <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${paciente.status ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {paciente.status ? 'Ativo' : 'Inativo'}
                                                </span>
                                            </Link>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Aba de Estatísticas */}
                        {tab === 'estatisticas' && (
                            <div className="pt-3">
                                <h3 className="text-xl font-bold text-gray-800 mb-2">Desempenho e Estatísticas</h3>
                                <p className="text-sm text-gray-500 mb-6">Análise do perfil dos pacientes atendidos pelo estagiário.</p>

                                {/* Cards de Resumo */}
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                                    <div className="bg-blue-50 p-4 rounded-lg text-center">
                                        <p className="text-sm text-blue-700">Média de Idade</p>
                                        <p className="text-2xl font-bold text-blue-900">{Number(info.media_idade).toFixed(1) || 0}</p>
                                    </div>
                                    <div className="bg-green-50 p-4 rounded-lg text-center">
                                        <p className="text-sm text-green-700">Fichas Preenchidas</p>
                                        <p className="text-2xl font-bold text-green-900">{info.quantidade_fichas || 0}</p>
                                    </div>
                                    <div className="bg-indigo-50 p-4 rounded-lg text-center">
                                        <p className="text-sm text-indigo-700">Consultas Realizadas</p>
                                        <p className="text-2xl font-bold text-indigo-900">{info.quantidade_consultas || 0}</p>
                                    </div>
                                    <div className="bg-orange-50 p-4 rounded-lg text-center">
                                        <p className="text-sm text-orange-700">Total de Horas</p>
                                        <p className="text-2xl font-bold text-orange-900">{info.total_horas_consultas?.toFixed(1) || 0}</p>
                                    </div>
                                </div>

                                {/* Gráficos */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        {idadeData ? <Pie data={idadeData} options={{ plugins: { title: { display: true, text: 'Idade dos Pacientes' } } }} /> : <p>Carregando...</p>}
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        {generoData ? <Pie data={generoData} options={{ plugins: { title: { display: true, text: 'Gênero dos Pacientes' } } }} /> : <p>Carregando...</p>}
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        {escolaridadeData ? <Pie data={escolaridadeData} options={{ plugins: { title: { display: true, text: 'Escolaridade dos Pacientes' } } }} /> : <p>Carregando...</p>}
                                    </div>
                                    <div className="bg-white p-4 rounded-lg shadow-sm border">
                                        {rendaData ? <Pie data={rendaData} options={{ plugins: { title: { display: true, text: 'Renda Familiar dos Pacientes' } } }} /> : <p>Carregando...</p>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </>
    );
}