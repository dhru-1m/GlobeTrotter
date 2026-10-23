const { GoogleGenAI } = require('@google/genai');

class GeminiService {
  constructor() {
    // Multi-key setup (comma separated GEMINI_API_KEYS has priority over single GEMINI_API_KEY)
    const multi = process.env.GEMINI_API_KEYS;
    const single = process.env.GEMINI_API_KEY;
    this.clients = [];
    this.modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

    if (multi) {
      const keys = multi.split(',').map(k => k.trim()).filter(Boolean);
      keys.forEach((key, idx) => {
        try {
          const ai = new GoogleGenAI({ apiKey: key });
          this.clients.push(ai);
        } catch (e) {
          console.warn(`⚠️ Gemini key index ${idx} init failed:`, e.message);
        }
      });
      console.log(`GeminiService: initialized ${this.clients.length} client instance(s) from GEMINI_API_KEYS with model ${this.modelName}`);
    } else if (single) {
      try {
        const ai = new GoogleGenAI({ apiKey: single });
        this.clients = [ai];
        console.log(`GeminiService: initialized single Gemini client instance with model ${this.modelName}`);
      } catch (e) {
        console.warn('⚠️ Failed to init Gemini client with GEMINI_API_KEY:', e.message);
      }
    } else {
      console.warn('⚠️ No Gemini API key(s) provided (GEMINI_API_KEYS or GEMINI_API_KEY)');
    }
    this.clientIndex = 0;

    // Simple in-memory caches (optional future use)
    this.cityCache = new Map();
    this.attractionCache = new Map();
    this.cacheTTL = parseInt(process.env.GEMINI_CACHE_TTL_MS) || 30 * 60 * 1000;

    // Concurrency queue ("multi-threading" simulation)
    this.maxConcurrency = Math.max(1, parseInt(process.env.GEMINI_MAX_CONCURRENCY) || this.clients.length || 1);
    this.currentRunning = 0;
    this.queue = [];
  }

  get models() {
    return this.clients;
  }

  getClient() {
    if (!this.clients.length) return null;
    const client = this.clients[this.clientIndex % this.clients.length];
    this.clientIndex = (this.clientIndex + 1) % this.clients.length;
    return client;
  }

  getModel() {
    return this.getClient();
  }

