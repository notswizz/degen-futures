// Script to check if users have balance field in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - update with your actual connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/degen-futures';

// Import the User model
const User = require('../models/User');

async function checkUserBalance() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all users
    const users = await User.find({});
    
    console.log(`Found ${users.length} users in the database`);
    
    // Check each user
    users.forEach(user => {
      console.log(`User: ${user.email}`);
      console.log(`Has balance field: ${user.balance !== undefined}`);
      console.log(`Balance value: ${user.balance}`);
      console.log('---');
    });

  } catch (error) {
    console.error('Error checking users:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the check function
checkUserBalance(); 