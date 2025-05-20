import dbConnect from '../../../lib/mongodb';
import Transaction from '../../../models/Transaction';
import Team from '../../../models/Team';
import User from '../../../models/User';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end();
  
  await dbConnect();
  
  try {
    // Check if user is authenticated
    const authHeader = req.headers.authorization;
    let userId = null;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'degen_futures_hardcoded_jwt_secret_key_for_dev');
        userId = decoded.userId;
      } catch (err) {
        console.error('Token verification failed:', err);
      }
    }
    
    // Get query params
    const { type } = req.query; // 'user' or 'global'
    
    // Fetch transactions
    let transactions = [];
    let query = {};
    
    if (type === 'user') {
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized' });
      }
      query.userId = userId;
    }
    
    // Limit to the most recent 50 transactions
    transactions = await Transaction.find(query)
      .sort({ timestamp: -1 })
      .limit(50)
      .lean();
    
    // Get team details for each transaction
    const teamIds = [...new Set(transactions.map(t => t.teamId))];
    const teams = await Team.find({ _id: { $in: teamIds } }).lean();
    const teamsMap = teams.reduce((map, team) => {
      map[team._id.toString()] = team;
      return map;
    }, {});
    
    // If global, get user emails too
    let usersMap = {};
    if (type === 'global' && transactions.length > 0) {
      const userIds = [...new Set(transactions.map(t => t.userId))];
      const users = await User.find({ _id: { $in: userIds } }, 'email').lean();
      usersMap = users.reduce((map, user) => {
        map[user._id.toString()] = user;
        return map;
      }, {});
    }
    
    // Enrich transaction data
    const enrichedTransactions = transactions.map(transaction => {
      const team = teamsMap[transaction.teamId.toString()];
      const transactionData = {
        ...transaction,
        teamSymbol: team ? team.symbol : 'Unknown',
        teamName: team ? (team.city + ' ' + team.name) : 'Unknown Team',
        timestamp: transaction.timestamp,
        // Map quantity to shares for frontend consistency
        shares: transaction.quantity,
      };
      
      // Add user email for global history
      if (type === 'global') {
        const user = usersMap[transaction.userId.toString()];
        transactionData.userEmail = user ? user.email : 'Unknown User';
        // Mask email for privacy
        if (transactionData.userEmail !== 'Unknown User') {
          const [username, domain] = transactionData.userEmail.split('@');
          transactionData.userEmail = `${username.substring(0, 3)}***@${domain}`;
        }
      }
      
      return transactionData;
    });
    
    return res.status(200).json(enrichedTransactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
} 