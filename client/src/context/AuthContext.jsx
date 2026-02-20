import { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    console.log('🔍 AuthContext initialized');
    console.log('Token exists:', token ? 'YES' : 'NO');
    console.log('User exists:', savedUser ? 'YES' : 'NO');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
        console.log('✅ User authenticated from localStorage');
      } catch (error) {
        console.error('❌ Failed to parse user from localStorage:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  const login = async (credentials) => {
    try {
      console.log('🚀 Calling login API...');
      const response = await authService.login(credentials);
      const { token, user: userData } = response.data;

      console.log('🎯 Login API Success!');
      console.log('Token received:', token ? 'YES' : 'NO');
      console.log('User received:', userData ? 'YES' : 'NO');

      // Force synchronous write to localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Verify it was written
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      console.log('💾 Token saved:', savedToken ? 'YES ✅' : 'NO ❌');
      console.log('💾 User saved:', savedUser ? 'YES ✅' : 'NO ❌');
      
      // Update React state
      setUser(userData);
      console.log('✅ State updated');

      // Return success
      return { success: true };
    } catch (error) {
      console.error('❌ Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const logout = () => {
    console.log('👋 Logging out...');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    window.location.href = '/';
  };

  const value = {
    user,
    login,
    logout,
    loading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};