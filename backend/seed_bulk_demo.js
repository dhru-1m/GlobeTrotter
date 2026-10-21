/*
  Bulk Demo Seeder
  - Removes prior demo users/trips/activities
  - Inserts 40 users: user1..user40 (email userN@gmail.com, password 12345678)
  - Upserts a set of Indian cities into City collection
  - Creates 30+ trips across the first ~20 users with mixed statuses
  - Adds 3 activities per trip with varied types
  - Stamps dates around Aug 2025 to light up charts and recent activity

  Run:
    node seed_bulk_demo.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Trip = require('./models/Trip');
const Activity = require('./models/Activity');
const City = require('./models/City');

const INDIAN_CITIES = [
  { name: 'Mumbai', country: 'India', code: 'IN', region: 'Maharashtra', tz: 'Asia/Kolkata', lat: 19.076, lng: 72.8777 },
  { name: 'Delhi', country: 'India', code: 'IN', region: 'Delhi', tz: 'Asia/Kolkata', lat: 28.6139, lng: 77.2090 },
  { name: 'Bengaluru', country: 'India', code: 'IN', region: 'Karnataka', tz: 'Asia/Kolkata', lat: 12.9716, lng: 77.5946 },
  { name: 'Hyderabad', country: 'India', code: 'IN', region: 'Telangana', tz: 'Asia/Kolkata', lat: 17.385, lng: 78.4867 },
  { name: 'Ahmedabad', country: 'India', code: 'IN', region: 'Gujarat', tz: 'Asia/Kolkata', lat: 23.0225, lng: 72.5714 },
  { name: 'Chennai', country: 'India', code: 'IN', region: 'Tamil Nadu', tz: 'Asia/Kolkata', lat: 13.0827, lng: 80.2707 },
  { name: 'Kolkata', country: 'India', code: 'IN', region: 'West Bengal', tz: 'Asia/Kolkata', lat: 22.5726, lng: 88.3639 },
  { name: 'Pune', country: 'India', code: 'IN', region: 'Maharashtra', tz: 'Asia/Kolkata', lat: 18.5204, lng: 73.8567 },
  { name: 'Jaipur', country: 'India', code: 'IN', region: 'Rajasthan', tz: 'Asia/Kolkata', lat: 26.9124, lng: 75.7873 },
  { name: 'Goa', country: 'India', code: 'IN', region: 'Goa', tz: 'Asia/Kolkata', lat: 15.2993, lng: 74.1240 },
  { name: 'Varanasi', country: 'India', code: 'IN', region: 'Uttar Pradesh', tz: 'Asia/Kolkata', lat: 25.3176, lng: 82.9739 },
  { name: 'Udaipur', country: 'India', code: 'IN', region: 'Rajasthan', tz: 'Asia/Kolkata', lat: 24.5854, lng: 73.7125 },
  { name: 'Rishikesh', country: 'India', code: 'IN', region: 'Uttarakhand', tz: 'Asia/Kolkata', lat: 30.0869, lng: 78.2676 },
  { name: 'Leh', country: 'India', code: 'IN', region: 'Ladakh', tz: 'Asia/Kolkata', lat: 34.1526, lng: 77.5771 }
];

const ACTIVITY_TYPES = ['sightseeing', 'food', 'adventure', 'culture', 'shopping', 'relaxation'];

function rand(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[rand(0, arr.length - 1)]; }
function hoursAgo(h) { return new Date(Date.now() - h * 3600 * 1000); }

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function wipeDemoData() {
  // Remove prior demo users and their content: user\d+@gmail.com and earlier sample accounts
  const demoUsers = await User.find({
    $or: [
      { email: { $regex: /^user\d+@gmail\.com$/i } },
      { email: { $in: [
        'admin@globetrotter.com',
        'john.doe@example.com',
        'jane.smith@example.com',
        'het.patel@example.com',
        'test.user@example.com'
      ] } }
    ]
  });
  const demoUserIds = demoUsers.map(u => u._id);
  const trips = await Trip.find({ user: { $in: demoUserIds } }).select('_id');
  const tripIds = trips.map(t => t._id);

  if (tripIds.length) {
    await Activity.deleteMany({ trip: { $in: tripIds } });
    await Trip.deleteMany({ _id: { $in: tripIds } });
  }
  if (demoUserIds.length) {
    await User.deleteMany({ _id: { $in: demoUserIds } });
  }

  console.log(`Removed prior demo users: ${demoUserIds.length}, trips: ${tripIds.length}`);
}

async function upsertCities() {
  for (const c of INDIAN_CITIES) {
    await City.updateOne(
      { name: c.name, country: c.country },
      {
        $set: {
          name: c.name,
          country: c.country,
          countryCode: c.code,
          region: c.region,
          coordinates: { lat: c.lat, lng: c.lng },
          timezone: c.tz,
          population: rand(200000, 20000000),
          costIndex: rand(30, 120),
          currency: 'INR',
          languages: ['Hindi', 'English'],
          climate: { type: 'tropical', averageTemp: { summer: 32, winter: 18 }, rainfall: pick(['low','moderate','high']) },
          attractions: [
            { name: `${c.name} Fort`, type: 'historical', description: `Historic spot in ${c.name}`, rating: rand(3,5), cost: rand(0,25) },
            { name: `${c.name} Market`, type: 'shopping', description: `Bazaar in ${c.name}`, rating: rand(3,5), cost: 0 }
          ],
          transportation: { airport: { hasInternational: true, name: `${c.name} Intl`, code: `${c.name.slice(0,3).toUpperCase()}` }, publicTransport: pick(['excellent','good','fair']), metro: true, bus: true, taxi: true },
          safety: { rating: rand(5,9), notes: 'Be mindful of busy areas' },
          images: [{ url: 'https://images.unsplash.com/photo-1524499982521-1ffd58dd89ea', caption: c.name, isPrimary: true }],
          tags: ['india','demo','travel'],
          popularity: rand(60,95),
          isActive: true
        }
      },
      { upsert: true }
    );
  }
  console.log(`Upserted ${INDIAN_CITIES.length} Indian cities`);
}

async function createUsers(n = 40) {
  const users = [];
  // Pre-hash the shared demo password since insertMany skips pre-save hooks
  const hashed = await bcrypt.hash('12345678', 10);
  for (let i = 1; i <= n; i++) {
    const user = new User({
      name: `user${i}`,
      email: `user${i}@gmail.com`,
      password: hashed,
      role: 'user',
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'Asia/Kolkata',
        theme: pick(['light','dark']),
        emailNotifications: true,
        pushNotifications: false,
        marketingEmails: false
      },
      savedDestinations: [
        { city: pick(INDIAN_CITIES).name, country: 'India', addedAt: hoursAgo(rand(100, 400)) }
      ],
      createdAt: hoursAgo(rand(12, 36)),
      lastLogin: hoursAgo(rand(1, 24))
    });
    users.push(user);
  }
  await User.insertMany(users);
  console.log(`Created ${users.length} users`);
  return users;
}

function computeDatesAug2025(offsetDays, durationDays) {
  const start = new Date(2025, 7, Math.max(1, 1 + offsetDays)); // Aug 2025
  const end = new Date(start.getTime() + durationDays * 86400000);
  return { start, end };
}

async function createTripsAndActivities(users) {
  const createdTrips = [];
  // Create trips for first ~20 users (1-3 trips each)
  const seedUsers = users.slice(0, 20);
  let tripCount = 0;
  for (const u of seedUsers) {
    const tripsForUser = rand(1, 3);
    for (let t = 0; t < tripsForUser; t++) {
      const city = pick(INDIAN_CITIES);
      const duration = rand(3, 7);
      const offset = rand(0, 25);
      const { start, end } = computeDatesAug2025(offset, duration);
      const totalBudget = pick([600, 1200, 2500, 3500, 4500, 5200]); // some luxury > 3000
      const status = pick(['planning','active','completed']);

      const trip = new Trip({
        user: u._id,
        name: `${city.name} Trip ${t+1}`,
        description: `Exploring ${city.name}, ${city.country}`,
        startDate: start,
        endDate: end,
        status,
        isPublic: Math.random() > 0.7,
        budget: {
          total: totalBudget,
          currency: 'USD',
          breakdown: {
            accommodation: Math.round(totalBudget * 0.38),
            transportation: Math.round(totalBudget * 0.22),
            activities: Math.round(totalBudget * 0.2),
            food: Math.round(totalBudget * 0.15),
            other: Math.round(totalBudget * 0.05)
          }
        },
        destinations: [{
          city: city.name,
          country: city.country,
          arrivalDate: start,
          departureDate: end,
          order: 1
        }],
        tags: ['demo','india', status],
        createdAt: hoursAgo(rand(1, 48)),
        updatedAt: hoursAgo(rand(1, 24))
      });

      await trip.save();
      createdTrips.push(trip);
      tripCount++;

      // 3 activities per trip
      const acts = [];
      for (let a = 0; a < 3; a++) {
        const dayOffset = a; // spread across days
        const date = new Date(start.getTime() + dayOffset * 86400000);
        const stHour = pick([9, 10, 11, 14, 16]);
        const startTime = `${String(stHour).padStart(2,'0')}:00`;
        const endTime = `${String(stHour + 2).padStart(2,'0')}:00`;
        const type = pick(ACTIVITY_TYPES);
        const title =
          type === 'food' ? 'Local Cuisine Tasting' :
          type === 'adventure' ? 'Outdoor Adventure' :
          type === 'shopping' ? 'Bazaar Shopping' :
          type === 'relaxation' ? 'Spa and Relax' :
          type === 'culture' ? 'Cultural Walking Tour' :
          'City Sightseeing';

        acts.push({
          trip: trip._id,
          destination: { city: city.name, country: city.country },
          title,
          description: `${title} in ${city.name}`,
          type,
          date,
          startTime,
          endTime,
          duration: 0,
          dayOrder: a + 1,
          location: { name: `${city.name} Center` },
          cost: { amount: rand(10, 200), currency: 'USD', perPerson: true },
          booking: { required: Math.random() > 0.6, confirmed: Math.random() > 0.5 },
          images: [{ url: 'https://images.unsplash.com/photo-1541417904950-b855846fe074', caption: title }],
          tags: ['demo','india', type],
          notes: 'Autogenerated demo activity',
          priority: pick(['low','medium','high']),
          isFlexible: Math.random() > 0.7,
          weatherDependent: Math.random() > 0.5,
          maxParticipants: rand(1, 10),
          currentParticipants: rand(1, 5),
          createdAt: hoursAgo(rand(1, 48)),
          updatedAt: hoursAgo(rand(1, 24))
        });
      }
      await Activity.insertMany(acts);
    }
  }
  console.log(`Created ${tripCount} trips and ${tripCount * 3} activities`);
  return createdTrips;
}

async function run() {
  try {
    await connectDB();
    await wipeDemoData();
    await upsertCities();
    const users = await createUsers(40);
    await createTripsAndActivities(users);

    console.log('Bulk demo data seeded successfully.');
  } catch (err) {
    console.error('Seed error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

run();
