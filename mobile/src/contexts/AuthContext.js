import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const AuthContext = createContext({
  user: null,
  role: null,
  isAuthenticated: false,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  updateUser: () => {}
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('medzoo_mobile_user');
      const token = await AsyncStorage.getItem('medzoo_mobile_token');
      if (storedUser && token) {
        // Fast optimistic restore
        const parsed = JSON.parse(storedUser);
        setUser(parsed);

        // Verify token with backend
        try {
          const res = await api.get('/auth/me');
          if (res.data) {
            const freshUser = { ...parsed, ...res.data, token };
            await AsyncStorage.setItem('medzoo_mobile_user', JSON.stringify(freshUser));
            setUser(freshUser);
          }
        } catch (authErr) {
          if (authErr.response?.status === 401) {
            await AsyncStorage.multiRemove(['medzoo_mobile_token', 'medzoo_mobile_user']);
            setUser(null);
          }
        }
      }
    } catch (err) {
      console.error('Error loading stored user:', err);
    } finally {
      setLoading(false);
    }
  };

  const login = async (identifier, password) => {
    const res = await api.post('/auth/login', { identifier, password });
    const data = res.data;
    await AsyncStorage.setItem('medzoo_mobile_token', data.token);
    await AsyncStorage.setItem('medzoo_mobile_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    const data = res.data;
    await AsyncStorage.setItem('medzoo_mobile_token', data.token);
    await AsyncStorage.setItem('medzoo_mobile_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = async () => {
    await AsyncStorage.multiRemove(['medzoo_mobile_token', 'medzoo_mobile_user']);
    setUser(null);
  };

  const updateProfile = async (profileData) => {
    const res = await api.put('/auth/profile', profileData);
    const updatedData = res.data;
    const token = await AsyncStorage.getItem('medzoo_mobile_token');
    const fullUser = { ...user, ...updatedData, token: token || user?.token };
    await AsyncStorage.setItem('medzoo_mobile_user', JSON.stringify(fullUser));
    setUser(fullUser);
    return fullUser;
  };

  const updateUser = async (updatedData) => {
    const updated = { ...user, ...updatedData };
    await AsyncStorage.setItem('medzoo_mobile_user', JSON.stringify(updated));
    setUser(updated);
  };

  const isAuthenticated = !!user;
  const role = user?.role;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated,
        loading,
        login,
        register,
        logout,
        updateProfile,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
