import axios from 'axios';

const API_URL = '/api';

// Create axios instance
const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error.response?.data || error);
  }
);

// Auth APIs
export const signup = async (userData) => {
  const { data } = await api.post('/auth/signup', userData);
  return data;
};

export const login = async (email, password) => {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
};

export const getMe = async () => {
  const { data } = await api.get('/auth/me');
  return data;
};

// Incident APIs
export const createIncident = async (formData) => {
  const { data } = await api.post('/incidents', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};

export const getIncidents = async (params = {}) => {
  const { data } = await api.get("/incidents", { params });
  return data;
};

export const getIncident = async (id) => {
  const { data } = await api.get(`/incidents/${id}`);
  return data;
};

export const updateIncidentStatus = async (id, statusData) => {
  const { data } = await api.patch(`/incidents/${id}/status`, statusData);
  return data;
};

export const uploadResolutionPhotos = async (id, formData) => {
  const { data } = await api.post(`/incidents/${id}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
};



export default api;