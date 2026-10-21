const mongoose = require('mongoose');
const User = require('./models/User');
require('dotenv').config();

const makeUserAdmin = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter');
    console.log('✅ Connected to MongoDB');

    // Find the first user or get user by email
    const email = process.argv[2]; // Allow passing email as argument
    let user;
    
    if (email) {
      user = await User.findOne({ email: email.toLowerCase() });
      if (!user) {
        console.log(`❌ User with email ${email} not found`);
        process.exit(1);
      }
    } else {
      user = await User.findOne().sort({ createdAt: 1 });
      if (!user) {
        console.log('❌ No users found in the database');
        process.exit(1);
      }
    }

    // Update user role to admin
    user.role = 'admin';
    await user.save();

    console.log(`✅ User ${user.name} (${user.email}) is now an admin`);
    console.log('📊 They can now access the admin dashboard at /admin');

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    mongoose.connection.close();
    process.exit(0);
  }
};

console.log('🔧 Making user admin...');
makeUserAdmin();
