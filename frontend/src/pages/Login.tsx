"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.tsx"
import toast from "react-hot-toast"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { UserGroupIcon } from "@heroicons/react/24/solid" // Import UserGroupIcon

const Login: React.FC = () => {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const { login, user, loading, error, clearError, isAuthenticated } = useAuth()

  useEffect(() => {
    if (error) {
      toast.error(error)
      clearError()
    }
  }, [error, clearError])

  if (isAuthenticated && user) {
    return <Navigate to="/dashboard" replace />
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!username.trim() || !password.trim()) {
      toast.error("Please fill in all fields")
      return
    }

    try {
      await login(username.trim(), password)
      toast.success("Login successful!")
    } catch (error) {
      // Error is handled by the context and useEffect
    }
  }

  const demoCredentials = [
    { role: "Admin", username: "admin", password: "admin123" },
    { role: "Department User", username: "dept_user", password: "dept123" },
    { role: "Security", username: "security", password: "security123" },
    { role: "Gate", username: "gate", password: "gate123" },
  ]

  const fillDemoCredentials = (username: string, password: string) => {
    setUsername(username)
    setPassword(password)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <UserGroupIcon className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            {process.env.REACT_APP_APP_NAME || "INSA Visitor Management"}
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your account or{" "}
            <a href="/signup" className="text-blue-600 hover:underline">
              Sign up
            </a>
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-md p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                Username
              </label>
              <input
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                required
                className="mt-1 appearance-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  className="appearance-none relative block w-full px-3 py-2 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </button>
            </div>
          </form>

          {/* Demo credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md">
            <h3 className="text-sm font-medium text-gray-900 mb-3">Demo Credentials:</h3>
            <div className="grid grid-cols-1 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.username}
                  onClick={() => fillDemoCredentials(cred.username, cred.password)}
                  className="text-left p-2 text-xs bg-white rounded border hover:bg-gray-50 transition-colors"
                  disabled={loading}
                >
                  <div className="font-medium text-gray-900">{cred.role}</div>
                  <div className="text-gray-600">
                    {cred.username} / {cred.password}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
