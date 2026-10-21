import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { updateProfile, clearError, deleteAccount } from '../store/slices/authSlice';
import { 
  User, 
  Mail, 
  Calendar, 
  MapPin, 
  Edit, 
  Save, 
  X, 
  Camera, 
  Globe, 
  Trash2, 
  Heart, 
  Settings,
  AlertTriangle,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';
import { userAPI } from '../services/api';

const Profile = () => {
  const dispatch = useDispatch();
  const { user, profileLoading, profileError } = useSelector((state) => state.auth);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(user?.profilePicture || '');
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loadingDestinations, setLoadingDestinations] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    defaultValues: {
      name: user?.name || '',
      email: user?.email || '',
      bio: user?.bio || '',
      location: user?.location || '',
      language: user?.preferences?.language || 'en',
      timezone: user?.preferences?.timezone || 'UTC',
      emailNotifications: user?.preferences?.emailNotifications ?? true,
      pushNotifications: user?.preferences?.pushNotifications ?? true,
      marketingEmails: user?.preferences?.marketingEmails ?? false,
    },
  });

  // Load saved destinations on component mount
  useEffect(() => {
    if (activeTab === 'destinations') {
      fetchSavedDestinations();
    }
  }, [activeTab]);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      reset({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        location: user.location || '',
        language: user.preferences?.language || 'en',
        timezone: user.preferences?.timezone || 'UTC',
        emailNotifications: user.preferences?.emailNotifications ?? true,
        pushNotifications: user.preferences?.pushNotifications ?? true,
        marketingEmails: user.preferences?.marketingEmails ?? false,
      });
      setPhotoPreview(user.profilePicture || '');
    }
  }, [user, reset]);

  const fetchSavedDestinations = async () => {
    try {
      setLoadingDestinations(true);
      const response = await userAPI.getSavedDestinations();
      setSavedDestinations(response.data.data || []);
    } catch (error) {
      console.error('Error fetching saved destinations:', error);
      toast.error('Failed to load saved destinations');
    } finally {
      setLoadingDestinations(false);
    }
  };

  const handlePhotoChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('File size must be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      setProfilePhoto(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeSavedDestination = async (destinationId) => {
    try {
      await userAPI.removeSavedDestination(destinationId);
      setSavedDestinations(prev => prev.filter(dest => dest._id !== destinationId));
      toast.success('Destination removed from saved list');
    } catch (error) {
      toast.error('Failed to remove destination');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      await userAPI.deleteAccount();
      toast.success('Account deleted successfully');
      // Redirect to login or home page
      window.location.href = '/';
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete account');
    }
  };

  const languages = [
    { code: 'en', name: 'English' },
    { code: 'es', name: 'Español' },
    { code: 'fr', name: 'Français' },
    { code: 'de', name: 'Deutsch' },
    { code: 'it', name: 'Italiano' },
    { code: 'pt', name: 'Português' },
    { code: 'zh', name: '中文' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
    { code: 'ar', name: 'العربية' },
  ];

  const timezones = [
    'UTC',
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Australia/Sydney',
    'America/Toronto',
    'Asia/Dubai',
  ];

  const onSubmit = async (data) => {
    try {
      // Create FormData for file upload
      const formData = new FormData();
      Object.keys(data).forEach(key => {
        if (key === 'emailNotifications' || key === 'pushNotifications' || key === 'marketingEmails') {
          formData.append(`preferences.${key}`, data[key]);
        } else if (key === 'language' || key === 'timezone') {
          formData.append(`preferences.${key}`, data[key]);
        } else {
          formData.append(key, data[key]);
        }
      });
      
      if (profilePhoto) {
        formData.append('profilePicture', profilePhoto);
      }

      await dispatch(updateProfile(formData)).unwrap();
      setIsEditing(false);
      setProfilePhoto(null);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error(error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
    setProfilePhoto(null);
    setPhotoPreview(user?.profilePicture || '');
    dispatch(clearError());
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white shadow rounded-lg">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">Profile & Settings</h1>
            {!isEditing && activeTab === 'profile' && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </button>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            {[
              { id: 'profile', name: 'Profile', icon: User },
              { id: 'preferences', name: 'Preferences', icon: Settings },
              { id: 'destinations', name: 'Saved Destinations', icon: Heart },
              { id: 'privacy', name: 'Privacy & Security', icon: Shield },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`${
                    activeTab === tab.id
                      ? 'border-indigo-500 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="px-6 py-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div>
              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Profile Photo Upload */}
                  <div className="flex items-center space-x-6">
                    <div className="relative">
                      {photoPreview ? (
                        <img
                          src={photoPreview}
                          alt="Profile"
                          className="w-24 h-24 rounded-full object-cover border-4 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-indigo-100 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                          <User className="w-12 h-12 text-indigo-600" />
                        </div>
                      )}
                      <label
                        htmlFor="photo-upload"
                        className="absolute bottom-0 right-0 bg-indigo-600 rounded-full p-2 cursor-pointer hover:bg-indigo-700 transition-colors"
                      >
                        <Camera className="w-4 h-4 text-white" />
                        <input
                          id="photo-upload"
                          type="file"
                          accept="image/*"
                          onChange={handlePhotoChange}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">Profile Photo</h3>
                      <p className="text-sm text-gray-500">
                        Upload a new profile photo. Max file size: 5MB
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Full Name
                      </label>
                      <input
                        {...register('name', { required: 'Name is required' })}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors.name && (
                        <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        {...register('email', {
                          required: 'Email is required',
                          pattern: {
                            value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                            message: 'Invalid email address',
                          },
                        })}
                        type="email"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      {errors.email && (
                        <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Location
                      </label>
                      <input
                        {...register('location')}
                        type="text"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="City, Country"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      <textarea
                        {...register('bio')}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Tell us about yourself..."
                      />
                    </div>
                  </div>

                  {profileError && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="text-sm text-red-700">{profileError}</div>
                    </div>
                  )}

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={handleCancel}
                      className="flex items-center px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    >
                      <X className="w-4 h-4 mr-2" />
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={profileLoading}
                      className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {profileLoading ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="flex items-center space-x-4">
                    {user.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt="Profile"
                        className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-lg"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-10 h-10 text-indigo-600" />
                      </div>
                    )}
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{user.name}</h2>
                      <p className="text-gray-600">{user.email}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                    </div>

                    {user.location && (
                      <div className="flex items-center space-x-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-500">Location</p>
                          <p className="text-gray-900">{user.location}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      <Calendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Member since</p>
                        <p className="text-gray-900">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-500">Language</p>
                        <p className="text-gray-900">
                          {languages.find(lang => lang.code === (user.preferences?.language || 'en'))?.name || 'English'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {user.bio && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">About</h3>
                      <p className="text-gray-600">{user.bio}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language Preference
                  </label>
                  <select
                    {...register('language')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {languages.map((lang) => (
                      <option key={lang.code} value={lang.code}>
                        {lang.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Timezone
                  </label>
                  <select
                    {...register('timezone')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {timezones.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Notification Preferences</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Email Notifications</label>
                      <p className="text-sm text-gray-500">Receive notifications about your trips and activities</p>
                    </div>
                    <input
                      {...register('emailNotifications')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Push Notifications</label>
                      <p className="text-sm text-gray-500">Get push notifications on your device</p>
                    </div>
                    <input
                      {...register('pushNotifications')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <label className="text-sm font-medium text-gray-700">Marketing Emails</label>
                      <p className="text-sm text-gray-500">Receive promotional offers and travel inspiration</p>
                    </div>
                    <input
                      {...register('marketingEmails')}
                      type="checkbox"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={profileLoading}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {profileLoading ? 'Saving...' : 'Save Preferences'}
                </button>
              </div>
            </form>
          )}

          {/* Saved Destinations Tab */}
          {activeTab === 'destinations' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">Saved Destinations</h3>
                <p className="text-sm text-gray-500">
                  {savedDestinations.length} destination{savedDestinations.length !== 1 ? 's' : ''} saved
                </p>
              </div>

              {loadingDestinations ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                </div>
              ) : savedDestinations.length === 0 ? (
                <div className="text-center py-12">
                  <Heart className="mx-auto h-12 w-12 text-gray-400" />
                  <h3 className="mt-2 text-sm font-medium text-gray-900">No saved destinations</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Start exploring and save destinations you love!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {savedDestinations.map((destination) => (
                    <div
                      key={destination._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium text-gray-900">{destination.name}</h4>
                        <button
                          onClick={() => removeSavedDestination(destination._id)}
                          className="text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{destination.country}</p>
                      <p className="text-xs text-gray-500">
                        Saved on {new Date(destination.savedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Privacy & Security Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Profile Visibility</h4>
                      <p className="text-sm text-gray-500">Control who can see your profile information</p>
                    </div>
                    <select className="px-3 py-1 border border-gray-300 rounded-md text-sm">
                      <option>Public</option>
                      <option>Friends Only</option>
                      <option>Private</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Trip Sharing</h4>
                      <p className="text-sm text-gray-500">Allow others to see your public trips</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div>
                      <h4 className="font-medium text-gray-900">Activity Status</h4>
                      <p className="text-sm text-gray-500">Show when you're actively planning trips</p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security</h3>
                
                <div className="space-y-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Password</h4>
                    <p className="text-sm text-gray-500 mb-3">Last changed 3 months ago</p>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Change Password
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h4>
                    <p className="text-sm text-gray-500 mb-3">Add an extra layer of security to your account</p>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      Enable 2FA
                    </button>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Login Sessions</h4>
                    <p className="text-sm text-gray-500 mb-3">Manage your active login sessions</p>
                    <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                      View Sessions
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t border-gray-200 pt-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-red-900 mb-2">Danger Zone</h3>
                      <p className="text-sm text-red-700 mb-4">
                        Once you delete your account, there is no going back. Please be certain.
                      </p>
                      
                      {!showDeleteConfirm ? (
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete Account
                        </button>
                      ) : (
                        <div className="space-y-3">
                          <p className="text-sm text-red-700 font-medium">
                            Type "DELETE" to confirm account deletion:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => setDeleteConfirmText(e.target.value)}
                            className="w-full max-w-xs px-3 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                            placeholder="Type DELETE"
                          />
                          <div className="flex space-x-3">
                            <button
                              onClick={handleDeleteAccount}
                              disabled={deleteConfirmText !== 'DELETE'}
                              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              Delete Account
                            </button>
                            <button
                              onClick={() => {
                                setShowDeleteConfirm(false);
                                setDeleteConfirmText('');
                              }}
                              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile; 