const express = require('express');
const router = express.Router();
const unsplash = require('../services/unsplashService');
const pexels = require('../services/pexelsService');

// GET /api/images/search?query=...
router.get('/search', async (req, res) => {
  try {
    const { query, provider } = req.query;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Query required' });
    }
    const mode = (provider || 'auto').toLowerCase();
    let photo = null;
    if (mode === 'unsplash') {
      photo = await unsplash.searchPhoto(query);
    } else if (mode === 'pexels') {
      photo = await pexels.searchPhoto(query);
    } else {
      // auto fallback order: Unsplash then Pexels
      photo = await unsplash.searchPhoto(query);
      if (!photo) photo = await pexels.searchPhoto(query);
    }
    if (!photo) {
      return res.status(404).json({ success: false, message: 'No image found' });
    }
    res.json({ success: true, photo });
  } catch (err) {
    console.error('Image search error:', err);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
