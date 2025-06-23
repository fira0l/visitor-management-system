import React, { useEffect, useState } from "react";
import { visitorAPI } from "../services/api.ts";
import toast from "react-hot-toast";
import type { VisitorRequest } from "../types";
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowDownTrayIcon,
  EyeIcon,
  CalendarIcon,
  UserGroupIcon,
  BuildingOfficeIcon
} from "@heroicons/react/24/outline";

const AdminLogs: React.FC = () => {
  const [requests, setRequests] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    dateFrom: "",
    dateTo: "",
    search: "",
  });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRequests, setTotalRequests] = useState(0);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editRequest, setEditRequest] = useState<VisitorRequest | null>(null);
  const [editForm, setEditForm] = useState({ nationalId: "", photo: null as File | null });
  const [editLoading, setEditLoading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    approved: "bg-blue-100 text-blue-800 border-blue-200",
    declined: "bg-red-100 text-red-800 border-red-200",
    checked_in: "bg-green-100 text-green-800 border-green-200",
    checked_out: "bg-gray-100 text-gray-800 border-gray-200",
    expired: "bg-gray-200 text-gray-500 border-gray-300",
  };

  useEffect(() => {
    fetchRequests();
  }, [filters, currentPage]);

  const fetchRequests = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {
        ...filters,
        page: currentPage,
        limit: 20,
      };
      const data = await visitorAPI.getRequests(params);
      setRequests(data.requests || []);
      setTotalPages(data.totalPages || 1);
      setTotalRequests(data.total || 0);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load requests");
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      department: "",
      dateFrom: "",
      dateTo: "",
      search: "",
    });
    setCurrentPage(1);
  };

  const exportToCSV = () => {
    const headers = [
      "Visitor Name",
      "Visitor ID",
      "Visitor Phone",
      "Visitor Email",
      "Purpose",
      "Department",
      "Requested By",
      "Scheduled Date",
      "Scheduled Time",
      "Status",
      "Review Comments",
      "Created At",
      "Updated At"
    ];

    const csvData = requests.map(req => [
      req.visitorName,
      req.visitorId,
      req.visitorPhone,
      req.visitorEmail || "",
      req.purpose,
      req.department,
      req.requestedBy?.fullName || "",
      req.scheduledDate?.slice(0, 10) || "",
      req.scheduledTime || "",
      req.status,
      req.reviewComments || "",
      new Date(req.createdAt).toLocaleString(),
      new Date(req.updatedAt).toLocaleString()
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `visitor-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success("CSV exported successfully!");
  };

  const getStatusCounts = () => {
    const counts = {
      pending: 0,
      approved: 0,
      declined: 0,
      checked_in: 0,
      checked_out: 0,
      expired: 0,
    };
    requests.forEach(req => {
      counts[req.status as keyof typeof counts]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  const openEditModal = (request: VisitorRequest) => {
    setEditRequest(request);
    setEditForm({ nationalId: request.nationalId, photo: null });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditRequest(null);
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, files } = e.target;
    if (name === "photo" && files) {
      setEditForm((prev) => ({ ...prev, photo: files[0] }));
    } else {
      setEditForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRequest) return;
    setEditLoading(true);
    try {
      const formData = new FormData();
      formData.append("nationalId", editForm.nationalId);
      if (editForm.photo) formData.append("photo", editForm.photo);
      await visitorAPI.updateRequest(editRequest._id, formData);
      toast.success("Visitor request updated");
      closeEditModal();
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update request");
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this visitor request?")) return;
    try {
      await visitorAPI.deleteRequest(id);
      toast.success("Visitor request deleted");
      fetchRequests();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete request");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Visitor Management Logs</h1>
            <p className="text-gray-600 mt-2">Comprehensive view of all visitor requests and activities</p>
          </div>
          <div className="flex gap-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FunnelIcon className="h-4 w-4 mr-2" />
              Filters
            </button>
            <button
              onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            >
              <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {Object.entries(statusCounts).map(([status, count]) => (
            <div key={status} className="bg-gray-50 rounded-lg p-4 text-center">
              <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status]}`}>
                {status.replace("_", " ")}
              </div>
              <div className="text-2xl font-bold text-gray-900 mt-2">{count}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
              <div className="relative">
                <MagnifyingGlassIcon className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Visitor name, ID, or purpose..."
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  className="pl-10 w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange("status", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="declined">Declined</option>
                <option value="checked_in">Checked In</option>
                <option value="checked_out">Checked Out</option>
                <option value="expired">Expired</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange("department", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                <option value="IT">IT</option>
                <option value="HR">HR</option>
                <option value="Finance">Finance</option>
                <option value="Marketing">Marketing</option>
                <option value="Operations">Operations</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={clearFilters}
                className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">
              Results ({totalRequests} total)
            </h3>
            <div className="text-sm text-gray-500">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-sm shadow rounded-md text-white bg-blue-500 hover:bg-blue-400 transition ease-in-out duration-150 cursor-not-allowed">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Loading...
            </div>
          </div>
        ) : error ? (
          <div className="p-8 text-center text-red-600">{error}</div>
        ) : requests.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <UserGroupIcon className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p>No requests found matching your criteria.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Schedule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">National ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{request.visitorName}</div>
                          <div className="text-sm text-gray-500">ID: {request.visitorId}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.visitorPhone}</div>
                        {request.visitorEmail && (
                          <div className="text-sm text-gray-500">{request.visitorEmail}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-xs truncate">{request.purpose}</div>
                        {request.itemsBrought && request.itemsBrought.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            Items: {request.itemsBrought.join(", ")}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.department}</div>
                        <div className="text-sm text-gray-500">
                          by {request.requestedBy?.fullName || "Unknown"}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {request.scheduledDate?.slice(0, 10)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {request.scheduledTime}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{request.nationalId}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {request.photo ? (
                          <button onClick={() => setPhotoPreview(request.photo.startsWith("/uploads") ? request.photo : `/uploads/${request.photo}`)} className="focus:outline-none">
                            <img src={request.photo.startsWith("/uploads") ? request.photo : `/uploads/${request.photo}`} alt="Visitor" className="h-12 w-12 object-cover rounded-full border hover:scale-110 transition-transform" />
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Photo</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[request.status]}`}>
                          {request.status.replace("_", " ")}
                        </span>
                        {request.reviewComments && (
                          <div className="text-xs text-gray-500 mt-1 max-w-xs truncate">
                            {request.reviewComments}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-colors" title="View/Edit" onClick={() => openEditModal(request)}>
                          <EyeIcon className="h-4 w-4" />
                        </button>
                        <button className="text-yellow-600 hover:text-yellow-900 transition-colors" title="Edit" onClick={() => openEditModal(request)}>
                          Edit
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-colors" title="Delete" onClick={() => handleDelete(request._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{" "}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Previous
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              page === currentPage
                                ? "z-10 bg-blue-50 border-blue-500 text-blue-600"
                                : "bg-white border-gray-300 text-gray-500 hover:bg-gray-50"
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Next
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {editModalOpen && editRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative">
            <button onClick={closeEditModal} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">&times;</button>
            <h2 className="text-lg font-bold mb-4">Edit Visitor Request</h2>
            <form onSubmit={handleEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">National ID</label>
                <input name="nationalId" value={editForm.nationalId} onChange={handleEditFormChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Photo</label>
                <input name="photo" type="file" accept="image/*" onChange={handleEditFormChange} className="input-field mt-1" />
                {editRequest.photo && (
                  <img src={editRequest.photo.startsWith("/uploads") ? editRequest.photo : `/uploads/${editRequest.photo}`} alt="Current" className="h-16 w-16 object-cover rounded-full border mt-2" />
                )}
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeEditModal} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={editLoading} className="btn-primary">{editLoading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {photoPreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60" onClick={() => setPhotoPreview(null)}>
          <div className="bg-white rounded-lg shadow-lg p-4 relative" onClick={e => e.stopPropagation()}>
            <button onClick={() => setPhotoPreview(null)} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            <img src={photoPreview} alt="Visitor Preview" className="max-w-xs max-h-[70vh] rounded-lg border" />
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs; 