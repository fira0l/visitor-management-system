"use client"

import type React from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.tsx"

interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: string[]
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, token, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
        <div>
          <div className="flex justify-center">
            <span role="status" aria-label="Loading">
              <span className="absolute rounded-full border-2 border-gray-200 dark:border-gray-700 opacity-40 h-12 w-12"></span>
              <span className="relative animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 h-12 w-12"></span>
            </span>
          </div>
        </div>
      </div>
    )
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}
