const axios = require('axios');

const cache = new Map(); // key: cityNameLower -> { value, expires }
const TTL_MS = 1000 * 60 * 60; // 1 hour

function setCache(key, value) { cache.set(key, { value, expires: Date.now() + TTL_MS }); }
function getCache(key) { const e = cache.get(key); if (!e) return null; if (Date.now() > e.expires) { cache.delete(key); return null; } return e.value; }

async function fetchCityGeo(cityName, apiKey) {
  const url = 'https://api.opentripmap.com/0.1/en/places/geoname';
  const { data } = await axios.get(url, { params: { name: cityName, apikey: apiKey } });
  return { name: data.name, country: data.country, lat: data.lat, lon: data.lon, population: data.population };
}

async function fetchPlaces(lat, lon, apiKey, limit = 40) {
  const url = 'https://api.opentripmap.com/0.1/en/places/radius';
  const { data } = await axios.get(url, { params: { radius: 10000, lon, lat, rate: 2, format: 'json', limit, apikey: apiKey } });
  return data;
}

async function fetchPlaceDetails(xid, apiKey) {
  const url = `https://api.opentripmap.com/0.1/en/places/xid/${encodeURIComponent(xid)}`;
  const { data } = await axios.get(url, { params: { apikey: apiKey } });
  return data;
}

async function getRealCityAttractions(cityName) {
  const apiKey = process.env.OPENTRIPMAP_API_KEY;
  if (!apiKey) throw new Error('OPENTRIPMAP_API_KEY missing');
  const key = cityName.trim().toLowerCase();
  const cached = getCache(key); if (cached) return cached;

  const geo = await fetchCityGeo(cityName, apiKey);
  const places = await fetchPlaces(geo.lat, geo.lon, apiKey, 40);

  const details = [];
  for (const p of places) {
    if (!p.xid) continue;
    try {
      const d = await fetchPlaceDetails(p.xid, apiKey);
      details.push(d);
      if (details.length >= 15) break;
    } catch (_) { /* ignore single failure */ }
  }

  const attractions = details
    .map(d => ({
      name: d.name || d.address?.attraction || d.xid,
      type: (d.kinds && d.kinds.split(',')[0]) || 'landmark',
      description: d.wikipedia_extracts?.text || d.info?.descr || '',
      rating: d.rate || null,
      cost: null,
      costCurrency: null,
      bestTimeToVisit: null,
      visitDuration: null,
      highlights: (d.kinds ? d.kinds.split(',').slice(0,3) : [])
    }))
    .filter(a => a.name)
    .slice(0, 10);

  const result = { name: geo.name, country: geo.country, coordinates: { lat: geo.lat, lng: geo.lon }, population: geo.population, attractions };
  setCache(key, result);
  return result;
}

module.exports = { getRealCityAttractions };
