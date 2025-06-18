import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./contexts/AuthContext"
import { ProtectedRoute } from "./components/ProtectedRoute"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import VisitorRequests from "./pages/VisitorRequests"
import CreateRequest from "./pages/CreateRequest"
import Analytics from "./pages/Analytics"
import CheckInOut from "./pages/CheckInOut"
import Layout from "./components/Layout"
import { Toaster } from "react-hot-toast"

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>
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
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
