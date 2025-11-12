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
      <main className="pt-20 min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 pb-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Card Principal - Avatar e Info Básica */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
            <div className="bg-gradient-to-r from-green to-green-600 h-32"></div>
            
            <div className="px-6 pb-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 -mt-16 mb-6">
                {/* Avatar */}
                <div className="relative z-10">
                  <img
                    src={avatarUrl}
                    alt={user.nome}
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover bg-gray-200"
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/128?text=Perfil';
                    }}
                  />
                </div>
                
                {/* Info Básica */}
                <div className="flex-1 text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-gray-800">{user.nome}</h1>
                  <p className="text-green text-lg font-semibold mt-1">{cargoLabel(user.cargo)}</p>
                  <p className="text-gray-500 text-sm mt-2">Matrícula: {user.matricula}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Grid de Informações */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Card - Contato */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Email</h3>
              </div>
              <p className="text-gray-600 break-all">{user.email}</p>
            </div>

            {/* Card - Grupo */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 8.646 4 4 0 010-8.646M9 9h6m-6 4h6m2-5a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Grupo</h3>
              </div>
              <p className="text-gray-600 text-lg font-semibold">Grupo {user.grupo}</p>
            </div>

            {/* Card - Status */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Status</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className={`inline-block w-3 h-3 rounded-full ${user.status ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <p className="text-gray-600 font-medium">{user.status ? 'Ativo' : 'Inativo'}</p>
              </div>
            </div>

            {/* Card - Datas */}
            <div className="bg-white rounded-xl shadow p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-800">Datas</h3>
              </div>
              <div className="space-y-2 text-gray-600">
                <p className="text-sm"><span className="font-semibold">Criado em:</span> {new Date(user.criado_em).toLocaleDateString('pt-BR')}</p>
                <p className="text-sm"><span className="font-semibold">Válido até:</span> {new Date(user.valido_ate).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>

          {/* Card - Informações Adicionais */}
          {user.cargo === 3 && (
            <div className="bg-white rounded-xl shadow p-6 mb-8">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Informações do Estagiário</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-600">ID do Supervisor</p>
                  <p className="text-xl font-bold text-blue-600">{user.id_supervisor || 'N/A'}</p>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg">
                  <p className="text-sm text-gray-600">Grupo Atual</p>
                  <p className="text-xl font-bold text-indigo-600">Grupo {user.grupo}</p>
                </div>
              </div>
            </div>
          )}

          {/* Botões de Ação */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => window.history.back()}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Voltar
            </button>
            <button
              onClick={() => window.location.href = '/editar_perfil'}
              className="px-6 py-3 bg-green text-white rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              Editar Perfil
            </button>
          </div>
        </div>
      </main>
    </>
  );
}