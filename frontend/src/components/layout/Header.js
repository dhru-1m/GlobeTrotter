import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  Bell, 
  Search, 
  User, 
  Settings, 
  LogOut, 
  Menu,
  Globe,
  PanelLeftClose,
  PanelLeft
} from 'lucide-react';
import { logout } from '../../store/slices/authSlice';
import { toggleSidebar, toggleSidebarCollapsed } from '../../store/slices/uiSlice';

const Header = () => {
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
  };

  const handleToggleCollapse = () => {
    dispatch(toggleSidebarCollapsed());
  };

  return (
    <header className="bg-white border-b border-gray-200 h-16">
      <div className="flex items-center justify-between h-full px-6">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Desktop collapse button */}
          <button
            onClick={handleToggleCollapse}
            className="hidden lg:block p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 mr-2"
          >
            {sidebarCollapsed ? (
              <PanelLeft className="h-5 w-5" />
            ) : (
              <PanelLeftClose className="h-5 w-5" />
            )}
          </button>

          {/* Logo */}
          <Link to="/dashboard" className="flex items-center ml-4 lg:ml-0">
            <Globe className="h-6 w-6 text-primary-600 mr-2" />
            <span className="text-lg font-semibold text-gray-900">GlobeTrotter</span>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-md mx-8">
          <div className="relative w-full">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search trips, destinations..."
              className="input pl-10"
              onChange={(e) => {
                // TODO: Implement search functionality
                console.log('Search:', e.target.value);
              }}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-3">
          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="p-2 rounded-md text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors duration-150 relative"
            >
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-1.5 block h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            {/* Notifications dropdown */}
            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-slide-down">
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Notifications</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-primary-50 rounded-md border border-primary-100">
                      <p className="text-sm text-gray-800">
                        Your trip to Paris starts in 3 days!
                      </p>
                      <p className="text-xs text-gray-500 mt-1">2 hours ago</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-100">
                      <p className="text-sm text-gray-800">
                        New destination added to your bucket list
                      </p>
                      <p className="text-xs text-gray-500 mt-1">1 day ago</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 transition-colors duration-150"
            >
              <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="hidden md:block text-sm font-medium text-gray-700">
                {user?.name}
              </span>
            </button>

            {/* User dropdown */}
            {userMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50 animate-slide-down">
                <div className="py-1">
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="h-4 w-4 mr-3 text-gray-400" />
                    Profile
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors duration-150"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <Settings className="h-4 w-4 mr-3 text-gray-400" />
                    Profile Settings
                  </Link>
                  <hr className="my-1 border-gray-200" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
                  >
                    <LogOut className="h-4 w-4 mr-3 text-gray-400" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-6 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search trips, destinations..."
            className="input pl-10"
            onChange={(e) => {
              // TODO: Implement search functionality
              console.log('Search:', e.target.value);
            }}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;