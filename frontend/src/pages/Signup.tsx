import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { authAPI } from "../services/api.ts";
import toast from "react-hot-toast";

type RegisterPayload = {
  username: string;
  email: string;
  password: string;
  role: "department_user" | "security" | "gate";
  fullName: string;
};

const Signup: React.FC = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"department_user" | "security" | "gate" | "">("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim() || !role.trim() || !email.trim() || !fullName.trim() || (role === "department_user" && !department.trim())) {
      toast.error("Please fill in all fields");
      return;
    }
    setLoading(true);
    try {
      await authAPI.register({ username, email, password, role: role as RegisterPayload["role"], fullName, department } as RegisterPayload);
      toast.success("Signup successful! Please login.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Signup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-gray-100">Sign up for an account</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 animate-fade-in">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Full Name</label>
              <input id="fullName" name="fullName" type="text" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={fullName} onChange={e => setFullName(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
              <input id="username" name="username" type="text" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={username} onChange={e => setUsername(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input id="email" name="email" type="email" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={email} onChange={e => setEmail(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input id="password" name="password" type="password" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={password} onChange={e => setPassword(e.target.value)} disabled={loading} />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
              <select id="role" name="role" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={role} onChange={e => setRole(e.target.value as RegisterPayload["role"])} disabled={loading}>
                <option value="">Select a role</option>
                <option value="department_user">Department User</option>
                <option value="security">Security</option>
                <option value="gate">Gate</option>
              </select>
            </div>
            {role === "department_user" && (
              <div>
                <label htmlFor="department" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Department</label>
                <input id="department" name="department" type="text" required className="input-field mt-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700" value={department} onChange={e => setDepartment(e.target.value)} disabled={loading} />
              </div>
            )}
            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Signup;
