import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { visitorAPI } from "../services/api.ts";
import toast from "react-hot-toast";

const CreateRequest: React.FC = () => {
  const { user } = useAuth();
  const [form, setForm] = useState({
    visitorName: "",
    visitorId: "",
    visitorPhone: "",
    visitorEmail: "",
    purpose: "",
    itemsBrought: "",

    scheduledDate: "",
    scheduledTime: "",
    priority: "medium",
    nationalId: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(user?.location || "");
  const [isGroupVisit, setIsGroupVisit] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [originDepartment, setOriginDepartment] = useState("");
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [otherItems, setOtherItems] = useState("");
  const [gateAssignment, setGateAssignment] = useState("");
  const [searchRequired, setSearchRequired] = useState("not_required");

  const commonItems = ["USB", "Laptop", "Phone", "Tablet", "Camera", "Documents", "Bag"];

  // Initialize form with user's department settings
  useEffect(() => {
    if (user) {
      setLocation(user.location || "");
    }
  }, [user]);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPhoto(e.target.files[0]);
    }
  };

  const handleItemToggle = (item: string) => {
    setSelectedItems(prev => 
      prev.includes(item) 
        ? prev.filter(i => i !== item)
        : [...prev, item]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Combine selected items and other items
      const allItems = [...selectedItems];
      if (otherItems.trim()) {
        allItems.push(otherItems.trim());
      }
      
      const formData = new FormData();
      formData.append("visitorName", form.visitorName);
      formData.append("visitorId", form.visitorId);
      formData.append("visitorPhone", form.visitorPhone);
      formData.append("visitorEmail", form.visitorEmail);
      formData.append("purpose", form.purpose);
      formData.append("itemsBrought", allItems.join(", "));

      formData.append("scheduledDate", form.scheduledDate);
      formData.append("scheduledTime", form.scheduledTime);
      formData.append("priority", form.priority);
      formData.append("nationalId", form.nationalId);
      formData.append("location", location);
      formData.append("gateAssignment", gateAssignment);
      formData.append("searchRequired", searchRequired);
      formData.append("isGroupVisit", isGroupVisit.toString());
      if (isGroupVisit) {
        formData.append("companyName", companyName);
        formData.append("groupSize", groupSize.toString());
      } else {
        formData.append("originDepartment", originDepartment);
      }
      if (photo) formData.append("photo", photo);
      await visitorAPI.createRequest(formData);
      toast.success("Visitor request submitted!");
      setForm({
        visitorName: "",
        visitorId: "",
        visitorPhone: "",
        visitorEmail: "",
        purpose: "",
        itemsBrought: "",

        scheduledDate: "",
        scheduledTime: "",
        priority: "medium",
        nationalId: "",
      });
      setSelectedItems([]);
      setOtherItems("");
      setPhoto(null);
      setIsGroupVisit(false);
      setCompanyName("");
      setGroupSize(1);
      setOriginDepartment("");
      setGateAssignment("");
      setSearchRequired("not_required");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-header">
          <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Create Visitor Request</h2>
          <p className="text-gray-500 dark:text-gray-300">Fill in the details below to request a visitor entry.</p>
        </div>
        <div className="card-body">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visitor Name</label>
                <input name="visitorName" value={form.visitorName} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visitor ID</label>
                <input name="visitorId" value={form.visitorId} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Phone</label>
                <input name="visitorPhone" value={form.visitorPhone} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input name="visitorEmail" value={form.visitorEmail} onChange={handleChange} type="email" className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Purpose</label>
              <textarea name="purpose" value={form.purpose} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Items Brought</label>
              <div className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {commonItems.map((item) => (
                    <label key={item} className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item)}
                        onChange={() => handleItemToggle(item)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                    </label>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Others (specify)</label>
                  <input
                    type="text"
                    value={otherItems}
                    onChange={(e) => setOtherItems(e.target.value)}
                    placeholder="Enter other items..."
                    className="input-field w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled Date</label>
                <input name="scheduledDate" type="date" value={form.scheduledDate} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Scheduled Time</label>
                <input name="scheduledTime" type="time" value={form.scheduledTime} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">National ID</label>
              <input name="nationalId" value={form.nationalId} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
            </div>
            <div className="flex items-center">
              <input
                id="isGroupVisit"
                name="isGroupVisit"
                type="checkbox"
                checked={isGroupVisit}
                onChange={(e) => setIsGroupVisit(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isGroupVisit" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                This is a group visit
              </label>
            </div>
            {isGroupVisit ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Company Name</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    required
                    className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Group Size</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={groupSize}
                    onChange={(e) => setGroupSize(parseInt(e.target.value) || 1)}
                    required
                    className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                  />
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Origin Department</label>
                <input
                  value={originDepartment}
                  onChange={(e) => setOriginDepartment(e.target.value)}
                  className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                  placeholder="Department where visitor is coming from"
                />
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <select id="location" name="location" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={location} onChange={e => setLocation(e.target.value)} disabled={loading}>
                  <option value="">Select a location</option>
                  <option value="Wollo Sefer">Wollo Sefer</option>
                  <option value="Operation">Operation</option>
                </select>
              </div>
              <div>
                <label htmlFor="gateAssignment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gate Assignment</label>
                <select id="gateAssignment" name="gateAssignment" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={gateAssignment} onChange={e => setGateAssignment(e.target.value)} disabled={loading}>
                  <option value="">Select a gate</option>
                  <option value="Gate 1">Gate 1</option>
                  <option value="Gate 2">Gate 2</option>
                  <option value="Gate 3">Gate 3</option>
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="searchRequired" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Requirement</label>
              <select id="searchRequired" name="searchRequired" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={searchRequired} onChange={e => setSearchRequired(e.target.value)} disabled={loading}>
                <option value="not_required">Not Required</option>
                <option value="required">Required</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visitor Photo</label>
              <input name="photo" type="file" accept="image/*" onChange={handlePhotoChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Submitting..." : "Submit Request"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateRequest;
