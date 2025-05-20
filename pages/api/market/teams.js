import dbConnect from '../../../lib/mongodb';
const Team = require('../../../models/Team');
const { getPrice } = require('../../../lib/bondingCurve');

export default async function handler(req, res) {
  await dbConnect();
  const teams = await Team.find({});
  const data = teams.map(team => ({
    _id: team._id,
    name: team.name,
    symbol: team.symbol,
    totalSupply: team.totalSupply,
    marketCap: team.marketCap,
    volume: team.volume,
    primaryColor: team.primaryColor || '#004c54',
    secondaryColor: team.secondaryColor || '#000000',
    price: getPrice(team.totalSupply),
  }));
  res.status(200).json(data);
} 