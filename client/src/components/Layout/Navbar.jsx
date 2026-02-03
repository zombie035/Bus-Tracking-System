// client/src/components/Layout/Navbar.jsx
import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import NotificationCenter from '../Admin/NotificationCenter';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'admin': return '/admin/dashboard';
      case 'driver': return '/driver/dashboard';
      case 'student': return '/student/dashboard';
      default: return '/';
    }
  };

  const renderStudentNav = () => (
    <div className="hidden md:flex items-center gap-6 mr-8">
      <Link to="/student/dashboard" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Home</Link>
      <Link to="/student/route" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Route & Stops</Link>
      <Link to="/student/history" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Trip History</Link>
      <Link to="/student/notifications" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Notifications</Link>
      <Link to="/student/profile" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Profile</Link>
      <Link to="/student/settings" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Settings</Link>
      <Link to="/student/help" className="text-sm font-medium text-gray-500 hover:text-blue-600 transition-colors">Help</Link>
    </div>
  );

  const location = useLocation();
  const isStudentDashboard = location.pathname === '/student/dashboard';

  if (isStudentDashboard) return null;

  return (
    <nav className="bg-white border-b border-zinc-200 sticky top-0 z-40 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to={getDashboardLink()} className="flex items-center gap-4 group">
              <div className="flex-shrink-0">
                <div className="h-8 w-8 bg-zinc-900 flex items-center justify-center transition-all duration-200 group-hover:bg-zinc-800">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                </div>
              </div>
              <div className="flex flex-col">
                <h1 className="text-lg font-bold text-zinc-900 tracking-tight leading-none group-hover:text-zinc-700 transition-colors">BUS TRACKER</h1>
                <p className="text-[10px] text-zinc-500 font-medium tracking-widest uppercase mt-0.5">{user?.role || 'Guest'}</p>
              </div>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            {user && user.role === 'student' && renderStudentNav()}
            {user && (
              <>
                {/* Notification Center - Admin only */}
                {user.role === 'admin' && <NotificationCenter />}
                <div className="hidden lg:block">
                  <div className="flex items-center gap-3 pl-4 border-l border-zinc-200">
                    <div className="w-8 h-8 bg-zinc-100 flex items-center justify-center text-zinc-700 font-semibold text-xs border border-zinc-200">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">{user.name}</p>
                      <p className="text-xs text-zinc-500">{user.email}</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-zinc-700 bg-white border border-zinc-300 hover:bg-zinc-50 hover:text-zinc-900 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-zinc-500 transition-all duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  LOGOUT
                </button>
              </>
            )}

            {/* Mobile Menu Button */}
            <div className="flex md:hidden items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 text-zinc-400 hover:text-zinc-500 hover:bg-zinc-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-zinc-500"
              >
                <span className="sr-only">Open main menu</span>
                {isMobileMenuOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {user && user.role === 'student' && (
              <>
                <Link
                  to="/student/dashboard"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  HOME
                </Link>
                <Link
                  to="/student/route"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  ROUTE & STOPS
                </Link>
                <Link
                  to="/student/history"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  TRIP HISTORY
                </Link>
                <Link
                  to="/student/notifications"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  NOTIFICATIONS
                </Link>
                <Link
                  to="/student/profile"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  PROFILE
                </Link>
                <Link
                  to="/student/settings"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  SETTINGS
                </Link>
                <Link
                  to="/student/help"
                  className="block px-3 py-2 text-base font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  HELP
                </Link>
              </>
            )}
          </div>

          {user && (
            <div className="pt-4 pb-4 border-t border-zinc-200">
              <div className="flex items-center px-5">
                <div className="flex-shrink-0">
                  <div className="h-10 w-10 bg-zinc-200 flex items-center justify-center text-zinc-500 font-semibold text-lg">
                    {user.name?.charAt(0).toUpperCase()}
                  </div>
                </div>
                <div className="ml-3">
                  <div className="text-base font-medium leading-none text-zinc-800">{user.name}</div>
                  <div className="text-sm font-medium leading-none text-zinc-500 mt-1">{user.email}</div>
                </div>
              </div>
              <div className="mt-3 px-2 space-y-1">
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="block w-full text-left px-3 py-2 text-base font-medium text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  SIGN OUT
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;