  _enqueue(fn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this._drain();
    });
  }

  _drain() {
    while (this.currentRunning < this.maxConcurrency && this.queue.length) {
      const task = this.queue.shift();
      this.currentRunning++;
      Promise.resolve()
        .then(task.fn)
        .then(res => { this.currentRunning--; task.resolve(res); this._drain(); })
        .catch(err => { this.currentRunning--; task.reject(err); this._drain(); });
    }
  }

  async _generate(prompt) {
    const client = this.getClient();
    if (!client) throw new Error('Gemini API not configured');

    const candidateModels = Array.from(new Set([
      this.modelName,
      'gemini-2.5-flash'
    ].filter(Boolean)));

    return this._enqueue(async () => {
      let lastError = null;
      for (const m of candidateModels) {
        try {
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout after 30s for model ${m}`)), 30000)
          );
          const response = await Promise.race([
            client.models.generateContent({
              model: m,
              contents: prompt
            }),
            timeoutPromise
          ]);
          if (response && response.text) {
            this.modelName = m;
            return response.text;
          }
        } catch (err) {
          lastError = err;
          console.warn(`⚠️ Model ${m} request failed (${err.status || err.message?.slice(0, 80)}).`);
          if (err.status === 503 || (err.message && err.message.includes('503'))) {
            try {
              console.log('Retrying after temporary 503 spike...');
              await new Promise(r => setTimeout(r, 2000));
              const retryResp = await client.models.generateContent({
                model: m,
                contents: prompt
              });
              if (retryResp && retryResp.text) {
                this.modelName = m;
                return retryResp.text;
              }
            } catch (retryErr) {
              lastError = retryErr;
            }
          }
        }
      }
      throw lastError || new Error('Failed to generate content from Gemini models');
    });
  }

  async generateCityRecommendations(preferences) {
  // Multi-key path
  if (!this.models.length) throw new Error('Gemini API not configured');

    const { budget, interests, duration, startLocation, travelStyle } = preferences;
    
    const prompt = `As a travel expert, recommend 5-8 cities for a ${duration}-day trip with the following preferences:
    - Budget: ${budget}
    - Interests: ${interests?.join(', ') || 'general travel'}
    - Starting from: ${startLocation || 'flexible'}
    - Travel style: ${travelStyle || 'balanced'}
    
    For each city, provide:
    1. City name and country
    2. Estimated daily cost (USD)
    3. Best activities (3-4 items)
    4. Best time to visit
    5. Why it matches their preferences
    6. Suggested duration of stay
    
    Format as JSON array with this structure:
    {
      "recommendations": [
        {
          "city": "City Name",
          "country": "Country",
          "dailyCost": 50,
          "activities": ["Activity 1", "Activity 2", "Activity 3"],
          "bestTime": "March-May",
          "reasoning": "Why this city matches",
          "suggestedDays": 3,
          "highlights": ["Highlight 1", "Highlight 2"]
        }
      ]
    }`;

    try {
  const text = await this._generate(prompt);
      
      // Extract JSON from the response
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback if no JSON found
      return { recommendations: [], rawResponse: text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate recommendations');
    }
  }

  async generateItinerary(cities, preferences) {
  if (!this.models.length) throw new Error('Gemini AI not configured');

    const { duration, budget, interests, travelPace } = preferences;
    
    const prompt = `Create a detailed ${duration}-day itinerary for these cities: ${cities.map(c => `${c.name}, ${c.country}`).join('; ')}.
    
    Preferences:
    - Total budget: ${budget}
    - Interests: ${interests?.join(', ') || 'general tourism'}
    - Travel pace: ${travelPace || 'moderate'}
    
    For each day, include:
    1. Location/city
    2. Morning activity (9 AM - 12 PM)
    3. Afternoon activity (1 PM - 5 PM)
    4. Evening activity (6 PM - 9 PM)
    5. Estimated daily cost
    6. Transportation details
    7. Accommodation suggestions
    
    Format as JSON:
    {
      "itinerary": [
        {
          "day": 1,
          "date": "2024-XX-XX",
          "city": "City Name",
          "activities": [
            {
              "time": "9:00 AM",
              "title": "Activity Title",
              "description": "Activity description",
              "cost": 25,
              "duration": "3 hours",
              "category": "sightseeing"
            }
          ],
          "transportation": "Details about getting around",
          "accommodation": "Hotel/area suggestions",
          "totalCost": 75
        }
      ],
      "totalEstimatedCost": 1500,
      "tips": ["Tip 1", "Tip 2"]
    }`;

    try {
  const text = await this._generate(prompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { itinerary: [], rawResponse: text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate itinerary');
    }
  }

  async generateActivityRecommendations(city, preferences) {
  if (!this.models.length) throw new Error('Gemini AI not configured');

    const { interests, budget, duration, travelStyle } = preferences;
    
    const prompt = `Recommend activities in ${city.name}, ${city.country} for ${duration} days.
    
    Preferences:
    - Interests: ${interests?.join(', ') || 'general tourism'}
    - Daily budget: ${budget}
    - Travel style: ${travelStyle || 'balanced'}
    
    Provide 10-15 activities with:
    1. Activity name
    2. Category (sightseeing, food, adventure, culture, nightlife, shopping, nature)
    3. Cost estimate (USD)
    4. Duration
    5. Description
    6. Best time to visit
    7. Difficulty level (easy, moderate, challenging)
    
    Format as JSON:
    {
      "activities": [
        {
          "name": "Activity Name",
          "category": "sightseeing",
          "cost": 15,
          "duration": "2-3 hours",
          "description": "Activity description",
          "bestTime": "Morning",
          "difficulty": "easy",
          "rating": 4.5,
          "tips": ["Tip 1", "Tip 2"]
        }
      ]
    }`;

    try {
  const text = await this._generate(prompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { activities: [], rawResponse: text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate activity recommendations');
    }
  }

  async generateBudgetBreakdown(tripDetails) {
  if (!this.models.length) throw new Error('Gemini AI not configured');

    const { cities, duration, travelStyle, groupSize } = tripDetails;
    
    const prompt = `Create a detailed budget breakdown for a ${duration}-day trip to: ${cities.map(c => c.name).join(', ')}.
    
    Details:
    - Travel style: ${travelStyle || 'mid-range'}
    - Group size: ${groupSize || 1} person(s)
    - Duration: ${duration} days
    
    Provide breakdown for:
    1. Accommodation (per night)
    2. Food (breakfast, lunch, dinner)
    3. Transportation (flights, local transport)
    4. Activities and attractions
    5. Shopping and miscellaneous
    6. Emergency fund (10-15%)
    
    Format as JSON:
    {
      "budgetBreakdown": {
        "accommodation": {
          "perNight": 80,
          "totalNights": 7,
          "total": 560
        },
        "food": {
          "breakfast": 15,
          "lunch": 25,
          "dinner": 40,
          "dailyTotal": 80,
          "total": 560
        },
        "transportation": {
          "flights": 400,
          "localTransport": 200,
          "total": 600
        },
        "activities": {
          "attractions": 300,
          "tours": 200,
          "total": 500
        },
        "miscellaneous": {
          "shopping": 200,
          "emergencyFund": 240,
          "total": 440
        }
      },
      "grandTotal": 2660,
      "dailyAverage": 380,
      "tips": ["Budget tip 1", "Budget tip 2"]
    }`;

    try {
  const text = await this._generate(prompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      return { budgetBreakdown: {}, rawResponse: text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate budget breakdown');
    }
  }

  getFallbackAttractions(cityName) {
    const c = (cityName || '').toLowerCase().trim();
    const db = {
      'mumbai': [
        { name: 'Gateway of India', type: 'landmark', description: 'Iconic 26m basalt arch monument built in 1924 overlooking the Arabian Sea in Colaba.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Early morning or sunset', visitDuration: '1-2 hours', highlights: ['Arabian Sea views', 'Indo-Saracenic design', 'Elephanta ferry'], rating: 4.8 },
        { name: 'Marine Drive & Chowpatty Beach', type: 'beach', description: 'Famous 3.6km coastal promenade known as the Queen\'s Necklace offering panoramic ocean sunsets.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Evenings 5 PM - 8 PM', visitDuration: '1-2 hours', highlights: ['Queen\'s Necklace lights', 'Street food', 'Sea breeze'], rating: 4.7 },
        { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', type: 'historical', description: 'UNESCO World Heritage Victorian Gothic railway hub featuring gargoyles, turrets and stained glass.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning or night illumination', visitDuration: '1 hour', highlights: ['Gothic revival architecture', 'UNESCO Heritage', 'Historic central dome'], rating: 4.8 },
        { name: 'Elephanta Caves', type: 'historical', description: 'UNESCO rock-cut cave temples dedicated to Lord Shiva on Elephanta Island dating to the 5th century.', cost: 40, costCurrency: 'INR', bestTimeToVisit: 'November to February', visitDuration: '3-4 hours', highlights: ['Trimurti sculpture', 'Ancient rock carvings', 'Ferry ride'], rating: 4.6 },
        { name: 'Haji Ali Dargah', type: 'cultural', description: 'Historic floating mosque and tomb situated on an islet 500m into the Arabian Sea.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Low tide afternoon', visitDuration: '1-2 hours', highlights: ['Causeway walk', 'Indo-Islamic architecture', 'Spiritual atmosphere'], rating: 4.6 },
        { name: 'Bandra-Worli Sea Link & Bandstand', type: 'landmark', description: 'Spectacular 8-lane cable-stayed bridge and nearby rocky coastal promenade in Bandra.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Sunset or late evening', visitDuration: '1-2 hours', highlights: ['Engineering marvel', 'Castella de Aguada', 'Arabian Sea breeze'], rating: 4.7 },
        { name: 'Siddhivinayak Temple', type: 'cultural', description: 'Famed Hindu temple dedicated to Lord Ganesha in Prabhadevi, visited by thousands of pilgrims.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Early morning', visitDuration: '1-2 hours', highlights: ['Gold-plated sanctuary', 'Historic shrine', 'Prabhadevi neighborhood'], rating: 4.8 },
        { name: 'Sanjay Gandhi National Park & Kanheri Caves', type: 'nature', description: 'Expansive protected forest within city limits containing 109 ancient Buddhist rock-cut caves.', cost: 85, costCurrency: 'INR', bestTimeToVisit: 'Morning 8 AM - 12 PM', visitDuration: '3-5 hours', highlights: ['Kanheri Caves', 'Tiger safari', 'Lush forest cycling'], rating: 4.5 },
        { name: 'Colaba Causeway & Leopold Cafe', type: 'shopping', description: 'Bustling bazaar famous for antiques, fashion, handicrafts, and historic cosmopolitan cafes.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Afternoon 2 PM - 6 PM', visitDuration: '2-3 hours', highlights: ['Street shopping', 'Leopold Cafe', 'Heritage architecture'], rating: 4.5 },
        { name: 'Juhu Beach', type: 'beach', description: 'Lively sprawling beach famous for Mumbai street delicacies like Pav Bhaji and Bhel Puri.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Evenings 5 PM - 8 PM', visitDuration: '1-2 hours', highlights: ['Chowpatty snacks', 'Sunset view', 'Celebrity neighborhood'], rating: 4.4 }
      ],
      'manali': [
        { name: 'Solang Valley Adventure Arena', type: 'adventure', description: 'High-altitude adventure hub famous for paragliding, zorbing, skiing, and cable car ropeway.', cost: 500, costCurrency: 'INR', bestTimeToVisit: 'Morning 9 AM - 2 PM', visitDuration: '3-4 hours', highlights: ['Tandem paragliding', 'Snow slopes', 'Ropeway ride'], rating: 4.8 },
        { name: 'Rohtang Pass', type: 'nature', description: 'Scenic mountain pass at 3,978m connecting Kullu with Lahaul and Spiti offering sweeping glaciers.', cost: 550, costCurrency: 'INR', bestTimeToVisit: 'May to October', visitDuration: '4-6 hours', highlights: ['Glacial snow views', 'Pristine Himalayan peaks', 'High pass drive'], rating: 4.9 },
        { name: 'Hadimba Devi Temple', type: 'cultural', description: 'Ancient 4-tier wooden pagoda temple built in 1553 set amid towering deodar cedar forests.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning 8 AM - 11 AM', visitDuration: '1-2 hours', highlights: ['Intricate wood carving', 'Sacred deodar forest', 'Historic temple'], rating: 4.7 },
        { name: 'Old Manali Village & Cafes', type: 'cultural', description: 'Charming Bohemian quarter with wooden houses, apple orchards, live acoustic music, and world bistros.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Afternoon to late evening', visitDuration: '2-4 hours', highlights: ['Apple orchards', 'Riverside cafes', 'Artisan boutiques'], rating: 4.7 },
        { name: 'Jogini Waterfalls Trek', type: 'nature', description: 'Scenic nature trail through pine forests and apple orchards ending at dramatic cascading waterfalls.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning 9 AM - 1 PM', visitDuration: '2-3 hours', highlights: ['Forest hiking trail', 'Panoramic valley views', 'Natural mountain cascade'], rating: 4.8 },
        { name: 'Atal Tunnel & Sissu Excursion', type: 'landmark', description: 'World\'s longest highway tunnel above 10,000 feet leading to the breathtaking landscape of Lahaul.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Day trip 9 AM - 4 PM', visitDuration: '4-5 hours', highlights: ['Engineering marvel', 'Sissu waterfall', 'Dramatic desert mountains'], rating: 4.9 },
        { name: 'Vashisht Hot Water Springs & Temple', type: 'relaxation', description: 'Natural sulfur thermal baths and ancient temple dedicated to sage Vashishta with scenic mountain views.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning 7 AM - 10 AM', visitDuration: '1-2 hours', highlights: ['Natural sulfur springs', 'Traditional wood temple', 'Beas valley vista'], rating: 4.5 },
        { name: 'Manu Temple', type: 'historical', description: 'Historic tiered shrine believed to be the only Indian temple dedicated to the primordial lawgiver Manu.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning or late afternoon', visitDuration: '1 hour', highlights: ['Spiritual heritage', 'Old Manali vantage', 'Traditional architecture'], rating: 4.6 },
        { name: 'Mall Road & Tibetan Monasteries', type: 'shopping', description: 'Pedestrian-only bustling main street featuring Himalayan handicrafts, woolen shawls, and monasteries.', cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Evening 5 PM - 9 PM', visitDuration: '2-3 hours', highlights: ['Kullu shawls', 'Tibetan handicrafts', 'Local trout & street food'], rating: 4.5 },
        { name: 'Beas River Rafting Point', type: 'adventure', description: 'Thrilling grade II and III whitewater rafting along the turbulent glacial waters of the Beas River.', cost: 800, costCurrency: 'INR', bestTimeToVisit: '10 AM - 3 PM', visitDuration: '2 hours', highlights: ['Whitewater rapids', 'Snow-capped river banks', 'Adrenaline rush'], rating: 4.7 }
      ]
    };
    if (db[c]) return db[c];

    // Dynamic fallback for any other city
    return [
      { name: `${cityName} Old Town & Heritage Center`, type: 'landmark', description: `Explore the historic heart and vibrant heritage sites of ${cityName}.`, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning', visitDuration: '2-3 hours', highlights: ['Historic architecture', 'Local culture', 'Photography'], rating: 4.6 },
      { name: `${cityName} Central Park & Botanical Gardens`, type: 'nature', description: `Beautiful green sanctuary offering scenic walking trails and native flora in ${cityName}.`, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning 8 AM - 11 AM', visitDuration: '1-2 hours', highlights: ['Botanical displays', 'Peaceful trails', 'Fresh air'], rating: 4.5 },
      { name: `${cityName} Grand Museum of Art & History`, type: 'historical', description: `Comprehensive museum showcasing ancient artifacts and regional history of ${cityName}.`, cost: 50, costCurrency: 'INR', bestTimeToVisit: 'Afternoon 1 PM - 4 PM', visitDuration: '2-3 hours', highlights: ['Artifacts', 'Guided tours', 'Art collections'], rating: 4.7 },
      { name: `${cityName} Sunset Viewpoint`, type: 'nature', description: `Panoramic mountain and skyline viewpoint offering magnificent golden hour sunsets.`, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Evening 5 PM - 7 PM', visitDuration: '1 hour', highlights: ['Panoramic views', 'Sunset photography', 'Cool breeze'], rating: 4.8 },
      { name: `${cityName} Traditional Bazaar & Food Street`, type: 'food', description: `Bustling market hub known for regional delicacies, artisan crafts, and local street eats.`, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Evening 6 PM - 9 PM', visitDuration: '2 hours', highlights: ['Street food', 'Local handicrafts', 'Lively vibe'], rating: 4.5 }
    ];
  }

  getFallbackCityData(cityName) {
    const isIndia = ['delhi', 'mumbai', 'manali', 'goa', 'jaipur', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'agra', 'varanasi', 'shimla', 'rishikesh', 'udaipur', 'amritsar', 'kerala'].includes(cityName.toLowerCase().trim());
    const attractions = this.getFallbackAttractions(cityName);
    return {
      _id: `ai_city_${Date.now()}`,
      name: cityName.charAt(0).toUpperCase() + cityName.slice(1),
      country: isIndia ? 'India' : 'International',
      countryCode: isIndia ? 'IND' : 'USA',
      region: isIndia ? 'State' : 'Region',
      coordinates: { lat: 19.076, lng: 72.8777 },
      timezone: isIndia ? 'Asia/Kolkata' : 'UTC',
      population: 1500000,
      costIndex: isIndia ? 35 : 65,
      currency: isIndia ? 'INR' : 'USD',
      languages: isIndia ? ['Hindi', 'English'] : ['English'],
      climate: {
        type: isIndia ? 'tropical' : 'temperate',
        averageTemp: { summer: 32, winter: 20 },
        rainfall: 'moderate'
      },
      attractions: attractions.map((a, i) => ({
        ...a,
        _id: `ai_attr_${Date.now()}_${i}`
      })),
      transportation: {
        airport: { hasInternational: true, name: `${cityName} International Airport`, code: 'APT' },
        publicTransport: 'good',
        metro: true,
        bus: true,
        taxi: true
      },
      safety: { rating: 8, notes: 'Safe for tourists, standard travel precautions apply.' },
      images: [
        { url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800', caption: cityName, isPrimary: true }
      ],
      tags: ['heritage', 'culture', 'sightseeing', 'travel'],
      popularity: 85,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  }

  async generateCityData(cityName, opts = {}) {
    if (!this.models.length) return this.getFallbackCityData(cityName);
    const retryCount = opts.retryCount || 0;
    const extra = retryCount > 0 ? `\nEnsure all 10 attractions are unique, real, well-known, and avoid placeholder names.\n` : '';

    const prompt = `Generate comprehensive data for the city "${cityName}" in the following JSON format. Use real, accurate information and include EXACTLY 10 ATTRACTIONS with detailed descriptions, costs, and ratings:${extra}

    {
      "name": "City Name",
      "country": "Country Name",
      "countryCode": "3-letter ISO code",
      "region": "State/Province/Region",
      "coordinates": {
        "lat": 0.0,
        "lng": 0.0
      },
      "timezone": "Timezone",
      "population": 0,
      "costIndex": 0,
      "currency": "Currency code",
      "languages": ["Language1", "Language2"],
      "climate": {
        "type": "climate type (tropical, dry, temperate, continental, polar)",
        "averageTemp": {
          "summer": 0,
          "winter": 0
        },
        "rainfall": "low, moderate, or high"
      },
      "attractions": [
        {
          "name": "Attraction name",
          "type": "landmark, museum, park, beach, mountain, shopping, entertainment, cultural, historical, or natural",
          "description": "Detailed description of the attraction",
          "rating": 0.0,
          "cost": 0,
          "costCurrency": "INR or USD",
          "bestTimeToVisit": "Best time to visit this attraction",
          "visitDuration": "Recommended time to spend (e.g., 2-3 hours)",
          "highlights": ["Key highlight 1", "Key highlight 2", "Key highlight 3"]
        }
      ],
      "transportation": {
        "airport": {
          "hasInternational": true,
          "name": "Airport name",
          "code": "Airport code"
        },
        "publicTransport": "excellent, good, fair, or poor",
        "metro": true,
        "bus": true,
        "taxi": true
      },
      "safety": {
        "rating": 8,
        "notes": "Safety notes"
      },
      "images": [
        {
          "url": "https://images.unsplash.com/photo-example",
          "caption": "Image caption",
          "isPrimary": true
        }
      ],
      "tags": ["tag1", "tag2", "tag3"],
      "popularity": 80,
      "isActive": true
    }

    CRITICAL REQUIREMENTS:
    1. Generate EXACTLY 10 attractions - no more, no less
    2. For Indian cities (like Delhi, Mumbai, Jaipur, Manali), use costs in Indian Rupees (INR) and set costCurrency to "INR"
    3. For other cities, use costs in USD and set costCurrency to "USD"
    4. Each attraction must have realistic costs based on the city's economy
    5. Include the most famous and popular attractions for the city
    6. Output valid JSON only, no markdown, no filler text.`;

    try {
      const text = await this._generate(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cityData = JSON.parse(jsonMatch[0]);
        if (cityData.attractions) {
          cityData.attractions = cityData.attractions.map((attraction, index) => ({
            ...attraction,
            _id: `ai_attraction_${Date.now()}_${index}`
          }));
        }
        if (cityData.images) {
          cityData.images = cityData.images.map((image, index) => ({
            ...image,
            _id: `ai_image_${Date.now()}_${index}`
          }));
        }
        cityData._id = `ai_city_${Date.now()}`;
        cityData.createdAt = new Date().toISOString();
        cityData.updatedAt = new Date().toISOString();
        cityData.__v = 0;
        return cityData;
      }
    } catch (error) {
      console.warn('Gemini generation failed for city data, using curated fallback:', error.message);
    }
    return this.getFallbackCityData(cityName);
  }

  async generateCityAttractions(cityName, opts = {}) {
    const prompt = `List EXACTLY 10 famous attractions for ${cityName}. Provide JSON only in this structure:\n{ "attractions": [ { "name": "", "category": "landmark|museum|park|cultural|historical|shopping|entertainment|nature", "description": "", "estimatedCost": 0, "costCurrency": "USD or INR", "bestTime": "", "visitDuration": "2-3 hours", "highlights": ["",""], "rating": 4.5 } ] }\nRules:\n- Only real, notable places\n- Unique names, no duplicates\n- estimatedCost numeric\n- costCurrency: INR for Indian cities, else USD\n- rating between 3.5 and 5\n- Avoid filler text.`;
    try {
      const text = await this._generate(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const data = JSON.parse(jsonMatch[0]);
        if (Array.isArray(data.attractions) && data.attractions.length > 0) {
          return data.attractions.map(a => ({
            name: a.name,
            type: a.category || a.type || 'landmark',
            description: a.description,
            cost: a.estimatedCost ?? a.cost ?? 0,
            costCurrency: a.costCurrency || 'INR',
            bestTimeToVisit: a.bestTime || a.bestTimeToVisit || null,
            visitDuration: a.visitDuration || null,
            highlights: Array.isArray(a.highlights) ? a.highlights.slice(0,3) : [],
            rating: a.rating || 4.5
          })).filter(a => a.name).slice(0, 10);
        }
      }
    } catch (e) {
      console.warn(`Gemini generation failed for attractions in ${cityName}, using fallback:`, e.message);
    }
    return this.getFallbackAttractions(cityName);
  }

  async generateAttractionDetail(attractionName, cityName) {
  if (!this.models.length) throw new Error('Gemini API not configured');
    const prompt = `Provide a concise yet rich JSON object describing the attraction "${attractionName}" in ${cityName}. Include:
{
  "name": "${attractionName}",
  "city": "${cityName}",
  "summary": "1-2 sentence overview",
  "history": "Brief historical background (4-6 sentences)",
  "highlights": ["3-6 key highlights"],
  "tips": ["3-5 practical visitor tips"],
  "bestTime": "Best time of day/season to visit",
  "estimatedVisitDuration": "e.g., 2-3 hours",
  "approximateCost": { "amount": 0, "currency": "INR or USD" },
  "nearby": ["2-4 notable nearby places"],
  "categories": ["landmark","history"],
  "funFacts": ["1-3 short fun facts"]
}
Rules:
- JSON only, no extra commentary.
- Cost amount numeric, currency ISO code.
- Use INR if Indian attraction, else USD.`;
    try {
  const text = await this._generate(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON');
      const data = JSON.parse(jsonMatch[0]);
      return data;
    } catch (e) {
      throw new Error('Failed to generate attraction detail');
    }
  }
}

module.exports = new GeminiService();
