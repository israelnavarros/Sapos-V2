import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';
import Modal from './Modal';
import { Bar, Doughnut } from 'react-chartjs-2';
import API_URL from './config';
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

function CampoEvolucao({ label, texto }) {
  const hasText = texto && texto.trim() !== '';
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-500">{label}</label>
      <textarea
        className={`w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800 ${!hasText ? 'italic text-slate-400' : ''}`}
        value={hasText ? texto : 'Não informado'}
        readOnly
        rows="2"
      />
    </div>
  );
}

function FeedbackCard({ folha }) {
  if (!folha.feedback) return null;
  const isApproved = folha.status_validacao === 'Aprovado';
  const borderColor = isApproved ? 'border-green' : 'border-[#BD4343]';
  const bgColor = isApproved ? 'bg-green-50' : 'bg-red-50';
  const textColor = isApproved ? 'text-green-800' : 'text-red-800';
  const icon = isApproved
    ? <i className="bi bi-check-circle-fill text-green"></i>
    : <i className="bi bi-x-circle-fill text-[#BD4343]"></i>;

  return (
    <div className={`p-4 rounded-lg border ${borderColor} ${bgColor} mb-4`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h4 className={`text-md font-bold ${textColor}`}>Feedback do Supervisor</h4>
      </div>
      <p className="text-sm text-slate-700 whitespace-pre-wrap">{folha.feedback}</p>
      {folha.data_status && (
        <p className="text-xs text-slate-500 mt-2 text-right">Respondido em: {new Date(folha.data_status).toLocaleString('pt-BR')}</p>
      )}
    </div>
  );
}

function Tag({ nome }) {
  const stringToColor = (str) => {
    if (!str) return 'hsl(0, 0%, 40%)';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 25%, 40%)`;
  };
  const tagColor = stringToColor(nome);
  return (
    <div className="px-3 py-1 text-sm font-medium text-white rounded-full shadow-sm" style={{ backgroundColor: tagColor }}>{nome}</div>
  );
}

export default function SecFichaPaciente() {
  const { id_paciente } = useParams();
  const [info, setInfo] = useState(null);
  const [folhas, setFolhas] = useState([]);
  const [tab, setTab] = useState('ficha');
  const [fichaTab, setFichaTab] = useState('atendimento');
  const [expandedFolhaId, setExpandedFolhaId] = useState(null);
  const [feedbackModalState, setFeedbackModalState] = useState({ isOpen: false, folha: null });

  useEffect(() => {
    fetch(`${API_URL}/api/sec_ficha_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        setFolhas(data.folhas_pacientes || []);
      })
      .catch(err => console.error('Erro ao carregar dados do paciente:', err));
  }, [id_paciente]);

  if (!info || !info.paciente) return <div>Carregando...</div>;
  const paciente = info.paciente;

  return (
    <>
      <Header />
      <main className='mt-20 p-4'>
        {/* SEÇÃO DE TAGS */}
        <div className="container-geral px-4 sm:px-6 lg:px-8 mb-4">
          <div className="p-4 rounded-lg flex items-center justify-between flex-wrap gap-y-3 gap-x-4">
            <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-600">Tags do Paciente</h4>
                {paciente.tags && paciente.tags.length > 0
                    ? paciente.tags.map(tag => <Tag key={tag.id_tag} nome={tag.nome} />)
                    : <p className="text-sm text-gray-400 italic">Nenhuma tag atribuída.</p>}
            </div>
          </div>
        </div>

        <div className="container-geral container-principal">
          <div className="painel-esquerdo">
            <img
              src={`${API_URL}/api/uploads/pacientes/${paciente.id_paciente}`}
              alt="Foto do paciente"
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4"
            />
            <h2 className="text-xl font-semibold text-gray-800">{paciente.nome_completo}</h2>
            <p className="text-sm text-gray-600">Idade: {paciente.idade}</p>
            <p className="text-sm text-gray-600 mb-4">Status:</p>
            <h2 className="text-xl font-semibold text-gray-800">{String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}</h2>

            <div className="flex flex-col mt-4">
              <button onClick={() => setTab('ficha')} className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'ficha' ? 'bg-green text-white' : 'bg-white text-gray-700'}`}>Dados do Paciente</button>
              <button onClick={() => setTab('evolucao')} className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'evolucao' ? 'bg-green text-white' : 'bg-white text-gray-700'}`}>Folha de Evolução</button>
            </div>
          </div>

          <div className="painel-direito">
            {tab === 'ficha' && (
              <div className="pt-3">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do Paciente</h3>
                    <p className="text-sm text-gray-500">Visualize as informações cadastrais do paciente.</p>
                  </div>
                  <Link
                    to={`/sec_editar_paciente/${paciente.id_paciente}`}
                    className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
                  >
                    <i className="bi bi-pencil-square"></i>
                    Editar Ficha do Paciente
                  </Link>
                </div>

                <div className="flex border-b border-gray-200 mb-4 overflow-x-auto">
                  {['atendimento', 'pessoais', 'endereco', 'encaminhamento'].map(t => (
                    <button
                      key={t}
                      onClick={() => setFichaTab(t)}
                      className={`py-2 px-4 font-medium transition-colors whitespace-nowrap ${fichaTab === t ? 'border-b-2 border-green text-green' : 'text-gray-500 hover:bg-gray-100'}`}
                    >
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                  {fichaTab === 'atendimento' && (
                    <>
                      <InfoCampo label="Nome do Estagiário" value={paciente.nome_estagiario} />
                      <InfoCampo label="Nome do Supervisor" value={paciente.nome_supervisor} />
                      <InfoCampo label="Data da Criação" value={paciente.data_criacao} />
                      <div className="flex md:col-span-2 gap-4">
                        <InfoCampo label="Já fez terapia anteriormente?" value={paciente.ja_fez_terapia == null ? 'Não informado' : (paciente.ja_fez_terapia ? 'Sim' : 'Não')} />
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
                      <InfoCampo label="Etnia" value={paciente.etnia} />
                      <InfoCampo label="Gênero" value={paciente.genero} />
                      <InfoCampo label="Telefone" value={paciente.telefone} />
                      <InfoCampo label="Celular 1" value={paciente.celular1} />
                      <InfoCampo label="Celular 2" value={paciente.celular2} />
                      <InfoCampo label="Email" value={paciente.email} />
                      <InfoCampo label="Nome do Responsável" value={paciente.nome_responsavel} />
                      <InfoCampo label="Grau de Parentesco" value={paciente.grau_parentesco} />
                      <InfoCampo label="Escolaridade" value={paciente.escolaridade} />
                      <InfoCampo label="Classe Social" value={paciente.classe_social} />
                      <InfoCampo label="Profissão" value={paciente.profissao} />
                      <InfoCampo label="Ocupação" value={paciente.ocupacao} />
                      <InfoCampo label="Salário" value={paciente.salario} />
                      <InfoCampo label="Renda Familiar" value={paciente.renda_familiar} />
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
                      <InfoCampo label="Nome Instituição" value={paciente.nome_instituicao} />
                      <InfoCampo label="Nome Responsável Encaminhamento" value={paciente.nome_resp_encaminhamento} />
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
                <p className="text-sm text-gray-500 mb-4">Histórico de sessões (Visualização da Secretaria).</p>
                
                <div id="ListaDeFolhas">
                  {folhas.length === 0 ? (
                    <div className="card mt-3 text-center">
                      <div className="card-body">
                        <h5>Este paciente ainda não possui nenhum histórico de evolução.</h5>
                      </div>
                    </div>
                  ) : (
                    folhas.map(folha => {
                      const isExpanded = expandedFolhaId === folha.id_folha;
                      return (
                        <div className="bg-white rounded-xl shadow mb-6 border border-slate-200" key={folha.id_folha}>
                          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
                            <p className="text-sm font-semibold text-slate-700">Sessão #{folha.numero_sessao}</p>
                            <p className="text-xs text-slate-500">{new Date(folha.data_postagem).toLocaleString('pt-BR')}</p>
                          </div>
                          <div className="card-body">
                            <div className="flex items-center justify-between p-4 md:p-4">
                              <div className="flex items-center gap-4">
                                <img
                                  src={`${API_URL}/api/uploads/usuarios/${folha.id_estagiario}`}
                                  alt="Estagiário"
                                  className="rounded-full object-cover w-12 h-12"
                                />
                                <div>
                                  <small>Estagiário</small>
                                  <h6 className="font-bold text-slate-800">{folha.nome_estagiario}</h6>
                                </div>
                              </div>
                              <div className="ms-auto flex items-center">
                                <button
                                  onClick={() => {
                                    if (folha.status_validacao !== 'Validação Pendente') {
                                      setFeedbackModalState({ isOpen: true, folha: folha });
                                    }
                                  }}
                                  className={`px-3 py-1 rounded-full text-sm font-medium cursor-pointer transition-colors ${
                                    folha.status_validacao === 'Aprovado' ? 'bg-green-100 text-green-800 hover:bg-green-200' :
                                    folha.status_validacao === 'Reprovado' ? 'bg-red-100 text-red-800 hover:bg-red-200' :
                                    'bg-yellow-100 text-yellow-800'
                                  }`}>
                                  {folha.status_validacao}
                                </button>
                                <button 
                                  onClick={() => setExpandedFolhaId(isExpanded ? null : folha.id_folha)}
                                  className="p-2 rounded-full hover:bg-slate-100 transition-colors ml-4 cursor-pointer"
                                >
                                  <svg className={`w-6 h-6 text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                  </svg>
                                </button>
                              </div>
                            </div>

                            {isExpanded && (
                              <>
                                <div className="border-t border-slate-200"></div>
                                <div className="w-full">
                                  <div className="p-4 md:p-6 w-full">
                                    <div className="md:col-span-2"><FeedbackCard folha={folha} /></div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
                                      <div className="md:col-span-2">
                                        <CampoEvolucao label="Hipótese Diagnóstica" texto={folha.hipotese_diagnostica} />
                                      </div>
                                      <div>
                                        <CampoEvolucao label="Sintomas Atuais" texto={folha.sintomas_atuais} />
                                      </div>
                                      <div>
                                        <CampoEvolucao label="Intervenções Realizadas" texto={folha.intervencoes_realizadas} />
                                      </div>
                                      <div className="md:col-span-2">
                                        <CampoEvolucao label="Evolução Clínica" texto={folha.evolucao_clinica} />
                                      </div>
                                      <div className="md:col-span-2">
                                        <CampoEvolucao label="Plano para a Próxima Sessão" texto={folha.plano_proxima_sessao} />
                                      </div>
                                      <div className="md:col-span-2">
                                        <CampoEvolucao label="Observações" texto={folha.observacoes} />
                                      </div>
                                      {folha.valor && (
                                        <div>
                                          <label className="block text-sm font-medium text-gray-500">Valor</label>
                                          <input className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800" value={folha.valor} readOnly />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {feedbackModalState.isOpen && (
        <Modal
          onClose={() => setFeedbackModalState({ isOpen: false, folha: null })}
          title={`Feedback - Sessão #${feedbackModalState.folha?.numero_sessao}`}
        >
          <div className="space-y-4">
            {feedbackModalState.folha?.feedback ? (
              <div className={`p-4 rounded-lg border ${
                feedbackModalState.folha.status_validacao === 'Aprovado' 
                  ? 'border-green bg-green-50' 
                  : 'border-[#BD4343] bg-red-50'
              }`}>
                <div className="flex items-center gap-3 mb-3">
                  {feedbackModalState.folha.status_validacao === 'Aprovado' ? (
                    <i className="bi bi-check-circle-fill text-green text-2xl"></i>
                  ) : (
                    <i className="bi bi-x-circle-fill text-[#BD4343] text-2xl"></i>
                  )}
                  <h4 className={`text-lg font-bold ${
                    feedbackModalState.folha.status_validacao === 'Aprovado' 
                      ? 'text-green' 
                      : 'text-[#BD4343]'
                  }`}>
                    {feedbackModalState.folha.status_validacao === 'Aprovado' ? 'Aprovado' : 'Reprovado'}
                  </h4>
                </div>
                <p className="text-sm text-slate-700 whitespace-pre-wrap mb-3 leading-relaxed">
                  {feedbackModalState.folha.feedback}
                </p>
                {feedbackModalState.folha.data_status && (
                  <p className="text-xs text-slate-500">
                    Respondido em: {new Date(feedbackModalState.folha.data_status).toLocaleString('pt-BR')}
                  </p>
                )}
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-gray-50 border border-gray-200 text-center">
                <i className="bi bi-info-circle text-gray-400 text-2xl mb-2 block"></i>
                <p className="text-sm text-gray-600 font-medium">Feedback não preenchido</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
}