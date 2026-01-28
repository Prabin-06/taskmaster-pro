import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [resetToken, setResetToken] = useState("");
  const [showToken, setShowToken] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      setMessage({ text: "Please enter your email address", type: "error" });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({ text: "Please enter a valid email address", type: "error" });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    setResetToken("");

    try {
      const response = await api.post("/api/auth/forgot-password", {
        email: email.toLowerCase().trim(),
      });

      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
        setMessage({
          text: "Reset token generated! Use the link below to reset your password.",
          type: "success",
        });
      } else {
        setMessage({
          text:
            response.data.message ||
            "Password reset instructions sent to your email.",
          type: "success",
        });
      }
    } catch (err) {
      let errorMessage =
        err.response?.data?.message ||
        "Error sending reset link. Please try again.";

      if (err.response?.status === 404) {
        errorMessage = "No account found with this email.";
      } else if (err.response?.status === 429) {
        errorMessage = "Too many reset attempts. Please try again later.";
      }

      setMessage({ text: errorMessage, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleManualReset = () => {
    if (resetToken) {
      navigate(`/reset-password/${resetToken}`);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(resetToken);
    setMessage({ text: "Reset token copied!", type: "success" });
    setTimeout(() => setMessage({ text: "", type: "" }), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6">
          <h1 className="text-2xl font-bold mb-4 text-center">Forgot Password</h1>

          {message.text && (
            <div
              className={`mb-4 p-3 rounded ${
                message.type === "success"
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {message.text}
            </div>
          )}

          {resetToken && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <p className="text-sm font-semibold mb-2">Dev Reset Token:</p>
              <div className="flex gap-2">
                <input
                  value={resetToken}
                  readOnly
                  className="flex-1 border px-2 py-1 rounded text-sm"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={handleManualReset}
                className="mt-2 w-full bg-blue-600 text-white py-2 rounded"
              >
                Go to Reset Page
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full border p-3 rounded"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-purple-600 text-white py-3 rounded"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          <p className="text-center mt-4 text-sm">
            Remembered your password?{" "}
            <Link to="/login" className="text-blue-600 underline">
              Back to login
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
