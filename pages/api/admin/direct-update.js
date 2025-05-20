import dbConnect from '../../../lib/mongodb';
import mongoose from 'mongoose';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get direct access to the database and collections
    const db = mongoose.connection.db;
    
    // Get all collection names to verify the correct one
    const collections = await db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);
    console.log('All collections in database:', collectionNames);
    
    // Try to find the users collection (it might be named differently)
    const userCollectionName = collectionNames.find(name => 
      name === 'users' || name === 'user' || name.toLowerCase().includes('user')
    ) || 'users';
    
    console.log(`Using collection: ${userCollectionName}`);
    const usersCollection = db.collection(userCollectionName);
    
    // Get all users without modifying through Mongoose
    const usersBeforeUpdate = await usersCollection.find({}).toArray();
    console.log('Users before update:', JSON.stringify(usersBeforeUpdate, null, 2));
    
    // Get the MongoDB schema for a sample document
    if (usersBeforeUpdate.length > 0) {
      console.log('Sample document structure:', Object.keys(usersBeforeUpdate[0]));
    }
    
    // Direct MongoDB update bypassing Mongoose schema
    const updateResult = await usersCollection.updateMany(
      {}, // Match all documents
      { $set: { balance: 1000 } }, // Set balance to 1000
      { upsert: false } // Don't create if doesn't exist
    );
    
    // Get users after update
    const usersAfterUpdate = await usersCollection.find({}).toArray();
    
    return res.status(200).json({
      message: 'Direct update completed',
      databaseDetails: {
        collections: collectionNames,
        userCollection: userCollectionName
      },
      updateResult,
      usersBeforeUpdate: usersBeforeUpdate.map(u => ({ 
        id: u._id.toString(),
        email: u.email,
        hasBalanceField: u.balance !== undefined,
        balanceValue: u.balance,
        allFields: Object.keys(u)
      })),
      usersAfterUpdate: usersAfterUpdate.map(u => ({ 
        id: u._id.toString(),
        email: u.email,
        hasBalanceField: u.balance !== undefined,
        balanceValue: u.balance,
        allFields: Object.keys(u)
      }))
    });
  } catch (error) {
    console.error('Error in direct update:', error);
    return res.status(500).json({
      message: 'Error performing direct update',
      error: error.message,
      stack: error.stack
    });
  }
} 