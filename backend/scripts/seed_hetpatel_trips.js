require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');
const Trip = require('../models/Trip');
const Activity = require('../models/Activity');

async function seedHetPatelTrips() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const email = 'hetpatel@gmail.com';
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        name: 'Het Patel',
        email,
        password: '12345678',
        role: 'user',
        isActive: true,
        emailVerified: true
      });
      await user.save();
      console.log(`✅ Created user ${email}`);
    } else {
      user.password = '12345678';
      user.isActive = true;
      user.emailVerified = true;
      await user.save();
      console.log(`✅ Updated password for ${email} to 12345678`);
    }

    const tripsData = [
      {
        name: 'Tokyo & Kyoto Cultural Odyssey',
        description: 'Exploring ancient temples, bustling districts, cutting-edge digital art, and Japanese culinary treasures.',
        startDate: new Date('2026-10-20T00:00:00Z'),
        endDate: new Date('2026-10-28T00:00:00Z'),
        status: 'active',
        isPublic: true,
        budget: {
          total: 2800,
          currency: 'USD',
          breakdown: {
            accommodation: 1100,
            transportation: 600,
            food: 500,
            activities: 450,
            other: 150
          }
        },
        destinations: [
          {
            city: 'Tokyo',
            country: 'Japan',
            arrivalDate: new Date('2026-10-20T00:00:00Z'),
            departureDate: new Date('2026-10-24T00:00:00Z'),
            order: 1
          },
          {
            city: 'Kyoto',
            country: 'Japan',
            arrivalDate: new Date('2026-10-24T00:00:00Z'),
            departureDate: new Date('2026-10-28T00:00:00Z'),
            order: 2
          }
        ],
        tags: ['japan', 'culture', 'food', 'temples'],
        activities: [
          {
            title: 'Shibuya Crossing & Meiji Shrine',
            description: 'Visit the world-famous scramble crossing followed by peaceful walk through evergreen Meiji Jingu forest.',
            type: 'sightseeing',
            date: new Date('2026-10-21T00:00:00Z'),
            startTime: '09:00',
            endTime: '12:00',
            duration: 180,
            location: { name: 'Shibuya & Harajuku', address: 'Shibuya, Tokyo' },
            destination: { city: 'Tokyo', country: 'Japan' },
            cost: { amount: 0, currency: 'USD' }
          },
          {
            title: 'TeamLab Planets Digital Art Immersion',
            description: 'Explore the immersive digital art museum with interactive light and water installations.',
            type: 'culture',
            date: new Date('2026-10-21T00:00:00Z'),
            startTime: '14:00',
            endTime: '17:00',
            duration: 180,
            location: { name: 'teamLab Planets TOKYO', address: 'Toyosu, Tokyo' },
            destination: { city: 'Tokyo', country: 'Japan' },
            cost: { amount: 35, currency: 'USD' }
          },
          {
            title: 'Senso-ji Temple & Asakusa Street Food',
            description: 'Tokyo\'s oldest Buddhist temple and shopping street Nakamise-dori with traditional snacks.',
            type: 'food',
            date: new Date('2026-10-22T00:00:00Z'),
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            location: { name: 'Senso-ji', address: 'Asakusa, Tokyo' },
            destination: { city: 'Tokyo', country: 'Japan' },
            cost: { amount: 25, currency: 'USD' }
          },
          {
            title: 'Akihabara Electric Town & Retro Gaming',
            description: 'Experience anime culture, multi-level arcades, and electronic specialty shops.',
            type: 'culture',
            date: new Date('2026-10-22T00:00:00Z'),
            startTime: '15:00',
            endTime: '18:00',
            duration: 180,
            location: { name: 'Akihabara', address: 'Chiyoda, Tokyo' },
            destination: { city: 'Tokyo', country: 'Japan' },
            cost: { amount: 30, currency: 'USD' }
          },
          {
            title: 'Fushimi Inari Shrine & 1,000 Torii Gates',
            description: 'Iconic mountain hike through vibrant orange torii gates leading to scenic views of Kyoto.',
            type: 'sightseeing',
            date: new Date('2026-10-25T00:00:00Z'),
            startTime: '08:30',
            endTime: '11:30',
            duration: 180,
            location: { name: 'Fushimi Inari Taisha', address: 'Fushimi-ku, Kyoto' },
            destination: { city: 'Kyoto', country: 'Japan' },
            cost: { amount: 0, currency: 'USD' }
          },
          {
            title: 'Arashiyama Bamboo Grove & Monkey Park',
            description: 'Walk through towering emerald bamboo forest and visit mountaintop Japanese macaque park.',
            type: 'adventure',
            date: new Date('2026-10-26T00:00:00Z'),
            startTime: '09:30',
            endTime: '13:00',
            duration: 210,
            location: { name: 'Arashiyama', address: 'Ukyo-ku, Kyoto' },
            destination: { city: 'Kyoto', country: 'Japan' },
            cost: { amount: 15, currency: 'USD' }
          },
          {
            title: 'Kinkaku-ji (Golden Pavilion)',
            description: 'Zen Buddhist temple covered in shimmering gold leaf overlooking a reflective mirror pond.',
            type: 'sightseeing',
            date: new Date('2026-10-26T00:00:00Z'),
            startTime: '14:30',
            endTime: '17:00',
            duration: 150,
            location: { name: 'Kinkaku-ji', address: 'Kita-ku, Kyoto' },
            destination: { city: 'Kyoto', country: 'Japan' },
            cost: { amount: 10, currency: 'USD' }
          }
        ]
      },
      {
        name: 'European Grand Tour: Paris & Rome',
        description: 'A romantic exploration of art, architecture, and world-renowned gastronomy across France and Italy.',
        startDate: new Date('2026-11-15T00:00:00Z'),
        endDate: new Date('2026-11-23T00:00:00Z'),
        status: 'planning',
        isPublic: true,
        budget: {
          total: 3200,
          currency: 'USD',
          breakdown: {
            accommodation: 1300,
            transportation: 700,
            food: 600,
            activities: 450,
            other: 150
          }
        },
        destinations: [
          {
            city: 'Paris',
            country: 'France',
            arrivalDate: new Date('2026-11-15T00:00:00Z'),
            departureDate: new Date('2026-11-19T00:00:00Z'),
            order: 1
          },
          {
            city: 'Rome',
            country: 'Italy',
            arrivalDate: new Date('2026-11-19T00:00:00Z'),
            departureDate: new Date('2026-11-23T00:00:00Z'),
            order: 2
          }
        ],
        tags: ['europe', 'paris', 'rome', 'art', 'history'],
        activities: [
          {
            title: 'Louvre Museum Masterpieces Tour',
            description: 'Discover the Mona Lisa, Venus de Milo, and Winged Victory with skip-the-line access.',
            type: 'culture',
            date: new Date('2026-11-16T00:00:00Z'),
            startTime: '09:00',
            endTime: '13:00',
            duration: 240,
            location: { name: 'Musée du Louvre', address: 'Rue de Rivoli, Paris' },
            destination: { city: 'Paris', country: 'France' },
            cost: { amount: 22, currency: 'USD' }
          },
          {
            title: 'Seine River Sunset Cruise',
            description: 'Panoramic boat cruise viewing Notre-Dame, Musée d’Orsay, and the sparkling Eiffel Tower.',
            type: 'relaxation',
            date: new Date('2026-11-16T00:00:00Z'),
            startTime: '18:00',
            endTime: '20:00',
            duration: 120,
            location: { name: 'Port de la Bourdonnais', address: 'Paris, France' },
            destination: { city: 'Paris', country: 'France' },
            cost: { amount: 18, currency: 'USD' }
          },
          {
            title: 'Palace of Versailles & Gardens',
            description: 'Day trip to royal residence of King Louis XIV including Hall of Mirrors and grand fountains.',
            type: 'sightseeing',
            date: new Date('2026-11-17T00:00:00Z'),
            startTime: '09:30',
            endTime: '15:30',
            duration: 360,
            location: { name: 'Château de Versailles', address: 'Versailles, France' },
            destination: { city: 'Paris', country: 'France' },
            cost: { amount: 30, currency: 'USD' }
          },
          {
            title: 'Colosseum & Roman Forum Guided Walk',
            description: 'Step back in time inside the ancient gladiatorial arena and center of the Roman Empire.',
            type: 'sightseeing',
            date: new Date('2026-11-20T00:00:00Z'),
            startTime: '09:00',
            endTime: '12:30',
            duration: 210,
            location: { name: 'Colosseum', address: 'Piazza del Colosseo, Rome' },
            destination: { city: 'Rome', country: 'Italy' },
            cost: { amount: 35, currency: 'USD' }
          },
          {
            title: 'Vatican Museums & Sistine Chapel',
            description: 'Marvel at Michelangelo’s famous ceiling frescoes and St. Peter’s Basilica.',
            type: 'culture',
            date: new Date('2026-11-21T00:00:00Z'),
            startTime: '08:30',
            endTime: '13:00',
            duration: 270,
            location: { name: 'Vatican Museums', address: 'Vatican City, Rome' },
            destination: { city: 'Rome', country: 'Italy' },
            cost: { amount: 32, currency: 'USD' }
          },
          {
            title: 'Trevi Fountain & Trastevere Gelato Walking Tour',
            description: 'Toss a coin into Trevi Fountain and sample authentic artisan gelato in vibrant Trastevere.',
            type: 'food',
            date: new Date('2026-11-21T00:00:00Z'),
            startTime: '16:00',
            endTime: '19:00',
            duration: 180,
            location: { name: 'Trastevere', address: 'Rome, Italy' },
            destination: { city: 'Rome', country: 'Italy' },
            cost: { amount: 20, currency: 'USD' }
          }
        ]
      },
      {
        name: 'Swiss Alps Mountain Escape',
        description: 'Breathtaking alpine scenery, lake cruises, cogwheel trains, and chocolate tasting in Switzerland.',
        startDate: new Date('2026-12-10T00:00:00Z'),
        endDate: new Date('2026-12-17T00:00:00Z'),
        status: 'planning',
        isPublic: false,
        budget: {
          total: 3500,
          currency: 'USD',
          breakdown: {
            accommodation: 1500,
            transportation: 800,
            food: 650,
            activities: 400,
            other: 150
          }
        },
        destinations: [
          {
            city: 'Zurich',
            country: 'Switzerland',
            arrivalDate: new Date('2026-12-10T00:00:00Z'),
            departureDate: new Date('2026-12-13T00:00:00Z'),
            order: 1
          },
          {
            city: 'Interlaken',
            country: 'Switzerland',
            arrivalDate: new Date('2026-12-13T00:00:00Z'),
            departureDate: new Date('2026-12-17T00:00:00Z'),
            order: 2
          }
        ],
        tags: ['switzerland', 'alps', 'mountains', 'winter', 'nature'],
        activities: [
          {
            title: 'Zurich Old Town & Lake Promenade',
            description: 'Explore cobblestone alleys, Fraumünster church stained glass, and tranquil lake vistas.',
            type: 'sightseeing',
            date: new Date('2026-12-11T00:00:00Z'),
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            location: { name: 'Altstadt', address: 'Zurich, Switzerland' },
            destination: { city: 'Zurich', country: 'Switzerland' },
            cost: { amount: 0, currency: 'USD' }
          },
          {
            title: 'Jungfraujoch - Top of Europe Train Excursion',
            description: 'Ride Europe’s highest railway station at 3,454m with Ice Palace and glacier views.',
            type: 'adventure',
            date: new Date('2026-12-14T00:00:00Z'),
            startTime: '08:30',
            endTime: '15:30',
            duration: 420,
            location: { name: 'Jungfraujoch', address: 'Interlaken, Switzerland' },
            destination: { city: 'Interlaken', country: 'Switzerland' },
            cost: { amount: 190, currency: 'USD' }
          },
          {
            title: 'Lake Brienz Cruise & Giessbach Falls',
            description: 'Scenic turquoise lake cruise leading to historic grand hotel and roaring waterfalls.',
            type: 'relaxation',
            date: new Date('2026-12-15T00:00:00Z'),
            startTime: '11:00',
            endTime: '14:30',
            duration: 210,
            location: { name: 'Lake Brienz', address: 'Brienz, Switzerland' },
            destination: { city: 'Interlaken', country: 'Switzerland' },
            cost: { amount: 45, currency: 'USD' }
          }
        ]
      },
      {
        name: 'Goa Coastal Sun & Heritage Retreat',
        description: 'Sun-drenched golden beaches, Portuguese colonial architecture, and coastal seafood feasts.',
        startDate: new Date('2026-09-10T00:00:00Z'),
        endDate: new Date('2026-09-15T00:00:00Z'),
        status: 'completed',
        isPublic: true,
        budget: {
          total: 800,
          currency: 'USD',
          breakdown: {
            accommodation: 350,
            transportation: 150,
            food: 180,
            activities: 80,
            other: 40
          }
        },
        destinations: [
          {
            city: 'Goa',
            country: 'India',
            arrivalDate: new Date('2026-09-10T00:00:00Z'),
            departureDate: new Date('2026-09-15T00:00:00Z'),
            order: 1
          }
        ],
        tags: ['goa', 'india', 'beaches', 'heritage'],
        activities: [
          {
            title: 'Baga Beach Water Sports & Parasailing',
            description: 'Exciting jet ski and parasailing adventures over the Arabian Sea.',
            type: 'adventure',
            date: new Date('2026-09-11T00:00:00Z'),
            startTime: '09:00',
            endTime: '12:00',
            duration: 180,
            location: { name: 'Baga Beach', address: 'North Goa, India' },
            destination: { city: 'Goa', country: 'India' },
            cost: { amount: 40, currency: 'USD' }
          },
          {
            title: 'Basilica of Bom Jesus & Old Goa Churches',
            description: 'UNESCO World Heritage 16th-century baroque churches and convent ruins.',
            type: 'culture',
            date: new Date('2026-09-12T00:00:00Z'),
            startTime: '10:00',
            endTime: '13:00',
            duration: 180,
            location: { name: 'Old Goa', address: 'Velha Goa, India' },
            destination: { city: 'Goa', country: 'India' },
            cost: { amount: 5, currency: 'USD' }
          },
          {
            title: 'Dudhsagar Waterfalls Jungle Trek',
            description: 'Spectacular multi-tiered white water cascade hidden inside Bhagwan Mahaveer Sanctuary.',
            type: 'adventure',
            date: new Date('2026-09-13T00:00:00Z'),
            startTime: '08:00',
            endTime: '15:00',
            duration: 420,
            location: { name: 'Dudhsagar Falls', address: 'Sonaulim, Goa' },
            destination: { city: 'Goa', country: 'India' },
            cost: { amount: 35, currency: 'USD' }
          }
        ]
      }
    ];

    for (const tripData of tripsData) {
      const { activities: acts, ...tripFields } = tripData;

      // Upsert trip
      let trip = await Trip.findOne({ user: user._id, name: tripFields.name });
      if (!trip) {
        trip = new Trip({
          ...tripFields,
          user: user._id
        });
        await trip.save();
        console.log(`🌴 Created trip: "${trip.name}" (ID: ${trip._id})`);
      } else {
        Object.assign(trip, tripFields);
        await trip.save();
        console.log(`🔄 Updated trip: "${trip.name}" (ID: ${trip._id})`);
      }

      // Add activities
      if (acts && acts.length > 0) {
        // Clear old seeded activities for this trip to avoid duplication
        await Activity.deleteMany({ trip: trip._id });

        for (let i = 0; i < acts.length; i++) {
          const act = acts[i];
          const newAct = new Activity({
            ...act,
            trip: trip._id,
            dayOrder: i + 1
          });
          await newAct.save();
        }
        console.log(`   ✨ Added ${acts.length} activities for "${trip.name}"`);
      }
    }

    const totalUserTrips = await Trip.find({ user: user._id });
    console.log(`\n🎉 All done! ${user.name} (${user.email}) now has ${totalUserTrips.length} trips.`);

  } catch (error) {
    console.error('❌ Error seeding Het Patel trips:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedHetPatelTrips();
