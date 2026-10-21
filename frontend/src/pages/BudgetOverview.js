import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { BarChart3, ArrowRight } from 'lucide-react';

const BudgetOverview = () => {
  const { trips, loading } = useSelector((state) => state.trips);

  const formatCurrency = (amount = 0, currency = 'USD') => new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(amount);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Budget Overview</h1>
          <p className="text-gray-600">Manage and track expenses across all your trips</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trips.map((trip) => (
          <div key={trip._id} className="card hover:shadow-md transition-shadow duration-300">
            <div className="card-body">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{trip.name}</h3>
                <BarChart3 className="h-5 w-5 text-primary-500" />
              </div>

              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Budget:</span>
                  <span className="font-medium">{formatCurrency(trip.budget?.total || 0, trip.budget?.currency)}</span>
                </div>

                {trip.budget?.breakdown && (
                  <>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Accommodation:</span>
                      <span>{formatCurrency(trip.budget.breakdown.accommodation || 0, trip.budget.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Activities:</span>
                      <span>{formatCurrency(trip.budget.breakdown.activities || 0, trip.budget.currency)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Transportation:</span>
                      <span>{formatCurrency(trip.budget.breakdown.transportation || 0, trip.budget.currency)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-4 pt-4 border-t">
                <Link
                  to={`/trips/${trip._id}/budget`}
                  className="btn-primary w-full inline-flex items-center justify-center"
                >
                  View Details <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        ))}

        {trips.length === 0 && (
          <div className="col-span-full text-center py-12">
            <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No Trips Found</h3>
            <p className="mt-2 text-gray-500">Create a trip to start managing your budget</p>
            <Link to="/trips/create" className="btn-primary mt-4 inline-flex items-center">
              Create Trip <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default BudgetOverview;
