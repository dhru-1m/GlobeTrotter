const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');

// Middleware to check if user is admin
const checkAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// @route   POST /api/admin/promote
// @desc    Promote the authenticated user to admin using a shared password gate
// @access  Private
router.post('/promote', auth, async (req, res) => {
  try {
    const { password } = req.body || {};
    const expected = process.env.ADMIN_GATE_PASSWORD || 'odoo@admin';

    if (!password || password !== expected) {
      return res.status(401).json({ success: false, message: 'Invalid admin password' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    return res.json({
      success: true,
      message: 'User promoted to admin',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Error promoting user to admin:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// @route   GET /api/admin/stats
// @desc    Get platform statistics
// @access  Private (Admin only)
router.get('/stats', auth, checkAdmin, async (req, res) => {
  try {
    // Get current date and first day of current month
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // User statistics
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ 
      lastLogin: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } 
    });
    const newUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });
    const newUsersLastMonth = await User.countDocuments({
      createdAt: { 
        $gte: firstDayOfLastMonth,
        $lt: firstDayOfCurrentMonth
      }
    });

    // Trip statistics
    const totalTrips = await Trip.countDocuments();
    const tripsThisMonth = await Trip.countDocuments({
      createdAt: { $gte: firstDayOfMonth }
    });
    const tripsLastMonth = await Trip.countDocuments({
      createdAt: { 
        $gte: firstDayOfLastMonth,
        $lt: firstDayOfCurrentMonth
      }
    });

  // Trip status counts (map to existing schema values: planning, active, completed)
  const upcomingTrips = await Trip.countDocuments({ status: 'planning' });
  const ongoingTrips = await Trip.countDocuments({ status: 'active' });
    const completedTrips = await Trip.countDocuments({ status: 'completed' });

    // Calculate month-over-month change
    const monthOverMonthChange = tripsLastMonth > 0 
      ? ((tripsThisMonth - tripsLastMonth) / tripsLastMonth * 100)
      : 0;

    // Activity statistics
    const totalActivities = await Activity.countDocuments();
    const avgActivitiesPerTrip = totalTrips > 0 ? (totalActivities / totalTrips) : 0;

    const stats = {
      users: {
        total: totalUsers,
        active: activeUsers,
        newThisMonth: newUsersThisMonth,
        newThisWeek: await User.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        })
      },
      trips: {
        total: totalTrips,
        thisMonth: tripsThisMonth,
        upcoming: upcomingTrips,
        ongoing: ongoingTrips,
        completed: completedTrips,
        monthOverMonthChange: Math.round(monthOverMonthChange * 100) / 100
      },
      activities: {
        total: totalActivities,
        avgPerTrip: Math.round(avgActivitiesPerTrip * 100) / 100
      }
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/popular-cities
// @desc    Get popular cities/destinations
// @access  Private (Admin only)
router.get('/popular-cities', auth, checkAdmin, async (req, res) => {
  try {
    const popularCities = await Trip.aggregate([
      { $match: { destination: { $exists: true, $ne: null } } },
      { $group: { 
          _id: { 
            city: '$destination.city',
            country: '$destination.country'
          }, 
          count: { $sum: 1 } 
        } 
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(popularCities);
  } catch (error) {
    console.error('Error fetching popular cities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/popular-activities
// @desc    Get popular activities
// @access  Private (Admin only)
router.get('/popular-activities', auth, checkAdmin, async (req, res) => {
  try {
    const popularActivities = await Activity.aggregate([
      { $group: { _id: '$type', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    res.json(popularActivities);
  } catch (error) {
    console.error('Error fetching popular activities:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/budget-distribution
// @desc    Get budget distribution data
// @access  Private (Admin only)
router.get('/budget-distribution', auth, checkAdmin, async (req, res) => {
  try {
    const budgetDistribution = await Trip.aggregate([
      { $match: { budget: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: {
            $switch: {
              branches: [
                { case: { $lt: ['$budget', 1000] }, then: 'Budget (< $1000)' },
                { case: { $and: [{ $gte: ['$budget', 1000] }, { $lt: ['$budget', 3000] }] }, then: 'Mid-range ($1000-3000)' },
                { case: { $gte: ['$budget', 3000] }, then: 'Luxury (> $3000)' }
              ],
              default: 'Unknown'
            }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Calculate percentages
    const total = budgetDistribution.reduce((sum, item) => sum + item.count, 0);
    const distributionWithPercentages = budgetDistribution.map(item => ({
      ...item,
      percentage: Math.round((item.count / total) * 100)
    }));

    res.json(distributionWithPercentages);
  } catch (error) {
    console.error('Error fetching budget distribution:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/monthly-trends
// @desc    Get monthly trip creation trends
// @access  Private (Admin only)
router.get('/monthly-trends', auth, checkAdmin, async (req, res) => {
  try {
    const monthlyTrends = await Trip.aggregate([
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]);

    // Format the data
    const formattedTrends = monthlyTrends.map((trend, index) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                         'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = `${monthNames[trend._id.month - 1]} ${trend._id.year}`;
      
      // Calculate growth (simplified - comparing with previous month)
      const prevCount = index > 0 ? monthlyTrends[index - 1].count : trend.count;
      const growth = prevCount > 0 ? Math.round(((trend.count - prevCount) / prevCount) * 100) : 0;
      
      return {
        month,
        count: trend.count,
        growth
      };
    });

    res.json(formattedTrends);
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/recent-activity
// @desc    Get recent platform activity
// @access  Private (Admin only)
router.get('/recent-activity', auth, checkAdmin, async (req, res) => {
  try {
    // Get recent user registrations
    const recentUsers = await User.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name createdAt');

    // Get recent trips
    const recentTrips = await Trip.find({})
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(5)
      .select('title user createdAt destination');

    // Combine and format activities
    const activities = [];

    recentUsers.forEach(user => {
      activities.push({
        type: 'new_user',
        user: user.name,
        action: 'Registered',
        time: getRelativeTime(user.createdAt)
      });
    });

    recentTrips.forEach(trip => {
      activities.push({
        type: 'new_trip',
        user: trip.user ? trip.user.name : 'Unknown User',
        action: `Created trip to ${trip.destination?.city || trip.title}`,
        time: getRelativeTime(trip.createdAt)
      });
    });

    // Sort by most recent and limit to 10
    activities.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    
    res.json(activities.slice(0, 10));
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/admin/export/:type
// @desc    Export data as CSV
// @access  Private (Admin only)
router.get('/export/:type', auth, checkAdmin, async (req, res) => {
  try {
    const { type } = req.params;
    let data = [];
    let headers = [];
    const fmt = (d) => d ? new Date(d).toLocaleDateString('en-GB') : ''; // DD/MM/YYYY

    switch (type) {
      case 'users':
        data = await User.find({}).select('name email createdAt lastLogin role');
        headers = ['Name', 'Email', 'Created At', 'Last Login', 'Role'];
        break;
      
      case 'trips':
        data = await Trip.find({})
          .populate('user', 'name email')
          .select('name destinations startDate endDate budget status createdAt user');
        headers = ['Title', 'User', 'Destination', 'Start Date', 'End Date', 'Budget', 'Status', 'Created At'];
        break;
      
      case 'activities':
        data = await Activity.find({})
          .populate('trip', 'title')
          .select('name type duration cost trip createdAt');
        headers = ['Name', 'Type', 'Duration', 'Cost', 'Trip', 'Created At'];
        break;
      
      default:
        return res.status(400).json({ message: 'Invalid export type' });
    }

    // Convert to CSV format
    let csv = headers.join(',') + '\n';
    
    data.forEach(item => {
      let row = [];
      switch (type) {
        case 'users':
          row = [
            item.name || '',
            item.email || '',
            item.createdAt ? item.createdAt.toISOString().split('T')[0] : '',
            item.lastLogin ? item.lastLogin.toISOString().split('T')[0] : 'Never',
            item.role || 'user'
          ];
          break;
        
        case 'trips': {
          const firstDest = Array.isArray(item.destinations) && item.destinations.length > 0
            ? item.destinations[0]
            : null;
          const destStr = firstDest ? `${firstDest.city}, ${firstDest.country}` : '';
          const budgetStr = item.budget ? JSON.stringify(item.budget) : '';
          row = [
            item.name || '',
            item.user ? item.user.name : '',
            destStr,
            fmt(item.startDate).replace(/\//g,'-'),
            fmt(item.endDate).replace(/\//g,'-'),
            budgetStr,
            item.status || '',
            fmt(item.createdAt).replace(/\//g,'-')
          ];
          break;
        }
        
        case 'activities':
          row = [
            item.name || '',
            item.type || '',
            item.duration || '',
            item.cost || '',
            item.trip ? item.trip.title : '',
            item.createdAt ? item.createdAt.toISOString().split('T')[0] : ''
          ];
          break;
      }
      
      // Escape commas and quotes in CSV data
      const escapedRow = row.map(field => {
        const str = String(field || '');
        if (str.includes(',') || str.includes('"') || str.includes('\n')) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      });
      
      csv += escapedRow.join(',') + '\n';
    });

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=${type}_${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper function to get relative time
function getRelativeTime(date) {
  const now = new Date();
  const diffInMs = now - new Date(date);
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  
  return new Date(date).toLocaleDateString();
}

module.exports = router;
