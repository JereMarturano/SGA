import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5035/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
