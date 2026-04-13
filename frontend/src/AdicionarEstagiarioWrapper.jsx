import { useEffect, useState } from 'react';
import AdicionarEstagiario from './AdicionarEstagiario';
import Header from './Header';
import API_URL from './config';

export default function AdicionarEstagiarioWrapper() {
  const [grupoInfo, setGrupoInfo] = useState(null);

  useEffect(() => {
    async function fetchGrupo() {
      const res = await fetch(`${API_URL}/api/meu_grupo`, { credentials: 'include' });
      const data = await res.json();
      setGrupoInfo(data.grupo_info);
    }
    fetchGrupo();
  }, []);

  if (!grupoInfo) return <div>Carregando...</div>;
  return (
    <>
      <Header />
      <main className="mt-20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Cadastrar Novo Estagiário</h3>
            <p className="mt-1 text-base sm:text-lg text-slate-600">Preencha os dados para registrar o estagiário no seu grupo.</p>
          </div>
          <AdicionarEstagiario grupoInfo={grupoInfo} />
        </div>
      </main>
    </>
  );
}