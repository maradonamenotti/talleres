import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
});

// Interceptor para agregar el token JWT a todas las peticiones
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Interceptor para manejar errores globales (ej. token expirado)
api.interceptors.response.use((response) => response, (error) => {
  if (error.response && error.response.status === 401) {
    // Si da 401 No autorizado, borramos el token y recargamos para forzar login
    localStorage.removeItem('token');
    window.location.href = '/';
  }
  return Promise.reject(error);
});

export default api;
