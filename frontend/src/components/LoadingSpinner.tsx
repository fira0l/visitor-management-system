import type React from "react"

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  }

  return (
    <span
      role="status"
      aria-label="Loading"
      className={`inline-flex items-center justify-center ${sizeClasses[size]} ${className}`}
    >
      <span className={`absolute rounded-full border-2 border-gray-200 dark:border-gray-700 opacity-40 ${sizeClasses[size]}`}></span>
      <span className={`relative animate-spin rounded-full border-b-2 border-blue-600 dark:border-blue-400 ${sizeClasses[size]}`}></span>
    </span>
  )
}

export default LoadingSpinner
