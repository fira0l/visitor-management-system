"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useAuth } from "../contexts/AuthContext"
import { visitorAPI } from "../services/api"
import toast from "react-hot-toast"
import { EyeIcon, CheckIcon, XMarkIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline"

const formatCustomDateTime = (isoString: string | undefined | null): string => {
  if (!isoString) {
    return "N/A";
  }
  try {
    const dateObj = new Date(isoString);
    if (isNaN(dateObj.getTime())) {
      // Log error or return a specific string for invalid dates from source
      console.warn("Attempted to format an invalid date string:", isoString);
      return "Invalid Source Date";
    }
    return dateObj.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  } catch (error) {
    console.error("Error formatting date:", isoString, error);
    return "Formatting Error"; // Or "Invalid Date"
  }
};

interface VisitorRequest {
  _id: string
  visitorName: string
  visitorId: string
  visitorPhone: string
  visitorEmail?: string
  purpose: string
  itemsBrought: string[]
  department: string
  requestedBy: {
    fullName: string
    username: string
  }
  visitDuration: {
    hours: number
    days: number
  }
  scheduledDate: string
  scheduledTime: string
  status: string
  reviewedBy?: {
    fullName: string
    username: string
  }
  reviewedAt?: string
  reviewComments?: string
  approvalCode?: string
  createdAt: string
}

const VisitorRequests: React.FC = () => {
  const { user } = useAuth()
  const [requests, setRequests] = useState<VisitorRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [reviewData, setReviewData] = useState({
    status: "",
    reviewComments: "",
  })
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    date: "",
    search: "",
  })

  useEffect(() => {
    fetchRequests()
  }, [filters])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const response = await visitorAPI.getRequests(filters)
      setRequests(response.requests)
    } catch (error: any) {
      toast.error("Error fetching requests")
    } finally {
      setLoading(false)
    }
  }

  const handleReview = async (requestId: string, status: string, comments: string) => {
    try {
      await visitorAPI.reviewRequest(requestId, {
        status,
        reviewComments: comments,
      })

      toast.success(`Request ${status} successfully`)
      fetchRequests()
      setShowModal(false)
      setSelectedRequest(null)
      setReviewData({ status: "", reviewComments: "" })
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error reviewing request")
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "approved":
        return "bg-green-100 text-green-800"
      case "declined":
        return "bg-red-100 text-red-800"
      case "checked_in":
        return "bg-blue-100 text-blue-800"
      case "checked_out":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const canReview = (request: VisitorRequest) => {
    return user?.role === "security" && request.status === "pending"
  }

  const filteredRequests = requests.filter((request) => {
    if (filters.search) {
      const searchLower = filters.search.toLowerCase()
      return (
        request.visitorName.toLowerCase().includes(searchLower) ||
        request.visitorId.toLowerCase().includes(searchLower) ||
        request.department.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Visitor Requests</h1>
        {user?.role === "department_user" && (
          <a
            href="/create-request"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
          >
            Create New Request
          </a>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Search</label>
            <div className="mt-1 relative">
              <input
                type="text"
                placeholder="Search by name, ID, or department"
                value={filters.search}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
              <option value="checked_in">Checked In</option>
              <option value="checked_out">Checked Out</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Department</label>
            <input
              type="text"
              placeholder="Filter by department"
              value={filters.department}
              onChange={(e) => setFilters((prev) => ({ ...prev, department: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              value={filters.date}
              onChange={(e) => setFilters((prev) => ({ ...prev, date: e.target.value }))}
              className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No visitor requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Visitor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purpose
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Scheduled
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created At
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
                {filteredRequests.map((request) => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.visitorName}</div>
                        <div className="text-sm text-gray-500">ID: {request.visitorId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{request.department}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">{request.purpose}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div>{new Date(request.scheduledDate).toLocaleDateString()}</div>
                      <div>{request.scheduledTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatCustomDateTime(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(request.status)}`}
                      >
                        {request.status.replace("_", " ")}
                      </span>
                      {request.approvalCode && (
                        <div className="text-xs text-gray-500 mt-1">Code: {request.approvalCode}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => {
                            setSelectedRequest(request)
                            setShowModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <EyeIcon className="h-5 w-5" />
                        </button>
                        {canReview(request) && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedRequest(request)
                                setReviewData({ status: "approved", reviewComments: "" })
                                setShowModal(true)
                              }}
                              className="text-green-600 hover:text-green-900"
                            >
                              <CheckIcon className="h-5 w-5" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedRequest(request)
                                setReviewData({ status: "declined", reviewComments: "" })
                                setShowModal(true)
                              }}
                              className="text-red-600 hover:text-red-900"
                            >
                              <XMarkIcon className="h-5 w-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Visitor Request Details</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visitor Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.visitorName}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Visitor ID</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.visitorId}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.visitorPhone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.visitorEmail || "N/A"}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Purpose</label>
                  <p className="mt-1 text-sm text-gray-900">{selectedRequest.purpose}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Items Brought</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.itemsBrought.length > 0 ? selectedRequest.itemsBrought.join(", ") : "None"}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Department</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.department}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Requested By</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.requestedBy.fullName}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                    <p className="mt-1 text-sm text-gray-900">
                      {new Date(selectedRequest.scheduledDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedRequest.scheduledTime}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Visit Duration</label>
                  <p className="mt-1 text-sm text-gray-900">
                    {selectedRequest.visitDuration.days > 0 && `${selectedRequest.visitDuration.days} days `}
                    {selectedRequest.visitDuration.hours > 0 && `${selectedRequest.visitDuration.hours} hours`}
                    {selectedRequest.visitDuration.days === 0 &&
                      selectedRequest.visitDuration.hours === 0 &&
                      "Not specified"}
                  </p>
                </div>

                {selectedRequest.reviewedBy && (
                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.reviewedBy.fullName}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed At</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedRequest.reviewedAt ? new Date(selectedRequest.reviewedAt).toLocaleString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    {selectedRequest.reviewComments && (
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700">Review Comments</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedRequest.reviewComments}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Review Form for Security */}
                {canReview(selectedRequest) && reviewData.status && (
                  <div className="border-t pt-4">
                    <h4 className="text-md font-medium text-gray-900 mb-2">
                      {reviewData.status === "approved" ? "Approve Request" : "Decline Request"}
                    </h4>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Comments</label>
                      <textarea
                        rows={3}
                        value={reviewData.reviewComments}
                        onChange={(e) => setReviewData((prev) => ({ ...prev, reviewComments: e.target.value }))}
                        className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Add review comments..."
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowModal(false)
                    setSelectedRequest(null)
                    setReviewData({ status: "", reviewComments: "" })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Close
                </button>
                {canReview(selectedRequest) && reviewData.status && (
                  <button
                    onClick={() => handleReview(selectedRequest._id, reviewData.status, reviewData.reviewComments)}
                    className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      reviewData.status === "approved"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {reviewData.status === "approved" ? "Approve" : "Decline"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default VisitorRequests
