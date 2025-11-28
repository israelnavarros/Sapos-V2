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
      <main className="pt-20">
        <AdicionarEstagiario grupoInfo={grupoInfo} />
      </main>
    </>
  );
}