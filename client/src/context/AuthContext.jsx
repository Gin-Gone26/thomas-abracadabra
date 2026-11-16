import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('abracadabra_admin_token'));
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('abracadabra_admin_user');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (newToken, adminData) => {
    localStorage.setItem('abracadabra_admin_token', newToken);
    localStorage.setItem('abracadabra_admin_user', JSON.stringify(adminData));
    setToken(newToken);
    setAdmin(adminData);
  };

  const logout = () => {
    localStorage.removeItem('abracadabra_admin_token');
    localStorage.removeItem('abracadabra_admin_user');
    localStorage.removeItem('token');
    localStorage.removeItem('admin');
    setToken(null);
    setAdmin(null);
  };

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider value={{ admin, token, isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);