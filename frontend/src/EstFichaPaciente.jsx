import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function EstFichaPaciente() {
  const { id_paciente } = useParams();
  const [info, setInfo] = useState(null);
  const [folhas, setFolhas] = useState([]);
  const [estat1, setEstat1] = useState(null);
  const [estat2, setEstat2] = useState(null);
  const [estat3, setEstat3] = useState(null);
  const [tab, setTab] = useState('ficha'); // Controle das abas

  useEffect(() => {
    console.log('useEffect rodou', id_paciente);

    // Fetch dos dados do paciente e folhas de evolução
    fetch(`/api/ficha_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        setFolhas(data.folhas_pacientes || []);
      })
      .catch(err => console.error('Erro ao carregar dados do paciente:', err));

    fetch(`/est_lista_folhas_atualizada/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setFolhas(data.folhas_pacientes || []);
      })
      .catch(err => console.error('Erro ao carregar folhas de evolução:', err));
    ;
    // Fetch das estatísticas
    fetch(`/api/est_primeira_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEstat1({
          labels: ['Marcadas', 'Realizadas', 'Canceladas'],
          datasets: [{
            label: 'Consultas',
            data: [data.marcadas, data.realizadas, data.canceladas],
            backgroundColor: ['#0000ff', '#008000', '#ff0000'],
          }]
        });
      })
      .catch(err => console.error('Erro ao carregar estatística 1:', err));

    fetch(`/api/est_segunda_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEstat2({
          labels: ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'],
          datasets: [
            { label: 'Marcadas', data: data.marcadas, backgroundColor: '#0000ff' },
            { label: 'Realizadas', data: data.realizadas, backgroundColor: '#008000' },
            { label: 'Canceladas', data: data.canceladas, backgroundColor: '#ff0000' }
          ]
        });
      })
      .catch(err => console.error('Erro ao carregar estatística 2:', err));

    fetch(`/api/est_terceira_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setEstat3({
          labels: ['06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
          datasets: [
            { label: 'Marcadas', data: data.marcadas, backgroundColor: '#0000ff' },
            { label: 'Realizadas', data: data.realizadas, backgroundColor: '#008000' },
            { label: 'Canceladas', data: data.canceladas, backgroundColor: '#ff0000' }
          ]
        });
      })
      .catch(err => console.error('Erro ao carregar estatística 3:', err));
  }, [id_paciente]);
  const handlePublicar = async (e) => {
    e.preventDefault();
    const formData = new FormData(document.getElementById('cadastrar_evolucao'));
    try {
      const res = await fetch('/api/est_ficha_adicionada', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (res.ok) {
        const updatedFolhas = await fetch(`/api/est_lista_folhas_atualizada/${id_paciente}`, { credentials: 'include' });
        const folhasData = await updatedFolhas.json();
        setFolhas(folhasData.folhas_pacientes || []);
        document.getElementById('cadastrar_evolucao').reset();
      }
    } catch (err) {
      console.error('Erro ao publicar evolução:', err);
    }
  };

  const handleRemover = async (idFolha) => {
    try {
      const res = await fetch(`/api/est_ficha_deletada/${idFolha}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        const updatedFolhas = await fetch(`/est_lista_folhas_atualizada/${id_paciente}`, { credentials: 'include' });
        const folhasData = await updatedFolhas.json();
        setFolhas(folhasData.folhas_pacientes || []);
      }
    } catch (err) {
      console.error('Erro ao excluir evolução:', err);
    }
  };

  if (!info || !info.paciente) return <div>Carregando...</div>;
  const paciente = info.paciente;

  return (
    <>
      <Header />
      <main className='mt-20 p-4 '>
        <div className="container-principal">
          <div className="painel-esquerdo">
            <img
              src={`/api/uploads/pacientes/${paciente.id_paciente}`}
              alt="Foto do paciente"
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-800">{paciente.nome_completo}</h2>
            <p className="text-sm text-gray-600">Idade: {paciente.idade}</p>
            <p className="text-sm text-gray-600 mb-4">
              Status
            </p>
            <h2 className="text-xl font-semibold text-gray-800">{paciente.status = "true" ? 'Ativo' : 'Desativado'}</h2>

            <div className="flex flex-col ">
              <button
                onClick={() => setTab('ficha')}
                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'ficha'
                  ? 'bg-green text-white'
                  : 'bg-white text-gray-700'
                  }`}
              >
                Dados do Paciente
              </button>

              <button onClick={() => setTab('evolucao')} className={`py-2 px-4 font-medium  border-0 border-t-2 border-[#A8D5BA] ${tab === 'evolucao' ? 'bg-green text-white' : 'bg-white text-gray-700'
                }`}>Folha de Evolução</button>
              <button onClick={() => setTab('estatisticas')} className={`py-2 px-4 font-medium  border-0 border-t-2 border-[#A8D5BA] ${tab === 'estatisticas' ? 'bg-green text-white' : 'bg-white text-gray-700'
                }`}>Estatísticas do Paciente</button>
            </div>
          </div>
          <div className="painel-direito">
            {tab === 'ficha' && (
              <div className="pt-3">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Ficha de Atendimento</h3>
                <p className="text-sm text-gray-500 mb-4">Sample</p>
                <div className="text-center d-flex justify-content-center">
                  <figure className="img thumbnail col-md-4">
                    <img className="img-fluid" alt="Paciente" src={`/api/uploads/pacientes/${paciente.id_paciente}`} />
                  </figure>
                </div>
                <div className="row g-3">
                  <div className="col-4">
                    <label>Supervisor</label>
                    <input className="text-gray-800" value={paciente.id_supervisor || ''} readOnly />
                  </div>
                  <div className="col-4">
                    <label>Estagiário</label>
                    <input className="text-gray-800" value={paciente.nome_estagiario || ''} readOnly />
                  </div>
                  <div className="col-2">
                    <label>Status</label>
                    <input className="text-gray-800" value={paciente.status ? 'Ativo' : 'Desativado'} readOnly />
                  </div>
                  <div className="col-2">
                    <label>Data de Criação</label>
                    <input className="text-gray-800" value={paciente.data_criacao || ''} readOnly />
                  </div>

                  <h3>Dados Pessoais do Paciente</h3>
                  <div className="col-12">
                    <label>Nome Completo</label>
                    <input className="text-gray-800" value={paciente.nome_completo || ''} readOnly />
                  </div>
                  <div className="col-9">
                    <label>Nome do Responsável</label>
                    <input className="text-gray-800" value={paciente.nome_responsavel || ''} readOnly />
                  </div>
                  <div className="col-3">
                    <label>Grau de Parentesco</label>
                    <input className="text-gray-800" value={paciente.grau_parentesco || ''} readOnly />
                  </div>
                  <div className="col-4">
                    <label>Data de Nascimento</label>
                    <input className="text-gray-800" value={paciente.data_nascimento || ''} readOnly />
                  </div>
                  <div className="col-2">
                    <label>Idade</label>
                    <input className="text-gray-800" value={paciente.idade || ''} readOnly />
                  </div>
                  <div className="col-6">
                    <label>Sexo</label>
                    <input className="text-gray-800" value={paciente.sexo || ''} readOnly />
                  </div>
                  <div className="col-12">
                    <label>Escolaridade</label>
                    <input className="text-gray-800" value={paciente.escolaridade || ''} readOnly />
                  </div>
                  <div className="col-6">
                    <label>Profissão</label>
                    <input className="text-gray-800" value={paciente.profissao || ''} readOnly />
                  </div>
                  <div className="col-6">
                    <label>Ocupação</label>
                    <input className="text-gray-800" value={paciente.ocupacao || ''} readOnly />
                  </div>
                  <div className="col-6">
                    <label>Salário</label>
                    <input className="text-gray-800" value={paciente.salario || ''} readOnly />
                  </div>
                  <div className="col-6">
                    <label>Renda Familiar</label>
                    <input className="text-gray-800" value={paciente.renda_familiar || ''} readOnly />
                  </div>
                </div>
              </div>
            )}
            {tab === 'evolucao' && (
              <div className="pt-3">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Evolução do Paciente</h3>
                <p className="text-sm text-gray-500 mb-4">Visualize e valide as atualizações feitas pelos estagiários a cada sessão.</p>
                <form id="cadastrar_evolucao" onSubmit={handlePublicar}>
                  <input type="hidden" name="id_paciente" value={paciente.id_paciente} />
                  <textarea className="form-control mb-3" name="postagem" rows="3" placeholder="Escreva sua postagem aqui..." />
                  <button type="submit" className="btn btn-primary">Publicar</button>
                </form>

                <div id="ListaDeFolhas">
                  {folhas.length === 0 ? (
                    <div className="card mt-3 text-center">
                      <div className="card-body">
                        <h5>Este paciente ainda não possui nenhum histórico de evolução.</h5>
                        <p>Você pode adicionar os primeiros dados agora.</p>
                      </div>
                    </div>
                  ) : (
                    folhas.map(folha => (
                      <div className="card mt-4" key={folha.id_folha}>
                        <div className="card-header bg-light d-flex justify-content-between align-items-center">
                          <span className="text-muted small">{folha.data_postagem}</span>
                        </div>

                        <div className="card-body border border-[#B8C6D1] border-secondary rounded">
                          <div className="flex items-center justify-between mb-2">
                            <img
                              src={`/api/uploads/usuarios/${folha.id_estagiario}`}
                              alt="Estagiário"
                              className="rounded-full object-cover w-12 h-12 sm:w-15 sm:h-15 md:w-17 md:h-17"
                            />
                            <div>
                              <small>Nome do Estagiário</small>
                              <h6 className="mb-0">{folha.nome_estagiario}</h6>
                            </div>
                            <div className='col'>
                              <small>Nº da Sessão</small>
                              <h1 className="text-muted">{folha.numero_sessao}</h1>
                            </div>

                            <div className="ms-auto">
                              <button
                                disabled={folha.status_validacao === 'Validação Pendente'}
                                className={`flex items-center justify-between  w-[240px] px-4 py-2 text-sm sm:text-base font-semibold rounded-md border transition-all
                                ${folha.status_validacao === 'Validação Pendente' ? 'border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed' :
                                    folha.status_validacao === 'Reprovado' ? 'border-[#BD4343] text-[#BD4343] hover:bg-red-50 cursor-pointer' :
                                      'border-green-600 text-green hover:bg-green-50 cursor-pointer'}`}
                                onClick={() => {
                                  if (folha.status_validacao !== 'Validação Pendente') {
                                    console.log(`Status clicado: ${folha.status_validacao}`);
                                  }
                                }}
                              >
                                {/* Ícone dentro de círculo */}
                                <span className={`flex items-center justify-center w-6 h-6 rounded-full
                                ${folha.status_validacao === 'Aprovado' ? 'bg-green text-white' :
                                    folha.status_validacao === 'Reprovado' ? 'bg-[#BD4343] text-white' :
                                      'bg-gray-200 text-gray-500'}`}>
                                  {folha.status_validacao === 'Aprovado' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                    </svg>
                                  )}
                                  {folha.status_validacao === 'Reprovado' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                  )}
                                  {folha.status_validacao === 'Validação Pendente' && (
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 2m6-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                </span>

                                {/* Texto do status */}
                                <span className="flex-grow text-left">{folha.status_validacao}</span>

                                {/* Seta para baixo se clicável */}
                                {folha.status_validacao !== 'Validação Pendente' && (
                                  <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </button>
                            </div>


                            <button className="btn btn-outline-danger btn-sm" onClick={() => handleRemover(folha.id_folha)}>Excluir</button>
                          </div>

                          <div className="mt-3">
                            <p className="text-dark">{folha.postagem}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {tab === 'estatisticas' && (
              <div className="pt-3">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Estatísticas do Paciente</h3>
                <p className="text-sm text-gray-500 mb-4">Sample</p>
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
                </div>
              </div>
            )}
          </div>

        </div>
        </main>
      </>
      );
}