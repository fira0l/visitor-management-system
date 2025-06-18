"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { visitorAPI } from "../services/api"
import toast from "react-hot-toast"
import { MagnifyingGlassIcon, ArrowRightOnRectangleIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline"

interface ApprovedVisitor {
  _id: string
  visitorName: string
  visitorId: string
  visitorPhone: string
  department: string
  purpose: string
  itemsBrought: string[]
  approvalCode: string
  scheduledDate: string
  scheduledTime: string
  status: string
  requestedBy: {
    fullName: string
    department: string
  }
}

const CheckInOut: React.FC = () => {
  const [approvedVisitors, setApprovedVisitors] = useState<ApprovedVisitor[]>([])
  const [checkedInVisitors, setCheckedInVisitors] = useState<ApprovedVisitor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [checkInData, setCheckInData] = useState({
    actualItemsBrought: [""],
    notes: "",
  })
  const [checkOutData, setCheckOutData] = useState({
    notes: "",
  })
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [showCheckOutModal, setShowCheckOutModal] = useState(false)
  const [selectedVisitor, setSelectedVisitor] = useState<ApprovedVisitor | null>(null)

  useEffect(() => {
    fetchVisitors()
  }, [])

  const fetchVisitors = async () => {
    try {
      setLoading(true)

      // Fetch approved visitors
      const approvedResponse = await visitorAPI.getRequests({ status: "approved" })
      setApprovedVisitors(approvedResponse.requests)

      // Fetch checked-in visitors
      const checkedInResponse = await visitorAPI.getRequests({ status: "checked_in" })
      setCheckedInVisitors(checkedInResponse.requests)
    } catch (error: any) {
      toast.error("Error fetching visitors")
    } finally {
      setLoading(false)
    }
  }

  const handleCheckIn = async (visitorId: string) => {
    try {
      const cleanedData = {
        ...checkInData,
        actualItemsBrought: checkInData.actualItemsBrought.filter((item) => item.trim() !== ""),
      }

      await visitorAPI.checkIn(visitorId, cleanedData)
      toast.success("Visitor checked in successfully!")

      setShowCheckInModal(false)
      setSelectedVisitor(null)
      setCheckInData({ actualItemsBrought: [""], notes: "" })
      fetchVisitors()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error checking in visitor")
    }
  }

  const handleCheckOut = async (visitorId: string) => {
    try {
      await visitorAPI.checkOut(visitorId, checkOutData)
      toast.success("Visitor checked out successfully!")

      setShowCheckOutModal(false)
      setSelectedVisitor(null)
      setCheckOutData({ notes: "" })
      fetchVisitors()
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error checking out visitor")
    }
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...checkInData.actualItemsBrought]
    newItems[index] = value
    setCheckInData((prev) => ({
      ...prev,
      actualItemsBrought: newItems,
    }))
  }

  const addItem = () => {
    setCheckInData((prev) => ({
      ...prev,
      actualItemsBrought: [...prev.actualItemsBrought, ""],
    }))
  }

  const removeItem = (index: number) => {
    if (checkInData.actualItemsBrought.length > 1) {
      const newItems = checkInData.actualItemsBrought.filter((_, i) => i !== index)
      setCheckInData((prev) => ({
        ...prev,
        actualItemsBrought: newItems,
      }))
    }
  }

  const filteredApprovedVisitors = approvedVisitors.filter(
    (visitor) =>
      visitor.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.approvalCode.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const filteredCheckedInVisitors = checkedInVisitors.filter(
    (visitor) =>
      visitor.visitorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.visitorId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      visitor.approvalCode.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Visitor Check-In/Check-Out</h1>
        <p className="text-gray-600">Manage visitor entry and exit at the gate</p>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <input
            type="text"
            placeholder="Search by name, ID, or approval code"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Approved Visitors - Ready for Check-In */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Approved Visitors ({filteredApprovedVisitors.length})
            </h3>

            {filteredApprovedVisitors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No approved visitors waiting for check-in.</p>
            ) : (
              <div className="space-y-4">
                {filteredApprovedVisitors.map((visitor) => (
                  <div key={visitor._id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{visitor.visitorName}</h4>
                        <p className="text-sm text-gray-600">ID: {visitor.visitorId}</p>
                        <p className="text-sm text-gray-600">Code: {visitor.approvalCode}</p>
                        <p className="text-sm text-gray-600">Department: {visitor.department}</p>
                        <p className="text-sm text-gray-600">
                          Scheduled: {new Date(visitor.scheduledDate).toLocaleDateString()} at {visitor.scheduledTime}
                        </p>
                        <p className="text-sm text-gray-600 mt-1">Purpose: {visitor.purpose}</p>
                        {visitor.itemsBrought.length > 0 && (
                          <p className="text-sm text-gray-600">Expected Items: {visitor.itemsBrought.join(", ")}</p>
                        )}
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVisitor(visitor)
                          setShowCheckInModal(true)
                        }}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                      >
                        <ArrowRightOnRectangleIcon className="h-4 w-4 mr-1" />
                        Check In
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Checked-In Visitors - Ready for Check-Out */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Checked-In Visitors ({filteredCheckedInVisitors.length})
            </h3>

            {filteredCheckedInVisitors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No visitors currently checked in.</p>
            ) : (
              <div className="space-y-4">
                {filteredCheckedInVisitors.map((visitor) => (
                  <div key={visitor._id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="text-lg font-medium text-gray-900">{visitor.visitorName}</h4>
                        <p className="text-sm text-gray-600">ID: {visitor.visitorId}</p>
                        <p className="text-sm text-gray-600">Code: {visitor.approvalCode}</p>
                        <p className="text-sm text-gray-600">Department: {visitor.department}</p>
                        <p className="text-sm text-blue-600 font-medium">Currently Inside</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedVisitor(visitor)
                          setShowCheckOutModal(true)
                        }}
                        className="ml-4 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <ArrowLeftOnRectangleIcon className="h-4 w-4 mr-1" />
                        Check Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Check-In Modal */}
      {showCheckInModal && selectedVisitor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Check In: {selectedVisitor.visitorName}</h3>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Visitor Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedVisitor.visitorName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedVisitor.visitorId}</p>
                  <p className="text-sm text-gray-600">Approval Code: {selectedVisitor.approvalCode}</p>
                  <p className="text-sm text-gray-600">Department: {selectedVisitor.department}</p>
                  <p className="text-sm text-gray-600">Purpose: {selectedVisitor.purpose}</p>
                  {selectedVisitor.itemsBrought.length > 0 && (
                    <p className="text-sm text-gray-600">Expected Items: {selectedVisitor.itemsBrought.join(", ")}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Actual Items Brought</label>
                  {checkInData.actualItemsBrought.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <input
                        type="text"
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        placeholder="e.g., Laptop, Documents"
                        className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                      {checkInData.actualItemsBrought.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-800 text-sm">
                    + Add Item
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    rows={3}
                    value={checkInData.notes}
                    onChange={(e) => setCheckInData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Any additional notes..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCheckInModal(false)
                    setSelectedVisitor(null)
                    setCheckInData({ actualItemsBrought: [""], notes: "" })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCheckIn(selectedVisitor._id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
                >
                  Check In Visitor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Check-Out Modal */}
      {showCheckOutModal && selectedVisitor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-11/12 md:w-3/4 lg:w-1/2 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Check Out: {selectedVisitor.visitorName}</h3>

              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-md">
                  <h4 className="font-medium text-gray-900 mb-2">Visitor Information</h4>
                  <p className="text-sm text-gray-600">Name: {selectedVisitor.visitorName}</p>
                  <p className="text-sm text-gray-600">ID: {selectedVisitor.visitorId}</p>
                  <p className="text-sm text-gray-600">Approval Code: {selectedVisitor.approvalCode}</p>
                  <p className="text-sm text-gray-600">Department: {selectedVisitor.department}</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Check-Out Notes</label>
                  <textarea
                    rows={3}
                    value={checkOutData.notes}
                    onChange={(e) => setCheckOutData((prev) => ({ ...prev, notes: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Any notes about the check-out..."
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCheckOutModal(false)
                    setSelectedVisitor(null)
                    setCheckOutData({ notes: "" })
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleCheckOut(selectedVisitor._id)}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                >
                  Check Out Visitor
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckInOut
