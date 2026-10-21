/*
  Seed Admin Demo Data
  - Creates 5 users (including an admin)
  - Creates 2 luxury trips for Het Patel in Aug 2025
  - Adds a couple of activities to each trip
  - Sets createdAt timestamps to drive "Recent Activity" and Monthly Trends

  Run:
    node seed_admin_demo.js
*/

require('dotenv').config();
const mongoose = require('mongoose');

const User = require('./models/User');
const Trip = require('./models/Trip');
const Activity = require('./models/Activity');

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

function hoursAgo(hours) {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function ensureUser({ name, email, password, role = 'user', createdAt, lastLogin }) {
  let user = await User.findOne({ email }).select('+password');
  if (!user) {
    user = new User({
      name,
      email,
  password, // plain; pre-save hook will hash
      role,
      createdAt: createdAt || new Date(),
      lastLogin: lastLogin || new Date(),
    });
    await user.save();
    console.log(`Created user: ${name} (${email})`);
  } else {
    // Update role and timestamps if needed (don't overwrite password)
    user.role = role;
    if (createdAt) user.createdAt = createdAt;
    if (lastLogin) user.lastLogin = lastLogin;
    await user.save();
    console.log(`Updated user: ${name} (${email})`);
  }
  return user;
}

async function createTrip({ owner, name, city, country, budgetTotal, startInDays = 2, durationDays = 5, createdHoursAgo }) {
  const startDate = new Date();
  startDate.setFullYear(2025, 7, 14); // Aug is month index 7 (0-based)
  const endDate = new Date(startDate.getTime() + durationDays * 24 * 60 * 60 * 1000);

  const trip = new Trip({
    user: owner._id,
    name,
    description: `${name} in ${city}, ${country}`,
    startDate,
    endDate,
    status: 'planning', // keep as 'planning' per schema; dashboard can map as needed
    isPublic: false,
    budget: {
      total: budgetTotal,
      currency: 'USD',
      breakdown: {
        accommodation: Math.round(budgetTotal * 0.4),
        transportation: Math.round(budgetTotal * 0.2),
        activities: Math.round(budgetTotal * 0.2),
        food: Math.round(budgetTotal * 0.15),
        other: Math.round(budgetTotal * 0.05)
      }
    },
    destinations: [
      {
        city,
        country,
        arrivalDate: startDate,
        departureDate: endDate,
        order: 1
      }
    ],
    tags: ['demo', 'luxury'],
    createdAt: hoursAgo(createdHoursAgo),
    updatedAt: hoursAgo(createdHoursAgo)
  });

  await trip.save();
  console.log(`Created trip: ${name} for ${owner.name}`);
  return trip;
}

async function addActivities(trip, city, country) {
  const baseDate = new Date(trip.startDate);

  const items = [
    {
      title: 'City Landmarks Tour',
      type: 'sightseeing',
      dayOffset: 0,
      startTime: '10:00',
      endTime: '13:00',
      locationName: 'Main Square',
      cost: 120
    },
    {
      title: 'Fine Dining Experience',
      type: 'food',
      dayOffset: 1,
      startTime: '19:00',
      endTime: '21:00',
      locationName: 'Chef’s Table',
      cost: 250
    }
  ];

  for (let i = 0; i < items.length; i++) {
    const it = items[i];
    const date = new Date(baseDate.getTime() + it.dayOffset * 24 * 60 * 60 * 1000);

    const activity = new Activity({
      trip: trip._id,
      destination: { city, country },
      title: it.title,
      description: `${it.title} in ${city}`,
      type: it.type,
      date,
      startTime: it.startTime,
      endTime: it.endTime,
      duration: 0, // will be computed by pre-save hook
      dayOrder: i + 1,
      location: { name: it.locationName },
      cost: { amount: it.cost, currency: 'USD', perPerson: true },
      createdAt: hoursAgo(5),
      updatedAt: hoursAgo(5)
    });
    await activity.save();
  }
  console.log(`Added activities to trip ${trip.name}`);
}

async function run() {
  try {
    await connectDB();

    // Users and timing
    const admin = await ensureUser({
      name: 'Travel Admin',
      email: 'admin@globetrotter.com',
      password: 'Admin@123',
      role: 'admin',
      createdAt: hoursAgo(15),
      lastLogin: hoursAgo(1)
    });

    const john = await ensureUser({
      name: 'John Doe',
  email: 'john.doe@example.com',
      password: 'Password1!',
      createdAt: hoursAgo(15),
      lastLogin: hoursAgo(14)
    });

    const jane = await ensureUser({
      name: 'Jane Smith',
  email: 'jane.smith@example.com',
      password: 'Password1!',
      createdAt: hoursAgo(15),
      lastLogin: hoursAgo(13)
    });

    const het = await ensureUser({
      name: 'Het Patel',
  email: 'het.patel@example.com',
      password: 'Password1!',
      createdAt: hoursAgo(15),
      lastLogin: hoursAgo(1)
    });

    const testUser = await ensureUser({
      name: 'Test User',
  email: 'test.user@example.com',
      password: 'Password1!',
      createdAt: hoursAgo(12),
      lastLogin: hoursAgo(11)
    });

    // Remove prior demo trips (optional cleanup by owner)
    await Trip.deleteMany({ user: het._id, tags: 'demo' });

    // Create 2 luxury trips for Het Patel with createdAt in Aug 2025
    const trip1 = await createTrip({
      owner: het,
      name: 'Paris Getaway',
      city: 'Paris',
      country: 'France',
      budgetTotal: 4500,
      createdHoursAgo: 1
    });
    await addActivities(trip1, 'Paris', 'France');

    const trip2 = await createTrip({
      owner: het,
      name: 'Tokyo Adventure',
      city: 'Tokyo',
      country: 'Japan',
      budgetTotal: 5200,
      createdHoursAgo: 5
    });
    await addActivities(trip2, 'Tokyo', 'Japan');

    console.log('\nDemo data ready:');
    console.log('- Users: Travel Admin, John Doe, Jane Smith, Het Patel, Test User');
    console.log('- Trips: Paris Getaway, Tokyo Adventure (both luxury budgets)');
    console.log('\nTip: Login as any demo user (password: Password1!) to explore.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

run();
