const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const User = require('./models/User');
const Trip = require('./models/Trip');
const City = require('./models/City');
const Activity = require('./models/Activity');

// Sample cities data
const cities = [
  {
    name: 'Paris',
    country: 'France',
    countryCode: 'FRA',
    region: 'Île-de-France',
    coordinates: { lat: 48.8566, lng: 2.3522 },
    timezone: 'Europe/Paris',
    population: 2161000,
    costIndex: 85,
    currency: 'EUR',
    languages: ['French', 'English'],
    climate: {
      type: 'temperate',
      averageTemp: { summer: 20, winter: 5 },
      rainfall: 'moderate'
    },
    attractions: [
      {
        name: 'Eiffel Tower',
        type: 'landmark',
        description: 'Iconic iron lattice tower and symbol of Paris',
        rating: 4.5,
        cost: 26
      },
      {
        name: 'Louvre Museum',
        type: 'museum',
        description: 'World\'s largest art museum and historic monument',
        rating: 4.7,
        cost: 17
      },
      {
        name: 'Notre-Dame Cathedral',
        type: 'religious',
        description: 'Medieval Catholic cathedral with Gothic architecture',
        rating: 4.6,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Charles de Gaulle Airport',
        code: 'CDG'
      },
      publicTransport: 'excellent',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 8,
      notes: 'Generally safe, be cautious of pickpockets in tourist areas'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1502602898536-47ad22581b52',
        caption: 'Eiffel Tower at sunset',
        isPrimary: true
      }
    ],
    tags: ['culture', 'art', 'food', 'romance'],
    popularity: 95,
    isActive: true
  },
  {
    name: 'Tokyo',
    country: 'Japan',
    countryCode: 'JPN',
    region: 'Kantō',
    coordinates: { lat: 35.6762, lng: 139.6503 },
    timezone: 'Asia/Tokyo',
    population: 13929000,
    costIndex: 78,
    currency: 'JPY',
    languages: ['Japanese', 'English'],
    climate: {
      type: 'temperate',
      averageTemp: { summer: 26, winter: 6 },
      rainfall: 'high'
    },
    attractions: [
      {
        name: 'Tokyo Skytree',
        type: 'landmark',
        description: 'Broadcasting and observation tower',
        rating: 4.3,
        cost: 28
      },
      {
        name: 'Senso-ji Temple',
        type: 'religious',
        description: 'Ancient Buddhist temple',
        rating: 4.5,
        cost: 0
      },
      {
        name: 'Shibuya Crossing',
        type: 'landmark',
        description: 'Famous pedestrian scramble crosswalk',
        rating: 4.2,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Narita International Airport',
        code: 'NRT'
      },
      publicTransport: 'excellent',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 9,
      notes: 'Very safe city with low crime rates'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf',
        caption: 'Tokyo cityscape',
        isPrimary: true
      }
    ],
    tags: ['technology', 'culture', 'food', 'shopping'],
    popularity: 90,
    isActive: true
  },
  {
    name: 'New York',
    country: 'United States',
    countryCode: 'USA',
    region: 'New York',
    coordinates: { lat: 40.7128, lng: -74.0060 },
    timezone: 'America/New_York',
    population: 8337000,
    costIndex: 100,
    currency: 'USD',
    languages: ['English', 'Spanish'],
    climate: {
      type: 'temperate',
      averageTemp: { summer: 25, winter: 0 },
      rainfall: 'moderate'
    },
    attractions: [
      {
        name: 'Statue of Liberty',
        type: 'landmark',
        description: 'Iconic symbol of freedom and democracy',
        rating: 4.5,
        cost: 18
      },
      {
        name: 'Central Park',
        type: 'park',
        description: 'Urban oasis in Manhattan',
        rating: 4.7,
        cost: 0
      },
      {
        name: 'Empire State Building',
        type: 'landmark',
        description: 'Art Deco skyscraper with observation deck',
        rating: 4.4,
        cost: 37
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'John F. Kennedy International Airport',
        code: 'JFK'
      },
      publicTransport: 'good',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 7,
      notes: 'Generally safe, be cautious in certain areas at night'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9',
        caption: 'New York City skyline',
        isPrimary: true
      }
    ],
    tags: ['business', 'culture', 'food', 'entertainment'],
    popularity: 92,
    isActive: true
  },
  {
    name: 'Bangkok',
    country: 'Thailand',
    countryCode: 'THA',
    region: 'Central Thailand',
    coordinates: { lat: 13.7563, lng: 100.5018 },
    timezone: 'Asia/Bangkok',
    population: 10156000,
    costIndex: 35,
    currency: 'THB',
    languages: ['Thai', 'English'],
    climate: {
      type: 'tropical',
      averageTemp: { summer: 34, winter: 30 },
      rainfall: 'high'
    },
    attractions: [
      {
        name: 'Grand Palace',
        type: 'historical',
        description: 'Complex of buildings at the heart of Bangkok',
        rating: 4.4,
        cost: 15
      },
      {
        name: 'Wat Pho Temple',
        type: 'religious',
        description: 'Temple known for its giant reclining Buddha',
        rating: 4.5,
        cost: 3
      },
      {
        name: 'Floating Market',
        type: 'market',
        description: 'Traditional market on boats',
        rating: 4.2,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Suvarnabhumi Airport',
        code: 'BKK'
      },
      publicTransport: 'good',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 7,
      notes: 'Generally safe, watch for scams in tourist areas'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506665531195-3566af2b4dfa',
        caption: 'Grand Palace Bangkok',
        isPrimary: true
      }
    ],
    tags: ['culture', 'food', 'temples', 'shopping'],
    popularity: 85,
    isActive: true
  },
  {
    name: 'Barcelona',
    country: 'Spain',
    countryCode: 'ESP',
    region: 'Catalonia',
    coordinates: { lat: 41.3851, lng: 2.1734 },
    timezone: 'Europe/Madrid',
    population: 1620000,
    costIndex: 65,
    currency: 'EUR',
    languages: ['Spanish', 'Catalan', 'English'],
    climate: {
      type: 'mediterranean',
      averageTemp: { summer: 26, winter: 10 },
      rainfall: 'low'
    },
    attractions: [
      {
        name: 'Sagrada Familia',
        type: 'religious',
        description: 'Iconic basilica designed by Antoni Gaudí',
        rating: 4.7,
        cost: 26
      },
      {
        name: 'Park Güell',
        type: 'park',
        description: 'Colorful park with mosaic art',
        rating: 4.4,
        cost: 10
      },
      {
        name: 'Las Ramblas',
        type: 'street',
        description: 'Famous tree-lined pedestrian street',
        rating: 4.1,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Barcelona-El Prat Airport',
        code: 'BCN'
      },
      publicTransport: 'excellent',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 8,
      notes: 'Safe city, watch for pickpockets in crowded areas'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1539037116277-4db20889f2d4',
        caption: 'Sagrada Familia',
        isPrimary: true
      }
    ],
    tags: ['architecture', 'art', 'beach', 'food'],
    popularity: 88,
    isActive: true
  },
  {
    name: 'Dubai',
    country: 'United Arab Emirates',
    countryCode: 'ARE',
    region: 'Dubai',
    coordinates: { lat: 25.2048, lng: 55.2708 },
    timezone: 'Asia/Dubai',
    population: 3411000,
    costIndex: 70,
    currency: 'AED',
    languages: ['Arabic', 'English'],
    climate: {
      type: 'desert',
      averageTemp: { summer: 40, winter: 24 },
      rainfall: 'very low'
    },
    attractions: [
      {
        name: 'Burj Khalifa',
        type: 'landmark',
        description: 'World\'s tallest building',
        rating: 4.6,
        cost: 41
      },
      {
        name: 'Dubai Mall',
        type: 'shopping',
        description: 'One of the world\'s largest shopping malls',
        rating: 4.5,
        cost: 0
      },
      {
        name: 'Palm Jumeirah',
        type: 'landmark',
        description: 'Artificial archipelago',
        rating: 4.3,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Dubai International Airport',
        code: 'DXB'
      },
      publicTransport: 'good',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 9,
      notes: 'Very safe with low crime rates'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c',
        caption: 'Dubai skyline with Burj Khalifa',
        isPrimary: true
      }
    ],
    tags: ['luxury', 'shopping', 'modern', 'desert'],
    popularity: 82,
    isActive: true
  },
  {
    name: 'Sydney',
    country: 'Australia',
    countryCode: 'AUS',
    region: 'New South Wales',
    coordinates: { lat: -33.8688, lng: 151.2093 },
    timezone: 'Australia/Sydney',
    population: 5312000,
    costIndex: 80,
    currency: 'AUD',
    languages: ['English'],
    climate: {
      type: 'temperate',
      averageTemp: { summer: 26, winter: 17 },
      rainfall: 'moderate'
    },
    attractions: [
      {
        name: 'Sydney Opera House',
        type: 'landmark',
        description: 'Iconic performing arts venue',
        rating: 4.5,
        cost: 25
      },
      {
        name: 'Harbour Bridge',
        type: 'landmark',
        description: 'Steel through arch bridge',
        rating: 4.6,
        cost: 0
      },
      {
        name: 'Bondi Beach',
        type: 'beach',
        description: 'Famous beach with golden sand',
        rating: 4.4,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Kingsford Smith Airport',
        code: 'SYD'
      },
      publicTransport: 'good',
      metro: false,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 8,
      notes: 'Safe city with friendly locals'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4',
        caption: 'Sydney Opera House and Harbour Bridge',
        isPrimary: true
      }
    ],
    tags: ['beach', 'opera', 'harbor', 'wildlife'],
    popularity: 86,
    isActive: true
  },
  {
    name: 'Rome',
    country: 'Italy',
    countryCode: 'ITA',
    region: 'Lazio',
    coordinates: { lat: 41.9028, lng: 12.4964 },
    timezone: 'Europe/Rome',
    population: 2873000,
    costIndex: 70,
    currency: 'EUR',
    languages: ['Italian', 'English'],
    climate: {
      type: 'mediterranean',
      averageTemp: { summer: 28, winter: 8 },
      rainfall: 'moderate'
    },
    attractions: [
      {
        name: 'Colosseum',
        type: 'historical',
        description: 'Ancient Roman amphitheatre',
        rating: 4.6,
        cost: 18
      },
      {
        name: 'Vatican City',
        type: 'religious',
        description: 'Papal enclave with St. Peter\'s Basilica',
        rating: 4.7,
        cost: 17
      },
      {
        name: 'Trevi Fountain',
        type: 'landmark',
        description: 'Baroque fountain famous for coin tossing',
        rating: 4.5,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Leonardo da Vinci–Fiumicino Airport',
        code: 'FCO'
      },
      publicTransport: 'good',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 7,
      notes: 'Generally safe, watch for pickpockets near attractions'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b',
        caption: 'Roman Colosseum',
        isPrimary: true
      }
    ],
    tags: ['history', 'architecture', 'art', 'food'],
    popularity: 89,
    isActive: true
  },
  {
    name: 'Bali',
    country: 'Indonesia',
    countryCode: 'IDN',
    region: 'Bali',
    coordinates: { lat: -8.3405, lng: 115.0920 },
    timezone: 'Asia/Makassar',
    population: 4362000,
    costIndex: 30,
    currency: 'IDR',
    languages: ['Indonesian', 'Balinese', 'English'],
    climate: {
      type: 'tropical',
      averageTemp: { summer: 30, winter: 26 },
      rainfall: 'high'
    },
    attractions: [
      {
        name: 'Tanah Lot Temple',
        type: 'religious',
        description: 'Rock formation temple',
        rating: 4.3,
        cost: 5
      },
      {
        name: 'Ubud Rice Terraces',
        type: 'nature',
        description: 'Beautiful terraced rice fields',
        rating: 4.5,
        cost: 0
      },
      {
        name: 'Kuta Beach',
        type: 'beach',
        description: 'Popular surfing beach',
        rating: 4.1,
        cost: 0
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Ngurah Rai International Airport',
        code: 'DPS'
      },
      publicTransport: 'limited',
      metro: false,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 8,
      notes: 'Generally safe, be cautious with water activities'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1518548419970-58e3b4079ab2',
        caption: 'Tanah Lot Temple at sunset',
        isPrimary: true
      }
    ],
    tags: ['beach', 'temples', 'nature', 'wellness'],
    popularity: 84,
    isActive: true
  },
  {
    name: 'London',
    country: 'United Kingdom',
    countryCode: 'GBR',
    region: 'England',
    coordinates: { lat: 51.5074, lng: -0.1278 },
    timezone: 'Europe/London',
    population: 8982000,
    costIndex: 90,
    currency: 'GBP',
    languages: ['English'],
    climate: {
      type: 'temperate',
      averageTemp: { summer: 18, winter: 4 },
      rainfall: 'high'
    },
    attractions: [
      {
        name: 'Big Ben',
        type: 'landmark',
        description: 'Iconic clock tower',
        rating: 4.5,
        cost: 0
      },
      {
        name: 'British Museum',
        type: 'museum',
        description: 'World-famous museum of human history',
        rating: 4.7,
        cost: 0
      },
      {
        name: 'Tower Bridge',
        type: 'landmark',
        description: 'Victorian bascule bridge',
        rating: 4.4,
        cost: 11
      }
    ],
    transportation: {
      airport: {
        hasInternational: true,
        name: 'Heathrow Airport',
        code: 'LHR'
      },
      publicTransport: 'excellent',
      metro: true,
      bus: true,
      taxi: true
    },
    safety: {
      rating: 8,
      notes: 'Very safe with good emergency services'
    },
    images: [
      {
        url: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad',
        caption: 'Big Ben and Houses of Parliament',
        isPrimary: true
      }
    ],
    tags: ['history', 'culture', 'museums', 'royalty'],
    popularity: 91,
    isActive: true
  }
];

