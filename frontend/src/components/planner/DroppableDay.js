import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import DraggableActivity from './DraggableActivity';

const DroppableDay = ({ 
  day, 
  activities, 
  onRemoveActivity, 
  onReorderActivities,
  basketActivities,
  onAddFromBasket 
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: day.date,
  });

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  const dayTotals = activities.reduce((totals, activity) => {
    totals.time += activity.duration;
    totals.cost += activity.cost;
    return totals;
  }, { time: 0, cost: 0 });

  return (
    <div 
      ref={setNodeRef}
      className={`border border-gray-200 rounded-lg p-4 transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : ''
      }`}
    >
      <div className="mb-4">
        <h3 className="font-medium text-gray-900">{formatDate(day.date)}</h3>
        <div className="text-sm text-gray-600 mt-1">
          <span>⏱️ {formatTime(dayTotals.time)}</span>
          <span className="ml-2">💰 €{dayTotals.cost}</span>
        </div>
        {dayTotals.time > 480 && (
          <p className="text-orange-600 text-xs mt-1">⚠️ Over 8 hours planned</p>
        )}
      </div>

      {/* Day Activities */}
      <SortableContext items={activities.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2 mb-4">
          {activities.map((activity) => (
            <DraggableActivity
              key={activity.id}
              activity={activity}
              onRemove={onRemoveActivity}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add from Basket */}
      {basketActivities.length > 0 && (
        <div className="border-t pt-3">
          <p className="text-xs text-gray-600 mb-2">Add from basket:</p>
          <div className="space-y-1">
            {basketActivities.map((activity) => (
              <button
                key={activity.id}
                onClick={() => onAddFromBasket(activity.id)}
                className="w-full text-left text-xs bg-blue-50 hover:bg-blue-100 rounded p-2 transition-colors"
              >
                + {activity.title}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DroppableDay; 