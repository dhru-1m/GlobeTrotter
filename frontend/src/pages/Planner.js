import React from 'react';
import TimelineBuilder from '../components/planner/TimelineBuilder';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { saveCurrentCity, clearBuilder, selectBudgetUsed, selectBudgetTotal, selectBudgetRemaining } from '../store/slices/tripBuilderSlice';
import { createTrip } from '../store/slices/tripSlice';
import { toast } from 'react-hot-toast';
import { selectTimeline } from '../store/slices/plannerSlice';

const Planner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { details, cities } = useSelector((s) => s.tripBuilder || {});
  const timeline = useSelector(selectTimeline);
  const budgetUsed = useSelector(selectBudgetUsed);
  const budgetTotal = useSelector(selectBudgetTotal);
  const budgetRemaining = useSelector(selectBudgetRemaining);

  const handleAddAnotherCity = () => {
    dispatch(saveCurrentCity());
    toast.success('City itinerary saved. Add another city.');
    navigate('/cities');
  };

  const handleFinishAndSaveTrip = async () => {
    dispatch(saveCurrentCity());
    if (budgetUsed > budgetTotal) {
      toast.error('Total planned cost exceeds your trip budget!');
      return;
    }
    if(!details?.startDate || !details?.endDate){
      toast.error('Trip dates missing');
      return;
    }
    // Build destinations from tripBuilder cities (simple order)
    const destinations = (cities || []).map((c, idx) => ({
      city: c.city,
      country: c.country,
      arrivalDate: details.startDate,
      departureDate: details.endDate,
      order: idx
    }));
    // Map timeline into activities payload (not currently saved by backend createTrip, would need separate endpoint; attach for future use)
    const activities = timeline.map(t => {
      const start = new Date(`2000-01-01T${t.startTime}:00`);
      start.setMinutes(start.getMinutes() + (t.duration || 0));
      const hh = String(start.getHours()).padStart(2,'0');
      const mm = String(start.getMinutes()).padStart(2,'0');
      const endTime = `${hh}:${mm}`;
      return {
        title: t.title,
        type: t.type,
        date: t.scheduledDate || details.startDate,
        startTime: t.startTime,
        endTime,
        duration: t.duration,
        cost: t.cost,
        currency: t.currency,
        description: t.description
      };
    });
    const payload = {
      name: details?.name || 'New Trip',
      description: details?.description || '',
      startDate: details?.startDate,
      endDate: details?.endDate,
      destinations,
      activities
    };
    const action = await dispatch(createTrip(payload));
    if (createTrip.fulfilled.match(action)) {
      toast.success('Trip created');
      dispatch(clearBuilder());
      navigate('/trips');
    } else {
      toast.error(action.payload || 'Failed to create trip');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Trip Planner</h1>
          <p className="mt-2 text-gray-600">Build your perfect trip timeline with date and time scheduling</p>
        </div>

        {/* Budget Info */}
        <div className="mb-6 flex gap-6 items-center">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
            <span className="text-gray-600 text-sm">Total Budget</span>
            <span className="text-xl font-bold text-primary-700">${budgetTotal}</span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center">
            <span className="text-gray-600 text-sm">Planned Cost</span>
            <span className="text-xl font-bold text-yellow-700">${budgetUsed}</span>
          </div>
          <div className={`bg-white rounded-lg shadow-sm border border-gray-200 p-4 flex flex-col items-center ${budgetRemaining < 0 ? 'border-red-400' : ''}`}>
            <span className="text-gray-600 text-sm">Remaining</span>
            <span className={`text-xl font-bold ${budgetRemaining < 0 ? 'text-red-600' : 'text-green-700'}`}>${budgetRemaining}</span>
          </div>
        </div>

        <TimelineBuilder />

        <div className="flex gap-4 mt-8 justify-end">
          <button
            className="px-6 py-3 rounded bg-gray-100 text-gray-800 font-semibold hover:bg-gray-200 transition"
            onClick={handleAddAnotherCity}
          >
            Add Another City
          </button>
          <button
            className="px-6 py-3 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            onClick={handleFinishAndSaveTrip}
            disabled={budgetUsed > budgetTotal}
          >
            Finish and Save Trip
          </button>
        </div>
      </div>
    </div>
  );
};

export default Planner;