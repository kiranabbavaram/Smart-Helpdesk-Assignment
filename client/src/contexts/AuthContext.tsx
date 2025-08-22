import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { api } from '../lib/api';
import { useToast } from '../components/Toaster';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'user' | 'agent' | 'admin';
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { show } = useToast();

  useEffect(() => {
    // Verify session via cookie-based auth
    api.get('/auth/me')
      .then(response => {
        setUser(response.data.user);
        if (import.meta.env.DEV) {
          console.log('User authenticated:', response.data.user.email);
        }
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.log('Auth check failed:', error.response?.status);
        }
        
        if (error.response?.status === 401) {
          // Try to refresh the token
          api.post('/auth/refresh')
            .then(() => {
              // Retry the auth check
              return api.get('/auth/me');
            })
            .then(response => {
              setUser(response.data.user);
              if (import.meta.env.DEV) {
                console.log('User authenticated after refresh:', response.data.user.email);
              }
            })
            .catch((refreshError) => {
              if (import.meta.env.DEV) {
                console.log('Token refresh failed:', refreshError.response?.status);
              }
              setUser(null);
            });
        } else {
          setUser(null);
        }
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { user } = response.data;
      setUser(user);
      show('Signed in', 'success');
    } catch (error) {
      show('Login failed', 'error');
      throw error;
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const response = await api.post('/auth/register', { name, email, password });
      const { user } = response.data;
      setUser(user);
      show('Account created', 'success');
    } catch (error) {
      show('Registration failed', 'error');
      throw error;
    }
  };

  const logout = () => {
    api.post('/auth/logout').finally(() => {
      setUser(null);
      show('Signed out');
    });
  };

  const value: AuthContextType = {
    user,
    loading,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
