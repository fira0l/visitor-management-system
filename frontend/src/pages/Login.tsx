"use client"

import React, { useState, useEffect } from "react"
import { Navigate } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.tsx"
import toast from "react-hot-toast"
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline"
import { UserGroupIcon } from "@heroicons/react/24/solid"

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
        <div className="bg-white rounded-lg shadow-md p-8 animate-fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700">Username</label>
              <input id="username" name="username" type="text" autoComplete="username" required className="input-field mt-1" placeholder="Enter your username" value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Password</label>
              <div className="mt-1 relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required className="input-field pr-10" placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
                <button type="button" className="absolute inset-y-0 right-0 pr-3 flex items-center" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
        <div className="bg-white rounded-lg shadow p-4 animate-fade-in">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Demo Credentials</h3>
          <ul className="space-y-2">
            {demoCredentials.map((cred, idx) => (
              <li key={cred.role} className="flex items-center justify-between bg-gray-50 rounded px-3 py-2">
                <span className="font-medium text-gray-700">{cred.role}</span>
                <span className="text-xs text-gray-500">{cred.username} / {cred.password}</span>
                <button className="ml-2 text-blue-600 hover:underline text-xs" onClick={() => fillDemoCredentials(cred.username, cred.password)}>
                  Autofill
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}

export default Login
