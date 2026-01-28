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

  // Load user data on component mount
  useEffect(() => {
    const loadUser = () => {
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
    };
    loadUser();
  }, []);

  // Handle profile update
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || name.trim() === user?.name) {
      setMessage({
        text: "Please enter a new name",
        type: "warning",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      const response = await api.put(
        "/api/auth/update-profile",
        { name: name.trim() },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      // Update local storage
      const updatedUser = { ...user, name: name.trim() };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);

      // Dispatch event for other components
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

  // Handle password change
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { current, new: newPass, confirm } = passwords;

    // Validation
    if (!current || !newPass || !confirm) {
      setMessage({
        text: "All password fields are required",
        type: "error",
      });
      return;
    }

    if (newPass.length < 6) {
      setMessage({
        text: "New password must be at least 6 characters",
        type: "error",
      });
      return;
    }

    if (newPass !== confirm) {
      setMessage({
        text: "New passwords do not match",
        type: "error",
      });
      return;
    }

    try {
      setLoading(true);
      setMessage({ text: "", type: "" });

      await api.put(
        "/api/auth/change-password",
        {
          currentPassword: current,
          newPassword: newPass,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      setMessage({
        text: "Password changed successfully!",
        type: "success",
      });

      // Reset form
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

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Your Profile
          </h1>
          <p className="text-gray-600">
            Manage your account settings and preferences
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - User Info */}
          <div className="lg:col-span-2 space-y-8">
            {/* Profile Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white flex items-center justify-center text-2xl font-bold shadow-md">
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{user?.name || "User"}</h2>
                  <p className="text-gray-600">{user?.email || "user@example.com"}</p>
                </div>
              </div>

              {/* Update Name Form */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                  Update Profile Information
                </h3>
                <form onSubmit={handleUpdate} className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter your full name"
                      disabled={loading}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-3.5 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </span>
                    ) : (
                      "Update Profile"
                    )}
                  </button>
                </form>
              </div>
            </div>

            {/* Password Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Password & Security</h3>
                  <p className="text-gray-600 text-sm mt-1">
                    Change your password to keep your account secure
                  </p>
                </div>
                <button
                  onClick={() => setShowPasswordForm(!showPasswordForm)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                >
                  {showPasswordForm ? "Cancel" : "Change Password"}
                </button>
              </div>

              {showPasswordForm && (
                <form onSubmit={handlePasswordChange} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <input
                      type="password"
                      value={passwords.current}
                      onChange={(e) =>
                        setPasswords({ ...passwords, current: e.target.value })
                      }
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter current password"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) =>
                        setPasswords({ ...passwords, new: e.target.value })
                      }
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Enter new password"
                      disabled={loading}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) =>
                        setPasswords({ ...passwords, confirm: e.target.value })
                      }
                      className="w-full p-3.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      placeholder="Confirm new password"
                      disabled={loading}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-amber-500 to-amber-600 text-white py-3.5 rounded-lg font-medium hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Updating...
                      </span>
                    ) : (
                      "Change Password"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Right Column - Account Info */}
          <div className="space-y-8">
            {/* Account Details */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Account Details
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Account Created</p>
                  <p className="font-medium text-gray-900">
                    {user?.createdAt ? formatDate(user.createdAt) : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">User ID</p>
                  <p className="font-medium text-gray-900 truncate">
                    {user?.id || "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <p className="font-medium text-gray-900">Active</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl border border-purple-100 p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="w-full text-left p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Change Password</span>
                    <span className="text-purple-600">→</span>
                  </div>
                </button>
                <button className="w-full text-left p-3 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900">Privacy Settings</span>
                    <span className="text-purple-600">→</span>
                  </div>
                </button>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.href = "/login";
                  }}
                  className="w-full text-left p-3 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg border border-red-200 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Logout All Devices</span>
                    <span>→</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div
            className={`fixed bottom-6 right-6 max-w-md animate-slide-up ${
              message.type === "error"
                ? "bg-red-50 border-red-200 text-red-800"
                : message.type === "warning"
                ? "bg-amber-50 border-amber-200 text-amber-800"
                : "bg-emerald-50 border-emerald-200 text-emerald-800"
            } border rounded-xl p-4 shadow-lg`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  message.type === "error"
                    ? "bg-red-100 text-red-600"
                    : message.type === "warning"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-emerald-100 text-emerald-600"
                }`}
              >
                {message.type === "error" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                ) : message.type === "warning" ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <p className="font-medium">{message.text}</p>
              <button
                onClick={() => setMessage({ text: "", type: "" })}
                className="ml-auto text-gray-400 hover:text-gray-600"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}