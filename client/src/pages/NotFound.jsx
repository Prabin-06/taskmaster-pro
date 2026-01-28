import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-6">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
        <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
        <p className="text-gray-600 mb-6">
          The page you are looking for doesn’t exist or was moved.
        </p>

        <div className="flex gap-4 justify-center">
          <Link to="/dashboard" className="px-5 py-2 bg-blue-600 text-white rounded-lg">
            Dashboard
          </Link>
          <Link to="/login" className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}
