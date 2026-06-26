import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const defaultAuth = {
  user: null, loading: true, login: async () => {}, register: async () => {},
  logout: () => {}, updateUser: () => {}, isAuthenticated: false, role: null
};
const AuthContext = createContext(defaultAuth);

// Axios interceptor: always attach token from localStorage on every request
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('medzoo_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Axios interceptor: handle 401 responses globally (auto-logout)
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('medzoo_token');
      localStorage.removeItem('medzoo_user');
      // Only redirect if not already on login/register
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('medzoo_user');
    const token = localStorage.getItem('medzoo_token');
    if (stored && token) {
      setUser(JSON.parse(stored));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    const data = res.data;
    localStorage.setItem('medzoo_token', data.token);
    localStorage.setItem('medzoo_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const register = async (formData) => {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, formData);
    const data = res.data;
    localStorage.setItem('medzoo_token', data.token);
    localStorage.setItem('medzoo_user', JSON.stringify(data));
    setUser(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('medzoo_token');
    localStorage.removeItem('medzoo_user');
    setUser(null);
  };

  const updateUser = (updatedData) => {
    const updated = { ...user, ...updatedData };
    localStorage.setItem('medzoo_user', JSON.stringify(updated));
    setUser(updated);
  };

  const isAuthenticated = !!user;
  const role = user?.role;

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser, isAuthenticated, role }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
