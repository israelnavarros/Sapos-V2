import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function SecGrupos() {
  const [listaGrupos, setListaGrupos] = useState([]);
  const [grupoSelecionado, setGrupoSelecionado] = useState(null);
  const [vagasNova, setVagasNova] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    // Carrega os grupos do backend
    fetch('/api/consulta_ids_grupos', { credentials: 'include' })
      .then(res => res.json())
      .then(data => setListaGrupos(data))
      .catch(err => console.error('Erro ao carregar grupos:', err));
  }, []);

  const abrirModal = (grupo) => {
    setGrupoSelecionado(grupo);
    setVagasNova(grupo.vagas);
    const modal = new bootstrap.Modal(document.getElementById('editarVagasModal'));
    modal.show();
  };

  const confirmarEdicao = () => {
    fetch('/api/adm_atualizar_vaga_grupo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ id: grupoSelecionado.id_grupo, vagas: vagasNova })
    })
      .then(res => res.json())
      .then(() => {
        setListaGrupos(prev =>
          prev.map(g =>
            g.id_grupo === grupoSelecionado.id_grupo
              ? { ...g, vagas: vagasNova }
              : g
          )
        );
        const modal = bootstrap.Modal.getInstance(document.getElementById('editarVagasModal'));
        modal.hide();
      })
      .catch(err => {
        console.error('Erro ao atualizar vagas:', err);
        alert('Erro ao atualizar vagas!');
      });
  };

  return (
    <div className="shadow-lg row g-0 border rounded p-3">
      <div className="d-grid gap-2 d-md-flex justify-content-md-end mb-3">
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/criar_grupo')}>
          Criar Grupo
        </button>
      </div>

      <div className="table-responsive">
        <table className="table table-striped table-hover table-borderless">
          <thead className="table-light">
            <tr>
              <th scope="col">#</th>
              <th className="text-center">Título</th>
              <th className="text-center">Vagas</th>
              <th className="text-center">Opções</th>
            </tr>
          </thead>
          <tbody className="table-group-divider">
            {listaGrupos.map((grupo, index) => (
              <tr key={grupo.id_grupo}>
                <th className="text-center align-middle" scope="row">{index + 1}</th>
                <td className="text-center align-middle">{grupo.titulo}</td>
                <td className="text-center align-middle">{grupo.vagas}</td>
                <td className="text-center align-middle">
                  <div className="d-grid gap-2 d-md-flex justify-content-md-end">
                    <button
                      className="btn btn-primary me-md-2"
                      onClick={() => abrirModal(grupo)}
                    >
                      Editar Vagas
                    </button>
                    <button
                      className="btn btn-primary me-md-2"
                      onClick={() => navigate(`/editar_grupo/${grupo.id_grupo}`)}
                    >
                      Editar Grupo
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => navigate(`/coordenador_por_grupo/${grupo.id_grupo}`)}
                    >
                      Incluir/Alterar Coordenador
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de edição de vagas */}
      <div className="modal fade" id="editarVagasModal" tabIndex="-1" aria-labelledby="editarVagasModalLabel" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="editarVagasModalLabel">Editar Vagas</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              <form>
                <div className="form-floating mb-3">
                  <input
                    type="text"
                    className="form-control"
                    value={grupoSelecionado?.vagas || ''}
                    readOnly
                    id="vagasAtual"
                  />
                  <label htmlFor="vagasAtual">Quantidade de vagas atual:</label>
                </div>
                <div className="form-floating">
                  <input
                    type="number"
                    className="form-control"
                    value={vagasNova}
                    onChange={e => setVagasNova(e.target.value)}
                    required
                    id="vagasNova"
                  />
                  <label htmlFor="vagasNova">Nova quantidade de vagas:</label>
                </div>
              </form>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
              <button type="button" className="btn btn-primary" onClick={confirmarEdicao}>Confirmar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
