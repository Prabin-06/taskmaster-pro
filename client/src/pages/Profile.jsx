import { useState, useEffect } from "react";
import api from "../api";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("user") || "null");
    if (storedUser) {
      setUser(storedUser);
      setName(storedUser.name);
    }
  }, []);

  /* UPDATE NAME */
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!name.trim() || name === user.name)
      return setMessage("Enter a new name");

    try {
      setLoading(true);
      const res = await api.put("/api/auth/update-profile", { name });

      const updatedUser = res.data.data.user;
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* CHANGE PASSWORD */
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    const { current, new: newPass, confirm } = passwords;

    if (!current || !newPass || !confirm)
      return setMessage("All password fields required");

    if (newPass.length < 6)
      return setMessage("New password must be at least 6 characters");

    if (newPass !== confirm)
      return setMessage("Passwords do not match");

    try {
      setLoading(true);
      const res = await api.put("/api/auth/change-password", {
        currentPassword: current,
        newPassword: newPass,
      });

      setMessage(res.data.message);
      setPasswords({ current: "", new: "", confirm: "" });
      setShowPasswordForm(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-xl mx-auto space-y-8">

        <div className="bg-white p-6 rounded-xl shadow">
          <h2 className="text-xl font-semibold mb-4">Profile Info</h2>
          <form onSubmit={handleUpdate} className="space-y-4">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 border rounded-lg"
            />
            <button className="w-full bg-purple-600 text-white py-3 rounded-lg">
              {loading ? "Updating..." : "Update Name"}
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-xl shadow">
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-purple-600 mb-4"
          >
            {showPasswordForm ? "Cancel" : "Change Password"}
          </button>

          {showPasswordForm && (
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <input
                type="password"
                placeholder="Current Password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="password"
                placeholder="New Password"
                value={passwords.new}
                onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <input
                type="password"
                placeholder="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                className="w-full p-3 border rounded-lg"
              />
              <button className="w-full bg-amber-500 text-white py-3 rounded-lg">
                {loading ? "Updating..." : "Change Password"}
              </button>
            </form>
          )}
        </div>

        <div className="bg-white p-6 rounded-xl shadow text-sm text-gray-600">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Joined:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          <p><strong>User ID:</strong> {user.id}</p>
        </div>

        {message && (
          <div className="fixed bottom-5 right-5 bg-white shadow-lg p-4 rounded-lg border">
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
