import { useState, useEffect } from 'react';
import API_URL from './config';

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

export default function AdicionarEstagiario({ grupoInfo, onSuccess }) {
  const [form, setForm] = useState({
    email: '',
    senha: '',
    nome: '',
    matricula: '',
    cargo: '2',
    grupo: grupoInfo ? grupoInfo.id_grupo : '',
    status: true,
    criado_em: new Date().toISOString().slice(0, 10),
    valido_ate: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const [mensagem, setMensagem] = useState('');
  const [grupos, setGrupos] = useState([]);

  useEffect(() => {
    if (!grupoInfo) {
      fetch(`${API_URL}/api/consulta_ids_grupos`, { credentials: 'include' })
        .then(res => res.json())
        .then(data => setGrupos(data))
        .catch(err => console.error('Erro ao carregar grupos:', err));
    }
  }, [grupoInfo]);

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
      setMensagem('Estagiário cadastrado com sucesso!');
      if (onSuccess) onSuccess();
    } else {
      setMensagem(data.message || 'Erro ao cadastrar.');
    }
  };

  return (
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Matrícula" htmlFor="matricula" required>
            <input type="text" id="matricula" name="matricula" required value={form.matricula} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300" />
          </FormField>
          <FormField label="Cargo" htmlFor="cargo">
            <input type="text" id="cargo" className="mt-1 w-full p-2 border rounded-md shadow-sm bg-slate-100 border-gray-300" value="Estagiário" disabled />
          </FormField>
          {grupoInfo ? (
            <FormField label="Grupo" htmlFor="grupo">
              <input type="text" id="grupo" className="mt-1 w-full p-2 border rounded-md shadow-sm bg-slate-100 border-gray-300" value={grupoInfo.titulo} disabled />
            </FormField>
          ) : (
            <FormField label="Grupo" htmlFor="grupo">
              <select id="grupo" name="grupo" value={form.grupo} onChange={handleChange} className="mt-1 w-full p-2 border rounded-md shadow-sm focus:ring-green focus:border-green border-gray-300">
                <option value="">Selecione um grupo...</option>
                {grupos.map(g => <option key={g.id_grupo} value={g.id_grupo}>{g.titulo}</option>)}
              </select>
            </FormField>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField label="Status" htmlFor="status">
            <input type="text" id="status" className="mt-1 w-full p-2 border rounded-md shadow-sm bg-slate-100 border-gray-300" value="Ativo" disabled />
          </FormField>
          <FormField label="Data de Entrada" htmlFor="criado_em">
            <input type="date" id="criado_em" className="mt-1 w-full p-2 border rounded-md shadow-sm bg-slate-100 border-gray-300" value={form.criado_em} disabled />
          </FormField>
          <FormField label="Data de Validade" htmlFor="valido_ate">
            <input type="date" id="valido_ate" className="mt-1 w-full p-2 border rounded-md shadow-sm bg-slate-100 border-gray-300" value={form.valido_ate} disabled />
          </FormField>
        </div>

        <div className="pt-6 border-t text-right">
          <button type="submit" className="px-6 py-2 bg-green text-white font-semibold rounded-lg shadow-md hover:bg-opacity-90 transition-colors disabled:opacity-50">
            Cadastrar Estagiário
          </button>
        </div>

        {mensagem && <div className="mt-4 text-center p-3 rounded-md text-sm bg-blue-50 text-blue-800">{mensagem}</div>}
      </form>
    </div>
  );
}