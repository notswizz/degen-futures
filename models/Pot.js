const mongoose = require('mongoose');

const PotSchema = new mongoose.Schema({
  amount: { type: Number, default: 0 },
});

const Pot = mongoose.models.Pot || mongoose.model('Pot', PotSchema);

module.exports = Pot; 