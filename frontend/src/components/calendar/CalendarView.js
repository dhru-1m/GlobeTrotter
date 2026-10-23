import React, { useState } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  MapPin, 
  DollarSign,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';

const CalendarView = ({ 
  trip, 
  itinerary, 
  activities, 
  selectedDate, 
  onDateSelect, 
  onEditActivity, 
  onDeleteActivity,
  onDragEnd 
}) => {
  const [currentDate, setCurrentDate] = useState(new Date(selectedDate));

  const toDateStr = (val) => {
    if (!val) return null;
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.substring(0, 10);
    }
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
  };

  // Generate calendar days
  const generateCalendarDays = () => {
    if (!trip?.startDate || !trip?.endDate) return [];
    const startStr = toDateStr(trip.startDate);
    const endStr = toDateStr(trip.endDate);
    const days = [];
    
    let current = new Date(`${startStr}T12:00:00Z`);
    const end = new Date(`${endStr}T12:00:00Z`);
    while (current <= end) {
      days.push(new Date(current));
      current.setUTCDate(current.getUTCDate() + 1);
    }
    
    return days;
  };

  const groupActivitiesByDate = (list = []) => {
    return list.reduce((acc, a) => {
      const ds = toDateStr(a.date);
      if (!ds) return acc;
      if (!acc[ds]) acc[ds] = [];
      acc[ds].push(a);
      return acc;
    }, {});
  };

  // Get activities for a specific date
  const getActivitiesForDate = (date) => {
    const dateStr = toDateStr(date);
    if (itinerary?.itinerary?.[dateStr] && Array.isArray(itinerary.itinerary[dateStr])) {
      return itinerary.itinerary[dateStr];
    }
    if (itinerary?.days?.[dateStr]?.activities && Array.isArray(itinerary.days[dateStr].activities)) {
      return itinerary.days[dateStr].activities;
    }
    if (Array.isArray(activities) && activities.length) {
      const grouped = groupActivitiesByDate(activities);
      return grouped[dateStr] || [];
    }
    return [];
  };

  // Format date for display
  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const calendarDays = generateCalendarDays();

  return (
    <div className="bg-white rounded-md shadow-sm border">
      {/* Calendar Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            {trip.startDate && new Date(trip.startDate).toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            })}
          </h3>
          <div className="text-sm text-gray-500">
            {calendarDays.length} {calendarDays.length === 1 ? 'day' : 'days'}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {calendarDays.map((date, index) => {
              const dateStr = date.toISOString().split('T')[0];
              const dayActivities = getActivitiesForDate(date);
              const isSelected = selectedDate.toDateString() === date.toDateString();
              
              return (
                <div
                  key={dateStr}
                  className={`border rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer ${
                    isSelected 
                      ? 'border-primary-500 bg-primary-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onDateSelect(date)}
                >
                  {/* Day Header */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          Day {index + 1}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatDate(date)}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400">
                        {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                      </div>
                    </div>
                  </div>

                  {/* Activities List */}
                  <Droppable droppableId={dateStr}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`p-2 min-h-[100px] ${
                          snapshot.isDraggingOver ? 'bg-blue-50' : ''
                        }`}
                      >
                        {dayActivities.length === 0 ? (
                          <div className="flex items-center justify-center h-20 text-gray-400 text-sm">
                            No activities
                          </div>
                        ) : (
                          dayActivities.map((activity, activityIndex) => (
                            <Draggable
                              key={activity._id}
                              draggableId={activity._id}
                              index={activityIndex}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`mb-2 p-2 bg-white border border-gray-200 rounded-md shadow-sm hover:shadow-md transition-shadow ${
                                    snapshot.isDragging ? 'shadow-lg' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <h4 className="text-sm font-medium text-gray-900 truncate">
                                        {activity.title || activity.name}
                                      </h4>
                                      {(activity.startTime || activity.endTime) && (
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                          <Clock className="h-3 w-3 mr-1" />
                                          {activity.startTime}{activity.endTime ? ` - ${activity.endTime}` : ''}
                                        </div>
                                      )}
                                      {activity.destination?.city && (
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                          <MapPin className="h-3 w-3 mr-1" />
                                          <span className="truncate">{activity.destination.city}{activity.destination.country ? `, ${activity.destination.country}` : ''}</span>
                                        </div>
                                      )}
                                      {activity.cost?.amount > 0 && (
                                        <div className="flex items-center mt-1 text-xs text-gray-500">
                                          <DollarSign className="h-3 w-3 mr-1" />
                                          {formatCurrency(activity.cost.amount, activity.cost.currency || 'USD')}
                                        </div>
                                      )}
                                    </div>
                                    
                                    <div className="flex items-center space-x-1 ml-2">
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onEditActivity(activity);
                                        }}
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded"
                                      >
                                        <Edit className="h-3 w-3" />
                                      </button>
                                      <button
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onDeleteActivity(activity._id);
                                        }}
                                        className="p-1 text-gray-400 hover:text-red-600 rounded"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  </div>
                                  
                                  {activity.type && (
                                    <div className="mt-2">
                                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                        {activity.type}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              )}
                            </Draggable>
                          ))
                        )}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default CalendarView;
