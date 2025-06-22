import IndexSupervisor from './Index_Supervisor';
import IndexEstagiario from './Index_Estagiario';
import IndexSecretaria from './Index_Secretaria';
import IndexCoordenador from './Index_Coordenador';
import Header from './Header';
import { useContext } from 'react';
import { AuthContext } from './AuthContext';
import { Navigate } from 'react-router-dom';

export default function Index() {
  const { user } = useContext(AuthContext);
    console.log('user:', user);
  // Enquanto o contexto está carregando (user indefinido), pode mostrar um loading
  if (user === undefined) {
    return <div>Carregando...</div>;
  }

  if (!user) {
    // Se não estiver logado, redirecione para login
    return <Navigate to="/login" />;
  }

  if (user.cargo == 1) return (
    <>
      <Header user={user} />
      <div className="container mx-auto py-6">
        <IndexSupervisor />
      </div>
    </>
  );
  if (user.cargo == 2) return (
    <>
      <Header user={user} />
      <div className="container mx-auto py-6">
        <IndexEstagiario />
      </div>
    </>
  );
  if (user.cargo == 0) return (
    <>
      <Header user={user} />
      <div className="container mx-auto py-6">
        <IndexSecretaria />
      </div>
    </>
  );
  if (user.cargo == 3) return (
    <>
      <Header user={user} />
      <div className="container mx-auto py-6">
        <IndexCoordenador />
      </div>
    </>
  );

  // Caso o cargo não seja reconhecido
  return <div>Cargo não reconhecido.</div>;
}