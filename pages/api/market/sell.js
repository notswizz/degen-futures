import dbConnect from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import User from '../../../models/User';
import Team from '../../../models/Team';
import Holding from '../../../models/Holding';
import Pot from '../../../models/Pot';
import Transaction from '../../../models/Transaction';
import { getSellRefund } from '../../../lib/bondingCurve';

const JWT_SECRET = process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  try {
    const { teamId, shares } = req.body;
    if (!teamId || !shares || shares <= 0) return res.status(400).json({ message: 'Invalid input' });
    
    // Auth
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return res.status(401).json({ message: 'Not authenticated' });
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    
    console.log('Sell API - User ID:', userId);
    
    // Convert string ID to MongoDB ObjectId
    const objectId = new mongoose.Types.ObjectId(userId);
    
    // Get user directly from MongoDB to avoid Mongoose model issues
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    const userDoc = await usersCollection.findOne({ _id: objectId });
    
    if (!userDoc) {
      console.log('User not found in Sell API');
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found in Sell API. Balance:', userDoc.balance);
    
    // Get team
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    
    // Get holding
    let holding = await Holding.findOne({ userId, teamId });
    if (!holding || holding.shares < shares) return res.status(400).json({ message: 'Not enough shares' });
    
    // Calculate refund and fee
    const refund = getSellRefund(team.totalSupply, shares);
    const fee = refund * 0.02;
    const total = refund - fee;
    
    // Get current balance, default to 1000 if undefined
    const currentBalance = typeof userDoc.balance === 'number' ? userDoc.balance : 1000;
    
    // Update user balance directly in MongoDB
    const newBalance = currentBalance + total;
    const updateResult = await usersCollection.updateOne(
      { _id: objectId },
      { $set: { balance: newBalance } }
    );
    
    console.log('MongoDB update result for balance:', updateResult);
    
    // Update team
    team.totalSupply -= shares;
    team.marketCap -= refund;
    team.volume += refund;
    await team.save();
    
    // Update holding
    holding.shares -= shares;
    if (holding.shares <= 0) {
      await holding.deleteOne();
    } else {
      await holding.save();
    }
    
    // Update pot
    let pot = await Pot.findOne();
    if (!pot) pot = await Pot.create({ amount: 0 });
    pot.amount += fee;
    await pot.save();
    
    // Log transaction
    await Transaction.create({ userId, teamId, type: 'sell', quantity: shares, price: refund / shares, fee, timestamp: new Date() });
    
    // Create new token with updated balance
    const payload = {
      userId: userId,
      email: userDoc.email,
      balance: newBalance
    };
    
    const newToken = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
    console.log('New token payload after sell:', payload);
    
    // Set cookie with new token
    res.setHeader('Set-Cookie', `token=${newToken}; Path=/; Max-Age=604800; SameSite=Lax`);
    
    res.status(200).json({ 
      team, 
      holding, 
      user: { balance: newBalance }, 
      total, 
      fee 
    });
  } catch (err) {
    console.error('Error in sell API:', err);
    res.status(500).json({ message: err.message });
  }
} 