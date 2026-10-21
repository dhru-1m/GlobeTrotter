/*
  Comprehensive Admin & Demo Data Seeder for GlobeTrotter
  Seeds:
  - Admin user (admin@globetrotter.com / admin123)
  - 25+ realistic users distributed across the last 6 months
  - 45+ trips across diverse destinations (Paris, Tokyo, New York, Bali, Rome, London, Dubai, etc.)
  - Balanced trip statuses: 'planning' (upcoming), 'active' (ongoing), 'completed'
  - Balanced budget tiers: Budget (< $1000), Mid-range ($1000-3000), Luxury (> $3000)
  - 150+ activities covering sightseeing, food, adventure, culture, shopping, relaxation
  - Distributed createdAt across the last 6 months to populate monthly trends and recent activity

  Run:
    node seed_admin_full.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('./models/User');
const Trip = require('./models/Trip');
const Activity = require('./models/Activity');
const City = require('./models/City');

const CITIES = [
  { city: 'Paris', country: 'France', code: 'FRA' },
  { city: 'Tokyo', country: 'Japan', code: 'JPN' },
  { city: 'New York', country: 'United States', code: 'USA' },
  { city: 'Bali', country: 'Indonesia', code: 'IDN' },
  { city: 'Rome', country: 'Italy', code: 'ITA' },
  { city: 'London', country: 'United Kingdom', code: 'GBR' },
  { city: 'Dubai', country: 'United Arab Emirates', code: 'ARE' },
  { city: 'Barcelona', country: 'Spain', code: 'ESP' },
  { city: 'Sydney', country: 'Australia', code: 'AUS' },
  { city: 'Amsterdam', country: 'Netherlands', code: 'NLD' },
  { city: 'Kyoto', country: 'Japan', code: 'JPN' },
  { city: 'Goa', country: 'India', code: 'IND' },
  { city: 'Jaipur', country: 'India', code: 'IND' },
  { city: 'Mumbai', country: 'India', code: 'IND' },
  { city: 'Cape Town', country: 'South Africa', code: 'ZAF' }
];

const USER_PROFILES = [
  { name: 'Alex Johnson', email: 'alex.johnson@example.com' },
  { name: 'Priya Sharma', email: 'priya.sharma@example.com' },
  { name: 'Carlos Rossi', email: 'carlos.rossi@example.com' },
  { name: 'Liam Chen', email: 'liam.chen@example.com' },
  { name: 'Emma Watson', email: 'emma.watson@example.com' },
  { name: 'Rohan Gupta', email: 'rohan.gupta@example.com' },
  { name: 'Sophie Dubois', email: 'sophie.dubois@example.com' },
  { name: 'Marco Silva', email: 'marco.silva@example.com' },
  { name: 'Aisha Khan', email: 'aisha.khan@example.com' },
  { name: 'David Miller', email: 'david.miller@example.com' },
  { name: 'Elena Rostova', email: 'elena.rostova@example.com' },
  { name: 'Kenji Sato', email: 'kenji.sato@example.com' },
  { name: 'Chloe Martin', email: 'chloe.martin@example.com' },
  { name: 'Lucas Hernandez', email: 'lucas.h@example.com' },
  { name: 'Fatima Al-Mansoor', email: 'fatima.m@example.com' },
  { name: 'Oliver Smith', email: 'oliver.smith@example.com' },
  { name: 'Ananya Roy', email: 'ananya.roy@example.com' },
  { name: 'Mateo Garcia', email: 'mateo.garcia@example.com' },
  { name: 'Hannah Schmidt', email: 'hannah.s@example.com' },
  { name: 'Zane Malik', email: 'zane.malik@example.com' },
  { name: 'Isabella Costa', email: 'isabella.c@example.com' },
  { name: 'Daniel Park', email: 'daniel.park@example.com' },
  { name: 'Maya Patel', email: 'maya.patel@example.com' },
  { name: 'Noah Taylor', email: 'noah.taylor@example.com' }
];

const ACTIVITY_TEMPLATES = [
  { type: 'sightseeing', titles: ['Iconic Landmarks Tour', 'Historical Architecture Walk', 'Panoramic Viewpoint Visit', 'Old Town Walking Tour'] },
  { type: 'food', titles: ['Local Street Food Tasting', 'Fine Dining Experience', 'Traditional Cooking Class', 'Evening Wine & Tapas Trail'] },
  { type: 'adventure', titles: ['Mountain Hiking Expedition', 'Coastal Sea Kayaking', 'Zip-lining & Canopy Tour', 'Desert Safari & Dune Bashing'] },
  { type: 'culture', titles: ['National Museum Guided Tour', 'Ancient Temple Exploration', 'Traditional Art & Craft Workshop', 'Local Heritage Discovery'] },
  { type: 'shopping', titles: ['Artisan Bazaar Exploration', 'Luxury Boutique Shopping', 'Flea Market Antiques Hunt', 'Night Market Souvenirs'] },
  { type: 'relaxation', titles: ['Sunset Catamaran Cruise', 'Thermal Mineral Spa Day', 'Botanical Garden Stroll', 'Beachside Yoga & Wellness'] }
];

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[rand(0, arr.length - 1)];
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

async function run() {
  try {
    await connectDB();

    console.log('🧹 Cleaning previous demo trips and activities...');
    // Clean up all activities and trips to start fresh with high quality coherent data
    await Activity.deleteMany({});
    await Trip.deleteMany({});

    // Plain text passwords so that User.schema.pre('save') hashes them exactly once
    const standardPassword = 'Password1!';
    const adminPassword = 'admin123';

    console.log('👤 Ensuring Admin User...');
    let admin = await User.findOne({ email: 'admin@globetrotter.com' });
    if (!admin) {
      admin = new User({
        name: 'Travel Admin',
        email: 'admin@globetrotter.com',
        password: adminPassword,
        role: 'admin',
        createdAt: new Date(Date.now() - 120 * 86400000),
        lastLogin: new Date()
      });
      await admin.save();
      console.log('  Created admin: admin@globetrotter.com (admin123)');
    } else {
      admin.role = 'admin';
      admin.password = adminPassword;
      admin.lastLogin = new Date();
      await admin.save();
      console.log('  Updated admin: admin@globetrotter.com (admin123)');
    }

    console.log('👥 Creating Diverse Users...');
    const now = new Date();
    const createdUsers = [admin];

    for (let i = 0; i < USER_PROFILES.length; i++) {
      const p = USER_PROFILES[i];
      // Distribute creation over past 150 days (approx 5 months)
      const daysAgo = rand(1, 150);
      const userCreatedAt = new Date(now.getTime() - daysAgo * 86400000);
      const userLastLogin = new Date(now.getTime() - rand(0, Math.min(daysAgo, 20)) * 86400000);

      let user = await User.findOne({ email: p.email });
      if (!user) {
        user = new User({
          name: p.name,
          email: p.email,
          password: standardPassword,
          role: 'user',
          createdAt: userCreatedAt,
          lastLogin: userLastLogin,
          preferences: {
            language: 'en',
            currency: 'USD',
            theme: i % 3 === 0 ? 'dark' : 'light'
          }
        });
        await user.save();
      } else {
        user.name = p.name;
        user.password = standardPassword;
        user.createdAt = userCreatedAt;
        user.lastLogin = userLastLogin;
        await user.save();
      }
      createdUsers.push(user);
    }
    console.log(`  Total users available: ${createdUsers.length}`);

    console.log('✈️  Generating 48 Rich Trips Across Multiple Months and Destinations...');
    const allTrips = [];
    const allActivities = [];

    // Realistic distribution of trips over past 5 months and current month
    // Months back: 5, 4, 3, 2, 1, 0 (current month)
    const monthDistribution = [
      { monthsAgo: 5, count: 5 },
      { monthsAgo: 4, count: 7 },
      { monthsAgo: 3, count: 8 },
      { monthsAgo: 2, count: 9 },
      { monthsAgo: 1, count: 10 },
      { monthsAgo: 0, count: 9 } // Current month for strong growth metric
    ];

    // Status pool for variety
    const statuses = ['planning', 'active', 'completed'];

    // Weighted budgets:
    // Budget (< $1000): 14 trips
    // Mid-range ($1000 - $3000): 20 trips
    // Luxury (> $3000): 14 trips
    const budgetTiers = [
      // Budget
      550, 680, 750, 820, 890, 950, 620, 780, 850, 920, 700, 600, 800, 900,
      // Mid-range
      1200, 1450, 1600, 1750, 1850, 2100, 2250, 2400, 2500, 2700, 2800, 1300, 1550, 1900, 2150, 2350, 2600, 2850, 1700, 2050,
      // Luxury
      3200, 3500, 3800, 4200, 4600, 5200, 5800, 6400, 7200, 8500, 3600, 4800, 5500, 6900
    ];

    let budgetIdx = 0;

    for (const mDist of monthDistribution) {
      for (let k = 0; k < mDist.count; k++) {
        const user = pick(createdUsers);
        const cityData = pick(CITIES);
        const totalBudget = budgetTiers[budgetIdx % budgetTiers.length];
        budgetIdx++;

        // Calculate creation date in that month
        const daysBack = (mDist.monthsAgo * 30) + rand(1, 28);
        const tripCreatedAt = new Date(now.getTime() - daysBack * 86400000);

        // Determine appropriate status based on date
        let status;
        if (mDist.monthsAgo >= 2) {
          status = 'completed';
        } else if (mDist.monthsAgo === 1) {
          status = pick(['completed', 'active']);
        } else {
          // Current month
          status = pick(['active', 'planning', 'planning']);
        }

        const durationDays = rand(4, 9);
        const startDate = new Date(tripCreatedAt.getTime() + rand(5, 45) * 86400000);
        const endDate = new Date(startDate.getTime() + durationDays * 86400000);

        const tripName = `${cityData.city} ${pick(['Explorer', 'Getaway', 'Adventure', 'Escape', 'Journey', 'Vacation', 'Discovery'])}`;

        const trip = new Trip({
          user: user._id,
          name: tripName,
          description: `An unforgettable ${durationDays}-day holiday in ${cityData.city}, ${cityData.country}.`,
          startDate,
          endDate,
          status,
          isPublic: Math.random() > 0.6,
          budget: {
            total: totalBudget,
            currency: 'USD',
            breakdown: {
              accommodation: Math.round(totalBudget * 0.40),
              transportation: Math.round(totalBudget * 0.20),
              activities: Math.round(totalBudget * 0.20),
              food: Math.round(totalBudget * 0.15),
              other: Math.round(totalBudget * 0.05)
            }
          },
          destinations: [
            {
              city: cityData.city,
              country: cityData.country,
              arrivalDate: startDate,
              departureDate: endDate,
              order: 1
            }
          ],
          tags: ['demo', cityData.country.toLowerCase(), status],
          createdAt: tripCreatedAt,
          updatedAt: tripCreatedAt
        });

        await trip.save();
        allTrips.push(trip);

        // Add 3 to 4 activities per trip
        const activityCount = rand(3, 4);
        for (let a = 0; a < activityCount; a++) {
          const actTemplate = pick(ACTIVITY_TEMPLATES);
          const actTitle = pick(actTemplate.titles);
          const dayOffset = a;
          const actDate = new Date(startDate.getTime() + dayOffset * 86400000);
          const stHour = pick([9, 10, 11, 14, 16, 18]);
          const durationMins = pick([90, 120, 150, 180]);
          const endHour = stHour + Math.floor(durationMins / 60);
          const endMin = durationMins % 60;
          const startTime = `${String(stHour).padStart(2, '0')}:00`;
          const endTime = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
          const costAmount = rand(15, 250);

          allActivities.push({
            trip: trip._id,
            destination: {
              city: cityData.city,
              country: cityData.country
            },
            title: `${actTitle} in ${cityData.city}`,
            description: `Experience the best ${actTemplate.type} in ${cityData.city}.`,
            type: actTemplate.type,
            date: actDate,
            startTime,
            endTime,
            duration: durationMins,
            dayOrder: a + 1,
            location: {
              name: `${cityData.city} Central Square`
            },
            cost: {
              amount: costAmount,
              currency: 'USD',
              perPerson: true
            },
            booking: {
              required: Math.random() > 0.5,
              confirmed: true
            },
            priority: pick(['low', 'medium', 'high']),
            createdAt: tripCreatedAt,
            updatedAt: tripCreatedAt
          });
        }
      }
    }

    if (allActivities.length > 0) {
      await Activity.insertMany(allActivities);
    }

    console.log(`✅ Success! Seeded:`);
    console.log(`   - Users: ${createdUsers.length}`);
    console.log(`   - Trips: ${allTrips.length}`);
    console.log(`   - Activities: ${allActivities.length}`);
    console.log('\n📊 Summary of Generated Data:');
    console.log(`   - Planning Trips: ${allTrips.filter(t => t.status === 'planning').length}`);
    console.log(`   - Active Trips: ${allTrips.filter(t => t.status === 'active').length}`);
    console.log(`   - Completed Trips: ${allTrips.filter(t => t.status === 'completed').length}`);
    console.log(`   - Budget (<$1000): ${allTrips.filter(t => t.budget.total < 1000).length}`);
    console.log(`   - Mid-range ($1000-3000): ${allTrips.filter(t => t.budget.total >= 1000 && t.budget.total < 3000).length}`);
    console.log(`   - Luxury (>$3000): ${allTrips.filter(t => t.budget.total >= 3000).length}`);
    console.log('\n🔑 Admin Login: admin@globetrotter.com / admin123');

  } catch (err) {
    console.error('❌ Seeder Error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Disconnected from MongoDB');
  }
}

run();
