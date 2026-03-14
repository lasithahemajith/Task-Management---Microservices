import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: API_BASE });

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devtask_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function register(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function getProfile() {
  const { data } = await api.get('/auth/profile');
  return data;
}
