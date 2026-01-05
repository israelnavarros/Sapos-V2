import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Header from './Header';
import { Bar, Doughnut } from 'react-chartjs-2';
import API_URL from './config'; // Importa a URL centralizada
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
  // Função para gerar uma cor com base no nome da tag para consistência
  const stringToColor = (str) => {
    if (!str) return 'hsl(0, 0%, 40%)'; // Cor padrão para string vazia
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const h = hash % 360;
    return `hsl(${h}, 25%, 40%)`; // Matiz (0-360), Saturação (45%), Luminosidade (40%)
  };

  const tagColor = stringToColor(nome);

  return (
    <div className="px-3 py-1 text-sm font-medium text-white rounded-full shadow-sm" style={{ backgroundColor: tagColor }}>{nome}</div>
  );
}
export default function FichaPaciente() {
  const { id_paciente } = useParams();
  const [info, setInfo] = useState(null);
  const [folhas, setFolhas] = useState([]);
  const [estat1, setEstat1] = useState(null);
  const [estat2, setEstat2] = useState(null);
  const [estat3, setEstat3] = useState(null);
  const [tab, setTab] = useState('ficha'); // Controle das abas
  const [fichaTab, setFichaTab] = useState('atendimento');
  const [validationModalOpen, setValidationModalOpen] = useState(false); // Modal de validação
  const [selectedFolha, setSelectedFolha] = useState(null); // Folha selecionada
  const [feedback, setFeedback] = useState(''); // Feedback do supervisor
  const [expandedFolhaId, setExpandedFolhaId] = useState(null); // Estado para controlar a expansão
  const [status, setStatus] = useState(''); // Status (Aprovado ou Reprovado)

  // Estados para o Modal de Tags
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [allTags, setAllTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState(new Set());
  const [newTagName, setNewTagName] = useState('');

  // Estados para o Modal de Intervalo
  const [isIntervaloModalOpen, setIsIntervaloModalOpen] = useState(false);
  const [intervalo, setIntervalo] = useState('');



  useEffect(() => {
    fetchPacienteData();
    // Fetch dos dados do paciente e folhas de evolução
    fetch(`${API_URL}/api/sup_ficha_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        setFolhas(data.folhas_pacientes || []);
        setIntervalo(data.paciente?.intervalo_sessoes || '');
      })
      .catch(err => console.error('Erro ao carregar dados do paciente:', err));

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

  const fetchPacienteData = () => {
    fetch(`${API_URL}/api/sup_ficha_paciente/${id_paciente}`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setInfo(data);
        setFolhas(data.folhas_pacientes || []);
        // Inicializa as tags selecionadas com as do paciente
        const initialTagIds = new Set((data.paciente.tags || []).map(t => t.id_tag));
        setIntervalo(data.paciente?.intervalo_sessoes || '');
        setSelectedTags(initialTagIds);
      })
      .catch(err => console.error('Erro ao carregar dados do paciente:', err));
  };

  const handleOpenModal = (folha) => {
    setSelectedFolha(folha);
    setValidationModalOpen(true);
  };

  const handleRemover = async (idFolha) => {
    if (!window.confirm("Tem certeza que deseja excluir esta folha?")) return;

    try {
      const res = await fetch(`${API_URL}/api/est_ficha_deletada/${idFolha}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        alert("Folha excluída com sucesso!");
        setFolhas(folhas.filter(folha => folha.id_folha !== idFolha));
      } else {
        alert("Erro ao excluir a folha.");
      }
    } catch (err) {
      console.error('Erro ao excluir evolução:', err);
    }
  };

  const handleSubmitValidation = async () => {
    if (!status) {
      alert('Por favor, selecione um status (Aprovado ou Reprovado).');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sup_validar_folha/${selectedFolha.id_folha}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status, feedback }),
      });

      if (response.ok) {
        alert('Sessão validada com sucesso!');
        setValidationModalOpen(false);

        // Atualizar a lista de folhas
        const updatedFolhas = await fetch(`${API_URL}/api/sup_ficha_paciente/${id_paciente}`, { credentials: 'include' });
        const folhasData = await updatedFolhas.json();
        setFolhas(folhasData.folhas_pacientes || []);
      } else {
        alert('Erro ao validar a sessão.');
      }
    } catch (err) {
      console.error('Erro ao validar a sessão:', err);
    }
  };

  // --- Funções para o Modal de Tags ---
  const openTagModal = () => {
    fetch(`${API_URL}/api/tags`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAllTags(data);
        setIsTagModalOpen(true);
      })
      .catch(err => console.error("Erro ao buscar tags:", err));
  };

  const handleTagSelectionChange = (tagId) => {
    setSelectedTags(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tagId)) {
        newSet.delete(tagId);
      } else {
        newSet.add(tagId);
      }
      return newSet;
    });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    try {
      const res = await fetch(`${API_URL}/api/tags`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ nome: newTagName }),
      });
      const newTag = await res.json();
      if (res.ok) {
        setAllTags(prev => [...prev, newTag]);
        setSelectedTags(prev => new Set(prev).add(newTag.id_tag)); // Auto-seleciona a nova tag
        setNewTagName('');
      } else {
        alert(`Erro: ${newTag.message}`);
      }
    } catch (err) {
      console.error("Erro ao criar tag:", err);
    }
  };

  const handleSavePatientTags = async () => {
    try {
      const res = await fetch(`${API_URL}/api/paciente/${id_paciente}/tags`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ tag_ids: Array.from(selectedTags) }),
      });
      if (res.ok) {
        alert('Tags atualizadas com sucesso!');
        setIsTagModalOpen(false);
        fetchPacienteData(); // Re-busca os dados do paciente para atualizar a UI
      } else throw new Error('Falha ao salvar tags');
    } catch (err) { console.error(err); alert(err.message); }
  };

  const handleSaveIntervalo = async () => {
    try {
      const res = await fetch(`${API_URL}/api/paciente/${id_paciente}/intervalo`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ intervalo: intervalo }),
      });
      if (res.ok) {
        alert('Intervalo de atendimento atualizado com sucesso!');
        setIsIntervaloModalOpen(false);
        fetchPacienteData(); // Re-busca os dados para atualizar a UI
      } else {
        throw new Error('Falha ao salvar o intervalo.');
      }
    } catch (err) { console.error(err); alert(err.message); }
  };
  if (!info || !info.paciente) return <div>Carregando...</div>;
  const paciente = info.paciente;

  return (
    <>
      <Header />
      <main className='mt-20 p-4'>
        {/* SEÇÃO DE TAGS COM BOTÃO */}
        <div className="container-geral px-4 sm:px-6 lg:px-8 mb-4">
          <div className="p-4 rounded-lg flex items-center justify-between flex-wrap gap-y-3 gap-x-4">
            <div className="flex items-center gap-3 flex-wrap">
                <h4 className="text-sm font-semibold text-gray-600">Tags do Paciente</h4>
                {paciente.tags && paciente.tags.length > 0
                    ? paciente.tags.map(tag => <Tag key={tag.id_tag} nome={tag.nome} />)
                    : <p className="text-sm text-gray-400 italic">Nenhuma tag atribuída.</p>}
            </div>
            <div className="flex items-center gap-3">
              <button onClick={() => setIsIntervaloModalOpen(true)} className="flex items-center gap-2 text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg font-semibold shadow-sm hover:bg-blue-700 transition-colors cursor-pointer">
                <i className="bi bi-calendar-week"></i>
                Definir Intervalo
              </button>
              <button onClick={openTagModal} className="flex items-center gap-2 text-sm bg-green text-white px-3 py-1.5 rounded-lg font-semibold shadow-sm hover:bg-green-600 transition-colors cursor-pointer">
                <i className="bi bi-pencil-square"></i>
                Gerenciar Tags
              </button>
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
            <p className="text-sm text-gray-600 mb-4">
              Status:
            </p>
            <h2 className="text-xl font-semibold text-gray-800">{String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}</h2>

            <div className="flex flex-col">
              <button
                onClick={() => setTab('ficha')}
                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'ficha'
                  ? 'bg-green text-white'
                  : 'bg-white text-gray-700'
                  }`}
              >
                Dados do Paciente
              </button>
              <button
                onClick={() => setTab('evolucao')}
                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'evolucao'
                  ? 'bg-green text-white'
                  : 'bg-white text-gray-700'
                  }`}
              >
                Folha de Evolução
              </button>
              <button
                onClick={() => setTab('estatisticas')}
                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] ${tab === 'estatisticas'
                  ? 'bg-green text-white'
                  : 'bg-white text-gray-700'
                  }`}
              >
                Estatísticas do Paciente
              </button>
            </div>
          </div>
          <div className="painel-direito">
            {tab === 'ficha' && (
              <div className="pt-3">
                <div className="mb-4">
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do Paciente</h3>
                  <p className="text-sm text-gray-500">Visualize as informações cadastrais do paciente.</p>
                </div>

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
                <h3 className="text-xl font-bold text-gray-800 mb-2">Evolução do Paciente</h3>
                <p className="text-sm text-gray-500 mb-4">Visualize e valide as atualizações feitas pelos estagiários a cada sessão.</p>
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
                        </div>                        
                        <div className="card-body">
                          <div className="flex items-center justify-between p-4 md:p-4">
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
                            <div className="ms-auto">
                              <button
                                disabled={folha.status_validacao !== 'Validação Pendente'}
                                className={`flex items-center justify-between w-[240px] px-4 py-2 text-sm sm:text-base font-semibold rounded-md border transition-all ${
                                  folha.status_validacao === 'Validação Pendente' ? 'border-yellow-500 text-yellow-600 bg-yellow-50 hover:bg-yellow-100 cursor-pointer' :
                                  folha.status_validacao === 'Reprovado' ? 'border-[#BD4343] text-[#BD4343] hover:bg-red-50 cursor-pointer' :
                                    'border-green-600 text-green hover:bg-green-50 cursor-pointer'
                                }`}
                                onClick={() => {
                                  if (folha.status_validacao === 'Validação Pendente') {
                                    handleOpenModal(folha); // Abre o modal com os dados da folha
                                  }
                                }}
                              >
                                {/* Ícone dentro de círculo */}
                                <span className={`flex items-center justify-center w-6 h-6 rounded-full ${
                                  folha.status_validacao === 'Aprovado' ? 'bg-green text-white' :
                                  folha.status_validacao === 'Reprovado' ? 'bg-[#BD4343] text-white' :
                                    'bg-yellow-500 text-white'
                                }`}>
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
                                {folha.status_validacao === 'Validação Pendente' && (
                                  <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                  </svg>
                                )}
                              </button>
                            </div>
                            {/* Botão de expandir/recolher */}
                            <button 
                              onClick={() => setExpandedFolhaId(isExpanded ? null : folha.id_folha)}
                              className="p-2 rounded-full hover:bg-slate-100 transition-colors ml-2 cursor-pointer"
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
                                        value={folha.valor ? `R$ ${parseFloat(folha.valor).toFixed(2)}` : 'Não informado'}
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
                    }
                    )
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
      {/* INÍCIO DO CÓDIGO DO MODAL CORRIGIDO */}
      {validationModalOpen && selectedFolha && (

        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">

          {/* Conteúdo do Modal */}
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Validar Sessão #{selectedFolha.numero_sessao}</h3>

            <div className="mb-4 p-3 bg-gray-50 border rounded-md max-h-40 overflow-y-auto">
              <p className="text-sm font-medium text-gray-600">Postagem original:</p>
              <p className="text-gray-800 mt-1 whitespace-pre-wrap">{selectedFolha.postagem}</p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status da Validação</label>
                <div className="flex items-center space-x-6">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Aprovado"
                      checked={status === 'Aprovado'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
                    />
                    <span className="ml-2 text-gray-800">Aprovado</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="status"
                      value="Reprovado"
                      checked={status === 'Reprovado'}
                      onChange={(e) => setStatus(e.target.value)}
                      className="h-4 w-4 text-red-600 border-gray-300 focus:ring-red-500"
                    />
                    <span className="ml-2 text-gray-800">Reprovado</span>
                  </label>
                </div>
              </div>

              <div>
                <label htmlFor="feedback" className="block text-sm font-medium text-gray-700">
                  Feedback (Opcional)
                </label>
                <textarea
                  id="feedback"
                  rows="4"
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Escreva um feedback para o estagiário..."
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                ></textarea>
              </div>
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setValidationModalOpen(false)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmitValidation}
                className="px-4 py-2 bg-green text-white rounded-md hover:bg-opacity-90 transition-colors"
              >
                Enviar Validação
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO DE TAGS */}
      {isTagModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-4">Gerenciar Tags do Paciente</h3>

            {/* Seção de Criar Nova Tag */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Criar e Adicionar Nova Tag</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="Nome da nova tag"
                  className="flex-grow p-2 border border-gray-300 rounded-md shadow-sm"
                />
                <button onClick={handleCreateTag} className="px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg shadow-md hover:bg-blue-700">
                  Criar
                </button>
              </div>
            </div>

            {/* Seção de Selecionar Tags Existentes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Selecionar Tags Existentes</label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {allTags.map(tag => (
                  <label key={tag.id_tag} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedTags.has(tag.id_tag)}
                      onChange={() => handleTagSelectionChange(tag.id_tag)}
                      className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                    />
                    <Tag nome={tag.nome} />
                  </label>
                ))}
              </div>
            </div>

            {/* Botões de Ação do Modal */}
            <div className="mt-6 flex justify-end space-x-3">
              <button onClick={() => setIsTagModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleSavePatientTags} className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90">
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE GERENCIAMENTO DE INTERVALO */}
      {isIntervaloModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold text-gray-800 mb-6">Definir Intervalo de Atendimento</h3>

            <div>
              <label htmlFor="intervalo-select" className="block text-sm font-medium text-gray-700 mb-2">
                Selecione a frequência das sessões
              </label>
              <select
                id="intervalo-select"
                value={intervalo}
                onChange={(e) => setIntervalo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-green-500 focus:border-green-500"
              >
                <option value="" disabled>Selecione um intervalo...</option>
                <option value="Semanal">Semanal</option>
                <option value="Quinzenal">Quinzenal</option>
                <option value="Mensal">Mensal</option>
                <option value="Bimestral">Bimestral</option>
              </select>
            </div>

            {/* Botões de Ação do Modal */}
            <div className="mt-8 flex justify-end space-x-3">
              <button onClick={() => setIsIntervaloModalOpen(false)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
                Cancelar
              </button>
              <button onClick={handleSaveIntervalo} className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90">
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}