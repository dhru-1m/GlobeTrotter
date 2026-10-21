const express = require('express');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');
const geminiService = require('../services/geminiService');

const router = express.Router();

// @route   GET /api/trips/public/:publicUrl
// @desc    Get public trip by public URL
// @access  Public
router.get('/public/:publicUrl', async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      publicUrl: req.params.publicUrl,
      isPublic: true 
    }).populate('destinations').populate('user', 'firstName lastName email username profilePicture');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip not found'
      });
    }

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Get public trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/trips/public/:publicUrl/itinerary
// @desc    Get detailed public itinerary with activities
// @access  Public
router.get('/public/:publicUrl/itinerary', async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      publicUrl: req.params.publicUrl,
      isPublic: true 
    }).populate('destinations').populate('user', 'firstName lastName email username profilePicture');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip not found'
      });
    }

    // Get all activities for this trip
    const activities = await Activity.find({ trip: trip._id }).sort({ date: 1, time: 1 });

    // Group activities by date
    const itinerary = {};
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    // Initialize each day
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      itinerary[dateStr] = {
        date: new Date(current),
        activities: []
      };
      current.setDate(current.getDate() + 1);
    }

    // Group activities by date
    activities.forEach(activity => {
      const dateStr = activity.date.toISOString().split('T')[0];
      if (itinerary[dateStr]) {
        itinerary[dateStr].activities.push(activity);
      }
    });

    res.status(200).json({
      success: true,
      data: {
        trip,
        itinerary,
        activities: activities.length,
        days: Object.keys(itinerary).length
      }
    });
  } catch (error) {
    console.error('Get public itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/trips/public/:publicUrl/copy
// @desc    Copy public trip to user's account
// @access  Private
router.post('/public/:publicUrl/copy', async (req, res) => {
  try {
    // Find the public trip
    const originalTrip = await Trip.findOne({ 
      publicUrl: req.params.publicUrl,
      isPublic: true 
    }).populate('destinations');

    if (!originalTrip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip not found'
      });
    }

    // Create a copy for the authenticated user
    const tripCopy = new Trip({
      user: req.user.id,
      name: `${originalTrip.name} (Copy)`,
      description: originalTrip.description,
      startDate: originalTrip.startDate,
      endDate: originalTrip.endDate,
      destinations: originalTrip.destinations,
      budget: originalTrip.budget,
      tags: originalTrip.tags,
      status: 'planning',
      isPublic: false // Default to private
    });

    await tripCopy.save();

    // Copy activities
    const originalActivities = await Activity.find({ trip: originalTrip._id });
    const activityCopies = originalActivities.map(activity => ({
      trip: tripCopy._id,
      name: activity.name,
      description: activity.description,
      type: activity.type,
      location: activity.location,
      date: activity.date,
      time: activity.time,
      duration: activity.duration,
      cost: activity.cost,
      rating: activity.rating,
      tags: activity.tags,
      notes: activity.notes
    }));

    if (activityCopies.length > 0) {
      await Activity.insertMany(activityCopies);
    }

    res.status(201).json({
      success: true,
      message: 'Trip copied successfully',
      data: {
        tripId: tripCopy._id,
        name: tripCopy.name
      }
    });
  } catch (error) {
    console.error('Copy public trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/trips
// @desc    Get all trips for user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const status = req.query.status;
    const search = req.query.search;

    const query = { user: req.user.id };

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const trips = await Trip.find(query)
      .sort({ startDate: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .populate('destinations', 'city country');

    const total = await Trip.countDocuments(query);

    res.status(200).json({
      success: true,
      count: trips.length,
      total,
      pagination: {
        page,
        limit,
        pages: Math.ceil(total / limit)
      },
      data: trips
    });
  } catch (error) {
    console.error('Get trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/trips/:id
// @desc    Get single trip
// @access  Private
router.get('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id)
      .populate('destinations')
      .populate('collaborators.user', 'name email avatar');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user owns the trip or is a collaborator
    if (trip.user.toString() !== req.user.id && 
        !trip.collaborators.some(c => c.user._id.toString() === req.user.id)) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this trip'
      });
    }

    // Get activities for this trip
    const activities = await Activity.find({ trip: trip._id })
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...trip.toObject(),
        activities
      }
    });
  } catch (error) {
    console.error('Get trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/trips
// @desc    Create new trip
// @access  Private
router.post('/', [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trip name is required and must be less than 100 characters'),
  body('startDate')
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .isISO8601()
    .withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

  const { name, description, startDate, endDate, coverPhoto, tags, destinations, activities } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    let trip = await Trip.create({
      user: req.user.id,
      name,
      description,
      startDate,
      endDate,
      coverPhoto,
      tags
    });

    // Optional destinations
    if (Array.isArray(destinations) && destinations.length > 0) {
      const cleaned = destinations
        .filter(d => d && d.city && d.country && d.arrivalDate && d.departureDate)
        .map((d, idx) => ({
          city: String(d.city).trim(),
            country: String(d.country).trim(),
            arrivalDate: d.arrivalDate,
            departureDate: d.departureDate,
            order: typeof d.order === 'number' ? d.order : idx
        }))
        .filter(d => {
          // within trip date range
          return new Date(d.arrivalDate) >= new Date(startDate) && new Date(d.departureDate) <= new Date(endDate);
        });
      if (cleaned.length) {
        trip.destinations = cleaned;
        await trip.save();
      }
    }

    // Optional activities
    let createdActivities = [];
    if (Array.isArray(activities) && activities.length > 0) {
      const Activity = require('../models/Activity');
      const primaryDestination = (trip.destinations && trip.destinations[0]) || null;
      const toInsert = activities
        .filter(a => a && a.title && a.date && a.startTime)
        .map(a => {
          const duration = typeof a.duration === 'number' ? a.duration : (a.endTime ? (() => { // derive duration
            const start = new Date(`2000-01-01T${a.startTime}:00`);
            const end = new Date(`2000-01-01T${a.endTime}:00`);
            return Math.max(0, Math.round((end - start)/60000));
          })() : 0);
          // compute endTime if not provided and duration present
          let endTime = a.endTime;
          if (!endTime && duration && duration > 0) {
            const start = new Date(`2000-01-01T${a.startTime}:00`);
            start.setMinutes(start.getMinutes() + duration);
            const hh = String(start.getHours()).padStart(2,'0');
            const mm = String(start.getMinutes()).padStart(2,'0');
            endTime = `${hh}:${mm}`;
          }
          return {
            trip: trip._id,
            destination: {
              city: a.destination?.city || primaryDestination?.city || 'Unknown',
              country: a.destination?.country || primaryDestination?.country || 'Unknown'
            },
            title: a.title,
            description: a.description || '',
            type: a.type || 'other',
            date: new Date(a.date),
            startTime: a.startTime,
            endTime: endTime || a.startTime,
            duration: duration || 0,
            location: { name: a.location?.name || a.title },
            cost: { amount: a.cost || 0, currency: a.currency || 'USD', perPerson: true },
            tags: Array.isArray(a.tags) ? a.tags : []
          };
        })
        .filter(a => a.date >= new Date(startDate) && a.date <= new Date(endDate));
      if (toInsert.length) {
        try {
          createdActivities = await Activity.insertMany(toInsert);
        } catch (actErr) {
          console.error('Activity bulk insert error:', actErr.message);
        }
      }
    }

    // Return trip plus limited activities list
    res.status(201).json({
      success: true,
      data: {
        ...trip.toObject(),
        activities: createdActivities
      }
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/trips/:id
// @desc    Update trip
// @access  Private
router.put('/:id', [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Trip name must be less than 100 characters'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    let trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this trip'
      });
    }

    const { name, description, startDate, endDate, coverPhoto, tags, status, isPublic } = req.body;

    // Validate dates if both are provided
    if (startDate && endDate && new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    const updateFields = {
      name,
      description,
      startDate,
      endDate,
      coverPhoto,
      tags,
      status,
      isPublic
    };

    // Remove undefined fields
    Object.keys(updateFields).forEach(key => 
      updateFields[key] === undefined && delete updateFields[key]
    );

    trip = await Trip.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Update trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/trips/:id
// @desc    Delete trip
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this trip'
      });
    }

    // Delete associated activities
    await Activity.deleteMany({ trip: trip._id });

    // Delete trip
    await Trip.deleteOne({ _id: trip._id });

    res.status(200).json({
      success: true,
      message: 'Trip deleted successfully'
    });
  } catch (error) {
    console.error('Delete trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/trips/public/:publicUrl
// @desc    Get public trip
// @access  Public
router.get('/public/:publicUrl', async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      publicUrl: req.params.publicUrl,
      isPublic: true 
    }).populate('destinations');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip not found'
      });
    }

    // Get activities for this trip
    const activities = await Activity.find({ trip: trip._id })
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        ...trip.toObject(),
        activities
      }
    });
  } catch (error) {
    console.error('Get public trip error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/trips/:id/collaborators
// @desc    Add collaborator to trip
// @access  Private
router.post('/:id/collaborators', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('role')
    .isIn(['viewer', 'editor', 'admin'])
    .withMessage('Role must be viewer, editor, or admin')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.id);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check ownership
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to add collaborators'
      });
    }

    // Find user by email
    const User = require('../models/User');
    const collaborator = await User.findOne({ email: req.body.email });

    if (!collaborator) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already a collaborator
    const existingCollaborator = trip.collaborators.find(
      c => c.user.toString() === collaborator._id.toString()
    );

    if (existingCollaborator) {
      return res.status(400).json({
        success: false,
        message: 'User is already a collaborator'
      });
    }

    trip.collaborators.push({
      user: collaborator._id,
      role: req.body.role
    });

    await trip.save();

    res.status(200).json({
      success: true,
      data: trip
    });
  } catch (error) {
    console.error('Add collaborator error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/trips/:id/generate-itinerary
// @desc    Generate AI-powered itinerary for a trip
// @access  Private
router.post('/:id/generate-itinerary', async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).populate('destinations');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const { interests, travelPace, budget } = req.body;

    // Calculate duration
    const duration = Math.ceil((trip.endDate - trip.startDate) / (1000 * 60 * 60 * 24));

    const preferences = {
      duration,
      budget: budget || trip.budget?.total || 1000,
      interests: interests || [],
      travelPace: travelPace || 'moderate'
    };

    const cities = trip.destinations || [];
    const aiItinerary = await geminiService.generateItinerary(cities, preferences);

    // Update trip with AI-generated budget if not set
    if (!trip.budget?.total && aiItinerary.totalEstimatedCost) {
      trip.budget.total = aiItinerary.totalEstimatedCost;
      await trip.save();
    }

    res.status(200).json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          name: trip.name,
          duration,
          cities: cities.length
        },
        aiItinerary,
        preferences
      }
    });
  } catch (error) {
    console.error('Generate itinerary error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate itinerary'
    });
  }
});

