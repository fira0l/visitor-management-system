"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect, useCallback } from "react"
import type { User } from "../types"
import { authAPI } from "../services/api.ts"

interface AuthState {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  isAuthenticated: boolean
  initialized: boolean
}

type AuthAction =
  | { type: "AUTH_START" }
  | { type: "AUTH_SUCCESS"; payload: { user: User; token: string } }
  | { type: "AUTH_FAILURE"; payload: string }
  | { type: "LOGOUT" }
  | { type: "CLEAR_ERROR" }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_INITIALIZED" }

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem("token"),
  loading: true,
  error: null,
  isAuthenticated: false,
  initialized: false,
}

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case "AUTH_START":
      return { ...state, loading: true, error: null }
    case "AUTH_SUCCESS":
      localStorage.setItem("token", action.payload.token)
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        loading: false,
        error: null,
        isAuthenticated: true,
        initialized: true,
      }
    case "AUTH_FAILURE":
      localStorage.removeItem("token")
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: action.payload,
        isAuthenticated: false,
        initialized: true,
      }
    case "LOGOUT":
      localStorage.removeItem("token")
      return {
        ...state,
        user: null,
        token: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        initialized: true,
      }
    case "CLEAR_ERROR":
      return { ...state, error: null }
    case "SET_LOADING":
      return { ...state, loading: action.payload }
    case "SET_INITIALIZED":
      return { ...state, initialized: true }
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

  const initializeAuth = useCallback(async () => {
    if (state.token && !state.initialized) {
      try {
        dispatch({ type: "SET_LOADING", payload: true })
        const response = await authAPI.getCurrentUser()
        dispatch({
          type: "AUTH_SUCCESS",
          payload: { user: response.user, token: state.token },
        })
      } catch (error: any) {
        console.error("Auth initialization error:", error)
        dispatch({ type: "LOGOUT" })
      }
    } else if (!state.token) {
      dispatch({ type: "SET_INITIALIZED" })
      dispatch({ type: "SET_LOADING", payload: false })
    }
  }, [state.token, state.initialized])

  useEffect(() => {
    initializeAuth()
  }, [initializeAuth])

  const login = async (username: string, password: string) => {
    dispatch({ type: "AUTH_START" })
    try {
      const response = await authAPI.login(username, password)
      dispatch({
        type: "AUTH_SUCCESS",
        payload: { user: response.user, token: response.token },
      })
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || "Login failed"
      dispatch({
        type: "AUTH_FAILURE",
        payload: errorMessage,
      })
      throw error
    }
  }

  const logout = useCallback(async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error("Logout API error:", error)
    } finally {
      dispatch({ type: "LOGOUT" })
    }
  }, [])

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
