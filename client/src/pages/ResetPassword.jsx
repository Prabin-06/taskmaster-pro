import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isValidToken, setIsValidToken] = useState(true);

  // Validate token on mount
  useEffect(() => {
    if (!token || token.length < 10) {
      setIsValidToken(false);
      setMessage({
        text: "Invalid or expired reset token. Please request a new password reset.",
        type: "error",
      });
    }
  }, [token]);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    if (message.text) setMessage({ text: "", type: "" });

    if (name === "password") calculatePasswordStrength(value);
  };

  // Password strength checker
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    setPasswordStrength(strength);
  };

  const getPasswordStrengthInfo = () => {
    const map = [
      { color: "bg-red-500", text: "Very Weak", width: "20%" },
      { color: "bg-orange-500", text: "Weak", width: "40%" },
      { color: "bg-yellow-500", text: "Fair", width: "60%" },
      { color: "bg-blue-500", text: "Good", width: "80%" },
      { color: "bg-green-500", text: "Strong", width: "100%" },
    ];
    return map[Math.min(passwordStrength, 4)];
  };

  const validateForm = () => {
    if (formData.password.length < 8) {
      setMessage({ text: "Password must be at least 8 characters", type: "error" });
      return false;
    }
    if (passwordStrength < 3) {
      setMessage({ text: "Please use a stronger password", type: "error" });
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setMessage({ text: "Passwords do not match", type: "error" });
      return false;
    }
    return true;
  };

  // Submit reset
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValidToken) return;
    if (!validateForm()) return;

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      await api.post(`/api/auth/reset-password/${token}`, {
        password: formData.password,
      });

      setMessage({ text: "Password reset successful!", type: "success" });

      setTimeout(() => {
        navigate("/login", {
          state: { message: "Password reset successful! Please login." },
        });
      }, 2500);
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Reset failed. Try again.";

      setMessage({ text: errorMessage, type: "error" });
      if (errorMessage.toLowerCase().includes("expired")) setIsValidToken(false);
    } finally {
      setLoading(false);
    }
  };

  const PasswordToggle = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
    >
      {show ? "🙈" : "👁️"}
    </button>
  );

  // If token invalid
  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Invalid Reset Link</h2>
          <p className="mb-6">{message.text}</p>
          <Link to="/forgot-password" className="text-blue-600 underline">
            Request new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <h1 className="text-3xl font-bold mb-6 text-center">Create New Password</h1>

        {message.text && (
          <div
            className={`mb-4 p-3 rounded ${
              message.type === "success" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
            }`}
          >
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block mb-1 font-medium">New Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 pr-10"
              />
              <PasswordToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
            </div>

            {formData.password && (
              <div className="mt-2">
                <div className="h-2 bg-gray-200 rounded-full">
                  <div
                    className={`h-2 rounded-full ${getPasswordStrengthInfo().color}`}
                    style={{ width: getPasswordStrengthInfo().width }}
                  />
                </div>
                <p className="text-xs mt-1">{getPasswordStrengthInfo().text}</p>
              </div>
            )}
          </div>

          <div>
            <label className="block mb-1 font-medium">Confirm Password</label>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className="w-full border rounded-lg px-4 py-2 pr-10"
              />
              <PasswordToggle
                show={showConfirmPassword}
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 rounded-lg font-semibold"
          >
            {loading ? "Resetting..." : "Reset Password"}
          </button>
        </form>

        <p className="text-center mt-6 text-sm">
          Back to{" "}
          <Link to="/login" className="text-blue-600 underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
