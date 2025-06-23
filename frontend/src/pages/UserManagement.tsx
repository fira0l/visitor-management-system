import React, { useEffect, useState } from "react";
import { userAPI } from "../services/api.ts";
import type { User } from "../types";
import toast from "react-hot-toast";
import { FaUserCircle, FaUserEdit, FaTrashAlt, FaUserPlus } from "react-icons/fa";

const roles = ["admin", "department_user", "security", "gate"];
const departments = ["IT", "HR", "Finance", "Marketing", "Operations"];

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [form, setForm] = useState<any>({ username: "", email: "", password: "", role: "department_user", department: "", fullName: "" });
  const [formLoading, setFormLoading] = useState(false);

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
    setForm({ username: "", email: "", password: "", role: "department_user", department: "", fullName: "" });
    setShowCreate(true);
  };
  const openEdit = (user: User) => {
    setSelectedUser(user);
    setForm({ ...user, password: "" });
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

  return (
    <div className="max-w-5xl mx-auto p-6 animate-fade-in">
      <div className="card">
        <div className="card-header flex items-center justify-between">
          <h2 className="text-2xl font-bold flex items-center gap-2">
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
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avatar</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Username</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Full Name</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u, idx) => (
                    <tr key={u._id} className="hover:bg-gray-50 transition-colors animate-fade-in" style={{ animationDelay: `${idx * 40}ms` }}>
                      <td className="px-4 py-2 whitespace-nowrap">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg shadow-sm">
                          {u.fullName ? u.fullName.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase() : u.username[0].toUpperCase()}
                        </div>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{u.username}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{u.fullName}</td>
                      <td className="px-4 py-2 whitespace-nowrap">{u.email}</td>
                      <td className="px-4 py-2 whitespace-nowrap capitalize">
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'security' ? 'bg-green-100 text-green-700' : u.role === 'gate' ? 'bg-yellow-100 text-yellow-700' : 'bg-blue-100 text-blue-700'}`}>{u.role.replace('_', ' ')}</span>
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap">{u.department || "-"}</td>
                      <td className="px-4 py-2 whitespace-nowrap">
                        {u.isActive ? <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-semibold">Active</span> : <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-semibold">Inactive</span>}
                      </td>
                      <td className="px-4 py-2 whitespace-nowrap flex gap-2">
                        <button className="text-blue-600 hover:text-blue-900 transition-transform hover:scale-110" onClick={() => openEdit(u)} title="Edit">
                          <FaUserEdit />
                        </button>
                        <button className="text-red-600 hover:text-red-900 transition-transform hover:scale-110" onClick={() => handleDelete(u._id)} title="Delete">
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
      {(showCreate || showEdit) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 animate-fade-in">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative animate-scale-in">
            <button onClick={closeModals} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl">&times;</button>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">{showCreate ? <FaUserPlus /> : <FaUserEdit />} {showCreate ? "Add User" : "Edit User"}</h2>
            <form onSubmit={showCreate ? handleCreate : handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Username</label>
                <input name="username" value={form.username} onChange={handleChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Full Name</label>
                <input name="fullName" value={form.fullName} onChange={handleChange} required className="input-field mt-1" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} required className="input-field mt-1" />
              </div>
              {showCreate && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input name="password" type="password" value={form.password} onChange={handleChange} required className="input-field mt-1" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700">Role</label>
                <select name="role" value={form.role} onChange={handleChange} className="input-field mt-1">
                  {roles.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              {form.role === "department_user" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department</label>
                  <select name="department" value={form.department} onChange={handleChange} className="input-field mt-1">
                    <option value="">Select</option>
                    {departments.map(d => <option key={d} value={d}>{d}</option>)}
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