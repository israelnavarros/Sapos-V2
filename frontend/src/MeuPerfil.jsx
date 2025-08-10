import { useContext, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import Header from './Header';
import Cropper from "cropperjs";
import "cropperjs/dist/cropper.min.css";
import { useEffect } from 'react';

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
  const [avatarUrl, setAvatarUrl] = useState(`/api/uploads/usuarios/${user.id}` || '/src/assets/capa_padrao.jpg');
  const [showCrop, setShowCrop] = useState(false);
  const [imgPreview, setImgPreview] = useState('');
  const [croppedImg, setCroppedImg] = useState('');
  const fileInputRef = useRef();
  const cropperRef = useRef();

  // Função para upload de imagem (substitua pela sua API)
  const handleImageChange = e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      setImgPreview(ev.target.result);
      setShowCrop(true);
    };
    reader.readAsDataURL(file);
  };
  useEffect(() => {
    if (showCrop && imgPreview) {
      const image = document.getElementById('crop-image');
      if (image) {
        cropperRef.current = new Cropper(image, {
          aspectRatio: 1,
          viewMode: 1,
          autoCropArea: 1,
          responsive: true,
          background: false,
        });
      }
    }
  }, [showCrop, imgPreview]);
  const confirmCrop = async () => {
  if (cropperRef.current) {
    const canvas = cropperRef.current.getCroppedCanvas({ width: 200, height: 200 });
    const cropped = canvas.toDataURL('image/jpeg');
    setCroppedImg(cropped);
    setShowCrop(false);
    cropperRef.current.destroy();
    cropperRef.current = null;

    // Converte base64 para Blob
    const blob = await (await fetch(cropped)).blob();
    const formData = new FormData();
    formData.append('avatar', blob, 'avatar.jpg');

    // Envia para o backend
    const res = await fetch('/api/upload_imagem_usuario_perfil', {
      method: 'POST',
      body: formData,
      credentials: 'include'
    });

    const data = await res.json();
    if (res.ok) {
      setAvatarUrl(data.avatarUrl);
      setUser(prev => ({ ...prev, avatarUrl: avatarUrl }));
    } else {
      alert(data.error || 'Erro ao enviar imagem');
    }
  }
};



  // Função para remover imagem (substitua pela sua API)
  const handleRemoveImage = () => {
    setAvatarUrl('/src/assets/Logo.png');
    // Aqui você faria a chamada para remover no backend e atualizar o contexto
  };
  const handleSubmit = async eOrData => {
    let payload;
    if (eOrData?.preventDefault) {
    eOrData.preventDefault();
    payload = {croppedData: croppedImg };
  } else {
    payload = {...eOrData };
  }
    const res = await fetch(`/api/upload_imagem_usuario_perfil`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      credentials: "include"
    });
    if (!res.ok) {
      alert("Erro ao atualizar!");
    }
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
                      <input type="date" className="form-control" value={user.criado_em ? user.criado_em.slice(0, 10) : ''} disabled />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Data de validade:</label>
                      <input type="date" className="form-control" value={user.valido_ate ? user.valido_ate.slice(0, 10) : ''} disabled />
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
                          // src={`/api/uploads/usuarios/${user.id}?t=${Date.now()}`}
                          src={avatarUrl}
                          // onError={e => { e.target.src = "/src/usuarios/avatar_padrao.jpg"; }}
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

                      {/* Modal de cropper igual ao do paciente */}
                      {showCrop && (
                        <div className="modal show d-block" tabIndex="-1">
                          <div className="modal-dialog modal-md">
                            <div className="modal-content">
                              <div className="modal-header">
                                <h5 className="modal-title">Ajustar a imagem</h5>
                                <button type="button" className="btn-close" onClick={() => setShowCrop(false)}></button>
                              </div>
                              <div className="modal-body">
                                <div className="img-container">
                                  <img id="crop-image" src={imgPreview} alt="Crop" />
                                </div>
                              </div>
                              <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowCrop(false)}>Cancelar</button>
                                <button type="button" className="btn btn-primary" onClick={confirmCrop}>Confirmar</button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

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
      </div >
    </>
  );
}