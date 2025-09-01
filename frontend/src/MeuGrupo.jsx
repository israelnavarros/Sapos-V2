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

  return (
    <>
      <Header />
      <div className="container mx-auto py-6">
        <h1 className="display-4 text-break">{grupoInfo.titulo}</h1>
        <br /><br />

        {/* Coordenadores */}
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Coordenadores</h2>
          <ul className="space-y-2">
            {coordenadores.map(coord => (
              <li key={coord.id} className="px-4 py-2 bg-gray-50 rounded hover:bg-gray-100 transition text-gray-700">
                {coord.nome}
              </li>
            ))}
          </ul>
        </section>


        {/* Estagiários */}
        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-4">
            <h2 className="text-xl font-semibold text-gray-800">Estagiários</h2>
            <div className="relative">
              <button
                className="bg-green text-white px-4 py-2 rounded hover:bg-green-600 cursor-pointer transition w-full"
                onClick={() => setShowDropdown(prev => !prev)}
              >
                Vagas: {vagas.ocupadas}/{vagas.total}
              </button>
              {showDropdown && (
                <ul className="absolute right-0 mt-2 w-64 bg-white border rounded shadow-lg z-10">
                  <li>
                    <Link to="/meugrupo/adicionar-estagiario" className="block px-4 py-2 hover:bg-gray-100 text-gray-700">
                      Adicionar diretamente
                    </Link>
                  </li>
                  <li>
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                      Adicionar por link
                    </button>
                  </li>
                  <li>
                    <button className="block w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700">
                      Adicionar por lista de estagiários
                    </button>
                  </li>
                </ul>
              )}
            </div>
          </div>

          {showAdicionar && (
            <AdicionarEstagiario
              grupoInfo={grupoInfo}
              onSuccess={() => setShowAdicionar(false)}
            />
          )}

          <ul className="space-y-2">
            {estagiarios.map(estag => (
              <li key={estag.id}>
                <Link
                  to={`/sup_meu_estagiario/${estag.id}`}
                  className="block px-4 py-2 bg-gray-50 rounded hover:bg-gray-100 transition text-green"
                >
                  {estag.nome}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Reuniões</h2>

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


        {/* Informações do grupo */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Local do Estágio */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Local do Estágio</h2>
            <p className="text-gray-700 text-justify">{grupoInfo.local}</p>
          </div>

          {/* Convênio */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Convênio</h2>
            <p className="text-gray-700 text-justify">{grupoInfo.convenio || 'Não possui convênio'}</p>
          </div>

          {/* Resumo */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Resumo</h2>
            <p className="text-gray-700 text-justify">{grupoInfo.resumo}</p>
          </div>

          {/* Objetivos */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Objetivos</h2>
            <p className="text-gray-700 text-justify">{grupoInfo.objetivos}</p>
          </div>

          {/* Atividades */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Atividades</h2>
            <p className="text-gray-700 text-justify">{grupoInfo.atividades}</p>
          </div>

          {/* Bibliografia */}
          <div className="bg-white shadow-md rounded-lg p-4">
            <h2 className="text-lg font-semibold text-center text-gray-800 mb-2">Bibliografia</h2>
            <p className="text-gray-700 text-justify">{grupoInfo.bibliografia}</p>
          </div>
        </section>

      </div>
    </>
  );
}