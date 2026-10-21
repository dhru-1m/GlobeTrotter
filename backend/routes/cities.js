const express = require('express');
const City = require('../models/City');
const geminiService = require('../services/geminiService');
const { getRealCityAttractions } = require('../services/openTripService');

const router = express.Router();

// @route   GET /api/cities
// @desc    Search cities
// @access  Public
router.get('/', async (req, res) => {
  try {
    const {
      search,
      country,
      costMin,
      costMax,
      popularity,
      climate,
      limit = 20,
      page = 1
    } = req.query;

    const query = { isActive: true };

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Country filter
    if (country) {
      query.country = { $regex: country, $options: 'i' };
    }

    // Cost range filter
    if (costMin || costMax) {
      query.costIndex = {};
      if (costMin) query.costIndex.$gte = parseInt(costMin);
      if (costMax) query.costIndex.$lte = parseInt(costMax);
    }

    // Popularity filter
    if (popularity) {
      query.popularity = { $gte: parseInt(popularity) };
    }

    // Climate filter
    if (climate) {
      query['climate.type'] = climate;
    }

    const cities = await City.find(query)
      .sort({ popularity: -1, name: 1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))
      .select('name country countryCode region coordinates costIndex currency climate attractions images tags popularity');

    const total = await City.countDocuments(query);

    res.status(200).json({
      success: true,
      count: cities.length,
      total,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      data: cities
    });
  } catch (error) {
    console.error('Search cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cities/:id
// @desc    Get single city
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const city = await City.findById(req.params.id);

    if (!city || !city.isActive) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    res.status(200).json({
      success: true,
      data: city
    });
  } catch (error) {
    console.error('Get city error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cities/popular
// @desc    Get popular cities
// @access  Public
router.get('/popular', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;

    const cities = await City.find({ isActive: true })
      .sort({ popularity: -1 })
      .limit(limit)
      .select('name country countryCode coordinates costIndex currency images tags popularity');

    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    console.error('Get popular cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cities/countries
// @desc    Get all countries
// @access  Public
router.get('/countries', async (req, res) => {
  try {
    const countries = await City.distinct('country', { isActive: true });
    
    res.status(200).json({
      success: true,
      count: countries.length,
      data: countries.sort()
    });
  } catch (error) {
    console.error('Get countries error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   GET /api/cities/climates
// @desc    Get climate types
// @access  Public
router.get('/climates', (req, res) => {
  const climates = [
    'tropical',
    'dry',
    'temperate',
    'continental',
    'polar'
  ];

  res.status(200).json({
    success: true,
    data: climates
  });
});

// @route   GET /api/cities/nearby
// @desc    Get cities near coordinates
// @access  Public
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radius = 100, limit = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Latitude and longitude are required'
      });
    }

    const cities = await City.find({
      isActive: true,
      coordinates: {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: parseInt(radius) * 1000 // Convert km to meters
        }
      }
    })
    .limit(parseInt(limit))
    .select('name country countryCode coordinates costIndex currency images tags popularity');

    res.status(200).json({
      success: true,
      count: cities.length,
      data: cities
    });
  } catch (error) {
    console.error('Get nearby cities error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// @route   POST /api/cities/ai-recommendations
// @desc    Get AI-powered city recommendations
// @access  Public
router.post('/ai-recommendations', async (req, res) => {
  try {
    const { budget, interests, duration, startLocation, travelStyle } = req.body;

    // Validate required fields
    if (!duration || duration < 1) {
      return res.status(400).json({
        success: false,
        message: 'Duration is required and must be at least 1 day'
      });
    }

    const preferences = {
      budget: budget || 'moderate',
      interests: interests || [],
      duration,
      startLocation,
      travelStyle: travelStyle || 'balanced'
    };

    const recommendations = await geminiService.generateCityRecommendations(preferences);

    res.status(200).json({
      success: true,
      data: recommendations,
      preferences
    });
  } catch (error) {
    console.error('AI recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate recommendations'
    });
  }
});

// @route   POST /api/cities/:cityId/activities
// @desc    Get AI-powered activity recommendations for a city
// @access  Public
router.post('/:cityId/activities', async (req, res) => {
  try {
    const { cityId } = req.params;
    const { interests, budget, duration, travelStyle } = req.body;

    const city = await City.findById(cityId);
    if (!city) {
      return res.status(404).json({
        success: false,
        message: 'City not found'
      });
    }

    const preferences = {
      interests: interests || [],
      budget: budget || 50,
      duration: duration || 2,
      travelStyle: travelStyle || 'balanced'
    };

    const activities = await geminiService.generateActivityRecommendations(city, preferences);

    res.status(200).json({
      success: true,
      city: {
        name: city.name,
        country: city.country
      },
      data: activities,
      preferences
    });
  } catch (error) {
    console.error('Activity recommendations error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate activity recommendations'
    });
  }
});

// @route   POST /api/cities/ai-search
// @desc    Search for any city using AI to generate data
// @access  Public
router.post('/ai-search', async (req, res) => {
  try {
    const { cityName } = req.body;

    if (!cityName || cityName.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'City name is required'
      });
    }

    // First, check if the city already exists in our database
    const existingCity = await City.findOne({
      name: { $regex: new RegExp(cityName.trim(), 'i') },
      isActive: true
    });

    if (existingCity) {
      return res.status(200).json({
        success: true,
        source: 'database',
        data: existingCity
      });
    }

    // If not found in database, generate using AI
    try {
      let aiCityData = await geminiService.generateCityData(cityName.trim());

      // Validate uniqueness; retry up to 2 times if duplicates/generic patterns dominate
      const hasIssues = (data) => {
        if (!Array.isArray(data.attractions)) return true;
        const names = data.attractions.map(a => (a?.name || '').trim().toLowerCase()).filter(Boolean);
        const unique = new Set(names);
        if (unique.size < Math.min(10, names.length)) return true; // too many duplicates
        // Detect over-generic pattern: repeating cityName + generic word
        const genericPattern = new RegExp(`^${cityName.trim().toLowerCase()} (fort|market|museum|park)$`);
        const genericCount = names.filter(n => genericPattern.test(n)).length;
        if (genericCount / (names.length || 1) > 0.4) return true;
        return false;
      };
      let attempt = 0;
      while (attempt < 2 && hasIssues(aiCityData)) {
        attempt++;
        aiCityData = await geminiService.generateCityData(cityName.trim(), { retryCount: attempt });
      }

      if (aiCityData.error) {
        return res.status(500).json({
          success: false,
          message: 'Failed to generate city data',
          error: aiCityData.error
        });
      }

      // Normalize attractions: ensure at least 10 (duplicate if needed) and cap to 15
      if (!Array.isArray(aiCityData.attractions)) aiCityData.attractions = [];
      // Filter out malformed entries without name
      aiCityData.attractions = aiCityData.attractions.filter(a => a && a.name);
  // If still fewer than 10 after retries, leave as-is (prefer accuracy over duplication)
      if (aiCityData.attractions.length > 15) {
        aiCityData.attractions = aiCityData.attractions.slice(0, 15);
      }

      res.status(200).json({
        success: true,
        source: 'ai-generated',
        data: aiCityData,
        note: 'This city data was generated by AI and includes top attractions with detailed information'
      });
    } catch (aiError) {
      console.error('AI generation error:', aiError);
      return res.status(500).json({
        success: false,
        message: 'Failed to generate city data using AI. Please check your API key or try again later.',
        error: aiError.message
      });
    }
  } catch (error) {
    console.error('AI city search error:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to search for city'
    });
  }
});

// @route   GET /api/cities/:cityName/live-attractions
// @desc    Fetch top real attractions (no hardcoding) from OpenTripMap
// @access  Public
router.get('/:cityName/live-attractions', async (req, res) => {
  try {
    const { cityName } = req.params;
    if (!cityName || !cityName.trim()) {
      return res.status(400).json({ success: false, message: 'cityName required' });
    }
    const data = await getRealCityAttractions(cityName.trim());
    if (!data.attractions || data.attractions.length === 0) {
      return res.status(404).json({ success: false, message: 'No attractions found' });
    }
    res.json({ success: true, source: 'live', data });
  } catch (err) {
    console.error('Live attractions error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to fetch live attractions' });
  }
});

// @route GET /api/cities/:cityName/ai-attractions
// @desc  Get top 10 real (AI generated) attractions via Gemini only
// @access Public
router.get('/:cityName/ai-attractions', async (req, res) => {
  try {
    const { cityName } = req.params;
    if (!cityName || !cityName.trim()) return res.status(400).json({ success: false, message: 'cityName required' });
    const attractions = await geminiService.generateCityAttractions(cityName.trim());
    res.json({ success: true, source: 'gemini', city: cityName.trim(), attractions });
  } catch (err) {
    console.error('AI attractions error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate attractions' });
  }
});

// @route POST /api/cities/attraction/detail
// @desc  Generate detailed info for a specific attraction in a city
// @access Public
router.post('/attraction/detail', async (req, res) => {
  try {
    const { attractionName, cityName } = req.body || {};
    if (!attractionName || !cityName) return res.status(400).json({ success: false, message: 'attractionName and cityName required' });
    const detail = await geminiService.generateAttractionDetail(attractionName.trim(), cityName.trim());
    res.json({ success: true, source: 'gemini', data: detail });
  } catch (err) {
    console.error('Attraction detail error:', err.message);
    res.status(500).json({ success: false, message: err.message || 'Failed to generate attraction detail' });
  }
});

module.exports = router; 