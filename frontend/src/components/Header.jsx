import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  // Don't show header on login/signup pages
  if (location.pathname === '/login' || location.pathname === '/signup') {
    return null;
  }

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <span className="text-2xl">🔄</span>
            <span className="text-xl font-bold text-blue-600">SlotSwapper</span>
          </Link>

          {/* Navigation - Only show if authenticated */}
          {isAuthenticated && (
            <nav className="hidden md:flex items-center space-x-1">
              <Link
                to="/"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Dashboard
              </Link>
              <Link
                to="/marketplace"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/marketplace')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Marketplace
              </Link>
              <Link
                to="/requests"
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  isActive('/requests')
                    ? 'bg-blue-50 text-blue-600'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Requests
              </Link>
            </nav>
          )}

          {/* User Menu */}
          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <div className="hidden sm:block">
                <span className="text-sm text-gray-600">Welcome,</span>
                <span className="text-sm font-semibold text-gray-900 ml-1">
                  {user?.name}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="btn-outline text-sm"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="text-gray-600 hover:text-gray-900 font-medium">
                Login
              </Link>
              <Link to="/signup" className="btn-primary text-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Navigation */}
        {isAuthenticated && (
          <div className="md:hidden pb-3 flex space-x-2">
            <Link
              to="/"
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Dashboard
            </Link>
            <Link
              to="/marketplace"
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/marketplace')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Marketplace
            </Link>
            <Link
              to="/requests"
              className={`flex-1 text-center px-3 py-2 rounded-lg text-sm font-medium ${
                isActive('/requests')
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600'
              }`}
            >
              Requests
            </Link>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;