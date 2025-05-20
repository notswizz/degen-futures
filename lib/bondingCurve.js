const basePrice = 1;
const slope = 0.5;
const exponent = 1.35; // Increased exponential factor for more pronounced curve

// Calculate price for a specific supply point
function getPrice(totalSupply) {
  return basePrice + slope * Math.pow(Math.log(1 + totalSupply), exponent);
}

// Calculate total cost to buy X shares with price increase per share
function getBuyCost(totalSupply, shares) {
  let totalCost = 0;
  
  // Calculate cost for each individual share
  for (let i = 0; i < shares; i++) {
    const currentSupply = totalSupply + i;
    const sharePrice = getPrice(currentSupply);
    totalCost += sharePrice;
  }
  
  return totalCost;
}

// Calculate refund for selling X shares with price decrease per share
function getSellRefund(totalSupply, shares) {
  // Ensure we don't try to sell more than exist
  if (shares > totalSupply) {
    shares = totalSupply;
  }
  
  let totalRefund = 0;
  
  // Calculate refund for each individual share
  for (let i = 0; i < shares; i++) {
    // We sell shares one by one, starting from highest price
    const currentSupply = totalSupply - i;
    const sharePrice = getPrice(currentSupply - 1);
    totalRefund += sharePrice;
  }
  
  return totalRefund;
}

// Calculate average price for a transaction
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

// Generate points for visualizing the bonding curve from 1 to near infinity
function generateCurvePoints(currentSupply, range = 10) {
  const points = [];
  
  // First part: Include points from the beginning (0 or 1) to show the entire curve
  for (let i = 0; i <= Math.min(10, currentSupply); i++) {
    points.push({
      supply: i,
      price: getPrice(i)
    });
  }
  
  // Add more points with increasing gaps as we move away from zero
  if (currentSupply > 10) {
    // Add logarithmically spaced points between 10 and current supply
    const logSteps = 8;
    const logBase = Math.pow(currentSupply / 10, 1 / logSteps);
    
    for (let i = 1; i < logSteps; i++) {
      const supply = Math.floor(10 * Math.pow(logBase, i));
      // Avoid duplicates
      if (supply > points[points.length - 1].supply && supply < currentSupply) {
        points.push({
          supply,
          price: getPrice(supply)
        });
      }
    }
  }
  
  // Add points around current supply with linear spacing
  const nearStart = Math.max(0, currentSupply - range/2);
  const nearEnd = currentSupply + range/2;
  
  for (let i = nearStart; i <= nearEnd; i++) {
    // Avoid duplicates
    if (!points.some(p => p.supply === i)) {
      points.push({
        supply: i,
        price: getPrice(i)
      });
    }
  }
  
  // Add exponentially increasing points to show curve behavior at large supply
  let extendedSupply = nearEnd * 2;
  for (let i = 0; i < 10; i++) {
    extendedSupply = Math.floor(extendedSupply * 1.8);
    points.push({
      supply: extendedSupply,
      price: getPrice(extendedSupply)
    });
  }
  
  // Sort points by supply
  points.sort((a, b) => a.supply - b.supply);
  
  return points;
}

// Generate points specifically for a 1-1000 shares bonding curve display
function generateFixed1to1000CurvePoints() {
  const points = [];
  
  // First section: 1-100 - many points for the beginning part of the curve
  for (let i = 1; i <= 100; i += 2) {
    points.push({
      supply: i,
      price: getPrice(i)
    });
  }
  
  // Middle section: 100-500 - somewhat fewer points
  for (let i = 100; i <= 500; i += 10) {
    // Skip if we've already included this point
    if (!points.some(p => p.supply === i)) {
      points.push({
        supply: i,
        price: getPrice(i)
      });
    }
  }
  
  // Final section: 500-1000 - fewer points
  for (let i = 500; i <= 1000; i += 20) {
    // Skip if we've already included this point
    if (!points.some(p => p.supply === i)) {
      points.push({
        supply: i,
        price: getPrice(i)
      });
    }
  }
  
  // Ensure we include the exact point at 1000
  if (!points.some(p => p.supply === 1000)) {
    points.push({
      supply: 1000,
      price: getPrice(1000)
    });
  }
  
  // Sort points by supply
  points.sort((a, b) => a.supply - b.supply);
  
  return points;
}

// Calculate the price impact of a transaction
function getPriceImpact(totalSupply, shares, isBuy) {
  if (isBuy) {
    const startPrice = getPrice(totalSupply);
    const endPrice = getPrice(totalSupply + shares - 1);
    return {
      startPrice,
      endPrice,
      percentChange: ((endPrice - startPrice) / startPrice) * 100
    };
  } else {
    const startPrice = getPrice(totalSupply - 1);
    const endPrice = getPrice(totalSupply - shares);
    return {
      startPrice,
      endPrice,
      percentChange: ((endPrice - startPrice) / startPrice) * 100
    };
  }
}

module.exports = { 
  getPrice, 
  getBuyCost, 
  getSellRefund, 
  generateCurvePoints,
  generateFixed1to1000CurvePoints,
  getPriceImpact,
  getAveragePrice
}; 