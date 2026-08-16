import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../services/api.ts';
import { useToast } from '../components/Toast.tsx';

interface AuthContextType {
  isAdmin: boolean;
  token: string | null;
  username: string | null;
  isLoading: boolean;
  isLoginModalOpen: boolean;
  openLoginModal: () => void;
  closeLoginModal: () => void;
  login: (password: string, username?: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'mabs_admin_token';
const USER_KEY = 'mabs_admin_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_KEY));
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY));
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState<boolean>(false);
  const { showToast } = useToast();

  const verifyCurrentToken = useCallback(async (tokenToVerify: string) => {
    try {
      const isValid = await api.verifyAdminToken(tokenToVerify);
      if (isValid) {
        setIsAdmin(true);
      } else {
        setIsAdmin(false);
        setToken(null);
        setUsername(null);
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        sessionStorage.removeItem(TOKEN_KEY);
        sessionStorage.removeItem(USER_KEY);
      }
    } catch {
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) {
      verifyCurrentToken(token);
    } else {
      setIsLoading(false);
    }
  }, [token, verifyCurrentToken]);

  const login = async (password: string, uname = 'admin'): Promise<boolean> => {
    try {
      setIsLoading(true);
      const res = await api.adminLogin(password, uname);
      if (res.token) {
        setToken(res.token);
        setUsername(res.username || uname);
        setIsAdmin(true);
        localStorage.setItem(TOKEN_KEY, res.token);
        localStorage.setItem(USER_KEY, res.username || uname);
        setIsLoginModalOpen(false);
        showToast({
          type: 'success',
          title: 'Welcome Back, Admin!',
          description: 'You now have full privileges to manage apps, categories, and releases.',
        });
        return true;
      }
      return false;
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Authentication Failed',
        description: err.message || 'Incorrect admin password.',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUsername(null);
    setIsAdmin(false);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    showToast({
      type: 'info',
      title: 'Logged Out',
      description: 'You have switched to visitor read-only mode.',
    });
  };

  const openLoginModal = () => setIsLoginModalOpen(true);
  const closeLoginModal = () => setIsLoginModalOpen(false);

  return (
    <AuthContext.Provider
      value={{
        isAdmin,
        token,
        username,
        isLoading,
        isLoginModalOpen,
        openLoginModal,
        closeLoginModal,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
