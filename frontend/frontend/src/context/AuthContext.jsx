import React, { createContext, useState, useContext, useEffect } from 'react';
import { toast } from 'react-toastify';

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
    // Check if user is logged in on initial load
    const userInfo = JSON.parse(localStorage.getItem('userInfo') || 'null');
    if (userInfo && userInfo.token) {
      setUser(userInfo);
    }
    setLoading(false);
  }, []);

  const login = (userData) => {
    localStorage.setItem('userInfo', JSON.stringify(userData));
    setUser(userData);
    toast.success('Login successful!');
  };

  const logout = () => {
    localStorage.removeItem('userInfo');
    localStorage.removeItem('cartItems');
    setUser(null);
    toast.info('Logged out successfully');
    
    // Dispatch cart update event
    window.dispatchEvent(new Event('cartUpdated'));
  };

  const updateUser = (updatedUserData) => {
    const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
    const newUserData = { ...currentUser, ...updatedUserData };
    localStorage.setItem('userInfo', JSON.stringify(newUserData));
    setUser(newUserData);
  };

  const isAuthenticated = () => {
    return !!user;
  };

  const isAdmin = () => {
    return user?.role === 'admin';
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        updateUser,
        isAuthenticated,
        isAdmin
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};