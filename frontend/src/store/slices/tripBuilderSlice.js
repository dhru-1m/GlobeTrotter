import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  active: false,
  details: null, // { name, description, startDate, endDate, budget, ... }
  cities: [], // [{ city, country, places: [ { name, notes } ] }]
  currentCity: null, // { city, country, places: [] }
  budgetUsed: 0, // sum of all planned activities' costs
};

const tripBuilderSlice = createSlice({
  name: 'tripBuilder',
  initialState,
  reducers: {
    startTripBuild: (state, action) => {
      state.active = true;
      state.details = action.payload; // basic trip details
      state.cities = [];
      state.currentCity = null;
    },
    setCurrentCity: (state, action) => {
      const { city, country } = action.payload;
      state.currentCity = { city, country, places: [] };
    },
    addPlaceToCurrentCity: (state, action) => {
      if (!state.currentCity) return;
      const place = action.payload; // { name, notes, cost }
      state.currentCity.places.push(place);
      // Add cost if provided
      if (place.cost) {
        state.budgetUsed += Number(place.cost);
      }
    },
    removePlaceFromCurrentCity: (state, action) => {
      if (!state.currentCity) return;
      const index = action.payload; // index in places
      const place = state.currentCity.places[index];
      if (place && place.cost) {
        state.budgetUsed -= Number(place.cost);
      }
      state.currentCity.places.splice(index, 1);
    },
    saveCurrentCity: (state) => {
      if (!state.currentCity) return;
      // if city already exists, replace it; else push
      const idx = state.cities.findIndex(
        c => c.city === state.currentCity.city && c.country === state.currentCity.country
      );
      if (idx >= 0) state.cities[idx] = state.currentCity;
      else state.cities.push(state.currentCity);
      state.currentCity = null;
    },
    clearBuilder: (state) => {
      state.active = false;
      state.details = null;
      state.cities = [];
      state.currentCity = null;
      state.budgetUsed = 0;
    },
  },
});

export const {
  startTripBuild,
  setCurrentCity,
  addPlaceToCurrentCity,
  removePlaceFromCurrentCity,
  saveCurrentCity,
  clearBuilder,
} = tripBuilderSlice.actions;

export const selectBudgetUsed = (state) => state.tripBuilder.budgetUsed || 0;
export const selectBudgetTotal = (state) => state.tripBuilder.details?.budget || 0;
export const selectBudgetRemaining = (state) => {
  const total = state.tripBuilder.details?.budget || 0;
  const used = state.tripBuilder.budgetUsed || 0;
  return total - used;
};

export default tripBuilderSlice.reducer;
