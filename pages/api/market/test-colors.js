import dbConnect from '../../../lib/mongodb';
const Team = require('../../../models/Team');

export default async function handler(req, res) {
  try {
    await dbConnect();
    const teams = await Team.find({});
    
    // Return only relevant fields for debugging
    const data = teams.map(team => ({
      _id: team._id,
      symbol: team.symbol,
      name: team.name,
      primaryColor: team.primaryColor,
      secondaryColor: team.secondaryColor,
    }));
    
    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching team colors:', error);
    res.status(500).json({ message: 'Error fetching team colors', error: error.message });
  }
} 