import React, { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext.tsx"
import { getVisitorHistory, reuseVisitorData } from "../services/api.ts"
import { VisitorHistory as VisitorHistoryType, ReuseVisitorData } from "../types/index.ts"
import LoadingSpinner from "../components/LoadingSpinner.tsx"
import toast from "react-hot-toast"

const VisitorHistory: React.FC = () => {
  const { user } = useAuth()
  const [history, setHistory] = useState<VisitorHistoryType[]>([])
  const [loading, setLoading] = useState(false)
  const [searchParams, setSearchParams] = useState({
    visitorId: "",
    nationalId: "",
    visitorName: "",
  })
  const [selectedRequest, setSelectedRequest] = useState<VisitorHistoryType | null>(null)
  const [showReuseModal, setShowReuseModal] = useState(false)
  const [reuseData, setReuseData] = useState<ReuseVisitorData>({
    scheduledDate: new Date().toISOString().slice(0, 10),
    scheduledTime: "09:00",
    purpose: "",
    itemsBrought: "",
  })

  const handleSearch = async () => {
    if (!searchParams.visitorId && !searchParams.nationalId && !searchParams.visitorName) {
      toast.error("Please provide at least one search criteria")
      return
    }

    setLoading(true)
    try {
      const response = await getVisitorHistory(searchParams)
      setHistory(response.data.history)
      if (response.data.history.length === 0) {
        toast.info("No visitor history found")
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to fetch visitor history")
    } finally {
      setLoading(false)
    }
  }

  const handleReuse = async () => {
    if (!selectedRequest) return

    try {
      const response = await reuseVisitorData(selectedRequest._id, reuseData)
      toast.success("Visitor request created from history successfully!")
      setShowReuseModal(false)
      setSelectedRequest(null)
      // Optionally redirect to the new request or refresh the page
      window.location.href = "/visitor-requests"
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create request from history")
    }
  }

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      checked_in: "bg-blue-100 text-blue-800",
      checked_out: "bg-gray-100 text-gray-800",
    }
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800"}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    )
  }

  const getVisitTypeBadge = (isGroupVisit: boolean, groupSize?: number) => {
    if (isGroupVisit) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Group ({groupSize || 'N/A'})
        </span>
      )
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        Individual
      </span>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Visitor History</h1>

      {/* Search Form */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Search Visitor History</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitor ID
            </label>
            <input
              type="text"
              placeholder="Enter visitor ID"
              value={searchParams.visitorId}
              onChange={(e) => setSearchParams(prev => ({ ...prev, visitorId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              National ID
            </label>
            <input
              type="text"
              placeholder="Enter national ID"
              value={searchParams.nationalId}
              onChange={(e) => setSearchParams(prev => ({ ...prev, nationalId: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Visitor Name
            </label>
            <input
              type="text"
              placeholder="Enter visitor name"
              value={searchParams.visitorName}
              onChange={(e) => setSearchParams(prev => ({ ...prev, visitorName: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={handleSearch}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Searching..." : "Search History"}
          </button>
        </div>
      </div>

      {/* History Results */}
      {history.length > 0 && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold">Visitor History Results</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visit Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {history.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {request.visitorName}
                        </div>
                        <div className="text-sm text-gray-500">{request.visitorId}</div>
                        {request.companyName && (
                          <div className="text-xs text-gray-400">{request.companyName}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getVisitTypeBadge(request.isGroupVisit, request.groupSize)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{request.department}</div>
                        <div className="text-xs text-gray-500">{request.departmentType}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm text-gray-900">{request.location}</div>
                        {request.gateAssignment && (
                          <div className="text-xs text-gray-500">{request.gateAssignment}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(request.scheduledDate).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">{request.scheduledTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedRequest(request)
                          setReuseData({
                            scheduledDate: new Date().toISOString().slice(0, 10),
                            scheduledTime: "09:00",
                            purpose: request.purpose,
                            itemsBrought: request.itemsBrought?.join(", ") || "",
                          })
                          setShowReuseModal(true)
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        Reuse
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Reuse Modal */}
      {showReuseModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Reuse Visitor Data</h3>
            <p className="text-sm text-gray-600 mb-4">
              Creating a new request for {selectedRequest.visitorName}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Date
                </label>
                <input
                  type="date"
                  value={reuseData.scheduledDate}
                  onChange={(e) => setReuseData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Scheduled Time
                </label>
                <input
                  type="time"
                  value={reuseData.scheduledTime}
                  onChange={(e) => setReuseData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Purpose
                </label>
                <textarea
                  value={reuseData.purpose}
                  onChange={(e) => setReuseData(prev => ({ ...prev, purpose: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Items Brought (comma-separated)
                </label>
                <input
                  type="text"
                  value={reuseData.itemsBrought}
                  onChange={(e) => setReuseData(prev => ({ ...prev, itemsBrought: e.target.value }))}
                  placeholder="laptop, documents, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowReuseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReuse}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Create Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitorHistory 