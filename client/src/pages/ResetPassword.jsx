import { useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import api from "../api"

export default function ResetPassword() {
  const { token } = useParams()
  const [password, setPassword] = useState("")
  const [message, setMessage] = useState("")
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await api.post(`/api/auth/reset-password/${token}`, { password })
      setMessage("Password reset successful! Redirecting to login...")
      setTimeout(() => navigate("/login"), 2000)
    } catch (err) {
      setMessage(err.response?.data?.message || "Error resetting password")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Reset Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Enter new password"
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <button className="w-full bg-green-500 text-white py-3 rounded">
            Reset Password
          </button>
        </form>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  )
}
