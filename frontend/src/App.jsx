import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Index from './Index';
import MeuPerfil from './MeuPerfil';
import MeuGrupo from './MeuGrupo';
import AdicionarEstagiarioWrapper from './AdicionarEstagiarioWrapper';
import SupMeuEstagiario from './MeuEstagiario';
import FichaPaciente from './FichaPaciente';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/meuperfil" element={<MeuPerfil />} />
          <Route path="/meugrupo" element={<MeuGrupo />} />
          <Route path="/" element={<Index />} />
          <Route path="/meugrupo/adicionar-estagiario" element={<AdicionarEstagiarioWrapper />} />
          <Route path="/sup_meu_estagiario/:id_estagiario" element={<SupMeuEstagiario />} />
          <Route path="/sup_ficha_paciente/:id_paciente" element={<FichaPaciente />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;