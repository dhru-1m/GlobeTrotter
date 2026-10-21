import React, { useState, useMemo } from 'react';
import TimelineBuilder from '../components/planner/TimelineBuilder';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  saveCurrentCity, 
  clearBuilder, 
  updateDetails,
  selectBudgetUsed, 
  selectBudgetTotal 
} from '../store/slices/tripBuilderSlice';
import { createTrip } from '../store/slices/tripSlice';
import { toast } from 'react-hot-toast';
import { selectTimeline, selectTimelineTotals } from '../store/slices/plannerSlice';
import { Calendar, DollarSign, Edit3, MapPin, CheckCircle, AlertTriangle, ArrowRight, Loader } from 'lucide-react';

const Planner = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { details, cities, currentCity } = useSelector((s) => s.tripBuilder || {});
  const timeline = useSelector(selectTimeline);
  const timelineTotals = useSelector(selectTimelineTotals);
  const rawBudgetUsed = useSelector(selectBudgetUsed);
  const budgetTotal = useSelector(selectBudgetTotal);

  const [isSaving, setIsSaving] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  // Derive active planned cost from timeline total or places added
  const plannedCost = useMemo(() => {
    return Math.max(rawBudgetUsed || 0, timelineTotals?.totalCost || 0);
  }, [rawBudgetUsed, timelineTotals]);

  // Derive sensible default dates if details is missing them
  const defaultDates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today.getTime() + 86400000);
    const nextWeek = new Date(today.getTime() + 7 * 86400000);

    const formatYMD = (d) => d.toISOString().split('T')[0];

    // If timeline has scheduled dates, use min and max
    if (timeline && timeline.length > 0) {
      const dates = timeline.map(t => t.scheduledDate).filter(Boolean).sort();
      if (dates.length > 0) {
        const earliest = dates[0];
        const latest = dates[dates.length - 1];
        if (earliest === latest) {
          const lDate = new Date(earliest);
          lDate.setDate(lDate.getDate() + 3);
          return { start: earliest, end: formatYMD(lDate) };
        }
        return { start: earliest, end: latest };
      }
    }

    return { start: formatYMD(tomorrow), end: formatYMD(nextWeek) };
  }, [timeline]);

  // Effective trip metadata
  const effectiveStartDate = details?.startDate || defaultDates.start;
  const effectiveEndDate = details?.endDate || defaultDates.end;
  const effectiveName = details?.name || (
    currentCity?.city ? `${currentCity.city} Adventure` : 
    (cities && cities.length > 0 && cities[0].city ? `${cities[0].city} Getaway` : 'My Travel Itinerary')
  );
  const effectiveBudget = budgetTotal > 0 ? budgetTotal : 3000;
  const effectiveDescription = details?.description || 'Trip planned with GlobeTrotter';

  // Modal edit form state
  const [modalName, setModalName] = useState(effectiveName);
  const [modalStart, setModalStart] = useState(effectiveStartDate);
  const [modalEnd, setModalEnd] = useState(effectiveEndDate);
  const [modalBudget, setModalBudget] = useState(effectiveBudget);
  const [modalDesc, setModalDesc] = useState(effectiveDescription);

  const openDetailsModal = () => {
    setModalName(effectiveName);
    setModalStart(effectiveStartDate);
    setModalEnd(effectiveEndDate);
    setModalBudget(effectiveBudget);
    setModalDesc(effectiveDescription);
    setShowEditModal(true);
  };

  const saveDetailsModal = (e) => {
    e.preventDefault();
    if (new Date(modalStart) >= new Date(modalEnd)) {
      toast.error('End date must be after start date');
      return;
    }
    dispatch(updateDetails({
      name: modalName.trim() || 'My Travel Itinerary',
      startDate: modalStart,
      endDate: modalEnd,
      budget: Number(modalBudget) || 0,
      description: modalDesc
    }));
    toast.success('Trip details updated');
    setShowEditModal(false);
  };

  const handleAddAnotherCity = () => {
    dispatch(saveCurrentCity());
    toast.success('Current city saved. Select another destination.');
    navigate('/cities');
  };

  const handleFinishAndSaveTrip = async () => {
    try {
      setIsSaving(true);
      dispatch(saveCurrentCity());

      // 1. Resolve start and end dates
      const sDate = details?.startDate || defaultDates.start;
      let eDate = details?.endDate || defaultDates.end;

      if (new Date(sDate) >= new Date(eDate)) {
        const nextDay = new Date(new Date(sDate).getTime() + 86400000 * 3);
        eDate = nextDay.toISOString().split('T')[0];
      }

      // 2. Resolve destinations
      const combinedCities = [];
      const seenCities = new Set();

      if (Array.isArray(cities)) {
        cities.forEach(c => {
          if (c && c.city && !seenCities.has(c.city)) {
            seenCities.add(c.city);
            combinedCities.push(c);
          }
        });
      }

      if (currentCity && currentCity.city && !seenCities.has(currentCity.city)) {
        seenCities.add(currentCity.city);
        combinedCities.push(currentCity);
      }

      // If no cities in builder, check timeline items or fallback
      if (combinedCities.length === 0) {
        timeline.forEach(t => {
          const cName = t.destination?.city || t.location?.name;
          if (cName && !seenCities.has(cName)) {
            seenCities.add(cName);
            combinedCities.push({ city: cName, country: t.destination?.country || 'Destination' });
          }
        });
      }

      if (combinedCities.length === 0) {
        combinedCities.push({ city: 'Global Destination', country: 'World' });
      }

      const destinationsPayload = combinedCities.map((c, idx) => ({
        city: c.city,
        country: c.country || 'Unknown',
        arrivalDate: sDate,
        departureDate: eDate,
        order: idx + 1
      }));

      // 3. Resolve activities
      const validTypes = ['sightseeing', 'food', 'adventure', 'culture', 'shopping', 'relaxation', 'transport', 'other'];
      const activitiesPayload = (timeline || []).map((t, idx) => {
        let duration = Number(t.duration) || 90;
        let startTime = t.startTime || '09:00';
        if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(startTime)) {
          startTime = '09:00';
        }

        const [sh, sm] = startTime.split(':').map(Number);
        const totalMin = sh * 60 + sm + duration;
        const eh = Math.min(23, Math.floor(totalMin / 60));
        const em = totalMin % 60;
        let endTime = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;
        if (endTime <= startTime) {
          endTime = '23:59';
        }

        let actDate = t.scheduledDate || sDate;
        // Clamp activity date to trip range
        if (new Date(actDate) < new Date(sDate)) actDate = sDate;
        if (new Date(actDate) > new Date(eDate)) actDate = eDate;

        const actType = validTypes.includes(t.type) ? t.type : 'sightseeing';
        const primaryDest = destinationsPayload[0] || { city: 'Destination', country: 'World' };

        return {
          title: t.title || 'Planned Activity',
          type: actType,
          date: actDate,
          startTime,
          endTime,
          duration,
          dayOrder: idx + 1,
          location: { name: t.location?.name || t.title || primaryDest.city },
          cost: Number(t.cost) || 0,
          currency: t.currency || 'USD',
          description: t.description || '',
          destination: {
            city: t.destination?.city || primaryDest.city,
            country: t.destination?.country || primaryDest.country
          }
        };
      });

      // 4. Construct complete trip payload
      const tripBudget = budgetTotal > 0 ? budgetTotal : (plannedCost > 0 ? plannedCost * 1.25 : 3000);

      const payload = {
        name: details?.name || effectiveName,
        description: details?.description || effectiveDescription,
        startDate: sDate,
        endDate: eDate,
        budget: Math.round(tripBudget),
        destinations: destinationsPayload,
        activities: activitiesPayload
      };

      // 5. Save trip via Redux thunk
      const action = await dispatch(createTrip(payload));

      if (createTrip.fulfilled.match(action)) {
        toast.success('🎉 Trip successfully created and saved!');
        dispatch(clearBuilder());
        navigate('/trips');
      } else {
        const errMsg = action.payload || 'Failed to create trip';
        toast.error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
        console.error('Trip save error:', action.payload);
      }
    } catch (err) {
      console.error('Save trip error:', err);
      toast.error(err.message || 'An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  };

  const budgetRemaining = effectiveBudget - plannedCost;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Trip Overview Banner */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-extrabold text-gray-900">{effectiveName}</h1>
                <button
                  onClick={openDetailsModal}
                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                  title="Edit Trip Details"
                >
                  <Edit3 className="w-5 h-5" />
                </button>
              </div>
              <p className="mt-1 text-gray-600">{effectiveDescription}</p>
              
              <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                  <Calendar className="w-4 h-4 text-indigo-600" />
                  {effectiveStartDate} → {effectiveEndDate}
                </span>
                <span className="flex items-center gap-1.5 bg-gray-100 px-3 py-1 rounded-full">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {cities?.length || currentCity ? `${(cities?.length || 0) + (currentCity ? 1 : 0)} Destination(s)` : 'Destinations added'}
                </span>
              </div>
            </div>

            {/* Quick Action in banner */}
            <div className="flex items-center gap-3">
              <button
                onClick={openDetailsModal}
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
              >
                Edit Dates & Info
              </button>
              <button
                onClick={handleFinishAndSaveTrip}
                disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm transition disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Saving Trip...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Finish & Save Trip
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Budget Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Target Budget</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">${effectiveBudget.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Planned Activities Cost</p>
              <p className="text-2xl font-bold text-yellow-600 mt-1">${plannedCost.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-50 text-yellow-600 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6" />
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Remaining Budget</p>
              <p className={`text-2xl font-bold mt-1 ${budgetRemaining < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                ${budgetRemaining.toLocaleString()}
              </p>
            </div>
            <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
              budgetRemaining < 0 ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {budgetRemaining < 0 ? <AlertTriangle className="w-6 h-6" /> : <CheckCircle className="w-6 h-6" />}
            </div>
          </div>
        </div>

        {/* Timeline Builder Component */}
        <TimelineBuilder />

        {/* Bottom Actions */}
        <div className="flex items-center justify-between mt-8 p-4 bg-white rounded-xl border border-gray-200">
          <button
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
            onClick={handleAddAnotherCity}
          >
            <MapPin className="w-4 h-4 text-indigo-600" />
            Add Another City
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={openDetailsModal}
              className="px-4 py-2.5 text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              Adjust Details
            </button>
            <button
              className="flex items-center gap-2 px-8 py-3 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shadow-md transition disabled:opacity-50"
              onClick={handleFinishAndSaveTrip}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Saving Trip...
                </>
              ) : (
                <>
                  <span>Finish and Save Trip</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Edit Trip Details Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-gray-900 mb-1">Trip Details & Schedule</h3>
            <p className="text-sm text-gray-500 mb-5">Set your trip dates and target budget before saving.</p>

            <form onSubmit={saveDetailsModal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trip Name</label>
                <input
                  type="text"
                  required
                  value={modalName}
                  onChange={(e) => setModalName(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. Paris Summer Getaway"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={modalDesc}
                  onChange={(e) => setModalDesc(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="Notes or description for your trip"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                  <input
                    type="date"
                    required
                    value={modalStart}
                    onChange={(e) => setModalStart(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                  <input
                    type="date"
                    required
                    value={modalEnd}
                    onChange={(e) => setModalEnd(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Budget (USD)</label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  value={modalBudget}
                  onChange={(e) => setModalBudget(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
                  placeholder="e.g. 2500"
                />
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 shadow-sm"
                >
                  Update Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Planner;