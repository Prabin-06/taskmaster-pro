import { useState, useEffect } from "react"
import api from "../api"

export default function Profile() {
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"))
    if (user) setName(user.name)
  }, [])

  const handleUpdate = async (e) => {
    e.preventDefault()
    try {
      await api.put(
        "/api/auth/update-profile",
        { name },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      )

      setMessage("Profile updated successfully!")

      // Update local storage
      const updatedUser = { ...JSON.parse(localStorage.getItem("user")), name }
      localStorage.setItem("user", JSON.stringify(updatedUser))

      // Tell other pages user changed
      window.dispatchEvent(new Event("userUpdated"))

    } catch (err) {
      setMessage(err.response?.data?.message || "Update failed")
    }
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Your Profile</h2>

      <form onSubmit={handleUpdate} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full border p-3 rounded"
        />

        <button className="w-full bg-amber-500 text-white py-3 rounded">
          Update Name
        </button>
      </form>

      {message && <p className="mt-4 text-sm">{message}</p>}
    </div>
  )
}
