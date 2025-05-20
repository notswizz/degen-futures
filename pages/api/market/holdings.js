import dbConnect from '../../../lib/mongodb';
import jwt from 'jsonwebtoken';
const Holding = require('../../../models/Holding');

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  await dbConnect();
  try {
    const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.split(' ')[1]);
    if (!token) return res.status(401).json([]);
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const holdings = await Holding.find({ userId });
    res.status(200).json(holdings.map(h => ({ teamId: h.teamId.toString(), shares: h.shares })));
  } catch (err) {
    res.status(401).json([]);
  }
} 