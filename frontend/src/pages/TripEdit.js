import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, MapPin, Plus, Trash2, Calendar, DollarSign, Globe } from 'lucide-react';
import { tripAPI } from '../services/api';
import { toast } from 'react-hot-toast';
import LoadingSpinner from '../components/common/LoadingSpinner';

const TripEdit = () => {
  const { tripId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    budget: '',
    currency: 'USD',
    status: 'planning',
    isPublic: false,
    coverPhoto: '',
    destinations: []
  });

  const [newCity, setNewCity] = useState('');
  const [newCountry, setNewCountry] = useState('');

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await tripAPI.getTrip(tripId);
        if (res.data?.success && res.data?.data) {
          const t = res.data.data;
          setFormData({
            name: t.name || '',
            description: t.description || '',
            startDate: t.startDate ? new Date(t.startDate).toISOString().split('T')[0] : '',
            endDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : '',
            budget: t.budget?.total !== undefined ? t.budget.total : (typeof t.budget === 'number' ? t.budget : ''),
            currency: t.budget?.currency || 'USD',
            status: t.status || 'planning',
            isPublic: Boolean(t.isPublic),
            coverPhoto: t.coverPhoto || '',
            destinations: Array.isArray(t.destinations) ? t.destinations : []
          });
        } else {
          setError('Failed to load trip data');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Error loading trip');
      } finally {
        setLoading(false);
      }
    };

    if (tripId) {
      fetchTrip();
    }
  }, [tripId]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddDestination = () => {
    if (!newCity.trim()) return;
    const dest = {
      city: newCity.trim(),
      country: newCountry.trim() || 'Unknown',
      arrivalDate: formData.startDate ? new Date(formData.startDate) : new Date(),
      departureDate: formData.endDate ? new Date(formData.endDate) : new Date(),
      order: formData.destinations.length + 1
    };
    setFormData(prev => ({
      ...prev,
      destinations: [...prev.destinations, dest]
    }));
    setNewCity('');
    setNewCountry('');
  };

  const handleRemoveDestination = (index) => {
    setFormData(prev => ({
      ...prev,
      destinations: prev.destinations.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Trip name is required');
      return;
    }

    if (formData.startDate && formData.endDate && new Date(formData.startDate) > new Date(formData.endDate)) {
      toast.error('End date must be on or after start date');
      return;
    }

    try {
      setSaving(true);
      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: formData.status,
        isPublic: formData.isPublic,
        coverPhoto: formData.coverPhoto.trim(),
        destinations: formData.destinations,
        budget: {
          total: Number(formData.budget) || 0,
          currency: formData.currency
        }
      };

      const res = await tripAPI.updateTrip(tripId, payload);
      if (res.data?.success) {
        toast.success('Trip updated successfully!');
        navigate(`/trips/${tripId}`);
      } else {
        toast.error(res.data?.message || 'Failed to update trip');
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save changes');
    } finally {
      setSaving(false);
    }
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
        <div className="bg-danger-50 border border-danger-200 rounded-md p-6 max-w-lg mx-auto">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error Loading Trip</h3>
          <p className="text-red-700 mb-4">{error}</p>
          <Link to="/trips" className="btn-secondary inline-flex items-center">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Trips
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/trips/${tripId}`}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Trip</h1>
            <p className="text-gray-600">Update details for <span className="font-semibold text-gray-800">{formData.name}</span></p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 sm:p-8">
          <form className="space-y-6" onSubmit={handleSubmit}>
            {/* Trip name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trip Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className="input"
                placeholder="e.g., Summer in Italy, Tokyo Adventure"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Trip description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1.5">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="input"
                placeholder="Describe your trip, travel plans, goals, etc."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            {/* Trip dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    className="input pl-10"
                    value={formData.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    className="input pl-10"
                    value={formData.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Budget & Currency */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Estimated Budget
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  <input
                    type="number"
                    id="budget"
                    name="budget"
                    min="0"
                    step="any"
                    className="input pl-10"
                    placeholder="e.g., 2500"
                    value={formData.budget}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Currency
                </label>
                <select
                  id="currency"
                  name="currency"
                  className="input"
                  value={formData.currency}
                  onChange={handleChange}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                  <option value="CAD">CAD (C$)</option>
                  <option value="AUD">AUD (A$)</option>
                </select>
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trip Status
              </label>
              <select
                id="status"
                name="status"
                className="input"
                value={formData.status}
                onChange={handleChange}
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Cover Photo */}
            <div>
              <label htmlFor="coverPhoto" className="block text-sm font-medium text-gray-700 mb-1.5">
                Cover Photo URL (Optional)
              </label>
              <input
                type="url"
                id="coverPhoto"
                name="coverPhoto"
                className="input"
                placeholder="https://images.unsplash.com/..."
                value={formData.coverPhoto}
                onChange={handleChange}
              />
              {formData.coverPhoto && (
                <div className="mt-2 h-32 rounded-lg overflow-hidden border border-gray-200">
                  <img
                    src={formData.coverPhoto}
                    alt="Cover preview"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Destinations */}
            <div className="pt-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Destinations
              </label>
              
              {/* Existing destinations list */}
              {formData.destinations && formData.destinations.length > 0 ? (
                <div className="space-y-2 mb-3">
                  {formData.destinations.map((dest, idx) => {
                    const cityName = typeof dest === 'string' ? dest : dest.city;
                    const countryName = typeof dest === 'object' ? dest.country : '';
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                      >
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-primary-600 flex-shrink-0" />
                          <span className="font-medium text-gray-800">{cityName}</span>
                          {countryName && (
                            <span className="text-gray-500">({countryName})</span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveDestination(idx)}
                          className="text-gray-400 hover:text-red-600 transition-colors p-1"
                          title="Remove destination"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-gray-500 mb-3 italic">No destinations added yet.</p>
              )}

              {/* Add new destination row */}
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder="City (e.g. Paris)"
                  className="input flex-1"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                />
                <input
                  type="text"
                  placeholder="Country (e.g. France)"
                  className="input flex-1"
                  value={newCountry}
                  onChange={(e) => setNewCountry(e.target.value)}
                />
                <button
                  type="button"
                  onClick={handleAddDestination}
                  disabled={!newCity.trim()}
                  className="btn-secondary whitespace-nowrap inline-flex items-center justify-center disabled:opacity-50"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add
                </button>
              </div>
            </div>

            {/* Public sharing */}
            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex items-start space-x-3">
              <input
                id="isPublic"
                name="isPublic"
                type="checkbox"
                className="mt-1 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                checked={formData.isPublic}
                onChange={handleChange}
              />
              <div>
                <label htmlFor="isPublic" className="font-medium text-sm text-gray-900 cursor-pointer">
                  Make this trip public
                </label>
                <p className="text-xs text-gray-500 mt-0.5">
                  Anyone with the public link will be able to view your trip itinerary and daily activities.
                </p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <Link
                to={`/trips/${tripId}`}
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary inline-flex items-center disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripEdit;