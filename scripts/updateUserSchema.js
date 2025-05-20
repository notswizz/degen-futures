// Script to update existing users with balance field
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - update with your actual connection string if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/degen-futures';

// Import the User model
const User = require('../models/User');

async function updateUsers() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users without a balance field or with balance = null
    const users = await User.find({ 
      $or: [
        { balance: { $exists: false } },
        { balance: null }
      ]
    });

    console.log(`Found ${users.length} users to update`);

    // Update each user with initial balance of 1000
    for (const user of users) {
      user.balance = 1000;
      await user.save();
      console.log(`Updated user: ${user.email} with balance: ${user.balance}`);
    }

    console.log('Schema migration completed successfully');
  } catch (error) {
    console.error('Error updating users:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateUsers(); 