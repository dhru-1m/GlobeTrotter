import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../services/api';

// Async thunks
export const searchCities = createAsyncThunk(
  'cities/searchCities',
  async (searchParams, { rejectWithValue }) => {
    try {
      const response = await api.get('/cities', { params: searchParams });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to search cities');
    }
  }
);

export const getCityById = createAsyncThunk(
  'cities/getCityById',
  async (cityId, { rejectWithValue }) => {
    try {
      const response = await api.get(`/cities/${cityId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch city');
    }
  }
);

export const getAIRecommendations = createAsyncThunk(
  'cities/getAIRecommendations',
  async (preferences, { rejectWithValue }) => {
    try {
      const response = await api.post('/cities/ai-recommendations', preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get AI recommendations');
    }
  }
);

export const getActivityRecommendations = createAsyncThunk(
  'cities/getActivityRecommendations',
  async ({ cityId, preferences }, { rejectWithValue }) => {
    try {
      const response = await api.post(`/cities/${cityId}/activities`, preferences);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get activity recommendations');
    }
  }
);

export const getNearbyCities = createAsyncThunk(
  'cities/getNearbyCities',
  async ({ latitude, longitude, radius = 100 }, { rejectWithValue }) => {
    try {
      const response = await api.get('/cities/nearby', {
        params: { latitude, longitude, radius }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to get nearby cities');
    }
  }
);

export const aiSearchCity = createAsyncThunk(
  'cities/aiSearchCity',
  async (cityName, { rejectWithValue }) => {
    try {
      const response = await api.post('/cities/ai-search', { cityName }, { timeout: 90000 });
      return response.data;
    } catch (error) {
      // Surface clearer errors and log for debugging
      const status = error.response?.status;
      const serverMessage = error.response?.data?.message;
      const serverError = error.response?.data?.error;
      const fallback = 'Failed to search for city';
      const message = serverMessage || serverError || error.message || fallback;
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('aiSearchCity error:', { status, serverMessage, serverError });
      }
      return rejectWithValue(message);
    }
  }
);

const initialState = {
  cities: [],
  selectedCity: null,
  aiRecommendations: null,
  activityRecommendations: null,
  nearbyCities: [],
  aiSearchResult: null,
  loading: false,
  error: null,
  searchHistory: [],
  filters: {
    country: '',
    costMin: '',
    costMax: '',
    popularity: '',
    climate: ''
  },
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0
  }
};

const citySlice = createSlice({
  name: 'cities',
  initialState,
  reducers: {
    clearCities: (state) => {
      state.cities = [];
      state.error = null;
    },
    clearSelectedCity: (state) => {
      state.selectedCity = null;
    },
    clearAIRecommendations: (state) => {
      state.aiRecommendations = null;
    },
    clearActivityRecommendations: (state) => {
      state.activityRecommendations = null;
    },
    clearAISearchResult: (state) => {
      state.aiSearchResult = null;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    addToSearchHistory: (state, action) => {
      const searchTerm = action.payload;
      if (searchTerm && !state.searchHistory.includes(searchTerm)) {
        state.searchHistory = [searchTerm, ...state.searchHistory.slice(0, 9)]; // Keep last 10 searches
      }
    },
    clearSearchHistory: (state) => {
      state.searchHistory = [];
    },
    setPagination: (state, action) => {
      state.pagination = { ...state.pagination, ...action.payload };
    }
  },
  extraReducers: (builder) => {
    builder
      // Search Cities
      .addCase(searchCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchCities.fulfilled, (state, action) => {
        state.loading = false;
        state.cities = action.payload.data || [];
        state.pagination = {
          ...state.pagination,
          total: action.payload.total || 0,
          totalPages: action.payload.totalPages || 0
        };
        
        // Add to search history if there was a search query
        if (action.meta.arg?.search) {
          citySlice.caseReducers.addToSearchHistory(state, {
            payload: action.meta.arg.search
          });
        }
      })
      .addCase(searchCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.cities = [];
      })
      
      // Get City by ID
      .addCase(getCityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCityById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedCity = action.payload.data;
      })
      .addCase(getCityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.selectedCity = null;
      })
      
      // AI Recommendations
      .addCase(getAIRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAIRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.aiRecommendations = action.payload.data;
      })
      .addCase(getAIRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.aiRecommendations = null;
      })
      
      // Activity Recommendations
      .addCase(getActivityRecommendations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getActivityRecommendations.fulfilled, (state, action) => {
        state.loading = false;
        state.activityRecommendations = action.payload.data;
      })
      .addCase(getActivityRecommendations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.activityRecommendations = null;
      })
      
      // Nearby Cities
      .addCase(getNearbyCities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getNearbyCities.fulfilled, (state, action) => {
        state.loading = false;
        state.nearbyCities = action.payload.data || [];
      })
      .addCase(getNearbyCities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.nearbyCities = [];
      })
      
      // AI Search City
      .addCase(aiSearchCity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(aiSearchCity.fulfilled, (state, action) => {
        state.loading = false;
        state.aiSearchResult = action.payload.data;
        
        // If it's AI generated, add to cities array for display
        if (action.payload.source === 'ai-generated') {
          state.cities = [action.payload.data];
        } else if (action.payload.source === 'database') {
          state.cities = [action.payload.data];
        }
      })
      .addCase(aiSearchCity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.aiSearchResult = null;
      });
  }
});

export const {
  clearCities,
  clearSelectedCity,
  clearAIRecommendations,
  clearActivityRecommendations,
  clearAISearchResult,
  setFilters,
  clearFilters,
  addToSearchHistory,
  clearSearchHistory,
  setPagination
} = citySlice.actions;

export default citySlice.reducer;
