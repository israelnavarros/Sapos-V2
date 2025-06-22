import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './Login';
import Index from './Index';
import MeuPerfil from './MeuPerfil';
import { AuthProvider } from './AuthContext';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/meuperfil" element={<MeuPerfil />} />
          <Route path="/" element={<Index />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;