import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import type { VisitorRequest } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FaChartBar } from "react-icons/fa";
import toast from "react-hot-toast";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  pending_division_approval: "bg-orange-100 text-orange-800",
  approved: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-800",
  checked_in: "bg-green-100 text-green-800",
  checked_out: "bg-gray-100 text-gray-800",
  expired: "bg-gray-200 text-gray-500",
};

const VisitorRequests: React.FC = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [myStatusStats, setMyStatusStats] = useState({ approved: 0, declined: 0, pending: 0, pendingDivisionApproval: 0, checkedIn: 0, checkedOut: 0 });
  const [locationFilter, setLocationFilter] = useState("");
  const [gateFilter, setGateFilter] = useState("");
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [approvalComments, setApprovalComments] = useState("");
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<VisitorRequest | null>(null);

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const params: any = {};
        if (locationFilter) params.location = locationFilter;
        if (gateFilter) params.gateAssignment = gateFilter;
        const data = await visitorAPI.getRequests(params);
        setRequests(data.requests || data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, [locationFilter, gateFilter]);

  // Real-time status stats for department_user
  useEffect(() => {
    if (user?.role !== "department_user") return;
    let interval: NodeJS.Timeout;
    const fetchMyStats = async () => {
      try {
        const params: any = {};
        if (locationFilter) params.location = locationFilter;
        if (gateFilter) params.gateAssignment = gateFilter;
        const data = await visitorAPI.getRequests(params);
        const myRequests = (data.requests || data).filter((v: VisitorRequest) => v.requestedBy?.username === user?.username);
        setMyStatusStats({
          approved: myRequests.filter((v: VisitorRequest) => v.status === "approved").length,
          declined: myRequests.filter((v: VisitorRequest) => v.status === "declined").length,
          pending: myRequests.filter((v: VisitorRequest) => v.status === "pending").length,
          pendingDivisionApproval: myRequests.filter((v: VisitorRequest) => v.status === "pending_division_approval").length,
          checkedIn: myRequests.filter((v: VisitorRequest) => v.status === "checked_in").length,
          checkedOut: myRequests.filter((v: VisitorRequest) => v.status === "checked_out").length,
        });
      } catch {}
    };
    fetchMyStats();
    interval = setInterval(fetchMyStats, 10000);
    return () => clearInterval(interval);
  }, [user?.role, user?.username, locationFilter, gateFilter]);

  const myRequests = requests.filter(r => r.requestedBy?.username === user?.username);
  const divisionRequests = user?.role === "department_user" && user?.departmentRole === "division_head" 
    ? requests.filter(r => r.department === user?.department && (r.status === "pending" || r.status === "pending_division_approval"))
    : [];
  
  // Filter requests based on user role
  const getFilteredRequests = () => {
    switch (user?.role) {
      case "department_user":
        return myRequests;
      case "gate":
        return requests.filter(r => r.status === "approved" || r.status === "checked_in");
      case "security":
        return requests; // Security can view all requests (read-only)
      case "admin":
        return requests;
      default:
        return myRequests;
    }
  };
  
  const filteredRequestsForRole = getFilteredRequests();

  const handleApproval = async (requestId: string, approvalType: "own_risk" | "division_approval") => {
    setApprovingId(requestId);
    try {
      await visitorAPI.approveRequest(requestId, { approvalType, approvalComments });
      toast.success(approvalType === "own_risk" ? "Request approved by own risk" : "Request sent for division approval");
      
      // Refresh requests
      const data = await visitorAPI.getRequests();
      setRequests(data.requests || data);
      setApprovalComments("");
      setShowApprovalModal(false);
      setSelectedRequest(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process approval");
    } finally {
      setApprovingId(null);
    }
  };

  const handleDivisionApproval = async (requestId: string, status: "approved" | "declined") => {
    setApprovingId(requestId);
    try {
      await visitorAPI.divisionApproval(requestId, { status, approvalComments });
      toast.success(`Request ${status} by division head`);
      
      // Refresh requests
      const data = await visitorAPI.getRequests();
      setRequests(data.requests || data);
      setApprovalComments("");
      setShowApprovalModal(false);
      setSelectedRequest(null);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to process approval");
    } finally {
      setApprovingId(null);
    }
  };

  const openApprovalModal = (request: VisitorRequest) => {
    setSelectedRequest(request);
    setShowApprovalModal(true);
    setApprovalComments("");
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      {/* Location Filter */}
      <div className="mb-6 flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Location:</label>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className="input-field bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
        >
          <option value="">All Locations</option>
          <option value="Wollo Sefer">Wollo Sefer</option>
          <option value="Operation">Operation</option>
        </select>
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter by Gate:</label>
        <select
          value={gateFilter}
          onChange={(e) => setGateFilter(e.target.value)}
          className="input-field bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
        >
          <option value="">All Gates</option>
          <option value="Gate 1">Gate 1</option>
          <option value="Gate 2">Gate 2</option>
          <option value="Gate 3">Gate 3</option>
        </select>
      </div>
      {/* Department User status chart */}
      {user?.role === "department_user" && (
        <div className="card mb-8 animate-fade-in bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <div className="card-header flex items-center gap-2">
            <FaChartBar className="text-indigo-500" />
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">My Request Status Overview (Real-time)</h3>
          </div>
          <div className="card-body">
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={[
                { status: "Approved", value: myStatusStats.approved },
                { status: "Declined", value: myStatusStats.declined },
                { status: "Pending", value: myStatusStats.pending },
                { status: "Pending Div. Approval", value: myStatusStats.pendingDivisionApproval },
                { status: "Checked In", value: myStatusStats.checkedIn },
                { status: "Checked Out", value: myStatusStats.checkedOut },
              ]} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'} />
                <XAxis dataKey="status" stroke={document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151'} />
                <YAxis allowDecimals={false} stroke={document.documentElement.classList.contains('dark') ? '#d1d5db' : '#374151'} />
                <Tooltip contentStyle={{ background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff', color: document.documentElement.classList.contains('dark') ? '#fff' : '#111' }} />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      
      {/* Division Head Approval Section */}
      {user?.role === "department_user" && user?.departmentRole === "division_head" && divisionRequests.length > 0 && (
        <div className="card mb-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Pending Approvals ({divisionRequests.length})</h2>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gate & Search</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requested By</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {divisionRequests.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.visitorName}</td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        <div>
                          <div className="font-medium text-blue-600 dark:text-blue-400">{r.gateAssignment}</div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            r.searchRequired === 'required' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {r.searchRequired === 'required' ? 'Search Required' : 'No Search'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{r.requestedBy?.fullName}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[r.status] || "bg-gray-100 text-gray-800"}`}>
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <button
                          onClick={() => openApprovalModal(r)}
                          disabled={approvingId === r._id}
                          className="btn-primary text-sm px-3 py-1"
                        >
                          {approvingId === r._id ? "Processing..." : "Review"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {user?.role === "department_user" ? "My Visitor Requests" :
             user?.role === "gate" ? "Approved Visitors (Gate Access)" :
             user?.role === "security" ? "All Visitor Requests (Read-Only)" :
             "Visitor Requests"}
          </h2>
          {(user?.role === "gate" || user?.role === "security") && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total: {filteredRequestsForRole.length} requests
            </div>
          )}
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : filteredRequestsForRole.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">
              {user?.role === "gate" ? "No approved visitors found." :
               user?.role === "security" ? "No visitor requests found." :
               "No requests found."}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    {(user?.role === "gate" || user?.role === "security" || user?.role === "admin") && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requested By</th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gate & Search</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visit Type & Details</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    {user?.role === "gate" && (
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Approval Info</th>
                    )}
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequestsForRole.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">
                        <div>
                          <div className="font-medium">{r.visitorName}</div>
                          <div className="text-sm text-gray-500">ID: {r.visitorId}</div>
                          {r.approvalCode && (
                            <div className="text-xs text-blue-600 dark:text-blue-400">Code: {r.approvalCode}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{r.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        <div>
                          <div>{r.scheduledDate?.slice(0, 10)}</div>
                          <div className="text-sm text-gray-500">{r.scheduledTime}</div>
                        </div>
                      </td>
                      {(user?.role === "gate" || user?.role === "security" || user?.role === "admin") && (
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          <div>
                            <div className="font-medium">{r.requestedBy?.fullName}</div>
                            <div className="text-sm text-gray-500">{r.department}</div>
                          </div>
                        </td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        <div>
                          <div className="font-medium text-blue-600 dark:text-blue-400">{r.gateAssignment}</div>
                          <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                            r.searchRequired === 'required' 
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' 
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {r.searchRequired === 'required' ? 'Search Required' : 'No Search'}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {r.isGroupVisit ? (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                              Group Visit
                            </span>
                            <div className="text-xs text-gray-500 mt-1">
                              {r.companyName} ({r.groupSize} people)
                            </div>
                          </div>
                        ) : (
                          <div>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                              Individual
                            </span>
                            {r.originDepartment && (
                              <div className="text-xs text-gray-500 mt-1">
                                From: {r.originDepartment}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[r.status] || "bg-gray-100 text-gray-800"}`}>
                          {r.status.replace("_", " ")}
                        </span>
                        {r.approvedBy && user?.role === "department_user" && (
                          <div className="text-xs text-gray-500 mt-1">
                            Approved by: {r.approvedBy.fullName}
                          </div>
                        )}
                      </td>
                      {user?.role === "gate" && (
                        <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                          {r.approvedBy && (
                            <div>
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                ✓ {r.approvedBy.fullName}
                              </div>
                              <div className="text-xs text-gray-500">
                                {r.approvalType === "own_risk" ? "Own Risk" : "Division Approved"}
                              </div>
                              {r.approvalComments && (
                                <div className="text-xs text-gray-500 mt-1 max-w-xs truncate" title={r.approvalComments}>
                                  {r.approvalComments}
                                </div>
                              )}
                            </div>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-2 whitespace-nowrap">
                        {user?.role === "gate" && r.status === "approved" && (
                          <button className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700">
                            Check In
                          </button>
                        )}
                        {user?.role === "gate" && r.status === "checked_in" && (
                          <button className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700">
                            Check Out
                          </button>
                        )}
                        {user?.role === "security" && (
                          <span className="text-sm text-gray-500">View Only</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      {/* Approval Modal */}
      {showApprovalModal && selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">
              {selectedRequest.status === "pending" ? "Approve Visitor Request" : "Division Approval"}
            </h3>
            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Visitor:</strong> {selectedRequest.visitorName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Purpose:</strong> {selectedRequest.purpose}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Requested by:</strong> {selectedRequest.requestedBy?.fullName}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                <strong>Gate Assignment:</strong> {selectedRequest.gateAssignment}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                <strong>Search Required:</strong> {selectedRequest.searchRequired === 'required' ? 'Yes' : 'No'}
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Comments
              </label>
              <textarea
                value={approvalComments}
                onChange={(e) => setApprovalComments(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                rows={3}
                placeholder="Add approval comments..."
              />
            </div>
            <div className="flex gap-2">
              {selectedRequest.status === "pending" ? (
                <>
                  <button
                    onClick={() => handleApproval(selectedRequest._id, "own_risk")}
                    disabled={approvingId === selectedRequest._id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve by Own Risk
                  </button>
                  <button
                    onClick={() => handleApproval(selectedRequest._id, "division_approval")}
                    disabled={approvingId === selectedRequest._id}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    Request Division Approval
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => handleDivisionApproval(selectedRequest._id, "approved")}
                    disabled={approvingId === selectedRequest._id}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleDivisionApproval(selectedRequest._id, "declined")}
                    disabled={approvingId === selectedRequest._id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    Decline
                  </button>
                </>
              )}
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedRequest(null);
                  setApprovalComments("");
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VisitorRequests;
