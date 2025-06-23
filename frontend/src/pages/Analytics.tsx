import React, { useEffect, useState, useRef } from "react";
import { visitorAPI } from "../services/api.ts";
import type { Analytics, DepartmentStat } from "../types";
import { FaChartPie, FaChartBar, FaCheckCircle, FaTimesCircle, FaHourglassHalf, FaUserCheck, FaUserTimes } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

const AnalyticsPage: React.FC = () => {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout;
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
    interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, []);

  // Animated counter hook
  function useCountUp(value: number, duration = 800) {
    const [count, setCount] = useState(0);
    const ref = useRef<number | null>(null);
    useEffect(() => {
      let start = 0;
      let startTime: number | null = null;
      function animate(ts: number) {
        if (!startTime) startTime = ts;
        const progress = Math.min((ts - startTime) / duration, 1);
        setCount(Math.floor(progress * (value - start) + start));
        if (progress < 1) ref.current = requestAnimationFrame(animate);
        else setCount(value);
      }
      ref.current = requestAnimationFrame(animate);
      return () => {
        if (ref.current !== null) cancelAnimationFrame(ref.current);
      };
    }, [value, duration]);
    return count;
  }

  // Prepare animated values for stat cards (always call hooks in the same order)
  const totalRequests = useCountUp(analytics?.totalRequests ?? 0);
  const approvedRequests = useCountUp(analytics?.approvedRequests ?? 0);
  const declinedRequests = useCountUp(analytics?.declinedRequests ?? 0);
  const pendingRequests = useCountUp(analytics?.pendingRequests ?? 0);
  const checkedInRequests = useCountUp(analytics?.checkedInRequests ?? 0);
  const checkedOutRequests = useCountUp(analytics?.checkedOutRequests ?? 0);

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="card">
        <div className="card-header">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <FaChartPie className="text-indigo-500 animate-pop-in" /> System Analytics
          </h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4 animate-fade-in">{error}</div>
          ) : analytics ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-blue-100 rounded-lg shadow p-6 flex flex-col items-center animate-fade-in">
                  <FaChartBar className="text-blue-600 mb-2" />
                  <span className="text-2xl font-bold text-blue-600">{totalRequests}</span>
                  <span className="text-gray-700 mt-2">Total Requests</span>
                </div>
                <div className="bg-green-100 rounded-lg shadow p-6 flex flex-col items-center animate-fade-in">
                  <FaCheckCircle className="text-green-600 mb-2" />
                  <span className="text-2xl font-bold text-green-600">{approvedRequests}</span>
                  <span className="text-gray-700 mt-2">Approved</span>
                </div>
                <div className="bg-red-100 rounded-lg shadow p-6 flex flex-col items-center animate-fade-in">
                  <FaTimesCircle className="text-red-600 mb-2" />
                  <span className="text-2xl font-bold text-red-600">{declinedRequests}</span>
                  <span className="text-gray-700 mt-2">Declined</span>
                </div>
                <div className="bg-yellow-100 rounded-lg shadow p-6 flex flex-col items-center animate-fade-in">
                  <FaHourglassHalf className="text-yellow-600 mb-2" />
                  <span className="text-2xl font-bold text-yellow-600">{pendingRequests}</span>
                  <span className="text-gray-700 mt-2">Pending</span>
                </div>
                <div className="bg-indigo-100 rounded-lg shadow p-6 flex flex-col items-center animate-fade-in">
                  <FaUserCheck className="text-indigo-600 mb-2" />
                  <span className="text-2xl font-bold text-indigo-600">{checkedInRequests}</span>
                  <span className="text-gray-700 mt-2">Checked In</span>
                </div>
                <div className="bg-gray-100 rounded-lg shadow p-6 flex flex-col items-center animate-fade-in">
                  <FaUserTimes className="text-gray-600 mb-2" />
                  <span className="text-2xl font-bold text-gray-600">{checkedOutRequests}</span>
                  <span className="text-gray-700 mt-2">Checked Out</span>
                </div>
              </div>
              <div className="card mt-8 animate-fade-in">
                <div className="card-header flex items-center gap-2">
                  <FaChartBar className="text-indigo-500" />
                  <h3 className="text-lg font-semibold mb-4">Department Stats</h3>
                </div>
                <div className="card-body">
                  {departmentStats.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={departmentStats} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="_id" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="approved" fill="#22c55e" name="Approved" />
                        <Bar dataKey="declined" fill="#ef4444" name="Declined" />
                        <Bar dataKey="pending" fill="#eab308" name="Pending" />
                        <Bar dataKey="checkedIn" fill="#6366f1" name="Checked In" />
                        <Bar dataKey="checkedOut" fill="#6b7280" name="Checked Out" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="text-gray-500 py-4 text-center animate-fade-in">
                      No department data.
                    </div>
                  )}
                  <table className="min-w-full divide-y divide-gray-200 mt-8">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Department
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                          Total
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-green-600 uppercase">
                          Approved
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-red-600 uppercase">
                          Declined
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-yellow-600 uppercase">
                          Pending
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-indigo-600 uppercase">
                          Checked In
                        </th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 uppercase">
                          Checked Out
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {departmentStats.map((stat, idx) => (
                        <tr key={stat._id} className="animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                          <td className="px-4 py-2 whitespace-nowrap">{stat._id}</td>
                          <td className="px-4 py-2 whitespace-nowrap">{stat.count}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-green-600 font-semibold">{stat.approved}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-red-600 font-semibold">{stat.declined}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-yellow-600 font-semibold">{stat.pending}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-indigo-600 font-semibold">{stat.checkedIn}</td>
                          <td className="px-4 py-2 whitespace-nowrap text-gray-600 font-semibold">{stat.checkedOut}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s both; }
        @keyframes pop-in { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-pop-in { animation: pop-in 0.5s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
};

export default AnalyticsPage;
