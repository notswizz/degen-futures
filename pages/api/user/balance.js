import dbConnect from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';

export default async function handler(req, res) {
  // Add cache control headers to prevent auto-refreshing
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Log timestamp for each API call
  console.log(`Balance API called at: ${new Date().toISOString()} - Method: ${req.method}`);
  
  await dbConnect();
  try {
    // Auth
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    console.log('Balance API - User ID:', userId);
    console.log('Current token balance:', decoded.balance);
    
    // Convert string ID to MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);
    
    // Get user directly from MongoDB to avoid any Mongoose model issues
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const userDoc = await usersCollection.findOne({ _id: objectId });
    
    if (!userDoc) {
      console.log(`User with ID ${userId} not found in MongoDB`);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found via MongoDB. Raw user data:', JSON.stringify(userDoc));
    console.log('User found via MongoDB. Current balance:', userDoc.balance, 'Type:', typeof userDoc.balance);
    
    // Handle GET request to fetch balance
    if (req.method === 'GET') {
      // Use a default of 1000 if balance doesn't exist
      const currentBalance = typeof userDoc.balance === 'number' ? userDoc.balance : 1000;
      
      return res.status(200).json({ 
        balance: currentBalance
      });
    }
    
    // Handle POST request to add balance
    if (req.method === 'POST') {
      const { amount } = req.body;
      console.log('POST received. Amount:', amount, 'Type:', typeof amount);
      
      // Convert amount to a number if it's a string
      let amountValue = amount;
      if (typeof amount === 'string') {
        amountValue = Number(amount);
      }
      
      if (isNaN(amountValue) || amountValue <= 0) {
        return res.status(400).json({ message: 'Valid amount required (must be a positive number)' });
      }
      
      // Current balance - default to 1000 if undefined
      const currentBalance = typeof userDoc.balance === 'number' ? userDoc.balance : 1000;
      console.log('Current balance:', currentBalance, 'Adding:', amountValue);
      
      // Calculate new balance
      const newBalance = currentBalance + amountValue;
      console.log('New balance should be:', newBalance, 'Type:', typeof newBalance);
      
      // Update balance directly in MongoDB
      const updateResult = await usersCollection.updateOne(
        { _id: objectId },
        { $set: { balance: newBalance } }
      );
      
      console.log('MongoDB update result:', JSON.stringify(updateResult));
      
      if (updateResult.matchedCount === 1) {
        // Verify the update worked by fetching the document again
        const updatedUser = await usersCollection.findOne({ _id: objectId });
        console.log('Updated user document:', JSON.stringify(updatedUser));
        console.log('Updated user balance:', updatedUser.balance, 'Type:', typeof updatedUser.balance);
        
        // Create new token with updated balance
        const payload = {
          userId: userId,
          email: userDoc.email,
          balance: updatedUser.balance
        };
        
        const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
        console.log('New token payload:', payload);
        
        // Set cookie with new token
        res.setHeader('Set-Cookie', `token=${newToken}; Path=/; Max-Age=604800; SameSite=Lax`);
        
        return res.status(200).json({ 
          message: 'Balance updated',
          previousBalance: currentBalance,
          amountAdded: amountValue,
          balance: updatedUser.balance
        });
      } else {
        return res.status(500).json({ message: 'Failed to update balance' });
      }
    }
    
    return res.status(405).json({ message: 'Method not allowed' });
  } catch (err) {
    console.error('Error in balance API:', err);
    return res.status(500).json({ message: err.message });
  }
} 