// @route   POST /api/trips/:id/budget-breakdown
// @desc    Generate AI-powered budget breakdown
// @access  Private
router.post('/:id/budget-breakdown', async (req, res) => {
  try {
    const trip = await Trip.findOne({ 
      _id: req.params.id, 
      user: req.user.id 
    }).populate('destinations');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    const { travelStyle, groupSize } = req.body;

    // Calculate duration
    const duration = Math.ceil((trip.endDate - trip.startDate) / (1000 * 60 * 60 * 24));

    const tripDetails = {
      cities: trip.destinations || [],
      duration,
      travelStyle: travelStyle || 'mid-range',
      groupSize: groupSize || 1
    };

    const budgetBreakdown = await geminiService.generateBudgetBreakdown(tripDetails);

    // Update trip budget if AI suggests different amount
    if (budgetBreakdown.grandTotal && (!trip.budget?.total || trip.budget.total === 0)) {
      trip.budget.total = budgetBreakdown.grandTotal;
      await trip.save();
    }

    res.status(200).json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          name: trip.name,
          duration,
          currentBudget: trip.budget?.total || 0
        },
        budgetBreakdown
      }
    });
  } catch (error) {
    console.error('Budget breakdown error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate budget breakdown'
    });
  }
});

// @route   POST /api/trips/:tripId/make-public
// @desc    Make a trip public and generate sharing URL
// @access  Private
router.post('/:tripId/make-public', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user owns the trip
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    // Generate public URL if not exists
    if (!trip.publicUrl) {
      const crypto = require('crypto');
      trip.publicUrl = crypto.randomBytes(16).toString('hex');
    }

    trip.isPublic = true;
    await trip.save();

    res.status(200).json({
      success: true,
      data: {
        publicUrl: trip.publicUrl,
        shareUrl: `${req.protocol}://${req.get('host')}/public-itinerary/${trip.publicUrl}`
      },
      message: 'Trip is now public and ready to share!'
    });
  } catch (error) {
    console.error('Make trip public error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make trip public'
    });
  }
});

// @route   POST /api/trips/:tripId/make-private
// @desc    Make a public trip private
// @access  Private
router.post('/:tripId/make-private', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check if user owns the trip
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    trip.isPublic = false;
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Trip is now private'
    });
  } catch (error) {
    console.error('Make trip private error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to make trip private'
    });
  }
});

module.exports = router; 