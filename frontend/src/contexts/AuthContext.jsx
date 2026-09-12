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
// IMPORTANT: background/non-critical endpoints should use native fetch to avoid triggering this
const SKIP_LOGOUT_URLS = ['/auth/staff-assignments', '/auth/me'];
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Don't logout for background sync endpoints
      const url = error.config?.url || '';
      const isBackgroundSync = SKIP_LOGOUT_URLS.some(skip => url.includes(skip));
      if (!isBackgroundSync) {
        localStorage.removeItem('medzoo_token');
        localStorage.removeItem('medzoo_user');
        // Only redirect if not already on login/register
        if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [staffAssignments, setStaffAssignments] = useState([]);

  const refreshStaffAssignments = async () => {
    try {
      const token = localStorage.getItem('medzoo_token');
      if (!token) {
        setStaffAssignments([]);
        return [];
      }
      // Use native fetch to bypass global Axios 401 interceptor
      // so a staff-assignments error never triggers global logout
      const res = await fetch(`${API_BASE_URL}/auth/staff-assignments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        setStaffAssignments([]);
        return [];
      }
      const data = await res.json();
      const list = data.assignments || [];
      setStaffAssignments(list);
      return list;
    } catch (e) {
      setStaffAssignments([]);
      return [];
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem('medzoo_user');
    const token = localStorage.getItem('medzoo_token');
    if (stored && token) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      refreshStaffAssignments();

      // Sync fresh profile data from DB (preserve token from localStorage)
      axios.get(`${API_BASE_URL}/auth/me`)
        .then((res) => {
          if (res.data) {
            const merged = { ...parsedUser, ...res.data, token };
            localStorage.setItem('medzoo_user', JSON.stringify(merged));
            setUser(merged);
          }
        })
        .catch(() => {});
    }
    setLoading(false);
  }, []);

  const login = async (identifier, password) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { identifier, password });
    const data = res.data;
    localStorage.setItem('medzoo_token', data.token);
    localStorage.setItem('medzoo_user', JSON.stringify(data));
    setUser(data);
    await refreshStaffAssignments();
    return data;
  };

  const register = async (formData) => {
    const res = await axios.post(`${API_BASE_URL}/auth/register`, formData);
    const data = res.data;
    localStorage.setItem('medzoo_token', data.token);
    localStorage.setItem('medzoo_user', JSON.stringify(data));
    setUser(data);
    await refreshStaffAssignments();
    return data;
  };

  const loginWithGoogle = async (credential, role = 'patient') => {
    const res = await axios.post(`${API_BASE_URL}/auth/google`, { credential, role });
    const data = res.data;
    localStorage.setItem('medzoo_token', data.token);
    localStorage.setItem('medzoo_user', JSON.stringify(data));
    setUser(data);
    // Don't await — staff check must not block or break login
    refreshStaffAssignments();
    return data;
  };

  const logout = () => {
    localStorage.removeItem('medzoo_token');
    localStorage.removeItem('medzoo_user');
    setUser(null);
    setStaffAssignments([]);
  };

  const updateUser = (updatedData) => {
    setUser((prevUser) => {
      const updated = { ...prevUser, ...updatedData };
      localStorage.setItem('medzoo_user', JSON.stringify(updated));
      return updated;
    });
  };

  const isAuthenticated = !!user;
  const role = user?.role;
  const isClinicStaff = staffAssignments.length > 0;

  return (
    <AuthContext.Provider value={{
      user, loading, login, register, loginWithGoogle, logout, updateUser,
      isAuthenticated, role, staffAssignments, isClinicStaff, refreshStaffAssignments
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
