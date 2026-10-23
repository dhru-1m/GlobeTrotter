const mongoose = require('mongoose');
require('dotenv').config();

const attractions = [
  { name: 'Gateway of India', type: 'landmark', description: 'Iconic 20th-century basalt arch monument overlooking the Arabian Sea.', rating: 4.8, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Morning or Sunset' },
  { name: 'Marine Drive', type: 'landmark', description: 'The Queen\'s Necklace, a scenic 3.6-kilometer-long boulevard along the coast.', rating: 4.7, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Evening' },
  { name: 'Chhatrapati Shivaji Maharaj Terminus (CSMT)', type: 'historical', description: 'UNESCO World Heritage historic railway terminal with Victorian Gothic architecture.', rating: 4.6, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Daytime' },
  { name: 'Elephanta Caves', type: 'historical', description: 'UNESCO World Heritage collection of cave temples predominantly dedicated to Lord Shiva on Elephanta Island.', rating: 4.5, cost: 260, costCurrency: 'INR', bestTimeToVisit: 'Morning' },
  { name: 'Haji Ali Dargah', type: 'cultural', description: 'Renowned mosque and tomb located on an islet off the coast of Worli in Southern Mumbai.', rating: 4.6, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Afternoon' },
  { name: 'Bandra-Worli Sea Link', type: 'landmark', description: 'Modern cable-stayed bridge spanning the Mahim Bay connecting Bandra with Worli.', rating: 4.7, cost: 100, costCurrency: 'INR', bestTimeToVisit: 'Night' },
  { name: 'Siddhivinayak Temple', type: 'cultural', description: 'One of the most famous and auspicious Hindu temples dedicated to Lord Ganesha in Prabhadevi.', rating: 4.8, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Early Morning' },
  { name: 'Sanjay Gandhi National Park', type: 'natural', description: 'Sprawling protected national park featuring lush flora, fauna, and ancient Kanheri Caves.', rating: 4.5, cost: 85, costCurrency: 'INR', bestTimeToVisit: 'Morning' },
  { name: 'Colaba Causeway', type: 'shopping', description: 'Vibrant commercial street known for street fashion, curios, cafes, and bustling nightlife.', rating: 4.4, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Afternoon / Evening' },
  { name: 'Juhu Beach', type: 'beach', description: 'Famous shores known for street food delights like Pav Bhaji, Bhelpuri, and sunset strolls.', rating: 4.3, cost: 0, costCurrency: 'INR', bestTimeToVisit: 'Sunset' }
];

async function updateMumbai() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter');
  const City = mongoose.model('City', new mongoose.Schema({}, { strict: false }));
  const res = await City.updateOne(
    { name: { $regex: /^mumbai$/i } },
    { $set: { attractions: attractions } }
  );
  console.log('Update result:', res);
  await mongoose.disconnect();
}
updateMumbai().catch(err => { console.error(err); process.exit(1); });
