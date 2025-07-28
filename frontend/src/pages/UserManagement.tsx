import React, { useEffect, useState } from "react";
import { userAPI } from "../services/api.ts";
import type { User } from "../types";
import toast from "react-hot-toast";
import { FaUserCircle, FaUserEdit, FaTrashAlt, FaUserPlus } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext.tsx";

const roles = ["admin", "department_user", "security", "gate"];
const departments = ["IT", "HR", "Finance", "Marketing", "Operations"];
const departmentTypes = ["wing", "director", "division"];
const locations = ["Wollo Sefer", "Operation"];
const departmentRoles = ["division_head", "wing", "director"];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<any>({ 
    username: "", 
    email: "", 
    password: "", 
    role: "department_user", 
    department: "", 
    departmentType: "",
    location: "",
    fullName: "" 
  });
  const [formLoading, setFormLoading] = useState(false);
  const { user: currentUser } = useAuth();

  console.log('UserManagement form state:', form);

  const fetchUsers = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await userAPI.getUsers();
      setUsers(data.users || []);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const openCreate = () => {
    setForm({ 
      username: "", 
      email: "", 
      password: "", 
      role: "department_user", 
      department: "", 
      departmentType: "",
      location: "",
      fullName: "" 
    });
    setShowCreate(true);
  };
  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({ 
      ...user, 
      password: "", 
      department: user.department || departments[0], // Default to first department if missing
      departmentType: user.departmentType || departmentTypes[0], // Default to first type if missing
      location: user.location || locations[0], // Default to first location if missing
      departmentRole: user.departmentRole || departmentRoles[0],
    });
    setShowEdit(true);
  };
  const closeModals = () => {
    setShowCreate(false); setShowEdit(false); setSelectedUser(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await userAPI.createUser(form);
      toast.success("User created");
      closeModals(); fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create user");
    } finally { setFormLoading(false); }
  };
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault(); setFormLoading(true);
    try {
      await userAPI.updateUser(selectedUser!._id, form);
      toast.success("User updated");
      closeModals(); fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update user");
    } finally { setFormLoading(false); }
  };
  const handleDelete = async (id: string) => {
    if (!window.confirm("Delete this user?")) return;
    try {
      await userAPI.deleteUser(id);
      toast.success("User deleted");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete user");
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await userAPI.approveUser(id);
      toast.success("User approved");
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to approve user");
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 animate-fade-in">
      <div className="card bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2 text-gray-900 dark:text-gray-100">
            <FaUserCircle className="text-blue-500 animate-pop-in" size={28} /> User Management
          </h2>
          <button className="btn-primary flex items-center gap-2 transition-transform hover:scale-105" onClick={openCreate}>
            <FaUserPlus /> Add User
          </button>
        </div>
        <div className="card-body">
          {loading ? (
            <div className="flex justify-center items-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : error ? (
            <div className="text-red-600 text-center py-4 animate-fade-in">{error}</div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-12 animate-fade-in">
              <FaUserCircle className="text-6xl text-gray-300 mb-4 animate-bounce-in" />
              <div className="text-gray-500 text-lg">No users found. Click <span className='font-semibold'>Add User</span> to get started!</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-900">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avatar</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Employee ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Full Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dept Type</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Dept Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Location</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Approval</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map((u, idx) => (
                    <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg shadow-sm">
                          {u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : u.username[0].toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100 font-mono text-sm">{u.employeeId}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-900 dark:text-gray-100">{u.username}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{u.fullName}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{u.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap capitalize">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : u.role === 'security' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : u.role === 'gate' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'}`}>{u.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">{u.department || "-"}</td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {u.departmentType ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            u.departmentType === 'wing' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                            u.departmentType === 'director' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                          }`}>
                            {u.departmentType.charAt(0).toUpperCase() + u.departmentType.slice(1)}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {u.role === 'department_user' ? (
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            u.departmentRole === 'wing' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300' :
                            u.departmentRole === 'director' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                            'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                          }`}>
                            {u.departmentRole ? u.departmentRole.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'Division Head'}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap text-gray-700 dark:text-gray-300">
                        {u.location ? (
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-gray-100 text-gray-700 dark:bg-gray-900 dark:text-gray-300">
                            {u.location}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {u.isApproved ? (
                          <span className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded text-xs font-semibold">Approved</span>
                        ) : (
                          <span className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-1 rounded text-xs font-semibold">Pending</span>
                        )}
                        {currentUser?.role === 'security' && !u.isApproved && (
                          <button className="ml-2 px-2 py-1 bg-blue-600 text-white rounded text-xs font-semibold hover:bg-blue-700 transition" onClick={() => handleApprove(u._id)}>
                            Approve
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                        <button className="text-blue-600 dark:text-blue-400 hover:text-blue-900 dark:hover:text-blue-200 transition-transform hover:scale-110" onClick={() => openEdit(u)} title="Edit">
                          <FaUserEdit />
                        </button>
                        <button className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-200 transition-transform hover:scale-110" onClick={() => handleDelete(u._id)} title="Delete">
                          <FaTrashAlt />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Create/Edit Modal */}
      {(showCreate || showEdit) && form && form.username && form.fullName && form.email && form.role && form.location && (form.role !== 'department_user' || (form.department && form.departmentType)) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-md relative animate-scale-in">
            <button onClick={closeModals} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl">&times;</button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-gray-100">{showCreate ? <FaUserPlus /> : <FaUserEdit />} {showCreate ? "Add User" : "Edit User"}</h2>
            <form onSubmit={showCreate ? handleCreate : handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                <input name="username" value={form.username} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
              </div>
              {showCreate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                  {roles.map(r => <option key={r} value={r}>{r.replace('_', ' ')}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location</label>
                <select name="location" value={form.location} onChange={handleChange} required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                  <option value="">Select location</option>
                  {locations.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              {form.role === "department_user" && currentUser?.role === 'admin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department Role</label>
                  <select name="departmentRole" value={form.departmentRole || "division_head"} onChange={handleChange} className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700">
                    {departmentRoles.map(dr => <option key={dr} value={dr}>{dr.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
                  </select>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button type="button" onClick={closeModals} className="btn-secondary transition-transform hover:scale-105">Cancel</button>
                <button type="submit" disabled={formLoading} className="btn-primary transition-transform hover:scale-105">{formLoading ? "Saving..." : "Save"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 0.6s both; }
        @keyframes scale-in { from { transform: scale(0.9); opacity: 0; } to { transform: scale(1); opacity: 1; } }
        .animate-scale-in { animation: scale-in 0.3s cubic-bezier(.4,2,.6,1) both; }
        @keyframes pop-in { 0% { transform: scale(0.7); opacity: 0; } 80% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-pop-in { animation: pop-in 0.5s cubic-bezier(.4,2,.6,1) both; }
        @keyframes bounce-in { 0% { transform: scale(0.7); opacity: 0; } 60% { transform: scale(1.1); opacity: 1; } 100% { transform: scale(1); } }
        .animate-bounce-in { animation: bounce-in 0.7s cubic-bezier(.4,2,.6,1) both; }
      `}</style>
    </div>
  );
};

export default UserManagement; 