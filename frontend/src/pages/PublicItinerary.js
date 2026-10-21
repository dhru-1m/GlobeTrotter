import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Share2, 
  Copy, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Clock, 
  Users, 
  Globe, 
  Star,
  Download,
  Eye,
  ExternalLink
} from 'lucide-react';
import { tripAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PublicItinerary = () => {
  const { publicUrl } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [itinerary, setItinerary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copying, setCopying] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    const fetchPublicItinerary = async () => {
      try {
        setLoading(true);
        const response = await tripAPI.getPublicItinerary(publicUrl);
        const data = response.data.data;
        setTrip(data.trip);
        setItinerary(data.itinerary);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to load itinerary');
      } finally {
        setLoading(false);
      }
    };

    if (publicUrl) {
      fetchPublicItinerary();
    }
  }, [publicUrl]);

  const copyToClipboard = async () => {
    try {
      setSharing(true);
      const shareUrl = `${window.location.origin}/public-itinerary/${publicUrl}`;
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard!');
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      toast.error('Failed to copy link');
    } finally {
      setSharing(false);
    }
  };

  const shareOnSocialMedia = (platform) => {
    const shareUrl = `${window.location.origin}/public-itinerary/${publicUrl}`;
    const shareText = `Check out this amazing trip: ${trip.name}`;
    
    let url = '';
    switch (platform) {
      case 'twitter':
        url = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`;
        break;
      case 'facebook':
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
      default:
        return;
    }
    
    window.open(url, '_blank', 'width=600,height=400');
  };

  const copyTrip = async () => {
    try {
      setCopying(true);
      await tripAPI.copyPublicTrip(publicUrl);
      toast.success('Trip copied to your account successfully!');
      navigate('/trips');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to copy trip. Please try again.');
    } finally {
      setCopying(false);
    }
  };

  const downloadPDF = () => {
    // This would integrate with a PDF generation library
    toast.success('PDF download feature coming soon!');
  };

  const calculateTripDuration = () => {
    if (!trip) return 0;
    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
  };

  const getTotalBudget = () => {
    return trip?.budget?.total || 0;
  };

  const getDestinationCount = () => {
    return trip?.destinations?.length || 0;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getActivityTypeColor = (type) => {
    const colors = {
      accommodation: 'bg-purple-100 text-purple-800',
      transportation: 'bg-blue-100 text-blue-800',
      dining: 'bg-orange-100 text-orange-800',
      entertainment: 'bg-pink-100 text-pink-800',
      sightseeing: 'bg-green-100 text-green-800',
      shopping: 'bg-yellow-100 text-yellow-800',
      adventure: 'bg-red-100 text-red-800',
      cultural: 'bg-indigo-100 text-indigo-800',
      relaxation: 'bg-teal-100 text-teal-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[type] || colors.default;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading itinerary...</p>
        </div>
      </div>
    );
  }

  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Itinerary Not Found</h1>
          <p className="text-gray-600 mb-6">{error || 'This itinerary may be private or no longer available.'}</p>
          <Link to="/" className="btn-primary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  const itineraryDays = itinerary ? Object.keys(itinerary).sort() : [];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{trip.name}</h1>
                <p className="text-sm text-gray-600 flex items-center">
                  <Eye className="h-4 w-4 mr-1" />
                  Public Itinerary
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <button
                onClick={downloadPDF}
                className="flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Download
              </button>
              
              <div className="relative">
                <button
                  onClick={copyToClipboard}
                  disabled={sharing}
                  className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    copied 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <Share2 className="h-4 w-4 mr-2" />
                  {copied ? 'Copied!' : sharing ? 'Copying...' : 'Share'}
                </button>
              </div>
              
              <button
                onClick={copyTrip}
                disabled={copying}
                className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copying ? 'Copying...' : 'Copy Trip'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Cover Photo */}
            {trip.coverPhoto && (
              <div className="relative h-64 rounded-md overflow-hidden">
                <img 
                  src={trip.coverPhoto} 
                  alt={trip.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-20"></div>
                <div className="absolute bottom-4 left-4 text-white">
                  <h2 className="text-2xl font-bold">{trip.name}</h2>
                  <p className="text-sm opacity-90">
                    {formatDate(trip.startDate)} - {formatDate(trip.endDate)}
                  </p>
                </div>
              </div>
            )}

            {/* Trip Description */}
            {trip.description && (
              <div className="card">
                <div className="card-header">
                  <h2 className="text-xl font-semibold text-gray-900">About This Trip</h2>
                </div>
                <div className="card-body">
                  <p className="text-gray-700 leading-relaxed">{trip.description}</p>
                </div>
              </div>
            )}

            {/* Social Sharing */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Share This Itinerary</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => shareOnSocialMedia('twitter')}
                    className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Twitter
                  </button>
                  <button
                    onClick={() => shareOnSocialMedia('facebook')}
                    className="flex items-center px-4 py-2 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Facebook
                  </button>
                  <button
                    onClick={() => shareOnSocialMedia('linkedin')}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    LinkedIn
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Trip Overview */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Trip Overview</h3>
              </div>
              <div className="card-body space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Duration</span>
                  <span className="font-medium">{calculateTripDuration()} days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Destinations</span>
                  <span className="font-medium">{getDestinationCount()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total Budget</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(getTotalBudget(), trip.budget?.currency)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                    trip.status === 'active' ? 'bg-blue-100 text-blue-800' :
                    trip.status === 'planning' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Created By */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Created By</h3>
              </div>
              <div className="card-body">
                <div className="flex items-center space-x-3">
                  {trip.user?.profilePicture ? (
                    <img 
                      src={trip.user.profilePicture} 
                      alt={trip.user.firstName} 
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-gray-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {trip.user?.firstName ? `${trip.user.firstName} ${trip.user.lastName}` : 'Traveler'}
                    </p>
                    {trip.user?.username && (
                      <p className="text-sm text-gray-600">@{trip.user.username}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Tags */}
            {trip.tags && trip.tags.length > 0 && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Tags</h3>
                </div>
                <div className="card-body">
                  <div className="flex flex-wrap gap-2">
                    {trip.tags.map((tag, index) => (
                      <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Budget Breakdown */}
            {trip.budget?.breakdown && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Budget Breakdown</h3>
                </div>
                <div className="card-body space-y-3">
                  {Object.entries(trip.budget.breakdown).map(([category, amount]) => (
                    amount > 0 && (
                      <div key={category} className="flex items-center justify-between">
                        <span className="text-gray-600 capitalize">{category}</span>
                        <span className="font-medium">
                          {formatCurrency(amount, trip.budget.currency)}
                        </span>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Detailed Itinerary */}
        <div className="card">
          <div className="card-header">
            <h2 className="text-xl font-semibold text-gray-900">Detailed Itinerary</h2>
            <p className="text-sm text-gray-600">Day-by-day breakdown of activities and plans</p>
          </div>
          <div className="card-body">
            {itineraryDays.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-600 text-lg mb-2">No detailed itinerary available</p>
                <p className="text-gray-500">This trip doesn't have specific daily activities planned yet.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {itineraryDays.map((dateStr, dayIndex) => {
                  const dayData = itinerary[dateStr];
                  const dayNumber = dayIndex + 1;
                  
                  return (
                    <div key={dateStr} className="relative">
                      {/* Timeline connector */}
                      {dayIndex < itineraryDays.length - 1 && (
                        <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200 -z-10"></div>
                      )}
                      
                      {/* Day Header */}
                      <div className="flex items-start space-x-4">
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm">
                            <span className="text-sm font-semibold text-primary-600">
                              {dayNumber}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-4">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900">
                                Day {dayNumber}
                              </h3>
                              <p className="text-gray-600 flex items-center">
                                <Calendar className="h-4 w-4 mr-2" />
                                {formatDate(dayData.date)}
                              </p>
                            </div>
                            
                            <div className="text-right">
                              <div className="text-sm text-gray-500">
                                {dayData.activities.length} {dayData.activities.length === 1 ? 'activity' : 'activities'}
                              </div>
                              {dayData.activities.length > 0 && (
                                <div className="text-sm text-gray-500">
                                  Total: {formatCurrency(
                                    dayData.activities.reduce((sum, activity) => sum + (activity.cost?.amount || 0), 0),
                                    trip.budget?.currency
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Activities for the day */}
                      <div className="ml-16">
                        {dayData.activities.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-lg">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No activities planned for this day</p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {dayData.activities.map((activity, activityIndex) => (
                              <div
                                key={activity._id}
                                className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow duration-200"
                              >
                                <div className="flex items-start justify-between mb-2">
                                  <h4 className="text-lg font-medium text-gray-900">
                                    {activity.name}
                                  </h4>
                                  {activity.rating && (
                                    <div className="flex items-center">
                                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                      <span className="text-sm text-gray-600 ml-1">
                                        {activity.rating}
                                      </span>
                                    </div>
                                  )}
                                </div>
                                
                                {activity.description && (
                                  <p className="text-gray-600 text-sm mb-3">{activity.description}</p>
                                )}
                                
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-3">
                                  {activity.time && (
                                    <div className="flex items-center">
                                      <Clock className="h-4 w-4 mr-1" />
                                      {formatTime(activity.time)}
                                    </div>
                                  )}
                                  
                                  {activity.location && (
                                    <div className="flex items-center">
                                      <MapPin className="h-4 w-4 mr-1" />
                                      <span className="truncate max-w-xs">
                                        {activity.location}
                                      </span>
                                    </div>
                                  )}
                                  
                                  {activity.duration && (
                                    <div className="flex items-center">
                                      <Users className="h-4 w-4 mr-1" />
                                      {activity.duration} hours
                                    </div>
                                  )}
                                  
                                  {activity.cost?.amount > 0 && (
                                    <div className="flex items-center">
                                      <DollarSign className="h-4 w-4 mr-1" />
                                      {formatCurrency(activity.cost.amount, activity.cost.currency)}
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                  {activity.type && (
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(activity.type)}`}>
                                      {activity.type}
                                    </span>
                                  )}
                                  
                                  {activity.tags && activity.tags.map((tag, index) => (
                                    <span
                                      key={index}
                                      className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>

                                {activity.notes && (
                                  <div className="mt-3 pt-3 border-t border-gray-100">
                                    <p className="text-sm text-gray-600 italic">{activity.notes}</p>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center py-8">
          <div className="bg-primary-50 rounded-md p-8 border border-primary-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Inspired by this trip?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Copy this itinerary to your account and customize it for your own adventure! 
              Add your own activities, adjust the schedule, and make it perfect for your travel style.
            </p>
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={copyTrip}
                disabled={copying}
                className="btn-primary px-8 py-3 text-lg"
              >
                <Copy className="h-5 w-5 mr-2" />
                {copying ? 'Copying...' : 'Copy This Trip'}
              </button>
              <Link to="/" className="btn-secondary px-8 py-3 text-lg">
                <Globe className="h-5 w-5 mr-2" />
                Explore More
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicItinerary;
