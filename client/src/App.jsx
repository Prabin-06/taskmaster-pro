import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Signup from "./pages/Signup"
import Login from "./pages/Login"
import Dashboard from "./pages/Dashboard"
import ProtectedRoute from "./components/ProtectedRoute"
import ForgotPassword from "./pages/ForgotPassword"
import ResetPassword from "./pages/ResetPassword"
import Profile from "./pages/Profile"


function AppContent() {
  const token = localStorage.getItem("token")

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="min-h-screen">
        <Routes>

          {/* Dashboard (Protected) */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Login */}
          <Route
            path="/login"
            element={
              token ? <Navigate to="/dashboard" replace /> : <Login />
            }
          />

          {/* Signup */}
          <Route
            path="/signup"
            element={
              token ? <Navigate to="/dashboard" replace /> : <Signup />
            }
          />

          {/* Profile */}
          <Route 
            path="/profile" 
            element={<Profile />} 
          />


          {/* Redirect everything else to dashboard */}
          <Route
            path="*"
            element={<Navigate to="/dashboard" replace />}
          />

          {/* Forgot Password */}
          <Route 
            path="/forgot-password" 
            element={<ForgotPassword />} 
          />

          {/* Reset Password */}
          <Route 
            path="/reset-password/:token" 
            element={<ResetPassword />} 
          />

        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}
