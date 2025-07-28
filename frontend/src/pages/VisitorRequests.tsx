import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import { useAuth } from "../contexts/AuthContext.tsx";
import type { VisitorRequest } from "../types";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { FaChartBar } from "react-icons/fa";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
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
  const [myStatusStats, setMyStatusStats] = useState({ approved: 0, declined: 0, pending: 0, checkedIn: 0, checkedOut: 0 });
  const [locationFilter, setLocationFilter] = useState("");
  const [gateFilter, setGateFilter] = useState("");

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
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">My Visitor Requests</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : myRequests.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">No requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visit Type & Details</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Gate/Access</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {myRequests.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.visitorName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{r.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{r.scheduledDate?.slice(0, 10)}</td>
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
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {r.gateAssignment && r.accessType ? `${r.gateAssignment} (${r.accessType})` : '-'}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          r.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          r.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                          r.status === 'declined' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' :
                          r.status === 'checked_in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          r.status === 'checked_out' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {r.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {/* You can add view/cancel/edit actions here if needed */}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VisitorRequests;
