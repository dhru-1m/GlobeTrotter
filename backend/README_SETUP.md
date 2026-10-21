# GlobeTrotter Enhanced City Search Setup

## Overview
This enhanced city search functionality allows users to search for any city in the world and get comprehensive information including:
- City details (population, climate, cost index, etc.)
- Top 15 attractions with detailed descriptions
- Estimated costs for each attraction
- High-quality images
- Safety ratings and transportation info

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the backend directory with the following variables:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/globetrotter

# JWT Configuration
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# Google Gemini AI (REQUIRED for city search)
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Client Configuration
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. Get Gemini API Key
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the API key and paste it in your `.env` file

### 3. Install Dependencies
```bash
cd backend
npm install
```

### 4. Start the Backend Server
```bash
npm run dev
```

## How It Works

### City Search Flow
1. User enters a city name (e.g., "Delhi")
2. System first checks if the city exists in the database
3. If not found, it uses Gemini AI to generate comprehensive city data
4. AI generates exactly 15 top attractions with:
   - Names and descriptions
   - Estimated costs in USD
   - Ratings and types
   - Best times to visit
5. Results are displayed in beautiful cards with images

### AI-Generated Data Structure
The Gemini AI generates data matching your City model schema:
- Basic city info (name, country, coordinates, population)
- Climate and transportation details
- 15 detailed attractions with costs and descriptions
- Safety ratings and tags
- High-quality image URLs

## Features

### Enhanced Attraction Display
- **Top 3 Preview**: Shows first 3 attractions in city cards
- **Detailed View**: When viewing a single city, shows all 15 attractions in full cards
- **Cost Information**: Each attraction shows estimated entry fee
- **Rich Descriptions**: Detailed explanations of why each place is worth visiting
- **Visual Appeal**: Beautiful cards with images and hover effects

### Error Handling
- Graceful fallback when Gemini API is not configured
- Validation of AI-generated data
- User-friendly error messages
- Fallback images for missing photos

## Testing

### Test City Search
1. Start both backend and frontend servers
2. Go to the City Search page
3. Enter a city name (e.g., "Delhi", "Paris", "Tokyo")
4. Click "Search Cities"
5. View the generated city data and attractions

### Expected Results
- City overview card with basic information
- Top 3 attractions preview
- Detailed section showing all 15 attractions
- Each attraction card includes:
  - High-quality image
  - Name and type
  - Cost estimate
  - Rating (if available)
  - Description
  - Action buttons

## Troubleshooting

### Common Issues

1. **"Gemini API not configured" error**
   - Check that GEMINI_API_KEY is set in your .env file
   - Verify the API key is valid and has proper permissions

2. **"Failed to generate city data" error**
   - Check your internet connection
   - Verify Gemini API key is working
   - Check server logs for detailed error messages

3. **No attractions displayed**
   - Ensure the city search returned data
   - Check browser console for JavaScript errors
   - Verify the API response structure

### Debug Mode
Enable debug logging by setting `NODE_ENV=development` in your .env file.

## API Endpoints

### City Search
- `POST /api/cities/ai-search` - Search for any city using AI
- `GET /api/cities` - Search existing cities in database
- `GET /api/cities/:id` - Get specific city by ID

### AI Recommendations
- `POST /api/cities/ai-recommendations` - Get AI-powered city recommendations
- `POST /api/cities/:cityId/activities` - Get activity recommendations for a city

## Performance Notes

- AI generation takes 2-5 seconds depending on city complexity
- Results are cached in the frontend state
- Images are loaded from Unsplash with fallbacks
- Responsive design works on all device sizes

## Future Enhancements

- Save AI-generated cities to database
- User ratings and reviews for attractions
- Personalized attraction recommendations
- Integration with booking APIs
- Offline city data caching
