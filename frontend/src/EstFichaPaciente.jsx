import React, { useEffect, useState } from 'react';

import { useParams, Link } from 'react-router-dom';
import Header from './Header';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import API_URL from './config';
import Modal from './Modal';

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
  // Função para gerar uma cor com base no nome da tag para consistência
  const stringToColor = (str) => {
    if (!str) return 'hsl(0, 0%, 40%)'; // Cor padrão para string vazia
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 15%, 40%)`; // Matiz (0-360), Saturação (45%), Luminosidade (40%)
  };

  const tagColor = stringToColor(nome);

  return (
    <div className="px-3 py-1 text-sm font-medium text-white rounded-md shadow-sm" style={{ backgroundColor: tagColor }}>{nome}</div>
  );
}
export default function EstFichaPaciente() {
  const { id_paciente } = useParams();
  const [info, setInfo] = useState(null);
  const [folhas, setFolhas] = useState([]);
  const [estat1, setEstat1] = useState(null);
  const [estat2, setEstat2] = useState(null);
  const [estat3, setEstat3] = useState(null);
  const [tab, setTab] = useState('ficha');
  const [fichaTab, setFichaTab] = useState('atendimento');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedFolhaId, setExpandedFolhaId] = useState(null); // Estado para controlar a expansão
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [novaEvolucao, setNovaEvolucao] = useState({
    hipotese_diagnostica: '',
    sintomas_atuais: '',
    intervencoes_realizadas: '',
    evolucao_clinica: '',
    plano_proxima_sessao: '',
    observacoes: '',
    valor: ''
  });
  const [feedbackModalState, setFeedbackModalState] = useState({ isOpen: false, folha: null });

  const fetchDadosPaciente = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ficha_paciente/${id_paciente}`, { credentials: 'include' });
      if (!res.ok) throw new Error('Não foi possível carregar os dados.');
      const data = await res.json();
      setInfo(data);
      setFolhas(data.folhas_pacientes || []);
    } catch (err) {
      console.error('Erro ao carregar dados do paciente:', err);
      setFolhas([]);
    }
  };

  useEffect(() => {
    console.log('useEffect rodou', id_paciente);
    fetchDadosPaciente();

    // fetch(`/est_lista_folhas_atualizada/${id_paciente}`, { credentials: 'include' })
    //   .then(res => res.json())
    //   .then(data => {
    //     setFolhas(data.folhas_pacientes || []);
    //   })
    //   .catch(err => console.error('Erro ao carregar folhas de evolução:', err));
    // ;
    // Fetch das estatísticas
    fetch(`${API_URL}/api/est_primeira_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
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

    fetch(`${API_URL}/api/est_segunda_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
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

    fetch(`${API_URL}/api/est_terceira_estatistica_paciente/${id_paciente}`, { credentials: 'include' })
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
  // Crie esta nova função logo abaixo da declaração dos seus estados
  const fetchFolhas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ficha_paciente/${id_paciente}`, { credentials: 'include' });
      if (!res.ok) {
        // Lida com erros de API como 404 ou 500
        throw new Error('Não foi possível carregar as folhas de evolução.');
      }
      const data = await res.json();
      setFolhas(data.folhas_pacientes || []);
    } catch (err) {
      console.error('Erro ao carregar folhas de evolução:', err);
      setFolhas([]); // Limpa as folhas em caso de erro para evitar mostrar dados antigos
    }
  };

  const handleEvolucaoChange = (e) => {
    const { name, value } = e.target;
    setNovaEvolucao(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handlePublicar = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formDataUrl = new URLSearchParams({
      id_paciente: paciente.id_paciente,
      id_supervisor: paciente.id_supervisor,
      ...novaEvolucao
    }).toString();

    try {
      const res = await fetch(`${API_URL}/api/est_ficha_adicionada`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formDataUrl,
        credentials: 'include',
      });

      if (res.ok) {
        alert('Evolução publicada com sucesso!');
        fetchFolhas();
        fetchDadosPaciente();

        setNovaEvolucao({
          hipotese_diagnostica: '',
          sintomas_atuais: '',
          intervencoes_realizadas: '',
          evolucao_clinica: '',
          plano_proxima_sessao: '',
          observacoes: '',
          valor: ''
        });
        setIsCreateModalOpen(false)
      } else {
        const errorData = await res.json();
        alert(`Erro: ${errorData.message || 'Não foi possível publicar.'}`);
      }
    } catch (err) {
      console.error('Erro ao publicar evolução:', err);
      alert('Ocorreu um erro de conexão.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSolicitarAcesso = async () => {
    try {
      const res = await fetch(`${API_URL}/api/solicitar_acesso_pasta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_paciente: paciente.id_paciente }),
        credentials: 'include',
      });
      if (res.ok) {
        alert('Solicitação enviada ao supervisor com sucesso!');
      } else {
        alert('Erro ao enviar solicitação.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!info || !info.paciente) return <div>Carregando...</div>;
  const paciente = info.paciente;

  return (
    <>
      <Header />
      <main className='mt-20 p-4 '>
        {/* SEÇÃO DE TAGS */}
        <div className="container-geral px-4 sm:px-6 lg:px-8 mb-4">
          <div className="p-4 rounded-lg flex items-center flex-wrap gap-4 mb-4">
            <h4 className="text-sm font-semibold text-gray-600">Tags do Paciente</h4>
            {paciente.tags && paciente.tags.length > 0
              ? paciente.tags.map(tag => <Tag key={tag.id_tag} nome={tag.nome} />)
              : <p className="text-sm text-gray-400 italic">Nenhuma tag atribuída.</p>}
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
            <p className="text-sm text-gray-600 mb-4">
              Status
            </p>
            <h2 className="text-xl font-semibold text-gray-800">{String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}</h2>

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

                <div className="flex justify-between items-center mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do Paciente</h3>
                    <p className="text-sm text-gray-500">Visualize as informações cadastrais do paciente.</p>
                  </div>
                  <Link
                    to={`/est_editar_paciente/${paciente.id_paciente}`}
                    className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
                  >
                    <i className="bi bi-pencil-square"></i>
                    Editar Ficha do Paciente
                  </Link>
                </div>
                {/* <h3 className="text-xl font-bold text-gray-800 mb-4">Ficha de Atendimento</h3> */}


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

                      <div className="flex md:col-span-2 gap-4">
                        <InfoCampo
                          label="Já fez terapia anteriormente?"
                          value={
                            paciente.ja_fez_terapia == null
                              ? 'Não informado'
                              : (paciente.ja_fez_terapia ? 'Sim' : 'Não')
                          }
                        />
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
                <div className='flex justify-between items-center mb-4'>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Evolução do Paciente</h3>
                    <p className="text-sm text-gray-500">Adicione e visualize as atualizações de cada sessão.</p>
                  </div>

                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="flex-shrink-0 px-5 py-2.5 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors cursor-pointer hover:bg-green-600"
                  >
                    Adicionar Evolução
                  </button>
                </div>

                {!paciente.acesso_liberado ? (
                  <div className="flex flex-col items-center justify-center p-10 bg-gray-50 border border-gray-200 rounded-lg text-center">
                    <div className="bg-gray-200 p-4 rounded-full mb-4">
                      <i className="bi bi-lock-fill text-4xl text-gray-500"></i>
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Histórico Bloqueado</h3>
                    <p className="text-gray-600 mb-6 max-w-md">
                      Você ainda não tem acesso ao histórico de folhas de evolução. Você pode adicionar a sua folha de evolução.
                    </p>
                    <button
                      onClick={handleSolicitarAcesso}
                      className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow hover:bg-green-600 transition-colors"
                    >
                      Solicitar acesso ao supervisor
                    </button>
                  </div>
                ) : (
                  <>
                {paciente.intervalo_sessoes && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-3">
                    <i className="bi bi-info-circle-fill text-blue-600"></i>
                    <p className="text-sm text-blue-800">O intervalo de atendimento definido para este paciente é <strong>{paciente.intervalo_sessoes}</strong>.</p>
                  </div>
                )}


                <div id="ListaDeFolhas">
                  {folhas.length === 0 ? (
                    <div className="card mt-3 text-center">
                      <div className="card-body">
                        <h5>Este paciente ainda não possui nenhum histórico de evolução.</h5>
                        <p>Você pode adicionar os primeiros dados agora.</p>
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
                          </div>                        <div className="card-body">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 md:p-4 gap-3 md:gap-0">
                              <div className="flex items-center gap-4">
                                <img
                                  src={`${API_URL}/api/uploads/usuarios/${folha.id_estagiario}`}
                                  alt="Estagiário"
                                  className="rounded-full object-cover w-12 h-12 sm:w-15 sm:h-15 md:w-17 md:h-17"
                                />
                                <div>
                                  <small>Nome do Estagiário</small>
                                  <h6 className="font-bold text-slate-800">{folha.nome_estagiario}</h6>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 md:ms-auto">
                                <button
                                  disabled={folha.status_validacao === 'Validação Pendente'}
                                  className={`flex items-center justify-between w-[140px]  sm:w-[240px] px-4 py-2 text-sm sm:text-base font-semibold rounded-md border transition-all
                                ${folha.status_validacao === 'Validação Pendente' ? 'border-gray-300 text-gray-500 bg-gray-100 cursor-not-allowed' :
                                      folha.status_validacao === 'Reprovado' ? 'border-[#BD4343] text-[#BD4343] hover:bg-red-50 cursor-pointer' :
                                        'border-green-600 text-green hover:bg-green-50 cursor-pointer'}`}
                                  onClick={() => {
                                    if (folha.status_validacao !== 'Validação Pendente') {
                                      setFeedbackModalState({ isOpen: true, folha: folha });
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
                              {/* Botão de expandir/recolher */}
                              <button
                                onClick={() => setExpandedFolhaId(isExpanded ? null : folha.id_folha)}
                                className="p-2 rounded-full hover:bg-slate-100 transition-colors md:ml-2 cursor-pointer"
                                aria-label={isExpanded ? "Recolher" : "Expandir"}
                              >
                                <svg className={`w-6 h-6 text-slate-500 transition-transform transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
                                </svg>
                              </button>
                            </div>

                            {/* Conteúdo expansível */}
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
                                          <input
                                            className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                                            value={folha.valor ? `${parseFloat(folha.valor).toFixed(2)}` : 'Não informado'}
                                            readOnly
                                          />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
                  </>
                )}
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
      {isCreateModalOpen && (
        <Modal
          onClose={() => setIsCreateModalOpen(false)}
          title="Adicionar Nova Folha de Evolução"
        >
          <form onSubmit={handlePublicar} >
            <div className="max-h-[60vh] overflow-y-auto p-1 pr-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label htmlFor="hipotese_diagnostica" className="block text-sm font-semibold text-slate-700">Hipótese Diagnóstica</label>
                  <textarea id="hipotese_diagnostica" name="hipotese_diagnostica" value={novaEvolucao.hipotese_diagnostica} onChange={handleEvolucaoChange} rows="3" className="mt-1 w-full p-2 border rounded-md shadow-sm"></textarea>
                </div>
                <div>
                  <label htmlFor="sintomas_atuais" className="block text-sm font-semibold text-slate-700">Sintomas Atuais</label>
                  <textarea id="sintomas_atuais" name="sintomas_atuais" value={novaEvolucao.sintomas_atuais} onChange={handleEvolucaoChange} rows="4" className="mt-1 w-full p-2 border rounded-md shadow-sm"></textarea>
                </div>
                <div>
                  <label htmlFor="intervencoes_realizadas" className="block text-sm font-semibold text-slate-700">Intervenções Realizadas</label>
                  <textarea id="intervencoes_realizadas" name="intervencoes_realizadas" value={novaEvolucao.intervencoes_realizadas} onChange={handleEvolucaoChange} rows="4" className="mt-1 w-full p-2 border rounded-md shadow-sm"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="evolucao_clinica" className="block text-sm font-semibold text-slate-700">Evolução Clínica</label>
                  <textarea id="evolucao_clinica" name="evolucao_clinica" value={novaEvolucao.evolucao_clinica} onChange={handleEvolucaoChange} rows="4" className="mt-1 w-full p-2 border rounded-md shadow-sm"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="plano_proxima_sessao" className="block text-sm font-semibold text-slate-700">Plano para a Próxima Sessão</label>
                  <textarea id="plano_proxima_sessao" name="plano_proxima_sessao" value={novaEvolucao.plano_proxima_sessao} onChange={handleEvolucaoChange} rows="3" className="mt-1 w-full p-2 border rounded-md shadow-sm"></textarea>
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="observacoes" className="block text-sm font-semibold text-slate-700">Observações</label>
                  <textarea id="observacoes" name="observacoes" value={novaEvolucao.observacoes} onChange={handleEvolucaoChange} rows="3" className="mt-1 w-full p-2 border rounded-md shadow-sm"></textarea>
                </div>
                <div>
                  <label htmlFor="valor" className="block text-sm font-semibold text-slate-700">Valor</label>
                  <input id="valor" type="number" name="valor" value={novaEvolucao.valor} onChange={handleEvolucaoChange} step="0.01" placeholder="0.00" className="mt-1 w-full p-2 border rounded-md shadow-sm" />
                </div>
              </div>
            </div>

            <div className="mt-6 text-right">
              <button type="submit" disabled={isSubmitting} className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors disabled:opacity-50">
                {isSubmitting ? 'Publicando...' : 'Publicar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}