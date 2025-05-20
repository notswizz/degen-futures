import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Hardcoded fallback JWT secret - for development only
const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';
// Initial balance for new users - can be adjusted as needed
const INITIAL_BALANCE = 1000;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  try {
    await dbConnect();
    console.log('Registering new user:', email);
    
    // Check for existing user in Mongoose
    let existing = await User.findOne({ email });
    
    // If not found in Mongoose, check direct MongoDB
    if (!existing) {
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      const existingInMongo = await usersCollection.findOne({ email });
      
      if (existingInMongo) {
        console.log('User found in MongoDB but not in Mongoose:', email);
        existing = existingInMongo;
      }
    }
    
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    
    // Create new user
    const hash = await bcrypt.hash(password, 10);
    
    let newUser;
    try {
      // Try to create user via Mongoose first
      newUser = await User.create({ 
        email, 
        password: hash,
        balance: INITIAL_BALANCE 
      });
      console.log('User created via Mongoose:', newUser._id.toString());
    } catch (mongooseError) {
      console.error('Error creating user via Mongoose:', mongooseError);
      
      // If Mongoose fails, try direct MongoDB insertion
      try {
        const db = mongoose.connection.db;
        const usersCollection = db.collection('users');
        
        const result = await usersCollection.insertOne({
          email,
          password: hash,
          balance: INITIAL_BALANCE,
          createdAt: new Date()
        });
        
        // Create a simplified object to match Mongoose structure
        newUser = {
          _id: result.insertedId,
          email,
          balance: INITIAL_BALANCE
        };
        
        console.log('User created via direct MongoDB:', newUser._id.toString());
      } catch (mongoError) {
        console.error('Error creating user via direct MongoDB:', mongoError);
        throw new Error('Failed to create user account');
      }
    }
    
    // Double check if balance was set
    if (newUser.balance === undefined) {
      console.warn('Balance was not set during user creation, fixing now');
      
      const db = mongoose.connection.db;
      const usersCollection = db.collection('users');
      
      await usersCollection.updateOne(
        { _id: newUser._id },
        { $set: { balance: INITIAL_BALANCE } }
      );
      
      newUser.balance = INITIAL_BALANCE;
    }
    
    // Immediately log in the user
    const payload = {
      userId: newUser._id.toString(),
      email: newUser.email,
      balance: newUser.balance
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    // Log the final payload for debugging
    console.log('Registration successful, token payload:', payload);
    
    // Set cookie and return user data
    res.setHeader('Set-Cookie', `token=${token}; Path=/; Max-Age=604800; SameSite=Lax`);
    
    return res.status(201).json({
      message: 'User registered and logged in',
      token,
      user: payload
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Error registering user' });
  }
} 