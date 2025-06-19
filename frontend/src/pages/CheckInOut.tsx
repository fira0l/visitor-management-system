import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import toast from "react-hot-toast";
import type { VisitorRequest } from "../types";

const CheckInOut: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchVisitors = async () => {
      setLoading(true);
      setError("");
      try {
        const data = await visitorAPI.getRequests();
        setVisitors((data.requests || data).filter((v: VisitorRequest) => ["approved", "checked_in"].includes(v.status)));
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load visitors");
      } finally {
        setLoading(false);
      }
    };
    fetchVisitors();
  }, []);

  const handleCheckIn = async (id: string) => {
    setProcessingId(id);
    try {
      await visitorAPI.checkIn(id, {});
      toast.success("Visitor checked in!");
      setVisitors(visitors.map(v => v._id === id ? { ...v, status: "checked_in" } : v));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check-in failed");
    } finally {
      setProcessingId(null);
    }
  };

  const handleCheckOut = async (id: string) => {
    setProcessingId(id);
    try {
      await visitorAPI.checkOut(id, {});
      toast.success("Visitor checked out!");
      setVisitors(visitors.map(v => v._id === id ? { ...v, status: "checked_out" } : v));
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check-out failed");
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="max-w-5xl mx-auto p-6 bg-white rounded-lg shadow mt-8">
      <h2 className="text-2xl font-bold mb-4">Visitor Check In/Out</h2>
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : visitors.length === 0 ? (
        <div className="text-gray-500 py-4 text-center">No visitors to check in/out.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {visitors.map(v => (
                <tr key={v._id}>
                  <td className="px-4 py-2 whitespace-nowrap">{v.visitorName}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{v.purpose}</td>
                  <td className="px-4 py-2 whitespace-nowrap capitalize">{v.status.replace("_", " ")}</td>
                  <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                    {v.status === "approved" && (
                      <button
                        className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition-colors"
                        disabled={processingId === v._id}
                        onClick={() => handleCheckIn(v._id)}
                      >
                        Check In
                      </button>
                    )}
                    {v.status === "checked_in" && (
                      <button
                        className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 transition-colors"
                        disabled={processingId === v._id}
                        onClick={() => handleCheckOut(v._id)}
                      >
                        Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;
