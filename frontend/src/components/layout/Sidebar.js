import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { NavLink, Link } from 'react-router-dom';
import { 
  Home, 
  Map, 
  Plus, 
  User, 
  BarChart3,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
  ClipboardList,
  Globe,
  Shield
} from 'lucide-react';
import { setSidebarOpen, toggleSidebarCollapsed } from '../../store/slices/uiSlice';

const Sidebar = () => {
  const dispatch = useDispatch();
  const { sidebarOpen, sidebarCollapsed } = useSelector((state) => state.ui);
  const { trips } = useSelector((state) => state.trips);
  const { user } = useSelector((state) => state.auth);

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: Home },
    { name: 'My Trips', href: '/trips', icon: Map },
    { name: 'Create Trip', href: '/trips/create', icon: Plus },
    { name: 'Trip Planner', href: '/planner', icon: ClipboardList },
    { name: 'Budget Overview', href: '/budget', icon: BarChart3 },
    { name: 'Search Cities', href: '/cities', icon: Search },
    { name: 'Discover Trips', href: '/discover', icon: Globe },
    { name: 'Profile', href: '/profile', icon: User },
  ];

  // Add admin dashboard for admin users
  if (user?.role === 'admin') {
    navigation.push({ name: 'Admin Dashboard', href: '/admin', icon: Shield });
  }

  const closeSidebar = () => {
    dispatch(setSidebarOpen(false));
  };

  const toggleCollapse = () => {
    dispatch(toggleSidebarCollapsed());
  };

  return (
    <>
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-50 z-40 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <div className={`
        flex-shrink-0 fixed lg:relative top-0 left-0 z-40 h-screen bg-white border-r border-gray-200 transform transition-all duration-300 ease-in-out lg:transform-none
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        ${sidebarCollapsed ? 'w-16' : 'w-60'}
      `}>
        <div className={`flex items-center justify-between h-16 px-4 border-b border-gray-200 ${sidebarCollapsed ? 'lg:px-3' : ''}`}>
          <div className={`flex items-center ${sidebarCollapsed ? 'lg:justify-center lg:w-full' : ''}`}>
            <Map className="h-6 w-6 text-primary-600 mr-2 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-lg font-semibold text-gray-900">GlobeTrotter</span>
            )}
          </div>
          <button
            onClick={closeSidebar}
            className="lg:hidden p-1.5 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors duration-150"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Collapse toggle button - only visible on desktop */}
        <div className="hidden lg:block">
          <button
            onClick={toggleCollapse}
            className="absolute -right-3 top-20 bg-white border border-gray-300 rounded-full p-1 hover:bg-gray-50 shadow-sm z-50"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-3 w-3 text-gray-500" />
            ) : (
              <ChevronLeft className="h-3 w-3 text-gray-500" />
            )}
          </button>
        </div>

        <nav className="mt-4 px-3">
          <div className="space-y-0.5">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.href === '/trips'}
                  onClick={closeSidebar}
                  className={({ isActive }) =>
                    `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-150 ${
                      isActive
                        ? 'bg-primary-50 text-primary-700 border-l-2 border-primary-600'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    } ${sidebarCollapsed ? 'lg:justify-center lg:px-2' : ''}`
                  }
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <Icon className={`h-5 w-5 flex-shrink-0 ${!sidebarCollapsed ? 'mr-3' : ''}`} />
                  {!sidebarCollapsed && (
                    <span>{item.name}</span>
                  )}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Quick actions */}
        {!sidebarCollapsed && (
          <div className="mt-6 px-3">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Quick Actions
            </h3>
            <div className="mt-2 space-y-0.5">
              <Link
                to="/trips/create"
                className="group flex items-center w-full px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              >
                <Plus className="mr-3 h-4 w-4" />
                New Trip
              </Link>
              <Link
                to="/trips"
                className="group flex items-center w-full px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors duration-150"
              >
                <Map className="mr-3 h-4 w-4" />
                View All Trips
              </Link>
            </div>
          </div>
        )}

        {/* Recent trips */}
        {!sidebarCollapsed && (
          <div className="mt-6 px-3">
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Recent Trips
            </h3>
            <div className="mt-2 space-y-0.5">
              {trips && trips.length > 0 ? (
                trips.slice(0, 3).map((trip) => (
                  <Link
                    key={trip._id}
                    to={`/trips/${trip._id}`}
                    className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 hover:text-gray-900 rounded-md cursor-pointer block transition-colors duration-150"
                  >
                    <div className="font-medium truncate">{trip.name}</div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {new Date(trip.startDate).toLocaleDateString()} - {new Date(trip.endDate).toLocaleDateString()}
                    </div>
                  </Link>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-gray-400">
                  No trips yet
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Sidebar;