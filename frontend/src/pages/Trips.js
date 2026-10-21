import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Plus, MapPin, Calendar, Search } from 'lucide-react';
import { fetchTrips } from '../store/slices/tripSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';

const Trips = () => {
  const dispatch = useDispatch();
  const { trips, loading, error } = useSelector((state) => state.trips);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    dispatch(fetchTrips({ search: searchQuery, status: statusFilter }));
  }, [dispatch, searchQuery, statusFilter]);

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleStatusChange = (e) => {
    setStatusFilter(e.target.value);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      planning: 'badge badge-primary',
      active: 'badge badge-warning',
      completed: 'badge badge-success',
      cancelled: 'badge badge-danger'
    };
    return statusClasses[status] || 'badge badge-secondary';
  };

  return (
    <div className="space-y-5 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Trips</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage and organize your travel adventures</p>
        </div>
        <Link
          to="/trips/create"
          className="btn-primary inline-flex items-center"
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Create Trip
        </Link>
      </div>

      {/* Search and filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search trips..."
                className="input pl-10"
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
          <select 
            className="input md:w-44"
            value={statusFilter}
            onChange={handleStatusChange}
          >
            <option value="">All Status</option>
            <option value="planning">Planning</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="bg-danger-50 border border-danger-200 rounded-md p-4">
          <p className="text-sm text-danger-700">{error}</p>
        </div>
      )}

      {/* Trips grid */}
      {!loading && !error && trips && trips.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trips.map((trip) => (
            <div key={trip._id} className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:border-gray-300 transition-colors duration-150">
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-900 truncate mr-2">{trip.name}</h3>
                  <span className={getStatusBadge(trip.status)}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    {formatDate(trip.startDate)} – {formatDate(trip.endDate)}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <MapPin className="h-3.5 w-3.5 mr-1.5 flex-shrink-0" />
                    {trip.destinations?.length || 0} destination{trip.destinations?.length !== 1 ? 's' : ''}
                  </div>
                </div>
                {trip.description && (
                  <p className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {trip.description}
                  </p>
                )}
                <div className="flex space-x-2 pt-3 border-t border-gray-100">
                  <Link
                    to={`/trips/${trip._id}`}
                    className="btn-primary btn-sm flex-1 text-center"
                  >
                    View Details
                  </Link>
                  <Link
                    to={`/trips/${trip._id}/edit`}
                    className="btn-secondary btn-sm"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && (!trips || trips.length === 0) && (
        <div className="text-center py-12">
          <MapPin className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {searchQuery || statusFilter ? 'No trips found' : 'No trips yet'}
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            {searchQuery || statusFilter 
              ? 'Try adjusting your search criteria or filters.' 
              : 'Start planning your first adventure!'
            }
          </p>
          <Link
            to="/trips/create"
            className="btn-primary btn-sm inline-flex items-center"
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            {searchQuery || statusFilter ? 'Create New Trip' : 'Create Your First Trip'}
          </Link>
        </div>
      )}
    </div>
  );
};

export default Trips;