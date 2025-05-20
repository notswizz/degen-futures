// Script to directly update a specific user's balance in MongoDB
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/degen-futures';

async function updateDirectly() {
  try {
    // Connect directly to MongoDB
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Get direct access to the users collection
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // The specific user ID to update
    const userId = '682ab09d0bc42802944bdb88';
    
    // Update using MongoDB native driver (bypassing Mongoose schema)
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(userId) },
      { $set: { balance: 1000 } }
    );
    
    console.log('Update result:', result);
    
    // Verify the update worked
    const updatedUser = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(userId) });
    console.log('Updated user document:', JSON.stringify(updatedUser, null, 2));
    console.log('Balance field exists:', updatedUser.balance !== undefined);
    console.log('Balance value:', updatedUser.balance);

  } catch (error) {
    console.error('Error updating user:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
}

// Run the update function
updateDirectly(); 