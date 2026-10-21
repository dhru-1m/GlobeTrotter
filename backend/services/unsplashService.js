const axios = require('axios');

// In-memory cache (simple) to limit calls
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
  const cached = getCache(trimmed.toLowerCase());
  if (cached) return cached;

  const accessKey = process.env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    return null; // fail gracefully
  }

  try {
    const resp = await axios.get('https://api.unsplash.com/search/photos', {
      params: {
        query: trimmed,
        per_page: 1,
        orientation: 'landscape',
        content_filter: 'high'
      },
      headers: { Authorization: `Client-ID ${accessKey}` }
    });
    const first = resp.data?.results?.[0];
    if (!first) return null;
    const photo = {
      id: first.id,
      description: first.description || first.alt_description || trimmed,
      alt: first.alt_description || trimmed,
      url: first.urls?.regular,
      thumb: first.urls?.thumb,
      credit: first.user ? {
        name: first.user.name,
        username: first.user.username,
        link: first.user.links?.html
      } : null,
      source: 'unsplash'
    };
    setCache(trimmed.toLowerCase(), photo);
    return photo;
  } catch (err) {
    console.error('Unsplash search error:', err.message);
    return null;
  }
}

module.exports = { searchPhoto };
