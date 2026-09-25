 
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Auto-attach JWT token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;

// Auth
export const register = (data: any) => api.post('/auth/register', data);
export const login = (data: any) => api.post('/auth/login', data);

// Rides
export const requestRide = (data: any) => api.post('/rides/request', data);
export const getMyRides = () => api.get('/rides/my-rides');
export const cancelRide = (id: string) => api.patch(`/rides/${id}/cancel`);

// Driver
export const getPendingRides = () => api.get('/rides/driver/pending');
export const getDriverRides = () => api.get('/rides/driver/my-rides');
export const acceptRide = (id: string) => api.patch(`/rides/${id}/accept`);
export const updateRideStatus = (id: string, status: string) =>
  api.patch(`/rides/${id}/status`, { status });

// Vehicles
export const createVehicle = (data: any) => api.post('/vehicles', data);
export const getMyVehicle = () => api.get('/vehicles/my-vehicle');
export const toggleOnline = () => api.patch('/vehicles/toggle-online'); 
