import React, { useState, useEffect } from "react";
import { auditLogAPI } from "../services/api.ts";
import type { User } from "../types";

const AuditLogs: React.FC = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchLogs();
  }, [action]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (action) params.action = action;
      const response = await auditLogAPI.getAuditLogs(params);
      setLogs(response.logs || []);
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (!search) return true;
    return (
      log.performedBy?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      log.performedByEmployeeId?.toLowerCase().includes(search.toLowerCase()) ||
      log.targetUser?.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      log.targetUserEmployeeId?.toLowerCase().includes(search.toLowerCase()) ||
      log.action?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Audit Logs</h2>
        <input
          type="text"
          placeholder="Search by name, ID, action..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="input-field w-64"
        />
      </div>
      <div className="mb-4">
        <label className="block text-sm font-medium">Action</label>
        <select value={action} onChange={e => setAction(e.target.value)} className="input-field">
          <option value="">All Actions</option>
          <option value="user_created">User Created</option>
          <option value="user_updated">User Updated</option>
          <option value="user_deleted">User Deleted</option>
          <option value="delegation_requested">Delegation Requested</option>
          <option value="delegation_approved">Delegation Approved</option>
          <option value="delegation_rejected">Delegation Rejected</option>
          <option value="delegation_activated">Delegation Activated</option>
          <option value="delegation_cancelled">Delegation Cancelled</option>
          <option value="request_created">Request Created</option>
          <option value="request_approved">Request Approved</option>
          <option value="request_rejected">Request Rejected</option>
          <option value="request_checked_in">Request Checked In</option>
          <option value="request_checked_out">Request Checked Out</option>
        </select>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2">Timestamp</th>
              <th className="px-4 py-2">Action</th>
              <th className="px-4 py-2">By (Employee ID)</th>
              <th className="px-4 py-2">Target (Employee ID)</th>
              <th className="px-4 py-2">Details</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log._id}>
                <td className="px-4 py-2 text-xs">{new Date(log.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2 text-xs">{log.action}</td>
                <td className="px-4 py-2 text-xs">{log.performedBy?.fullName} ({log.performedByEmployeeId})</td>
                <td className="px-4 py-2 text-xs">{log.targetUser?.fullName || "-"} {log.targetUserEmployeeId ? `(${log.targetUserEmployeeId})` : ""}</td>
                <td className="px-4 py-2 text-xs">{JSON.stringify(log.details)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {loading && <div className="text-center py-4">Loading...</div>}
        {!loading && filteredLogs.length === 0 && <div className="text-center py-4 text-gray-500">No logs found.</div>}
      </div>
    </div>
  );
};

export default AuditLogs; 