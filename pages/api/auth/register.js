import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Hardcoded fallback JWT secret - for development only
const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email and password required' });
  
  try {
    await dbConnect();
    
    // Check for existing user
    const existing = await User.findOne({ email });
    if (existing) return res.status(409).json({ message: 'Email already registered' });
    
    // Create new user
    const hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ email, password: hash });
    
    // Immediately log in the user
    const payload = {
      userId: newUser._id.toString(),
      email: newUser.email
    };
    
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
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