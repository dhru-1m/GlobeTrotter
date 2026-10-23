import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, DollarSign, Tag, Star, Users } from 'lucide-react';
import { activityAPI } from '../../services/api';

const ActivityEditModal = ({ isOpen, onClose, activity, tripId, onUpdate }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: '',
    location: '',
    time: '',
    duration: '',
    cost: {
      amount: 0,
      currency: 'USD'
    },
    rating: '',
    tags: [],
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const activityTypes = [
    'accommodation',
    'transportation',
    'dining',
    'entertainment',
    'sightseeing',
    'shopping',
    'adventure',
    'cultural',
    'relaxation',
    'business',
    'other'
  ];

  const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY'];

  useEffect(() => {
    if (activity) {
      setFormData({
        name: activity.title || activity.name || '',
        description: activity.description || '',
        type: activity.type || '',
        location: typeof activity.location === 'object' ? (activity.location?.name || activity.location?.address || '') : (activity.location || activity.destination?.city || ''),
        time: activity.startTime || activity.time || '',
        duration: activity.duration || '',
        cost: {
          amount: activity.cost?.amount || 0,
          currency: activity.cost?.currency || 'USD'
        },
        rating: activity.rating || '',
        tags: activity.tags || [],
        notes: activity.notes || ''
      });
    } else {
      // Reset form for new activity
      setFormData({
        name: '',
        description: '',
        type: '',
        location: '',
        time: '',
        duration: '',
        cost: {
          amount: 0,
          currency: 'USD'
        },
        rating: '',
        tags: [],
        notes: ''
      });
    }
    setErrors({});
  }, [activity, isOpen]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.startsWith('cost.')) {
      const costField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        cost: {
          ...prev.cost,
          [costField]: costField === 'amount' ? parseFloat(value) || 0 : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleTagsChange = (e) => {
    const value = e.target.value;
    const tags = value.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
    setFormData(prev => ({
      ...prev,
      tags
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Activity name is required';
    }
    
    if (formData.time && !/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(formData.time)) {
      newErrors.time = 'Please enter time in HH:MM format';
    }
    
    if (formData.duration && (isNaN(formData.duration) || formData.duration < 0)) {
      newErrors.duration = 'Duration must be a positive number';
    }
    
    if (formData.cost.amount < 0) {
      newErrors['cost.amount'] = 'Cost cannot be negative';
    }
    
    if (formData.rating && (isNaN(formData.rating) || formData.rating < 1 || formData.rating > 5)) {
      newErrors.rating = 'Rating must be between 1 and 5';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const activityData = {
        ...formData,
        title: formData.name,
        trip: tripId,
        duration: formData.duration ? parseFloat(formData.duration) : undefined,
        rating: formData.rating ? parseFloat(formData.rating) : undefined
      };
      
      if (activity) {
        // Update existing activity
        await activityAPI.updateActivity(activity._id, activityData);
      } else {
        // Create new activity
        await activityAPI.createActivity(activityData);
      }
      
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Failed to save activity:', error);
      setErrors({ 
        submit: error.response?.data?.message || 'Failed to save activity' 
      });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-md shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {activity ? 'Edit Activity' : 'Add New Activity'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Basic Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Activity Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter activity name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Describe the activity..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type
                </label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select type</option>
                  {activityTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rating (1-5)
                </label>
                <input
                  type="number"
                  name="rating"
                  value={formData.rating}
                  onChange={handleInputChange}
                  min="1"
                  max="5"
                  step="0.1"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.rating ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="4.5"
                />
                {errors.rating && <p className="mt-1 text-sm text-red-600">{errors.rating}</p>}
              </div>
            </div>
          </div>

          {/* Location & Time */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Location & Time</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="h-4 w-4 inline mr-1" />
                Location
              </label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Enter location"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Clock className="h-4 w-4 inline mr-1" />
                  Time (HH:MM)
                </label>
                <input
                  type="time"
                  name="time"
                  value={formData.time}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.time ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.time && <p className="mt-1 text-sm text-red-600">{errors.time}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Users className="h-4 w-4 inline mr-1" />
                  Duration (hours)
                </label>
                <input
                  type="number"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="0"
                  step="0.5"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors.duration ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="2.5"
                />
                {errors.duration && <p className="mt-1 text-sm text-red-600">{errors.duration}</p>}
              </div>
            </div>
          </div>

          {/* Cost */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Cost</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <DollarSign className="h-4 w-4 inline mr-1" />
                  Amount
                </label>
                <input
                  type="number"
                  name="cost.amount"
                  value={formData.cost.amount}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 ${
                    errors['cost.amount'] ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors['cost.amount'] && <p className="mt-1 text-sm text-red-600">{errors['cost.amount']}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Currency
                </label>
                <select
                  name="cost.currency"
                  value={formData.cost.currency}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {currencies.map(currency => (
                    <option key={currency} value={currency}>
                      {currency}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Additional Information</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Tag className="h-4 w-4 inline mr-1" />
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={formData.tags.join(', ')}
                onChange={handleTagsChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="romantic, outdoor, family-friendly"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Any additional notes..."
              />
            </div>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{errors.submit}</p>
            </div>
          )}

          {/* Footer */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : (activity ? 'Update Activity' : 'Create Activity')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ActivityEditModal;
