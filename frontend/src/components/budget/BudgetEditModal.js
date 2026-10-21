import React, { useState, useEffect } from 'react';
import { X, DollarSign, Save } from 'lucide-react';
import { budgetAPI } from '../../services/api';

const BudgetEditModal = ({ isOpen, onClose, tripId, currentBudget, onUpdate }) => {
  const [formData, setFormData] = useState({
    total: '',
    currency: 'USD',
    breakdown: {
      accommodation: '',
      transportation: '',
      activities: '',
      food: '',
      other: ''
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentBudget && isOpen) {
      setFormData({
        total: currentBudget.total || '',
        currency: currentBudget.currency || 'USD',
        breakdown: {
          accommodation: currentBudget.breakdown?.accommodation || '',
          transportation: currentBudget.breakdown?.transportation || '',
          activities: currentBudget.breakdown?.activities || '',
          food: currentBudget.breakdown?.food || '',
          other: currentBudget.breakdown?.other || ''
        }
      });
    }
  }, [currentBudget, isOpen]);

  const handleInputChange = (field, value) => {
    if (field === 'total' || field === 'currency') {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        breakdown: {
          ...prev.breakdown,
          [field]: value
        }
      }));
    }
  };

  const calculateTotal = () => {
    const breakdownTotal = Object.values(formData.breakdown)
      .reduce((sum, value) => sum + (parseFloat(value) || 0), 0);
    return breakdownTotal;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const submitData = {
        total: parseFloat(formData.total) || 0,
        currency: formData.currency,
        breakdown: {
          accommodation: parseFloat(formData.breakdown.accommodation) || 0,
          transportation: parseFloat(formData.breakdown.transportation) || 0,
          activities: parseFloat(formData.breakdown.activities) || 0,
          food: parseFloat(formData.breakdown.food) || 0,
          other: parseFloat(formData.breakdown.other) || 0
        }
      };

      await budgetAPI.updateBudget(tripId, submitData);
      onUpdate();
      onClose();
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  const autoFillTotal = () => {
    const calculatedTotal = calculateTotal();
    setFormData(prev => ({
      ...prev,
      total: calculatedTotal.toString()
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Edit Budget</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Total Budget and Currency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Total Budget
              </label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.total}
                  onChange={(e) => handleInputChange('total', e.target.value)}
                  className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Currency
              </label>
              <select
                value={formData.currency}
                onChange={(e) => handleInputChange('currency', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CAD">CAD - Canadian Dollar</option>
                <option value="AUD">AUD - Australian Dollar</option>
              </select>
            </div>
          </div>

          {/* Budget Breakdown */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-gray-900">Budget Breakdown</h3>
              <button
                type="button"
                onClick={autoFillTotal}
                className="text-sm text-primary-600 hover:text-primary-500 font-medium"
              >
                Auto-fill total ({calculateTotal().toLocaleString()})
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { key: 'accommodation', label: 'Accommodation', icon: '🏨' },
                { key: 'transportation', label: 'Transportation', icon: '✈️' },
                { key: 'activities', label: 'Activities', icon: '🎯' },
                { key: 'food', label: 'Food & Dining', icon: '🍽️' },
                { key: 'other', label: 'Other Expenses', icon: '📦' }
              ].map((category) => (
                <div key={category.key}>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <span className="mr-2">{category.icon}</span>
                    {category.label}
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.breakdown[category.key]}
                      onChange={(e) => handleInputChange(category.key, e.target.value)}
                      className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Breakdown Summary */}
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">
                  Breakdown Total:
                </span>
                <span className="text-sm font-semibold text-gray-900">
                  {formData.currency} {calculateTotal().toLocaleString()}
                </span>
              </div>
              {parseFloat(formData.total) > 0 && calculateTotal() !== parseFloat(formData.total) && (
                <div className="flex justify-between items-center mt-2">
                  <span className="text-sm text-gray-600">
                    Difference:
                  </span>
                  <span className={`text-sm font-medium ${
                    calculateTotal() > parseFloat(formData.total) ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {formData.currency} {Math.abs(calculateTotal() - parseFloat(formData.total)).toLocaleString()}
                    {calculateTotal() > parseFloat(formData.total) ? ' over' : ' under'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Budget</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BudgetEditModal;
