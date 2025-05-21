import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  ReferenceArea,
  Label
} from 'recharts';
import { generateFixedLinearCurvePoints } from '../lib/bondingCurve';

export default function BondingCurveChart({ 
  curvePoints = [], 
  currentSupply, 
  shares = 0, 
  isBuy = true, 
  primaryColor,
  secondaryColor,
  fixed1To1000 = false
}) {
  // State for fixed points
  const [fixedPoints, setFixedPoints] = useState([]);
  
  // Generate fixed points if in that mode
  useEffect(() => {
    if (fixed1To1000) {
      const points = generateFixedLinearCurvePoints(500, 100);
      setFixedPoints(points);
    }
  }, [fixed1To1000]);
  
  // Use appropriate points based on mode
  const displayPoints = fixed1To1000 ? fixedPoints : 
    (curvePoints.points ? curvePoints.points : curvePoints);
  
  // Check if we have transaction region data from the new curve function
  const transactionRegion = curvePoints.transactionRegion;
  
  // Find the current point on the curve
  const currentPoint = displayPoints.find(point => Math.floor(point.supply) === Math.floor(currentSupply)) || { price: 0 };
  
  // Custom X axis tick formatter to handle exponential scale
  const formatXAxis = (tickItem) => {
    if (tickItem >= 1000000) {
      return `${(tickItem / 1000000).toFixed(0)}M`;
    } else if (tickItem >= 1000) {
      return `${(tickItem / 1000).toFixed(0)}K`;
    }
    return tickItem;
  };
  
  // Format the tooltip content
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const supply = payload[0].payload.supply;
      const price = payload[0].payload.price;
      
      // Format supply with commas for large numbers
      const formattedSupply = supply.toLocaleString();
      
      return (
        <div className="bg-gray-800 p-2 rounded shadow text-white border border-gray-700 text-xs">
          <p className="font-medium">Supply: {formattedSupply}</p>
          <p className="text-cyan-300 font-bold">Price: ${price.toFixed(4)}</p>
        </div>
      );
    }
    return null;
  };
  
  // Get range for reference area (transaction impact)
  const getImpactRange = () => {
    // If we have transaction region data from the new curve function, use it
    if (transactionRegion) {
      return {
        x1: transactionRegion.start,
        x2: transactionRegion.end,
        isBuy: transactionRegion.isBuy
      };
    }
    
    // Legacy behavior
    if (shares <= 0) return null;
    
    if (isBuy) {
      return {
        x1: currentSupply,
        x2: currentSupply + shares - 1,
        isBuy: true
      };
    } else {
      return {
        x1: currentSupply - shares,
        x2: currentSupply - 1,
        isBuy: false
      };
    }
  };
  
  const impactRange = getImpactRange();
  
  // Custom ticks for x-axis when in fixed mode
  const getCustomXAxisTicks = () => {
    if (fixed1To1000) {
      return [1, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500];
    }
    return undefined;
  };
  
  return (
    <div className={`w-full ${fixed1To1000 ? 'h-72' : 'h-48'} mt-2 mb-4 relative`}>
      <div className="absolute top-1 right-2 z-10 text-xs text-gray-500">
        <span>{fixed1To1000 ? 'Shares 1-500' : 'Price vs. Supply'}</span>
      </div>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={displayPoints}
          margin={{ top: 15, right: 5, left: 5, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#444" />
          <XAxis 
            dataKey="supply" 
            scale="linear"
            domain={fixed1To1000 ? [1, 500] : ['dataMin', 'dataMax']}
            tickFormatter={formatXAxis}
            tick={{ fontSize: 10 }}
            type="number"
            ticks={getCustomXAxisTicks()}
            allowDecimals={false}
          >
            <Label 
              value={fixed1To1000 ? "Supply (Shares)" : "Supply"} 
              position="insideBottom" 
              offset={-5} 
              fill="#888"
              fontSize={10}
            />
          </XAxis>
          <YAxis 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
            domain={['dataMin', 'dataMax']}
          >
            <Label 
              value="Price ($)" 
              angle={-90} 
              position="insideLeft" 
              fill="#888"
              fontSize={10}
            />
          </YAxis>
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone" 
            dataKey="price" 
            stroke={primaryColor || "#8884d8"} 
            strokeWidth={2.5}
            dot={false}
            activeDot={{ r: 4, fill: '#fff', stroke: primaryColor || "#8884d8" }}
          />
          
          {/* Current position marker */}
          {(!fixed1To1000 || (fixed1To1000 && currentSupply > 0 && currentSupply <= 500)) && (
            <ReferenceLine 
              x={currentSupply} 
              stroke={secondaryColor || "#82ca9d"} 
              strokeWidth={2}
              strokeDasharray="3 3"
              label={{ 
                value: 'Current', 
                position: 'top', 
                fill: secondaryColor || "#82ca9d",
                fontSize: 10
              }}
            />
          )}
          
          {/* Transaction impact area - only show if it's visible in the current scale and not in fixed mode */}
          {impactRange && (!fixed1To1000 || (fixed1To1000 && impactRange.x1 <= 500 && impactRange.x2 >= 1)) && (
            <ReferenceArea 
              x1={impactRange.x1} 
              x2={impactRange.x2} 
              fill={impactRange.isBuy ? `${primaryColor}40` : `${secondaryColor}40`}
              stroke={impactRange.isBuy ? primaryColor : secondaryColor}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 