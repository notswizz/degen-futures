import dbConnect from '../../../lib/mongodb';
const Team = require('../../../models/Team');

const teams = [
  { name: 'Arizona Cardinals', symbol: 'ARI' },
  { name: 'Atlanta Falcons', symbol: 'ATL' },
  { name: 'Baltimore Ravens', symbol: 'BAL' },
  { name: 'Buffalo Bills', symbol: 'BUF' },
  { name: 'Carolina Panthers', symbol: 'CAR' },
  { name: 'Chicago Bears', symbol: 'CHI' },
  { name: 'Cincinnati Bengals', symbol: 'CIN' },
  { name: 'Cleveland Browns', symbol: 'CLE' },
  { name: 'Dallas Cowboys', symbol: 'DAL' },
  { name: 'Denver Broncos', symbol: 'DEN' },
  { name: 'Detroit Lions', symbol: 'DET' },
  { name: 'Green Bay Packers', symbol: 'GB' },
  { name: 'Houston Texans', symbol: 'HOU' },
  { name: 'Indianapolis Colts', symbol: 'IND' },
  { name: 'Jacksonville Jaguars', symbol: 'JAX' },
  { name: 'Kansas City Chiefs', symbol: 'KC' },
  { name: 'Las Vegas Raiders', symbol: 'LV' },
  { name: 'Los Angeles Chargers', symbol: 'LAC' },
  { name: 'Los Angeles Rams', symbol: 'LAR' },
  { name: 'Miami Dolphins', symbol: 'MIA' },
  { name: 'Minnesota Vikings', symbol: 'MIN' },
  { name: 'New England Patriots', symbol: 'NE' },
  { name: 'New Orleans Saints', symbol: 'NO' },
  { name: 'New York Giants', symbol: 'NYG' },
  { name: 'New York Jets', symbol: 'NYJ' },
  { name: 'Philadelphia Eagles', symbol: 'PHI' },
  { name: 'Pittsburgh Steelers', symbol: 'PIT' },
  { name: 'San Francisco 49ers', symbol: 'SF' },
  { name: 'Seattle Seahawks', symbol: 'SEA' },
  { name: 'Tampa Bay Buccaneers', symbol: 'TB' },
  { name: 'Tennessee Titans', symbol: 'TEN' },
  { name: 'Washington Commanders', symbol: 'WAS' },
];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ message: 'Method not allowed' });
  await dbConnect();
  // Remove existing teams to avoid duplicates
  await Team.deleteMany({});
  const created = await Team.insertMany(teams);
  res.status(201).json(created);
} 