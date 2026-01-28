import axios from "axios";

const api = axios.create({
  baseURL: "https://taskmaster-pro-1.onrender.com",
});

/* ================= ATTACH TOKEN ================= */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

/* ================= HANDLE AUTH ERRORS ================= */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log("API ERROR:", error.response?.status, error.response?.data);
    return Promise.reject(error);
  }
);


export default api;
