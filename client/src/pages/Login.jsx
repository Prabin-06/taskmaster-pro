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

  /* =====================
     PREFILL + MESSAGES
  ====================== */
  useEffect(() => {
    const message = location.state?.message;
    const email = location.state?.email;

    if (message) setErrors({ success: message });
    if (email) setFormData(prev => ({ ...prev, email }));

    const rememberedEmail = localStorage.getItem("rememberedEmail");
    if (rememberedEmail) {
      setFormData(prev => ({ ...prev, email: rememberedEmail }));
      setRememberMe(true);
    }
  }, [location]);

  /* =====================
     INPUT CHANGE
  ====================== */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors(prev => ({ ...prev, [name]: "" }));
    if (errors.form) setErrors(prev => ({ ...prev, form: "" }));
  };

  /* =====================
     VALIDATION
  ====================== */
  const validateForm = () => {
    const newErrors = {};

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /* =====================
     SUBMIT LOGIN
  ====================== */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await api.post("/api/auth/login", {
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
      });

      localStorage.setItem("token", response.data.token);

      if (response.data.user) {
        localStorage.setItem("user", JSON.stringify(response.data.user));
      }

      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email.trim());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      setLoginAttempts(0);
      setErrors({ success: "Login successful! Redirecting..." });

      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);

    } catch (err) {
      const errorMessage =
        err.response?.data?.message || "Login failed. Check credentials.";

      const attempts = loginAttempts + 1;
      setLoginAttempts(attempts);

      if (err.response?.status === 401) {
        setErrors({ form: errorMessage, remainingAttempts: 5 - attempts });
      } else if (err.response?.status === 404) {
        setErrors({ form: "No account found with this email." });
      } else {
        setErrors({ form: errorMessage });
      }
    } finally {
      setLoading(false);
    }
  };

  /* =====================
     PASSWORD TOGGLE
  ====================== */
  const PasswordToggle = ({ show, onClick }) => (
    <button
      type="button"
      onClick={onClick}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
    >
      {show ? "🙈" : "👁️"}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">

        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Welcome Back</h1>
          <p className="text-gray-600 mt-2">
            Sign in to access your tasks
          </p>
        </div>

        {/* FORM BOX */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">

          {errors.success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl">
              {errors.success}
            </div>
          )}

          {errors.form && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
              {errors.form}
              {errors.remainingAttempts > 0 && (
                <p className="text-sm mt-1">
                  {errors.remainingAttempts} attempts remaining
                </p>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* EMAIL */}
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg"
              />
              {errors.email && <p className="text-red-600 text-sm">{errors.email}</p>}
            </div>

            {/* PASSWORD */}
            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full p-3 border rounded-lg pr-10"
                />
                <PasswordToggle
                  show={showPassword}
                  onClick={() => setShowPassword(!showPassword)}
                />
              </div>
              {errors.password && <p className="text-red-600 text-sm">{errors.password}</p>}
            </div>

            {/* REMEMBER ME */}
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={e => setRememberMe(e.target.checked)}
              />
              <label className="text-sm">Remember me</label>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-blue-600 hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
