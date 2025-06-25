import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function FichaPaciente() {
    const { id_paciente } = useParams();
    const [info, setInfo] = useState(null);
    const [folhas, setFolhas] = useState([]);
    const [estat1, setEstat1] = useState(null);
    const [estat2, setEstat2] = useState(null);
    const [estat3, setEstat3] = useState(null);
    const [tab, setTab] = useState('ficha'); // controle das abas

    useEffect(() => {
        console.log('useEffect rodou', id_paciente);
        fetch(`/api/sup_ficha_paciente/${id_paciente}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => {
                setInfo(data);
                setFolhas(data.folhas_pacientes || []);
            });

        fetch(`/api/est_primeira_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
            .then(res => {
                console.log('res', res);
                return res.json();
            })
            .then(data => {
                console.log('estat1:', data);
                setEstat1({
                    labels: ['Marcadas', 'Realizadas', 'Canceladas'],
                    datasets: [{
                        label: 'Consultas',
                        data: [data.marcadas, data.realizadas, data.canceladas],
                        backgroundColor: ['#0000ff', '#008000', '#ff0000'],
                    }]
                })
            }).catch(err => {
        console.error('Erro no fetch estat1:', err);
    });

        fetch(`/api/est_segunda_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setEstat2({
                labels: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
                datasets: [
                    { label: 'Marcadas', data: data.marcadas, backgroundColor: '#0000ff' },
                    { label: 'Realizadas', data: data.realizadas, backgroundColor: '#008000' },
                    { label: 'Canceladas', data: data.canceladas, backgroundColor: '#ff0000' }
                ]
            }));
        fetch(`/api/est_terceira_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
            .then(res => res.json())
            .then(data => setEstat3({
                labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
                datasets: [
                    { label: 'Marcadas', data: data.marcadas, backgroundColor: '#0000ff' },
                    { label: 'Realizadas', data: data.realizadas, backgroundColor: '#008000' },
                    { label: 'Canceladas', data: data.canceladas, backgroundColor: '#ff0000' }
                ]
            }));
    }, [id_paciente]);

    if (!info || !info.paciente) return <div>Carregando...</div>;
    const paciente = info.paciente;
    console.log(paciente);
    console.log(folhas);

    return (
        <>
            <Header />
            <div className="shadow-lg row g-0 border rounded p-3">
                {/* Abas simples */}
                <div style={{ display: 'flex', borderBottom: '1px solid #ccc', marginBottom: 16 }}>
                    <button onClick={() => setTab('ficha')} style={{ border: 'none', background: tab === 'ficha' ? '#eee' : 'transparent', padding: 10, cursor: 'pointer' }}>Dados do Paciente</button>
                    <button onClick={() => setTab('evolucao')} style={{ border: 'none', background: tab === 'evolucao' ? '#eee' : 'transparent', padding: 10, cursor: 'pointer' }}>Folha de Evolução</button>
                    <button onClick={() => setTab('estatisticas')} style={{ border: 'none', background: tab === 'estatisticas' ? '#eee' : 'transparent', padding: 10, cursor: 'pointer' }}>Estatísticas do Paciente</button>
                </div>


                {tab === 'ficha' && (
                    <div className="p-3">
                        <div className="text-center d-flex justify-content-center">
                            <figure className="img thumbnail col-md-4">
                                <img className="img-fluid" alt="Paciente" src={`/api/uploads/pacientes/${paciente.id_paciente}`} />
                            </figure>
                        </div>
                        <div className="row g-3">
                            <h3>Ficha de Atendimento</h3>
                            <div className="col-4">
                                <label>Supervisor</label>
                                <input className="form-control" value={paciente.id_supervisor || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Estagiário</label>
                                <input className="form-control" value={paciente.nome_estagiario || ''} readOnly />
                            </div>
                            <div className="col-2">
                                <label>Status</label>
                                <input className="form-control" value={paciente.status ? 'Ativo' : 'Desativado'} readOnly />
                            </div>
                            <div className="col-2">
                                <label>Data de Criação</label>
                                <input className="form-control" value={paciente.data_criacao || ''} readOnly />
                            </div>

                            <h3>Dados Pessoais do Paciente</h3>
                            <div className="col-12">
                                <label>Nome Completo</label>
                                <input className="form-control" value={paciente.nome_completo || ''} readOnly />
                            </div>
                            <div className="col-9">
                                <label>Nome do Responsável</label>
                                <input className="form-control" value={paciente.nome_responsavel || ''} readOnly />
                            </div>
                            <div className="col-3">
                                <label>Grau de Parentesco</label>
                                <input className="form-control" value={paciente.grau_parentesco || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Data de Nascimento</label>
                                <input className="form-control" value={paciente.data_nascimento || ''} readOnly />
                            </div>
                            <div className="col-2">
                                <label>Idade</label>
                                <input className="form-control" value={paciente.idade || ''} readOnly />
                            </div>
                            <div className="col-6">
                                <label>Sexo</label>
                                <input className="form-control" value={paciente.sexo || ''} readOnly />
                            </div>
                            <div className="col-12">
                                <label>Escolaridade</label>
                                <input className="form-control" value={paciente.escolaridade || ''} readOnly />
                            </div>
                            <div className="col-6">
                                <label>Profissão</label>
                                <input className="form-control" value={paciente.profissao || ''} readOnly />
                            </div>
                            <div className="col-6">
                                <label>Ocupação</label>
                                <input className="form-control" value={paciente.ocupacao || ''} readOnly />
                            </div>
                            <div className="col-6">
                                <label>Salário</label>
                                <input className="form-control" value={paciente.salario || ''} readOnly />
                            </div>
                            <div className="col-6">
                                <label>Renda Familiar</label>
                                <input className="form-control" value={paciente.renda_familiar || ''} readOnly />
                            </div>

                            <h3>Endereço</h3>
                            <div className="col-4">
                                <label>CEP</label>
                                <input className="form-control" value={paciente.cep || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Cidade</label>
                                <input className="form-control" value={paciente.cidade || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Bairro</label>
                                <input className="form-control" value={paciente.bairro || ''} readOnly />
                            </div>
                            <div className="col-8">
                                <label>Logradouro</label>
                                <input className="form-control" value={paciente.logradouro || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Complemento</label>
                                <input className="form-control" value={paciente.complemento || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Telefone</label>
                                <input className="form-control" value={paciente.telefone || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Celular 1</label>
                                <input className="form-control" value={paciente.celular1 || ''} readOnly />
                            </div>
                            <div className="col-4">
                                <label>Celular 2</label>
                                <input className="form-control" value={paciente.celular2 || ''} readOnly />
                            </div>
                            {/* Se tiver email no backend, descomente: */}
                            <div className="col-12">
                                <label>Email</label>
                                <input className="form-control" value={paciente.email || ''} readOnly />
                            </div>

                            <h3>Origem do Encaminhamento</h3>
                            <div className="col-12">
                                <label>Origem do Encaminhamento</label>
                                <input className="form-control" value={paciente.origem_encaminhamento || ''} readOnly />
                            </div>
                            <div className="col-12">
                                <label>Nome da Instituição</label>
                                <input className="form-control" value={paciente.nome_instituicao || ''} readOnly />
                            </div>
                            <div className="col-12">
                                <label>Nome de quem assinou o encaminhamento</label>
                                <input className="form-control" value={paciente.nome_resp_encaminhamento || ''} readOnly />
                            </div>

                            <h3>Motivo da Consulta</h3>
                            <div className="col-12">
                                <label>Motivo da Consulta</label>
                                <textarea className="form-control" value={paciente.motivo || ''} readOnly style={{ height: 100 }} />
                            </div>
                            <div className="col-12">
                                <label>Medicamentos</label>
                                <textarea className="form-control" value={paciente.medicamentos || ''} readOnly style={{ height: 100 }} />
                            </div>
                        </div>
                    </div>
                )}

                {tab === 'evolucao' && (
                    <div className="container pt-3">
                        {folhas.length > 0 ? folhas.map(folha => (
                            <div className="card mt-3" key={folha.id_folha}>
                                <div className="card-body">
                                    <div className="d-flex">
                                        <img src={`/api/uploads/usuarios/${folha.id_estagiario}`} className="rounded-circle me-3" style={{ width: 50, height: 50 }} alt="" />
                                        <div>
                                            <h5 className="card-title">{folha.nome_estagiario}</h5>
                                            <p className="card-text">{folha.data_postagem}</p>
                                        </div>
                                    </div>
                                    <div className="mt-3">
                                        <p className="card-text">{folha.postagem}</p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="card mt-3">
                                <div className="card-body text-center">
                                    <h5 className="card-title">Este paciente ainda não possui nenhum histórico de evolução.</h5>
                                    <p className="card-text">Você pode adicionar os primeiros dados agora.</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {tab === 'estatisticas' && (
                    <div className="container pt-3">
                        <div className="card mt-3">
                            <div className="card-body">
                                {estat1 && estat1.datasets[0].data.every(v => v === 0) ? (
                                    <div className="text-center text-muted">Nenhuma consulta marcada ainda</div>
                                ) : (
                                    estat1 && <Doughnut data={estat1} options={{ plugins: { title: { display: true, text: 'Consultas por Status' } }, rotation: 270, circumference: 180 }} />
                                )}
                            </div>
                        </div>
                        <div className="card mt-3">
                            <div className="card-body">
                                {estat2 && estat2.datasets.every(ds => ds.data.every(v => v === 0)) ? (
                                    <div className="text-center text-muted">Nenhuma consulta marcada ainda</div>
                                ) : (
                                    estat2 && <Bar data={estat2} options={{
                                        plugins: { title: { display: true, text: 'Consultas por Dia da Semana' } },
                                        responsive: true,
                                        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, min: 0, ticks: { stepSize: 1 } } }
                                    }} />
                                )}
                            </div>
                        </div>
                        <div className="card mt-3">
                            <div className="card-body">
                                {estat3 && estat3.datasets.every(ds => ds.data.every(v => v === 0)) ? (
                                    <div className="text-center text-muted">Nenhuma consulta marcada ainda</div>
                                ) : (
                                    estat3 && <Bar data={estat3} options={{
                                        plugins: { title: { display: true, text: 'Consultas por Horário' } },
                                        responsive: true,
                                        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, min: 0, ticks: { stepSize: 1 } } }
                                    }} />
                                )}
                            </div>
                            {/* <p>Cavbalo</p> */}
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}