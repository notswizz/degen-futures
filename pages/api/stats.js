// API endpoint to fetch statistics for the homepage
import dbConnect from '../../lib/mongodb';
import User from '../../models/User';
import Team from '../../models/Team';
import Transaction from '../../models/Transaction';
import Pot from '../../models/Pot';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await dbConnect();
    
    // Get total users count
    const totalUsers = await User.countDocuments({});
    
    // Get pot amount
    let potAmount = 0;
    const potDoc = await Pot.findOne({});
    if (potDoc) {
      potAmount = potDoc.amount;
    }
    
    // Get total teams count
    const totalTeams = await Team.countDocuments({});
    
    // Get total transactions count
    const totalTrades = await Transaction.countDocuments({});
    
    // Calculate total volume
    const volumeResult = await Transaction.aggregate([
      {
        $group: {
          _id: null,
          totalVolume: { $sum: '$price' }
        }
      }
    ]);
    
    const totalVolume = volumeResult.length > 0 ? volumeResult[0].totalVolume : 0;
    
    // Return the compiled stats
    return res.status(200).json({
      totalUsers,
      potAmount,
      totalTeams,
      totalVolume,
      totalTrades
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    
    // Return fallback data in case of error
    return res.status(200).json({
      totalUsers: 0,
      potAmount: 0,
      totalTeams: 0,
      totalVolume: 0,
      totalTrades: 0
    });
  }
} 