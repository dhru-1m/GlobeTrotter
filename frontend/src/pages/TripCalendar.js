import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Calendar as CalendarIcon, 
  Clock, 
  List, 
  ChevronLeft, 
  ChevronRight,
  Plus,
  Edit,
  Trash2
} from 'lucide-react';
import { fetchTrip } from '../store/slices/tripSlice';
import { itineraryAPI, activityAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import CalendarView from '../components/calendar/CalendarView';
import TimelineView from '../components/calendar/TimelineView';
import ActivityEditModal from '../components/calendar/ActivityEditModal';

const TripCalendar = () => {
  const { tripId } = useParams();
  const dispatch = useDispatch();
  const { currentTrip: trip, tripLoading: loading, tripError: error } = useSelector((state) => state.trips);

  const [viewMode, setViewMode] = useState('calendar'); // calendar | timeline
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [itinerary, setItinerary] = useState(null);
  const [activities, setActivities] = useState([]);
  const [itineraryLoading, setItineraryLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState(null);

  useEffect(() => {
    if (tripId) {
      dispatch(fetchTrip(tripId));
      fetchItinerary();
      fetchActivities();
    }
  }, [tripId, dispatch]);

  const fetchItinerary = async () => {
    try {
      setItineraryLoading(true);
      const response = await itineraryAPI.getItinerary(tripId);
      setItinerary(response.data.data);
    } catch (err) {
      console.error('Failed to fetch itinerary:', err);
    } finally {
      setItineraryLoading(false);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await activityAPI.getActivities({ tripId });
      setActivities(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
    }
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
  };

  const handleEditActivity = (activity) => {
    setSelectedActivity(activity);
    setEditModalOpen(true);
  };

  const handleDeleteActivity = async (activityId) => {
    if (window.confirm('Are you sure you want to delete this activity?')) {
      try {
        await activityAPI.deleteActivity(activityId);
        fetchActivities();
        fetchItinerary();
      } catch (err) {
        console.error('Failed to delete activity:', err);
      }
    }
  };

  const handleActivityUpdate = () => {
    fetchActivities();
    fetchItinerary();
    setEditModalOpen(false);
    setSelectedActivity(null);
  };

  const getActivitiesForDate = (dateStr) => {
    if (itinerary?.itinerary?.[dateStr]) return itinerary.itinerary[dateStr];
    if (itinerary?.days?.[dateStr]?.activities) return itinerary.days[dateStr].activities;
    return activities.filter(a => {
      if (!a.date) return false;
      const d = (a.date instanceof Date) ? a.date : new Date(a.date);
      return !isNaN(d.getTime()) && d.toISOString().split('T')[0] === dateStr;
    });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const { source, destination } = result;
    
    // Handle reordering within the same day
    if (source.droppableId === destination.droppableId) {
      const date = source.droppableId;
      const dayActivities = getActivitiesForDate(date);
      
      const reorderedActivities = Array.from(dayActivities);
      const [removed] = reorderedActivities.splice(source.index, 1);
      reorderedActivities.splice(destination.index, 0, removed);
      
      try {
        await itineraryAPI.reorderDayActivities(
          tripId, 
          date, 
          reorderedActivities.map(a => a._id)
        );
        fetchItinerary();
      } catch (err) {
        console.error('Failed to reorder activities:', err);
      }
    }
    // Handle moving activity between days
    else {
      const sourceDate = source.droppableId;
      const destDate = destination.droppableId;
      const sourceActivities = getActivitiesForDate(sourceDate);
      const activityId = sourceActivities?.[source.index]?._id;
      
      if (activityId) {
        try {
          // Remove from source day
          await itineraryAPI.removeActivityFromDay(tripId, sourceDate, activityId);
          // Add to destination day
          await itineraryAPI.addActivityToDay(tripId, destDate, activityId);
          fetchItinerary();
          fetchActivities();
        } catch (err) {
          console.error('Failed to move activity:', err);
        }
      }
    }
  };

  if (loading || itineraryLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-md p-6 inline-block">
          <h3 className="text-lg font-medium text-red-900 mb-2">Error</h3>
          <p className="text-red-700 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Trip not found</h3>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trip Calendar</h1>
          <p className="text-gray-600">{trip.name}</p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'calendar'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <CalendarIcon className="h-4 w-4 mr-2 inline" />
              Calendar
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'timeline'
                  ? 'bg-white text-primary-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <List className="h-4 w-4 mr-2 inline" />
              Timeline
            </button>
          </div>
        </div>
      </div>

      {/* View Content */}
      {viewMode === 'calendar' ? (
        <CalendarView
          trip={trip}
          itinerary={itinerary}
          activities={activities}
          selectedDate={selectedDate}
          onDateSelect={handleDateSelect}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
          onDragEnd={handleDragEnd}
        />
      ) : (
        <TimelineView
          trip={trip}
          itinerary={itinerary}
          activities={activities}
          onEditActivity={handleEditActivity}
          onDeleteActivity={handleDeleteActivity}
          onDragEnd={handleDragEnd}
        />
      )}

      {/* Activity Edit Modal */}
      <ActivityEditModal
        isOpen={editModalOpen}
        onClose={() => {
          setEditModalOpen(false);
          setSelectedActivity(null);
        }}
        activity={selectedActivity}
        tripId={tripId}
        onUpdate={handleActivityUpdate}
      />
    </div>
  );
};

export default TripCalendar;