// Sample activities data
const activities = [
  // Paris Activities
  {
    name: 'Seine River Cruise',
    city: 'Paris',
    type: 'sightseeing',
    description: 'Scenic boat cruise along the Seine River with views of iconic landmarks',
    duration: 2,
    price: { min: 15, max: 25 },
    rating: 4.4,
    difficulty: 'easy',
    tags: ['romantic', 'sightseeing', 'relaxing'],
    images: ['https://images.unsplash.com/photo-1502602898536-47ad22581b52'],
    location: { lat: 48.8566, lng: 2.3522 },
    isActive: true
  },
  {
    name: 'Cooking Class in Montmartre',
    city: 'Paris',
    type: 'culinary',
    description: 'Learn to cook traditional French cuisine in a charming Montmartre kitchen',
    duration: 4,
    price: { min: 80, max: 120 },
    rating: 4.6,
    difficulty: 'moderate',
    tags: ['cooking', 'local culture', 'food'],
    images: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136'],
    location: { lat: 48.8867, lng: 2.3431 },
    isActive: true
  },
  // Tokyo Activities
  {
    name: 'Traditional Tea Ceremony',
    city: 'Tokyo',
    type: 'cultural',
    description: 'Experience authentic Japanese tea ceremony in a traditional setting',
    duration: 3,
    price: { min: 40, max: 60 },
    rating: 4.5,
    difficulty: 'easy',
    tags: ['culture', 'traditional', 'meditation'],
    images: ['https://images.unsplash.com/photo-1564594985645-4427056e22d2'],
    location: { lat: 35.6762, lng: 139.6503 },
    isActive: true
  },
  {
    name: 'Robot Restaurant Show',
    city: 'Tokyo',
    type: 'entertainment',
    description: 'Spectacular robot show with lights, music, and performances',
    duration: 2,
    price: { min: 50, max: 80 },
    rating: 4.2,
    difficulty: 'easy',
    tags: ['entertainment', 'unique', 'technology'],
    images: ['https://images.unsplash.com/photo-1540959733332-eab4deabeeaf'],
    location: { lat: 35.6938, lng: 139.7034 },
    isActive: true
  },
  // New York Activities
  {
    name: 'Broadway Show',
    city: 'New York',
    type: 'entertainment',
    description: 'World-class musical or play in the heart of Broadway',
    duration: 3,
    price: { min: 100, max: 300 },
    rating: 4.7,
    difficulty: 'easy',
    tags: ['theater', 'entertainment', 'culture'],
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d'],
    location: { lat: 40.7590, lng: -73.9845 },
    isActive: true
  },
  {
    name: 'Central Park Bike Tour',
    city: 'New York',
    type: 'outdoor',
    description: 'Guided bicycle tour through Central Park\'s scenic routes',
    duration: 2,
    price: { min: 30, max: 50 },
    rating: 4.3,
    difficulty: 'moderate',
    tags: ['outdoor', 'exercise', 'nature'],
    images: ['https://images.unsplash.com/photo-1519477817-19ecdeb62722'],
    location: { lat: 40.7829, lng: -73.9654 },
    isActive: true
  },
  // Bangkok Activities
  {
    name: 'Thai Cooking Class',
    city: 'Bangkok',
    type: 'culinary',
    description: 'Learn to cook authentic Thai dishes in a local market and kitchen',
    duration: 5,
    price: { min: 35, max: 55 },
    rating: 4.6,
    difficulty: 'moderate',
    tags: ['cooking', 'local culture', 'spicy food'],
    images: ['https://images.unsplash.com/photo-1504674900247-0877df9cc836'],
    location: { lat: 13.7563, lng: 100.5018 },
    isActive: true
  },
  {
    name: 'Floating Market Tour',
    city: 'Bangkok',
    type: 'cultural',
    description: 'Explore traditional floating markets by boat',
    duration: 4,
    price: { min: 25, max: 40 },
    rating: 4.2,
    difficulty: 'easy',
    tags: ['culture', 'markets', 'boats'],
    images: ['https://images.unsplash.com/photo-1506665531195-3566af2b4dfa'],
    location: { lat: 13.7199, lng: 100.1746 },
    isActive: true
  },
  // Barcelona Activities
  {
    name: 'Gaudí Architecture Tour',
    city: 'Barcelona',
    type: 'cultural',
    description: 'Guided tour of Antoni Gaudí\'s masterpieces including Sagrada Familia',
    duration: 6,
    price: { min: 60, max: 90 },
    rating: 4.7,
    difficulty: 'moderate',
    tags: ['architecture', 'art', 'walking'],
    images: ['https://images.unsplash.com/photo-1539037116277-4db20889f2d4'],
    location: { lat: 41.4036, lng: 2.1744 },
    isActive: true
  },
  {
    name: 'Flamenco Show with Dinner',
    city: 'Barcelona',
    type: 'entertainment',
    description: 'Traditional flamenco performance with authentic Spanish cuisine',
    duration: 3,
    price: { min: 70, max: 110 },
    rating: 4.5,
    difficulty: 'easy',
    tags: ['entertainment', 'culture', 'dinner'],
    images: ['https://images.unsplash.com/photo-1547036967-23d11aacaee0'],
    location: { lat: 41.3851, lng: 2.1734 },
    isActive: true
  },
  // Dubai Activities
  {
    name: 'Desert Safari',
    city: 'Dubai',
    type: 'adventure',
    description: 'Thrilling desert adventure with dune bashing and camel riding',
    duration: 6,
    price: { min: 60, max: 100 },
    rating: 4.4,
    difficulty: 'moderate',
    tags: ['adventure', 'desert', 'cultural show'],
    images: ['https://images.unsplash.com/photo-1451337516015-6b6e9a44a8a3'],
    location: { lat: 25.0657, lng: 55.1713 },
    isActive: true
  },
  {
    name: 'Burj Khalifa Sky Deck',
    city: 'Dubai',
    type: 'sightseeing',
    description: 'Visit the observation deck of the world\'s tallest building',
    duration: 2,
    price: { min: 40, max: 80 },
    rating: 4.6,
    difficulty: 'easy',
    tags: ['views', 'iconic', 'photography'],
    images: ['https://images.unsplash.com/photo-1512453979798-5ea266f8880c'],
    location: { lat: 25.1972, lng: 55.2744 },
    isActive: true
  },
  // Sydney Activities
  {
    name: 'Harbour Bridge Climb',
    city: 'Sydney',
    type: 'adventure',
    description: 'Climb to the top of Sydney Harbour Bridge for panoramic views',
    duration: 3,
    price: { min: 150, max: 250 },
    rating: 4.8,
    difficulty: 'challenging',
    tags: ['adventure', 'views', 'iconic'],
    images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4'],
    location: { lat: -33.8523, lng: 151.2108 },
    isActive: true
  },
  {
    name: 'Blue Mountains Day Trip',
    city: 'Sydney',
    type: 'nature',
    description: 'Full day tour to the Blue Mountains with scenic railway',
    duration: 8,
    price: { min: 100, max: 150 },
    rating: 4.5,
    difficulty: 'moderate',
    tags: ['nature', 'day trip', 'scenic'],
    images: ['https://images.unsplash.com/photo-1544966503-7cc5ac882d5f'],
    location: { lat: -33.7123, lng: 150.3119 },
    isActive: true
  },
  // Rome Activities
  {
    name: 'Gladiator School Experience',
    city: 'Rome',
    type: 'cultural',
    description: 'Learn gladiator fighting techniques in ancient Roman style',
    duration: 2,
    price: { min: 50, max: 80 },
    rating: 4.3,
    difficulty: 'moderate',
    tags: ['history', 'interactive', 'unique'],
    images: ['https://images.unsplash.com/photo-1515542622106-78bda8ba0e5b'],
    location: { lat: 41.8902, lng: 12.4922 },
    isActive: true
  },
  {
    name: 'Vatican Museums Private Tour',
    city: 'Rome',
    type: 'cultural',
    description: 'Skip-the-line private tour of Vatican Museums and Sistine Chapel',
    duration: 4,
    price: { min: 120, max: 200 },
    rating: 4.7,
    difficulty: 'easy',
    tags: ['art', 'history', 'religious'],
    images: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96'],
    location: { lat: 41.9029, lng: 12.4534 },
    isActive: true
  },
  // Bali Activities
  {
    name: 'Volcano Sunrise Hike',
    city: 'Bali',
    type: 'adventure',
    description: 'Early morning hike to Mount Batur for spectacular sunrise views',
    duration: 8,
    price: { min: 40, max: 70 },
    rating: 4.6,
    difficulty: 'challenging',
    tags: ['hiking', 'sunrise', 'nature'],
    images: ['https://images.unsplash.com/photo-1518548419970-58e3b4079ab2'],
    location: { lat: -8.2425, lng: 115.3751 },
    isActive: true
  },
  {
    name: 'Traditional Balinese Spa',
    city: 'Bali',
    type: 'wellness',
    description: 'Relaxing spa treatment with traditional Balinese massage',
    duration: 3,
    price: { min: 30, max: 60 },
    rating: 4.5,
    difficulty: 'easy',
    tags: ['relaxation', 'wellness', 'traditional'],
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b'],
    location: { lat: -8.3405, lng: 115.0920 },
    isActive: true
  },
  // London Activities
  {
    name: 'Thames River Cruise',
    city: 'London',
    type: 'sightseeing',
    description: 'Scenic cruise along the Thames with commentary on landmarks',
    duration: 2,
    price: { min: 20, max: 35 },
    rating: 4.3,
    difficulty: 'easy',
    tags: ['sightseeing', 'relaxing', 'historic'],
    images: ['https://images.unsplash.com/photo-1513635269975-59663e0ac1ad'],
    location: { lat: 51.5074, lng: -0.1278 },
    isActive: true
  },
  {
    name: 'Afternoon Tea Experience',
    city: 'London',
    type: 'culinary',
    description: 'Traditional British afternoon tea in an elegant setting',
    duration: 2,
    price: { min: 40, max: 80 },
    rating: 4.4,
    difficulty: 'easy',
    tags: ['tradition', 'food', 'elegant'],
    images: ['https://images.unsplash.com/photo-1571091718767-18b5b1457add'],
    location: { lat: 51.5074, lng: -0.1278 },
    isActive: true
  }
];

