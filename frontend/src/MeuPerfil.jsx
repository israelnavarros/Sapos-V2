import { useContext, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import Header from './Header';

const cargoLabel = (cargo) => {
  switch (cargo) {
    case 0: return 'Secretaria';
    case 1: return 'Supervisor';
    case 2: return 'Estagiário';
    case 3: return 'Coordenador do Curso';
    default: return 'Desconhecido';
  }
};

export default function MeuPerfil() {
  const { user, setUser } = useContext(AuthContext);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '/src/assets/Logo.png');
  const fileInputRef = useRef();

  // Função para upload de imagem (substitua pela sua API)
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    // Aqui você faria o upload para o backend e atualizaria o avatar
    // Exemplo fake:
    const reader = new FileReader();
    reader.onload = () => setAvatarUrl(reader.result);
    reader.readAsDataURL(file);
    // Após upload real, atualize o user/avatar no contexto se necessário
  };

  // Função para remover imagem (substitua pela sua API)
  const handleRemoveImage = () => {
    setAvatarUrl('/src/assets/Logo.png');
    // Aqui você faria a chamada para remover no backend e atualizar o contexto
  };

  if (!user) return <div>Carregando...</div>;

  return (
    <>
    <Header />        
    <div className="container mx-auto py-6">
      <div className="row">
        <div className="col-12">
          <div className="row mb-5 gx-5">
            {/* Dados do usuário */}
            <div className="col-xxl-8 mb-5 mb-xxl-0">
              <div className="shadow-lg px-4 py-5 rounded">
                <div className="row g-3">
                  <div className="col-md-12">
                    <label className="form-label">Nome:</label>
                    <input type="text" className="form-control" value={user.nome} disabled />
                  </div>
                  <div className="col-md-12">
                    <label className="form-label">Email:</label>
                    <input type="email" className="form-control" value={user.email} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Matricula:</label>
                    <input type="text" className="form-control" value={user.matricula || ''} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Cargo:</label>
                    <input type="text" className="form-control" value={cargoLabel(user.cargo)} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Data ingresso:</label>
                    <input type="date" className="form-control" value={user.criado_em ? user.criado_em.slice(0,10) : ''} disabled />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Data de validade:</label>
                    <input type="date" className="form-control" value={user.valido_ate ? user.valido_ate.slice(0,10) : ''} disabled />
                  </div>
                </div>
              </div>
            </div>
            {/* Foto de perfil */}
            <div className="col-xxl-4">
              <div className="shadow-lg px-4 py-5 rounded">
                <div className="row g-3">
                  <h4 className="text-center mb-4 mt-0">Foto de Perfil</h4>
                  <div className="text-center">
                    <div className="square position-relative display-2 mb-3">
                      <img
                        className="img-fluid rounded"
                        name="profile-img"
                        id="profile-img"
                        src={avatarUrl}
                        alt="Avatar"
                        style={{ width: 200, height: 200, objectFit: 'cover' }}
                      />
                    </div>
                    <input
                      type="file"
                      className="d-none"
                      id="file-input"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handleImageChange}
                    />
                    <button
                      className="btn btn-primary m-1"
                      type="button"
                      onClick={() => fileInputRef.current.click()}
                    >
                      Alterar imagem
                    </button>
                    <button
                      className="btn btn-primary m-1"
                      type="button"
                      onClick={handleRemoveImage}
                    >
                      Remover imagem
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
      </>
  );
}