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
      const res = await fetch('/est_ficha_adicionada', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (res.ok) {
        const updatedFolhas = await fetch(`/est_lista_folhas_atualizada/${id_paciente}`, { credentials: 'include' });
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
      const res = await fetch(`/est_ficha_deletada/${idFolha}`, {
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
            </div>
          </div>
        )}
        {tab === 'evolucao' && (
          <div className="container pt-3">
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
                  <div className="card mt-3" key={folha.id_folha}>
                    <div className="card-body">
                      <div className="d-flex">
                        <div>
                          <h5>{folha.nome_estagiario}</h5>
                          <p>{folha.data_postagem}</p>
                        </div>
                        <div className="ms-auto">
                          <button className="btn btn-danger btn-sm" onClick={() => handleRemover(folha.id_folha)}>Excluir</button>
                        </div>
                      </div>
                      <p className="mt-3">{folha.postagem}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
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
            </div>
          </div>
        )}
      </div>
    </>
  );
}