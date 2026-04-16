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
import Configuracoes from './Configuracoes';
import AlertasSimple from './AlertasSimple';
import EstMeuGrupo from './EstMeuGrupo';
import EstFichaPaciente from './EstFichaPaciente';
import SecAdicionarPaciente from './Sec_Paciente_Adicionar';
import EstEditarPaciente from './EstFichaPaciente_Editar';
import SecTrocas from './Sec_Trocas';
import SupAssumirPaciente from './SupAssumirPaciente';
import EstAssumirPaciente from './EstAssumirPaciente';
import SecAdicionarEstagiario from './Sec_Adicionar_Estagiario';
import SecAdicionarSupervisor from './Sec_Adicionar_Supervisor';
import SecFichaPaciente from './SecFichaPaciente';
import { AuthProvider } from './AuthContext';
import ProtectedRoute from './ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/meuperfil" element={<ProtectedRoute><MeuPerfil /></ProtectedRoute>} />
          <Route path="/meugrupo" element={<ProtectedRoute><MeuGrupo /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          <Route path="/meugrupo/adicionar-estagiario" element={<ProtectedRoute><AdicionarEstagiarioWrapper /></ProtectedRoute>} />
          <Route path="/sup_meu_estagiario/:id_estagiario" element={<ProtectedRoute><SupMeuEstagiario /></ProtectedRoute>} />
          <Route path="/sup_ficha_paciente/:id_paciente" element={<ProtectedRoute><FichaPaciente /></ProtectedRoute>} />
          <Route path="/administracao" element={<ProtectedRoute><SecAdministracao /></ProtectedRoute>} />
          <Route path="/sec_pacientes" element={<ProtectedRoute><SecPacientes /></ProtectedRoute>} />
          <Route path="/sec_editar_paciente/:id_paciente" element={<ProtectedRoute><SecEditarPaciente /></ProtectedRoute>} />
          <Route path="/sec_grupos" element={<ProtectedRoute><SecGrupos /></ProtectedRoute>} />
          <Route path="/sec_usuarios" element={<ProtectedRoute><SecUsuarios /></ProtectedRoute>} />
          <Route path="/sec_alertas" element={<ProtectedRoute><SecAlertas /></ProtectedRoute>} />
          <Route path="/notificacoes" element={<ProtectedRoute><AlertasSimple /></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><Configuracoes /></ProtectedRoute>} />
          <Route path="/meuspacientes" element={<ProtectedRoute><EstMeuGrupo /></ProtectedRoute>} />
          <Route path="/est_ficha_paciente/:id_paciente" element={<ProtectedRoute><EstFichaPaciente /></ProtectedRoute>} />
          <Route path="/sec_adicionar_paciente" element={<ProtectedRoute><SecAdicionarPaciente /></ProtectedRoute>} />
          <Route path="/est_editar_paciente/:id_paciente" element={<ProtectedRoute><EstEditarPaciente /></ProtectedRoute>} />
           
          <Route path="/sec_trocas" element={<ProtectedRoute><SecTrocas /></ProtectedRoute>} />
          <Route path="/sup_assumir_paciente" element={<ProtectedRoute><SupAssumirPaciente /></ProtectedRoute>} />
          <Route path="/est_assumir_paciente" element={<ProtectedRoute><EstAssumirPaciente /></ProtectedRoute>} />
          <Route path="/sec_adicionar_estagiario" element={<ProtectedRoute><SecAdicionarEstagiario /></ProtectedRoute>} />
          <Route path="/sec_adicionar_supervisor" element={<ProtectedRoute><SecAdicionarSupervisor /></ProtectedRoute>} />
          <Route path="/sec_ficha_paciente/:id_paciente" element={<ProtectedRoute><SecFichaPaciente /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;