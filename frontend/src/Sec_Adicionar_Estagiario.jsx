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
          <div className="mb-8 text-center md:text-left">
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-2">Cadastrar Novo Estagiário</h3>
            <p className="mt-1 text-base sm:text-lg text-slate-600">Preencha os dados para adicionar um estagiário ao sistema.</p>
          </div>
          <AdicionarEstagiario onSuccess={() => navigate('/sec_usuarios')} />
        </div>
      </main>
    </>
  );
}