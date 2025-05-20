import dbConnect from '../../../lib/mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';

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
    
    const user = await User.findOne({ email });
    if (!user) {
      console.log(`User not found for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log(`Invalid password for email: ${email}`);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    
    console.log(`Login successful for email: ${email}`);
    
    // Create token payload with clear user data
    const payload = { 
      userId: user._id.toString(), 
      email: user.email 
    };
    
    console.log('Token payload:', payload);
    
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