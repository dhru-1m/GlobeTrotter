const axios = require('axios');

// Simple in-memory cache (separate from Unsplash cache)
const cache = new Map();
const TTL_MS = 1000 * 60 * 60; // 1 hour

function setCache(key, value) {
  cache.set(key, { value, expires: Date.now() + TTL_MS });
}

function getCache(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) { cache.delete(key); return null; }
  return entry.value;
}

async function searchPhoto(query) {
  const trimmed = (query || '').trim();
  if (!trimmed) return null;
  const cacheKey = trimmed.toLowerCase();
  const cached = getCache(cacheKey);
  if (cached) return cached;

  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return null; // graceful fail if not configured

  try {
    const resp = await axios.get('https://api.pexels.com/v1/search', {
      params: { query: trimmed, per_page: 1, orientation: 'landscape' },
      headers: { Authorization: apiKey }
    });
    const first = resp.data?.photos?.[0];
    if (!first) return null;

    let username = null;
    if (first.photographer_url) {
      const atIndex = first.photographer_url.lastIndexOf('/@');
      if (atIndex !== -1) username = first.photographer_url.substring(atIndex + 2).replace(/\/$/, '');
    }

    const photo = {
      id: String(first.id),
      description: first.alt || trimmed,
      alt: first.alt || trimmed,
      url: first.src?.large || first.src?.original,
      thumb: first.src?.tiny || first.src?.small,
      credit: {
        name: first.photographer,
        username,
        link: first.photographer_url,
        sourceLabel: 'Pexels'
      },
      source: 'pexels'
    };

    setCache(cacheKey, photo);
    return photo;
  } catch (err) {
    console.error('Pexels search error:', err.message);
    return null;
  }
}

module.exports = { searchPhoto };
