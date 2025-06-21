import { useState } from 'react';

function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [mensagem, setMensagem] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMensagem('');
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      });
      const data = await response.json();
      if (data.success) {
        setMensagem(data.message);
        // Redirecionar ou atualizar estado global aqui se necessário
      } else {
        setMensagem(data.message);
      }
    } catch (err) {
      setMensagem('Erro ao conectar com o servidor.' + err.message);
    }
  };

  return (
    <div style={{ backgroundColor: '#58ebdb', minHeight: '100vh' }}>
      <div className="container py-5 h-100">
        <div className="row d-flex align-items-center justify-content-center h-100">
          <div className="col-md-8 col-lg-7 col-xl-6">
            <img className="img-fluid bg-transparent" src="/uploads/SAPO - Logo.png" width="200" height="200" alt="Logo SAPO" />
          </div>
          <div className="col-md-7 col-lg-5 col-xl-5 offset-xl-1">
            <form onSubmit={handleSubmit}>
              <div className="form-group mb-3">
                <label className="form-label">E-mail</label>
                <input
                  type="email"
                  className="form-control"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group mb-3">
                <label className="form-label">Senha</label>
                <input
                  type="password"
                  className="form-control"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  required
                />
              </div>
              <div className="form-group py-2 d-grid gap-2 col-6 mx-auto mt-2">
                <button type="submit" className="btn btn-primary btn-lg btn-block">Entrar</button>
              </div>
              {mensagem && (
                <div className="toast align-items-center bg-light border-0 show mt-3" role="alert">
                  <div className="d-flex">
                    <div className="toast-body">{mensagem}</div>
                    <button type="button" className="btn-close me-2 m-auto" onClick={() => setMensagem('')}></button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;