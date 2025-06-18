"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { authAPI } from "../services/api"

interface User {
  _id: string
  username: string
  email: string
  role: "admin" | "department_user" | "security" | "gate"
  department?: string
  fullName: string
}

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
}

type AuthAction =
  | { type: "LOGIN_START" }
  | { type: "LOGIN_SUCCESS"; payload: { user: User; token: string } }
  | { type: "LOGIN_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: false,
  error: null,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "LOGIN_START":
      return { ...state, loading: true, error: null }
    case "LOGIN_SUCCESS":
      localStorage.setItem("token", action.payload.token)
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
      }
    case "LOGIN_FAILURE":
      localStorage.removeItem("token")
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
      }
    case "LOGOUT":
      localStorage.removeItem("token")
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
      }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    default:
      return state
  }
}

interface AuthContextType extends AuthState {
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState)

  useEffect(() => {
    const initializeAuth = async () => {
      if (state.token) {
        try {
          const user = await authAPI.getCurrentUser()
          dispatch({ type: "LOGIN_SUCCESS", payload: { user, token: state.token } })
        } catch (error) {
          dispatch({ type: "LOGOUT" })
        }
      }
    }

    initializeAuth()
  }, [])

  const login = async (username: string, password: string) => {
    dispatch({ type: "LOGIN_START" })
    try {
      const response = await authAPI.login(username, password)
      dispatch({
        type: "LOGIN_SUCCESS",
        payload: { user: response.user, token: response.token },
      })
    } catch (error: any) {
      dispatch({
        type: "LOGIN_FAILURE",
        payload: error.response?.data?.message || "Login failed",
      })
      throw error
    }
  }

  const logout = () => {
    dispatch({ type: "LOGOUT" })
  }

  const clearError = () => {
    dispatch({ type: "CLEAR_ERROR" })
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
