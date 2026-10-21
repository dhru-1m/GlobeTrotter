const { GoogleGenAI } = require('@google/genai');

class GeminiService {
  constructor() {
    // Multi-key setup (comma separated GEMINI_API_KEYS has priority over single GEMINI_API_KEY)
    const multi = process.env.GEMINI_API_KEYS;
    const single = process.env.GEMINI_API_KEY;
    this.clients = [];
    this.modelName = process.env.GEMINI_MODEL || 'gemini-flash-latest';

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
      'gemini-flash-latest',
      'gemini-flash-lite-latest',
      'gemini-3.8-flash',
      'gemini-2.5-flash'
    ]));

    return this._enqueue(async () => {
      let lastError = null;
      for (const m of candidateModels) {
        try {
          const response = await client.models.generateContent({
            model: m,
            contents: prompt
          });
          if (response && response.text) {
            this.modelName = m;
            return response.text;
          }
        } catch (err) {
          lastError = err;
          console.warn(`⚠️ Model ${m} request failed (${err.status || err.message?.slice(0, 80)}). Trying fallback model...`);
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

  async generateCityData(cityName, opts = {}) {
  if (!this.models.length) throw new Error('Gemini API not configured');
    const retryCount = opts.retryCount || 0;
    const extra = retryCount > 0 ? `\nCRITICAL ADDITIONAL REQUIREMENTS (Retry #${retryCount}):\n- Eliminate any generic placeholder attraction names like '${cityName} Fort' or '${cityName} Market' unless they are the widely recognized proper names (e.g., 'Shaniwar Wada', 'Aga Khan Palace').\n- All attraction names must be unique and famous / notable.\n- Do NOT repeat any attraction names.\n- If you previously returned fewer than 15, expand to 15 with additional real attractions.\n` : '';

    const prompt = `Generate comprehensive data for the city "${cityName}" in the following JSON format. Use real, accurate information and include EXACTLY 15 ATTRACTIONS with detailed descriptions, costs, and ratings:${extra}

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
          "costCurrency": "USD",
          "bestTimeToVisit": "Best time to visit this attraction",
          "visitDuration": "Recommended time to spend (e.g., 2-3 hours)",
          "highlights": ["Key highlight 1", "Key highlight 2", "Key highlight 3"]
        }
      ],
      "transportation": {
        "airport": {
          "hasInternational": true/false,
          "name": "Airport name",
          "code": "Airport code"
        },
        "publicTransport": "excellent, good, fair, or poor",
        "metro": true/false,
        "bus": true/false,
        "taxi": true/false
      },
      "safety": {
        "rating": 0,
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
      "popularity": 0,
      "isActive": true
    }

    CRITICAL REQUIREMENTS:
    1. Generate EXACTLY 15 attractions - no more, no less
    2. For Indian cities (like Delhi, Mumbai, Jaipur), use costs in Indian Rupees (INR) and set costCurrency to "INR"
    3. For other cities, use costs in USD and set costCurrency to "USD"
    4. Each attraction must have realistic costs based on the city's economy
    5. Include the most famous and popular attractions for the city
    6. Use accurate coordinates, population, and factual information
    7. Cost index should be 0-100 (0=very cheap, 100=very expensive)
    8. Popularity should be 0-100 based on tourism popularity
    9. Include relevant tags describing the city's character
    10. Use real Unsplash photo URLs that would show the city
    11. Safety rating 1-10 (10=very safe)
    12. Make sure all data is realistic and helpful for travelers
    13. For attractions, include famous landmarks, museums, parks, shopping areas, and cultural sites
    14. Each attraction should have a detailed description explaining why it's worth visiting
  15. Include best time to visit and recommended duration for each attraction\n16. All attraction names must be unique (case-insensitive)`;

    try {
  const text = await this._generate(prompt);
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const cityData = JSON.parse(jsonMatch[0]);
        
        // Add MongoDB-style ObjectIds for nested objects
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
        
        // Add metadata
        cityData._id = `ai_city_${Date.now()}`;
        cityData.createdAt = new Date().toISOString();
        cityData.updatedAt = new Date().toISOString();
        cityData.__v = 0;
        
        return cityData;
      }
      
      return { error: 'Failed to parse city data', rawResponse: text };
    } catch (error) {
      console.error('Gemini API Error:', error);
      throw new Error('Failed to generate city data');
    }
  }

  async generateCityAttractions(cityName, opts = {}) {
  if (!this.models.length) throw new Error('Gemini API not configured');
    const retry = opts.retry || 0;
    const extra = retry > 0 ? `\nRETRY #${retry}: Ensure all 10 attractions are unique, well-known, and avoid generic placeholders like '${cityName} Fort' unless that is the official historic site name.` : '';
    const prompt = `List EXACTLY 10 famous attractions for ${cityName}. Provide JSON only in this structure:\n{ "attractions": [ { "name": "", "category": "landmark|museum|park|cultural|historical|shopping|entertainment|nature", "description": "", "estimatedCost": 0, "costCurrency": "USD or INR", "bestTime": "", "visitDuration": "2-3 hours", "highlights": ["",""], "rating": 4.5 } ] }\nRules:\n- Only real, notable places (e.g., Red Fort, Chandni Chowk, Qutub Minar)\n- Unique names, no duplicates (case-insensitive)\n- estimatedCost numeric (typical entry or average spend)\n- costCurrency: INR for Indian cities, else USD\n- rating between 3.5 and 5\n- Avoid filler text.\n${extra}`;
    try {
  const text = await this._generate(prompt);
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON returned');
      const data = JSON.parse(jsonMatch[0]);
      if (!Array.isArray(data.attractions)) throw new Error('Invalid attractions array');
      // Normalize
      data.attractions = data.attractions.map(a => ({
        name: a.name,
        type: a.category || a.type || 'landmark',
        description: a.description,
        cost: a.estimatedCost ?? a.cost ?? null,
        costCurrency: a.costCurrency || null,
        bestTimeToVisit: a.bestTime || a.bestTimeToVisit || null,
        visitDuration: a.visitDuration || null,
        highlights: Array.isArray(a.highlights) ? a.highlights.slice(0,3) : [],
        rating: a.rating || null
      })).filter(a => a.name);
      // Uniqueness check
      const names = data.attractions.map(a => a.name.toLowerCase());
      const unique = new Set(names);
      if (data.attractions.length !== 10 || unique.size < 10) {
        if (retry < 2) return this.generateCityAttractions(cityName, { retry: retry + 1 });
      }
      return data.attractions.slice(0,10);
    } catch (e) {
      throw new Error('Failed to generate city attractions');
    }
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
