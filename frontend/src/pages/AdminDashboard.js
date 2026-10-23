import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { getCurrentUser } from '../store/slices/authSlice';
import { toast } from 'react-hot-toast';
import { adminAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { 
  Users, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  DollarSign, 
  Globe, 
  Download,
  BarChart3,
  PieChart,
  Activity,
  Plane,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
  Shield,
  Database
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector(state => state.auth);
  const [loading, setLoading] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [pwError, setPwError] = useState('');
  const [stats, setStats] = useState(null);
  const [popularCities, setPopularCities] = useState([]);
  const [popularActivities, setPopularActivities] = useState([]);
  const [budgetDistribution, setBudgetDistribution] = useState([]);
  const [monthlyTrends, setMonthlyTrends] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [
        statsData,
        citiesData,
        activitiesData,
        budgetData,
        trendsData,
        activityData
      ] = await Promise.all([
        adminAPI.getStats(),
        adminAPI.getPopularCities(),
        adminAPI.getPopularActivities(),
        adminAPI.getBudgetDistribution(),
        adminAPI.getMonthlyTrends(),
        adminAPI.getRecentActivity()
      ]);

      setStats(statsData.data);
      setPopularCities(citiesData.data);
      setPopularActivities(activitiesData.data);
      setBudgetDistribution(budgetData.data);
      setMonthlyTrends(trendsData.data);
      setRecentActivity(activityData.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (type) => {
    try {
      toast.loading('Exporting data...');
      const response = await adminAPI.exportCSV(type);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success(`${type} data exported successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error('Error exporting data');
      console.error('Error exporting data:', error);
    }
  };

  const goToDashboard = () => {
    navigate('/dashboard');
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Please log in first.</p>
      </div>
    );
  }

  // Redirect non-admin users away from /admin to /dashboard
  if (user && user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="text-gray-600 mt-4">Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Data Available</h2>
          <p className="text-gray-600">Unable to load dashboard statistics.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-600 rounded-md flex items-center justify-center shadow-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
                <p className="text-gray-600">Platform analytics and user management</p>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => handleExport('users')}
                className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Users
              </button>
              <button
                onClick={() => handleExport('trips')}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Trips
              </button>
              <button
                onClick={goToDashboard}
                className="flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 shadow-sm"
              >
                <Plane className="h-4 w-4 mr-2" />
                Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Key Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.users.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-green-600 text-sm">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  +{stats.users.newThisMonth}
                </div>
                <p className="text-xs text-gray-500">this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-green-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Activity className="h-6 w-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Users</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.users.active.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-600">
                  {((stats.users.active / stats.users.total) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-gray-500">of total</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-purple-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Trips</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.trips.total.toLocaleString()}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="flex items-center text-blue-600 text-sm">
                  <Calendar className="h-4 w-4 mr-1" />
                  {stats.trips.thisMonth}
                </div>
                <p className="text-xs text-gray-500">this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-md shadow-sm p-6 border-l-4 border-orange-500 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-orange-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Growth Rate</p>
                  <p className={`text-2xl font-bold ${stats.trips.monthOverMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {stats.trips.monthOverMonthChange >= 0 ? '+' : ''}{stats.trips.monthOverMonthChange}%
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className={`flex items-center text-sm ${stats.trips.monthOverMonthChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {stats.trips.monthOverMonthChange >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                  MoM
                </div>
                <p className="text-xs text-gray-500">vs last month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts and Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Trip Status Distribution */}
          <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <PieChart className="h-5 w-5 mr-2 text-blue-600" />
              Trip Status Distribution
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Planning</span>
                  <span className="text-sm font-medium text-gray-900">{stats.trips.upcoming.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(stats.trips.upcoming / stats.trips.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{((stats.trips.upcoming / stats.trips.total) * 100).toFixed(1)}%</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Active</span>
                  <span className="text-sm font-medium text-gray-900">{stats.trips.ongoing.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(stats.trips.ongoing / stats.trips.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{((stats.trips.ongoing / stats.trips.total) * 100).toFixed(1)}%</p>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Completed</span>
                  <span className="text-sm font-medium text-gray-900">{stats.trips.completed.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${(stats.trips.completed / stats.trips.total) * 100}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">{((stats.trips.completed / stats.trips.total) * 100).toFixed(1)}%</p>
              </div>
            </div>
          </div>

          {/* Popular Cities */}
          <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Globe className="h-5 w-5 mr-2 text-green-600" />
              Popular Destinations
            </h3>
            <div className="space-y-3">
              {popularCities.slice(0, 6).map((city, index) => (
                <div key={`${city._id.city}-${city._id.country}`} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                      {index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{city._id.city}</p>
                      <p className="text-xs text-gray-500">{city._id.country}</p>
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                    {city.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Popular Activities */}
          <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Activity className="h-5 w-5 mr-2 text-purple-600" />
              Popular Activities
            </h3>
            <div className="space-y-3">
              {popularActivities.slice(0, 6).map((activity, index) => (
                <div key={activity._id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center text-white text-xs font-bold mr-3">
                      {index + 1}
                    </div>
                    <span className="text-sm font-medium text-gray-900">{activity._id}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-full">
                    {activity.count.toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Budget Distribution and Monthly Trends */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Budget Distribution */}
          <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Budget Distribution
            </h3>
            <div className="space-y-4">
              {budgetDistribution.map((budget, index) => (
                <div key={budget._id} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{budget._id}</span>
                    <div className="text-right">
                      <span className="text-sm font-bold text-gray-900">{budget.count}</span>
                      <span className="text-xs text-gray-500 ml-2">({budget.percentage}%)</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        index === 0 ? 'bg-green-500' : 
                        index === 1 ? 'bg-blue-500' : 'bg-purple-500'
                      }`}
                      style={{ width: `${budget.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Monthly Trends */}
          <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-blue-600" />
              Monthly Trip Trends
            </h3>
            <div className="space-y-3">
              {monthlyTrends.slice(-6).map((trend, index) => (
                <div key={trend.month} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors">
                  <span className="text-sm font-medium text-gray-700">{trend.month}</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-bold text-gray-900">{trend.count}</span>
                    <div className={`flex items-center text-xs px-2 py-1 rounded-full ${
                      trend.growth >= 10 ? 'bg-green-100 text-green-700' :
                      trend.growth >= 5 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {trend.growth >= 0 ? <ArrowUpRight className="h-3 w-3 mr-1" /> : <ArrowDownRight className="h-3 w-3 mr-1" />}
                      {trend.growth}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Database className="h-5 w-5 mr-2 text-blue-600" />
            Recent Activity
          </h3>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors">
                <div className="flex items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                    activity.type === 'new_user' ? 'bg-blue-100 text-blue-600' :
                    activity.type === 'new_trip' ? 'bg-green-100 text-green-600' :
                    activity.type === 'trip_completed' ? 'bg-purple-100 text-purple-600' :
                    'bg-orange-100 text-orange-600'
                  }`}>
                    {activity.type === 'new_user' ? <Users className="h-4 w-4" /> :
                     activity.type === 'new_trip' ? <MapPin className="h-4 w-4" /> :
                     activity.type === 'trip_completed' ? <Calendar className="h-4 w-4" /> :
                     <Activity className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.user}</p>
                    <p className="text-xs text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Export Section */}
        <div className="bg-white rounded-md shadow-sm p-6 hover:shadow-md transition-shadow">
          <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
            <Download className="h-5 w-5 mr-2 text-blue-600" />
            Data Export & Management
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleExport('users')}
              className="flex items-center justify-center px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Users className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Export Users</div>
                <div className="text-xs opacity-90">CSV format</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('trips')}
              className="flex items-center justify-center px-6 py-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <MapPin className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Export Trips</div>
                <div className="text-xs opacity-90">CSV format</div>
              </div>
            </button>
            <button
              onClick={() => handleExport('activities')}
              className="flex items-center justify-center px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors duration-200 shadow-sm hover:shadow-md"
            >
              <Activity className="h-5 w-5 mr-3" />
              <div className="text-left">
                <div className="font-medium">Export Activities</div>
                <div className="text-xs opacity-90">CSV format</div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
