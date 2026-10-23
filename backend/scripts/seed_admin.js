require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const mongoose = require('mongoose');
const User = require('../models/User');

async function seedAdmin() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    const adminEmail = 'admin@globetrotter.com';
    const adminPassword = '12345678';
    const adminName = 'GlobeTrotter Admin';

    let user = await User.findOne({ email: adminEmail });

    if (user) {
      user.name = adminName;
      user.role = 'admin';
      user.password = adminPassword; // pre-save hook will hash this
      user.isActive = true;
      user.emailVerified = true;
      await user.save();
      console.log(`✅ Admin user updated successfully!`);
    } else {
      user = new User({
        name: adminName,
        email: adminEmail,
        password: adminPassword, // pre-save hook will hash this
        role: 'admin',
        isActive: true,
        emailVerified: true,
        preferences: {
          language: 'en',
          currency: 'USD',
          theme: 'light'
        }
      });
      await user.save();
      console.log(`✅ Admin user created successfully!`);
    }

    // Verify password check
    const verifyUser = await User.findOne({ email: adminEmail }).select('+password');
    const isMatch = await verifyUser.comparePassword(adminPassword);
    console.log(`🔑 Verification check: password matches = ${isMatch}`);

    console.log('\n=======================================');
    console.log('       ADMIN CREDENTIALS');
    console.log('=======================================');
    console.log(`Email:    ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    console.log(`Role:     admin`);
    console.log('=======================================\n');

  } catch (error) {
    console.error('❌ Error seeding admin:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
}

seedAdmin();
