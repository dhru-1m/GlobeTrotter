import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { 
  Clock, 
  MapPin, 
  DollarSign, 
  Edit, 
  Trash2, 
  Calendar, 
  Users, 
  Star 
} from 'lucide-react';

const TimelineView = ({ 
  trip, 
  itinerary, 
  activities = [], 
  onEditActivity, 
  onDeleteActivity, 
  onDragEnd 
}) => {
  const toDateStr = (val) => {
    if (!val) return null;
    if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      return val.substring(0, 10);
    }
    const d = (val instanceof Date) ? val : new Date(val);
    if (isNaN(d.getTime())) return null;
    return d.toISOString().split('T')[0];
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

  // Generate trip days in chronological order
  const generateTripDays = () => {
    if (!trip?.startDate || !trip?.endDate) return [];
    
    const startStr = toDateStr(trip.startDate);
    const endStr = toDateStr(trip.endDate);
    
    const fallbackGrouped = groupActivitiesByDate(activities);
    const itineraryMap = itinerary?.itinerary || itinerary?.days || {};
    
    const days = [];
    let current = new Date(`${startStr}T12:00:00Z`);
    const end = new Date(`${endStr}T12:00:00Z`);
    let dayNumber = 1;
    
    while (current <= end) {
      const dateStr = current.toISOString().split('T')[0];
      
      let dayActivities = [];
      if (Array.isArray(itineraryMap[dateStr])) {
        dayActivities = [...itineraryMap[dateStr]];
      } else if (itineraryMap[dateStr]?.activities && Array.isArray(itineraryMap[dateStr].activities)) {
        dayActivities = [...itineraryMap[dateStr].activities];
      }
      
      // Fallback/merge with activities array
      if (fallbackGrouped[dateStr]) {
        if (dayActivities.length === 0) {
          dayActivities = [...fallbackGrouped[dateStr]];
        } else {
          const existingIds = new Set(dayActivities.map(a => a._id?.toString()));
          fallbackGrouped[dateStr].forEach(a => {
            if (a._id && !existingIds.has(a._id.toString())) {
              dayActivities.push(a);
            }
          });
        }
      }

      // Sort activities chronologically by startTime
      dayActivities.sort((a, b) => (a.startTime || a.time || '').localeCompare(b.startTime || b.time || ''));
      
      days.push({
        date: new Date(current),
        dateStr,
        dayNumber,
        activities: dayActivities
      });
      
      current.setUTCDate(current.getUTCDate() + 1);
      dayNumber++;
    }
    
    return days;
  };

  // Format date for display
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    let d;
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      d = new Date(`${dateInput}T12:00:00Z`);
    } else {
      d = new Date(dateInput);
    }
    return d.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Format time
  const formatTime = (timeString) => {
    if (!timeString) return '';
    const time = new Date(`2000-01-01T${timeString}`);
    return isNaN(time.getTime()) ? timeString : time.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  // Format currency
  const formatCurrency = (amount, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Get activity type color
  const getActivityTypeColor = (type) => {
    const colors = {
      accommodation: 'bg-purple-100 text-purple-800',
      transportation: 'bg-blue-100 text-blue-800',
      transport: 'bg-blue-100 text-blue-800',
      dining: 'bg-orange-100 text-orange-800',
      food: 'bg-orange-100 text-orange-800',
      entertainment: 'bg-pink-100 text-pink-800',
      sightseeing: 'bg-emerald-100 text-emerald-800',
      shopping: 'bg-yellow-100 text-yellow-800',
      adventure: 'bg-red-100 text-red-800',
      cultural: 'bg-indigo-100 text-indigo-800',
      culture: 'bg-indigo-100 text-indigo-800',
      relaxation: 'bg-teal-100 text-teal-800',
      other: 'bg-gray-100 text-gray-800',
      default: 'bg-gray-100 text-gray-800'
    };
    return colors[type?.toLowerCase()] || colors.default;
  };

  const tripDays = generateTripDays();
  const totalActivities = tripDays.reduce((sum, day) => sum + day.activities.length, 0);

  return (
    <div className="bg-white rounded-md shadow-sm border border-gray-200">
      {/* Timeline Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">Trip Timeline</h3>
          <div className="text-sm text-gray-500 font-medium">
            {tripDays.length} {tripDays.length === 1 ? 'day' : 'days'} • {totalActivities} {totalActivities === 1 ? 'activity' : 'activities'}
          </div>
        </div>
      </div>

      {/* Timeline Content */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="p-6">
          <div className="space-y-8">
            {tripDays.map((day, dayIndex) => (
              <div key={day.dateStr} className="relative">
                {/* Timeline vertical connector line */}
                {dayIndex < tripDays.length - 1 && (
                  <div className="absolute left-6 top-16 w-0.5 h-full bg-gray-200 -z-10"></div>
                )}
                
                {/* Day Header */}
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-primary-50 rounded-full flex items-center justify-center border-2 border-primary-500 shadow-sm">
                      <span className="text-base font-bold text-primary-600">
                        {day.dayNumber}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                          Day {day.dayNumber}
                        </h3>
                        <p className="text-gray-600 flex items-center text-sm mt-0.5">
                          <Calendar className="h-4 w-4 mr-1.5 text-gray-400" />
                          {formatDate(day.dateStr)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-600">
                          {day.activities.length} {day.activities.length === 1 ? 'activity' : 'activities'}
                        </div>
                        {day.activities.length > 0 && (
                          <div className="text-xs text-gray-500 mt-0.5">
                            Total: {formatCurrency(
                              day.activities.reduce((sum, activity) => sum + (activity.cost?.amount || 0), 0),
                              trip?.budget?.currency || day.activities[0]?.cost?.currency || 'USD'
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Activities for the day */}
                <div className="ml-16 mt-4">
                  <Droppable droppableId={day.dateStr}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={`space-y-3 min-h-[60px] p-3 rounded-lg border-2 border-dashed transition-colors ${
                          snapshot.isDraggingOver 
                            ? 'border-primary-300 bg-primary-50' 
                            : 'border-gray-200'
                        }`}
                      >
                        {day.activities.length === 0 ? (
                          <div className="text-center py-8 text-gray-400">
                            <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No activities planned for this day</p>
                          </div>
                        ) : (
                          day.activities.map((activity, activityIndex) => (
                            <Draggable
                              key={activity._id || `act-${activityIndex}`}
                              draggableId={activity._id || `act-${activityIndex}`}
                              index={activityIndex}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-all duration-200 ${
                                    snapshot.isDragging ? 'shadow-lg rotate-1' : ''
                                  }`}
                                >
                                  <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-start justify-between mb-2">
                                        <h4 className="text-lg font-semibold text-gray-900">
                                          {activity.title || activity.name || 'Untitled Activity'}
                                        </h4>
                                        <div className="flex items-center space-x-2 ml-4">
                                          {activity.rating && (
                                            <div className="flex items-center">
                                              <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                              <span className="text-sm text-gray-600 ml-1">
                                                {activity.rating}
                                              </span>
                                            </div>
                                          )}
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onEditActivity(activity);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                                            title="Edit activity"
                                          >
                                            <Edit className="h-4 w-4" />
                                          </button>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              onDeleteActivity(activity._id);
                                            }}
                                            className="p-1.5 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50"
                                            title="Delete activity"
                                          >
                                            <Trash2 className="h-4 w-4" />
                                          </button>
                                        </div>
                                      </div>
                                      
                                      {activity.description && (
                                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                                          {activity.description}
                                        </p>
                                      )}
                                      
                                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        {(activity.startTime || activity.time) && (
                                          <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                            <span>
                                              {activity.startTime 
                                                ? `${activity.startTime}${activity.endTime ? ` - ${activity.endTime}` : ''}` 
                                                : formatTime(activity.time)}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {(activity.destination?.city || activity.location) && (
                                          <div className="flex items-center">
                                            <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                                            <span className="truncate max-w-xs">
                                              {activity.destination?.city
                                                ? `${activity.destination.city}${activity.destination.country ? `, ${activity.destination.country}` : ''}`
                                                : (typeof activity.location === 'object'
                                                  ? (activity.location?.name || activity.location?.address || 'Location')
                                                  : activity.location)}
                                            </span>
                                          </div>
                                        )}
                                        
                                        {activity.duration ? (
                                          <div className="flex items-center">
                                            <Clock className="h-4 w-4 mr-1 text-gray-400" />
                                            <span>
                                              {activity.duration > 24 ? `${activity.duration} mins` : `${activity.duration} hrs`}
                                            </span>
                                          </div>
                                        ) : null}
                                        
                                        {activity.cost?.amount > 0 && (
                                          <div className="flex items-center font-medium text-gray-700">
                                            <DollarSign className="h-4 w-4 mr-0.5 text-gray-400" />
                                            <span>
                                              {formatCurrency(activity.cost.amount, activity.cost.currency || trip?.budget?.currency || 'USD')}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                      
                                      <div className="mt-3 flex flex-wrap gap-2">
                                        {activity.type && (
                                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getActivityTypeColor(activity.type)}`}>
                                            {activity.type}
                                          </span>
                                        )}
                                        
                                        {activity.tags && activity.tags.map((tag, index) => (
                                          <span
                                            key={index}
                                            className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
                                          >
                                            {tag}
                                          </span>
                                        ))}
                                      </div>
                                    </div>
                                  </div>
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
              </div>
            ))}
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};

export default TimelineView;
