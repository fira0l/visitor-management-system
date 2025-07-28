import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { visitorAPI } from "../services/api.ts";
import { delegationAPI } from "../services/api.ts";
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
    nationalId: "",
  });
  const [photo, setPhoto] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState(user?.location || "");
  const [departmentType, setDepartmentType] = useState(user?.departmentType || "");
  const [gateAssignment, setGateAssignment] = useState("");
  const [accessType, setAccessType] = useState("");
  const [isGroupVisit, setIsGroupVisit] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [groupSize, setGroupSize] = useState(1);
  const [originDepartment, setOriginDepartment] = useState("");
  const [activeDelegation, setActiveDelegation] = useState<any>(null);

  // Initialize form with user's department settings
  useEffect(() => {
    if (user) {
      setLocation(user.location || "");
      setDepartmentType(user.departmentType || "");
    }
  }, [user]);

  useEffect(() => {
    if (user?.departmentRole === 'division_head') {
      delegationAPI.getActiveDelegations().then(res => {
        setActiveDelegation(res.delegations && res.delegations.length > 0 ? res.delegations[0] : null);
      });
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("visitorName", form.visitorName);
      formData.append("visitorId", form.visitorId);
      formData.append("visitorPhone", form.visitorPhone);
      formData.append("visitorEmail", form.visitorEmail);
      formData.append("purpose", form.purpose);
      formData.append("itemsBrought", form.itemsBrought);
      formData.append("visitDurationHours", String(form.visitDurationHours));
      formData.append("visitDurationDays", String(form.visitDurationDays));
      formData.append("scheduledDate", form.scheduledDate);
      formData.append("scheduledTime", form.scheduledTime);
      formData.append("priority", form.priority);
      formData.append("nationalId", form.nationalId);
      formData.append("location", location);
      formData.append("departmentType", departmentType);
      if (departmentType === "wing") {
        formData.append("gateAssignment", gateAssignment);
        formData.append("accessType", accessType);
      }
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
        visitDurationHours: 1,
        visitDurationDays: 0,
        scheduledDate: "",
        scheduledTime: "",
        priority: "medium",
        nationalId: "",
      });
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  const departmentRole = user?.departmentRole;

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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Items Brought (comma separated)</label>
              <input name="itemsBrought" value={form.itemsBrought} onChange={handleChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visit Duration (Hours)</label>
                <input name="visitDurationHours" type="number" min="0" value={form.visitDurationHours} onChange={handleChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Visit Duration (Days)</label>
                <input name="visitDurationDays" type="number" min="0" value={form.visitDurationDays} onChange={handleChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
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
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
              <select id="location" name="location" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={location} onChange={e => setLocation(e.target.value)} disabled={loading}>
                <option value="">Select a location</option>
                <option value="Wollo Sefer">Wollo Sefer</option>
                <option value="Operation">Operation</option>
              </select>
            </div>
            <div>
              <label htmlFor="departmentType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department Type</label>
              <select id="departmentType" name="departmentType" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={departmentType} onChange={e => setDepartmentType(e.target.value)} disabled={loading}>
                <option value="">Select department type</option>
                <option value="wing">Wing</option>
                <option value="director">Director</option>
                <option value="division">Division</option>
              </select>
            </div>
            {departmentType === "wing" && (
              <>
                <div>
                  <label htmlFor="gateAssignment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Gate Assignment</label>
                  <select
                    id="gateAssignment"
                    name="gateAssignment"
                    required
                    className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                    value={gateAssignment}
                    onChange={e => setGateAssignment(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select gate</option>
                    <option value="Gate 1">Gate 1</option>
                    {((departmentRole === 'wing' || departmentRole === 'director') || (accessType !== 'VIP') || (departmentRole === 'division_head' && activeDelegation && activeDelegation.permissions && activeDelegation.permissions.gateAccess && activeDelegation.permissions.gateAccess.includes('Gate 2') && activeDelegation.permissions.accessType.includes('VIP'))) && <option value="Gate 2">Gate 2</option>}
                    {((departmentRole === 'wing' || departmentRole === 'director') || (accessType !== 'VIP') || (departmentRole === 'division_head' && activeDelegation && activeDelegation.permissions && activeDelegation.permissions.gateAccess && activeDelegation.permissions.gateAccess.includes('Gate 3') && activeDelegation.permissions.accessType.includes('VIP'))) && <option value="Gate 3">Gate 3</option>}
                  </select>
                  {departmentRole === 'division_head' && accessType === 'VIP' && (gateAssignment === 'Gate 2' || gateAssignment === 'Gate 3') && (!activeDelegation || !activeDelegation.permissions.gateAccess.includes(gateAssignment)) && (
                    <div className="text-red-600 text-xs mt-1">Division Head can only request VIP for Gate 1 unless delegated by Wing/Director.</div>
                  )}
                  {departmentRole === 'division_head' && activeDelegation && (
                    <div className="text-green-600 text-xs mt-1">Delegation active: VIP access for {activeDelegation.permissions.gateAccess.join(', ')}</div>
                  )}
                </div>
                <div>
                  <label htmlFor="accessType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Access Type</label>
                  <select
                    id="accessType"
                    name="accessType"
                    required
                    className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                    value={accessType}
                    onChange={e => setAccessType(e.target.value)}
                    disabled={loading}
                  >
                    <option value="">Select access type</option>
                    <option value="VIP">VIP</option>
                    <option value="Guest">Guest</option>
                  </select>
                </div>
              </>
            )}
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
