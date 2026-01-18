import { useContext, useRef, useState } from 'react';
import { AuthContext } from './AuthContext';
import API_URL from './config'; // Importa a URL centralizada
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
  const [avatarUrl, setAvatarUrl] = useState(`${API_URL}/api/uploads/usuarios/${user.id}` || '/src/assets/capa_padrao.jpg');
  const [showCrop, setShowCrop] = useState(false);
  const [imgPreview, setImgPreview] = useState('');
  const [croppedImg, setCroppedImg] = useState('');
  const [grupoInfo, setGrupoInfo] = useState(null);
  const fileInputRef = useRef();
  const cropperRef = useRef();

  // Buscar informações do grupo (para estagiários)
  useEffect(() => {
    if (user.cargo === 2 && user.grupo) {
      fetch(`${API_URL}/api/meu_grupo`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          setGrupoInfo(data.grupo_info);
        })
        .catch(err => console.error('Erro ao carregar dados do grupo:', err));
    }
  }, [user]);

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
    const res = await fetch(`${API_URL}/api/upload_imagem_usuario_perfil`, {
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
    const res = await fetch(`${API_URL}/api/upload_imagem_usuario_perfil`, {
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
      <main className='mt-20 p-4 bg-gray-50'>
        {/* Botão Voltar no Topo */}
        <div className="max-w-7xl mx-auto mb-4">
          <button 
            onClick={() => window.history.back()}
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors flex items-center"
          >
            <i className="bi bi-arrow-left mr-2"></i>
            Voltar
          </button>
        </div>

        <div className="container-geral container-principal">
          {/* Painel Esquerdo */}
          <div className="painel-esquerdo">
            <img
              src={avatarUrl}
              alt={user.nome}
              className="w-32 h-32 rounded-full object-cover mx-auto mb-4 bg-gray-200"
              onError={(e) => {
                e.target.src = 'https://via.placeholder.com/128?text=Perfil';
              }}
            />
            <h2 className="text-xl font-semibold text-gray-800">{user.nome}</h2>
            <p className="text-sm text-gray-600">Cargo: {cargoLabel(user.cargo)}</p>
            <p className="text-sm text-gray-600 mb-4">
              Status:
            </p>
            <h2 className="text-lg font-semibold text-gray-800">{user.status ? 'Ativo' : 'Inativo'}</h2>

            <div className="flex flex-col mt-6">
              <button
                onClick={() => window.location.href = '/editar_perfil'}
                className={`py-2 px-4 font-medium border-0 border-t-2 border-[#A8D5BA] bg-green text-white hover:bg-green-600 transition-colors`}
              >
                <i className="bi bi-pencil-square mr-2"></i>
                Editar Perfil
              </button>
            </div>
          </div>

          {/* Painel Direito */}
          <div className="painel-direito">
            <div className="pt-3">
              <div className="mb-4">
                <h3 className="text-xl font-bold text-gray-800 mb-2">Dados do Perfil</h3>
                <p className="text-sm text-gray-500">Visualize as informações cadastrais do seu perfil.</p>
              </div>

              {/* Grid de Informações */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                {/* Email */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-500">Email</label>
                  <input
                    className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                    value={user.email || 'Não informado'}
                    readOnly
                  />
                </div>

                {/* Matrícula */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-500">Matrícula</label>
                  <input
                    className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                    value={user.matricula || 'Não informado'}
                    readOnly
                  />
                </div>

                {/* Cargo */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-500">Cargo</label>
                  <input
                    className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                    value={cargoLabel(user.cargo) || 'Não informado'}
                    readOnly
                  />
                </div>

                {/* Grupo - apenas para Supervisor e Estagiário */}
                {(user.cargo === 1 || user.cargo === 2) && (
                  <div className="w-full">
                    <label className="block text-sm font-medium text-gray-500">Grupo</label>
                    <input
                      className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                      value={grupoInfo?.nome || (user.grupo ? `Grupo ${user.grupo}` : 'Não informado')}
                      readOnly
                    />
                  </div>
                )}

                {/* Data de Criação */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-500">Criado em</label>
                  <input
                    className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                    value={user.criado_em ? new Date(user.criado_em).toLocaleDateString('pt-BR') : 'Não informado'}
                    readOnly
                  />
                </div>

                {/* Data de Validade */}
                <div className="w-full">
                  <label className="block text-sm font-medium text-gray-500">Válido até</label>
                  <input
                    className="w-full p-2 mt-1 bg-gray-100 border border-gray-200 rounded text-gray-800"
                    value={user.valido_ate ? new Date(user.valido_ate).toLocaleDateString('pt-BR') : 'Não informado'}
                    readOnly
                  />
                </div>
              </div>

              {/* Informações Adicionais para Estagiário */}
              {user.cargo === 2 && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h4 className="text-md font-bold text-blue-800 mb-3">Informações do Estagiário</h4>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    <div className="p-3 bg-white rounded border border-blue-100">
                      <p className="text-sm text-gray-600">Nome do Supervisor</p>
                      <p className="text-lg font-bold text-blue-600">{grupoInfo?.supervisor_nome || 'Carregando...'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}