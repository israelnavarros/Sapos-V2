import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Header from './Header';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function InfoCampo({ label, value }) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <input
        className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
        value={value || 'Não informado'}
        readOnly
      />
    </div>
  );
}

export default function EstFichaPaciente() {
  const { id_paciente } = useParams();
  const [info, setInfo] = useState(null);
  const [folhas, setFolhas] = useState([]);
  const [estat1, setEstat1] = useState(null);
  const [estat2, setEstat2] = useState(null);
  const [estat3, setEstat3] = useState(null);
  const [tab, setTab] = useState('ficha'); // Controle das abas
  const [fichaTab, setFichaTab] = useState('atendimento');

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
                <h3 className="text-xl font-bold text-gray-800 mb-4">Ficha de Atendimento</h3>


                <div className="flex border-b border-gray-200 mb-4">
                  <button
                    onClick={() => setFichaTab('atendimento')}
                    className={`py-2 px-4 font-medium transition-colors ${fichaTab === 'atendimento' ? 'border-b-2 border-green text-green' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                    Ficha de Atendimento
                  </button>
                  <button
                    onClick={() => setFichaTab('pessoais')}
                    className={`py-2 px-4 font-medium transition-colors ${fichaTab === 'pessoais' ? 'border-b-2 border-green text-green' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                    Dados Pessoais
                  </button>
                  <button
                    onClick={() => setFichaTab('endereco')}
                    className={`py-2 px-4 font-medium transition-colors ${fichaTab === 'endereco' ? 'border-b-2 border-green text-green' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                    Endereço
                  </button>
                  <button
                    onClick={() => setFichaTab('encaminhamento')}
                    className={`py-2 px-4 font-medium transition-colors ${fichaTab === 'encaminhamento' ? 'border-b-2 border-green text-green' : 'text-gray-500 hover:bg-gray-100'
                      }`}
                  >
                    Origem
                  </button>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {fichaTab === 'atendimento' && (
                    <>
                      <InfoCampo label="Nome do Estagiário" value={paciente.nome_estagiario} />
                      <InfoCampo label="Nome do Supervisor" value={paciente.nome_supervisor} />
                      <InfoCampo label="Data da Criação" value={paciente.data_criacao} />
                      <InfoCampo label="Já fez terapia anteriormente?" value={paciente.ja_fez_terapia} />
                      <div className="md:col-span-2">
                        <InfoCampo label="Hipótese Diagnóstica" value={paciente.hipotese_diagnostica} />
                      </div>
                      <div className="md:col-span-2">
                        <InfoCampo label="Medicamentos em uso" value={paciente.medicamentos} />
                      </div>
                    </>
                  )}

                  {fichaTab === 'pessoais' && (
                    <>
                      <InfoCampo label="Nome Completo" value={paciente.nome_completo} />
                      <InfoCampo label="Data de Nascimento" value={paciente.data_nascimento} />
                      <InfoCampo label="Idade" value={paciente.idade} />
                      <InfoCampo label="Sexo" value={paciente.sexo} />
                      <InfoCampo label="Telefone" value={paciente.telefone} />
                      <InfoCampo label="Celular 1" value={paciente.celular1} />
                      <InfoCampo label="Celular 2" value={paciente.celular2} />
                      <InfoCampo label="Email" value={paciente.email} />
                      <InfoCampo label="Nome do Responsável" value={paciente.nome_responsavel} />
                      <InfoCampo label="Grau de Parentesco" value={paciente.grau_parentesco} />
                      <InfoCampo label="Escolaridade" value={paciente.escolaridade} />
                      <InfoCampo label="Profissão" value={paciente.profissao} />
                      <InfoCampo label="Ocupação" value={paciente.ocupacao} />
                      <InfoCampo label="Salário" value={paciente.salario} />
                      <InfoCampo label="Renda Familiar" value={paciente.renda_familiar} />
                      <InfoCampo label="Status do Paciente" value={paciente.status ? 'Ativo' : 'Desativado'} />
                    </>
                  )}

                  {fichaTab === 'endereco' && (
                    <>
                      <InfoCampo label="CEP" value={paciente.cep} />
                      <InfoCampo label="Rua / Logradouro" value={paciente.logradouro} />
                      <InfoCampo label="Número" value={paciente.endereco_numero} />
                      <InfoCampo label="Complemento" value={paciente.complemento} />
                      <InfoCampo label="Bairro" value={paciente.bairro} />
                      <InfoCampo label="Cidade" value={paciente.cidade} />
                      <InfoCampo label="Estado" value={paciente.estado} />
                    </>
                  )}

                  {fichaTab === 'encaminhamento' && (
                    <>
                      <div className="md:col-span-2">
                        <InfoCampo label="Origem do Encaminhamento" value={paciente.origem_encaminhamento} />
                      </div>

                      <InfoCampo label="Nome Instituição" value={paciente.cep} />
                      <InfoCampo label="Nome Responsável Encaminhamento" value={paciente.logradouro} />

                      <div className="md:col-span-2">
                        <InfoCampo label="Motivo" value={paciente.motivo} />
                      </div>
                    </>
                  )}
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