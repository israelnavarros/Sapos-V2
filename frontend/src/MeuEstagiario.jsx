import { useParams } from 'react-router-dom';
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
            <div className="shadow-lg row g-0 border rounded my-4">
                <div className="p-4">
                    <div className="row align-items-center">
                        <div className="col-md-3 text-center">
                            <img src={info.estagiario_info.avatar_url} alt={info.estagiario_info.nome} className="img-fluid profile-card" />
                        </div>
                        <div className="col-md-9">
                            <h3 className="mb-3">{info.estagiario_info.nome}</h3>
                            <div className="mb-3">
                                <label className="form-label">Email:</label>
                                <input type="text" className="form-control" value={info.estagiario_info.email} readOnly />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Matrícula:</label>
                                <input type="text" className="form-control" value={info.estagiario_info.matricula} readOnly />
                            </div>
                            <div className="row">
                                <div className="mb-3 col-6">
                                    <label className="form-label">Data de Ingresso:</label>
                                    <input type="date" className="form-control" value={info.estagiario_info.criado_em} readOnly />
                                </div>
                                <div className="mb-3 col-6">
                                    <label className="form-label">Data de Validade:</label>
                                    <input type="date" className="form-control" value={info.estagiario_info.valido_ate} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            {/* Adicione aqui as listas de pacientes, estatísticas, etc, conforme o JSON retornado pelo backend */}
            <div className="shadow-lg row g-0 border rounded my-4">
                <div className="p-4">
                    <h4 className="mb-4">Lista de Pacientes</h4>
                    <div className="list-group">
                        {info.pacientes_info && info.pacientes_info.length === 0 && (
                            <div className="list-group-item">Nenhum paciente cadastrado.</div>
                        )}
                        {info.pacientes_info && info.pacientes_info.map(paciente => (
                            <Link
                                key={paciente.id_paciente}
                                href={`/sup_ficha_paciente/${paciente.id_paciente}`}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                {paciente.nome_completo}
                                {paciente.status
                                    ? <span className="badge bg-primary rounded-pill">Ativo</span>
                                    : <span className="badge bg-danger rounded-pill">Desativado</span>
                                }
                            </Link>
                        ))}
                    </div>
                </div>
            </div>


            <div className="shadow-lg row g-0 border rounded my-4">
                <div className="p-4">
                    <div className="row">
                        <div className="col-md-3 mb-3">
                            <div className="card h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="icon-wrapper" style={{ flex: "0 0 30%" }}>
                                        <i className="bi bi-people-fill" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <div className="text-wrapper text-end" style={{ flex: "1 0 70%" }}>
                                        <h3 className="mb-0">{Number(info.media_idade).toFixed(1) || 0}</h3>
                                        <span className="text-muted">Média de idade dos pacientes</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="icon-wrapper" style={{ flex: "0 0 30%" }}>
                                        <i className="bi bi-clipboard2-pulse-fill" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <div className="text-wrapper text-end" style={{ flex: "1 0 70%" }}>
                                        <h3 className="mb-0">{info.quantidade_fichas || 0}</h3>
                                        <span className="text-muted">Fichas preenchidas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="icon-wrapper" style={{ flex: "0 0 30%" }}>
                                        <i className="bi bi-calendar-check-fill" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <div className="text-wrapper text-end" style={{ flex: "1 0 70%" }}>
                                        <h3 className="mb-0">{info.quantidade_consultas || 0}</h3>
                                        <span className="text-muted">Consultas realizadas</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="col-md-3 mb-3">
                            <div className="card h-100">
                                <div className="card-body d-flex align-items-center">
                                    <div className="icon-wrapper" style={{ flex: "0 0 30%" }}>
                                        <i className="bi bi-stopwatch-fill" style={{ fontSize: "2rem" }}></i>
                                    </div>
                                    <div className="text-wrapper text-end" style={{ flex: "1 0 70%" }}>
                                        <h3 className="mb-0">{info.total_horas_consultas?.toFixed(1) || 0}</h3>
                                        <span className="text-muted">Horas de consulta</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div className="shadow-lg row g-0 border rounded my-4">
                <div className="p-4">
                    <h4>Desempenho</h4>
                    <div className="row">
                        <div className="col-md-6 mb-3">
                            {idadeData && <Pie data={idadeData} options={{ plugins: { title: { display: true, text: 'Idade dos Pacientes' }}}} />}
                        </div>
                        <div className="col-md-6 mb-3">
                            {generoData && <Pie data={generoData} options={{ plugins: { title: { display: true, text: 'Gênero dos Pacientes' }}}} />}
                        </div>
                        <div className="col-md-6 mb-3">
                            {escolaridadeData && <Pie data={escolaridadeData} options={{ plugins: { title: { display: true, text: 'Escolaridade dos Pacientes' }}}} />}
                        </div>
                        <div className="col-md-6 mb-3">
                            {rendaData && <Pie data={rendaData} options={{ plugins: { title: { display: true, text: 'Renda Familiar dos Pacientes' }}}} />}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}