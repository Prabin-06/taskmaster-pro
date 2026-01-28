import { useState, useEffect } from "react";
import api from "../api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
        setName(parsedUser.name || "");
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  }, []);

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) {
      return setMessage({ text: "Please enter a new name", type: "warning" });
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      const response = await api.put(
        "/api/auth/update-profile",
        { name: name.trim() },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const updatedUser = { ...user, name: name.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      window.dispatchEvent(new CustomEvent("userUpdated", { detail: updatedUser }));

      setMessage({
        text: response.data?.message || "Profile updated successfully!",
        type: "success",
      });
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Update failed. Please try again.",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { current, new: newPass, confirm } = passwords;

    if (!current || !newPass || !confirm)
      return setMessage({ text: "All password fields are required", type: "error" });

    if (newPass.length < 6)
      return setMessage({ text: "New password must be at least 6 characters", type: "error" });

    if (newPass !== confirm)
      return setMessage({ text: "New passwords do not match", type: "error" });

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      await api.put(
        "/api/auth/change-password",
        { currentPassword: current, newPassword: newPass },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      setMessage({ text: "Password changed successfully!", type: "success" });
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordForm(false);
    } catch (err) {
      setMessage({
        text: err.response?.data?.message || "Failed to change password",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-10">Your Profile</h1>

        {/* Profile Info */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Update Profile</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
              disabled={loading}
            />
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg">
              {loading ? "Updating..." : "Update Profile"}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="bg-white rounded-xl shadow p-6 mb-8">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="mb-4 text-purple-600 font-medium"
          >
            {showPasswordForm ? "Cancel" : "Change Password"}
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input type="password" placeholder="Current Password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full p-3 border rounded-lg" />
              <input type="password" placeholder="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full p-3 border rounded-lg" />
              <input type="password" placeholder="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full p-3 border rounded-lg" />
              <button className="w-full bg-amber-500 text-white py-3 rounded-lg">
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          )}
        </div>

        {/* Account Info */}
        <div className="bg-white rounded-xl shadow p-6">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>Account Created:</strong> {formatDate(user?.createdAt)}</p>
          <p><strong>User ID:</strong> {user?.id}</p>
        </div>

        {/* Toast Message */}
        {message.text && (
          <div className="fixed bottom-5 right-5 bg-white shadow-lg p-4 rounded-lg border">
            {message.text}
          </div>
        )}
      </div>
    </div>
  );
}
