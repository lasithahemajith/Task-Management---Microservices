import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('devtask_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function getTasks() {
  const { data } = await api.get('/tasks');
  return data;
}

export async function createTask(task) {
  const { data } = await api.post('/tasks', task);
  return data;
}

export async function updateTask(id, updates) {
  const { data } = await api.put(`/tasks/${id}`, updates);
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
}

export async function getNotifications() {
  const { data } = await api.get('/notifications');
  return data;
}
