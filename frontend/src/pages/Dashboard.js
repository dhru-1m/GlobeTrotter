import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Plus,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { fetchTrips } from '../store/slices/tripSlice';
import { cn } from '../utils/cn';

const Dashboard = () => {
  const dispatch = useDispatch();
  const { trips, loading } = useSelector((state) => state.trips);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    dispatch(fetchTrips({ limit: 5 }));
  }, [dispatch]);

  const upcomingTrips = trips.filter(trip => 
    new Date(trip.startDate) > new Date() && ['planning', 'active'].includes(trip.status)
  );

  const completedTrips = trips.filter(trip => 
    trip.status === 'completed'
  );

  const totalDestinations = trips.reduce((acc, trip) => 
    acc + (trip.destinations?.length || 0), 0
  );

  const stats = [
    {
      name: 'Total Trips',
      value: trips.length,
      icon: MapPin,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
    },
    {
      name: 'Upcoming Trips',
      value: upcomingTrips.length,
      icon: Calendar,
      color: 'text-success-600',
      bgColor: 'bg-success-50',
    },
    {
      name: 'Completed Trips',
      value: completedTrips.length,
      icon: CheckCircle,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
    {
      name: 'Total Destinations',
      value: totalDestinations,
      icon: TrendingUp,
      color: 'text-warning-600',
      bgColor: 'bg-warning-50',
    },
  ];

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Welcome header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome back, {user?.name}!
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Here's an overview of your travel plans.
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white rounded-lg border border-gray-200 p-5">
              <div className="flex items-center">
                <div className={cn('p-2 rounded-md', stat.bgColor)}>
                  <Icon className={cn('h-5 w-5', stat.color)} />
                </div>
                <div className="ml-4">
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{stat.name}</p>
                  <p className="text-2xl font-semibold text-gray-900 mt-0.5">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/trips/create"
            className="flex items-center p-4 border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors duration-150"
          >
            <Plus className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Create New Trip</h3>
              <p className="text-xs text-gray-500 mt-0.5">Start planning your next adventure</p>
            </div>
          </Link>
          
          <Link
            to="/trips"
            className="flex items-center p-4 border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors duration-150"
          >
            <MapPin className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">View All Trips</h3>
              <p className="text-xs text-gray-500 mt-0.5">See your complete travel history</p>
            </div>
          </Link>
          
          <Link
            to="/profile"
            className="flex items-center p-4 border border-gray-200 rounded-md hover:border-primary-300 hover:bg-primary-50 transition-colors duration-150"
          >
            <Calendar className="h-6 w-6 text-primary-600 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-gray-900">Update Profile</h3>
              <p className="text-xs text-gray-500 mt-0.5">Manage your preferences</p>
            </div>
          </Link>
        </div>
      </div>

      {/* Upcoming trips */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-900">Upcoming Trips</h2>
          <Link
            to="/trips"
            className="text-sm text-primary-600 hover:text-primary-500 font-medium"
          >
            View all →
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-16 bg-gray-100 rounded-md"></div>
              </div>
            ))}
          </div>
        ) : upcomingTrips.length > 0 ? (
          <div className="space-y-2">
            {upcomingTrips.map((trip) => (
              <div
                key={trip._id}
                className="flex items-center justify-between p-3 border border-gray-100 rounded-md hover:bg-gray-50 transition-colors duration-150"
              >
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-medium text-gray-900 truncate">{trip.name}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(trip.startDate).toLocaleDateString()} – {new Date(trip.endDate).toLocaleDateString()}
                  </p>
                  <div className="flex items-center mt-1">
                    <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                    <span className="text-xs text-gray-400">
                      {trip.destinations?.length || 0} destinations
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-3 ml-4">
                  <span className="badge badge-primary">{trip.status}</span>
                  <Link
                    to={`/trips/${trip._id}`}
                    className="text-xs text-primary-600 hover:text-primary-500 font-medium whitespace-nowrap"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Calendar className="h-10 w-10 text-gray-300 mx-auto mb-3" />
            <h3 className="text-sm font-medium text-gray-900 mb-1">No upcoming trips</h3>
            <p className="text-xs text-gray-500 mb-4">Start planning your next adventure!</p>
            <Link
              to="/trips/create"
              className="btn-primary btn-sm inline-flex items-center"
            >
              <Plus className="h-3.5 w-3.5 mr-1.5" />
              Create Your First Trip
            </Link>
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-lg border border-gray-200 p-5">
        <h2 className="text-base font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="space-y-3">
          {trips.length > 0 ? (
            trips.slice(0, 5).map((trip) => {
              const isCompleted = trip.status === 'completed';
              const isUpcoming = new Date(trip.startDate) > new Date() && ['planning', 'active'].includes(trip.status);
              const daysUntilStart = isUpcoming
                ? Math.ceil((new Date(trip.startDate) - new Date()) / (1000 * 60 * 60 * 24))
                : null;
              return (
                <div key={trip._id} className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-0.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center ${
                      isCompleted ? 'bg-success-50' : isUpcoming ? 'bg-warning-50' : 'bg-primary-50'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-3.5 w-3.5 text-success-600" />
                      ) : isUpcoming ? (
                        <AlertCircle className="h-3.5 w-3.5 text-warning-600" />
                      ) : (
                        <Plus className="h-3.5 w-3.5 text-primary-600" />
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-700">
                      {isCompleted && <><span className="font-medium">{trip.name}</span> trip completed</>}
                      {isUpcoming && <><span className="font-medium">{trip.name}</span> starts in {daysUntilStart} day{daysUntilStart !== 1 ? 's' : ''}</>}
                      {!isCompleted && !isUpcoming && <>Created trip <span className="font-medium">{trip.name}</span></>}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {new Date(trip.updatedAt || trip.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-gray-400">No recent activity. Create your first trip!</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;