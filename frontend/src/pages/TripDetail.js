import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, Edit, Calendar, MapPin, DollarSign, Clock, Copy, Globe, Lock, Trash2 } from 'lucide-react';
import { fetchTrip, deleteTrip } from '../store/slices/tripSlice';
import { tripAPI, itineraryAPI, activityAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TripDetail = () => {
  const { tripId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [sharing, setSharing] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [itineraryData, setItineraryData] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);
  const [activitiesList, setActivitiesList] = useState([]);
  const { currentTrip: trip, tripLoading: loading, tripError: error } = useSelector((state) => state.trips);

  useEffect(() => {
    if (tripId) {
      dispatch(fetchTrip(tripId));
    }
  }, [dispatch, tripId]);

  useEffect(() => {
    if (tripId) {
      setItineraryLoading(true);
      itineraryAPI.getItinerary(tripId)
        .then(res => {
          if (res.data?.success) setItineraryData(res.data.data);
          else setItineraryError(res.data?.message || 'Failed to load itinerary');
        })
        .catch(e => setItineraryError(e.response?.data?.message || e.message))
        .finally(() => setItineraryLoading(false));
    }
  }, [tripId]);

  useEffect(() => {
    if(tripId){
      activityAPI.getActivities({ tripId })
        .then(r => setActivitiesList(r.data?.data || []))
        .catch(()=>{});
    }
  }, [tripId]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysBetween = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end dates
  };

  const getStatusColor = (status) => {
    const colors = {
      planning: 'bg-blue-100 text-blue-600',
      active: 'bg-yellow-100 text-yellow-600',
      completed: 'bg-green-100 text-green-600',
      cancelled: 'bg-red-100 text-red-600'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  };

  const handleMakePublic = async () => {
    try {
      setSharing(true);
      const response = await tripAPI.makePublic(tripId);
      const { shareUrl } = response.data.data;
      
      // Copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Trip is now public! Share URL copied to clipboard.');
      
      // Refresh trip data to get updated publicUrl
      dispatch(fetchTrip(tripId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to make trip public');
    } finally {
      setSharing(false);
    }
  };

  const handleMakePrivate = async () => {
    try {
      setSharing(true);
      await tripAPI.makePrivate(tripId);
      toast.success('Trip is now private');
      
      // Refresh trip data
      dispatch(fetchTrip(tripId));
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to make trip private');
    } finally {
      setSharing(false);
    }
  };

  const copyShareUrl = async () => {
    if (trip.publicUrl) {
      const url = `${window.location.origin}/public-itinerary/${trip.publicUrl}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Share URL copied to clipboard!');
      } catch (error) {
        toast.error('Failed to copy URL');
      }
    }
  };

  const handleDeleteTrip = async () => {
    try {
      setDeleting(true);
      await dispatch(deleteTrip(tripId)).unwrap();
      toast.success('Trip deleted successfully');
      navigate('/trips');
    } catch (err) {
      toast.error(err || 'Failed to delete trip');
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const buildDateRange = (start, end) => {
    const dates = [];
    const cur = new Date(start);
    const last = new Date(end);
    while (cur <= last) {
      dates.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return dates;
  };

  const toDateStr = (val) => {
    if (!val) return null;
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  };
  const groupActivitiesByDate = (list=[]) => {
    return list.reduce((acc,a)=>{
      const ds = toDateStr(a.date);
      if(!ds) return acc;
      if(!acc[ds]) acc[ds]=[];
      acc[ds].push(a);
      return acc;
    },{});
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-danger-50 border border-danger-200 rounded-md p-6">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Trip</h3>
          <p className="text-red-700">{error}</p>
          <Link to="/trips" className="btn-secondary mt-4 inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Trip Not Found</h3>
        <p className="text-gray-600 mb-4">The trip you're looking for doesn't exist or has been deleted.</p>
        <Link to="/trips" className="btn-secondary inline-flex items-center">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Trips
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4 min-w-0">
          <Link
            to="/trips"
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 flex-shrink-0"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-gray-900 truncate">{trip.name}</h1>
            {trip.description && (
              <p className="text-gray-600 truncate">{trip.description}</p>
            )}
            <div className="flex items-center mt-1.5">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(trip.status)}`}>
                {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2 flex-shrink-0">
          {/* Share Button - Different based on public status */}
          {trip.isPublic ? (
            <>
              <button
                onClick={copyShareUrl}
                className="btn-secondary inline-flex items-center whitespace-nowrap"
              >
                <Copy className="h-4 w-4 mr-1.5" />
                Copy Link
              </button>
              <button
                onClick={handleMakePrivate}
                disabled={sharing}
                className="btn-secondary inline-flex items-center text-red-600 hover:text-red-700 whitespace-nowrap"
              >
                <Lock className="h-4 w-4 mr-1.5" />
                {sharing ? 'Making Private...' : 'Make Private'}
              </button>
            </>
          ) : (
            <button
              onClick={handleMakePublic}
              disabled={sharing}
              className="btn-secondary inline-flex items-center whitespace-nowrap"
            >
              <Globe className="h-4 w-4 mr-1.5" />
              {sharing ? 'Sharing...' : 'Make Public'}
            </button>
          )}
          
          {(trip.isPublic || trip.publicUrl) && (
            <Link
              to={`/public-itinerary/${trip.publicUrl || trip._id}`}
              className="btn-secondary inline-flex items-center whitespace-nowrap"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin className="h-4 w-4 mr-1.5" />
              Public View
            </Link>
          )}
          <Link
            to={`/trips/${tripId}/calendar`}
            className="btn-secondary inline-flex items-center whitespace-nowrap"
          >
            <Calendar className="h-4 w-4 mr-1.5" />
            Calendar
          </Link>
          <Link
            to={`/trips/${tripId}/edit`}
            className="btn-primary inline-flex items-center whitespace-nowrap"
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit Trip
          </Link>
          <button
            type="button"
            onClick={() => setShowDeleteModal(true)}
            className="btn-secondary inline-flex items-center text-red-600 hover:text-red-700 hover:bg-red-50 whitespace-nowrap"
            title="Delete this trip"
          >
            <Trash2 className="h-4 w-4 mr-1.5" />
            Delete
          </button>
        </div>
      </div>

      {/* Trip overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Trip info */}
          <div className="card">
            <div className="card-header">
              <h2 className="text-lg font-semibold text-gray-900">Trip Information</h2>
            </div>
            <div className="card-body">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Duration</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(trip.startDate)} - {formatDate(trip.endDate)} 
                      ({getDaysBetween(trip.startDate, trip.endDate)} days)
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Destinations</p>
                    <p className="text-sm text-gray-600">
                      {trip.destinations?.length || 0} destination{trip.destinations?.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                {trip.budget?.total > 0 && (
                  <div className="flex items-center space-x-3">
                    <DollarSign className="h-5 w-5 text-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Budget</p>
                      <p className="text-sm text-gray-600">
                        {trip.budget.currency} {trip.budget.total.toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Created</p>
                    <p className="text-sm text-gray-600">
                      {formatDate(trip.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Destinations and Activities */}
          <div className="card">
            <div className="card-header">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Destinations & Activities</h2>
                <div className="flex items-center space-x-3">
                  <Link
                    to={`/trips/${tripId}/calendar`}
                    className="text-sm text-primary-600 hover:text-primary-500 font-medium inline-flex items-center"
                  >
                    <Calendar className="h-4 w-4 mr-1" />
                    Calendar View
                  </Link>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                {trip.destinations && trip.destinations.length > 0 ? (
                  trip.destinations.map((destination, index) => (
                    <div key={destination._id || index} className="border-l-4 border-primary-500 pl-4 mb-4">
                      <h3 className="font-medium text-gray-900">
                        {destination.city}, {destination.country}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {formatDate(destination.arrivalDate)} - {formatDate(destination.departureDate)}
                      </p>
                    </div>
                  ))
                ) : null}

                {/* Timeline */}
                {itineraryLoading && (
                  <div className="text-center py-4 text-sm text-gray-500">Loading itinerary...</div>
                )}
                {itineraryError && (
                  <div className="text-sm text-red-600">{itineraryError}</div>
                )}
                {!itineraryLoading && !itineraryError && (itineraryData || activitiesList.length) && (
                  <div className="mt-2 space-y-6">
                    {(() => {
                      const combinedByDate = { ...(itineraryData?.itinerary||{}) };
                      const fallbackGrouped = groupActivitiesByDate(activitiesList);
                      Object.keys(fallbackGrouped).forEach(k => {
                        if (!combinedByDate[k]) combinedByDate[k] = fallbackGrouped[k];
                      });
                      return buildDateRange(trip.startDate, trip.endDate).map((d, idx) => {
                        const dateStr = toDateStr(d);
                        const dayActs = combinedByDate[dateStr] || [];
                        return (
                          <div key={dateStr} className="">
                            <div className="flex items-center mb-2">
                              <div className="font-semibold text-gray-800 mr-3">Day {idx + 1}</div>
                              <div className="text-sm text-gray-600">{formatDate(dateStr)}</div>
                              <div className="ml-3 text-xs text-gray-400">{dayActs.length} activit{dayActs.length===1?'y':'ies'}</div>
                            </div>
                            {dayActs.length === 0 ? (
                              <div className="text-xs text-gray-400 ml-1">No activities planned</div>
                            ) : (
                              <div className="space-y-2">
                                {dayActs.sort((a,b)=> (a.startTime||'').localeCompare(b.startTime||'')).map(a => (
                                  <div key={a._id} className="flex items-start text-sm bg-gray-50 rounded p-2 border border-gray-100">
                                    <div className="w-28 font-mono text-gray-700">{a.startTime} - {a.endTime}</div>
                                    <div className="flex-1">
                                      <div className="font-medium text-gray-800">{a.title}</div>
                                      {a.destination?.city && (
                                        <div className="text-xs text-gray-500">{a.destination.city}{a.destination.country?', '+a.destination.country:''}</div>
                                      )}
                                    </div>
                                    {a.cost?.amount > 0 && (
                                      <div className="text-xs text-gray-600 ml-2">{a.cost.currency} {a.cost.amount}</div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                {/* Empty state if nothing */}
                {(!trip.destinations || trip.destinations.length === 0) && (!itineraryData || Object.keys(itineraryData.itinerary || {}).length === 0) && !itineraryLoading && !itineraryError && (
                  <div className="text-center py-6">
                    <MapPin className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">No destinations added yet</p>
                    <Link
                      to={`/trips/${tripId}/calendar`}
                      className="text-sm text-primary-600 hover:text-primary-500 font-medium"
                    >
                      Add destinations
                    </Link>
                  </div>
                )}

                {/* Recent activities (retain existing) */}
                {trip.activities && trip.activities.length > 0 && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-gray-900 mb-2">Recent Activities</h4>
                    <div className="space-y-2">
                      {trip.activities.slice(0, 3).map((activity, index) => (
                        <div key={activity._id || index} className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                          <span className="text-sm text-gray-600">{activity.title}</span>
                        </div>
                      ))}
                      {trip.activities.length > 3 && (
                        <p className="text-xs text-gray-500 pl-4">
                          +{trip.activities.length - 3} more activities
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick actions */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            </div>
            <div className="card-body">
              <div className="space-y-3">
                <Link
                  to={`/trips/${tripId}/calendar`}
                  className="block w-full text-left p-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                >
                  <h4 className="font-medium text-gray-900">Edit Itinerary</h4>
                  <p className="text-sm text-gray-600">Add activities and destinations</p>
                </Link>
                <Link
                  to={`/trips/${tripId}/budget`}
                  className="block w-full text-left p-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                >
                  <h4 className="font-medium text-gray-900">Manage Budget</h4>
                  <p className="text-sm text-gray-600">Track expenses and costs</p>
                </Link>
                <button className="block w-full text-left p-3 rounded-md border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200">
                  <h4 className="font-medium text-gray-900">Share Trip</h4>
                  <p className="text-sm text-gray-600">Invite friends and family</p>
                </button>
              </div>
            </div>
          </div>

          {/* Trip stats */}
          <div className="card">
            <div className="card-header">
              <h3 className="text-lg font-semibold text-gray-900">Trip Stats</h3>
            </div>
            <div className="card-body">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Activities Planned</span>
                  <span className="text-sm font-medium text-gray-900">
                    {trip.activities?.length || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Budget</span>
                  <span className="text-sm font-medium text-gray-900">
                    {trip.budget?.total ? `${trip.budget.currency} ${trip.budget.total.toLocaleString()}` : 'Not set'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Trip Duration</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getDaysBetween(trip.startDate, trip.endDate)} days
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Destinations</span>
                  <span className="text-sm font-medium text-gray-900">
                    {trip.destinations?.length || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Trip</h3>
                <p className="text-xs text-gray-500">This action cannot be undone</p>
              </div>
            </div>
            
            <p className="text-sm text-gray-600">
              Are you sure you want to delete <strong className="text-gray-900">"{trip.name}"</strong>? All associated activities, schedule, and itinerary data will be permanently removed.
            </p>

            <div className="flex justify-end space-x-3 pt-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleting}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTrip}
                disabled={deleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition-colors flex items-center"
              >
                {deleting ? 'Deleting...' : 'Delete Trip'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripDetail;