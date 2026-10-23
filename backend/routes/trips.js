const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');
const geminiService = require('../services/geminiService');

const router = express.Router();

// Helper to find a public trip by publicUrl or _id
const findPublicTrip = (identifier) => {
  const query = { isPublic: true };
  if (mongoose.isValidObjectId(identifier)) {
    query.$or = [{ publicUrl: identifier }, { _id: identifier }];
  } else {
    query.publicUrl = identifier;
  }
  return Trip.findOne(query);
};

// @route   GET /api/trips/public
// @desc    Get all public trips
// @access  Public
router.get('/public', async (req, res) => {
  try {
    const trips = await Trip.find({ isPublic: true })
      .populate('user', 'firstName lastName email username profilePicture')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: trips.length,
      data: trips
    });
  } catch (error) {
    console.error('Get public trips error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/trips/public/:publicUrl
// @desc    Get public trip by public URL or ID
// @access  Public
router.get('/public/:publicUrl', async (req, res) => {
  try {
    const trip = await findPublicTrip(req.params.publicUrl)
      .populate('user', 'firstName lastName email username profilePicture');

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
    const trip = await findPublicTrip(req.params.publicUrl)
      .populate('user', 'firstName lastName email username profilePicture');

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Public trip not found'
      });
    }

    // Get all activities for this trip
    const activities = await Activity.find({ trip: trip._id }).sort({ date: 1, startTime: 1, time: 1 });

    // Group activities by date
    const itinerary = {};
    const startDate = new Date(trip.startDate);
    const endDate = new Date(trip.endDate);
    
    // Initialize each day
    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const current = new Date(startDate);
      while (current <= endDate) {
        const dateStr = current.toISOString().split('T')[0];
        itinerary[dateStr] = {
          date: new Date(current),
          activities: []
        };
        current.setDate(current.getDate() + 1);
      }
    }

    // Group activities by date
    activities.forEach(activity => {
      if (activity.date) {
        const dateStr = new Date(activity.date).toISOString().split('T')[0];
        if (!itinerary[dateStr]) {
          itinerary[dateStr] = {
            date: new Date(activity.date),
            activities: []
          };
        }
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
    const originalTrip = await findPublicTrip(req.params.publicUrl);

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
      title: activity.title || activity.name,
      description: activity.description,
      type: activity.type || 'sightseeing',
      destination: activity.destination || (originalTrip.destinations?.[0] ? {
        city: originalTrip.destinations[0].city,
        country: originalTrip.destinations[0].country
      } : { city: 'Destination', country: 'Country' }),
      location: activity.location,
      date: activity.date,
      startTime: activity.startTime || activity.time || '09:00',
      endTime: activity.endTime || '11:00',
      duration: activity.duration || 120,
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
        trip: tripCopy
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
        message: errors.array().map(e => e.msg).join(', '),
        errors: errors.array()
      });
    }

    const { name, description, startDate, endDate, coverPhoto, tags, destinations, activities, budget } = req.body;

    // Validate dates
    if (new Date(startDate) >= new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after start date'
      });
    }

    // Budget handling
    let tripBudget = {
      total: 5000,
      currency: 'USD',
      breakdown: {
        accommodation: 2000,
        transportation: 1000,
        activities: 1000,
        food: 750,
        other: 250
      }
    };
    if (typeof budget === 'number' && budget > 0) {
      tripBudget = {
        total: budget,
        currency: 'USD',
        breakdown: {
          accommodation: Math.round(budget * 0.4),
          transportation: Math.round(budget * 0.2),
          activities: Math.round(budget * 0.2),
          food: Math.round(budget * 0.15),
          other: Math.round(budget * 0.05)
        }
      };
    } else if (budget && typeof budget === 'object' && budget.total) {
      const bTotal = Number(budget.total) || 5000;
      tripBudget = {
        total: bTotal,
        currency: budget.currency || 'USD',
        breakdown: budget.breakdown || {
          accommodation: Math.round(bTotal * 0.4),
          transportation: Math.round(bTotal * 0.2),
          activities: Math.round(bTotal * 0.2),
          food: Math.round(bTotal * 0.15),
          other: Math.round(bTotal * 0.05)
        }
      };
    }

    // Destinations sanitization
    let cleanedDestinations = [];
    if (Array.isArray(destinations) && destinations.length > 0) {
      cleanedDestinations = destinations
        .filter(d => d && (d.city || d.name))
        .map((d, idx) => ({
          city: String(d.city || d.name).trim(),
          country: String(d.country || 'Unknown').trim(),
          arrivalDate: d.arrivalDate ? new Date(d.arrivalDate) : new Date(startDate),
          departureDate: d.departureDate ? new Date(d.departureDate) : new Date(endDate),
          order: typeof d.order === 'number' ? d.order : idx + 1
        }));
    }

    let trip = new Trip({
      user: req.user.id,
      name: name.trim(),
      description: description || '',
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      coverPhoto: coverPhoto || '',
      tags: Array.isArray(tags) ? tags : [],
      budget: tripBudget,
      destinations: cleanedDestinations
    });

    await trip.save();

    // Activities handling
    let createdActivities = [];
    if (Array.isArray(activities) && activities.length > 0) {
      const primaryDestination = (trip.destinations && trip.destinations[0]) || { city: 'Destination', country: 'Unknown' };
      const validTypes = ['sightseeing', 'food', 'adventure', 'culture', 'shopping', 'relaxation', 'transport', 'other'];

      const toInsert = activities
        .filter(a => a && a.title)
        .map((a, idx) => {
          let duration = typeof a.duration === 'number' && a.duration > 0 ? a.duration : 60;
          let startTime = '09:00';
          if (a.startTime && /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(a.startTime)) {
            startTime = a.startTime;
          }

          // Ensure endTime > startTime
          let endTime = a.endTime;
          const [sh, sm] = startTime.split(':').map(Number);
          const totalEndMin = sh * 60 + sm + duration;
          const eh = Math.min(23, Math.floor(totalEndMin / 60));
          const em = totalEndMin % 60;
          const calcEnd = `${String(eh).padStart(2, '0')}:${String(em).padStart(2, '0')}`;

          if (!endTime || !/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(endTime) || endTime <= startTime) {
            endTime = calcEnd > startTime ? calcEnd : '23:59';
          }

          let actDate = a.date ? new Date(a.date) : new Date(startDate);
          if (isNaN(actDate.getTime())) actDate = new Date(startDate);

          const actType = validTypes.includes(a.type) ? a.type : 'sightseeing';
          const costVal = typeof a.cost === 'number' ? a.cost : (Number(a.cost?.amount) || 0);

          return {
            trip: trip._id,
            destination: {
              city: a.destination?.city || primaryDestination.city,
              country: a.destination?.country || primaryDestination.country
            },
            title: a.title,
            description: a.description || '',
            type: actType,
            date: actDate,
            startTime,
            endTime,
            duration,
            dayOrder: typeof a.dayOrder === 'number' ? a.dayOrder : idx + 1,
            location: { name: a.location?.name || a.title },
            cost: { amount: costVal, currency: a.currency || 'USD', perPerson: true },
            tags: Array.isArray(a.tags) ? a.tags : ['planned']
          };
        });

      if (toInsert.length > 0) {
        try {
          createdActivities = await Activity.insertMany(toInsert);
        } catch (actErr) {
          console.error('Activity bulk insert error:', actErr.message);
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Trip created successfully',
      data: {
        ...trip.toObject(),
        activities: createdActivities
      }
    });
  } catch (error) {
    console.error('Create trip error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Server error'
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

    const { name, description, startDate, endDate, coverPhoto, tags, status, isPublic, budget, destinations } = req.body;

    // Validate dates if both are provided
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        success: false,
        message: 'End date must be after or equal to start date'
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

    if (destinations !== undefined) {
      updateFields.destinations = destinations;
    }

    if (budget !== undefined) {
      if (typeof budget === 'number') {
        updateFields.budget = {
          total: budget,
          currency: trip.budget?.currency || 'USD'
        };
      } else if (typeof budget === 'object') {
        updateFields.budget = {
          ...(trip.budget?.toObject ? trip.budget.toObject() : trip.budget || {}),
          ...budget
        };
      }
    }

    // Generate publicUrl if made public and none exists
    if (isPublic && !trip.publicUrl) {
      const crypto = require('crypto');
      updateFields.publicUrl = crypto.randomBytes(16).toString('hex');
    }

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