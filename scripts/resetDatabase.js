require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');
const Team = require('../models/Team');
const Holding = require('../models/Holding');
const Transaction = require('../models/Transaction');

// Function to reset database
async function resetDatabase(resetUserBalances = true) {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // 1. Clear all holdings
    console.log('Clearing all user holdings...');
    await Holding.deleteMany({});
    console.log('✅ All holdings cleared');

    // 2. Reset all teams to $1 pricing (total supply 0, market cap 0)
    console.log('Resetting all teams...');
    const teams = await Team.find({});
    
    const resetPromises = teams.map(team => {
      team.totalSupply = 0;
      team.marketCap = 0;
      team.volume = 0;
      return team.save();
    });
    
    await Promise.all(resetPromises);
    console.log(`✅ Reset ${teams.length} teams to $1 pricing (0 supply, 0 market cap)`);

    // 3. Optionally reset user balances to default (1000)
    if (resetUserBalances) {
      console.log('Resetting all user balances to default (1000)...');
      // Update users directly through MongoDB collection
      const db = mongoose.connection.db;
      const result = await db.collection('users').updateMany(
        {}, 
        { $set: { balance: 1000 } }
      );
      console.log(`✅ ${result.modifiedCount} user balances reset to 1000`);
    }

    // 4. Clear all transaction history
    console.log('Clearing transaction history...');
    await Transaction.deleteMany({});
    console.log('✅ Transaction history cleared');

    console.log('🎉 Database reset complete!');
    process.exit(0);
  } catch (err) {
    console.error('Error resetting database:', err);
    process.exit(1);
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const keepUserBalances = args.includes('--keep-balances');

// Run the reset function
resetDatabase(!keepUserBalances); 