import { createContext, useContext, useState, useEffect } from 'react';
import { getMe, login as loginApi } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const response = await getMe();
          if (isMounted) {
            const userData = {
              ...response.data,
              mustChangePassword: response.data.mustChangePassword || false,
            };
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
          }
        } catch (error) {
          if (isMounted) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    // Cleanup function to prevent memory leaks
    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    try {
      const response = await loginApi({ email, password });
      const { token, mustChangePassword, ...userData } = response.data;
      const userWithPasswordFlag = { ...userData, mustChangePassword: mustChangePassword || false };
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userWithPasswordFlag));
      setUser(userWithPasswordFlag);
      
      if (mustChangePassword) {
        toast.info('Please set a new password to continue');
        return { success: true, mustChangePassword: true };
      }
      
      toast.success('Logged in successfully');
      return { success: true, mustChangePassword: false };
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
      return { success: false, error: error.response?.data?.message };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await getMe();
      setUser(response.data);
      localStorage.setItem('user', JSON.stringify(response.data));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.error('Failed to refresh user:', error);
      }
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

