import axios from "axios"

const API_BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle token expiration
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

  getCurrentUser: async () => {
    const response = await api.get("/auth/me")
    return response.data
  },

  logout: async () => {
    const response = await api.post("/auth/logout")
    return response.data
  },
}

export const visitorAPI = {
  createRequest: async (requestData: any) => {
    const response = await api.post("/visitors/request", requestData)
    return response.data
  },

  getRequests: async (params: any = {}) => {
    const response = await api.get("/visitors/requests", { params })
    return response.data
  },

  reviewRequest: async (id: string, reviewData: any) => {
    const response = await api.patch(`/visitors/requests/${id}/review`, reviewData)
    return response.data
  },

  checkIn: async (id: string, checkInData: any) => {
    const response = await api.post(`/visitors/checkin/${id}`, checkInData)
    return response.data
  },

  checkOut: async (id: string, checkOutData: any) => {
    const response = await api.patch(`/visitors/checkout/${id}`, checkOutData)
    return response.data
  },

  getAnalytics: async (params: any = {}) => {
    const response = await api.get("/visitors/analytics", { params })
    return response.data
  },
}

export default api
