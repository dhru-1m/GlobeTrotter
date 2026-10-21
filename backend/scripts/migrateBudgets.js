const mongoose = require('mongoose');
require('dotenv').config();
const Trip = require('../models/Trip');

const migrateBudgets = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter');
    console.log('Connected to MongoDB');

    // Get all trips
    const trips = await Trip.find({});
    console.log(`Found ${trips.length} trips to update`);

    // Update each trip
    for (const trip of trips) {
      const defaultTotal = 5000;
      
      // Set default budget structure if not exists
      if (!trip.budget || !trip.budget.breakdown) {
        trip.budget = {
          total: defaultTotal,
          currency: 'USD',
          breakdown: {
            accommodation: defaultTotal * 0.4, // 40%
            transportation: defaultTotal * 0.2, // 20%
            activities: defaultTotal * 0.2, // 20%
            food: defaultTotal * 0.15, // 15%
            other: defaultTotal * 0.05 // 5%
          }
        };
        await trip.save();
        console.log(`Updated budget for trip: ${trip.name}`);
      }
    }

    console.log('Budget migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
};

migrateBudgets();
