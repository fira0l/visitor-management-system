import React, { useEffect, useState } from "react";
import { delegationAPI, userAPI } from "../services/api.ts";
import type { Delegation, DelegationRequest, User } from "../types";
import toast from "react-hot-toast";

const defaultPermissions = {
  canCreateRequests: true,
  canApproveRequests: false,
  canBulkUpload: false,
  gateAccess: [],
  accessType: ["Guest"],
};

const DelegationManagement: React.FC<{ isAdmin?: boolean }> = ({ isAdmin }) => {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAssign, setShowAssign] = useState(false);
  const [assignForm, setAssignForm] = useState<Partial<DelegationRequest>>({
    requestedTo: "",
    reason: "",
    startDate: "",
    endDate: "",
    permissions: defaultPermissions,
  });
  const [assignLoading, setAssignLoading] = useState(false);

  useEffect(() => {
    fetchDelegations();
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  const fetchDelegations = async () => {
    setLoading(true);
    try {
      const data = await delegationAPI.getDelegations(isAdmin ? {} : { type: "received" });
      setDelegations(data.delegations || []);
    } catch {
      toast.error("Failed to load delegations");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const data = await userAPI.getUsers();
      setUsers(data.users || []);
    } catch {}
  };

  const handleAssignChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setAssignForm({ ...assignForm, [e.target.name]: e.target.value });
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setAssignLoading(true);
    try {
      await delegationAPI.requestDelegation(assignForm as DelegationRequest);
      toast.success("Delegation request sent");
      setShowAssign(false);
      fetchDelegations();
    } catch {
      toast.error("Failed to assign delegation");
    } finally {
      setAssignLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Delegation Management</h2>
        {isAdmin && (
          <button className="btn-primary" onClick={() => setShowAssign(true)}>
            Assign Delegation
          </button>
        )}
      </div>
      {showAssign && isAdmin && (
        <form onSubmit={handleAssign} className="bg-white p-4 rounded shadow mb-4 space-y-2">
          <div>
            <label className="block text-sm font-medium">Delegate To</label>
            <select name="requestedTo" value={assignForm.requestedTo} onChange={handleAssignChange} required className="input-field">
              <option value="">Select User</option>
              {users.map(u => (
                <option key={u._id} value={u._id}>{u.fullName} ({u.employeeId}) - {u.departmentType}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium">Reason</label>
            <textarea name="reason" value={assignForm.reason} onChange={handleAssignChange} required className="input-field" />
          </div>
          <div className="flex gap-2">
            <div>
              <label className="block text-sm font-medium">Start Date</label>
              <input type="date" name="startDate" value={assignForm.startDate} onChange={handleAssignChange} required className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium">End Date</label>
              <input type="date" name="endDate" value={assignForm.endDate} onChange={handleAssignChange} required className="input-field" />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="button" className="btn-secondary" onClick={() => setShowAssign(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={assignLoading}>{assignLoading ? "Assigning..." : "Assign"}</button>
          </div>
        </form>
      )}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Delegate</th>
              <th className="px-4 py-2">Reason</th>
              <th className="px-4 py-2">Start</th>
              <th className="px-4 py-2">End</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {delegations.map(d => (
              <tr key={d._id}>
                <td className="px-4 py-2">{d.requestedTo?.fullName} ({d.requestedTo?.employeeId})</td>
                <td className="px-4 py-2">{d.reason}</td>
                <td className="px-4 py-2">{new Date(d.startDate).toLocaleDateString()}</td>
                <td className="px-4 py-2">{new Date(d.endDate).toLocaleDateString()}</td>
                <td className="px-4 py-2 capitalize">{d.status}</td>
                <td className="px-4 py-2">
                  {/* Approve/Reject/Cancel actions for admin */}
                  {isAdmin && d.status === "pending" && (
                    <>
                      <button className="btn-primary mr-2" onClick={async () => { await delegationAPI.reviewDelegation(d._id, { status: "approved" }); fetchDelegations(); }}>Approve</button>
                      <button className="btn-danger" onClick={async () => { await delegationAPI.reviewDelegation(d._id, { status: "rejected", rejectionReason: "Rejected by admin" }); fetchDelegations(); }}>Reject</button>
                    </>
                  )}
                  {isAdmin && ["approved", "active"].includes(d.status) && (
                    <button className="btn-danger" onClick={async () => { await delegationAPI.cancelDelegation(d._id); fetchDelegations(); }}>Cancel</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DelegationManagement; 