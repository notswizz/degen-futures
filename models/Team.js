const mongoose = require('mongoose');

const TeamSchema = new mongoose.Schema({
  name: { type: String, required: true },
  symbol: { type: String, required: true, unique: true },
  totalSupply: { type: Number, default: 0 },
  marketCap: { type: Number, default: 0 },
  volume: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

const Team = mongoose.models.Team || mongoose.model('Team', TeamSchema);

module.exports = Team; 