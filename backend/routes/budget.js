const express = require('express');
const { body, validationResult } = require('express-validator');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');
const { estimateBudget } = require('../utils/budgetEngine');
const geminiService = require('../services/geminiService');

const router = express.Router();

// @route   GET /api/budget/:tripId
// @desc    Get dynamic budget breakdown for a trip
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

    // Get all activities for this trip
    const activities = await Activity.find({ trip: trip._id });

    // Parse optional query params
    const travelStyle = req.query.travelStyle || 'moderate';
    const groupSize   = parseInt(req.query.groupSize) || 1;

    // Run the dynamic budget engine
    const budgetData = estimateBudget(trip, activities, { travelStyle, groupSize });

    res.status(200).json({
      success: true,
      data: budgetData
    });
  } catch (error) {
    console.error('Get budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   PUT /api/budget/:tripId
// @desc    Update trip budget
// @access  Private
router.put('/:tripId', [
  body('total')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Total budget must be a positive number'),
  body('currency')
    .optional()
    .isIn(['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'INR'])
    .withMessage('Invalid currency'),
  body('breakdown.accommodation')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Accommodation cost must be a positive number'),
  body('breakdown.transportation')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Transportation cost must be a positive number'),
  body('breakdown.food')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Food cost must be a positive number'),
  body('breakdown.other')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Other cost must be a positive number')
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
        message: 'Not authorized to update this trip'
      });
    }

    const { total, currency, breakdown } = req.body;

    // Update budget fields
    if (total !== undefined) trip.budget.total = total;
    if (currency) trip.budget.currency = currency;
    if (breakdown) {
      if (breakdown.accommodation !== undefined) trip.budget.breakdown.accommodation = breakdown.accommodation;
      if (breakdown.transportation !== undefined) trip.budget.breakdown.transportation = breakdown.transportation;
      if (breakdown.food !== undefined) trip.budget.breakdown.food = breakdown.food;
      if (breakdown.activities !== undefined) trip.budget.breakdown.activities = breakdown.activities;
      if (breakdown.other !== undefined) trip.budget.breakdown.other = breakdown.other;
    }

    await trip.save();

    res.status(200).json({
      success: true,
      data: trip.budget
    });
  } catch (error) {
    console.error('Update budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/budget/:tripId/ai-generate
// @desc    Generate AI budget breakdown using Gemini
// @access  Private
router.post('/:tripId/ai-generate', async (req, res) => {
  try {
    const trip = await Trip.findById(req.params.tripId);
    if (!trip) {
      return res.status(404).json({ success: false, message: 'Trip not found' });
    }
    if (trip.user.toString() !== req.user.id && !trip.collaborators.some(c => c.user.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    const start = new Date(trip.startDate);
    const end = new Date(trip.endDate);
    const duration = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const travelStyle = req.body.travelStyle || 'mid-range';
    const groupSize = req.body.groupSize || 1;

    let cities = [];
    if (trip.destinations && trip.destinations.length > 0) {
      cities = trip.destinations.map(d => ({ name: d.city || d.name || d }));
    } else {
      cities = [{ name: trip.name }];
    }

    const aiBudget = await geminiService.generateBudgetBreakdown({
      cities,
      duration,
      travelStyle,
      groupSize
    });

    if (aiBudget && aiBudget.budgetBreakdown) {
      const b = aiBudget.budgetBreakdown;
      const accommodation = b.accommodation?.total || 0;
      const transportation = b.transportation?.total || 0;
      const food = b.food?.total || 0;
      const activities = b.activities?.total || 0;
      const other = (b.miscellaneous?.total || 0);
      const total = aiBudget.grandTotal || (accommodation + transportation + food + activities + other);

      trip.budget.total = total;
      trip.budget.breakdown = {
        accommodation,
        transportation,
        food,
        activities,
        other
      };
      await trip.save();
    }

    res.status(200).json({
      success: true,
      message: 'AI budget generated successfully',
      data: {
        budget: trip.budget,
        aiDetails: aiBudget
      }
    });
  } catch (error) {
    console.error('AI budget generation error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate AI budget'
    });
  }
});

// @route   GET /api/budget/:tripId/forecast
// @desc    Get budget forecast and recommendations
// @access  Private
router.get('/:tripId/forecast', async (req, res) => {
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

    // Get activities
    const activities = await Activity.find({ trip: trip._id });

    // Run budget engine for forecast comparison
    const travelStyle = req.query.travelStyle || 'moderate';
    const groupSize   = parseInt(req.query.groupSize) || 1;
    const estimate = estimateBudget(trip, activities, { travelStyle, groupSize });

    // Calculate current spending
    const currentSpending = activities.reduce((total, activity) => {
      return total + (activity.cost.amount || 0);
    }, 0);

    const totalBudget = trip.budget.total || 0;
    const remainingBudget = totalBudget - currentSpending;
    const spendingPercentage = totalBudget > 0 ? (currentSpending / totalBudget) * 100 : 0;

    // Generate recommendations from the engine's suggestions
    const recommendations = estimate.suggestions.map(s => ({
      type: s.type,
      message: s.message,
      category: s.category,
      potentialSaving: s.potentialSaving || 0,
    }));

    // Check for expensive activities
    const expensiveActivities = activities.filter(activity => 
      activity.cost.amount > (totalBudget * 0.1) // More than 10% of total budget
    );

    if (expensiveActivities.length > 0) {
      recommendations.push({
        type: 'info',
        message: `You have ${expensiveActivities.length} expensive activities planned.`,
        category: 'activities'
      });
    }

    // Check for days with no activities (potential savings)
    const tripDays = Math.ceil((new Date(trip.endDate) - new Date(trip.startDate)) / (1000 * 60 * 60 * 24));
    const daysWithActivities = new Set(activities.map(a => a.date.toISOString().split('T')[0])).size;
    const freeDays = tripDays - daysWithActivities;

    if (freeDays > 0) {
      recommendations.push({
        type: 'success',
        message: `You have ${freeDays} free days which could help with budget management.`,
        category: 'planning'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        totalBudget,
        currentSpending,
        remainingBudget,
        spendingPercentage,
        estimatedTotal: estimate.total,
        recommendations,
        savingTips: estimate.savingTips,
        tripDays,
        daysWithActivities,
        freeDays,
        expensiveActivitiesCount: expensiveActivities.length
      }
    });
  } catch (error) {
    console.error('Get budget forecast error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/budget/:tripId/export
// @desc    Export budget data
// @access  Private
router.get('/:tripId/export', async (req, res) => {
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

    // Get activities
    const activities = await Activity.find({ trip: trip._id })
      .sort({ date: 1, startTime: 1 });

    // Prepare export data
    const exportData = {
      trip: {
        name: trip.name,
        startDate: trip.startDate,
        endDate: trip.endDate,
        currency: trip.budget.currency
      },
      budget: trip.budget,
      activities: activities.map(activity => ({
        title: activity.title,
        date: activity.date,
        location: activity.location?.name || '',
        cost: activity.cost,
        type: activity.type
      })),
      summary: {
        totalActivities: activities.length,
        totalCost: activities.reduce((sum, a) => sum + (a.cost.amount || 0), 0),
        averageCostPerActivity: activities.length > 0 ? 
          activities.reduce((sum, a) => sum + (a.cost.amount || 0), 0) / activities.length : 0
      }
    };

    res.status(200).json({
      success: true,
      data: exportData
    });
  } catch (error) {
    console.error('Export budget error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;