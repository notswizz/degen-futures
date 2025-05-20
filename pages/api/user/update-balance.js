import dbConnect from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import User from '../../../models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await dbConnect();
    
    // Get user ID from token
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Verify token and get userId
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    // Set a specific balance for testing
    const newBalance = 1000;
    
    // Find and update user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Update balance
    user.balance = newBalance;
    await user.save();
    
    // Create new token with updated balance
    const payload = {
      userId: user._id.toString(),
      email: user.email,
      balance: user.balance
    };
    
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    
    // Set new cookie
    res.setHeader('Set-Cookie', `token=${newToken}; Path=/; Max-Age=604800; SameSite=Lax`);
    
    return res.status(200).json({
      message: 'Balance updated successfully',
      user: payload
    });
  } catch (error) {
    console.error('Error updating balance:', error);
    return res.status(500).json({ 
      message: 'An error occurred while updating balance',
      error: error.message
    });
  }
} 