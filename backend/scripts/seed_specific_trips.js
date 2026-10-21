/*
  Ensure specific trips exist for selected users with exact dates/status/budget
  Run:
    node scripts/seed_specific_trips.js
*/

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('../models/User');
const Trip = require('../models/Trip');

function dmy(y, m, d) { return new Date(y, m - 1, d, 10, 0, 0, 0); }
function zeroBudget(currency = 'USD', total = 0) {
  return {
    total,
    currency,
    breakdown: { accommodation: 0, transportation: 0, activities: 0, food: 0, other: 0 }
  };
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function ensureTrip({ userEmail, name, city, country, startY, startM, startD, endY, endM, endD, status, createdY, createdM, createdD, budget }) {
  const user = await User.findOne({ email: userEmail });
  if (!user) { console.log(`User not found: ${userEmail}`); return; }

  const startDate = dmy(startY, startM, startD);
  const endDate = dmy(endY, endM, endD);
  const createdAt = dmy(createdY, createdM, createdD);

  // Try to find by user+date range+name
  let trip = await Trip.findOne({ user: user._id, name, startDate, endDate });
  if (!trip) {
    trip = new Trip({
      user: user._id,
      name,
      description: name,
      startDate,
      endDate,
      status,
      isPublic: false,
      budget: budget || zeroBudget('USD', 0),
      destinations: [{ city: city || '', country: country || '', arrivalDate: startDate, departureDate: endDate, order: 1 }],
      tags: ['specific','csv'],
      createdAt,
      updatedAt: createdAt
    });
    await trip.save();
    console.log(`Created trip ${name} for ${user.email}`);
  } else {
    trip.status = status;
    if (budget) trip.budget = budget;
    trip.createdAt = createdAt;
    await trip.save();
    console.log(`Updated trip ${name} for ${user.email}`);
  }
}

async function run() {
  try {
    await connectDB();
    // Het Patel - two planning trips with zero budget
    await ensureTrip({
      userEmail: 'hkpatel@gmail.com', name: 'Het Patel Trip 1',
      city: '', country: '', startY: 2025, startM: 8, startD: 14, endY: 2025, endM: 8, endD: 15,
      status: 'planning', createdY: 2025, createdM: 8, createdD: 11, budget: zeroBudget('USD', 0)
    });
    await ensureTrip({
      userEmail: 'hkpatel@gmail.com', name: 'Het Patel Trip 2',
      city: '', country: '', startY: 2025, startM: 8, startD: 22, endY: 2025, endM: 8, endD: 30,
      status: 'planning', createdY: 2025, createdM: 8, createdD: 11, budget: zeroBudget('USD', 0)
    });

    // user1 - active trip with 4500 budget
    await ensureTrip({
      userEmail: 'user1@gmail.com', name: 'user1 Trip',
      city: '', country: '', startY: 2025, startM: 8, startD: 7, endY: 2025, endM: 8, endD: 13,
      status: 'active', createdY: 2025, createdM: 8, createdD: 10,
      budget: { total: 4500, currency: 'USD', breakdown: { accommodation: 1710, transportation: 990, activities: 900, food: 675, other: 225 } }
    });

    // user2 - two completed trips with budgets 4500 and 3500
    await ensureTrip({
      userEmail: 'user2@gmail.com', name: 'user2 Trip A',
      city: '', country: '', startY: 2025, startM: 8, startD: 20, endY: 2025, endM: 8, endD: 24,
      status: 'completed', createdY: 2025, createdM: 8, createdD: 11,
      budget: { total: 4500, currency: 'USD', breakdown: { accommodation: 1710, transportation: 990, activities: 900, food: 675, other: 225 } }
    });
    await ensureTrip({
      userEmail: 'user2@gmail.com', name: 'user2 Trip B',
      city: '', country: '', startY: 2025, startM: 8, startD: 23, endY: 2025, endM: 8, endD: 27,
      status: 'completed', createdY: 2025, createdM: 8, createdD: 11,
      budget: { total: 3500, currency: 'USD', breakdown: { accommodation: 1330, transportation: 770, activities: 700, food: 525, other: 175 } }
    });

    console.log('Specific trips ensured.');
  } catch (err) {
    console.error('Seed specific trips error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

run();
