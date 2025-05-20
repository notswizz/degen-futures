import dbConnect from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';
import mongoose from 'mongoose';

// Hardcoded fallback JWT secret - for development only
const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  console.log('JWT_SECRET exists:', !!JWT_SECRET);
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  try {
    await dbConnect();
    console.log(`Attempting login for email: ${email}`);
    
    // Find the user through Mongoose
    let user = await User.findOne({ email });
    let userDoc = null;
    
    // If user not found through Mongoose, try direct MongoDB access
    if (!user) {
      console.log('User not found via Mongoose model, trying direct database access');
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      userDoc = await usersCollection.findOne({ email });
      
      // If still not found, return error
      if (!userDoc) {
        console.log(`User not found for email: ${email}`);
        return res.status(401).json({ message: 'Invalid credentials' });
      }
      
      console.log('User found via direct MongoDB access');
    }
    
    // Check password - whether using Mongoose user or direct MongoDB doc
    const passwordToCheck = user ? user.password : userDoc.password;
    const valid = await bcrypt.compare(password, passwordToCheck);
    
    if (!valid) {
      console.log(`Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log(`Login successful for email: ${email}`);
    
    // If using direct MongoDB document, ensure it has a balance
    if (!user && userDoc) {
      // If balance doesn't exist in the document, add it directly
      if (userDoc.balance === undefined) {
        console.log('Adding balance field to user document');
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        await usersCollection.updateOne(
          { _id: userDoc._id },
          { $set: { balance: 1000 } }
        );
        userDoc.balance = 1000;
      }
      
      // Create token payload with the MongoDB document data
      const payload = { 
        userId: userDoc._id.toString(), 
        email: userDoc.email,
        balance: userDoc.balance || 0
      };
      
      console.log('Token payload (from direct MongoDB):', payload);
      
      // Create the token
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
      
      // For debugging
      console.log('Token created:', !!token, 'Length:', token.length);
      
      // Set both cookie and return token in response
      res.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=604800; SameSite=Lax`);
      
      return res.status(200).json({ 
        message: 'Logged in',
        token: token, // Include token in response
        user: payload
      });
    }
    
    // If we're here, we're using the Mongoose user object
    
    // Ensure user has a balance field
    if (user.balance === undefined) {
      user.balance = 1000;
      await user.save();
    }
    
    // Create token payload with clear user data
    const payload = { 
      userId: user._id.toString(), 
      email: user.email,
      balance: user.balance
    };
    
    console.log('Token payload (from Mongoose):', payload);
    
    // Create the token
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    // For debugging
    console.log('Token created:', !!token, 'Length:', token.length);
    
    // Set both cookie and return token in response
    res.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=604800; SameSite=Lax`);
    
    return res.status(200).json({ 
      message: 'Logged in',
      token: token, // Include token in response
      user: payload
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error during login' });
  }
} 