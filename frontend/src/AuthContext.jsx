import { createContext, useState } from 'react';
import API_URL from './config'; // Importa a URL centralizada

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  // Função de logout
  const logout = async () => {
    await fetch(`${API_URL}/api/logout`, { 
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}