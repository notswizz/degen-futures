import dbConnect from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
const User = require('../../../models/User');
const Team = require('../../../models/Team');
const Holding = require('../../../models/Holding');
const Pot = require('../../../models/Pot');
const Transaction = require('../../../models/Transaction');
const { getBuyCost } = require('../../../lib/bondingCurve');

const JWT_SECRET = process.env.JWT_SECRET;

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
    // Get team
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    // Calculate cost and fee
    const cost = getBuyCost(team.totalSupply, shares);
    const fee = cost * 0.02;
    const total = cost + fee;
    // Update team
    team.totalSupply += shares;
    team.marketCap += total;
    team.volume += total;
    await team.save();
    // Update holding
    let holding = await Holding.findOne({ userId, teamId });
    if (!holding) {
      holding = await Holding.create({ userId, teamId, shares });
    } else {
      holding.shares += shares;
      await holding.save();
    }
    // Update pot
    let pot = await Pot.findOne();
    if (!pot) pot = await Pot.create({ amount: 0 });
    pot.amount += fee;
    await pot.save();
    // Log transaction
    await Transaction.create({ userId, teamId, type: 'buy', quantity: shares, price: cost / shares, fee, timestamp: new Date() });
    res.status(200).json({ team, holding, total, fee });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
} 