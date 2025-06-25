import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import toast from "react-hot-toast";
import type { VisitorRequest } from "../types";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-blue-100 text-blue-800",
  declined: "bg-red-100 text-red-800",
};

const SecurityReview: React.FC = () => {
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewComments, setReviewComments] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

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

  const filteredRequests = requests.filter(r => r.status === statusFilter);

  const handleReview = async (id: string, status: "approved" | "declined") => {
    setReviewingId(id);
    try {
      await visitorAPI.reviewRequest(id, { status, reviewComments });
      toast.success(`Request ${status}`);
      setRequests(requests.map(r => r._id === id ? { ...r, status, reviewComments } : r));
      setReviewComments("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to review request");
    } finally {
      setReviewingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-header flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Visitor Requests (Security Review)</h2>
          <div className="flex gap-2 items-center">
            <label className="font-medium text-gray-700 dark:text-gray-300">Filter by status:</label>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="input-field bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="declined">Declined</option>
            </select>
          </div>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-gray-500 dark:text-gray-300 py-4 text-center">No requests found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredRequests.map(r => (
                    <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.visitorName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{r.scheduledDate?.slice(0, 10)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${statusColors[r.status] || "bg-gray-100 text-gray-800"}`}>{r.status.replace("_", " ")}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap flex flex-col gap-2 min-w-[180px]">
                        {r.status === "pending" && (
                          <>
                            <textarea
                              className="input-field mb-2 w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700"
                              placeholder="Review comments (optional)"
                              value={reviewingId === r._id ? reviewComments : ""}
                              onChange={e => setReviewComments(e.target.value)}
                              disabled={reviewingId !== r._id}
                            />
                            <div className="flex gap-2">
                              <button
                                className="btn-success flex-1"
                                disabled={reviewingId === r._id}
                                onClick={() => handleReview(r._id, "approved")}
                              >
                                Approve
                              </button>
                              <button
                                className="btn-danger flex-1"
                                disabled={reviewingId === r._id}
                                onClick={() => handleReview(r._id, "declined")}
                              >
                                Decline
                              </button>
                            </div>
                          </>
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
    </div>
  );
};

export default SecurityReview;
