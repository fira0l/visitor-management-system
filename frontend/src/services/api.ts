import axios from "axios"
import type { User, VisitorRequest, Analytics, DepartmentStat } from "../types"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token")
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token")
      window.location.href = "/login"
    }
    return Promise.reject(error)
  },
)

export const authAPI = {
  login: async (username: string, password: string) => {
    const response = await api.post("/auth/login", { username, password })
    return response.data
  },

  getCurrentUser: async (): Promise<{ user: User }> => {
    const response = await api.get("/auth/me")
    return response.data
  },

  logout: async () => {
    const response = await api.post("/auth/logout")
    return response.data
  },

  register: async (userData: Partial<User>) => {
    const response = await api.post("/auth/register", userData)
    return response.data
  },
}

export const visitorAPI = {
  createRequest: async (requestData: Partial<VisitorRequest> | FormData) => {
    let config = {};
    if (requestData instanceof FormData) {
      config = { headers: { 'Content-Type': 'multipart/form-data' } };
    }
    const response = await api.post("/visitors/request", requestData, config);
    return response.data;
  },

  getRequests: async (params: any = {}) => {
    const response = await api.get("/visitors/requests", { params })
    return response.data
  },

  reviewRequest: async (id: string, reviewData: { status: string; reviewComments?: string }) => {
    const response = await api.patch(`/visitors/requests/${id}/review`, reviewData)
    return response.data
  },

  checkIn: async (id: string, checkInData: { actualItemsBrought?: string[]; notes?: string }) => {
    const response = await api.post(`/visitors/checkin/${id}`, checkInData)
    return response.data
  },

  checkOut: async (id: string, checkOutData: { notes?: string }) => {
    const response = await api.patch(`/visitors/checkout/${id}`, checkOutData)
    return response.data
  },

  getAnalytics: async (params: any = {}): Promise<{ analytics: Analytics; departmentStats: DepartmentStat[] }> => {
    const response = await api.get("/visitors/analytics", { params })
    return response.data
  },
}

export const userAPI = {
  getUsers: async () => {
    const response = await api.get("/users")
    return response.data
  },

  createUser: async (userData: Partial<User> & { password: string }) => {
    const response = await api.post("/users", userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.patch(`/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  updateUserStatus: async (id: string, isActive: boolean) => {
    const response = await api.patch(`/users/${id}/status`, { isActive })
    return response.data
  },
}

export default api 