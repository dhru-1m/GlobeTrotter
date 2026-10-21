const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Trip = require('../models/Trip');

const router = express.Router();

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        savedDestinations: user.savedDestinations,
        emailVerified: user.emailVerified,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('bio')
    .optional()
    .trim()
    .isLength({ max: 200 })
    .withMessage('Bio cannot be more than 200 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, bio, avatar, preferences } = req.body;

    const updateFields = {
      name,
      bio,
      avatar,
      preferences
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => 
      updateFields[key] === undefined && delete updateFields[key]
    );

    const user = await User.findByIdAndUpdate(req.user.id, updateFields, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        bio: user.bio,
        preferences: user.preferences,
        savedDestinations: user.savedDestinations
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/saved-destinations
// @desc    Get user's saved destinations
// @access  Private
router.get('/saved-destinations', async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('savedDestinations');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user.savedDestinations.map(dest => ({
        _id: dest._id,
        name: dest.city,
        country: dest.country,
        savedAt: dest.addedAt
      }))
    });
  } catch (error) {
    console.error('Get saved destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/users/saved-destinations
// @desc    Add saved destination
// @access  Private
router.post('/saved-destinations', [
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City name is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const user = await User.findById(req.user.id);
    const { city, country } = req.body;

    // Check if destination already exists
    const existingDestination = user.savedDestinations.find(
      dest => dest.city.toLowerCase() === city.toLowerCase() && 
              dest.country.toLowerCase() === country.toLowerCase()
    );

    if (existingDestination) {
      return res.status(400).json({
        success: false,
        message: 'Destination already saved'
      });
    }

    user.savedDestinations.push({
      city,
      country
    });

    await user.save();

    res.status(201).json({
      success: true,
      data: user.savedDestinations[user.savedDestinations.length - 1]
    });
  } catch (error) {
    console.error('Add saved destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/saved-destinations/:destinationId
// @desc    Remove saved destination
// @access  Private
router.delete('/saved-destinations/:destinationId', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const destination = user.savedDestinations.id(req.params.destinationId);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Saved destination not found'
      });
    }

    destination.remove();
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Saved destination removed successfully'
    });
  } catch (error) {
    console.error('Remove saved destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get trip statistics
    const totalTrips = await Trip.countDocuments({ user: userId });
    const completedTrips = await Trip.countDocuments({ 
      user: userId, 
      status: 'completed' 
    });
    const upcomingTrips = await Trip.countDocuments({ 
      user: userId, 
      status: 'planning' 
    });

    // Get recent trips
    const recentTrips = await Trip.find({ user: userId })
      .sort({ startDate: -1 })
      .limit(5)
      .select('name startDate endDate status destinations');

    // Get total destinations visited
    const allTrips = await Trip.find({ user: userId });
    const totalDestinations = allTrips.reduce((acc, trip) => {
      return acc + trip.destinations.length;
    }, 0);

    // Get favorite destinations
    const user = await User.findById(userId);
    const savedDestinationsCount = user.savedDestinations.length;

    res.status(200).json({
      success: true,
      data: {
        totalTrips,
        completedTrips,
        upcomingTrips,
        totalDestinations,
        savedDestinationsCount,
        recentTrips
      }
    });
  } catch (error) {
    console.error('Get user stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/users/account
// @desc    Delete user account
// @access  Private
router.delete('/account', async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete all user's trips and activities
    const trips = await Trip.find({ user: user._id });
    const tripIds = trips.map(trip => trip._id);

    // Delete activities
    const Activity = require('../models/Activity');
    await Activity.deleteMany({ trip: { $in: tripIds } });

    // Delete trips
    await Trip.deleteMany({ user: user._id });

    // Delete user
    await user.remove();

    res.status(200).json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Delete account error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 