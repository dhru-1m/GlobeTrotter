import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { tripAPI } from '../../services/api';

// Async thunks
export const fetchTrips = createAsyncThunk(
  'trips/fetchTrips',
  async (params, { rejectWithValue }) => {
    try {
      const response = await tripAPI.getTrips(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trips');
    }
  }
);

export const fetchTrip = createAsyncThunk(
  'trips/fetchTrip',
  async (tripId, { rejectWithValue }) => {
    try {
      const response = await tripAPI.getTrip(tripId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch trip');
    }
  }
);

export const createTrip = createAsyncThunk(
  'trips/createTrip',
  async (tripData, { rejectWithValue }) => {
    try {
      const response = await tripAPI.createTrip(tripData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create trip');
    }
  }
);

export const updateTrip = createAsyncThunk(
  'trips/updateTrip',
  async ({ tripId, tripData }, { rejectWithValue }) => {
    try {
      const response = await tripAPI.updateTrip(tripId, tripData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update trip');
    }
  }
);

export const deleteTrip = createAsyncThunk(
  'trips/deleteTrip',
  async (tripId, { rejectWithValue }) => {
    try {
      await tripAPI.deleteTrip(tripId);
      return tripId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete trip');
    }
  }
);

export const fetchPublicTrip = createAsyncThunk(
  'trips/fetchPublicTrip',
  async (publicUrl, { rejectWithValue }) => {
    try {
      const response = await tripAPI.getPublicTrip(publicUrl);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch public trip');
    }
  }
);

const initialState = {
  trips: [],
  currentTrip: null,
  publicTrip: null,
  loading: false,
  error: null,
  tripLoading: false,
  tripError: null,
  createLoading: false,
  createError: null,
  updateLoading: false,
  updateError: null,
  deleteLoading: false,
  deleteError: null,
  pagination: {
    page: 1,
    limit: 10,
    total: 0,
    pages: 0,
  },
};

const tripSlice = createSlice({
  name: 'trips',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
      state.tripError = null;
      state.createError = null;
      state.updateError = null;
      state.deleteError = null;
    },
    clearCurrentTrip: (state) => {
      state.currentTrip = null;
    },
    clearPublicTrip: (state) => {
      state.publicTrip = null;
    },
    setCurrentTrip: (state, action) => {
      state.currentTrip = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch trips
      .addCase(fetchTrips.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrips.fulfilled, (state, action) => {
        state.loading = false;
        // Backend returns { success, count, total, pagination, data }
        const payload = action.payload;
        state.trips = payload.data || [];
        if (payload.pagination) state.pagination = payload.pagination;
      })
      .addCase(fetchTrips.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch trips';
      })
      
      // Fetch single trip
      .addCase(fetchTrip.pending, (state) => {
        state.tripLoading = true;
        state.tripError = null;
      })
      .addCase(fetchTrip.fulfilled, (state, action) => {
        state.tripLoading = false;
        state.currentTrip = action.payload.data;
      })
      .addCase(fetchTrip.rejected, (state, action) => {
        state.tripLoading = false;
        state.tripError = action.payload;
      })
      
      // Create trip
      .addCase(createTrip.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createTrip.fulfilled, (state, action) => {
        state.createLoading = false;
        state.trips.unshift(action.payload.data);
        state.currentTrip = action.payload.data;
      })
      .addCase(createTrip.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      
      // Update trip
      .addCase(updateTrip.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateTrip.fulfilled, (state, action) => {
        state.updateLoading = false;
        const updatedTrip = action.payload.data;
        state.currentTrip = updatedTrip;
        const index = state.trips.findIndex(trip => trip._id === updatedTrip._id);
        if (index !== -1) {
          state.trips[index] = updatedTrip;
        }
      })
      .addCase(updateTrip.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Delete trip
      .addCase(deleteTrip.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteTrip.fulfilled, (state, action) => {
        state.deleteLoading = false;
        const deletedTripId = action.payload;
        state.trips = state.trips.filter(trip => trip._id !== deletedTripId);
        if (state.currentTrip && state.currentTrip._id === deletedTripId) {
          state.currentTrip = null;
        }
      })
      .addCase(deleteTrip.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      })
      
      // Fetch public trip
      .addCase(fetchPublicTrip.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPublicTrip.fulfilled, (state, action) => {
        state.loading = false;
        state.publicTrip = action.payload.data;
      })
      .addCase(fetchPublicTrip.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearCurrentTrip, clearPublicTrip, setCurrentTrip } = tripSlice.actions;
export default tripSlice.reducer;