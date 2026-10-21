const express = require('express');
const { body, validationResult } = require('express-validator');
const Activity = require('../models/Activity');
const Trip = require('../models/Trip');

const router = express.Router();

// @route   GET /api/activities
// @desc    Get activities for a trip
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { tripId, date, type, destination } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const query = {};

    if (tripId) {
      query.trip = tripId;
    }

    if (date) {
      query.date = new Date(date);
    }

    if (type) {
      query.type = type;
    }

    if (destination) {
      query['destination.city'] = { $regex: destination, $options: 'i' };
    }

    const activities = await Activity.find(query)
      .sort({ date: 1, startTime: 1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Activity.countDocuments(query);

    res.status(200).json({
      success: true,
      count: activities.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: activities
    });
  } catch (error) {
    console.error('Get activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/activities/:id
// @desc    Get single activity
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Get activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/activities
// @desc    Create new activity
// @access  Private
router.post('/', [
  body('trip')
    .isMongoId()
    .withMessage('Valid trip ID is required'),
  body('title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Activity title is required and must be less than 100 characters'),
  body('destination.city')
    .trim()
    .notEmpty()
    .withMessage('City is required'),
  body('destination.country')
    .trim()
    .notEmpty()
    .withMessage('Country is required'),
  body('date')
    .isISO8601()
    .withMessage('Date must be a valid date'),
  body('startTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format'),
  body('location.name')
    .trim()
    .notEmpty()
    .withMessage('Location name is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.body.trip);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id && 
        !trip.collaborators.some(c => c.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add activities to this trip'
      });
    }

    const activity = await Activity.create({
      ...req.body,
      trip: trip._id
    });

    res.status(201).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Create activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/activities/:id
// @desc    Update activity
// @access  Private
router.put('/:id', [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Activity title must be less than 100 characters'),
  body('startTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  body('endTime')
    .optional()
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check authorization through trip
    const trip = await Trip.findById(activity.trip);
    if (trip.user.toString() !== req.user.id && 
        !trip.collaborators.some(c => c.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this activity'
      });
    }

    activity = await Activity.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Update activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/activities/:id
// @desc    Delete activity
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const activity = await Activity.findById(req.params.id);

    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Check authorization through trip
    const trip = await Trip.findById(activity.trip);
    if (trip.user.toString() !== req.user.id && 
        !trip.collaborators.some(c => c.user.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this activity'
      });
    }

    await activity.remove();

    res.status(200).json({
      success: true,
      message: 'Activity deleted successfully'
    });
  } catch (error) {
    console.error('Delete activity error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/activities/types
// @desc    Get activity types
// @access  Public
router.get('/types', (req, res) => {
  const types = [
    'sightseeing',
    'food',
    'adventure',
    'culture',
    'shopping',
    'relaxation',
    'transport',
    'other'
  ];

  res.status(200).json({
    success: true,
    data: types
  });
});

// @route   POST /api/activities/bulk
// @desc    Create multiple activities
// @access  Private
router.post('/bulk', [
  body('activities')
    .isArray()
    .withMessage('Activities must be an array'),
  body('activities.*.title')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Activity title is required'),
  body('activities.*.trip')
    .isMongoId()
    .withMessage('Valid trip ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { activities } = req.body;

    // Validate all trips belong to user
    const tripIds = [...new Set(activities.map(a => a.trip))];
    const trips = await Trip.find({ _id: { $in: tripIds } });

    const unauthorizedTrips = trips.filter(
      trip => trip.user.toString() !== req.user.id && 
              !trip.collaborators.some(c => c.user.toString() === req.user.id)
    );

    if (unauthorizedTrips.length > 0) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add activities to some trips'
      });
    }

    const createdActivities = await Activity.insertMany(activities);

    res.status(201).json({
      success: true,
      count: createdActivities.length,
      data: createdActivities
    });
  } catch (error) {
    console.error('Bulk create activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 