import { useState } from "react";
import api from "../api";
import { useNavigate, Link } from "react-router-dom";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!email.trim()) return setMessage("Email is required");

    try {
      setLoading(true);
      setMessage("");

      const res = await api.post("/api/auth/forgot-password", {
        email: email.trim().toLowerCase(),
      });

      setMessage(res.data.message);

      // Dev-only reset token
      if (res.data.data?.resetToken) {
        setResetToken(res.data.data.resetToken);
      }
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending reset link");
    } finally {
      setLoading(false);
    }
  };

  const goToReset = () => {
    if (resetToken) navigate(`/reset-password/${resetToken}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Forgot Password</h1>

        {message && <p className="mb-4 text-center text-sm text-blue-600">{message}</p>}

        {resetToken && (
          <div className="mb-4 p-3 bg-gray-100 rounded text-sm break-all">
            <p><strong>Dev Reset Token:</strong></p>
            <p>{resetToken}</p>
            <button onClick={goToReset} className="mt-2 text-blue-600 underline">
              Go to Reset Page
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border rounded-lg"
          />

          <button disabled={loading} className="w-full bg-purple-600 text-white py-3 rounded-lg">
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        <p className="text-center mt-4 text-sm">
          Back to <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
