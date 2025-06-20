"use client"

import type React from "react"
import { Outlet, Link, useLocation } from "react-router-dom"
import { useAuth } from "../contexts/AuthContext.tsx"
import {
  HomeIcon,
  DocumentTextIcon,
  PlusIcon,
  ChartBarIcon,
  ArrowRightOnRectangleIcon,
  UserGroupIcon,
  Bars3Icon,
  XMarkIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline"
import { useState } from "react"

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
      { name: "Visitor Requests", href: "/requests", icon: DocumentTextIcon },
    ]

    switch (user?.role) {
      case "department_user":
        return [...baseItems, { name: "Create Request", href: "/create-request", icon: PlusIcon }]
      case "security":
        return [...baseItems, { name: "Security Review", href: "/security-review", icon: DocumentTextIcon }]
      case "gate":
        return [...baseItems, { name: "Check In/Out", href: "/checkin-checkout", icon: UserGroupIcon }]
      case "admin":
        return [
          ...baseItems,
          { name: "Admin Logs", href: "/admin-logs", icon: ClipboardDocumentListIcon },
          { name: "Security Review", href: "/security-review", icon: DocumentTextIcon },
          { name: "Check In/Out", href: "/checkin-checkout", icon: UserGroupIcon },
          { name: "Analytics", href: "/analytics", icon: ChartBarIcon }
        ]
      default:
        return baseItems
    }
  }

  const navigationItems = getNavigationItems()

  const handleLogout = async () => {
    try {
      await logout()
    } catch (error) {
      console.error("Logout error:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex h-screen">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col`}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900">
              {process.env.REACT_APP_APP_NAME || "INSA Visitor System"}
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav px-4 py-6">
            <ul className="space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                        isActive 
                          ? "bg-blue-100 text-blue-700 border-l-4 border-blue-600" 
                          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                      }`}
                    >
                      <item.icon className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User info and logout - Fixed at bottom */}
          <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace("_", " ")}</p>
                {user?.department && <p className="text-xs text-gray-500 truncate">{user.department}</p>}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-200"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-64 flex flex-col">
          {/* Mobile header */}
          <div className="lg:hidden bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-gray-600">
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900">
                {process.env.REACT_APP_APP_NAME || "INSA Visitor System"}
              </h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Main content area */}
          <main className="main-content p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
