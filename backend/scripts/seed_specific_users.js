/*
  Seed specific users with hashed passwords and exact timestamps
  Run:
    node scripts/seed_specific_users.js
*/

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

function dateYMD(y, m /* 1-12 */, d) {
  return new Date(y, m - 1, d, 9, 0, 0, 0); // 09:00 local time for stability
}

async function connectDB() {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/globetrotter';
  await mongoose.connect(uri);
  console.log('Connected to MongoDB');
}

async function upsertUser({ name, email, role, createdAt, lastLogin, password }) {
  const existing = await User.findOne({ email }).select('+password');
  if (existing) {
    existing.name = name;
    existing.role = role || existing.role || 'user';
    // Keep existing password (already hashed), unless we explicitly set one
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      existing.password = hashed;
    }
    if (createdAt) existing.createdAt = createdAt;
    if (lastLogin) existing.lastLogin = lastLogin;
    await existing.save();
    console.log(`Updated: ${name} (${email})`);
    return existing;
  } else {
    const hashed = await bcrypt.hash(password || '12345678', 10);
    const user = new User({
      name,
      email,
      password: hashed,
      role: role || 'user',
      createdAt: createdAt || new Date(),
      lastLogin: lastLogin || new Date(),
      preferences: {
        language: 'en',
        currency: 'USD',
        timezone: 'Asia/Kolkata',
        theme: 'light',
        emailNotifications: true,
        pushNotifications: true,
        marketingEmails: false
      }
    });
    await user.save();
    console.log(`Created: ${name} (${email})`);
    return user;
  }
}

async function run() {
  try {
    await connectDB();

    const d1108 = dateYMD(2025, 8, 11);
    const d1208 = dateYMD(2025, 8, 12);

    const targets = [
      { name: 'Het Patel', email: 'hkpatel@gmail.com', role: 'admin', createdAt: d1108, lastLogin: d1208, password: '12345678' },
      { name: 'Test User', email: 'test@example.com', role: 'user', createdAt: d1108, lastLogin: d1108, password: '12345678' },
      { name: 'user1', email: 'user1@gmail.com', role: 'user', createdAt: d1108, lastLogin: d1108, password: '12345678' },
      { name: 'user2', email: 'user2@gmail.com', role: 'user', createdAt: d1108, lastLogin: d1108, password: '12345678' }
    ];

    for (const t of targets) {
      await upsertUser(t);
    }

    console.log('Specific users ensured with hashed passwords and timestamps.');
  } catch (err) {
    console.error('Seed specific users error:', err);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close();
    console.log('Disconnected from MongoDB');
  }
}

run();
