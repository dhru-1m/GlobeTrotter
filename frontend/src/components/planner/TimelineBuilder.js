import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  selectBasketActivities, 
  selectTimeline, 
  selectTimelineByDate,
  selectTimelineTotals,
  selectDayTotals,
  addToTimeline,
  removeFromTimeline,
  reorderTimeline,
  updateTimelineItem,
  suggestNextTimeSlot
} from '../../store/slices/plannerSlice';
import { ChevronUp, ChevronDown, Clock, Calendar, DollarSign, X, Plus } from 'lucide-react';
import { toast } from 'react-hot-toast';

const TimelineBuilder = () => {
  const dispatch = useDispatch();
  const basketActivities = useSelector(selectBasketActivities);
  const timeline = useSelector(selectTimeline);
  const timelineTotals = useSelector(selectTimelineTotals);
  const lastSuggestedTime = useSelector(state => state.planner?.lastSuggestedTime);
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('09:00');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  const formatTime = (minutes) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatTimeDisplay = (timeString) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  // Helper: return HH:MM after adding minutes to a HH:MM time string
  const addMinutesHHMM = (timeString, minutes) => {
    const [h, m] = String(timeString).split(':').map(Number);
    const base = new Date(2000, 0, 1, isNaN(h) ? 0 : h, isNaN(m) ? 0 : m);
    base.setMinutes(base.getMinutes() + (Number(minutes) || 0));
    const hh = base.getHours().toString().padStart(2, '0');
    const mm = base.getMinutes().toString().padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const getUniqueDates = () => {
    const dates = timeline.map(item => item.scheduledDate);
    return [...new Set(dates)].sort();
  };

  const handleAddToTimeline = (activityId) => {
    setSelectedActivity(activityId);
    setShowAddModal(true);
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    setSelectedDate(tomorrow.toISOString().split('T')[0]);
    
    // Suggest next available time slot via reducer (stores lastSuggestedTime)
    dispatch(suggestNextTimeSlot({ date: tomorrow.toISOString().split('T')[0] }));
  };

  useEffect(() => {
    if (lastSuggestedTime) {
      setSelectedTime(lastSuggestedTime);
    }
  }, [lastSuggestedTime]);

  const confirmAddToTimeline = () => {
    if (!selectedDate || !selectedTime || !selectedActivity) {
      toast.error('Please select date and time');
      return;
    }

    try {
      dispatch(addToTimeline({
        activityId: selectedActivity,
        date: selectedDate,
        startTime: selectedTime
      }));
      
      toast.success('Activity added to timeline!');
      setShowAddModal(false);
      setSelectedActivity(null);
    } catch (error) {
      toast.error(error.message || 'Failed to add activity');
    }
  };

  const handleRemoveFromTimeline = (timelineId) => {
    dispatch(removeFromTimeline(timelineId));
    toast.success('Activity removed from timeline');
  };

  const handleMoveUp = (index) => {
    if (index > 0) {
      dispatch(reorderTimeline({ sourceIndex: index, destinationIndex: index - 1 }));
    }
  };

  const handleMoveDown = (index) => {
    if (index < timeline.length - 1) {
      dispatch(reorderTimeline({ sourceIndex: index, destinationIndex: index + 1 }));
    }
  };

  const handleTimeChange = (timelineId, newTime) => {
    try {
      dispatch(updateTimelineItem({
        timelineId,
        updates: { startTime: newTime }
      }));
      toast.success('Time updated!');
    } catch (error) {
      toast.error(error.message || 'Failed to update time');
    }
  };

  const handleDateChange = (timelineId, newDate) => {
    try {
      dispatch(updateTimelineItem({
        timelineId,
        updates: { scheduledDate: newDate }
      }));
      toast.success('Date updated!');
    } catch (error) {
      toast.error(error.message || 'Failed to update date');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with totals */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Timeline Builder</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{timelineTotals.totalActivities}</div>
            <div className="text-sm text-gray-600">Total Activities</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{formatTime(timelineTotals.totalTime)}</div>
            <div className="text-sm text-gray-600">Total Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">€{timelineTotals.totalCost}</div>
            <div className="text-sm text-gray-600">Total Cost</div>
          </div>
        </div>
      </div>

      {/* Basket Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Available Activities ({basketActivities.length})</h3>
        {basketActivities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-3">No activities in basket yet. Search any destination to add AI-curated activities!</p>
            <a
              href="/cities"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700"
            >
              Search Cities with Gemini AI
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {basketActivities.map((activity) => (
              <div key={activity.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-gray-900">{activity.title}</h4>
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {activity.type}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3">{activity.description}</p>
                <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                  <span>⏱️ {formatTime(activity.duration)}</span>
                  <span>💰 {activity.cost} {activity.currency}</span>
                </div>
                <button
                  onClick={() => handleAddToTimeline(activity.id)}
                  className="w-full bg-green-600 text-white py-2 px-3 rounded text-sm hover:bg-green-700 transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add to Timeline
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Timeline Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-xl font-semibold mb-4">Your Timeline ({timeline.length} activities)</h3>
        {timeline.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No activities scheduled yet. Add some from the basket above!</p>
        ) : (
          <div className="space-y-4">
            {timeline.map((item, index) => (
              <div key={item.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{item.title}</h4>
                      <div className="flex items-center space-x-2">
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                          {item.type}
                        </span>
                        <button
                          onClick={() => handleRemoveFromTimeline(item.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Date */}
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="date"
                          value={item.scheduledDate}
                          onChange={(e) => handleDateChange(item.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                      </div>
                      
                      {/* Time */}
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-gray-500" />
                        <input
                          type="time"
                          value={item.startTime}
                          onChange={(e) => handleTimeChange(item.id, e.target.value)}
                          className="border border-gray-300 rounded px-2 py-1 text-sm"
                        />
                        <span className="ml-2 text-sm text-gray-600">
                          ({formatTimeDisplay(item.startTime)} - {formatTimeDisplay(
                            addMinutesHHMM(item.startTime, item.duration)
                          ).split(' ')[0]})
                        </span>
                      </div>
                      
                      {/* Duration & Cost */}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">⏱️ {formatTime(item.duration)}</span>
                        <span className="text-sm text-gray-600">💰 €{item.cost}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Reorder buttons */}
                  <div className="flex flex-col ml-4">
                    <button
                      onClick={() => handleMoveUp(index)}
                      disabled={index === 0}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDown(index)}
                      disabled={index === timeline.length - 1}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Activity Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-semibold mb-4">Add Activity to Timeline</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAddToTimeline}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
              >
                Add Activity
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineBuilder; 