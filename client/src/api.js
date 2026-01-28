// client/src/api.js
import axios from "axios"

const api = axios.create({
  baseURL: "https://taskmaster-pro-1.onrender.com", // change if deployed
})

// Attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export default api
