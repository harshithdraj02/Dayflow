import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('dayflow_token');
    const savedUser = localStorage.getItem('dayflow_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const data = await api.login({ email, password });
    localStorage.setItem('dayflow_token', data.token);
    localStorage.setItem('dayflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const registerCompany = async (formData) => {
    const response = await fetch('/api/auth/register-company', {
      method: 'POST',
      body: formData
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Company registration failed');
    }
    localStorage.setItem('dayflow_token', data.token);
    localStorage.setItem('dayflow_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem('dayflow_token');
    localStorage.removeItem('dayflow_user');
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const userData = await api.getMe();
      localStorage.setItem('dayflow_user', JSON.stringify(userData));
      setUser(userData);
    } catch { /* ignore */ }
  };

  return (
    <AuthContext.Provider value={{ user, login, registerCompany, logout, loading, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
