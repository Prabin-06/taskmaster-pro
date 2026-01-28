import { useState } from "react"
import api from "../api"

export default function ForgotPassword() {
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e) => {
    e.preventDefault()
    const res = await api.post("/api/auth/forgot-password", { email })
    setMessage("Reset token: " + res.data.resetToken)
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
