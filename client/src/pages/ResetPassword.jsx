import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function ResetPassword() {
  const { token } = useParams();
  const [formData, setFormData] = useState({
    password: "",
    confirmPassword: ""
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isValidToken, setIsValidToken] = useState(true);
  
  const navigate = useNavigate();

  // Validate token on component mount
  useEffect(() => {
    const validateToken = async () => {
      try {
        // You could add an endpoint to validate reset tokens
        // For now, we'll just check if token exists
        if (!token || token.length < 10) {
          setIsValidToken(false);
          setMessage({
            text: "Invalid or expired reset token. Please request a new password reset.",
            type: "error"
          });
        }
      } catch (err) {
        setIsValidToken(false);
        setMessage({
          text: "Unable to validate reset token. Please request a new password reset.",
          type: "error"
        });
      }
    };

    validateToken();
  }, [token]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear message when user starts typing
    if (message.text) {
      setMessage({ text: "", type: "" });
    }

    // Calculate password strength
    if (name === "password") {
      calculatePasswordStrength(value);
    }
  };

  // Calculate password strength
  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[a-z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  };

  // Get password strength color and text
  const getPasswordStrengthInfo = () => {
    const strengthMap = [
      { color: "bg-red-500", text: "Very Weak", width: "20%" },
      { color: "bg-orange-500", text: "Weak", width: "40%" },
      { color: "bg-yellow-500", text: "Fair", width: "60%" },
      { color: "bg-blue-500", text: "Good", width: "80%" },
      { color: "bg-green-500", text: "Strong", width: "100%" },
    ];
    return strengthMap[Math.min(passwordStrength, 4)];
  };

  // Validate form
  const validateForm = () => {
    const errors = [];

    if (!formData.password) {
      errors.push("Password is required");
    } else if (formData.password.length < 8) {
      errors.push("Password must be at least 8 characters long");
    } else if (passwordStrength < 3) {
      errors.push("Please use a stronger password");
    }

    if (!formData.confirmPassword) {
      errors.push("Please confirm your password");
    } else if (formData.password !== formData.confirmPassword) {
      errors.push("Passwords do not match");
    }

    if (errors.length > 0) {
      setMessage({
        text: errors[0],
        type: "error"
      });
      return false;
    }

    return true;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!isValidToken) {
      setMessage({
        text: "This reset link is invalid or has expired. Please request a new one.",
        type: "error"
      });
      return;
    }

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });

    try {
      const response = await api.post(`/api/auth/reset-password/${token}`, {
        password: formData.password
      });

      setMessage({
        text: response.data?.message || "Password reset successfully!",
        type: "success"
      });

      // Clear form
      setFormData({ password: "", confirmPassword: "" });

      // Auto-redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/login", { 
          state: { 
            message: "Password reset successful! You can now login with your new password.",
            preventAutofill: true 
          }
        });
      }, 3000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          "Unable to reset password. Please try again.";

      // Handle specific error cases
      if (err.response?.status === 400) {
        if (errorMessage.toLowerCase().includes("expired") || 
            errorMessage.toLowerCase().includes("invalid")) {
          setIsValidToken(false);
          setMessage({
            text: "This reset link has expired. Please request a new password reset.",
            type: "error"
          });
        } else {
          setMessage({
            text: errorMessage,
            type: "error"
          });
        }
      } else if (err.response?.status === 404) {
        setIsValidToken(false);
        setMessage({
          text: "Invalid reset link. Please request a new password reset.",
          type: "error"
        });
      } else {
        setMessage({
          text: errorMessage,
          type: "error"
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Password toggle component
  const PasswordToggle = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 transition-colors"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      ) : (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      )}
    </button>
  );

  if (!isValidToken && message.type === "error") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Invalid Reset Link
            </h1>
            <p className="text-gray-600 mb-6">
              This password reset link is no longer valid
            </p>
          </div>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 text-center">
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
              <p className="text-red-800 font-medium">{message.text}</p>
            </div>
            
            <div className="space-y-4">
              <Link
                to="/forgot-password"
                className="block w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3.5 rounded-lg transition-all duration-300 hover:shadow-lg"
              >
                Request New Reset Link
              </Link>
              <Link
                to="/login"
                className="block w-full px-4 py-3.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
              >
                Back to Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Create New Password
          </h1>
          <p className="text-gray-600">
            Enter your new password below
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
          {/* Message Display */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-xl border ${
              message.type === "success" 
                ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200" 
                : "bg-gradient-to-r from-red-50 to-rose-50 border-red-200"
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                  message.type === "success" ? "bg-green-100" : "bg-red-100"
                }`}>
                  {message.type === "success" ? (
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className={`flex-1 font-medium ${
                  message.type === "success" ? "text-green-800" : "text-red-800"
                }`}>
                  {message.text}
                </p>
              </div>
            </div>
          )}

          {/* Reset Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* New Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your new password"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <PasswordToggle
                  show={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              
              {/* Password Strength Indicator */}
              {formData.password && (
                <div className="mt-3 space-y-2">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${getPasswordStrengthInfo().color}`}
                      style={{ width: getPasswordStrengthInfo().width }}
                    />
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">Password strength:</span>
                    <span className={`font-medium ${
                      passwordStrength <= 1 ? "text-red-600" :
                      passwordStrength <= 2 ? "text-orange-600" :
                      passwordStrength <= 3 ? "text-blue-600" :
                      "text-green-600"
                    }`}>
                      {getPasswordStrengthInfo().text}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Password Requirements */}
              <div className="mt-2 space-y-1">
                <p className="text-xs text-gray-500 font-medium">Password requirements:</p>
                <div className="grid grid-cols-2 gap-1 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${formData.password.length >= 8 ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>At least 8 characters</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${/[A-Z]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>One uppercase letter</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${/[0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>One number</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${/[^A-Za-z0-9]/.test(formData.password) ? 'bg-green-500' : 'bg-gray-300'}`} />
                    <span>One special character</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your new password"
                  className="w-full px-4 py-3 pr-12 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-all"
                  disabled={loading}
                  autoComplete="new-password"
                />
                <PasswordToggle
                  show={showConfirmPassword}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Resetting Password...
                </span>
              ) : (
                "Reset Password"
              )}
            </button>
          </form>

          {/* Security Note */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-600">
                For your security, please create a strong password that you haven't used before on other websites.
              </p>
            </div>
          </div>

          {/* Back Links */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Remember your password?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-500 font-semibold hover:underline transition-colors"
              >
                Back to login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}