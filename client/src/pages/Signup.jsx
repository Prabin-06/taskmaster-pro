import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../api";

export default function Signup() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [passwordStrength, setPasswordStrength] = useState(0);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));

    if (name === "password") calculatePasswordStrength(value);

    if (name === "confirmPassword" && formData.password !== value) {
      setErrors((prev) => ({ ...prev, confirmPassword: "Passwords do not match" }));
    } else if (name === "confirmPassword") {
      setErrors((prev) => ({ ...prev, confirmPassword: "" }));
    }
  };

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
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters";
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!agreeTerms) newErrors.terms = "You must agree to the terms";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await api.post("/api/auth/signup", {
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
      navigate("/login");
    } catch (err) {
      setErrors({ form: err.response?.data?.message || "Signup failed" });
    } finally {
      setLoading(false);
    }
  };

  const PasswordToggle = ({ show, onClick }) => (
    <button type="button" onClick={onClick} className="absolute right-3 top-1/2 -translate-y-1/2">
      {show ? "🙈" : "👁️"}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 w-full max-w-lg">
        <h1 className="text-3xl font-bold text-center mb-6">Create Account</h1>

        {errors.form && <p className="text-red-600 mb-4">{errors.form}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} className="w-full p-3 border rounded-lg" />
          <input name="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} className="w-full p-3 border rounded-lg" />

          <div className="relative">
            <input type={showPassword ? "text" : "password"} name="password" placeholder="Password" value={formData.password} onChange={handleChange} className="w-full p-3 border rounded-lg pr-10" />
            <PasswordToggle show={showPassword} onClick={() => setShowPassword(!showPassword)} />
          </div>

          <div className="relative">
            <input type={showConfirmPassword ? "text" : "password"} name="confirmPassword" placeholder="Confirm Password" value={formData.confirmPassword} onChange={handleChange} className="w-full p-3 border rounded-lg pr-10" />
            <PasswordToggle show={showConfirmPassword} onClick={() => setShowConfirmPassword(!showConfirmPassword)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
            I agree to the terms
          </label>

          <button disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-lg">
            {loading ? "Creating..." : "Sign Up"}
          </button>
        </form>

        <p className="text-center mt-4">
          Already have an account? <Link to="/login" className="text-blue-600">Login</Link>
        </p>
      </div>
    </div>
  );
}
