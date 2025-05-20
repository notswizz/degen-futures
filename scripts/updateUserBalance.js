// Script to update a specific user's balance
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string - update with your actual connection string if needed
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/degen-futures';

// Import the User model
const User = require('../models/User');

async function updateUserBalance() {
  // Get user email from command line arguments
  const userEmail = process.argv[2];
  const newBalance = parseInt(process.argv[3], 10);
  
  if (!userEmail || !newBalance || isNaN(newBalance)) {
    console.error('Usage: node updateUserBalance.js <email> <balance>');
    console.error('Example: node updateUserBalance.js user@example.com 1000');
    process.exit(1);
  }
  
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find the user by email
    const user = await User.findOne({ email: userEmail });
    
    if (!user) {
      console.error(`User with email ${userEmail} not found`);
      process.exit(1);
    }

    // Update user balance
    const oldBalance = user.balance || 0;
    user.balance = newBalance;
    await user.save();
    
    console.log(`Updated user: ${user.email}`);
    console.log(`Previous balance: ${oldBalance}`);
    console.log(`New balance: ${user.balance}`);

    console.log('Balance update completed successfully');
  } catch (error) {
    console.error('Error updating user balance:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateUserBalance(); 