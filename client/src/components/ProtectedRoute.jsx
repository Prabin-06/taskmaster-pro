import { Navigate } from "react-router-dom";

export default function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");

  // Not logged in → kick to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → allow access
  return children;
}
