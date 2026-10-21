const express = require('express');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');

const router = express.Router();

// @route   GET /api/itinerary/:tripId
// @desc    Get itinerary for a trip
// @access  Private
router.get('/:tripId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

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
        message: 'Not authorized to access this trip'
      });
    }

    // Get activities grouped by date
    const activities = await Activity.find({ trip: trip._id })
      .sort({ date: 1, startTime: 1 });

    // Group activities by date
    const itineraryByDate = activities.reduce((acc, activity) => {
      const date = activity.date.toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(activity);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      data: {
        trip: {
          id: trip._id,
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          destinations: trip.destinations
        },
        itinerary: itineraryByDate,
        activities
      }
    });
  } catch (error) {
    console.error('Get itinerary error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/itinerary/:tripId/destinations
// @desc    Add destination to trip
// @access  Private
router.post('/:tripId/destinations', [
  body('city')
    .trim()
    .notEmpty()
    .withMessage('City name is required'),
  body('country')
    .trim()
    .notEmpty()
    .withMessage('Country name is required'),
  body('arrivalDate')
    .isISO8601()
    .withMessage('Arrival date must be a valid date'),
  body('departureDate')
    .isISO8601()
    .withMessage('Departure date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const { city, country, arrivalDate, departureDate } = req.body;

    // Validate dates
    if (new Date(arrivalDate) >= new Date(departureDate)) {
      return res.status(400).json({
        success: false,
        message: 'Departure date must be after arrival date'
      });
    }

    // Check if dates are within trip dates
    if (new Date(arrivalDate) < new Date(trip.startDate) || 
        new Date(departureDate) > new Date(trip.endDate)) {
      return res.status(400).json({
        success: false,
        message: 'Destination dates must be within trip dates'
      });
    }

    // Check for overlapping dates with existing destinations
    const hasOverlap = trip.destinations.some(dest => {
      const existingArrival = new Date(dest.arrivalDate);
      const existingDeparture = new Date(dest.departureDate);
      const newArrival = new Date(arrivalDate);
      const newDeparture = new Date(departureDate);

      return (newArrival < existingDeparture && newDeparture > existingArrival);
    });

    if (hasOverlap) {
      return res.status(400).json({
        success: false,
        message: 'Destination dates overlap with existing destinations'
      });
    }

    // Add destination
    const order = trip.destinations.length;
    trip.destinations.push({
      city,
      country,
      arrivalDate,
      departureDate,
      order
    });

    await trip.save();

    res.status(201).json({
      success: true,
      data: trip.destinations[trip.destinations.length - 1]
    });
  } catch (error) {
    console.error('Add destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/itinerary/:tripId/destinations/:destinationId
// @desc    Update destination
// @access  Private
router.put('/:tripId/destinations/:destinationId', [
  body('city')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('City name cannot be empty'),
  body('country')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Country name cannot be empty'),
  body('arrivalDate')
    .optional()
    .isISO8601()
    .withMessage('Arrival date must be a valid date'),
  body('departureDate')
    .optional()
    .isISO8601()
    .withMessage('Departure date must be a valid date')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const destination = trip.destinations.id(req.params.destinationId);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    const { city, country, arrivalDate, departureDate } = req.body;

    // Update fields
    if (city) destination.city = city;
    if (country) destination.country = country;
    if (arrivalDate) destination.arrivalDate = arrivalDate;
    if (departureDate) destination.departureDate = departureDate;

    // Validate dates if both are provided
    if (arrivalDate && departureDate && new Date(arrivalDate) >= new Date(departureDate)) {
      return res.status(400).json({
        success: false,
        message: 'Departure date must be after arrival date'
      });
    }

    await trip.save();

    res.status(200).json({
      success: true,
      data: destination
    });
  } catch (error) {
    console.error('Update destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/itinerary/:tripId/destinations/:destinationId
// @desc    Remove destination from trip
// @access  Private
router.delete('/:tripId/destinations/:destinationId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const destination = trip.destinations.id(req.params.destinationId);

    if (!destination) {
      return res.status(404).json({
        success: false,
        message: 'Destination not found'
      });
    }

    // Remove activities for this destination
    await Activity.deleteMany({
      trip: trip._id,
      'destination.city': destination.city,
      'destination.country': destination.country
    });

    // Remove destination
    destination.remove();
    await trip.save();

    res.status(200).json({
      success: true,
      message: 'Destination removed successfully'
    });
  } catch (error) {
    console.error('Remove destination error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/itinerary/:tripId/destinations/reorder
// @desc    Reorder destinations
// @access  Private
router.put('/:tripId/destinations/reorder', [
  body('destinationIds')
    .isArray()
    .withMessage('Destination IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const { destinationIds } = req.body;

    // Validate that all destination IDs exist
    const existingIds = trip.destinations.map(d => d._id.toString());
    const validIds = destinationIds.every(id => existingIds.includes(id));

    if (!validIds) {
      return res.status(400).json({
        success: false,
        message: 'Invalid destination IDs provided'
      });
    }

    // Reorder destinations
    const reorderedDestinations = destinationIds.map((id, index) => {
      const destination = trip.destinations.id(id);
      destination.order = index;
      return destination;
    });

    trip.destinations = reorderedDestinations;
    await trip.save();

    res.status(200).json({
      success: true,
      data: trip.destinations
    });
  } catch (error) {
    console.error('Reorder destinations error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/itinerary/:tripId/basket
// @desc    Get basket for a trip
// @access  Private
router.get('/:tripId/basket', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

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
        message: 'Not authorized to access this trip'
      });
    }

    res.status(200).json({
      success: true,
      data: trip.basket || []
    });
  } catch (error) {
    console.error('Get basket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/itinerary/:tripId/basket
// @desc    Update basket for a trip
// @access  Private
router.put('/:tripId/basket', [
  body('activityIds')
    .isArray()
    .withMessage('Activity IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const { activityIds } = req.body;
    trip.basket = activityIds;
    await trip.save();

    res.status(200).json({
      success: true,
      data: trip.basket
    });
  } catch (error) {
    console.error('Update basket error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/itinerary/:tripId/days/:date/reorder
// @desc    Reorder activities within a day
// @access  Private
router.put('/:tripId/days/:date/reorder', [
  body('activityIds')
    .isArray()
    .withMessage('Activity IDs must be an array')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const { activityIds } = req.body;
    const date = new Date(req.params.date);

    // Update order for activities on this date
    for (let i = 0; i < activityIds.length; i++) {
      await Activity.findByIdAndUpdate(activityIds[i], {
        dayOrder: i
      });
    }

    res.status(200).json({
      success: true,
      message: 'Activities reordered successfully'
    });
  } catch (error) {
    console.error('Reorder activities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/itinerary/:tripId/days/:date/add
// @desc    Add activity to a specific day
// @access  Private
router.post('/:tripId/days/:date/add', [
  body('activityId')
    .isMongoId()
    .withMessage('Valid activity ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const { activityId } = req.body;
    const date = new Date(req.params.date);

    // Get the activity
    const activity = await Activity.findById(activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Get current day order
    const dayActivities = await Activity.find({
      trip: trip._id,
      date: date
    }).sort({ dayOrder: 1 });

    const dayOrder = dayActivities.length;

    // Update activity with new date and order
    activity.date = date;
    activity.dayOrder = dayOrder;
    await activity.save();

    res.status(200).json({
      success: true,
      data: activity
    });
  } catch (error) {
    console.error('Add activity to day error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   DELETE /api/itinerary/:tripId/days/:date/remove/:activityId
// @desc    Remove activity from a specific day
// @access  Private
router.delete('/:tripId/days/:date/remove/:activityId', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: 'Trip not found'
      });
    }

    // Check authorization
    if (trip.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this trip'
      });
    }

    const activity = await Activity.findById(req.params.activityId);
    if (!activity) {
      return res.status(404).json({
        success: false,
        message: 'Activity not found'
      });
    }

    // Remove from day by setting date to null
    activity.date = null;
    activity.dayOrder = null;
    await activity.save();

    res.status(200).json({
      success: true,
      message: 'Activity removed from day successfully'
    });
  } catch (error) {
    console.error('Remove activity from day error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router; 