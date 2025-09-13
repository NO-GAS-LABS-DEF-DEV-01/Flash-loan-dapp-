import React, { useState, useEffect } from 'react';
import { GripVertical, BarChart3, TrendingUp, TrendingDown, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { useSui } from '../../context/SuiContext';

interface PriceData {
  time: string;
  timestamp: number;
  sui: number;
  usdc: number;
  usdt: number;
  volume: number;
}

interface TokenStats {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  marketCap: number;
}

const PriceChartWidget: React.FC = () => {
  const { network, connected } = useSui();
  const [priceData, setPriceData] = useState<PriceData[]>([]);
  const [selectedToken, setSelectedToken] = useState<'sui' | 'usdc' | 'usdt'>('sui');
  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d'>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenStats, setTokenStats] = useState<TokenStats[]>([]);

  // Generate mock price data
  const generateMockPriceData = (hours: number): PriceData[] => {
    const data: PriceData[] = [];
    const now = Date.now();
    const interval = (hours * 60 * 60 * 1000) / 50; // 50 data points
    
    let suiPrice = 1.8 + Math.random() * 0.4; // $1.8 - $2.2
    let usdcPrice = 0.999 + Math.random() * 0.002; // $0.999 - $1.001
    let usdtPrice = 1.001 - Math.random() * 0.002; // $0.999 - $1.001
    
    for (let i = 0; i < 50; i++) {
      const timestamp = now - (50 - i) * interval;
      
      // Add some realistic price movement
      suiPrice += (Math.random() - 0.5) * 0.02; // ±1% volatility
      usdcPrice += (Math.random() - 0.5) * 0.001; // ±0.05% volatility
      usdtPrice += (Math.random() - 0.5) * 0.001; // ±0.05% volatility
      
      // Keep prices within reasonable bounds
      suiPrice = Math.max(1.2, Math.min(2.5, suiPrice));
      usdcPrice = Math.max(0.995, Math.min(1.005, usdcPrice));
      usdtPrice = Math.max(0.995, Math.min(1.005, usdtPrice));
      
      data.push({
        time: new Date(timestamp).toLocaleTimeString('en-US', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        }),
        timestamp,
        sui: suiPrice,
        usdc: usdcPrice,
        usdt: usdtPrice,
        volume: 50000 + Math.random() * 200000, // $50K - $250K volume
      });
    }
    
    return data;
  };

  // Generate mock token stats
  const generateTokenStats = (): TokenStats[] => {
    const baseStats = [
      { symbol: 'SUI', basePrice: 1.85, baseCap: 2500000000 },
      { symbol: 'USDC', basePrice: 1.000, baseCap: 32000000000 },
      { symbol: 'USDT', basePrice: 1.001, baseCap: 95000000000 },
    ];

    return baseStats.map(stat => ({
      symbol: stat.symbol,
      price: stat.basePrice + (Math.random() - 0.5) * 0.02,
      change24h: (Math.random() - 0.5) * 10, // ±5% change
      volume24h: 1000000 + Math.random() * 9000000, // $1M - $10M
      marketCap: stat.baseCap * (0.95 + Math.random() * 0.1), // ±5% from base
    }));
  };

  // Load price data
  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      setTimeout(() => {
        const hours = timeframe === '1h' ? 1 : timeframe === '24h' ? 24 : 168;
        setPriceData(generateMockPriceData(hours));
        setTokenStats(generateTokenStats());
        setIsLoading(false);
      }, 1000);
    }
  }, [connected, timeframe, network]);

  // Update data periodically
  useEffect(() => {
    if (!connected || priceData.length === 0) return;

    const interval = setInterval(() => {
      setPriceData(prevData => {
        const newData = [...prevData];
        const lastPoint = newData[newData.length - 1];
        
        // Add new data point
        const now = Date.now();
        const newPoint: PriceData = {
          time: new Date(now).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false 
          }),
          timestamp: now,
          sui: Math.max(1.2, Math.min(2.5, lastPoint.sui + (Math.random() - 0.5) * 0.02)),
          usdc: Math.max(0.995, Math.min(1.005, lastPoint.usdc + (Math.random() - 0.5) * 0.001)),
          usdt: Math.max(0.995, Math.min(1.005, lastPoint.usdt + (Math.random() - 0.5) * 0.001)),
          volume: 50000 + Math.random() * 200000,
        };
        
        // Keep only last 50 points
        const updatedData = [...newData.slice(1), newPoint];
        return updatedData;
      });

      // Update token stats
      setTokenStats(prevStats => 
        prevStats.map(stat => ({
          ...stat,
          price: stat.price + (Math.random() - 0.5) * 0.001,
          change24h: stat.change24h + (Math.random() - 0.5) * 0.2,
          volume24h: stat.volume24h * (0.99 + Math.random() * 0.02),
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [connected, priceData.length]);

  // Custom tooltip for the chart
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-ngl-dark/90 border border-ngl-teal/30 rounded p-2 backdrop-blur-sm">
          <p className="text-ngl-teal font-pixel text-xs">{label}</p>
          <p className="text-ngl-gold font-pixel text-xs">
            Price: ${data[selectedToken].toFixed(4)}
          </p>
          <p className="text-ngl-magenta font-pixel text-xs">
            Volume: ${(data.volume / 1000).toFixed(0)}K
          </p>
        </div>
      );
    }
    return null;
  };

  const formatNumber = (num: number, prefix: string = '', suffix: string = ''): string => {
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`;
    if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(2)}K${suffix}`;
    return `${prefix}${num.toFixed(2)}${suffix}`;
  };

  const selectedTokenStats = tokenStats.find(s => s.symbol === selectedToken.toUpperCase());
  const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1][selectedToken] : 0;
  const priceChange = priceData.length > 1 
    ? ((currentPrice - priceData[0][selectedToken]) / priceData[0][selectedToken]) * 100
    : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-ngl-teal" />
          <h3 className="widget-title">Price Charts</h3>
        </div>
        <GripVertical className="widget-drag-handle w-5 h-5" />
      </div>

      {/* Token Selection */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1">
          {(['sui', 'usdc', 'usdt'] as const).map((token) => (
            <button
              key={token}
              onClick={() => setSelectedToken(token)}
              className={`px-2 py-1 rounded text-xs font-pixel transition-all ${
                selectedToken === token
                  ? 'bg-ngl-teal text-ngl-dark'
                  : 'bg-ngl-dark/30 text-ngl-teal hover:bg-ngl-teal/10'
              }`}
            >
              {token.toUpperCase()}
            </button>
          ))}
        </div>
        
        <div className="flex gap-1">
          {(['1h', '24h', '7d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-2 py-1 rounded text-xs font-pixel transition-all ${
                timeframe === tf
                  ? 'bg-ngl-gold text-ngl-dark'
                  : 'bg-ngl-dark/30 text-ngl-gold hover:bg-ngl-gold/10'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Price Header */}
      {selectedTokenStats && (
        <div className="mb-4">
          <div className="flex items-center gap-3">
            <span className="text-ngl-teal font-pixel text-2xl font-bold">
              ${currentPrice.toFixed(selectedToken === 'sui' ? 3 : 4)}
            </span>
            <div className={`flex items-center gap-1 ${
              priceChange >= 0 ? 'text-ngl-green' : 'text-ngl-red'
            }`}>
              {priceChange >= 0 ? (
                <TrendingUp className="w-4 h-4" />
              ) : (
                <TrendingDown className="w-4 h-4" />
              )}
              <span className="font-pixel text-sm">
                {priceChange >= 0 ? '+' : ''}{priceChange.toFixed(2)}%
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs font-pixel text-ngl-gray-light">
            <span>Vol: {formatNumber(selectedTokenStats.volume24h, '$')}</span>
            <span>MCap: {formatNumber(selectedTokenStats.marketCap, '$')}</span>
          </div>
        </div>
      )}

      {/* Chart */}
      <div className="flex-1 chart-container">
        {!connected ? (
          <div className="flex items-center justify-center h-full text-ngl-gray font-pixel text-sm">
            <div className="text-center">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              Connect wallet to view price charts
            </div>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center h-full text-ngl-teal font-pixel text-sm">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
              Loading price data...
            </div>
          </div>
        ) : priceData.length === 0 ? (
          <div className="flex items-center justify-center h-full text-ngl-gray font-pixel text-sm">
            No price data available
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={priceData}>
              <defs>
                <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00ffff" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#00ffff" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 255, 255, 0.1)" />
              <XAxis 
                dataKey="time" 
                stroke="#666" 
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis 
                stroke="#666" 
                fontSize={10}
                domain={['dataMin - 0.001', 'dataMax + 0.001']}
                tickFormatter={(value) => `$${value.toFixed(selectedToken === 'sui' ? 3 : 4)}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey={selectedToken}
                stroke="#00ffff"
                strokeWidth={2}
                fill="url(#priceGradient)"
                dot={false}
                activeDot={{ r: 4, stroke: '#00ffff', strokeWidth: 2, fill: '#0a0a0a' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Quick Stats */}
      {connected && priceData.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-green font-pixel text-sm font-bold">
              ${Math.max(...priceData.map(d => d[selectedToken])).toFixed(selectedToken === 'sui' ? 3 : 4)}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">24h High</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-red font-pixel text-sm font-bold">
              ${Math.min(...priceData.map(d => d[selectedToken])).toFixed(selectedToken === 'sui' ? 3 : 4)}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">24h Low</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-magenta font-pixel text-sm font-bold">
              {formatNumber(priceData.reduce((sum, d) => sum + d.volume, 0) / priceData.length, '$')}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Avg Vol</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PriceChartWidget;