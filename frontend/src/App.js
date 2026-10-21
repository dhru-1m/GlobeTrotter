import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from './store/slices/authSlice';
import { toast } from 'react-hot-toast';

// Layout components
import Layout from './components/layout/Layout';
import AuthLayout from './components/layout/AuthLayout';

// Auth pages
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';

// Main pages
import Dashboard from './pages/Dashboard';
import Trips from './pages/Trips';
import TripDetail from './pages/TripDetail';
import TripCreate from './pages/TripCreate';
import TripEdit from './pages/TripEdit';
import Profile from './pages/Profile';
import PublicTrip from './pages/PublicTrip';
import CitySearch from './pages/CitySearch';
import Planner from './pages/Planner';
import TripBudget from './pages/TripBudget';
import BudgetOverview from './pages/BudgetOverview';
import TripCalendar from './pages/TripCalendar';
import PublicItinerary from './pages/PublicItinerary';
import PublicTrips from './pages/PublicTrips';
import AdminDashboard from './pages/AdminDashboard';
import AttractionDetail from './pages/AttractionDetail';

// Components
import LoadingSpinner from './components/common/LoadingSpinner';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, loading, user } = useSelector((state) => state.auth);

  useEffect(() => {
    // Check if user is authenticated on app load
    const token = localStorage.getItem('token');
    if (token && !isAuthenticated) {
      dispatch(getCurrentUser());
    }
  }, [dispatch, isAuthenticated]);

  useEffect(() => {
    // Show welcome message when user logs in
    if (isAuthenticated && user) {
      toast.success(`Welcome back, ${user.name}!`);
    }
  }, [isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={
        <AuthLayout>
          <Login />
        </AuthLayout>
      } />
      <Route path="/register" element={
        <AuthLayout>
          <Register />
        </AuthLayout>
      } />
      <Route path="/forgot-password" element={
        <AuthLayout>
          <ForgotPassword />
        </AuthLayout>
      } />
      <Route path="/reset-password/:token" element={
        <AuthLayout>
          <ResetPassword />
        </AuthLayout>
      } />
      <Route path="/trip/:publicUrl" element={<PublicTrip />} />
      <Route path="/public-trip/:publicUrl" element={<PublicTrip />} />
      <Route path="/public-itinerary/:publicUrl" element={<PublicItinerary />} />
      <Route path="/discover" element={<PublicTrips />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="trips" element={<Trips />} />
        <Route path="trips/create" element={<TripCreate />} />
        <Route path="trips/:tripId" element={<TripDetail />} />
        <Route path="trips/:tripId/edit" element={<TripEdit />} />
        <Route path="trips/:tripId/itinerary" element={<div>Not Found</div>} />
        <Route path="cities" element={<CitySearch />} />
        <Route path="planner" element={<Planner />} />
        <Route path="budget" element={<BudgetOverview />} />
        <Route path="trips/:tripId/budget" element={<TripBudget />} />
        <Route path="trips/:tripId/calendar" element={<TripCalendar />} />
        <Route path="profile" element={<Profile />} />
        <Route path="admin" element={<AdminDashboard />} />
        <Route path="cities/:cityName/attraction/:attractionSlug" element={<AttractionDetail />} />
      </Route>

      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;