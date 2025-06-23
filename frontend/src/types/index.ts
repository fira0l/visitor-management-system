export interface User {
  _id: string
  username: string
  email: string
  role: "admin" | "department_user" | "security" | "gate"
  department?: string
  fullName: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
}

export interface VisitorRequest {
  _id: string
  visitorName: string
  visitorId: string
  nationalId: string
  visitorPhone: string
  visitorEmail?: string
  photo?: string
  purpose: string
  itemsBrought: string[]
  department: string
  requestedBy: {
    _id: string
    fullName: string
    username: string
    department?: string
  }
  visitDuration: {
    hours: number
    days: number
  }
  scheduledDate: string
  scheduledTime: string
  status: "pending" | "approved" | "declined" | "checked_in" | "checked_out" | "expired"
  reviewedBy?: {
    _id: string
    fullName: string
    username: string
  }
  reviewedAt?: string
  reviewComments?: string
  approvalCode?: string
  priority: "low" | "medium" | "high"
  createdAt: string
  updatedAt: string
}

export interface CheckInOut {
  _id: string
  visitorRequest: VisitorRequest
  checkInTime: string
  checkOutTime?: string
  checkInBy: {
    _id: string
    fullName: string
    username: string
  }
  checkOutBy?: {
    _id: string
    fullName: string
    username: string
  }
  actualItemsBrought: string[]
  checkInNotes?: string
  checkOutNotes?: string
  duration?: number
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface Analytics {
  totalRequests: number
  approvedRequests: number
  declinedRequests: number
  pendingRequests: number
  checkedInRequests: number
  checkedOutRequests: number
}

export interface DepartmentStat {
  _id: string
  count: number
  approved: number
  declined: number
  pending: number
  checkedIn: number
  checkedOut: number
}

export interface ApiResponse<T> {
  success: boolean
  message?: string
  data?: T
}

export interface PaginatedResponse<T> {
  success: boolean
  data: T[]
  totalPages: number
  currentPage: number
  total: number
}
