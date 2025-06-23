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

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await visitorAPI.getRequests();
        setRequests(data.requests || data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load requests");
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Real-time status stats for department_user
  useEffect(() => {
    if (user?.role !== "department_user") return;
    let interval: NodeJS.Timeout;
    const fetchMyStats = async () => {
      try {
        const data = await visitorAPI.getRequests();
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
  }, [user?.role, user?.username]);

  const myRequests = requests.filter(r => r.requestedBy?.username === user?.username);

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      {/* Department User status chart */}
      {user?.role === "department_user" && (
        <div className="card mb-8 animate-fade-in">
          <div className="card-header flex items-center gap-2">
            <FaChartBar className="text-indigo-500" />
            <h3 className="text-lg font-semibold mb-4">My Request Status Overview (Real-time)</h3>
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
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-2xl font-bold">My Visitor Requests</h2>
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myRequests.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">{r.visitorName}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{r.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{r.scheduledDate?.slice(0, 10)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[r.status] || "bg-gray-100 text-gray-800"}`}>
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
