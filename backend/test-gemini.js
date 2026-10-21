require('dotenv').config();
const geminiService = require('./services/geminiService');

async function testGemini() {
  try {
    console.log('🧪 Testing Gemini API integration...');
    
    if (!process.env.GEMINI_API_KEY) {
      console.log('❌ GEMINI_API_KEY not found in environment variables');
      console.log('📝 Please add your Gemini API key to the .env file');
      return;
    }
    
    if (process.env.GEMINI_API_KEY === 'your_gemini_api_key_here') {
      console.log('❌ Please replace the placeholder API key with your actual Gemini API key');
      return;
    }
    
    console.log('✅ Gemini API key found');
    console.log('🔍 Testing city data generation for "Delhi"...');
    
    const cityData = await geminiService.generateCityData('Delhi');
    
    if (cityData.error) {
      console.log('❌ Error generating city data:', cityData.error);
      return;
    }
    
    console.log('✅ City data generated successfully!');
    console.log(`🏙️ City: ${cityData.name}, ${cityData.country}`);
    console.log(`📍 Coordinates: ${cityData.coordinates.lat}, ${cityData.coordinates.lng}`);
    console.log(`👥 Population: ${cityData.population?.toLocaleString()}`);
    console.log(`💰 Cost Index: ${cityData.costIndex}`);
    console.log(`🎯 Attractions: ${cityData.attractions?.length || 0} found`);
    
    if (cityData.attractions && cityData.attractions.length > 0) {
      console.log('\n🏛️ Top 3 Attractions:');
      cityData.attractions.slice(0, 3).forEach((attraction, index) => {
        console.log(`  ${index + 1}. ${attraction.name} - $${attraction.cost} (${attraction.type})`);
      });
    }
    
    console.log('\n🎉 Gemini API integration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.message.includes('Gemini API not configured')) {
      console.log('💡 Make sure GEMINI_API_KEY is set in your .env file');
    }
  }
}

// Run the test
testGemini();
