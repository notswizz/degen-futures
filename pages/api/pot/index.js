import dbConnect from '../../../lib/mongodb';
const Pot = require('../../../models/Pot');

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  
  await dbConnect();
  
  try {
    // Get pot data
    let pot = await Pot.findOne();
    
    // If no pot exists yet, create one with zero amount
    if (!pot) {
      pot = await Pot.create({ amount: 0 });
    }
    
    res.status(200).json({ amount: pot.amount });
  } catch (err) {
    console.error('Error fetching pot data:', err);
    res.status(500).json({ message: 'Failed to fetch pot data' });
  }
} 