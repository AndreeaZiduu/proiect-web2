import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
const SESSION_ENTERED_KEY = 'p10_session_entered';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [hasEnteredApp, setHasEnteredApp] = useState(() => {
    try {
      return sessionStorage.getItem(SESSION_ENTERED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const role = user?.role || 'ANON';

  const markSessionEntered = () => {
    try {
      sessionStorage.setItem(SESSION_ENTERED_KEY, 'true');
    } catch {
      // Ignore storage restriction errors
    }
    setHasEnteredApp(true);
  };

  const login = async (email, password) => {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    markSessionEntered();
    return data;
  };

  const register = async (email, password, name) => {
    const data = await api.register(email, password, name);
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    markSessionEntered();
    return data;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const continueAsVisitor = () => {
    logout();
    markSessionEntered();
  };

  const returnToWelcomeScreen = () => {
    logout();
    try {
      sessionStorage.removeItem(SESSION_ENTERED_KEY);
    } catch {
      // Ignore storage restriction errors
    }
    setHasEnteredApp(false);
  };

  const switchRole = async (targetRole) => {
    if (targetRole === 'ANON') {
      continueAsVisitor();
      return;
    }

    const credentials = {
      USER: { email: 'user@sibiu.ro', password: 'Parola123!', name: 'Utilizator Test' },
      MODERATOR: { email: 'moderator@sibiu.ro', password: 'Parola123!', name: 'Moderator Sibiu' },
      ADMIN: { email: 'admin@sibiu.ro', password: 'Parola123!', name: 'Admin Sibiu' }
    };

    const cred = credentials[targetRole];
    if (!cred) return;

    try {
      await login(cred.email, cred.password);
    } catch {
      // In case password was admin123 or database is seeding, fallback to second password or local mock
      try {
        if (targetRole === 'ADMIN') {
          await login('admin@sibiu.ro', 'admin123');
          return;
        }
      } catch {
        // Fallback for offline demo mode
      }
      const mockUser = { id: `demo-${targetRole.toLowerCase()}`, email: cred.email, name: cred.name, role: targetRole };
      const mockToken = `demo-token-${targetRole.toLowerCase()}`;
      setToken(mockToken);
      setUser(mockUser);
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      markSessionEntered();
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role,
        hasEnteredApp,
        isAnon: role === 'ANON',
        isUser: role === 'USER' || role === 'MODERATOR' || role === 'ADMIN',
        isModerator: role === 'MODERATOR' || role === 'ADMIN',
        isAdmin: role === 'ADMIN',
        login,
        register,
        logout,
        switchRole,
        continueAsVisitor,
        returnToWelcomeScreen
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
