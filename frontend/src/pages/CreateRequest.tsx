"use client"

import type React from "react"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { visitorAPI } from "../services/api"
import toast from "react-hot-toast"

const CreateRequest: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    visitorName: "",
    visitorId: "",
    visitorPhone: "",
    visitorEmail: "",
    purpose: "",
    itemsBrought: [""],
    visitDuration: {
      hours: 0,
      days: 0,
    },
    scheduledDate: "",
    scheduledTime: "",
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev[parent as keyof typeof prev] as any),
          [child]: value,
        },
      }))
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }))
    }
  }

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...formData.itemsBrought]
    newItems[index] = value
    setFormData((prev) => ({
      ...prev,
      itemsBrought: newItems,
    }))
  }

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      itemsBrought: [...prev.itemsBrought, ""],
    }))
  }

  const removeItem = (index: number) => {
    if (formData.itemsBrought.length > 1) {
      const newItems = formData.itemsBrought.filter((_, i) => i !== index)
      setFormData((prev) => ({
        ...prev,
        itemsBrought: newItems,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Filter out empty items
      const cleanedData = {
        ...formData,
        itemsBrought: formData.itemsBrought.filter((item) => item.trim() !== ""),
        visitDuration: {
          hours: Number.parseInt(formData.visitDuration.hours.toString()) || 0,
          days: Number.parseInt(formData.visitDuration.days.toString()) || 0,
        },
      }

      await visitorAPI.createRequest(cleanedData)
      toast.success("Visitor request created successfully!")
      navigate("/requests")
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Error creating request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">Create Visitor Request</h3>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Visitor Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor Name *</label>
                <input
                  type="text"
                  name="visitorName"
                  required
                  value={formData.visitorName}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor ID *</label>
                <input
                  type="text"
                  name="visitorId"
                  required
                  value={formData.visitorId}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Phone Number *</label>
                <input
                  type="tel"
                  name="visitorPhone"
                  required
                  value={formData.visitorPhone}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  name="visitorEmail"
                  value={formData.visitorEmail}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose of Visit *</label>
              <textarea
                name="purpose"
                required
                rows={3}
                value={formData.purpose}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
              />
            </div>

            {/* Items Brought */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Items Brought</label>
              {formData.itemsBrought.map((item, index) => (
                <div key={index} className="flex items-center space-x-2 mb-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => handleItemChange(index, e.target.value)}
                    placeholder="e.g., Laptop, Documents"
                    className="flex-1 border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                  {formData.itemsBrought.length > 1 && (
                    <button type="button" onClick={() => removeItem(index)} className="text-red-600 hover:text-red-800">
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={addItem} className="text-blue-600 hover:text-blue-800 text-sm">
                + Add Item
              </button>
            </div>

            {/* Visit Duration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Visit Duration</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500">Days</label>
                  <input
                    type="number"
                    name="visitDuration.days"
                    min="0"
                    value={formData.visitDuration.days}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500">Hours</label>
                  <input
                    type="number"
                    name="visitDuration.hours"
                    min="0"
                    max="23"
                    value={formData.visitDuration.hours}
                    onChange={handleInputChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Scheduled Date and Time */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date *</label>
                <input
                  type="date"
                  name="scheduledDate"
                  required
                  min={new Date().toISOString().split("T")[0]}
                  value={formData.scheduledDate}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Time *</label>
                <input
                  type="time"
                  name="scheduledTime"
                  required
                  value={formData.scheduledTime}
                  onChange={handleInputChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => navigate("/requests")}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Creating..." : "Create Request"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default CreateRequest
