import React, { useState } from "react";
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
    visitDurationHours: 1,
    visitDurationDays: 0,
    scheduledDate: "",
    scheduledTime: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await visitorAPI.createRequest({
        ...form,
        itemsBrought: form.itemsBrought.split(",").map(i => i.trim()).filter(Boolean),
        visitDuration: { hours: Number(form.visitDurationHours), days: Number(form.visitDurationDays) },
        department: user?.department || "",
        priority: form.priority as "low" | "medium" | "high",
      });
      toast.success("Visitor request submitted!");
      setForm({
        visitorName: "",
        visitorId: "",
        visitorPhone: "",
        visitorEmail: "",
        purpose: "",
        itemsBrought: "",
        visitDurationHours: 1,
        visitDurationDays: 0,
        scheduledDate: "",
        scheduledTime: "",
        priority: "medium",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 animate-fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-bold mb-2">Create Visitor Request</h2>
          <p className="text-gray-500">Fill in the details below to request a visitor entry.</p>
        </div>
        <div className="card-body">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor Name</label>
                <input name="visitorName" value={form.visitorName} onChange={handleChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visitor ID</label>
                <input name="visitorId" value={form.visitorId} onChange={handleChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input name="visitorPhone" value={form.visitorPhone} onChange={handleChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="visitorEmail" value={form.visitorEmail} onChange={handleChange} type="email" className="input-field mt-1" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Purpose</label>
              <textarea name="purpose" value={form.purpose} onChange={handleChange} required className="input-field mt-1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Items Brought (comma separated)</label>
              <input name="itemsBrought" value={form.itemsBrought} onChange={handleChange} className="input-field mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Visit Duration (Hours)</label>
                <input name="visitDurationHours" type="number" min="0" value={form.visitDurationHours} onChange={handleChange} className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Visit Duration (Days)</label>
                <input name="visitDurationDays" type="number" min="0" value={form.visitDurationDays} onChange={handleChange} className="input-field mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Date</label>
                <input name="scheduledDate" type="date" value={form.scheduledDate} onChange={handleChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Scheduled Time</label>
                <input name="scheduledTime" type="time" value={form.scheduledTime} onChange={handleChange} required className="input-field mt-1" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} className="input-field mt-1">
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
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
