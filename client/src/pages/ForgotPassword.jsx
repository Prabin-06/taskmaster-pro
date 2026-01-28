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

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim()) {
      setMessage({
        text: "Please enter your email address",
        type: "error"
      });
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage({
        text: "Please enter a valid email address",
        type: "error"
      });
      return;
    }

    setLoading(true);
    setMessage({ text: "", type: "" });
    setResetToken("");

    try {
      const response = await api.post("/api/auth/forgot-password", { 
        email: email.toLowerCase().trim() 
      });

      // Check if we're in development mode (token returned)
      if (response.data.resetToken) {
        setResetToken(response.data.resetToken);
        setMessage({
          text: "Reset token generated! Use the link below to reset your password.",
          type: "success"
        });
      } else {
        setMessage({
          text: response.data.message || "Password reset instructions sent to your email. Please check your inbox.",
          type: "success"
        });
        
        // Auto-clear success message after 5 seconds
        setTimeout(() => {
          setMessage({ text: "", type: "" });
        }, 5000);
      }

    } catch (err) {
      // Handle specific error cases
      let errorMessage = err.response?.data?.message || "Error sending reset link. Please try again.";
      
      if (err.response?.status === 404) {
        errorMessage = "No account found with this email. Please check your email address or sign up for a new account.";
      } else if (err.response?.status === 429) {
        errorMessage = "Too many reset attempts. Please try again later.";
      } else if (!err.response) {
        errorMessage = "Network error. Please check your connection and try again.";
      }

      setMessage({
        text: errorMessage,
        type: "error"
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle manual reset with token
  const handleManualReset = () => {
    if (resetToken) {
      navigate(`/reset-password/${resetToken}`);
    }
  };

  // Copy token to clipboard
  const copyToClipboard = () => {
    if (resetToken) {
      navigator.clipboard.writeText(resetToken);
      setMessage({
        text: "Reset token copied to clipboard!",
        type: "success"
      });
      setTimeout(() => {
        setMessage(prev => prev.type === "success" ? { text: "", type: "" } : prev);
      }, 2000);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Reset Your Password
          </h1>
          <p className="text-gray-600">
            Enter your email and we'll send you instructions to reset your password
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

          {/* Reset Token Display (Development Only) */}
          {resetToken && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-blue-800">Development Mode - Reset Token</h3>
                <button
                  onClick={() => setShowToken(!showToken)}
                  className="text-sm text-blue-600 hover:text-blue-500"
                >
                  {showToken ? "Hide" : "Show"}
                </button>
              </div>
              {showToken && (
                <div className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={resetToken}
                      readOnly
                      className="w-full px-3 py-2 bg-white border border-blue-300 rounded text-sm font-mono"
                    />
                    <button
                      onClick={copyToClipboard}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-blue-600 hover:text-blue-500"
                      title="Copy to clipboard"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                  <button
                    onClick={handleManualReset}
                    className="w-full px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white rounded-lg font-medium transition-all"
                  >
                    Go to Reset Page
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                disabled={loading}
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Sending reset link...
                </span>
              ) : (
                "Send Reset Instructions"
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-gray-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-sm text-gray-600 font-medium">What happens next?</p>
                <ul className="mt-2 space-y-1 text-xs text-gray-500">
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>Check your email for password reset instructions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>The reset link expires in 1 hour for security</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="mt-1">•</span>
                    <span>If you don't see the email, check your spam folder</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Back to Login */}
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

        {/* Security Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            Your security is important to us. We use industry-standard encryption.
          </p>
        </div>
      </div>
    </div>
  );
}