import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Navigate } from 'react-router-dom';
import { AlertCircle, Shield, KeyRound } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { toast } from 'react-hot-toast';
import { getCurrentUser } from '../../store/slices/authSlice';

const AdminRoute = ({ children }) => {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const [attempted, setAttempted] = useState(false);
  const [loading, setLoading] = useState(false);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    const tryPromote = async (pass) => {
      try {
        setLoading(true);
        await adminAPI.promote(pass);
        toast.success('Admin access granted');
        await dispatch(getCurrentUser());
      } catch (e) {
        toast.error('Invalid admin password');
      } finally {
        setLoading(false);
      }
    };

    const onSubmit = async (e) => {
      e.preventDefault();
      const formData = new FormData(e.currentTarget);
      const pass = formData.get('password');
      if (!pass) return;
      await tryPromote(pass);
      setAttempted(true);
    };

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white shadow-sm rounded-md border border-gray-200 p-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <KeyRound className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 text-center mb-2">Admin Access</h1>
          <p className="text-sm text-gray-600 text-center mb-6">
            Enter the admin password to access this page.
          </p>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Admin Password</label>
              <input
                id="password"
                name="password"
                type="password"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter admin password"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full inline-flex justify-center items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? 'Verifying…' : 'Unlock Admin'}
            </button>
          </form>
          {attempted && (
            <div className="mt-4 flex items-center text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span className="text-xs">If access is still blocked, double-check the password and try again.</span>
            </div>
          )}
          <div className="mt-6 text-center text-xs text-gray-500">
            Admin privileges are required for this route.
          </div>
        </div>
      </div>
    );
  }

  return children;
};

export default AdminRoute;
