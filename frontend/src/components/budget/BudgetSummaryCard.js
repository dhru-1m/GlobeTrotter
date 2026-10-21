import React from 'react';
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Calendar } from 'lucide-react';

const BudgetSummaryCard = ({ budget, tripDays, formatCurrency }) => {
  if (!budget || !budget.total) {
    return (
      <div className="card">
        <div className="card-body text-center py-8">
          <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Budget Set</h3>
          <p className="text-gray-600 mb-4">Set a budget to track your trip expenses</p>
          <button className="btn-primary">Set Budget</button>
        </div>
      </div>
    );
  }

  const totalBudget = budget.total;
  const breakdown = budget.breakdown || {};
  const totalAllocated = Object.values(breakdown).reduce((sum, amount) => sum + (amount || 0), 0);
  const remaining = totalBudget - totalAllocated;
  const percentageUsed = (totalAllocated / totalBudget) * 100;
  const dailyAverage = totalBudget / (tripDays || 1);

  return (
    <div className="space-y-6">
      {/* Budget Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-8 w-8 text-blue-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Total Budget</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(totalBudget, budget.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrendingUp className="h-8 w-8 text-green-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Allocated</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(totalAllocated, budget.currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {percentageUsed.toFixed(1)}% of budget
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                {remaining >= 0 ? (
                  <TrendingDown className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                )}
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">
                  {remaining >= 0 ? 'Remaining' : 'Over Budget'}
                </p>
                <p className={`text-lg font-semibold ${remaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(Math.abs(remaining), budget.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Calendar className="h-8 w-8 text-purple-600" />
              </div>
              <div className="ml-3 w-0 flex-1">
                <p className="text-sm font-medium text-gray-500">Daily Average</p>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(dailyAverage, budget.currency)}
                </p>
                <p className="text-xs text-gray-500">
                  {tripDays} days total
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Budget Breakdown</h3>
        </div>
        <div className="card-body">
          <div className="space-y-4">
            {Object.entries(breakdown).map(([category, amount]) => {
              const percentage = totalBudget > 0 ? (amount / totalBudget) * 100 : 0;
              const colors = {
                accommodation: 'bg-purple-500',
                transportation: 'bg-cyan-500',
                activities: 'bg-amber-500',
                food: 'bg-red-500',
                other: 'bg-green-500'
              };
              
              return (
                <div key={category} className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`w-4 h-4 rounded-full ${colors[category] || 'bg-gray-500'}`} />
                    <span className="text-sm font-medium text-gray-900 capitalize">
                      {category}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">
                      {formatCurrency(amount || 0, budget.currency)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {percentage.toFixed(1)}%
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Budget Status Alert */}
      {remaining < 0 && (
        <div className="card border-red-200 bg-red-50">
          <div className="card-body">
            <div className="flex items-start">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Budget Alert</h3>
                <p className="mt-1 text-sm text-red-700">
                  Your allocated budget exceeds your total budget by {formatCurrency(Math.abs(remaining), budget.currency)}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetSummaryCard;
