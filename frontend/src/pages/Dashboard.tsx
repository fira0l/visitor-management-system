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

  return (
    <div className="p-6 max-w-6xl mx-auto animate-fade-in">
      <h1 className="text-3xl font-bold mb-2">Welcome, {user?.fullName || user?.username}!</h1>
      <p className="text-lg text-gray-600 mb-6">Role: <span className="font-semibold capitalize">{user?.role.replace("_", " ")}</span></p>
      {/* Role-specific stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {getRoleSpecificStats().map((stat, index) => (
          <div key={index} className={`card flex flex-col items-center ${stat.bgColor}`} style={{ minHeight: 120 }}>
            <span className={`text-2xl font-bold ${stat.color}`}>{stat.value}</span>
            <span className="text-gray-700 mt-2 text-center">{stat.label}</span>
          </div>
        ))}
      </div>
      {/* Role-specific visitor list */}
      <div className="card mt-4 animate-fade-in">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-xl font-semibold">{getRoleSpecificTitle()}</h2>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4">{error}</div>
          ) : roleData.todayVisitors.length === 0 ? (
            <div className="text-gray-500 py-4 text-center">No visitors found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Visitor</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Purpose</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {roleData.todayVisitors.slice(0, 10).map(v => (
                    <tr key={v._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-2 whitespace-nowrap">{v.visitorName}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{v.purpose}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{v.department}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{v.scheduledDate?.slice(0, 10)}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          v.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          v.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          v.status === 'declined' ? 'bg-red-100 text-red-800' :
                          v.status === 'checked_in' ? 'bg-green-100 text-green-800' :
                          v.status === 'checked_out' ? 'bg-gray-100 text-gray-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {roleData.todayVisitors.length > 10 && (
                <div className="text-gray-500 py-4 text-center">
                  Showing first 10 results. View all in Visitor Requests.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 