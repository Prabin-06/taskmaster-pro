import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-lg">
        <div className="text-6xl font-bold text-gray-300 mb-6">404</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            to="/dashboard"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/login"
            className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg"
          >
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