// Sample users data
const users = [
  {
    name: 'John Doe',
    email: 'john@example.com',
    password: 'password123',
    bio: 'Travel enthusiast and adventure seeker',
    preferences: {
      language: 'en',
      currency: 'USD',
      theme: 'light'
    },
    savedDestinations: [],
    travelHistory: [],
    isVerified: true,
    role: 'user'
  },
  {
    name: 'Jane Smith',
    email: 'jane@example.com',
    password: 'password123',
    bio: 'Cultural explorer and food lover',
    preferences: {
      language: 'en',
      currency: 'EUR',
      theme: 'dark'
    },
    savedDestinations: [],
    travelHistory: [],
    isVerified: true,
    role: 'user'
  },
  {
    name: 'Travel Admin',
    email: 'admin@globetrotter.com',
    password: 'admin123',
    bio: 'GlobeTrotter platform administrator',
    preferences: {
      language: 'en',
      currency: 'USD',
      theme: 'light'
    },
    savedDestinations: [],
    travelHistory: [],
    isVerified: true,
    role: 'admin'
  }
];

// Sample trips data
const trips = [
  {
    title: 'European Adventure',
    description: 'A 2-week journey through the cultural capitals of Europe',
    destinations: ['Paris', 'Barcelona', 'Rome'],
    startDate: new Date('2024-06-01'),
    endDate: new Date('2024-06-14'),
    budget: 3500,
    currency: 'EUR',
    travelerCount: 2,
    status: 'planned',
    isPublic: true,
    tags: ['culture', 'history', 'food'],
    itinerary: [
      {
        day: 1,
        date: new Date('2024-06-01'),
        city: 'Paris',
        activities: ['Eiffel Tower', 'Seine River Cruise'],
        accommodation: 'Hotel Le Marais',
        notes: 'Arrival day - light sightseeing'
      },
      {
        day: 8,
        date: new Date('2024-06-08'),
        city: 'Barcelona',
        activities: ['Sagrada Familia', 'Gaudí Architecture Tour'],
        accommodation: 'Hotel Barcelona',
        notes: 'Focus on Gaudí architecture'
      }
    ],
    expenses: [
      {
        category: 'accommodation',
        amount: 1200,
        description: 'Hotels for 14 nights'
      },
      {
        category: 'transportation',
        amount: 800,
        description: 'Flights and trains'
      }
    ]
  },
  {
    title: 'Asian Discovery',
    description: 'Exploring the vibrant cultures of Asia',
    destinations: ['Tokyo', 'Bangkok', 'Bali'],
    startDate: new Date('2024-09-15'),
    endDate: new Date('2024-09-30'),
    budget: 4000,
    currency: 'USD',
    travelerCount: 1,
    status: 'planning',
    isPublic: false,
    tags: ['culture', 'food', 'temples'],
    itinerary: [],
    expenses: []
  }
];

