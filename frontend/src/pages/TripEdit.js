import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';

const TripEdit = () => {
  const { tripId } = useParams();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to={`/trips/${tripId}`}
            className="p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Edit Trip</h1>
            <p className="text-gray-600">Update your trip details</p>
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card">
        <div className="card-body">
          <form className="space-y-6">
            {/* Trip name */}
            <div>
              <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-2">
                Trip Name
              </label>
              <input
                type="text"
                id="tripName"
                className="input"
                defaultValue="Paris Adventure"
              />
            </div>

            {/* Trip description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                className="input"
                defaultValue="A week-long exploration of the City of Light"
              />
            </div>

            {/* Trip dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="input"
                  defaultValue="2024-03-15"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="input"
                  defaultValue="2024-03-22"
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-2">
                Budget
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">€</span>
                <input
                  type="number"
                  id="budget"
                  className="input pl-8"
                  defaultValue="2500"
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select id="status" className="input">
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Public sharing */}
            <div className="flex items-center">
              <input
                id="isPublic"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                defaultChecked
              />
              <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                Make this trip public (shareable link)
              </label>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <Link
                to={`/trips/${tripId}`}
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary inline-flex items-center"
              >
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripEdit; 