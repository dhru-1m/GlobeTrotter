import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Calendar, Users, Globe, Eye } from 'lucide-react';

import { tripAPI } from '../services/api';

const PublicTrip = () => {
  const { publicUrl } = useParams();
  const [trip, setTrip] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await tripAPI.getPublicTrip(publicUrl);
        if (!cancelled) {
          if (res.data?.success && res.data?.data) {
            setTrip(res.data.data);
          } else {
            setError(res.data?.message || 'Trip not found');
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Failed to load public trip');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    if (publicUrl) {
      fetchTrip();
    }
    return () => {
      cancelled = true;
    };
  }, [publicUrl]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Trip Not Found</h1>
          <p className="text-gray-600">The trip you're looking for doesn't exist or is not public.</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-primary-700 px-6 py-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">{trip.name || trip.title || 'Untitled Trip'}</h1>
              {trip.description && <p className="mt-2 text-indigo-100">{trip.description}</p>}
            </div>
            <div className="flex items-center space-x-2 bg-white bg-opacity-20 px-3 py-1 rounded-full">
              <Eye className="w-4 h-4" />
              <span className="text-sm">Public Trip</span>
            </div>
          </div>
        </div>

        {/* Trip Details */}
        <div className="px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Duration</p>
                <p className="text-gray-900">
                  {trip.startDate ? new Date(trip.startDate).toLocaleDateString() : 'N/A'} - {trip.endDate ? new Date(trip.endDate).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <MapPin className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Destinations</p>
                <p className="text-gray-900">{(trip.destinations || []).length} destination(s)</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Globe className="w-5 h-5 text-indigo-600" />
              <div>
                <p className="text-sm font-medium text-gray-500">Created</p>
                <p className="text-gray-900">{trip.createdAt ? new Date(trip.createdAt).toLocaleDateString() : 'Recently'}</p>
              </div>
            </div>
          </div>

          {/* Destinations */}
          {trip.destinations && trip.destinations.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Destinations</h2>
              <div className="space-y-4">
                {trip.destinations.map((destination, index) => {
                  const cityName = destination.city || destination.name || (typeof destination === 'string' ? destination : 'Destination');
                  const countryName = destination.country || '';
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">
                            {cityName}{countryName ? `, ${countryName}` : ''}
                          </h3>
                          {destination.duration && (
                            <p className="text-sm text-gray-600">{destination.duration} days</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Call to Action */}
          <div className="mt-8 p-6 bg-gray-50 rounded-lg text-center">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Want to create your own trip?
            </h3>
            <p className="text-gray-600 mb-4">
              Sign up for GlobeTrotter and start planning your next adventure!
            </p>
            <button className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors">
              <Users className="w-4 h-4 mr-2" />
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicTrip; 