// Database connection and seeding
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter');
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Trip.deleteMany({});
    await City.deleteMany({});
    await Activity.deleteMany({});
    console.log('Cleared existing data');

    // Create cities
    const createdCities = await City.insertMany(cities);
    console.log(`Created ${createdCities.length} cities`);

    // Create activities
    const createdActivities = await Activity.insertMany(activities);
    console.log(`Created ${createdActivities.length} activities`);

    // Hash passwords and create users
    const hashedUsers = await Promise.all(
      users.map(async (user) => ({
        ...user,
        password: await bcrypt.hash(user.password, 12)
      }))
    );
    const createdUsers = await User.insertMany(hashedUsers);
    console.log(`Created ${createdUsers.length} users`);

    // Associate trips with users and create trips
    const tripsWithUsers = trips.map((trip, index) => ({
      ...trip,
      user: createdUsers[index % createdUsers.length]._id,
      destinations: trip.destinations.map(destName => 
        createdCities.find(city => city.name === destName)?._id
      ).filter(Boolean)
    }));
    const createdTrips = await Trip.insertMany(tripsWithUsers);
    console.log(`Created ${createdTrips.length} trips`);

    console.log('\n🎉 Database seeded successfully!');
    console.log('\nSample data created:');
    console.log(`- ${createdCities.length} cities`);
    console.log(`- ${createdUsers.length} users`);
    console.log(`- ${createdTrips.length} trips`);
    console.log(`- ${createdActivities.length} activities`);

    console.log('\n👤 Sample user credentials:');
    createdUsers.forEach(user => {
      console.log(`📧 Email: ${user.email}`);
      console.log(`🔑 Password: password123`);
      console.log(`👤 Role: ${user.role}`);
      console.log('---');
    });

    console.log('\n🏙️ Cities available:');
    createdCities.forEach(city => {
      console.log(`- ${city.name}, ${city.country} (${city.tags.join(', ')})`);
    });

  } catch (error) {
    console.error('❌ Error seeding database:', error);
  } finally {
    await mongoose.disconnect();
    console.log('✅ Disconnected from MongoDB');
  }
};

// Run the seed function
if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase };
