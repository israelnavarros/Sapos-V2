import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import Header from './Header';
import AdicionarEstagiario from './AdicionarEstagiario';
import { Link } from 'react-router-dom';

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

  // Carrega dados do grupo ao montar
  useEffect(() => {
    async function fetchGrupo() {
      try {
        const grupoRes = await fetch('/api/meu_grupo', {
          credentials: 'include' // <-- Adicione esta linha!
        });
        if (!grupoRes.ok) throw new Error('Erro ao buscar grupo');
        const grupoData = await grupoRes.json();
        setGrupoInfo(grupoData.grupo_info);
        setCoordenadores(grupoData.coordenadores);
        setEstagiarios(grupoData.estagiarios);
        setReunioes(grupoData.reunioes);
        setVagas({ ocupadas: grupoData.estagiarios_count, total: grupoData.grupo_info.vagas_estagiarios });
      } catch (err) {
        setGrupoInfo(null);
        alert('Erro ao carregar dados do grupo.');
        console.error(err);
      }
    }
    fetchGrupo();
  }, []);

  // Adicionar reunião
  const handleAddReuniao = async () => {
    if (!novoReuniao.dia || !novoReuniao.horaini || !novoReuniao.horafim) {
      alert('Preencha todos os campos!');
      return;
    }
    const res = await fetch('/api/adicionar_reuniao', {
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
    const res = await fetch('/api/remover_reuniao', {
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


  //       <section className="bg-white shadow-md rounded-lg p-6 mb-6">
  //         <h2 className="text-xl font-semibold text-gray-800 mb-4">Reuniões</h2>

  //         {/* Formulário de nova reunião */}
  //         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-1">Dia da semana</label>
  //             <select
  //               className="w-full border rounded px-3 py-2"
  //               value={novoReuniao.dia}
  //               onChange={e => setNovoReuniao({ ...novoReuniao, dia: e.target.value })}
  //             >
  //               <option value="">Escolha</option>
  //               {DIAS_DA_SEMANA.map((dia, idx) => (
  //                 <option key={idx} value={idx}>{dia}</option>
  //               ))}
  //             </select>
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-1">Horário de início</label>
  //             <input
  //               type="time"
  //               className="w-full border rounded px-3 py-2"
  //               value={novoReuniao.horaini}
  //               onChange={e => setNovoReuniao({ ...novoReuniao, horaini: e.target.value })}
  //             />
  //           </div>
  //           <div>
  //             <label className="block text-sm font-medium text-gray-700 mb-1">Horário de fim</label>
  //             <input
  //               type="time"
  //               className="w-full border rounded px-3 py-2"
  //               value={novoReuniao.horafim}
  //               onChange={e => setNovoReuniao({ ...novoReuniao, horafim: e.target.value })}
  //             />
  //           </div>
  //           <div className="flex items-end">
  //             <button
  //               type="button"
  //               className="bg-green text-white px-4 py-2 rounded hover:bg-green-700 cursor-pointer transition w-full"
  //               onClick={handleAddReuniao}
  //             >
  //               Adicionar
  //             </button>
  //           </div>
  //         </div>

  //         {/* Tabela de reuniões */}
  //         <table className="min-w-full divide-y divide-gray-200">
  //           <thead className="bg-gray-100">
  //             <tr>
  //               <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Dia</th>
  //               <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Início</th>
  //               <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Fim</th>
  //               <th className="px-4 py-2 text-center text-sm font-medium text-gray-700">Ações</th>
  //             </tr>
  //           </thead>
  //           <tbody className="divide-y divide-gray-200">
  //             {reunioes.map(reuniao => (
  //               <tr key={reuniao.id_reuniaogrupos} className="hover:bg-gray-50">
  //                 <td className="px-4 py-2">{DIAS_DA_SEMANA[reuniao.dia]}</td>
  //                 <td className="px-4 py-2">{reuniao.hora_inicio}</td>
  //                 <td className="px-4 py-2">{reuniao.hora_fim}</td>
  //                 <td className="px-4 py-2 text-center">
  //                   <button
  //                     className="text-red-600 hover:text-red-800"
  //                     onClick={() => handleRemoveReuniao(reuniao.id_reuniaogrupos)}
  //                   >
  //                     <i className="bi bi-trash"></i>
  //                   </button>
  //                 </td>
  //               </tr>
  //             ))}
  //           </tbody>
  //         </table>
  //       </section>


  //       {/* Informações do grupo */}
  //       <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
  //         {/* Local do Estágio */}
  //         <div className="bg-white shadow-md rounded-lg p-4">
  //           <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Local do Estágio</h2>
  //           <p className="text-gray-700 text-justify">{grupoInfo.local}</p>
  //         </div>

  //         {/* Convênio */}
  //         <div className="bg-white shadow-md rounded-lg p-4">
  //           <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Convênio</h2>
  //           <p className="text-gray-700 text-justify">{grupoInfo.convenio || 'Não possui convênio'}</p>
  //         </div>

  //         {/* Resumo */}
  //         <div className="bg-white shadow-md rounded-lg p-4">
  //           <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Resumo</h2>
  //           <p className="text-gray-700 text-justify">{grupoInfo.resumo}</p>
  //         </div>

  //         {/* Objetivos */}
  //         <div className="bg-white shadow-md rounded-lg p-4">
  //           <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Objetivos</h2>
  //           <p className="text-gray-700 text-justify">{grupoInfo.objetivos}</p>
  //         </div>

  //         {/* Atividades */}
  //         <div className="bg-white shadow-md rounded-lg p-4">
  //           <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Atividades</h2>
  //           <p className="text-gray-700 text-justify">{grupoInfo.atividades}</p>
  //         </div>

  //         {/* Bibliografia */}
  //         <div className="bg-white shadow-md rounded-lg p-4">
  //           <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Bibliografia</h2>
  //           <p className="text-gray-700 text-justify">{grupoInfo.bibliografia}</p>
  //         </div>
  //       </section>

  //     </div>
  //   </>
  // );
  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-screen pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Cabeçalho da Página */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-900 break-words">{grupoInfo.titulo}</h1>
            <p className="mt-1 text-lg text-slate-600">Gerencie as informações do seu grupo de estágio.</p>
          </div>

          {/* --- NAVEGAÇÃO POR ABAS --- */}
          <div className="border-b border-slate-200 mb-8">
            <nav className="-mb-px flex space-x-6">
              <TabButton aba="visaoGeral" label="Visão Geral" />
              <TabButton aba="membros" label="Membros" />
              <TabButton aba="reunioes" label="Reuniões" />
              <TabButton aba="dashboard" label="Dashboard de Pacientes" />
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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Coordenadores */}
                <div>
                  <h2 className="text-xl font-semibold text-slate-800 mb-4">Coordenadores</h2>
                  <ul className="space-y-3">
                    {coordenadores.map(coord => <MemberItem key={coord.id} member={coord} />)}
                  </ul>
                </div>
                {/* Estagiários */}
                <div>

                  {showAdicionar && (
                    <AdicionarEstagiario
                      grupoInfo={grupoInfo}
                      onSuccess={() => setShowAdicionar(false)}
                    />
                  )}
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold text-slate-800">Estagiários</h2>
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
                            <button className="block w-full text-left px-4 py-2 hover:bg-green hover:text-white ">
                              Adicionar por lista de estagiários
                            </button>
                          </li>
                        </ul>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-500 mb-4">Vagas: {vagas.ocupadas} / {vagas.total}</p>
                  <ul className="space-y-3">
                    {estagiarios.map(estag => <MemberItem key={estag.id} member={estag} isIntern={true} />)}
                  </ul>
                </div>
              </div>
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
                          <td className="px-4 py-2">{DIAS_DA_SEMANA[reuniao.dia]}</td>
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
                </section>

              </div>
            )}

            {/* Aba: Dashboard de Pacientes */}
            {abaAtiva === 'dashboard' && (
              <div className="bg-white p-6 rounded-xl shadow-md text-center">
                <h2 className="text-xl font-semibold text-slate-800">Dashboard de Pacientes</h2>
                <p className="mt-2 text-slate-500">Esta área exibirá gráficos e estatísticas sobre os pacientes do seu grupo.</p>
                {/* Você pode adicionar seus componentes de gráfico aqui no futuro */}
              </div>
            )}
          </div>
        </div>
      </main>
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
        <img className="w-10 h-10 rounded-full object-cover" src={`/api/uploads/usuarios/${member.id}`} alt={member.nome} />
        <span className="font-medium text-slate-700">{member.nome}</span>
      </Link>
    </li>
  );
}