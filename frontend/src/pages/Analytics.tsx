import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import type { Analytics, DepartmentStat } from "../types";

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await visitorAPI.getAnalytics();
        setAnalytics(data.analytics);
        setDepartmentStats(data.departmentStats);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load analytics");
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">System Analytics</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : analytics ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-100 rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-2xl font-bold text-blue-600">
                {analytics.totalRequests}
              </span>
              <span className="text-gray-700 mt-2">Total Requests</span>
            </div>
            <div className="bg-green-100 rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-2xl font-bold text-green-600">
                {analytics.approvedRequests}
              </span>
              <span className="text-gray-700 mt-2">Approved</span>
            </div>
            <div className="bg-red-100 rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-2xl font-bold text-red-600">
                {analytics.declinedRequests}
              </span>
              <span className="text-gray-700 mt-2">Declined</span>
            </div>
            <div className="bg-yellow-100 rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-2xl font-bold text-yellow-600">
                {analytics.pendingRequests}
              </span>
              <span className="text-gray-700 mt-2">Pending</span>
            </div>
            <div className="bg-indigo-100 rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-2xl font-bold text-indigo-600">
                {analytics.checkedInRequests}
              </span>
              <span className="text-gray-700 mt-2">Checked In</span>
            </div>
            <div className="bg-gray-100 rounded-lg shadow p-6 flex flex-col items-center">
              <span className="text-2xl font-bold text-gray-600">
                {analytics.checkedOutRequests}
              </span>
              <span className="text-gray-700 mt-2">Checked Out</span>
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 mt-8">
            <h3 className="text-lg font-semibold mb-4">Department Stats</h3>
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Department
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Requests
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Approved
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {departmentStats.map((stat) => (
                  <tr key={stat._id}>
                    <td className="px-4 py-2 whitespace-nowrap">{stat._id}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{stat.count}</td>
                    <td className="px-4 py-2 whitespace-nowrap">{stat.approved}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {departmentStats.length === 0 && (
              <div className="text-gray-500 py-4 text-center">
                No department data.
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
};

export default AnalyticsPage;
