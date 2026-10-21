import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, MapPin, Calendar, DollarSign, Users, Star, Compass, TrendingUp, Globe } from 'lucide-react';
import LoadingSpinner from '../components/common/LoadingSpinner';

const PublicTrips = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchPublicTrips();
  }, []);

  const fetchPublicTrips = async () => {
    try {
      setLoading(true);
      // This would need a backend endpoint for fetching public trips
      // For now, we'll use placeholder data
      setTrips([
        {
          _id: '1',
          name: 'Tokyo Adventure',
          description: 'A complete guide to exploring Tokyo\'s best spots',
          publicUrl: 'tokyo-adventure-2024',
          user: { firstName: 'Alice', lastName: 'Johnson' },
          startDate: '2024-03-15',
          endDate: '2024-03-22',
          destinations: ['Tokyo', 'Kyoto'],
          budget: { total: 2500, currency: 'USD' },
          tags: ['cultural', 'food', 'temples'],
          status: 'completed',
          isPublic: true
        },
        {
          _id: '2',
          name: 'European City Hopping',
          description: 'The ultimate European adventure across 5 cities',
          publicUrl: 'europe-cities-2024',
          user: { firstName: 'Marco', lastName: 'Silva' },
          startDate: '2024-04-01',
          endDate: '2024-04-14',
          destinations: ['Paris', 'Rome', 'Barcelona', 'Amsterdam', 'Berlin'],
          budget: { total: 3200, currency: 'USD' },
          tags: ['history', 'art', 'nightlife'],
          status: 'completed',
          isPublic: true
        },
        {
          _id: '3',
          name: 'Bali Wellness Retreat',
          description: 'A peaceful journey through Bali\'s spiritual side',
          publicUrl: 'bali-wellness-2024',
          user: { firstName: 'Sarah', lastName: 'Chen' },
          startDate: '2024-02-10',
          endDate: '2024-02-17',
          destinations: ['Ubud', 'Canggu'],
          budget: { total: 1200, currency: 'USD' },
          tags: ['wellness', 'nature', 'yoga'],
          status: 'completed',
          isPublic: true
        }
      ]);
    } catch (error) {
      console.error('Error fetching public trips:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredTrips = trips.filter(trip => {
    const matchesSearch = trip.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         trip.destinations.some(dest => dest.toLowerCase().includes(searchTerm.toLowerCase()));
    
    if (filter === 'all') return matchesSearch;
    if (filter === 'budget') return matchesSearch && trip.budget.total < 2000;
    if (filter === 'luxury') return matchesSearch && trip.budget.total >= 2000;
    if (filter === 'recent') return matchesSearch && new Date(trip.endDate) > new Date('2024-01-01');
    
    return matchesSearch;
  });

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getDuration = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Discovering amazing trips...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Globe className="h-8 w-8 text-primary-600 mr-3" />
                Discover Public Trips
              </h1>
              <p className="text-gray-600 mt-2">Get inspired by amazing itineraries from fellow travelers</p>
            </div>
            
            <Link
              to="/dashboard"
              className="btn-primary"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            <div className="flex-1 max-w-lg">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search trips, destinations, or activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex space-x-2">
              {['all', 'budget', 'luxury', 'recent'].map((filterOption) => (
                <button
                  key={filterOption}
                  onClick={() => setFilter(filterOption)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    filter === filterOption
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {filterOption.charAt(0).toUpperCase() + filterOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Public Trips</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <MapPin className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Destinations Covered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {[...new Set(trips.flatMap(trip => trip.destinations))].length}
                </p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <Users className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Active Travelers</p>
                <p className="text-2xl font-bold text-gray-900">{trips.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Trip Cards */}
        {filteredTrips.length === 0 ? (
          <div className="text-center py-12">
            <Compass className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No trips found</h3>
            <p className="text-gray-600">Try adjusting your search or filters to find more trips.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTrips.map((trip) => (
              <Link
                key={trip._id}
                to={`/public-itinerary/${trip.publicUrl}`}
                className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden group"
              >
                {/* Trip Image Placeholder */}
                <div className="h-48 bg-primary-600 relative">
                  <div className="absolute inset-0 bg-black bg-opacity-20 group-hover:bg-opacity-30 transition-all duration-200"></div>
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-xl font-bold">{trip.name}</h3>
                    <p className="text-sm opacity-90">{trip.destinations.join(' • ')}</p>
                  </div>
                  <div className="absolute top-4 right-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      trip.status === 'completed' ? 'bg-green-100 text-green-800' :
                      trip.status === 'active' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {trip.status.charAt(0).toUpperCase() + trip.status.slice(1)}
                    </span>
                  </div>
                </div>
                
                {/* Trip Info */}
                <div className="p-6">
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{trip.description}</p>
                  
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</span>
                      <span className="ml-2 text-gray-400">({getDuration(trip.startDate, trip.endDate)} days)</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <DollarSign className="h-4 w-4 mr-2" />
                      <span>Budget: {formatCurrency(trip.budget.total, trip.budget.currency)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>By {trip.user.firstName} {trip.user.lastName}</span>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {trip.tags.slice(0, 3).map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                      >
                        #{tag}
                      </span>
                    ))}
                    {trip.tags.length > 3 && (
                      <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                        +{trip.tags.length - 3} more
                      </span>
                    )}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center text-sm text-gray-500">
                      <Star className="h-4 w-4 text-yellow-400 mr-1" />
                      <span>4.8 (24 reviews)</span>
                    </div>
                    
                    <div className="text-primary-600 font-medium text-sm group-hover:text-primary-700">
                      View Itinerary →
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-primary-50 rounded-md p-8 border border-primary-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Have an amazing trip to share?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Share your own travel experiences and inspire others! Make your trips public and help fellow travelers discover new destinations.
            </p>
            <Link to="/trips" className="btn-primary px-8 py-3 text-lg">
              Share Your Trips
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTrips;
