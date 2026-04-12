import { useNavigate } from 'react-router-dom';
import AdicionarEstagiario from './AdicionarEstagiario';
import Header from './Header';

export default function SecAdicionarEstagiario() {
  const navigate = useNavigate();

  return (
    <>
      <Header />
      <main className="mt-20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-4 text-sm text-gray-500 hover:text-gray-700">&larr; Voltar</button>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 text-center md:text-left">Cadastrar Novo Estagiário</h1>
          <AdicionarEstagiario onSuccess={() => navigate('/sec_usuarios')} />
        </div>
      </main>
    </>
  );
}