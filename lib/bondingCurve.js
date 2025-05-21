// --- NEW POLYNOMIAL BONDING CURVE PARAMETERS ---
// Formula: P(S) = basePrice + k * S^exponent
// S = current total supply

const basePrice = 1.0;   // Price of the very first share (P(0) when supply is 0)
const k = 0.005;          // Scaling factor: how quickly price increases with supply
const exponent = 1.5;    // Shape of the curve (e.g., 1=linear, >1=convex/accelerating)
                         // This exponent is applied directly to S.

/**
 * Calculate instantaneous price at a specific supply point.
 * This is P(S) = basePrice + k * S^exponent.
 * It represents the price of the (S+1)-th share if current supply is S.
 * @param {number} totalSupply - The current total supply of shares.
 * @returns {number} The price at this supply point.
 */
function getPrice(totalSupply) {
  if (totalSupply < 0) totalSupply = 0; 
  // Math.pow(0, exponent) is 0 if exponent > 0.
  // If exponent is 0, Math.pow(0,0) is 1. Price becomes basePrice + k.
  // If totalSupply is 0 and exponent > 0, price is basePrice.
  return basePrice + k * Math.pow(totalSupply, exponent);
}

/**
 * Helper function to calculate the integral of the price function P(S) = basePrice + k*S^exponent.
 * Integral I(S) = basePrice*S + (k/(exponent+1))*S^(exponent+1)
 * Special case: if exponent = -1, Integral I(S) = basePrice*S + k*ln(S)
 * @param {number} supply - The supply level up to which to integrate.
 * @returns {number} The value of the definite integral from 0 to supply.
 */
function _calculateIntegral(supply) {
  // For S=0, the integral value is 0. 
  // For S<0, it's usually not a valid domain for supply.
  if (supply <= 0) return 0; 
  
  const term1 = basePrice * supply;
  let term2;

  if (exponent === -1) {
    // Price function P(S) = basePrice + k/S
    // Integral is basePrice*S + k*ln(S)
    // Math.log(supply) is safe here because supply > 0
    term2 = k * Math.log(supply);
  } else {
    // Price function P(S) = basePrice + k*S^exponent
    // Integral is basePrice*S + (k/(exponent+1))*S^(exponent+1)
    // This general form also works for exponent = 0.
    term2 = (k / (exponent + 1)) * Math.pow(supply, exponent + 1);
  }
  return term1 + term2;
}

/**
 * Calculate total cost to buy X shares with the polynomial bonding curve.
 * Uses integration for efficiency.
 * @param {number} currentSupply - The current total supply before buying.
 * @param {number} sharesToBuy - The number of shares to buy.
 * @returns {number} The total cost for these shares.
 */
function getBuyCost(currentSupply, sharesToBuy) {
  if (sharesToBuy <= 0) return 0;

  const costAtEndSupply = _calculateIntegral(currentSupply + sharesToBuy);
  const costAtStartSupply = _calculateIntegral(currentSupply);
  
  return costAtEndSupply - costAtStartSupply;
}

/**
 * Calculate total refund for selling X shares with the polynomial bonding curve.
 * Uses integration for efficiency.
 * @param {number} currentSupply - The current total supply before selling.
 * @param {number} sharesToSell - The number of shares to sell.
 * @returns {number} The total refund for these shares.
 */
function getSellRefund(currentSupply, sharesToSell) {
  if (sharesToSell <= 0) return 0;
  if (sharesToSell > currentSupply) {
    sharesToSell = currentSupply; // Cannot sell more than exist
  }

  const valueAtStartSupply = _calculateIntegral(currentSupply);
  const valueAtEndSupply = _calculateIntegral(currentSupply - sharesToSell);

  return valueAtStartSupply - valueAtEndSupply;
}

/**
 * Calculate average price for a transaction.
 * @param {number} totalSupply - The current total supply before the transaction.
 * @param {number} shares - The number of shares in the transaction.
 * @param {boolean} isBuy - True if it's a buy transaction, false for sell.
 * @returns {number} The average price per share for the transaction.
 */
function getAveragePrice(totalSupply, shares, isBuy) {
  if (shares <= 0) return 0;
  
  if (isBuy) {
    const totalCost = getBuyCost(totalSupply, shares);
    return totalCost / shares;
  } else {
    const totalRefund = getSellRefund(totalSupply, shares);
    return totalRefund / shares;
  }
}

/**
 * Generate points for visualizing the bonding curve.
 * Shows linear distribution of points focused on the current supply or transaction region.
 * @param {number} currentSupply - The current supply before transaction.
 * @param {number} transactionAmount - The number of shares being bought/sold (positive for buy, negative for sell).
 * @param {number} pointDensity - Controls how many points to generate per unit of supply in the transaction range.
 * @returns {Array<object>} An array of {supply, price} points, sorted by supply.
 */
