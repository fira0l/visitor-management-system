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
  ClockIcon,
} from "@heroicons/react/24/outline"
import { useState, useEffect } from "react"

const Layout: React.FC = () => {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [darkMode, setDarkMode] = useState(false)

  // On mount, check localStorage or system preference
  useEffect(() => {
    const saved = localStorage.getItem("theme")
    if (saved) {
      setDarkMode(saved === "dark")
      document.documentElement.classList.toggle("dark", saved === "dark")
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      setDarkMode(prefersDark)
      document.documentElement.classList.toggle("dark", prefersDark)
    }
  }, [])

  // Toggle dark mode
  const toggleTheme = () => {
    setDarkMode((prev) => {
      const next = !prev
      document.documentElement.classList.toggle("dark", next)
      localStorage.setItem("theme", next ? "dark" : "light")
      return next
    })
  }

  const getNavigationItems = () => {
    const baseItems = [
      { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
      { name: "Visitor Requests", href: "/requests", icon: DocumentTextIcon },
    ]

    switch (user?.role) {
      case "department_user":
        return [
          ...baseItems, 
          { name: "Create Request", href: "/create-request", icon: PlusIcon },
          { name: "Visitor History", href: "/visitor-history", icon: ClockIcon }
        ]
      case "security":
        return [...baseItems, { name: "Security Review", href: "/security-review", icon: DocumentTextIcon }]
      case "gate":
        return [...baseItems, { name: "Check In/Out", href: "/checkin-checkout", icon: UserGroupIcon }]
      case "admin":
        return [
          ...baseItems,
          { name: "User Management", href: "/admin/users", icon: UserGroupIcon },
          { name: "Admin Logs", href: "/admin-logs", icon: ClipboardDocumentListIcon },
          { name: "Security Review", href: "/security-review", icon: DocumentTextIcon },
          { name: "Check In/Out", href: "/checkin-checkout", icon: UserGroupIcon },
          { name: "Analytics", href: "/analytics", icon: ChartBarIcon },
          { name: "Visitor History", href: "/visitor-history", icon: ClockIcon }
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <header className="w-full px-4 py-3 flex items-center justify-between bg-white dark:bg-gray-800 shadow-md sticky top-0 z-30">
        <div className="text-xl font-bold text-gray-800 dark:text-gray-100">Visitor Management System</div>
        <button
          onClick={toggleTheme}
          className="rounded-full p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          aria-label="Toggle dark mode"
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m8.66-13.66l-.71.71M4.05 19.07l-.71.71M21 12h-1M4 12H3m16.66 5.66l-.71-.71M4.05 4.93l-.71-.71M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-800 dark:text-gray-100" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" /></svg>
          )}
        </button>
      </header>
      <div className="flex h-screen">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
          </div>
        )}

        {/* Sidebar */}
        <div
          className={`fixed inset-y-0 left-0 z-50 w-44 bg-white dark:bg-gray-800 shadow-lg border-r border-gray-200 dark:border-gray-700 transform ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          } transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col lg:sticky lg:top-0`}
        >
          {/* Header */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">
              {process.env.REACT_APP_APP_NAME || "INSA Visitor System"}
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="sidebar-nav px-2 py-4 flex-1 overflow-y-auto">
            <ul className="space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={() => setSidebarOpen(false)}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 gap-2 ${
                        isActive 
                          ? "bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 border-l-4 border-blue-600 dark:border-blue-400" 
                          : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                      }`}
                    >
                      <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400'}`} />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </nav>

          {/* User info and logout - Sticky at bottom */}
          <div className="sticky bottom-0 left-0 w-full flex-shrink-0 p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 z-10">
            <div className="flex items-center gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{user?.fullName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role?.replace("_", " ")}</p>
                {user?.department && <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.department}</p>}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-red-600 dark:text-red-400 hover:text-white hover:bg-red-600 dark:hover:text-white dark:hover:bg-red-700 transition-colors rounded-lg border border-red-100 dark:border-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 dark:focus:ring-red-400"
                title="Logout"
              >
                <ArrowRightOnRectangleIcon className="h-6 w-6" />
              </button>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 lg:ml-44 flex flex-col min-h-0">
          {/* Mobile header */}
          <div className="lg:hidden bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-md text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Bars3Icon className="h-6 w-6" />
              </button>
              <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {process.env.REACT_APP_APP_NAME || "INSA Visitor System"}
              </h1>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </div>

          {/* Main content area */}
          <main className="main-content p-0.5 sm:p-1 md:p-2 lg:p-3 max-w-full">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}

export default Layout
