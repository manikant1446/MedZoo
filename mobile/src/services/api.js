import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from AsyncStorage to all requests
api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('medzoo_mobile_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    console.error('Error fetching token from storage:', err);
  }
  return config;
});

// Handle 401 response
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.multiRemove(['medzoo_mobile_token', 'medzoo_mobile_user']);
    }
    return Promise.reject(error);
  }
);

export default api;
