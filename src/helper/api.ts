import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from '@env';
import { authStore } from '../store/authStore';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(API_TIMEOUT) || 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use(
  config => {
    const token = authStore.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error),
);

api.interceptors.response.use(
  response => response.data,
  error => {
    const message =
      error.response?.data?.message ||
      error.message ||
      'Terjadi kesalahan';

    return Promise.reject({ message, status: error.response?.status });
  },
);

export default api;