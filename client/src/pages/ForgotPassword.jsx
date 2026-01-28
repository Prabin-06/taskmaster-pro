import { useState } from "react"
import api from "../api"
import { useNavigate } from "react-router-dom"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")


  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const res = await api.post("/api/auth/forgot-password", { email })

      // 🚀 Auto redirect to reset page with token
      navigate(`/reset-password/${res.data.resetToken}`)
    } catch (err) {
      setMessage(err.response?.data?.message || "Error sending reset link")
    }
  }


  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Enter your email"
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border p-3 rounded"
            required
          />

          <button className="w-full bg-amber-500 text-white py-3 rounded">
            Get Reset Token
          </button>
        </form>

        {message && <p className="mt-4 text-sm">{message}</p>}
      </div>
    </div>
  )
}
