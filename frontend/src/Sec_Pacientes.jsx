import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Header from "./Header";

export default function SecPacientes() {
    const [pacientes, setPacientes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/pacientes", { credentials: "include" })
            .then(res => res.json())
            .then(data => {
                setPacientes(data || []);
                setLoading(false);
            });
    }, []);

    return (
        <>
            <Header />
            <div className="shadow-lg row g-0 border rounded p-3">
                <div className="col-12 mb-4">
                    <h1 className="display-6 m-2 ms-5">Administração de Pacientes</h1>
                </div>
                {loading ? (
                    <div className="text-center py-5">Carregando...</div>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-striped" style={{ width: "100%" }}>
                            <thead>
                                <tr>
                                    <th>Nome</th>
                                    <th>Status</th>
                                    <th>Data de Criação</th>
                                    <th>Coordenador</th>
                                    <th>Estagiário</th>
                                    <th>Ações</th>
                                </tr>
                            </thead>
                            <tbody>
                                {pacientes.map(info => (
                                    <tr key={info.id_paciente}>
                                        <td>
                                            <Link to={`/sec_editar_paciente/${info.id_paciente}`}>
                                                {info.nome_completo}
                                            </Link>
                                        </td>
                                        <td>{info.status ? "Ativo" : "Desativado"}</td>
                                        <td>{formatarData(info.data_criacao)}</td>
                                        <td>{info.coordenador_nome}</td>
                                        <td>{info.estagiario_nome}</td>
                                        <td>
                                            <div className="dropdown">
                                                <button className="btn btn-secondary dropdown-toggle" type="button" data-bs-toggle="dropdown">
                                                    Ação
                                                </button>
                                                <ul className="dropdown-menu">
                                                    <li>
                                                        <Link className="dropdown-item" to={`/adm_editar_paciente/${info.id_paciente}`}>
                                                            Editar informações
                                                        </Link>
                                                    </li>
                                                    <li>
                                                        <Link className="dropdown-item" to={`/adm_mudar_status_paciente/${info.id_paciente}`}>
                                                            Alterar status
                                                        </Link>
                                                    </li>
                                                    <li><hr className="dropdown-divider" /></li>
                                                    <li>
                                                        <Link className="dropdown-item" to={`/adm_modificar_responsavel_paciente/${info.id_paciente}`}>
                                                            Alterar responsável
                                                        </Link>
                                                    </li>
                                                </ul>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </>
    );
}

// Função utilitária para formatar data (YYYY-MM-DD para DD/MM/YYYY)
function formatarData(dataStr) {
    if (!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
}