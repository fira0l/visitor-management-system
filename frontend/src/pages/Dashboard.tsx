import React, { useEffect, useState, useRef } from "react";
import { useAuth } from "../contexts/AuthContext.tsx";
import { visitorAPI } from "../services/api.ts";
import type { VisitorRequest, DepartmentStat } from "../types";
import { FaChartBar, FaUserCheck, FaUserTimes, FaUserShield, FaUser, FaUsers } from "react-icons/fa";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import toast from "react-hot-toast";
import LoadingSpinner from "../components/LoadingSpinner.tsx";
import UserManagement from "./UserManagement.tsx";
import DelegationManagement from "./DelegationManagement.tsx";
import AuditLogs from "./AuditLogs.tsx";

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [departmentStats, setDepartmentStats] = useState<DepartmentStat[]>([]);
  const [myStatusStats, setMyStatusStats] = useState({ approved: 0, declined: 0, pending: 0, checkedIn: 0, checkedOut: 0 });
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [gateFilter, setGateFilter] = useState("");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    search: "",
    location: "",
    gateAssignment: "",
    visitType: "",
    startDate: "",
    endDate: "",
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [adminTab, setAdminTab] = useState("requests");
  const [lastFetch, setLastFetch] = useState(0);

  // Debounced fetch function to prevent excessive API calls
  const debouncedFetch = useRef<NodeJS.Timeout>();
  const fetchVisitors = async (force = false) => {
    const now = Date.now();
    if (!force && now - lastFetch < 5000) return; // Prevent fetching more than once every 5 seconds
    
    setLoading(true);
    setError("");
    try {
      const params: any = {};
      if (locationFilter) params.location = locationFilter;
      if (gateFilter) params.gateAssignment = gateFilter;
      const data = await visitorAPI.getRequests(params);
      setVisitors(data.requests || data);
      setLastFetch(now);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load visitors");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and periodic updates for visitors
  useEffect(() => {
    fetchVisitors(true);
    
    // Set up interval for periodic updates (every 30 seconds instead of 10)
    const interval = setInterval(() => {
      fetchVisitors();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [locationFilter, gateFilter]);

  // Real-time department stats for admin (reduced frequency)
  useEffect(() => {
    if (user?.role !== "admin") return;
    
    const fetchDepartmentStats = async () => {
      try {
        const params: any = {};
        if (locationFilter) params.location = locationFilter;
        if (gateFilter) params.gateAssignment = gateFilter;
        const data = await visitorAPI.getAnalytics(params);
        setDepartmentStats(data.departmentStats || []);
      } catch (error) {
        console.error("Failed to fetch department stats:", error);
      }
    };
    
    fetchDepartmentStats();
    
    // Reduced interval to 30 seconds
    const interval = setInterval(fetchDepartmentStats, 30000);
    return () => clearInterval(interval);
  }, [user?.role, locationFilter, gateFilter]);

  // Real-time department_user status stats (reduced frequency)
  useEffect(() => {
    if (user?.role !== "department_user") return;
    
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
      } catch (error) {
        console.error("Failed to fetch my stats:", error);
      }
    };
    
    fetchMyStats();
    
    // Reduced interval to 30 seconds
    const interval = setInterval(fetchMyStats, 30000);
    return () => clearInterval(interval);
  }, [user?.role, locationFilter, gateFilter, user?.username]);

  // Debounced filter changes
  useEffect(() => {
    if (debouncedFetch.current) {
      clearTimeout(debouncedFetch.current);
    }
    
    debouncedFetch.current = setTimeout(() => {
      fetchVisitors(true);
    }, 500);
    
    return () => {
      if (debouncedFetch.current) {
        clearTimeout(debouncedFetch.current);
      }
    };
  }, [filters]);

  // Real-time updates for gate role
  useEffect(() => {
    if (user?.role !== "gate") return;
    let interval: NodeJS.Timeout;
    const fetchGateVisitors = async () => {
      try {
        const params: any = {};
        if (locationFilter) params.location = locationFilter;
        if (gateFilter) params.gateAssignment = gateFilter;
        const data = await visitorAPI.getRequests(params);
        setVisitors(data.requests || data);
      } catch {}
    };
    fetchGateVisitors();
    interval = setInterval(fetchGateVisitors, 10000);
    return () => clearInterval(interval);
  }, [user?.role, locationFilter, gateFilter]);

  const today = new Date().toISOString().slice(0, 10);
  
  // Role-specific filtering
  const getRoleSpecificData = () => {
    const todayVisitors = visitors.filter(v => v.scheduledDate?.slice(0, 10) === today);
    
    switch (user?.role) {
      case "department_user":
        const myRequests = visitors.filter(v => v.requestedBy?.username === user?.username);
        return {
          pendingRequests: myRequests.filter(v => v.status === "pending").length,
          approvedRequests: myRequests.filter(v => v.status === "approved").length,
          declinedRequests: myRequests.filter(v => v.status === "declined").length,
          checkedInRequests: myRequests.filter(v => v.status === "checked_in").length,
          checkedOutRequests: myRequests.filter(v => v.status === "checked_out").length,
          todayVisitors: myRequests.filter(v => v.scheduledDate?.slice(0, 10) === today)
        };
      
      case "security":
        const pendingForReview = visitors.filter(v => v.status === "pending");
        const reviewedToday = visitors.filter(v => 
          v.reviewedAt && v.reviewedAt.toString().slice(0, 10) === today
        );
        return {
          pendingForReview: pendingForReview.length,
          approvedToday: reviewedToday.filter(v => v.status === "approved").length,
          declinedToday: reviewedToday.filter(v => v.status === "declined").length,
          totalReviewed: reviewedToday.length,
          todayVisitors: pendingForReview
        };
      
      case "gate":
        const approvedForCheckIn = visitors.filter(v => v.status === "approved");
        const checkedInToday = visitors.filter(v => v.status === "checked_in");
        const checkedOutToday = visitors.filter(v => v.status === "checked_out");
        return {
          approvedForCheckIn: approvedForCheckIn.length,
          checkedInToday: checkedInToday.length,
          checkedOutToday: checkedOutToday.length,
          todayVisitors: [...approvedForCheckIn, ...checkedInToday]
        };
      
      case "admin":
        const totalRequests = visitors.length;
        const approvedRequests = visitors.filter(v => v.status === "approved").length;
        const pendingRequests = visitors.filter(v => v.status === "pending").length;
        const declinedRequests = visitors.filter(v => v.status === "declined").length;
        const checkedInRequests = visitors.filter(v => v.status === "checked_in").length;
        const checkedOutRequests = visitors.filter(v => v.status === "checked_out").length;
        return {
          totalRequests,
          approvedRequests,
          pendingRequests,
          declinedRequests,
          checkedInRequests,
          checkedOutRequests,
          todayVisitors: todayVisitors
        };
      
      default:
        return {
          totalRequests: visitors.length,
          todayVisitors: todayVisitors
        };
    }
  };

  const roleData = getRoleSpecificData();

  const getRoleSpecificTitle = () => {
    switch (user?.role) {
      case "department_user":
        return "My Visitor Requests";
      case "security":
        return "Security Review Dashboard";
      case "gate":
        return "Gate Security Dashboard";
      case "admin":
        return "Admin Dashboard";
      default:
        return "Dashboard";
    }
  };

  const getRoleSpecificStats = () => {
    switch (user?.role) {
      case "department_user":
        return [
          { label: "Pending Requests", value: roleData.pendingRequests, color: "text-yellow-600", bgColor: "bg-yellow-100" },
          { label: "Approved Requests", value: roleData.approvedRequests, color: "text-blue-600", bgColor: "bg-blue-100" },
          { label: "Declined Requests", value: roleData.declinedRequests, color: "text-red-600", bgColor: "bg-red-100" },
          { label: "Checked In", value: roleData.checkedInRequests, color: "text-green-600", bgColor: "bg-green-100" },
          { label: "Checked Out", value: roleData.checkedOutRequests, color: "text-gray-600", bgColor: "bg-gray-100" }
        ];
      
      case "security":
        return [
          { label: "Pending for Review", value: roleData.pendingForReview, color: "text-yellow-600", bgColor: "bg-yellow-100" },
          { label: "Approved Today", value: roleData.approvedToday, color: "text-green-600", bgColor: "bg-green-100" },
          { label: "Declined Today", value: roleData.declinedToday, color: "text-red-600", bgColor: "bg-red-100" },
          { label: "Total Reviewed Today", value: roleData.totalReviewed, color: "text-blue-600", bgColor: "bg-blue-100" }
        ];
      
      case "gate":
        return [
          { label: "Approved for Check-in", value: roleData.approvedForCheckIn, color: "text-blue-600", bgColor: "bg-blue-100" },
          { label: "Checked In Today", value: roleData.checkedInToday, color: "text-green-600", bgColor: "bg-green-100" },
          { label: "Checked Out Today", value: roleData.checkedOutToday, color: "text-gray-600", bgColor: "bg-gray-100" }
        ];
      
      case "admin":
        return [
          { label: "Total Requests", value: roleData.totalRequests, color: "text-blue-600", bgColor: "bg-blue-100" },
          { label: "Pending", value: roleData.pendingRequests, color: "text-yellow-600", bgColor: "bg-yellow-100" },
          { label: "Approved", value: roleData.approvedRequests, color: "text-green-600", bgColor: "bg-green-100" },
          { label: "Declined", value: roleData.declinedRequests, color: "text-red-600", bgColor: "bg-red-100" },
          { label: "Checked In", value: roleData.checkedInRequests, color: "text-indigo-600", bgColor: "bg-indigo-100" },
          { label: "Checked Out", value: roleData.checkedOutRequests, color: "text-gray-600", bgColor: "bg-gray-100" }
        ];
      
      default:
        return [];
    }
  };

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

  // Gate status stats for today
  const gateStatusStats = (() => {
    if (user?.role !== "gate") return null;
    const today = new Date().toISOString().slice(0, 10);
    const approved = visitors.filter(v => v.status === "approved" && v.scheduledDate?.slice(0, 10) === today).length;
    const checkedIn = visitors.filter(v => v.status === "checked_in" && v.scheduledDate?.slice(0, 10) === today).length;
    const checkedOut = visitors.filter(v => v.status === "checked_out" && v.scheduledDate?.slice(0, 10) === today).length;
    return { approved, checkedIn, checkedOut };
  })();

  // Handler for gate check-in
  const handleGateCheckIn = async (id: string) => {
    setActionLoading(id + "-checkin");
    try {
      await visitorAPI.checkIn(id, {});
      toast.success("Visitor checked in successfully");
      // Refresh visitors
      const data = await visitorAPI.getRequests();
      setVisitors(data.requests || data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check-in failed");
    } finally {
      setActionLoading(null);
    }
  };
  // Handler for gate check-out
  const handleGateCheckOut = async (id: string) => {
    setActionLoading(id + "-checkout");
    try {
      await visitorAPI.checkOut(id, {});
      toast.success("Visitor checked out successfully");
      // Refresh visitors
      const data = await visitorAPI.getRequests();
      setVisitors(data.requests || data);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Check-out failed");
    } finally {
      setActionLoading(null);
    }
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const params = {
        ...filters,
        page: currentPage,
        limit: 10,
      };

      const [requestsRes, analyticsRes] = await Promise.all([
        visitorAPI.getRequests(params),
        user?.role === "admin" ? visitorAPI.getAnalytics() : Promise.resolve({ data: null }),
      ]);

      setVisitors(requestsRes.data.requests);
      setTotalPages(requestsRes.data.totalPages);
      if (analyticsRes.data) {
        setAnalytics(analyticsRes.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
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
      search: "",
      location: "",
      gateAssignment: "",
      visitType: "",
      startDate: "",
      endDate: "",
    });
    setCurrentPage(1);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      pending: "bg-yellow-100 text-yellow-800",
      approved: "bg-green-100 text-green-800",
      declined: "bg-red-100 text-red-800",
      checked_in: "bg-blue-100 text-blue-800",
      checked_out: "bg-gray-100 text-gray-800",
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status as keyof typeof statusClasses] || "bg-gray-100 text-gray-800"}`}>
        {status.replace("_", " ").toUpperCase()}
      </span>
    );
  };

  const getVisitTypeBadge = (isGroupVisit: boolean, groupSize?: number) => {
    if (isGroupVisit) {
      return (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
          Group ({groupSize || 'N/A'})
        </span>
      );
    }
    return (
      <span className="px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
        Individual
      </span>
    );
  };

  if (loading) return <LoadingSpinner />;

  // Admin tabbed dashboard
  if (user?.role === "admin") {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
        <div className="mb-6 flex gap-2 border-b">
          <button className={`px-4 py-2 font-semibold ${adminTab === "requests" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`} onClick={() => setAdminTab("requests")}>Visitor Requests</button>
          <button className={`px-4 py-2 font-semibold ${adminTab === "users" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`} onClick={() => setAdminTab("users")}>User Management</button>
          <button className={`px-4 py-2 font-semibold ${adminTab === "delegations" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`} onClick={() => setAdminTab("delegations")}>Delegation Management</button>
          <button className={`px-4 py-2 font-semibold ${adminTab === "audit" ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600"}`} onClick={() => setAdminTab("audit")}>Audit Logs</button>
        </div>
        {adminTab === "requests" && (
          <>
            {/* Existing analytics and requests table code here */}
            {/* Analytics Section */}
            {analytics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-700">Total Requests</h3>
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalRequests}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-700">Pending</h3>
                  <p className="text-3xl font-bold text-yellow-600">{analytics.pendingRequests}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-700">Approved</h3>
                  <p className="text-3xl font-bold text-green-600">{analytics.approvedRequests}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h3 className="text-lg font-semibold text-gray-700">Checked In</h3>
                  <p className="text-3xl font-bold text-blue-600">{analytics.checkedInRequests}</p>
                </div>
              </div>
            )}
            {/* Requests Table */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold">Visitor Requests</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visit Type</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {visitors.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{request.visitorName}</div>
                            <div className="text-sm text-gray-500">{request.visitorId}</div>
                            {request.companyName && (
                              <div className="text-xs text-gray-400">{request.companyName}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getVisitTypeBadge(request.isGroupVisit, request.groupSize)}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{request.department}</div>
                            <div className="text-xs text-gray-500">{request.departmentType}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm text-gray-900">{request.location}</div>
                            {request.gateAssignment && (
                              <div className="text-xs text-gray-500">{request.gateAssignment}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{new Date(request.scheduledDate).toLocaleDateString()}</div>
                          <div className="text-sm text-gray-500">{request.scheduledTime}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900 mr-3">View</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination as before */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">Page {currentPage} of {totalPages}</div>
                    <div className="flex space-x-2">
                      <button onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Previous</button>
                      <button onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="px-3 py-1 text-sm border border-gray-300 rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50">Next</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
        {adminTab === "users" && <UserManagement />}
        {adminTab === "delegations" && <DelegationManagement isAdmin />}
        {adminTab === "audit" && <AuditLogs />}
      </div>
    );
  }

  // Non-admin dashboard as before
  if (user?.role === 'department_user') {
    return (
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-8 mb-8 flex flex-col md:flex-row items-center justify-between animate-fade-in">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">Welcome, {user.fullName || user.username}!</h1>
            <p className="text-lg text-blue-100">Here's a quick overview of your visitor requests and activity.</p>
          </div>
          <div className="mt-4 md:mt-0">
            <button onClick={() => window.location.href='/create-request'} className="bg-white text-blue-600 font-semibold px-6 py-3 rounded-lg shadow hover:bg-blue-50 transition-transform hover:scale-105">+ New Visitor Request</button>
          </div>
        </div>
        {/* Animated Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          {getRoleSpecificStats().map(stat => (
            <div key={stat.label} className={`rounded-lg shadow-md p-6 flex flex-col items-center ${stat.bgColor} animate-pop-in`}>
              <span className={`text-3xl font-bold ${stat.color}`}>{stat.value}</span>
              <span className="text-sm font-medium text-gray-700 mt-2">{stat.label}</span>
            </div>
          ))}
        </div>
        {/* Recent Requests Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden animate-fade-in">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Recent Visitor Requests</h2>
            <button onClick={() => window.location.href='/visitor-requests'} className="text-blue-600 hover:underline font-medium">View All</button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Visitor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scheduled</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {visitors.filter(v => v.requestedBy?.username === user.username).slice(0, 5).map(request => (
                  <tr key={request._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{request.visitorName}</div>
                      <div className="text-xs text-gray-500">{request.visitorId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-700">{request.purpose}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{new Date(request.scheduledDate).toLocaleDateString()}</div>
                      <div className="text-xs text-gray-500">{request.scheduledTime}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(request.status)}</td>
                  </tr>
                ))}
                {visitors.filter(v => v.requestedBy?.username === user.username).length === 0 && (
                  <tr><td colSpan={4} className="text-center text-gray-400 py-6">No requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  }
  // Fallback for users with unknown roles
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>
      <p className="text-gray-600">You do not have access to a specific dashboard view.</p>
    </div>
  );
}
export default Dashboard;