import React, { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { visitorAPI } from "../services/api.ts";
import type { VisitorRequest } from "../types";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVisitors = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await visitorAPI.getRequests();
        setVisitors(data.requests || data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load visitors");
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayVisitors = visitors.filter(v => v.scheduledDate?.slice(0, 10) === today && v.status === "approved");
  const checkedIn = visitors.filter(v => v.scheduledDate?.slice(0, 10) === today && v.status === "checked_in").length;
  const checkedOut = visitors.filter(v => v.scheduledDate?.slice(0, 10) === today && v.status === "checked_out").length;
  const pending = visitors.filter(v => v.scheduledDate?.slice(0, 10) === today && v.status === "approved").length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.fullName || user?.username}!</h1>
      <p className="text-lg text-gray-600 mb-6">Role: <span className="font-semibold capitalize">{user?.role.replace("_", " ")}</span></p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-blue-600">{checkedIn}</span>
          <span className="text-gray-700 mt-2">Checked In Today</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-green-600">{checkedOut}</span>
          <span className="text-gray-700 mt-2">Checked Out Today</span>
        </div>
        <div className="bg-white rounded-lg shadow p-6 flex flex-col items-center">
          <span className="text-2xl font-bold text-yellow-600">{pending}</span>
          <span className="text-gray-700 mt-2">Pending Check-In</span>
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Today's Approved Visitors</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {todayVisitors.filter(v => v.status === "approved" || v.status === "checked_in").map(v => (
                  <tr key={v._id}>
                    <td className="px-4 py-2 whitespace-nowrap">{v.visitorName}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{v.purpose}</td>
                    <td className="px-4 py-2 whitespace-nowrap capitalize">{v.status.replace("_", " ")}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      {/* Action buttons for check-in/check-out can be added here */}
                      <button className="bg-blue-600 text-white px-3 py-1 rounded mr-2 hover:bg-blue-700 transition-colors">Check In</button>
                      <button className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors">Check Out</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {todayVisitors.filter(v => v.status === "approved" || v.status === "checked_in").length === 0 && (
              <div className="text-gray-500 py-4 text-center">No visitors for today.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
