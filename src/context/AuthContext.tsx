import React, {createContext, useContext, useState, useEffect} from 'react';
import {authStore} from '../store/authStore';

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, user: object) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsAuthenticated(authStore.isLoggedIn());
    setIsLoading(false);
  }, []);

  const login = (token: string, user: object) => {
    authStore.setToken(token);
    authStore.setUser(user);
    setIsAuthenticated(true);
  };

  const logout = () => {
    authStore.clear();
    setIsAuthenticated(false); 
  };

  return (
    <AuthContext.Provider value={{isAuthenticated, isLoading, login, logout}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);