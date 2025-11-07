import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Index from './Index';
import MeuPerfil from './MeuPerfil';
import MeuGrupo from './MeuGrupo';
import AdicionarEstagiarioWrapper from './AdicionarEstagiarioWrapper';
import SupMeuEstagiario from './MeuEstagiario';
import FichaPaciente from './FichaPaciente';
import SecAdministracao from './Sec_Administracao';
import SecPacientes from './Sec_Pacientes';
import SecEditarPaciente from './Sec_Paciente_Editar';
import SecGrupos from './Sec_Grupos';
import SecUsuarios from './Sec_Usuarios';
import SecAlertas from './Sec_Alertas';
import EstMeuGrupo from './EstMeuGrupo';
import EstFichaPaciente from './EstFichaPaciente';
import SecAdicionarPaciente from './Sec_Paciente_Adicionar';
import EstEditarPaciente from './EstFichaPaciente_Editar';
import SupDashboardPacientes from './SupPacientesDashboard';
import SecTrocas from './Sec_Trocas';
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
          <Route path="/administracao" element={<SecAdministracao />} />
          <Route path="/sec_pacientes" element={<SecPacientes />} />
          <Route path="/sec_editar_paciente/:id_paciente" element={<SecEditarPaciente />} />
          <Route path="/sec_grupos" element={<SecGrupos />} />
          <Route path="/sec_usuarios" element={<SecUsuarios />} />
          <Route path="/sec_alertas" element={<SecAlertas />} />
          <Route path="/meuspacientes" element={<EstMeuGrupo />} />
          <Route path="/est_ficha_paciente/:id_paciente" element={<EstFichaPaciente />} />
          <Route path="/sec_adicionar_paciente" element={<SecAdicionarPaciente />} />
          <Route path="/est_editar_paciente/:id_paciente" element={<EstEditarPaciente />} />
          <Route path="/sup_dashboard_pacientes" element={<SupDashboardPacientes />} />
          <Route path="/sec_trocas" element={<SecTrocas />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;