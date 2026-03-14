import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('devtask_token'));

  useEffect(() => {
    const stored = localStorage.getItem('devtask_user');
    if (stored) {
      try { setUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
  }, []);

  function login(tokenValue, userData) {
    setToken(tokenValue);
    setUser(userData);
    localStorage.setItem('devtask_token', tokenValue);
    localStorage.setItem('devtask_user', JSON.stringify(userData));
  }

  function logout() {
    setToken(null);
    setUser(null);
    localStorage.removeItem('devtask_token');
    localStorage.removeItem('devtask_user');
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
