import dbConnect from '../../../lib/mongodb';
const Team = require('../../../models/Team');

// NFL team colors (primary, secondary)
const NFL_TEAM_COLORS = {
  'ARI': { primary: '#97233F', secondary: '#000000' }, // Arizona Cardinals
  'ATL': { primary: '#A71930', secondary: '#000000' }, // Atlanta Falcons
  'BAL': { primary: '#241773', secondary: '#000000' }, // Baltimore Ravens
  'BUF': { primary: '#00338D', secondary: '#C60C30' }, // Buffalo Bills
  'CAR': { primary: '#0085CA', secondary: '#101820' }, // Carolina Panthers
  'CHI': { primary: '#0B162A', secondary: '#C83803' }, // Chicago Bears
  'CIN': { primary: '#FB4F14', secondary: '#000000' }, // Cincinnati Bengals
  'CLE': { primary: '#FF3C00', secondary: '#311D00' }, // Cleveland Browns
  'DAL': { primary: '#003594', secondary: '#869397' }, // Dallas Cowboys
  'DEN': { primary: '#FB4F14', secondary: '#002244' }, // Denver Broncos
  'DET': { primary: '#0076B6', secondary: '#B0B7BC' }, // Detroit Lions
  'GB': { primary: '#203731', secondary: '#FFB612' },  // Green Bay Packers
  'HOU': { primary: '#03202F', secondary: '#A71930' }, // Houston Texans
  'IND': { primary: '#002C5F', secondary: '#A2AAAD' }, // Indianapolis Colts
  'JAX': { primary: '#101820', secondary: '#D7A22A' }, // Jacksonville Jaguars
  'KC': { primary: '#E31837', secondary: '#FFB81C' },  // Kansas City Chiefs
  'LV': { primary: '#000000', secondary: '#A5ACAF' },  // Las Vegas Raiders
  'LAC': { primary: '#0080C6', secondary: '#FFC20E' }, // Los Angeles Chargers
  'LAR': { primary: '#003594', secondary: '#FFA300' }, // Los Angeles Rams
  'MIA': { primary: '#008E97', secondary: '#FC4C02' }, // Miami Dolphins
  'MIN': { primary: '#4F2683', secondary: '#FFC62F' }, // Minnesota Vikings
  'NE': { primary: '#002244', secondary: '#C60C30' },  // New England Patriots
  'NO': { primary: '#D3BC8D', secondary: '#101820' },  // New Orleans Saints
  'NYG': { primary: '#0B2265', secondary: '#A71930' }, // New York Giants
  'NYJ': { primary: '#125740', secondary: '#000000' }, // New York Jets
  'PHI': { primary: '#004C54', secondary: '#A5ACAF' }, // Philadelphia Eagles
  'PIT': { primary: '#FFB612', secondary: '#101820' }, // Pittsburgh Steelers
  'SF': { primary: '#AA0000', secondary: '#B3995D' },  // San Francisco 49ers
  'SEA': { primary: '#002244', secondary: '#69BE28' }, // Seattle Seahawks
  'TB': { primary: '#D50A0A', secondary: '#B1BABF' },  // Tampa Bay Buccaneers
  'TEN': { primary: '#0C2340', secondary: '#4B92DB' }, // Tennessee Titans
  'WAS': { primary: '#773141', secondary: '#FFB612' }, // Washington Commanders
};

export default async function handler(req, res) {
  // Only allow POST method for this endpoint
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }
  
  try {
    await dbConnect();
    
    // Update team colors for existing teams
    const teams = await Team.find({});
    
    for (const team of teams) {
      const colors = NFL_TEAM_COLORS[team.symbol];
      if (colors) {
        team.primaryColor = colors.primary;
        team.secondaryColor = colors.secondary;
        await team.save();
      }
    }
    
    res.status(200).json({ message: 'Team colors updated successfully' });
  } catch (error) {
    console.error('Error updating team colors:', error);
    res.status(500).json({ message: 'Error updating team colors', error: error.message });
  }
} 