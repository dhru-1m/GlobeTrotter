import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Clock, 
  Star, 
  Filter,
  Sparkles,
  TrendingUp,
  Users,
  Calendar
} from 'lucide-react';
import { searchCities, getAIRecommendations, aiSearchCity } from '../store/slices/citySlice';
import { cityAPI } from '../services/api';
import { addStop, addToBasket, addCityAttractions } from '../store/slices/plannerSlice';
import { setCurrentCity, addPlaceToCurrentCity } from '../store/slices/tripBuilderSlice';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { toast } from 'react-hot-toast';
import { imageAPI } from '../services/api';

const CitySearch = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cities, loading, aiRecommendations, error, aiSearchResult } = useSelector(state => state.cities);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    country: '',
    costMin: '',
    costMax: '',
    popularity: ''
  });
  const [showAIDialog, setShowAIDialog] = useState(false);
  const [aiPreferences, setAIPreferences] = useState({
    budget: 'moderate',
    interests: [],
    duration: 7,
    startLocation: '',
    travelStyle: 'balanced'
  });
  const [imageCache, setImageCache] = useState({}); // { cityName: { url, credit } }
  const [aiAttractions, setAIAttractions] = useState(null);
  const [aiAttrLoading, setAIAttrLoading] = useState(false);
  const [aiAttrError, setAIAttrError] = useState(null);
  const [attractionImageCache, setAttractionImageCache] = useState({}); // key: attractionName -> { url, credit, source }

  const interests = [
    'Culture & History', 'Food & Cuisine', 'Adventure Sports', 'Nightlife',
    'Nature & Wildlife', 'Beach & Relaxation', 'Shopping', 'Art & Museums',
    'Photography', 'Local Experiences', 'Architecture', 'Festivals'
  ];

  const budgetOptions = [
    { value: 'budget', label: 'Budget ($20-50/day)' },
    { value: 'moderate', label: 'Moderate ($50-100/day)' },
    { value: 'luxury', label: 'Luxury ($100+/day)' }
  ];

  const travelStyles = [
    { value: 'slow', label: 'Slow Travel - Deep immersion' },
    { value: 'balanced', label: 'Balanced - Mix of everything' },
    { value: 'fast', label: 'Fast-paced - See everything' }
  ];

  useEffect(() => {
    if (searchQuery.length > 2) {
      const timer = setTimeout(() => {
        // Use AI search for any city name
        dispatch(aiSearchCity(searchQuery.trim()));
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, dispatch]);

  // Fetch Gemini AI attractions (top 10) for a single city result
  useEffect(() => {
    const city = (cities && cities.length === 1) ? cities[0] : null;
    if (!city) { setAIAttractions(null); return; }
    const name = city.name || city.city;
    if (!name) return;
    setAIAttrLoading(true); setAIAttrError(null);
    cityAPI.getAIAttractions(name)
      .then(res => {
        if (res.data?.success) setAIAttractions(res.data.attractions || []);
        else setAIAttrError(res.data?.message || 'Failed to load attractions');
      })
      .catch(err => setAIAttrError(err.response?.data?.message || err.message))
      .finally(() => setAIAttrLoading(false));
  }, [cities]);

  // Fetch images for each attraction (sequential to avoid bursts)
  useEffect(() => {
    if (!aiAttractions || aiAttractions.length === 0) return;
    let isCancelled = false;
    const loadImages = async () => {
      for (const attr of aiAttractions.slice(0,10)) {
        const key = attr.name;
        if (!key || attractionImageCache[key]) continue;
        try {
          const { data } = await imageAPI.search(`${attr.name} ${cities[0]?.name || ''}`.trim());
          if (!isCancelled) {
            setAttractionImageCache(prev => ({
              ...prev,
              [key]: data?.success && data.photo?.url ? { url: data.photo.url, credit: data.photo.credit, source: data.photo.source } : { url: null }
            }));
          }
        } catch (e) {
          if (!isCancelled) {
            setAttractionImageCache(prev => ({ ...prev, [key]: { url: null } }));
          }
        }
      }
    };
    loadImages();
    return () => { isCancelled = true; };
  }, [aiAttractions, cities, attractionImageCache]);

  // Fetch Unsplash image for a city name (memoized in state cache)
  const fetchCityImage = async (name) => {
    if (!name || imageCache[name]) return;
    try {
      const { data } = await imageAPI.search(name);
      if (data?.success && data.photo?.url) {
  setImageCache(prev => ({ ...prev, [name]: { url: data.photo.url, credit: data.photo.credit, source: data.photo.source } }));
      } else {
        setImageCache(prev => ({ ...prev, [name]: { url: null, credit: null } }));
      }
    } catch (e) {
      setImageCache(prev => ({ ...prev, [name]: { url: null, credit: null } }));
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    
    // First try normal search
    if (searchQuery.trim().length > 0) {
      // Try AI search for any city name
      dispatch(aiSearchCity(searchQuery.trim()));
    } else {
      dispatch(searchCities({ search: searchQuery, ...filters }));
    }
  };

  const handleAIRecommendations = async () => {
    try {
      await dispatch(getAIRecommendations(aiPreferences));
      setShowAIDialog(false);
    } catch (error) {
      console.error('AI recommendations error:', error);
    }
  };

  const toggleInterest = (interest) => {
    setAIPreferences(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAddToItinerary = (city) => {
    const cityName = city?.name || city?.city || 'City';
    const country = city?.country || 'Unknown';
    const attractions = city?.attractions && city.attractions.length
      ? city.attractions
      : (Array.isArray(city?.activities) ? city.activities.map(a => ({ name: typeof a === 'string' ? a : String(a), description: '' })) : []);

    // Add attractions to the planner if available
    if (attractions.length > 0) {
      dispatch(addCityAttractions({
        cityName,
        attractions,
      }));

      // Add top attractions to basket
      attractions.slice(0, 5).forEach((attraction, index) => {
        const activityId = `city-${cityName}-attraction-${index}`;
        dispatch(addToBasket(activityId));
      });
    }

    // Set current city in trip builder and prefill places
    dispatch(setCurrentCity({ city: cityName, country }));
    attractions.slice(0, 10).forEach((attraction) => {
      dispatch(addPlaceToCurrentCity({
        name: attraction.name || 'Attraction',
        notes: attraction.description || '',
        cost: attraction.cost || 0 // Pass cost for budget tracking
      }));
    });

    toast.success(`${cityName} added. You can add more places or cities, then review in Planner.`);
    // Stay on this page, do not navigate
  };
  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI-Powered City Search
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Type any city name in the world (e.g., Delhi, Paris, Tokyo, New York)...
          </p>
          <div className="bg-primary-50 p-4 rounded-lg border border-blue-200">
            <p className="text-blue-800 font-medium">
              🚀 AI will generate comprehensive city data with <strong>15 most famous attractions</strong>, 
              costs in local currency, and detailed recommendations for any location you search!
            </p>
          </div>
        </div>

        {/* Search and AI Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* AI-Powered Search */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Search className="mr-2 text-primary-600" />
                AI-Powered City Search
              </h2>
              
              <form onSubmit={handleSearch} className="space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <input
                    type="text"
                    placeholder="Type any city name in the world (e.g., Paris, Tokyo, New York)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
                
                <div className="text-sm text-gray-600 flex items-center">
                  <Sparkles className="h-4 w-4 mr-1 text-secondary-500" />
                  AI will generate comprehensive city data for any location you search
                </div>

                <button type="submit" className="btn-primary">
                  <Search className="mr-2 h-4 w-4" />
                  Search Cities
                </button>
              </form>
            </div>
          </div>

          {/* AI Recommendations */}
          <div className="lg:col-span-1">
            <div className="card p-6 h-full">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <Sparkles className="mr-2 text-secondary-600" />
                AI Recommendations
              </h2>
              
              <p className="text-gray-600 mb-4">
                Let our AI suggest perfect destinations based on your preferences
              </p>
              
              <button
                onClick={() => setShowAIDialog(true)}
                className="btn-secondary w-full"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Get AI Suggestions
              </button>
            </div>
          </div>
        </div>

        {/* Results Section */}
        {loading && (
          <div className="flex justify-center py-12">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-md p-4 mb-6">
            <p className="text-danger-800">{error}</p>
          </div>
        )}

        {/* AI Recommendations Results */}
        {aiRecommendations?.recommendations && aiRecommendations.recommendations.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Sparkles className="mr-2 text-secondary-600" />
              AI Recommended Destinations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiRecommendations.recommendations.map((city, index) => (
                <div key={index} className="card p-6 group hover:shadow-md transition-all duration-300">
                  {/* Image */}
                  <div className="mb-4 rounded-lg overflow-hidden">
                    <img
                      src={city.imageUrl || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'}
                      alt={city.city}
                      className="w-full h-48 object-cover transition-transform duration-300"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80';
                      }}
                    />
                  </div>

                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{city.city}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-secondary text-xs">{city.country}</span>
                        {city.bestTime && (
                          <span className="badge badge-primary text-xs">Best time: {city.bestTime}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center bg-secondary-100 px-2 py-1 rounded-full">
                      <Sparkles className="h-4 w-4 text-secondary-600 mr-1" />
                      <span className="text-sm font-medium text-secondary-700">AI Pick</span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Daily Cost:</span>
                      <span className="font-semibold text-primary-600">${city.dailyCost}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Suggested Days:</span>
                      <span className="font-semibold">{city.suggestedDays} days</span>
                    </div>
                  </div>

                  {/* Activities */}
                  {city.activities && city.activities.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2">Top Activities:</h4>
                      <div className="flex flex-wrap gap-2">
                        {city.activities.slice(0, 3).map((activity, idx) => (
                          <span key={idx} className="badge badge-primary text-xs">
                            {activity}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reasoning */}
                  {city.reasoning && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600">{city.reasoning}</p>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="mt-6 flex gap-2">
                    <button
                      className="btn-primary flex-1 text-sm"
                      onClick={() => {
                        setSearchQuery(city.city);
                        dispatch(aiSearchCity(city.city));
                      }}
                    >
                      Explore City
                    </button>
                    <button className="btn-secondary text-sm" onClick={() => handleAddToItinerary(city)}>Add to Itinerary</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search Results */}
        {((cities && cities.length > 0) || aiSearchResult) && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">
                Search Results ({aiSearchResult ? 1 : cities.length} cities)
              </h2>
              {aiSearchResult && (
                <div className="flex items-center text-sm text-secondary-600 bg-secondary-50 px-3 py-1 rounded-full">
                  <Sparkles className="h-4 w-4 mr-1" />
                  AI Generated Data
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {(cities && cities.length > 0 ? cities : (aiSearchResult ? [aiSearchResult] : [])).map((city) => city && (
                <div key={city._id || `city-${Math.random()}`} className="card p-6 group hover:shadow-md transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{city.name}</h3>
                      <p className="text-gray-600 flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {city.country}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-accent-500 mr-1" />
                      <span className="font-medium">{city.popularity || 85}/100</span>
                    </div>
                  </div>

                  {/* City Image (Unsplash if available) */}
                  <div className="mb-4 rounded-lg overflow-hidden min-h-32 relative">
                    <img
                      src={(imageCache[city.name]?.url) || (city.images && city.images[0] && city.images[0].url) || 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80'}
                      alt={city.name}
                      className="w-full h-32 object-cover transition-transform duration-300"
                      onLoad={() => fetchCityImage(city.name)}
                      onError={(e) => {
                        if (!imageCache[city.name]) fetchCityImage(city.name);
                        e.target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80';
                      }}
                    />
                    {imageCache[city.name]?.credit && imageCache[city.name]?.url && (
                      <a
                        href={imageCache[city.name].credit.link || '#'}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-0 left-0 right-0 bg-black/40 text-[10px] text-gray-100 px-2 py-1 flex justify-between items-center"
                        title={`Photo by ${imageCache[city.name].credit.name} on Unsplash`}
                      >
                        <span>Photo: {imageCache[city.name].credit.name}</span>
                        <span className="opacity-70">Unsplash</span>
                      </a>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Cost Index:</span>
                      <span className="font-semibold text-primary-600">
                        {city.currency === 'INR' ? '₹' : '$'}{city.costIndex || 50}/day
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Climate:</span>
                      <span className="font-semibold">{city.climate?.type || 'Moderate'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Population:</span>
                      <span className="font-semibold">{(city.population || 0).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Top Attractions Preview */}
                  {city.attractions && city.attractions.length > 0 && (
                    <div className="mt-4">
                      <h4 className="font-medium mb-2 flex items-center">
                        <Star className="h-4 w-4 mr-1 text-accent-500" />
                        Top Attractions ({city.attractions.length})
                      </h4>
                      <div className="space-y-2">
                        {city.attractions.slice(0, 3).map((attraction, idx) => (
                          <div key={idx} className="text-xs text-gray-600 flex items-center justify-between bg-gray-50 p-2 rounded">
                            <span className="font-medium">{attraction.name}</span>
                            <span className="text-primary-600 font-semibold">
                              {attraction.costCurrency === 'INR' ? '₹' : '$'}{attraction.cost}
                            </span>
                          </div>
                        ))}
                        {city.attractions.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{city.attractions.length - 3} more attractions
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Tags */}
                  {city.tags && city.tags.length > 0 && (
                    <div className="mt-4">
                      <div className="flex flex-wrap gap-1">
                        {city.tags.slice(0, 4).map((tag, idx) => (
                          <span key={idx} className="badge badge-primary text-xs">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="mt-6 flex gap-2">
                    <button
                      className="btn-primary flex-1 text-sm"
                      onClick={() => {
                        setSearchQuery(city.name);
                        dispatch(aiSearchCity(city.name));
                      }}
                    >
                      Explore City
                    </button>
                    <button 
                      onClick={() => handleAddToItinerary(city)}
                      className="btn-secondary text-sm"
                    >
                      Add to Itinerary
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed Attractions Section */}
      {cities.length === 1 && (
              <div className="mt-12">
                <div className="text-center mb-8">
                  <h2 className="text-3xl font-bold mb-2">
        Top {aiAttractions ? Math.min(10, aiAttractions.length) : (cities[0].attractions ? Math.min(10, cities[0].attractions.length) : 0)} Places to Visit in {cities[0].name}
                  </h2>
                  <p className="text-gray-600">
                    Discover the most famous attractions with detailed information, costs, and recommendations
                  </p>
                  {cities[0].currency === 'INR' && (
                    <div className="mt-2 inline-flex items-center bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                      <span>💰 Costs shown in Indian Rupees (₹)</span>
                    </div>
                  )}
                </div>
                
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(aiAttrLoading && <div className="col-span-full text-center text-sm text-gray-500">Loading attractions...</div>)}
          {aiAttrError && <div className="col-span-full text-center text-sm text-danger-600">{aiAttrError}</div>}
          {(aiAttractions || cities[0].attractions || []).slice(0,10).filter(a => a && a.name).map((attraction, index) => (
                        <div key={attraction._id || index} className="card p-6 group hover:shadow-md transition-all duration-300">
              <div className="mb-4 rounded-lg overflow-hidden relative">
                <img
                  src={
                    (attractionImageCache[attraction.name]?.url) ||
                    attraction.imageUrl ||
                    'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80'
                  }
                  alt={attraction.name}
                  className="w-full h-48 object-cover transition-transform duration-300"
                  onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1000&q=80'; }}
                />
                {attractionImageCache[attraction.name]?.credit && attractionImageCache[attraction.name]?.url && (
                  <a
                    href={attractionImageCache[attraction.name].credit.link || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="absolute bottom-0 left-0 right-0 bg-black/40 text-[10px] text-gray-100 px-2 py-1 flex justify-between items-center"
                    title={`Photo by ${attractionImageCache[attraction.name].credit.name}`}
                  >
                    <span>{attractionImageCache[attraction.name].credit.name}</span>
                    <span className="opacity-70">{attractionImageCache[attraction.name].credit.sourceLabel || (attractionImageCache[attraction.name].source === 'pexels' ? 'Pexels' : 'Unsplash')}</span>
                  </a>
                )}
              </div>
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="text-xl font-semibold text-gray-900 mb-1">{attraction.name}</h3>
                              <div className="flex items-center gap-2">
                                <span className="badge badge-secondary text-xs">{attraction.type}</span>
                                {attraction.rating && (
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 text-yellow-500 mr-1" />
                                    <span className="text-sm font-medium">{attraction.rating}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-primary-600">{attraction.costCurrency === 'INR' ? '₹' : '$'}{attraction.cost}</div>
                              <div className="text-xs text-gray-500">Entry Fee</div>
                            </div>
                          </div>
                          {attraction.description && (<p className="text-gray-600 text-sm mb-4 line-clamp-3">{attraction.description}</p>)}
                          <div className="space-y-2 mb-4">
                            {attraction.bestTimeToVisit && (<div className="flex items-center text-xs text-gray-600"><Calendar className="h-3 w-3 mr-1" /><span>Best time: {attraction.bestTimeToVisit}</span></div>)}
                            {attraction.visitDuration && (<div className="flex items-center text-xs text-gray-600"><Clock className="h-3 w-3 mr-1" /><span>Duration: {attraction.visitDuration}</span></div>)}
                          </div>
                          {attraction.highlights && attraction.highlights.length > 0 && (
                            <div className="mb-4"><h5 className="text-sm font-medium text-gray-700 mb-2">Highlights:</h5>
                              <div className="flex flex-wrap gap-1">
                                {attraction.highlights.map((highlight, idx) => (<span key={idx} className="badge badge-accent text-xs">{highlight}</span>))}
                              </div>
                            </div>
                          )}
                          <div className="space-y-2 text-sm">
                            {(attraction.visitDuration || attraction.duration) && (<div className="flex items-center text-gray-600"><Clock className="h-4 w-4 mr-2" /><span>Duration: {attraction.visitDuration || attraction.duration}</span></div>)}
                            {(attraction.bestTimeToVisit || attraction.bestTime) && (<div className="flex items-center text-gray-600"><Calendar className="h-4 w-4 mr-2" /><span>Best Time: {attraction.bestTimeToVisit || attraction.bestTime}</span></div>)}
                          </div>
                          <div className="mt-6 flex gap-2">
                            <button
                              className="btn-primary flex-1 text-sm"
                              onClick={() => {
                                const currentCityName = cities[0]?.name || 'City';
                                const slug = encodeURIComponent(attraction.name.replace(/\s+/g, '-'));
                                navigate(`/cities/${encodeURIComponent(currentCityName)}/attraction/${slug}`);
                              }}
                            >
                              Learn More
                            </button>
                            <button onClick={() => handleAddToItinerary({ name: attraction.name, country: 'N/A', attractions: [attraction] })} className="btn-secondary text-sm">Add to Itinerary</button>
                          </div>
                        </div>
                      ))}
                </div>
              </div>
            )}
          </div>
  )}

  {/* No Results */}
        {!loading && !error && cities && cities.length === 0 && searchQuery && !aiSearchResult && (
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No cities found</h3>
            <p className="text-gray-600">Try adjusting your search criteria or let AI help you discover new destinations</p>
            <button
              onClick={() => setShowAIDialog(true)}
              className="btn-secondary mt-4"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Get AI Suggestions
            </button>
          </div>
        )}
      </div>

      {/* Button to go to Planner */}
      <div className="flex justify-center mt-8">
        <button
          className="px-8 py-4 rounded bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition text-lg"
          onClick={() => navigate('/planner')}
        >
          Review & Plan Itinerary
        </button>
      </div>

      {/* AI Preferences Modal */}
      {showAIDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Sparkles className="mr-2 text-secondary-600" />
                  AI Travel Preferences
                </h2>
                <button
                  onClick={() => setShowAIDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-6">
                {/* Duration */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Calendar className="inline h-4 w-4 mr-1" />
                    Trip Duration (days)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={aiPreferences.duration}
                    onChange={(e) => setAIPreferences(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                    className="input w-full"
                  />
                </div>

                {/* Budget */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <DollarSign className="inline h-4 w-4 mr-1" />
                    Budget Range
                  </label>
                  <select
                    value={aiPreferences.budget}
                    onChange={(e) => setAIPreferences(prev => ({ ...prev, budget: e.target.value }))}
                    className="input w-full"
                  >
                    {budgetOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Travel Style */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <TrendingUp className="inline h-4 w-4 mr-1" />
                    Travel Style
                  </label>
                  <select
                    value={aiPreferences.travelStyle}
                    onChange={(e) => setAIPreferences(prev => ({ ...prev, travelStyle: e.target.value }))}
                    className="input w-full"
                  >
                    {travelStyles.map(style => (
                      <option key={style.value} value={style.value}>
                        {style.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Starting Location */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <MapPin className="inline h-4 w-4 mr-1" />
                    Starting Location (optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g., New York, London, or 'flexible'"
                    value={aiPreferences.startLocation}
                    onChange={(e) => setAIPreferences(prev => ({ ...prev, startLocation: e.target.value }))}
                    className="input w-full"
                  />
                </div>

                {/* Interests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    <Star className="inline h-4 w-4 mr-1" />
                    Interests (select multiple)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {interests.map(interest => (
                      <button
                        key={interest}
                        type="button"
                        onClick={() => toggleInterest(interest)}
                        className={`text-sm px-3 py-2 rounded-lg border transition-all duration-200 ${
                          aiPreferences.interests.includes(interest)
                            ? 'bg-primary-500 text-white border-primary-500'
                            : 'bg-white text-gray-700 border-gray-300 hover:border-primary-300'
                        }`}
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-8">
                <button
                  onClick={() => setShowAIDialog(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAIRecommendations}
                  className="btn-primary flex-1"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <LoadingSpinner size="sm" className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Get Recommendations
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CitySearch;
