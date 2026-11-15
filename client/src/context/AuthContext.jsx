import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [admin, setAdmin] = useState(() => {
    const saved = localStorage.getItem('admin');
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (newToken, adminData) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('admin', JSON.stringify(adminData));
    setToken(newToken);
    setAdmin(adminData);
  };

  const logout = () => {
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