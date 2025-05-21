import dbConnect from '../../../lib/mongodb';
import Transaction from '../../../models/Transaction';
import Team from '../../../models/Team';
import mongoose from 'mongoose';
import { getPrice } from '../../../lib/bondingCurve';

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });
  
  await dbConnect();
  
  try {
    const { teamId, limit = 100 } = req.query;
    
    if (!teamId) {
      return res.status(400).json({ message: 'Team ID is required' });
    }

    // Validate teamId format
    if (!mongoose.Types.ObjectId.isValid(teamId)) {
      return res.status(400).json({ message: 'Invalid team ID format' });
    }
    
    // Find the team to verify it exists
    const team = await Team.findById(teamId);
    if (!team) {
      return res.status(404).json({ message: 'Team not found' });
    }

    // Get transactions for this team, sorted by timestamp (oldest first)
    // to create a timeline of price points
    const transactions = await Transaction.find({ teamId })
      .sort({ timestamp: 1 })
      .limit(parseInt(limit, 10))
      .lean();
    
    // Format the data for the price chart
    const chartData = transactions.map(tx => ({
      timestamp: tx.timestamp,
      transactionPrice: tx.price, // Store the original transaction price
      price: null, // We'll calculate the actual price based on supply
      type: tx.type,
      supply: null, // We'll calculate this
      quantity: tx.quantity
    }));
    
    // Calculate the cumulative supply at each transaction point
    // Starting from the current supply and working backwards
    let runningSupply = team.totalSupply;
    
    // Reverse through the transactions to accurately calculate historical supply
    for (let i = chartData.length - 1; i >= 0; i--) {
      chartData[i].supply = runningSupply;
      
      // Calculate the actual price at this supply point using the bonding curve
      chartData[i].price = getPrice(runningSupply);
      
      // Adjust running supply based on transaction type
      const quantity = transactions[i].quantity;
      if (chartData[i].type === 'buy') {
        runningSupply -= quantity; // Before this buy, supply was lower
      } else {
        runningSupply += quantity; // Before this sell, supply was higher
      }
    }
    
    // Now re-sort to ensure chronological order (oldest to newest)
    chartData.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    
    // Calculate the current market price using the bonding curve
    const currentPrice = getPrice(team.totalSupply);
    
    // Add team information
    const response = {
      team: {
        id: team._id,
        symbol: team.symbol,
        name: team.name,
        primaryColor: team.primaryColor,
        secondaryColor: team.secondaryColor,
        currentSupply: team.totalSupply,
        currentPrice: currentPrice // Use calculated price from bonding curve
      },
      chartData: chartData
    };
    
    return res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching team transactions:', error);
    return res.status(500).json({ message: 'Server error' });
  }
} 