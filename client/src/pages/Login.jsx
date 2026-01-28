import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import api from "../api";

export default function Login() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [rememberMe, setRememberMe] = useState(false);
  const [loginAttempts, setLoginAttempts] = useState(0);
  
  const navigate = useNavigate();
  const location = useLocation();

  // Check for redirect message from signup
  useEffect(() => {
    const message = location.state?.message;
    const email = location.state?.email;
    
    if (message) {
      setErrors({ success: message });
    }
    
    if (email) {
      setFormData(prev => ({ ...prev, email }));
    }

    // Check for remembered email
    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [location]);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear field-specific error
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
    if (errors.form) {
      setErrors(prev => ({ ...prev, form: "" }));
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }
    
    if (!formData.password) {
      newErrors.password = "Password is required";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post("/api/auth/login", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      // Store token and user data
      localStorage.setItem("token", response.data.token);
      
      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      // Handle "Remember me" functionality
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      // Reset login attempts on success
      setLoginAttempts(0);

      // Show success message before redirect
      setErrors({ success: "Login successful! Redirecting..." });

      // Redirect to dashboard after short delay
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);

    } catch (err) {
      const errorMessage = err.response?.data?.message || 
                          "Login failed. Please check your credentials.";
      
      // Track login attempts
      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);
      
      // Handle specific error cases
      if (err.response?.status === 401) {
        setErrors({ 
          form: errorMessage,
          remainingAttempts: 5 - attempts
        });
      } else if (err.response?.status === 423) {
        setErrors({ 
          form: "Account temporarily locked due to too many failed attempts. Please try again later."
        });
      } else if (err.response?.status === 404) {
        setErrors({ 
          form: "No account found with this email. Please sign up."
        });
      } else {
        setErrors({ form: errorMessage });
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

  // Demo credentials for testing
  const handleDemoLogin = async (demoType) => {
    setLoading(true);
    setErrors({});
    
    const credentials = demoType === "admin" 
      ? { email: "demo@taskmaster.com", password: "Demo123!" }
      : { email: "user@taskmaster.com", password: "User123!" };
    
    setFormData(credentials);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Store demo token (in real app, this would come from API)
      const demoToken = "demo_jwt_token_" + Date.now();
      localStorage.setItem("token", demoToken);
      
      const demoUser = {
        id: "demo_" + demoType + "_" + Date.now(),
        name: demoType === "admin" ? "Demo Admin" : "Demo User",
        email: credentials.email,
      };
      localStorage.setItem("user", JSON.stringify(demoUser));
      
      setErrors({ success: "Demo login successful! Redirecting..." });
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
      
    } catch {
      setErrors({ form: "Demo login failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Welcome Back
          </h1>
          <p className="text-gray-600 max-w-sm mx-auto">
            Sign in to access your tasks and boost your productivity
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-6 md:p-8">
          {/* Success/Error Messages */}
          {errors.success && (
            <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-green-800 font-medium">{errors.success}</p>
              </div>
            </div>
          )}

          {errors.form && (
            <div className="mb-6 p-4 bg-gradient-to-r from-red-50 to-rose-50 border border-red-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-medium">{errors.form}</p>
                  {errors.remainingAttempts !== undefined && errors.remainingAttempts > 0 && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.remainingAttempts} attempt(s) remaining
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Demo Login Buttons */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleDemoLogin("admin")}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 text-blue-700 rounded-lg hover:from-blue-100 hover:to-blue-200 disabled:opacity-50 transition-all font-medium"
            >
              Try as Admin
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("user")}
              disabled={loading}
              className="px-4 py-2.5 bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 text-purple-700 rounded-lg hover:from-purple-100 hover:to-purple-200 disabled:opacity-50 transition-all font-medium"
            >
              Try as User
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center mb-6">
            <div className="flex-1 h-px bg-gray-200"></div>
            <span className="px-4 text-sm text-gray-500">Or sign in with email</span>
            <div className="flex-1 h-px bg-gray-200"></div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={`w-full px-4 py-3 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                  errors.email ? "border-red-300" : "border-gray-200"
                }`}
                disabled={loading}
                autoComplete="email"
              />
              {errors.email && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-500 hover:underline font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className={`w-full px-4 py-3 pr-12 bg-gray-50 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                    errors.password ? "border-red-300" : "border-gray-200"
                  }`}
                  disabled={loading}
                  autoComplete="current-password"
                />
                <PasswordToggle
                  show={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              {errors.password && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {errors.password}
                </p>
              )}
            </div>

            {/* Remember Me Checkbox */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="remember"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                disabled={loading}
              />
              <label htmlFor="remember" className="ml-2 text-sm text-gray-700 cursor-pointer">
                Remember me on this device
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3.5 rounded-lg transition-all duration-300 hover:shadow-lg active:scale-[0.99]"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                "Sign in to your account"
              )}
            </button>
          </form>

          {/* Sign Up Link */}
          <div className="mt-8 pt-6 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Don't have an account?{" "}
              <Link
                to="/signup"
                className="text-blue-600 hover:text-blue-500 font-semibold hover:underline transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* Security Note */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
              </svg>
              <p className="text-xs text-gray-600">
                Your login information is encrypted and secure. We never share your personal data.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <p className="mt-6 text-center text-xs text-gray-500">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}