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
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== "/login") {
        localStorage.removeItem("token")
        // Use a more graceful redirect
        setTimeout(() => {
          window.location.href = "/login"
        }, 100)
      }
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

  // Division head approval functions
  approveRequest: async (id: string, approvalData: { approvalType: string; approvalComments?: string }) => {
    const response = await api.patch(`/visitors/requests/${id}/approve`, approvalData)
    return response.data
  },

  divisionApproval: async (id: string, approvalData: { status: string; approvalComments: string }) => {
    const response = await api.patch(`/visitors/requests/${id}/division-approval`, approvalData)
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

  // Visitor history and reuse functionality
  getVisitorHistory: async (params: { visitorId?: string; nationalId?: string; visitorName?: string }) => {
    const response = await api.get("/visitors/history", { params })
    return response
  },

  reuseVisitorData: async (originalRequestId: string, data: {
    scheduledDate?: string
    scheduledTime?: string
    purpose?: string
    itemsBrought?: string
  }) => {
    const response = await api.post(`/visitors/requests/${originalRequestId}/reuse`, data)
    return response
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

  getBulkUploads: async (params: any = {}) => {
    const response = await api.get("/bulk-upload", { params });
    return response.data;
  },

  importVisitors: async (id: string, rowNumber: number) => {
    const response = await api.post(`/bulk-upload/import/${id}`, { rowNumber });
    return response.data;
  },
}

export const userAPI = {
  getUsers: async (params: any = {}) => {
    const response = await api.get("/users", { params })
    return response.data
  },

  createUser: async (userData: Partial<User>) => {
    const response = await api.post("/users", userData)
    return response.data
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.patch(`/users/${id}`, userData)
    return response.data
  },

  deleteUser: async (id: string) => {
    const response = await api.delete(`/users/${id}`)
    return response.data
  },

  approveUser: async (id: string) => {
    const response = await api.patch(`/users/${id}/approve`)
    return response.data
  },

  deactivateUser: async (id: string) => {
    const response = await api.patch(`/users/${id}/deactivate`)
    return response.data
  },
}

export const delegationAPI = {
  getDelegations: async (params: any = {}) => {
    const response = await api.get("/delegations", { params })
    return response.data
  },

  createDelegation: async (delegationData: any) => {
    const response = await api.post("/delegations", delegationData)
    return response.data
  },

  updateDelegation: async (id: string, delegationData: any) => {
    const response = await api.patch(`/delegations/${id}`, delegationData)
    return response.data
  },

  deleteDelegation: async (id: string) => {
    const response = await api.delete(`/delegations/${id}`)
    return response.data
  },

  acceptDelegation: async (id: string) => {
    const response = await api.patch(`/delegations/${id}/accept`)
    return response.data
  },

  rejectDelegation: async (id: string, reason: string) => {
    const response = await api.patch(`/delegations/${id}/reject`, { reason })
    return response.data
  },
}

export const auditLogAPI = {
  getAuditLogs: async (params: any = {}) => {
    const response = await api.get("/audit-logs", { params })
    return response.data
  },

  exportAuditLogs: async (params: any = {}) => {
    const response = await api.get("/audit-logs/export", { 
      params,
      responseType: 'blob'
    })
    return response.data
  },
}

// Export default api for backward compatibility
export default api 