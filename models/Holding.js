const mongoose = require('mongoose');

const HoldingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  shares: { type: Number, default: 0 },
});

HoldingSchema.index({ userId: 1, teamId: 1 }, { unique: true });

const Holding = mongoose.models.Holding || mongoose.model('Holding', HoldingSchema);

module.exports = Holding; 