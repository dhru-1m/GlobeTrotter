import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { forgotPassword, clearError } from '../../store/slices/authSlice';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const dispatch = useDispatch();
  const { loading, error } = useSelector((state) => state.auth);
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = async (data) => {
    try {
      await dispatch(forgotPassword(data.email)).unwrap();
      setEmailSent(true);
      toast.success('Password reset email sent successfully!');
    } catch (error) {
      toast.error(error || 'Failed to send reset email');
    }
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  if (emailSent) {
    return (
      <div className="w-full">
        <div className="text-center">
          <Mail className="mx-auto h-10 w-10 text-success-500 mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Check your email
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            We've sent you a password reset link. Please check your email and follow the instructions.
          </p>
          <Link
            to="/login"
            className="text-sm font-medium text-primary-600 hover:text-primary-500"
          >
            Back to login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Forgot your password?
        </h2>
        <p className="text-sm text-gray-600">
          Enter your email address and we'll send you a link to reset your password.
        </p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Email address
          </label>
          <input
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            className="input"
            placeholder="Email address"
            onChange={handleClearError}
          />
          {errors.email && (
            <p className="mt-1 text-sm text-danger-600">{errors.email.message}</p>
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
          {loading ? 'Sending...' : 'Send reset link'}
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

export default ForgotPassword;