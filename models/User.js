import mongoose from 'mongoose';

// Check if model already exists to prevent overwrite during hot reload
const User = mongoose.models.User || (() => {
  const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    balance: { 
      type: Number, 
      default: 1000,
      get: function(value) {
        // Always return a number, default to 1000 if undefined
        if (value === undefined || value === null) {
          return 1000;
        }
        return typeof value === 'number' ? value : Number(value);
      },
      set: function(value) {
        // Ensure balance is always stored as a number
        if (value === undefined || value === null) {
          return 1000;
        }
        return typeof value === 'number' ? value : Number(value);
      }
    },
    createdAt: { type: Date, default: Date.now },
  }, { 
    collection: 'users', // Explicitly set the collection name
    toJSON: { getters: true }, // Apply getters when converting to JSON
    toObject: { getters: true } // Apply getters when converting to object
  });
  
  return mongoose.model('User', UserSchema);
})();

export default User; 