function generateCurvePoints(currentSupply, transactionAmount = 0, pointDensity = 1) {
  const points = [];
  const uniqueSupplies = new Set();
  
  // Determine the range to display based on the transaction
  let startSupply, endSupply;
  
  // For sell transactions (negative amount)
  if (transactionAmount < 0) {
    startSupply = Math.max(0, currentSupply + transactionAmount - 5); // Start a bit before the sell region
    endSupply = currentSupply + 5; // End a bit after current supply
  } 
  // For buy transactions (positive amount)
  else if (transactionAmount > 0) {
    startSupply = Math.max(0, currentSupply - 5); // Start a bit before current supply
    endSupply = currentSupply + transactionAmount + 5; // End a bit after the buy region
  }
  // No transaction specified, just show around current supply
  else {
    startSupply = Math.max(0, currentSupply - 10);
    endSupply = currentSupply + 10;
  }

  function addPoint(supply) {
    const s = Math.max(0, supply); // Ensure non-negative supply
    if (uniqueSupplies.has(s)) return;
    points.push({
      supply: s,
      price: getPrice(s)
    });
    uniqueSupplies.add(s);
  }
  
  // Always include point at supply = 0
  addPoint(0);
  
  // Add points within the main display range (linear spacing)
  const step = 1 / pointDensity; // Smaller step for higher density
  for (let s = startSupply; s <= endSupply; s += step) {
    addPoint(s);
  }
  
  // Always include exact start/end points and transaction boundaries
  addPoint(startSupply);
  addPoint(endSupply);
  addPoint(currentSupply);
  addPoint(currentSupply + transactionAmount);
  
  // Add metadata for highlighting the transaction region
  const result = {
    points: points.sort((a, b) => a.supply - b.supply),
    transactionRegion: {
      start: currentSupply,
      end: currentSupply + transactionAmount,
      isBuy: transactionAmount > 0
    }
  };
  
  return result;
}

/**
 * Generate points for a transaction-focused view of the bonding curve.
 * @param {number} currentSupply - The current supply before transaction.
 * @param {number} shares - The number of shares in the transaction.
 * @param {boolean} isBuy - True if it's a buy transaction, false for sell.
 * @returns {object} Object containing points array and transaction region metadata.
 */
function generateTransactionCurvePoints(currentSupply, shares, isBuy) {
  const transactionAmount = isBuy ? shares : -shares;
  return generateCurvePoints(currentSupply, transactionAmount, 2); // Higher density for transaction view
}

/**
 * Generate fixed linear range of points for the bonding curve.
 * @param {number} maxSupply - The maximum supply to display.
 * @param {number} pointCount - Number of points to generate.
 * @returns {Array<object>} An array of {supply, price} points, sorted by supply.
 */
function generateFixedLinearCurvePoints(maxSupply = 500, pointCount = 100) {
  const points = [];
  const uniqueSupplies = new Set();

  function addPoint(supply) {
    const s = Math.max(0, Math.floor(supply * 100) / 100); // Round to 2 decimal places
    if (uniqueSupplies.has(s)) return;
    points.push({
      supply: s,
      price: getPrice(s)
    });
    uniqueSupplies.add(s);
  }
  
  // Always include zero supply
  addPoint(0);
  
  // Add linearly spaced points
  const step = maxSupply / (pointCount - 1);
  for (let i = 0; i <= pointCount; i++) {
    addPoint(i * step);
  }
  
  // Make sure we include key points for clarity
  [50, 100, 150, 200, 250, 300, 350, 400, 450, 500].forEach(value => {
    if (value <= maxSupply) addPoint(value);
  });
  
  return points.sort((a, b) => a.supply - b.supply);
}

/**
 * Calculate the price impact of a transaction.
 * Shows the price of the first and last share affected by the transaction in discrete terms.
 * @param {number} totalSupply - The current total supply before the transaction.
 * @param {number} shares - The number of shares in the transaction.
 * @param {boolean} isBuy - True if it's a buy transaction, false for sell.
 * @returns {object} Object containing startPrice, endPrice, and percentChange.
 */
function getPriceImpact(totalSupply, shares, isBuy) {
  if (shares <= 0) {
    const priceAtCurrentSupply = getPrice(totalSupply); // Or getPrice(totalSupply > 0 ? totalSupply -1 : 0) for last existing share
    return {
        startPrice: priceAtCurrentSupply,
        endPrice: priceAtCurrentSupply,
        percentChange: 0
    };
  }
  
  let startPrice, endPrice;

  if (isBuy) {
    startPrice = getPrice(totalSupply); 
    endPrice = getPrice(totalSupply + shares - 1);
  } else {
    const effectiveSharesToSell = Math.min(shares, totalSupply);
    if (effectiveSharesToSell === 0) { // Selling 0 shares from 0 supply
        const priceAtZero = getPrice(0);
        return { startPrice: priceAtZero, endPrice: priceAtZero, percentChange: 0 };
    }
    startPrice = getPrice(totalSupply - 1); 
    endPrice = getPrice(totalSupply - effectiveSharesToSell);
  }
  
  let percentChange = 0;
  if (startPrice !== 0 && !isNaN(startPrice) && isFinite(startPrice)) {
    percentChange = ((endPrice - startPrice) / startPrice) * 100;
  } else if (startPrice === 0 && endPrice > 0) { 
    percentChange = Infinity; 
  } // else, if startPrice is NaN, Inf, or endPrice makes it problematic, pc remains 0.

  return {
    startPrice,
    endPrice,
    percentChange: isNaN(percentChange) || !isFinite(percentChange) ? (endPrice > startPrice ? Infinity : (endPrice < startPrice ? -Infinity : 0 )) : percentChange
  };
}

module.exports = { 
  getPrice, 
  getBuyCost, 
  getSellRefund, 
  generateCurvePoints,
  generateTransactionCurvePoints,
  generateFixedLinearCurvePoints,
  getPriceImpact,
  getAveragePrice,
  config: { // Exporting parameters for external reference or tuning
    basePrice,
    k,
    exponent
  }
};