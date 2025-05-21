import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';

export default function PriceChart({ 
  teamId, 
  primaryColor = '#004c54', 
  secondaryColor = '#000000',
  limit = 10000,  // Increased limit for more data points
  refreshTrigger = 0 // New prop to force refresh
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [timeframe, setTimeframe] = useState('all'); // Default to 'all'

  // Fetch data when component mounts, when teamId changes, or when refreshTrigger changes
  useEffect(() => {
    if (!teamId) return;
    
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Add cache-busting parameter to avoid browser caching
        const cacheParam = new Date().getTime();
        const response = await fetch(`/api/market/team-transactions?teamId=${teamId}&limit=${limit}&_=${cacheParam}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch data: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.chartData && data.chartData.length > 0) {
          // Format the timestamps for the chart
          const formattedData = data.chartData.map(point => ({
            ...point,
            formattedTime: new Date(point.timestamp).toLocaleDateString(),
          }));
          
          setChartData(formattedData);
        } else {
          setChartData([]);
        }
      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [teamId, limit, refreshTrigger]); // Add refreshTrigger to dependency array

  // Filter data based on timeframe
  const getFilteredData = () => {
    if (timeframe === 'all') return chartData;
    
    const now = new Date();
    let cutoffDate;
    
    switch (timeframe) {
      case 'day':
        cutoffDate = new Date(now.setDate(now.getDate() - 1));
        break;
      case 'week':
        cutoffDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        cutoffDate = new Date(now.setDate(now.getDate() - 30));
        break;
      default:
        return chartData;
    }
    
    return chartData.filter(point => new Date(point.timestamp) >= cutoffDate);
  };
  
  const filteredData = getFilteredData();
  
  // Calculate price range for Y-axis
  const minPrice = filteredData.length > 0 
    ? Math.min(...filteredData.map(d => d.price)) * 0.9 // 10% padding below
    : 0;
    
  const maxPrice = filteredData.length > 0 
    ? Math.max(...filteredData.map(d => d.price)) * 1.1 // 10% padding above
    : 10;
  
  // Custom tooltip component
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-gray-800 p-2 rounded shadow-lg border border-gray-700 text-xs">
          <p className="font-medium mb-1">{new Date(data.timestamp).toLocaleString()}</p>
          <p className="text-cyan-300 font-bold">${data.price.toFixed(4)}</p>
          <p className="text-xs opacity-80">Supply: {data.supply}</p>
          <p className="text-xs mt-1">
            <span 
              className={`inline-block px-1 rounded ${
                data.type === 'buy' ? 'bg-green-900/40 text-green-400' : 'bg-red-900/40 text-red-400'
              }`}
            >
              {data.type.toUpperCase()}
            </span>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-900/30 rounded-lg">
        <div className="animate-pulse flex space-x-2">
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
          <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-900/30 rounded-lg">
        <p className="text-sm text-red-400">Error loading chart data</p>
      </div>
    );
  }

  if (filteredData.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center bg-gray-900/30 rounded-lg">
        <p className="text-sm text-gray-400">No price history available</p>
      </div>
    );
  }

  return (
    <div className="w-full h-48 pt-1">
      <div className="flex justify-between items-center mb-2 px-2">
        <h3 className="text-xs font-medium text-gray-400">Price History</h3>
        <div className="flex space-x-1 text-xs">
          <button 
            className={`px-2 py-0.5 rounded ${timeframe === 'day' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            onClick={() => setTimeframe('day')}
          >
            24h
          </button>
          <button 
            className={`px-2 py-0.5 rounded ${timeframe === 'week' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            onClick={() => setTimeframe('week')}
          >
            7d
          </button>
          <button 
            className={`px-2 py-0.5 rounded ${timeframe === 'month' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            onClick={() => setTimeframe('month')}
          >
            30d
          </button>
          <button 
            className={`px-2 py-0.5 rounded ${timeframe === 'all' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:bg-gray-800'}`}
            onClick={() => setTimeframe('all')}
          >
            All
          </button>
        </div>
      </div>
      
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={filteredData}
          margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="formattedTime" 
            tick={{ fontSize: 10 }}
            tickFormatter={(tick, index) => {
              // Show fewer ticks for better readability
              const interval = Math.ceil(filteredData.length / 5);
              return index % interval === 0 ? tick : '';
            }}
          />
          <YAxis 
            domain={[minPrice, maxPrice]}
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => `$${value.toFixed(2)}`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line 
            type="monotone"
            dataKey="price"
            stroke={primaryColor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: 'white', stroke: primaryColor }}
          />
          
          {/* Show the most recent price */}
          {filteredData.length > 0 && (
            <ReferenceLine 
              y={filteredData[filteredData.length - 1].price} 
              stroke={secondaryColor} 
              strokeDasharray="3 3"
              isFront={true}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
} 