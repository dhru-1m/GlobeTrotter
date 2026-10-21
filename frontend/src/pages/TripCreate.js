import React, { useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus } from 'lucide-react';
import { useDispatch } from 'react-redux';
import { startTripBuild } from '../store/slices/tripBuilderSlice';

const TripCreate = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const nameRef = useRef(null);
  const descRef = useRef(null);
  const startRef = useRef(null);
  const endRef = useRef(null);
  const budgetRef = useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();
    const details = {
      name: nameRef.current?.value?.trim() || 'New Trip',
      description: descRef.current?.value?.trim() || '',
      startDate: startRef.current?.value || null,
      endDate: endRef.current?.value || null,
      budget: Number(budgetRef.current?.value) || 0,
    };
    dispatch(startTripBuild(details));
    navigate('/cities');
  };

  return (
    <div className="space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center space-x-3">
        <Link
          to="/trips"
          className="p-1.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors duration-150"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Create New Trip</h1>
          <p className="text-sm text-gray-500 mt-0.5">Start planning your next adventure</p>
        </div>
      </div>

      {/* Trip creation form */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-6">
          <form className="space-y-5" onSubmit={onSubmit}>
            {/* Trip name */}
            <div>
              <label htmlFor="tripName" className="block text-sm font-medium text-gray-700 mb-1.5">
                Trip Name
              </label>
              <input
                type="text"
                id="tripName"
                className="input"
                placeholder="e.g., Paris Adventure, Tokyo Discovery"
                ref={nameRef}
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
                rows={3}
                className="input"
                placeholder="Describe your trip..."
                ref={descRef}
              />
            </div>

            {/* Trip dates */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Start Date
                </label>
                <input
                  type="date"
                  id="startDate"
                  className="input"
                  ref={startRef}
                  required
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1.5">
                  End Date
                </label>
                <input
                  type="date"
                  id="endDate"
                  className="input"
                  ref={endRef}
                  required
                />
              </div>
            </div>

            {/* Budget */}
            <div>
              <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1.5">
                Budget (Optional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm">$</span>
                <input
                  type="number"
                  id="budget"
                  className="input pl-7"
                  placeholder="0.00"
                  ref={budgetRef}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
              <Link
                to="/trips"
                className="btn-secondary"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="btn-primary inline-flex items-center"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Create Trip
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TripCreate;