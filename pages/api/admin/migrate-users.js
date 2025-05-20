import dbConnect from '../../../lib/mongodb';
import User from '../../../models/User';

// Default balance to assign to all users during migration
const DEFAULT_BALANCE = 1000;

export default async function handler(req, res) {
  // Only allow POST requests for security
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    // Connect to the database
    await dbConnect();
    
    // Find all users that don't have a balance field or have balance set to null
    const users = await User.find({
      $or: [
        { balance: { $exists: false } },
        { balance: null }
      ]
    });
    
    if (users.length === 0) {
      return res.status(200).json({ 
        message: 'No users need migration',
        migratedCount: 0
      });
    }
    
    // Track the users we updated
    const updatedUsers = [];
    
    // Update each user with the default balance
    for (const user of users) {
      user.balance = DEFAULT_BALANCE;
      await user.save();
      updatedUsers.push({
        email: user.email,
        id: user._id.toString(),
        balance: user.balance
      });
    }
    
    return res.status(200).json({
      message: 'Successfully migrated users',
      migratedCount: users.length,
      updatedUsers
    });
  } catch (error) {
    console.error('Error in user migration:', error);
    return res.status(500).json({ 
      message: 'An error occurred while migrating users',
      error: error.message
    });
  }
} 