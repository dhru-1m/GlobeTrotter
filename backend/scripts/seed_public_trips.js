const mongoose = require('mongoose');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');
const User = require('../models/User');

const seedPublicTrips = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    let user = await User.findOne({ email: 'john@example.com' });
    if (!user) {
      user = await User.findOne();
    }
    if (!user) {
      user = await User.create({
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice@example.com',
        username: 'alicej',
        password: 'Password123!'
      });
    }

    const featuredTrips = [
      {
        name: 'Tokyo Adventure',
        description: "A complete guide to exploring Tokyo's best spots, serene temples, futuristic streets, and legendary food scene.",
        publicUrl: 'tokyo-adventure-2024',
        user: user._id,
        startDate: new Date('2026-03-15'),
        endDate: new Date('2026-03-22'),
        destinations: [
          {
            city: 'Tokyo',
            country: 'Japan',
            arrivalDate: new Date('2026-03-15'),
            departureDate: new Date('2026-03-19'),
            order: 1
          },
          {
            city: 'Kyoto',
            country: 'Japan',
            arrivalDate: new Date('2026-03-19'),
            departureDate: new Date('2026-03-22'),
            order: 2
          }
        ],
        budget: {
          total: 2500,
          currency: 'USD',
          breakdown: {
            accommodation: 1000,
            transportation: 500,
            activities: 500,
            food: 400,
            other: 100
          }
        },
        tags: ['cultural', 'food', 'temples'],
        status: 'completed',
        isPublic: true,
        activities: [
          {
            title: 'Senso-ji Temple & Asakusa Walk',
            description: "Explore Tokyo's oldest and most famous Buddhist temple in the historic Asakusa district.",
            type: 'culture',
            destination: { city: 'Tokyo', country: 'Japan' },
            date: new Date('2026-03-15'),
            startTime: '09:00',
            endTime: '11:30',
            duration: 150,
            location: { name: 'Senso-ji, Asakusa, Tokyo', address: '2 Chome-3-1 Asakusa, Taito City, Tokyo' },
            cost: { amount: 0, currency: 'USD' }
          },
          {
            title: 'Shibuya Crossing & Hachiko Memorial',
            description: "Experience the world's busiest pedestrian intersection and pay respects to Hachiko.",
            type: 'sightseeing',
            destination: { city: 'Tokyo', country: 'Japan' },
            date: new Date('2026-03-15'),
            startTime: '14:00',
            endTime: '16:00',
            duration: 120,
            location: { name: 'Shibuya Scramble Crossing', address: 'Shibuya, Tokyo' },
            cost: { amount: 15, currency: 'USD' }
          },
          {
            title: 'Meiji Jingu Shrine & Yoyogi Park',
            description: 'Tranquil forested shrine complex dedicated to Emperor Meiji and Empress Shoken.',
            type: 'culture',
            destination: { city: 'Tokyo', country: 'Japan' },
            date: new Date('2026-03-16'),
            startTime: '10:00',
            endTime: '12:30',
            duration: 150,
            location: { name: 'Meiji Jingu', address: '1-1 Yoyogikamizonocho, Shibuya City, Tokyo' },
            cost: { amount: 0, currency: 'USD' }
          },
          {
            title: 'Tsukiji Outer Market Food Tour',
            description: 'Sample fresh sashimi, wagyu skewers, tamagoyaki, and matcha desserts.',
            type: 'food',
            destination: { city: 'Tokyo', country: 'Japan' },
            date: new Date('2026-03-16'),
            startTime: '13:00',
            endTime: '15:00',
            duration: 120,
            location: { name: 'Tsukiji Outer Market', address: 'Tsukiji, Chuo City, Tokyo' },
            cost: { amount: 45, currency: 'USD' }
          },
          {
            title: 'Fushimi Inari Shrine Hike',
            description: 'Walk through thousands of vibrant vermilion torii gates winding up sacred Mount Inari.',
            type: 'adventure',
            destination: { city: 'Kyoto', country: 'Japan' },
            date: new Date('2026-03-19'),
            startTime: '08:30',
            endTime: '11:30',
            duration: 180,
            location: { name: 'Fushimi Inari Taisha', address: '68 Fukakusa Yabunouchicho, Fushimi Ward, Kyoto' },
            cost: { amount: 0, currency: 'USD' }
          }
        ]
      },
      {
        name: 'European City Hopping',
        description: 'The ultimate European adventure across Paris, Rome, Barcelona, Amsterdam, and Berlin.',
        publicUrl: 'europe-cities-2024',
        user: user._id,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-14'),
        destinations: [
          { city: 'Paris', country: 'France', arrivalDate: new Date('2026-04-01'), departureDate: new Date('2026-04-04'), order: 1 },
          { city: 'Rome', country: 'Italy', arrivalDate: new Date('2026-04-04'), departureDate: new Date('2026-04-07'), order: 2 },
          { city: 'Barcelona', country: 'Spain', arrivalDate: new Date('2026-04-07'), departureDate: new Date('2026-04-10'), order: 3 },
          { city: 'Amsterdam', country: 'Netherlands', arrivalDate: new Date('2026-04-10'), departureDate: new Date('2026-04-12'), order: 4 },
          { city: 'Berlin', country: 'Germany', arrivalDate: new Date('2026-04-12'), departureDate: new Date('2026-04-14'), order: 5 }
        ],
        budget: {
          total: 3200,
          currency: 'USD',
          breakdown: {
            accommodation: 1400,
            transportation: 800,
            activities: 500,
            food: 400,
            other: 100
          }
        },
        tags: ['history', 'art', 'nightlife'],
        status: 'completed',
        isPublic: true,
        activities: [
          {
            title: 'Louvre Museum Tour',
            description: 'Marvel at the Mona Lisa, Venus de Milo, and iconic masterworks in the former royal palace.',
            type: 'culture',
            destination: { city: 'Paris', country: 'France' },
            date: new Date('2026-04-01'),
            startTime: '09:30',
            endTime: '12:30',
            duration: 180,
            location: { name: 'Louvre Museum', address: 'Rue de Rivoli, Paris' },
            cost: { amount: 25, currency: 'USD' }
          },
          {
            title: 'Colosseum & Roman Forum Guided Walk',
            description: 'Step back in time to ancient gladiatorial combats and Roman senate debates.',
            type: 'culture',
            destination: { city: 'Rome', country: 'Italy' },
            date: new Date('2026-04-05'),
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            location: { name: 'Colosseum', address: 'Piazza del Colosseo, Rome' },
            cost: { amount: 30, currency: 'USD' }
          },
          {
            title: 'Sagrada Familia & Park Guell',
            description: "Gaze upon Antoni Gaudí's unfinished architectural masterpiece.",
            type: 'sightseeing',
            destination: { city: 'Barcelona', country: 'Spain' },
            date: new Date('2026-04-08'),
            startTime: '11:00',
            endTime: '14:00',
            duration: 180,
            location: { name: 'Basílica de la Sagrada Família', address: 'Barcelona, Spain' },
            cost: { amount: 35, currency: 'USD' }
          }
        ]
      },
      {
        name: 'Bali Wellness Retreat',
        description: "A peaceful journey through Bali's spiritual side, lush rice paddies, yoga sanctuaries, and pristine beaches.",
        publicUrl: 'bali-wellness-2024',
        user: user._id,
        startDate: new Date('2026-02-10'),
        endDate: new Date('2026-02-17'),
        destinations: [
          { city: 'Ubud', country: 'Indonesia', arrivalDate: new Date('2026-02-10'), departureDate: new Date('2026-02-14'), order: 1 },
          { city: 'Canggu', country: 'Indonesia', arrivalDate: new Date('2026-02-14'), departureDate: new Date('2026-02-17'), order: 2 }
        ],
        budget: {
          total: 1200,
          currency: 'USD',
          breakdown: {
            accommodation: 500,
            transportation: 150,
            activities: 250,
            food: 200,
            other: 100
          }
        },
        tags: ['wellness', 'nature', 'yoga'],
        status: 'completed',
        isPublic: true,
        activities: [
          {
            title: 'Morning Yoga & Meditation at Yoga Barn',
            description: 'Rejuvenating morning vinyasa flow surrounded by lush Ubud jungle views.',
            type: 'relaxation',
            destination: { city: 'Ubud', country: 'Indonesia' },
            date: new Date('2026-02-10'),
            startTime: '07:30',
            endTime: '09:00',
            duration: 90,
            location: { name: 'The Yoga Barn', address: 'Jl. Raya Pengosekan, Ubud' },
            cost: { amount: 15, currency: 'USD' }
          },
          {
            title: 'Tegallalang Rice Terrace Trek',
            description: 'Hike through sweeping emerald terraces and enjoy fresh coconut water.',
            type: 'adventure',
            destination: { city: 'Ubud', country: 'Indonesia' },
            date: new Date('2026-02-11'),
            startTime: '08:00',
            endTime: '11:00',
            duration: 180,
            location: { name: 'Tegallalang Rice Terraces', address: 'Gianyar, Bali' },
            cost: { amount: 10, currency: 'USD' }
          },
          {
            title: 'Tanah Lot Sunset & Beach Walk',
            description: "Witness an unforgettable sunset behind Bali's iconic offshore ocean temple.",
            type: 'sightseeing',
            destination: { city: 'Canggu', country: 'Indonesia' },
            date: new Date('2026-02-15'),
            startTime: '17:00',
            endTime: '19:00',
            duration: 120,
            location: { name: 'Tanah Lot', address: 'Tabanan, Bali' },
            cost: { amount: 8, currency: 'USD' }
          }
        ]
      }
    ];

    for (const tripData of featuredTrips) {
      const { activities, ...tripFields } = tripData;
      let existingTrip = await Trip.findOne({ publicUrl: tripFields.publicUrl });
      if (!existingTrip) {
        existingTrip = await Trip.create(tripFields);
        console.log(`Created trip: ${existingTrip.name} (${existingTrip.publicUrl})`);
      } else {
        existingTrip.name = tripFields.name;
        existingTrip.description = tripFields.description;
        existingTrip.destinations = tripFields.destinations;
        existingTrip.budget = tripFields.budget;
        existingTrip.tags = tripFields.tags;
        existingTrip.status = tripFields.status;
        existingTrip.isPublic = true;
        await existingTrip.save();
        console.log(`Updated trip: ${existingTrip.name} (${existingTrip.publicUrl})`);
      }

      // Add activities if none exist
      const existingActs = await Activity.countDocuments({ trip: existingTrip._id });
      if (existingActs === 0 && activities && activities.length > 0) {
        const toInsert = activities.map((act, idx) => ({
          ...act,
          trip: existingTrip._id,
          dayOrder: idx + 1
        }));
        await Activity.insertMany(toInsert);
        console.log(`Added ${toInsert.length} activities to ${existingTrip.name}`);
      }
    }

    console.log('Public trips seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding public trips:', err);
    process.exit(1);
  }
};

seedPublicTrips();
