import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import toast from "react-hot-toast";
import type { VisitorRequest } from "../types";

const CheckInOut: React.FC = () => {
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

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
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-header">
          <h2 className="text-2xl font-bold mb-4 text-gray-900 dark:text-gray-100">Visitor Check In/Out</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : visitors.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">No visitors to check in/out.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">National ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Photo</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {visitors.map(v => (
                    <tr key={v._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{v.visitorName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{v.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{v.nationalId}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {v.photo ? (
                          <button onClick={() => v.photo ? setPhotoPreview(v.photo.startsWith("/uploads") ? v.photo : `/uploads/${v.photo}`) : undefined} className="focus:outline-none">
                            <img src={v.photo.startsWith("/uploads") ? v.photo : `/uploads/${v.photo}`} alt="Visitor" className="h-12 w-12 object-cover rounded-full border hover:scale-110 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Photo</span>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap capitalize">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          v.status === 'approved' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' :
                          v.status === 'checked_in' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' :
                          v.status === 'checked_out' ? 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' :
                          'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
                        }`}>
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                        {v.status === "approved" && (
                          <button
                            className="btn-primary"
                            disabled={processingId === v._id}
                            onClick={() => handleCheckIn(v._id)}
                          >
                            {processingId === v._id ? 'Checking In...' : 'Check In'}
                          </button>
                        )}
                        {v.status === "checked_in" && (
                          <button
                            className="btn-success"
                            disabled={processingId === v._id}
                            onClick={() => handleCheckOut(v._id)}
                          >
                            {processingId === v._id ? 'Checking Out...' : 'Check Out'}
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
      </div>
      {photoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setPhotoPreview(null)}>
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            <img src={photoPreview} alt="Visitor Preview" className="max-w-xs max-h-[70vh] rounded-lg border" />
          </div>
        </div>
      )}
    </div>
  );
};

export default CheckInOut;
