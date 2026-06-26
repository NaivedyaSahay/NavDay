import axios from 'axios';
import type { Habit } from './types';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const API_URL = `${BASE_URL}/habits`;

// Interceptor to attach JWT token
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('navday_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const signup = async (name: string, email: string, password: string) => {
  const response = await axios.post(`${BASE_URL}/auth/signup`, { name, email, password });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await axios.post(`${BASE_URL}/auth/login`, { email, password });
  return response.data;
};

export const fetchHabits = async (): Promise<Habit[]> => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createHabit = async (title: string, color: string): Promise<Habit> => {
  const response = await axios.post(API_URL, { title, color });
  return response.data;
};

export const deleteHabit = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`);
};

export const updateLogStatus = async (id: string, date: string, status: 'completed' | 'skipped' | 'none'): Promise<Habit> => {
  const response = await axios.put(`${API_URL}/${id}/logs`, { date, status });
  return response.data;
};
