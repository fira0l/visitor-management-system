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

  // Bulk upload methods
  uploadPDF: async (file: File) => {
    const formData = new FormData();
    formData.append("pdf", file);
    const response = await api.post("/bulk-upload/upload", formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return response.data;
  },

  processPDF: async (id: string) => {
    const response = await api.post(`/bulk-upload/process/${id}`);
    return response.data;
  },

  importVisitors: async (id: string, selectedRows?: number[]) => {
    const response = await api.post(`/bulk-upload/import/${id}`, { selectedRows });
    return response.data;
  },

  getBulkUploads: async () => {
    const response = await api.get("/bulk-upload/uploads");
    return response.data;
  },

  getBulkUploadById: async (id: string) => {
    const response = await api.get(`/bulk-upload/uploads/${id}`);
    return response.data;
  },

  getUploadPermissions: async () => {
    const response = await api.get("/bulk-upload/permissions");
    return response.data;
  },

  updateUploadPermission: async (departmentType: string, permissionData: any) => {
    const response = await api.patch(`/bulk-upload/permissions/${departmentType}`, permissionData);
    return response.data;
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

  approveUser: async (id: string) => {
    const res = await api.patch(`/users/${id}/approve`);
    return res.data;
  },
}

export const delegationAPI = {
  requestDelegation: async (delegationData: DelegationRequest) => {
    const response = await api.post("/delegations/request", delegationData);
    return response.data;
  },

  getDelegations: async (params: { status?: string; type?: string } = {}) => {
    const response = await api.get("/delegations", { params });
    return response.data;
  },

  reviewDelegation: async (delegationId: string, reviewData: DelegationReview) => {
    const response = await api.patch(`/delegations/${delegationId}/review`, reviewData);
    return response.data;
  },

  activateDelegation: async (delegationId: string) => {
    const response = await api.patch(`/delegations/${delegationId}/activate`);
    return response.data;
  },

  cancelDelegation: async (delegationId: string) => {
    const response = await api.patch(`/delegations/${delegationId}/cancel`);
    return response.data;
  },

  getActiveDelegations: async () => {
    const response = await api.get("/delegations/active");
    return response.data;
  },
}

// Visitor Requests
export const getVisitorRequests = (params?: any) =>
  api.get("/visitors/requests", { params })

export const getVisitorRequest = (id: string) =>
  api.get(`/visitors/requests/${id}`)

export const createVisitorRequest = (data: FormData) =>
  api.post("/visitors/request", data, {
    headers: { "Content-Type": "multipart/form-data" },
  })

export const updateVisitorRequest = (id: string, data: FormData) =>
  api.patch(`/visitors/requests/${id}`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  })

export const deleteVisitorRequest = (id: string) =>
  api.delete(`/visitors/requests/${id}`)

// New history and reuse functionality
export const getVisitorHistory = (params: { visitorId?: string; nationalId?: string; visitorName?: string }) =>
  api.get("/visitors/history", { params })

export const reuseVisitorData = (originalRequestId: string, data: {
  scheduledDate?: string
  scheduledTime?: string
  purpose?: string
  itemsBrought?: string
}) =>
  api.post(`/visitors/requests/${originalRequestId}/reuse`, data)

export default api 