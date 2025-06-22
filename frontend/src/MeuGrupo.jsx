import { useContext, useEffect, useState } from 'react';
import { AuthContext } from './AuthContext';
import Header from './Header';
import AdicionarEstagiario from './AdicionarEstagiario';
import { Link } from 'react-router-dom';

export default function MeuGrupo() {
  const { user } = useContext(AuthContext);
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
        setVagas({ ocupadas: grupoData.estagiarios_count, total: grupoData.grupo_info.vagas });
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
      })
    });
    const data = await res.json();
    if (data.status === 'success') {
      setReunioes([...reunioes, data.novaReuniao]);
      setNovoReuniao({ dia: '', horaini: '', horafim: '' });
    } else {
      alert(data.message || 'Erro ao adicionar reunião');
    }
  };

  // Remover reunião
  const handleRemoveReuniao = async (id_reuniao) => {
    const res = await fetch('/api/remover_reuniao', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id_reuniao_grupo: id_reuniao })
    });
    const data = await res.json();
    if (data.status === 'success') {
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
        <div className="shadow-lg row g-0 border rounded mb-4">
          <h1 className="display-6 w-25 m-3">Coordenadores</h1>
          <ul className="list-group list-group-flush p-2">
            {coordenadores.map(coord => (
              <li key={coord.id} className="list-group-item list-group-item-action">{coord.nome}</li>
            ))}
          </ul>
        </div>

        {/* Estagiários */}
        <div className="shadow-lg row g-0 border rounded mb-4">
          <div className="col-md-8">
            <h1 className="display-6 w-25 p-3">Estagiários</h1>
          </div>
          <div className="col-md-4 col-12 justify-content-end p-3">
            <div className="dropdown text-end">
              <button className="btn btn-secondary dropdown-toggle h-100 w-100" type="button">
                Vagas: {vagas.ocupadas}/{vagas.total}
              </button>
              <ul className="dropdown-menu">
                <li>
                  <Link className="dropdown-item" to="/meugrupo/adicionar-estagiario">
                    Adicionar diretamente
                  </Link>
                </li>
                <li><a className="dropdown-item" href="#">Adicionar por link</a></li>
                <li><a className="dropdown-item" href="#">Adicionar por lista de estagiários</a></li>
              </ul>
            </div>
            {showAdicionar && (
              <AdicionarEstagiario
                grupoInfo={grupoInfo}
                onSuccess={() => setShowAdicionar(false)}
              />
            )}
          </div>
          <div className="list-group list-group-flush p-2">
            {estagiarios.map(estag => (
              <Link key={estag.id} to={`/sup_meu_estagiario/${estag.id}`} className="list-group-item list-group-item-action">
                {estag.nome}
              </Link>
            ))}
          </div>
        </div>

        {/* Reuniões */}
        <div className="shadow-lg row g-0 border rounded mb-4">
          <h1 className="display-6 w-25 m-3">Reuniões</h1>
          <div className="px-2 py-3">
            <div className="row g-2 justify-content-center">
              <div className="col-md-4 col-12 p-2">
                <div className="form-floating">
                  <select className="form-select" id="diaReuniao" required
                    value={novoReuniao.dia}
                    onChange={e => setNovoReuniao({ ...novoReuniao, dia: e.target.value })}
                  >
                    <option value="">Escolha uma das opções</option>
                    {DIAS_DA_SEMANA.map((dia, idx) => (
                      <option key={idx} value={idx}>{dia}</option>
                    ))}
                  </select>
                  <label htmlFor="diaReuniao">Dia da semana</label>
                </div>
              </div>
              <div className="col-md-2 col-12 p-2">
                <div className="form-floating">
                  <input type="time" className="form-control" id="horainiReuniao" required
                    value={novoReuniao.horaini}
                    onChange={e => setNovoReuniao({ ...novoReuniao, horaini: e.target.value })}
                  />
                  <label htmlFor="horainiReuniao">Horário de inicio</label>
                </div>
              </div>
              <div className="col-md-2 col-12 p-2">
                <div className="form-floating">
                  <input type="time" className="form-control" id="horafimReuniao" required
                    value={novoReuniao.horafim}
                    onChange={e => setNovoReuniao({ ...novoReuniao, horafim: e.target.value })}
                  />
                  <label htmlFor="horafimReuniao">Horário de fim</label>
                </div>
              </div>
              <div className="col-md-1 col-12 p-2">
                <button type="button" className="btn btn-light h-100 w-100" onClick={handleAddReuniao}>
                  <i className="bi bi-plus-square"></i>
                  <span className="d-inline d-md-none"> Adicionar Reunião</span>
                </button>
              </div>
            </div>
          </div>
          <div className="px-2 py-3">
            <table className="table table-hover table-responsive table-borderless" id="reunioesTable">
              <tbody>
                {reunioes.map(reuniao => (
                  <tr key={reuniao.id_reuniaogrupos}>
                    <td className="text-start align-middle">Dia da Semana: {DIAS_DA_SEMANA[reuniao.dia]}</td>
                    <td className="text-start align-middle">Horário de Início: {reuniao.hora_inicio}</td>
                    <td className="text-start align-middle">Horário de Término: {reuniao.hora_fim}</td>
                    <td className="text-center align-middle">
                      <button type="button" className="btn btn-light" onClick={() => handleRemoveReuniao(reuniao.id_reuniaogrupos)}>
                        <i className="bi bi-dash-square"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Informações do grupo */}
        <div className="row g-2">
          <div className="col-md-6 mb-4">
            <div className="shadow-lg row g-0 border rounded">
              <h1 className="display-6 text-center pt-3">Local do Estágio</h1>
              <p className="ms-3 text-justify">{grupoInfo.local}</p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="shadow-lg row g-0 border rounded">
              <h1 className="display-6 text-center pt-3">Convênio</h1>
              <p className="ps-3 text-justify">{grupoInfo.convenio || 'Não possui convênio'}</p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="shadow-lg row g-0 border rounded">
              <h1 className="display-6 text-center pt-3">Resumo</h1>
              <p className="p-3 text-justify">{grupoInfo.resumo}</p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="shadow-lg row g-0 border rounded">
              <h1 className="display-6 text-center pt-3">Objetivos</h1>
              <p className="ps-3 text-justify">{grupoInfo.objetivos}</p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="shadow-lg row g-0 border rounded">
              <h1 className="display-6 text-center pt-3">Atividades</h1>
              <p className="ps-3 text-justify">{grupoInfo.atividades}</p>
            </div>
          </div>
          <div className="col-md-6 mb-4">
            <div className="shadow-lg row g-0 border rounded">
              <h1 className="display-6 text-center pt-3">Bibliografia</h1>
              <p className="ps-3 text-justify">{grupoInfo.bibliografia}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}