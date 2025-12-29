import axios from 'axios';


const envUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
// Ensure the base URL ends with /api, handling potential trailing slashes
const baseURL = envUrl.replace(/\/$/, '').endsWith('/api')
  ? envUrl
  : `${envUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;