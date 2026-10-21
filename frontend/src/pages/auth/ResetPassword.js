import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { resetPassword, clearError } from '../../store/slices/authSlice';
import { Lock, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { token } = useParams();
  const { loading, error } = useSelector((state) => state.auth);
  const [passwordReset, setPasswordReset] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const password = watch('password');

  const onSubmit = async (data) => {
    try {
      await dispatch(resetPassword({ token, password: data.password })).unwrap();
      setPasswordReset(true);
      toast.success('Password reset successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (error) {
      toast.error(error || 'Failed to reset password');
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  if (passwordReset) {
    return (
      <div className="w-full">
        <div className="text-center">
          <Lock className="mx-auto h-10 w-10 text-success-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Password reset successful!
          </h2>
          <p className="text-sm text-gray-600">
            Your password has been reset successfully. You will be redirected to the dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Reset your password
        </h2>
        <p className="text-sm text-gray-600">
          Enter your new password below.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            New Password
          </label>
          <input
            {...register('password', {
              required: 'Password is required',
              minLength: {
                value: 6,
                message: 'Password must be at least 6 characters',
              },
            })}
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            placeholder="New password"
            onChange={handleClearError}
          />
          {errors.password && (
            <p className="mt-1 text-sm text-danger-600">{errors.password.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirm Password
          </label>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your password',
              validate: (value) =>
                value === password || 'Passwords do not match',
            })}
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            autoComplete="new-password"
            required
            className="input"
            placeholder="Confirm new password"
            onChange={handleClearError}
          />
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-danger-600">{errors.confirmPassword.message}</p>
          )}
        </div>

        {error && (
          <div className="rounded-md bg-danger-50 p-3 border border-danger-200">
            <div className="text-sm text-danger-700">{error}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full"
        >
          {loading ? 'Resetting...' : 'Reset password'}
        </button>

        <div className="text-center">
          <Link
            to="/login"
            className="text-sm font-medium text-primary-600 hover:text-primary-500 inline-flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to login
          </Link>
        </div>
      </form>
    </div>
  );
};

export default ResetPassword;