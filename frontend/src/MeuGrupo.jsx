import { useContext, useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { AuthContext } from './AuthContext';
import Header from './Header';
import AdicionarEstagiario from './AdicionarEstagiario';
import { Link } from 'react-router-dom';
import API_URL from './config';
import Modal from './Modal';

function ActionsDropdown({ paciente, onAtribuir }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        (!menuRef.current || !menuRef.current.contains(event.target))
      ) setIsOpen(false);
    };
    const handleScroll = () => setIsOpen(false);

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [dropdownRef]);

  const toggleDropdown = () => {
    if (!isOpen && dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        setPosition({ top: rect.bottom, left: rect.right - 224 }); // w-56 = 224px
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button onClick={toggleDropdown} className="p-2 rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green cursor-pointer">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>
      {isOpen && createPortal(
        <div 
          ref={menuRef}
          className="fixed mt-2 w-56 bg-white rounded-md shadow-lg z-50 ring-1 ring-slate-200"
          style={{ top: position.top, left: position.left }}
        >
          <div className="py-1">
            <Link to={`/sup_ficha_paciente/${paciente.id_paciente}`} className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">Ver Ficha</Link>
            <button onClick={() => { onAtribuir(paciente); setIsOpen(false); }} className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100">
              Atribuir/Trocar Estagiário
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {/* Coluna 1: Paciente (imitação da foto + nome) */}
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="flex items-center">
        <div className="h-10 w-10 bg-slate-200 rounded-full"></div>
        <div className="ml-4 space-y-2">
          <div className="h-4 bg-slate-200 rounded w-48"></div>
        </div>
      </div>
    </td>

    {/* Coluna 2: Status (imitação do badge) */}
    <td className="px-6 py-4 whitespace-nowrap text-center">
      <div className="h-6 w-20 bg-slate-200 rounded-full mx-auto"></div>
    </td>

    {/* Coluna 3: Estagiário Responsável (imitação de uma linha de texto) */}
    <td className="px-6 py-4 whitespace-nowrap">
      <div className="h-4 bg-slate-200 rounded w-3/4"></div>
    </td>

    {/* Coluna 4: Ações (imitação do botão de 3 pontos) */}
    <td className="px-6 py-4 whitespace-nowrap text-right">
      <div className="h-8 w-8 bg-slate-200 rounded-full ml-auto"></div>
    </td>
  </tr>
);

export default function MeuGrupo() {
  const { user } = useContext(AuthContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [grupoInfo, setGrupoInfo] = useState(null);
  const [coordenadores, setCoordenadores] = useState([]);
  const [estagiarios, setEstagiarios] = useState([]);
  const [reunioes, setReunioes] = useState([]);
  const [vagas, setVagas] = useState({ ocupadas: 0, total: 0 });
  const [novoReuniao, setNovoReuniao] = useState({ dia: '', horaini: '', horafim: '' });
  const [showAdicionar, setShowAdicionar] = useState(false);
  const [abaAtiva, setAbaAtiva] = useState('visaoGeral');
  const [abaMembroAtiva, setAbaMembroAtiva] = useState('supervisores');
  const [isSelectInternsModalOpen, setIsSelectInternsModalOpen] = useState(false);
  const [allEstagiarios, setAllEstagiarios] = useState([]);

  const [pacientes, setPacientes] = useState([]);
  const [loadingPacientes, setLoadingPacientes] = useState(true);
  const [modalState, setModalState] = useState({ isOpen: false, paciente: null });
  const [listaEstagiariosModal, setListaEstagiariosModal] = useState([]);
  const [selectedEstagiarioId, setSelectedEstagiarioId] = useState('');
  const [solicitacoes, setSolicitacoes] = useState([]);

  const fetchGrupoData = () => {
    fetch(`${API_URL}/api/meu_grupo`, { credentials: 'include' })
      .then(res => res.json())
      .then(grupoData => {
        setGrupoInfo(grupoData.grupo_info);
        setCoordenadores(grupoData.coordenadores);
        setEstagiarios(grupoData.estagiarios);
        setReunioes(grupoData.reunioes);
        setVagas({ ocupadas: grupoData.estagiarios_count, total: grupoData.grupo_info.vagas_estagiarios });
      })
      .catch(err => console.error(err));
  };

  const fetchPacientes = () => {
    setLoadingPacientes(true);
    fetch(`${API_URL}/api/sup_pacientes_supervisionados`, { credentials: "include" })
      .then(res => res.json())
      .then(data => setPacientes(data || []))
      .catch(err => console.error("Erro ao carregar pacientes:", err))
      .finally(() => setLoadingPacientes(false));
  };
  useEffect(() => {
    fetchGrupoData();
  }, []);
  useEffect(() => {
    if (abaAtiva === 'dashboard' && pacientes.length === 0) {
      fetchPacientes();
    }
    if (abaAtiva === 'solicitacoes') {
      fetchSolicitacoes();
    }
  }, [abaAtiva, pacientes.length]);

  const handleOpenAssignModal = (paciente) => {
    fetch(`${API_URL}/api/sup_estagiarios_do_grupo`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setListaEstagiariosModal(data);
        setSelectedEstagiarioId(paciente.id_estagiario || '');
        setModalState({ isOpen: true, paciente: paciente });
      });
  };

  const handleSaveAssignment = async () => {
    const { paciente } = modalState;
    try {
      const response = await fetch(`${API_URL}/api/sup_atribuir_estagiario/${paciente.id_paciente}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_estagiario: selectedEstagiarioId })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      alert('Atribuição salva com sucesso!');
      setModalState({ isOpen: false, paciente: null });
      fetchPacientes(); // Recarrega a lista de pacientes
    } catch (error) {
      alert(`Erro: ${error.message}`);
    }
  };

  const handleOpenSelectInternsModal = () => {
    fetch(`${API_URL}/api/lista_estagiarios`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => {
        setAllEstagiarios(data);
        setIsSelectInternsModalOpen(true);
      })
      .catch(err => console.error('Erro ao carregar estagiários:', err));
  };

  const handleAssignIntern = async (id_estagiario, id_grupo) => {
    try {
      const response = await fetch(`${API_URL}/api/atribuir_estagiario_grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_estagiario, id_grupo })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erro ao atribuir estagiário');
      
      // Recarrega os dados do grupo
      fetchGrupoData();
    } catch (err) {
      console.error('Erro ao atribuir estagiário:', err);
      alert('Erro ao atribuir estagiário: ' + err.message);
    }
  };

  const handleUnassignIntern = async (id_estagiario) => {
    try {
      const response = await fetch(`${API_URL}/api/atribuir_estagiario_grupo`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id_estagiario, id_grupo: null })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || 'Erro ao remover estagiário');
      
      // Recarrega a lista
      fetch(`${API_URL}/api/lista_estagiarios`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setAllEstagiarios(data));
      
      // Recarrega os dados do grupo
      fetchGrupoData();
    } catch (err) {
      console.error('Erro ao remover estagiário:', err);
      alert('Erro ao remover estagiário: ' + err.message);
    }
  };
  const handleAddReuniao = async () => {
    if (!novoReuniao.dia || !novoReuniao.horaini || !novoReuniao.horafim) {
      alert('Preencha todos os campos!');
      return;
    }
    const res = await fetch(`${API_URL}/api/adicionar_reuniao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id_grupo: grupoInfo.id_grupo,
        diaReuniao: novoReuniao.dia,
        horainiReuniao: novoReuniao.horaini,
        horafimReuniao: novoReuniao.horafim
      }),
      credentials: 'include'
    });
    const data = await res.json();
    console.log('cavalo molado ------', data);
    if (data.success) {
      setReunioes([
        ...reunioes,
        {
          id_reuniaogrupos: data.idRe,
          dia: Number(data.diaR),
          hora_inicio: data.horainiR,
          hora_fim: data.horafimR
        }
      ]);
      setNovoReuniao({ dia: '', horaini: '', horafim: '' });
    } else {
      alert(data.message || 'Erro ao adicionar reunião');
    }
  };

  // Remover reunião
  const handleRemoveReuniao = async (id_reuniao) => {
    console.log('Removendo reunião com ID:', id_reuniao);
    const res = await fetch(`${API_URL}/api/remover_reuniao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_reuniao_grupo: Number(id_reuniao) }),
      credentials: 'include'
    });
    const data = await res.json();
    if (data.success) {
      setReunioes(reunioes.filter(r => r.id_reuniaogrupos !== id_reuniao));
    } else {
      alert('Erro ao remover reunião');
    }
  };

  const fetchSolicitacoes = () => {
    fetch(`${API_URL}/api/sup_listar_solicitacoes_acesso`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setSolicitacoes(Array.isArray(data) ? data : []))
      .catch(err => console.error(err));
  };

  const handleResponderSolicitacao = async (id, acao) => {
    if (!window.confirm(`Tem certeza que deseja ${acao} o acesso?`)) return;
    try {
      const res = await fetch(`${API_URL}/api/sup_responder_solicitacao_acesso/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ acao })
      });
      if (res.ok) {
        alert(`Solicitação ${acao === 'aprovar' ? 'aprovada' : 'rejeitada'} com sucesso.`);
        fetchSolicitacoes();
      } else {
        alert('Erro ao processar solicitação.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (!grupoInfo) return <div>Carregando...</div>;

  const DIAS_DA_SEMANA = [
    'Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira',
    'Quinta-feira', 'Sexta-feira', 'Sábado'
  ];
  const TabButton = ({ aba, label }) => (
    <button
      onClick={() => setAbaAtiva(aba)}
      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${abaAtiva === aba
        ? 'bg-white border-b-2 border-green text-green'
        : 'bg-transparent text-slate-500 hover:text-slate-700'
        }`}
    >
      {label}
    </button>
  );

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Cabeçalho da Página */}
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-xl font-bold text-gray-800 mb-2">Seu grupo</h3>
            <h3 className="sm:text-5xl text-3xl font-bold text-gray-800 mb-2">{grupoInfo.titulo}</h3>
            <p className="mt-1 text-base sm:text-lg text-slate-600">Gerencie as informações do seu grupo de estágio.</p>
          </div>

          {/* --- NAVEGAÇÃO POR ABAS --- */}
          <div className="border-b border-slate-200 mb-8 overflow-x-auto">
            <nav className="-mb-px flex space-x-2 sm:space-x-6">
              <TabButton aba="visaoGeral" label="Visão Geral" />
              <TabButton aba="membros" label="Membros" />
              <TabButton aba="reunioes" label="Reuniões" />
              <TabButton aba="dashboard" label="Dashboard de Pacientes" />
              <TabButton aba="solicitacoes" label="Solicitações de Acesso" />
            </nav>
          </div>

          {/* --- CONTEÚDO DAS ABAS --- */}
          <div>
            {/* Aba: Visão Geral */}
            {abaAtiva === 'visaoGeral' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <InfoCard title="Local do Estágio" content={grupoInfo.local} />
                <InfoCard title="Convênio" content={grupoInfo.convenio || 'Não informado'} />
                <InfoCard title="Resumo" content={grupoInfo.resumo} className="md:col-span-2" />
                <InfoCard title="Objetivos" content={grupoInfo.objetivos} />
                <InfoCard title="Atividades" content={grupoInfo.atividades} />
                <InfoCard title="Bibliografia" content={grupoInfo.bibliografia} className="md:col-span-2" />
              </div>
            )}

            {/* Aba: Membros */}
            {abaAtiva === 'membros' && (
              <div className="bg-white rounded-xl shadow-md">
                {/* Tabs de Supervisores e Estagiários */}
                <div className="border-b border-slate-200 px-6 pt-6 mb-0">
                  <nav className="-mb-px flex space-x-2 sm:space-x-6">
                    <button
                      onClick={() => setAbaMembroAtiva('supervisores')}
                      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                        abaMembroAtiva === 'supervisores'
                          ? 'bg-white border-b-2 border-green text-green'
                          : 'bg-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Supervisores
                    </button>
                    <button
                      onClick={() => setAbaMembroAtiva('estagiarios')}
                      className={`px-4 py-2 text-sm font-semibold rounded-t-lg transition-colors ${
                        abaMembroAtiva === 'estagiarios'
                          ? 'bg-white border-b-2 border-green text-green'
                          : 'bg-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      Estagiários
                    </button>
                  </nav>
                </div>

                <div className="p-6">
                  {/* Tab: Supervisores */}
                  {abaMembroAtiva === 'supervisores' && (
                    <div>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Supervisor</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {coordenadores.length > 0 ? (
                              coordenadores.map(coord => (
                                <tr key={coord.id} className="hover:bg-gray-50 cursor-pointer transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <img
                                          className="h-10 w-10 rounded-full object-cover bg-gray-200"
                                          src={`${API_URL}/api/uploads/usuarios/${coord.id}`}
                                          alt={coord.nome}
                                          onError={(e) => {e.target.src = 'https://via.placeholder.com/40?text=Sem+foto'}}
                                        />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{coord.nome}</div>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="1" className="px-6 py-4 text-center text-sm text-gray-500">Nenhum supervisor.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Tab: Estagiários */}
                  {abaMembroAtiva === 'estagiarios' && (
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-slate-800"></h3>
                        <div className="relative">
                          <button
                            className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
                            onClick={() => setShowDropdown(prev => !prev)}
                          >
                            + Novo Estagiario
                          </button>
                          {showDropdown && (
                            <ul className="absolute right-0 mt-2 w-64 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-gray-200 ring-opacity-5 focus:outline-none z-20">
                              <li>
                                <Link to="/meugrupo/adicionar-estagiario" className="block px-4 py-2 hover:bg-green hover:text-white ">
                                  Adicionar diretamente
                                </Link>
                              </li>
                              <li>
                                <button className="block w-full text-left px-4 py-2 hover:bg-green hover:text-white">
                                  Adicionar por link
                                </button>
                              </li>
                              <li>
                                <button className="block w-full text-left px-4 py-2 hover:bg-green hover:text-white" onClick={() => { handleOpenSelectInternsModal(); setShowDropdown(false); }}>
                                  Adicionar por lista de estagiários
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 mb-4"><span className="font-semibold">Vagas:</span> {vagas.ocupadas} / {vagas.total} <span className="text-slate-500">({vagas.total - vagas.ocupadas} disponível{vagas.total - vagas.ocupadas !== 1 ? 's' : ''})</span></p>
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-100">
                            <tr>
                              <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estagiário</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-200">
                            {estagiarios.length > 0 ? (
                              estagiarios.map(estag => (
                                <tr key={estag.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <Link to={`/sup_meu_estagiario/${estag.id}`} className="flex items-center hover:text-green transition">
                                      <div className="flex-shrink-0 h-10 w-10">
                                        <img
                                          className="h-10 w-10 rounded-full object-cover bg-gray-200"
                                          src={`${API_URL}/api/uploads/usuarios/${estag.id}`}
                                          alt={estag.nome}
                                          onError={(e) => {e.target.src = 'https://via.placeholder.com/40?text=Sem+foto'}}
                                        />
                                      </div>
                                      <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{estag.nome}</div>
                                      </div>
                                    </Link>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="1" className="px-6 py-4 text-center text-sm text-gray-500">Nenhum estagiário.</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Modal de seleção de estagiários por lista */}
            {isSelectInternsModalOpen && grupoInfo && (
              <Modal onClose={() => setIsSelectInternsModalOpen(false)} title={`Gerenciar Estagiários - ${grupoInfo.titulo}`}>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                  <p className="text-sm text-gray-600">Selecione os estagiários que atuarão neste grupo.</p>
                  <div className="divide-y divide-gray-200 border rounded-md">
                    {allEstagiarios.length > 0 ? (
                      allEstagiarios.map(est => {
                        const isInGroup = est.grupo === grupoInfo.id_grupo;
                        return (
                          <div key={est.id} className="flex items-center justify-between p-3 hover:bg-gray-50">
                            <div>
                              <p className="font-medium text-gray-800">{est.nome}</p>
                              <p className="text-xs text-gray-500">{est.grupo ? (isInGroup ? 'Neste Grupo' : `Em outro grupo (ID: ${est.grupo})`) : 'Sem grupo'}</p>
                            </div>
                            <button
                              onClick={() => {
                                if (isInGroup) {
                                  handleUnassignIntern(est.id);
                                } else {
                                  handleAssignIntern(est.id, grupoInfo.id_grupo);
                                }
                              }}
                              className={`px-4 py-2 rounded-md font-semibold transition-colors cursor-pointer ${
                                isInGroup
                                  ? 'bg-red-100 text-red-600 hover:bg-red-200'
                                  : 'bg-green text-white hover:bg-green-600'
                              }`}
                            >
                              {isInGroup ? 'Remover' : 'Adicionar'}
                            </button>
                          </div>
                        );
                      })
                    ) : (
                      <p className="p-3 text-center text-gray-500">Nenhum estagiário encontrado.</p>
                    )}
                  </div>
                </div>
              </Modal>
            )}

            {/* Aba: Reuniões */}
            {abaAtiva === 'reunioes' && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Gerenciar Reuniões Semanais</h2>
                <section className="bg-white shadow-md rounded-lg p-6 mb-6">
                  {/* Formulário de nova reunião */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dia da semana</label>
                      <select
                        className="w-full border rounded px-3 py-2"
                        value={novoReuniao.dia}
                        onChange={e => setNovoReuniao({ ...novoReuniao, dia: e.target.value })}
                      >
                        <option value="">Escolha</option>
                        {DIAS_DA_SEMANA.map((dia, idx) => (
                          <option key={idx} value={idx}>{dia}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horário de início</label>
                      <input
                        type="time"
                        className="w-full border rounded px-3 py-2"
                        value={novoReuniao.horaini}
                        onChange={e => setNovoReuniao({ ...novoReuniao, horaini: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Horário de fim</label>
                      <input
                        type="time"
                        className="w-full border rounded px-3 py-2"
                        value={novoReuniao.horafim}
                        onChange={e => setNovoReuniao({ ...novoReuniao, horafim: e.target.value })}
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        type="button"
                        className="bg-green text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer transition w-full"
                        onClick={handleAddReuniao}
                      >
                        Adicionar
                      </button>
                    </div>
                  </div>

                  {/* Tabela de reuniões */}
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dia</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Início</th>
                          <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fim</th>
                          <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {reunioes.map(reuniao => (
                          <tr key={reuniao.id_reuniaogrupos} className="hover:bg-gray-50">
                            <td className="px-4 py-2 whitespace-nowrap">{DIAS_DA_SEMANA[reuniao.dia]}</td>
                            <td className="px-4 py-2">{reuniao.hora_inicio}</td>
                            <td className="px-4 py-2">{reuniao.hora_fim}</td>
                            <td className="px-4 py-2 text-center">
                              <button
                                className="text-red-600 hover:text-red-800"
                                onClick={() => handleRemoveReuniao(reuniao.id_reuniaogrupos)}
                              >
                                <i className="bi bi-trash"></i>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

              </div>
            )}

            {/* Aba: Dashboard de Pacientes */}
            {abaAtiva === 'dashboard' && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                    <div className="text-center md:text-left">
                        <h2 className="text-xl font-semibold text-slate-800">Dashboard de Pacientes</h2>
                        <p className="mt-1 text-slate-500">Esta área mostra os pacientes do seu grupo.</p>
                    </div>
                    <Link
                        to="/sup_assumir_paciente"
                        className="flex items-center gap-2 bg-green text-white px-5 py-2.5 rounded-lg font-semibold shadow-md hover:bg-green-600 cursor-pointer transition-transform transform hover:scale-105"
                    >
                        <i className="bi bi-person-plus-fill"></i>
                        Assumir/Gerenciar Paciente
                    </Link>
                </div> 
                
                <div className="overflow-x-auto bg-white shadow-lg rounded-xl">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estagiário Responsável</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {loadingPacientes ? (
                        <><SkeletonRow /><SkeletonRow /><SkeletonRow /></>
                      ) : pacientes.length > 0 ? (
                        pacientes.map(paciente => (
                          <tr key={paciente.id_paciente} className="hover:bg-blue-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <img className="h-10 w-10 rounded-full object-cover bg-gray-200" src={`${API_URL}/api/uploads/pacientes/${paciente.id_paciente}`} alt="Foto do paciente" />
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{paciente.nome_completo}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${String(paciente.status).toLowerCase() === 'true'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                                }`}>
                                {String(paciente.status).toLowerCase() === 'true' ? 'Ativo' : 'Inativo'}
                              </span>
                            </td>
                            {/* Célula do Estagiário */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                              {paciente.estagiario_nome ? (
                                <span>{paciente.estagiario_nome}</span>
                              ) : (
                                <span className="font-semibold text-orange-600">Não Atribuído</span>
                              )}
                            </td>
                            {/* Célula de Ações */}
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <ActionsDropdown paciente={paciente} onAtribuir={handleOpenAssignModal} />
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="text-center ...">Nenhum paciente sob sua supervisão.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            )}

            {/* Aba: Solicitações de Acesso */}
            {abaAtiva === 'solicitacoes' && (
              <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-semibold text-slate-800 mb-4">Solicitações de Acesso à Pasta</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Estagiário</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Paciente</th>
                        <th className="px-6 py-3 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">Data</th>
                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-600 uppercase tracking-wider">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {solicitacoes.length > 0 ? (
                        solicitacoes.map(sol => (
                          <tr key={sol.id_solicitacao}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sol.nome_estagiario}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{sol.nome_paciente}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{sol.data_solicitacao}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button onClick={() => handleResponderSolicitacao(sol.id_solicitacao, 'aprovar')} className="px-3 py-1 text-sm rounded bg-green text-white hover:opacity-90 disabled:opacity-50 cursor-pointer">Aprovar</button>
                                <button onClick={() => handleResponderSolicitacao(sol.id_solicitacao, 'rejeitar')} className="px-3 py-1 text-sm rounded bg-red-100 text-[#BD4343] hover:bg-red-200 disabled:opacity-50 cursor-pointer">Rejeitar</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr><td colSpan="4" className="text-center py-4 text-gray-500">Nenhuma solicitação pendente.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
      {/* --- MODAL DE ATRIBUIÇÃO --- */}
      {modalState.isOpen && (
        <Modal
          onClose={() => setModalState({ isOpen: false, paciente: null })}
          title={`Atribuir Estagiário para ${modalState.paciente.nome_completo}`}
        >
          <div className="space-y-4">
            <label htmlFor="estagiario-select" className="block text-sm font-medium text-slate-700">
              Selecione um estagiário da sua equipe:
            </label>
            <select
              id="estagiario-select"
              value={selectedEstagiarioId}
              onChange={(e) => setSelectedEstagiarioId(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:ring-green focus:border-green"
            >
              <option value="">-- Remover Atribuição --</option>
              {listaEstagiariosModal.map(estagiario => (
                <option key={estagiario.id} value={estagiario.id}>{estagiario.nome}</option>
              ))}
            </select>
          </div>
          <div className="mt-6 pt-4 border-t flex justify-end gap-3">
            <button type="button" className="px-4 py-2 bg-slate-100 rounded-lg hover:bg-slate-200" onClick={() => setModalState({ isOpen: false, paciente: null })}>
              Cancelar
            </button>
            <button type="button" className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90" onClick={handleSaveAssignment}>
              Salvar Atribuição
            </button>
          </div>
        </Modal>
      )}
    </>
  );
}

// --- COMPONENTES AUXILIARES PARA LIMPEZA ---

// Card para a aba "Visão Geral"
function InfoCard({ title, content, className = "" }) {
  return (
    <div className={`bg-white shadow-md rounded-lg p-6 ${className}`}>
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      <p className="text-slate-600 text-sm leading-relaxed">{content}</p>
    </div>
  );
}

// Item para a lista de membros
function MemberItem({ member, isIntern = false }) {
  const linkTo = isIntern ? `/sup_meu_estagiario/${member.id}` : '#';
  return (
    <li>
      <Link to={linkTo} className="flex items-center gap-4 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition">
        <img className="w-10 h-10 rounded-full object-cover" src={`${API_URL}/api/uploads/usuarios/${member.id}`} alt={member.nome} />
        <span className="font-medium text-slate-700">{member.nome}</span>
      </Link>
    </li>
  );
}