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
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Cadastrar Novo Estagiário</h1>
          <AdicionarEstagiario grupoInfo={grupoInfo} />
        </div>
      </main>
    </>
  );
}