import { useState } from 'react';
import API_URL from './config';

export default function AdicionarEstagiario({ grupoInfo, onSuccess }) {
  const [form, setForm] = useState({
    email: '',
    senha: '',
    nome: '',
    matricula: '',
    cargo: '2',
    grupo: grupoInfo.id_grupo,
    status: true,
    criado_em: new Date().toISOString().slice(0, 10),
    valido_ate: new Date(Date.now() + 182 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  });
  const [mensagem, setMensagem] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setMensagem('');
    const res = await fetch(`${API_URL}/api/reg_estag_diretamente`, {
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
    <div className="shadow-lg row p-3 border rounded my-4">
      <form className="row g-3" onSubmit={handleSubmit}>
        <div className="col-md-6">
          <label className="form-label">Email</label>
          <input type="email" className="form-control" name="email" required value={form.email} onChange={handleChange} />
        </div>
        <div className="col-md-6">
          <label className="form-label">Senha</label>
          <input type="password" className="form-control" name="senha" required value={form.senha} onChange={handleChange} />
        </div>
        <div className="col-12">
          <label className="form-label">Nome completo</label>
          <input type="text" className="form-control" name="nome" required value={form.nome} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Matricula</label>
          <input type="text" className="form-control" name="matricula" required value={form.matricula} onChange={handleChange} />
        </div>
        <div className="col-md-4">
          <label className="form-label">Cargo</label>
          <input type="text" className="form-control" value="Estagiario" disabled />
        </div>
        <div className="col-md-4">
          <label className="form-label">Grupo</label>
          <input type="text" className="form-control" value={grupoInfo.titulo} disabled />
        </div>
        <div className="col-md-4">
          <label className="form-label">Status</label>
          <input type="text" className="form-control" value="Ativo" disabled />
        </div>
        <div className="col-md-4">
          <label className="form-label">Data de entrada</label>
          <input type="date" className="form-control" value={form.criado_em} disabled />
        </div>
        <div className="col-md-4">
          <label className="form-label">Data de validade</label>
          <input type="date" className="form-control" value={form.valido_ate} disabled />
        </div>
        <div className="col-12">
          <button type="submit" className="btn btn-primary">Cadastrar</button>
        </div>
        {mensagem && <div className="col-12"><span>{mensagem}</span></div>}
      </form>
    </div>
  );
}