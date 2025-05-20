import dbConnect from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  // Add cache control headers to prevent browsers/frameworks from auto-refreshing
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  
  // Log every time this API is called with timestamp
  console.log(`Refresh API called at: ${new Date().toISOString()}`);

  try {
    await dbConnect();
    
    // Get token from cookies or Authorization header
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    console.log('Refresh API - decoded token:', decoded);
    
    // Convert string ID to MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(decoded.userId);
    
    // Get user directly from MongoDB for reliability
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const userDoc = await usersCollection.findOne({ _id: objectId });
    
    if (!userDoc) {
      console.log('User not found in refresh API');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found in refresh API. Balance:', userDoc.balance);
    
    // Ensure balance is a number with proper default
    const safeBalance = typeof userDoc.balance === 'number' ? userDoc.balance : 1000;
    
    // Create a new token with the updated data
    const payload = {
      userId: userDoc._id.toString(),
      email: userDoc.email,
      balance: safeBalance
    };
    
    console.log('Creating new token with payload:', payload);
    
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    // Set the new token in a cookie
    res.setHeader('Set-Cookie', `token=${newToken}; Path=/; Max-Age=604800; SameSite=Lax`);
    
    // Return the refreshed user data
    return res.status(200).json({
      message: 'Token refreshed',
      user: payload
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
} 