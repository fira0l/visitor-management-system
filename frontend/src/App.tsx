import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext.tsx"
import { ProtectedRoute } from "./components/ProtectedRoute.tsx"
import Login from "./pages/Login.tsx"
import Signup from "./pages/Signup.tsx"
import Dashboard from "./pages/Dashboard.tsx"
import VisitorRequests from "./pages/VisitorRequests.tsx"
import CreateRequest from "./pages/CreateRequest.tsx"
import Analytics from "./pages/Analytics.tsx"
import CheckInOut from "./pages/CheckInOut.tsx"
import Layout from "./components/Layout.tsx"
import { Toaster } from "react-hot-toast"
import SecurityReview from "./pages/SecurityReview.tsx"
import AdminLogs from "./pages/AdminLogs.tsx"
import UserManagement from "./pages/UserManagement.tsx"
import VisitorHistory from "./pages/VisitorHistory.tsx"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              className: "bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100 shadow-lg rounded-lg px-4 py-3 border border-gray-200 dark:border-gray-700 transition-colors",
              style: {},
              success: {
                duration: 3000,
                iconTheme: {
                  primary: "#4ade80",
                  secondary: "#fff",
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: "#ef4444",
                  secondary: "#fff",
                },
              },
            }}
          />
          <Routes>
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="requests" element={<VisitorRequests />} />
              <Route
                path="create-request"
                element={
                  <ProtectedRoute allowedRoles={["department_user"]}>
                    <CreateRequest />
                  </ProtectedRoute>
                }
              />
              <Route
                path="checkin-checkout"
                element={
                  <ProtectedRoute allowedRoles={["gate"]}>
                    <CheckInOut />
                  </ProtectedRoute>
                }
              />
              <Route
                path="analytics"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <Analytics />
                  </ProtectedRoute>
                }
              />

              <Route
                path="admin-logs"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <AdminLogs />
                  </ProtectedRoute>
                }
              />
              <Route
                path="admin/users"
                element={
                  <ProtectedRoute allowedRoles={["admin"]}>
                    <UserManagement />
                  </ProtectedRoute>
                }
              />
              <Route
                path="visitor-history"
                element={
                  <ProtectedRoute allowedRoles={["department_user", "admin"]}>
                    <VisitorHistory />
                  </ProtectedRoute>
                }
              />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
