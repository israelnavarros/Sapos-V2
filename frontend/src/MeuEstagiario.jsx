import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';

export default function SupMeuEstagiario() {
    const { id_estagiario } = useParams();
    const [info, setInfo] = useState(null);

    useEffect(() => {
        async function fetchInfo() {
            const res = await fetch(`/api/sup_meu_estagiario/${id_estagiario}`, { credentials: 'include' });
            const data = await res.json();
            setInfo(data);
        }
        fetchInfo();
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
                            <a
                                key={paciente.id_paciente}
                                href={`/sup_ficha_paciente/${paciente.id_paciente}`}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                {paciente.nome_completo}
                                {paciente.status
                                    ? <span className="badge bg-primary rounded-pill">Ativo</span>
                                    : <span className="badge bg-danger rounded-pill">Desativado</span>
                                }
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Métricas */}
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
                                        <h3 className="mb-0">{info.media_idade?.toFixed(1) || 0}</h3>
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
        </>
    );
}