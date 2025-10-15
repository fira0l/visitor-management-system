export interface User {
  _id: string
  employeeId: string
  username: string
  email: string
  role: "admin" | "department_user" | "security" | "gate"
  department?: string
  fullName: string
  isActive: boolean
  lastLogin?: string
  createdAt: string
  updatedAt: string
  location: "Wollo Sefer" | "Operation"
  departmentType?: "wing" | "director" | "division"
  delegatedBy?: User
  delegatedTo?: User
  delegationReason?: string
  delegationStartDate?: string
  delegationEndDate?: string
  isDelegated: boolean
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
  location: "Wollo Sefer" | "Operation"
  isGroupVisit: boolean
  companyName?: string
  groupSize?: number
  originDepartment?: string
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
  location: "Wollo Sefer" | "Operation"
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

export interface BulkUploadPermission {
  _id: string
  departmentType: "wing" | "director" | "division"
  canUpload: boolean
  allowedTimeWindows: {
    startTime: string
    endTime: string
    daysOfWeek: string[]
  }[]
  maxFileSize: number
  allowedFileTypes: string[]
  createdBy: {
    _id: string
    fullName: string
    username: string
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface BulkUpload {
  _id: string
  fileName: string
  filePath: string
  fileSize: number
  uploadedBy: {
    _id: string
    fullName: string
    username: string
  }
  departmentType: "wing" | "director" | "division"
  location: "Wollo Sefer" | "Operation"
  status: "uploaded" | "processing" | "completed" | "failed"
  processingResult: {
    totalVisitors: number
    successfulImports: number
    failedImports: number
    errors: {
      row: number
      message: string
      data: any
    }[]
  }
  extractedData: {
    visitorName: string
    visitorId: string
    nationalId: string
    visitorPhone: string
    visitorEmail: string
    purpose: string
    department: string
    scheduledDate: string
    scheduledTime: string
    companyName: string
    groupSize: number
    originDepartment: string
    gateAssignment: string
    accessType: string
    rowNumber: number
    status: "pending" | "imported" | "failed"
    errorMessage: string
  }[]
  processingStartedAt?: string
  processingCompletedAt?: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface VisitorHistory {
  _id: string
  visitorName: string
  visitorId: string
  nationalId: string
  visitorPhone: string
  visitorEmail: string
  purpose: string
  department: string
  location: string
  isGroupVisit: boolean
  companyName?: string
  groupSize?: number
  originDepartment?: string
  scheduledDate: string
  scheduledTime: string
  status: string
  approvalCode?: string
  requestedBy: User
  reviewedBy?: User
  createdAt: string
  updatedAt: string
}

export interface ReuseVisitorData {
  scheduledDate?: string
  scheduledTime?: string
  purpose?: string
  itemsBrought?: string
}

export interface Delegation {
  _id: string
  requestedBy: User
  requestedTo: User
  reason: string
  startDate: string
  endDate: string
  status: "pending" | "approved" | "rejected" | "active" | "completed" | "cancelled"
  approvedBy?: User
  approvedAt?: string
  rejectionReason?: string
  permissions: {
    canCreateRequests: boolean
    canApproveRequests: boolean
    canBulkUpload: boolean
    gateAccess: string[]
    accessType: string[]
  }
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface DelegationRequest {
  requestedTo: string
  reason: string
  startDate: string
  endDate: string
  permissions: {
    canCreateRequests: boolean
    canApproveRequests: boolean
    canBulkUpload: boolean
    gateAccess: string[]
    accessType: string[]
  }
}

export interface DelegationReview {
  status: "approved" | "rejected"
  rejectionReason?: string
}
