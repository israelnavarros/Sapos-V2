import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API_URL from './config';
import Header from './Header';

function FormField({ label, htmlFor, children, required = false }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-slate-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {children}
    </div>
  );
}

export default function SecAdicionarSupervisor() {
  const navigate = useNavigate();
  const [grupos, setGrupos] = useState([]);
  const [form, setForm] = useState({
    email: '',
    senha: '',
    nome: '',
    matricula: '',
    cargo: '1', // Supervisor
    grupo: '',
    status: true,
    criado_em: new Date().toISOString().slice(0, 10),
    valido_ate: new Date(Date.now() + 1825 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10) // ~5 anos
  });
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    fetch(`${API_URL}/api/consulta_ids_grupos`, { credentials: 'include' })
      .then(res => res.json())
      .then(data => setGrupos(data))
      .catch(err => console.error('Erro ao carregar grupos:', err));
  }, []);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMensagem('');
    const res = await fetch(`${API_URL}/api/registrar_usuario`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(form)
    });
    const data = await res.json();
    if (data.success) {
      alert('Supervisor cadastrado com sucesso!');
      navigate('/sec_usuarios');
    } else {
      setMensagem(data.message || 'Erro ao cadastrar.');
    }
  };

  return (
    <>
      <Header />
      <main className="mt-20 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="mb-4 text-sm text-gray-500 hover:text-gray-700">&larr; Voltar</button>
          <h1 className="text-3xl font-bold text-slate-800 mb-6">Cadastrar Novo Supervisor</h1>
          
          <div className="bg-white p-6 rounded-xl shadow-md my-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Email" htmlFor="email" required>
                  <input type="email" id="email" name="email" required value={form.email} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300" autoComplete="off" />
                </FormField>
                <FormField label="Senha" htmlFor="senha" required>
                  <input type="password" id="senha" name="senha" required value={form.senha} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300" autoComplete="new-password" />
                </FormField>
              </div>

              <FormField label="Nome Completo" htmlFor="nome" required>
                <input type="text" id="nome" name="nome" required value={form.nome} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300" />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Matrícula" htmlFor="matricula" required>
                  <input type="text" id="matricula" name="matricula" required value={form.matricula} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300" />
                </FormField>
                <FormField label="Grupo (Opcional)" htmlFor="grupo">
                  <select id="grupo" name="grupo" value={form.grupo} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300">
                    <option value="">Selecione um grupo...</option>
                    {grupos.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.titulo}</option>)}
                  </select>
                </FormField>
              </div>

              <div className="pt-6 border-t text-right">
                <button type="submit" className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors">Cadastrar Supervisor</button>
              </div>
              {mensagem && <div className="mt-4 text-center p-3 rounded-md text-sm bg-red-50 text-red-800">{mensagem}</div>}
            </form>
          </div>
        </div>
      </main>
    </>
  );
}