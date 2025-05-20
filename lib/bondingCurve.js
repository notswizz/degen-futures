const basePrice = 1;
const slope = 1;

function getPrice(totalSupply) {
  return basePrice + slope * Math.log(1 + totalSupply);
}

// Calculate total cost to buy X shares (integrate curve)
function getBuyCost(totalSupply, shares) {
  // Integrate from totalSupply to totalSupply + shares
  // ∫(basePrice + slope * log(1 + x)) dx from a to b
  // = basePrice * (b - a) + slope * [(1 + b) * log(1 + b) - (1 + a) * log(1 + a) - (b - a)]
  const a = totalSupply;
  const b = totalSupply + shares;
  const cost =
    basePrice * (b - a) +
    slope * ((1 + b) * Math.log(1 + b) - (1 + a) * Math.log(1 + a) - (b - a));
  return cost;
}

// Calculate refund for selling X shares (reverse integration)
function getSellRefund(totalSupply, shares) {
  // Integrate from totalSupply to totalSupply - shares
  // (assume shares <= totalSupply)
  const a = totalSupply - shares;
  const b = totalSupply;
  return getBuyCost(a, shares); // same as buy cost for those shares
}

module.exports = { getPrice, getBuyCost, getSellRefund }; 