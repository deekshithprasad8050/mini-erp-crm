import axios from 'axios';
import {
  ApiResponse,
  PaginatedResponse,
  User,
  Customer,
  CustomerFollowUp,
  Product,
  StockMovement,
  SalesChallan,
  DashboardStats
} from '../types';

const axiosInstance = axios.create({
  baseURL: '/api',
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  auth: {
    login: async (credentials: { email: string; password: string }) => {
      const response = await axiosInstance.post('/auth', credentials);
      return response.data.data; // unwrap { success, data: { token, user } }
    },
    getMe: async () => {
      const response = await axiosInstance.get('/auth/me');
      return response.data.data; // unwrap { success, data: user }
    },
  },
  customers: {
    list: async (params?: Record<string, any>) => {
      const response = await axiosInstance.get<PaginatedResponse<Customer>>('/customers', { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<ApiResponse<Customer>>(`/customers/${id}`);
      return response.data;
    },
    create: async (data: Partial<Customer>) => {
      const response = await axiosInstance.post<ApiResponse<Customer>>('/customers', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Customer>) => {
      const response = await axiosInstance.put<ApiResponse<Customer>>(`/customers/${id}`, data);
      return response.data;
    },
    delete: async (id: string) => {
      const response = await axiosInstance.delete<ApiResponse<null>>(`/customers/${id}`);
      return response.data;
    },
    getFollowUps: async (id: string, params?: Record<string, any>) => {
      const response = await axiosInstance.get<ApiResponse<CustomerFollowUp[]>>(`/customers/${id}/followups`, { params });
      return response.data;
    },
    createFollowUp: async (id: string, data: { note: string; followUpDate?: string }) => {
      const response = await axiosInstance.post<ApiResponse<CustomerFollowUp>>(`/customers/${id}/followups`, data);
      return response.data;
    },
  },
  products: {
    list: async (params?: Record<string, any>) => {
      const response = await axiosInstance.get<PaginatedResponse<Product>>('/products', { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<ApiResponse<Product>>(`/products/${id}`);
      return response.data;
    },
    create: async (data: Partial<Product>) => {
      const response = await axiosInstance.post<ApiResponse<Product>>('/products', data);
      return response.data;
    },
    update: async (id: string, data: Partial<Product>) => {
      const response = await axiosInstance.put<ApiResponse<Product>>(`/products/${id}`, data);
      return response.data;
    },
    addStockMovement: async (id: string, data: { movementType: string; quantityChanged: number; reason: string }) => {
      const response = await axiosInstance.post<ApiResponse<StockMovement>>(`/products/${id}/stock`, data);
      return response.data;
    },
    getStockMovements: async (id: string, params?: Record<string, any>) => {
      const response = await axiosInstance.get<PaginatedResponse<StockMovement>>(`/products/${id}/stock-movements`, { params });
      return response.data;
    },
  },
  challans: {
    list: async (params?: Record<string, any>) => {
      const response = await axiosInstance.get<PaginatedResponse<SalesChallan>>('/challans', { params });
      return response.data;
    },
    getById: async (id: string) => {
      const response = await axiosInstance.get<ApiResponse<SalesChallan>>(`/challans/${id}`);
      return response.data;
    },
    create: async (data: any) => {
      const response = await axiosInstance.post<ApiResponse<SalesChallan>>('/challans', data);
      return response.data;
    },
    update: async (id: string, data: any) => {
      const response = await axiosInstance.put<ApiResponse<SalesChallan>>(`/challans/${id}`, data);
      return response.data;
    },
    confirm: async (id: string) => {
      const response = await axiosInstance.post<ApiResponse<SalesChallan>>(`/challans/${id}/confirm`);
      return response.data;
    },
    cancel: async (id: string) => {
      const response = await axiosInstance.post<ApiResponse<SalesChallan>>(`/challans/${id}/cancel`);
      return response.data;
    },
  },
  dashboard: {
    getStats: async () => {
      const response = await axiosInstance.get<ApiResponse<DashboardStats>>('/dashboard/stats');
      return response.data;
    },
  },
};
