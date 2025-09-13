import React, { useState, useEffect } from 'react';
import { GripVertical, TrendingUp, Eye, Play, Pause, RefreshCw } from 'lucide-react';
import { useSui } from '../../context/SuiContext';

interface ArbitrageOpportunity {
  id: string;
  poolA: string;
  poolB: string;
  tokenPair: string;
  priceA: number;
  priceB: number;
  priceDifference: number;
  potentialProfit: number;
  recommendedAmount: number;
  opportunityType: 'dex_arbitrage' | 'cross_chain' | 'liquidation';
  timestamp: Date;
  profitPercentage: number;
}

const ArbitrageWidget: React.FC = () => {
  const { network, connected } = useSui();
  const [opportunities, setOpportunities] = useState<ArbitrageOpportunity[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<string | null>(null);

  // Mock data generator for demonstration
  const generateMockOpportunity = (): ArbitrageOpportunity => {
    const pairs = ['SUI/USDC', 'SUI/USDT', 'USDC/USDT'];
    const types: ArbitrageOpportunity['opportunityType'][] = ['dex_arbitrage', 'cross_chain', 'liquidation'];
    const pair = pairs[Math.floor(Math.random() * pairs.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    
    const basePrice = 1.5 + Math.random() * 0.5; // SUI price between 1.5-2.0
    const priceDiff = 0.005 + Math.random() * 0.02; // 0.5% to 2.5% difference
    const priceA = basePrice;
    const priceB = basePrice * (1 + priceDiff);
    
    const amount = 1000 + Math.random() * 9000; // 1K to 10K SUI
    const profit = amount * priceDiff * 0.8; // 80% of price difference as profit
    
    return {
      id: `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      poolA: network === 'testnet' ? '0x123456789abcdef' : '0xmainnet123456789abcdef',
      poolB: network === 'testnet' ? '0x987654321fedcba' : '0xmainnet987654321fedcba',
      tokenPair: pair,
      priceA,
      priceB,
      priceDifference: priceB - priceA,
      potentialProfit: profit,
      recommendedAmount: amount,
      opportunityType: type,
      timestamp: new Date(),
      profitPercentage: priceDiff * 100,
    };
  };

  // Simulate opportunity detection
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isMonitoring && connected) {
      // Add initial opportunities
      const initialOpportunities = Array.from({ length: 3 }, generateMockOpportunity);
      setOpportunities(initialOpportunities);

      // Update opportunities periodically
      interval = setInterval(() => {
        setOpportunities(prev => {
          const newOpportunities = [...prev];
          
          // Remove old opportunities (older than 5 minutes)
          const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
          const filteredOpportunities = newOpportunities.filter(
            opp => opp.timestamp > fiveMinutesAgo
          );

          // Add new opportunity occasionally
          if (Math.random() < 0.3 && filteredOpportunities.length < 8) {
            filteredOpportunities.push(generateMockOpportunity());
          }

          // Update existing opportunities with slight price changes
          return filteredOpportunities.map(opp => {
            const priceChange = (Math.random() - 0.5) * 0.01; // ±0.5% price change
            const newPriceB = Math.max(0.1, opp.priceB + priceChange);
            const newPriceDiff = newPriceB - opp.priceA;
            const newProfit = opp.recommendedAmount * (newPriceDiff / opp.priceA) * 0.8;
            
            return {
              ...opp,
              priceB: newPriceB,
              priceDifference: newPriceDiff,
              potentialProfit: newProfit,
              profitPercentage: (newPriceDiff / opp.priceA) * 100,
            };
          });
        });
      }, 3000); // Update every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isMonitoring, connected, network]);

  const toggleMonitoring = () => {
    if (!connected) return;
    
    setIsMonitoring(prev => !prev);
    if (!isMonitoring) {
      setIsLoading(true);
      setTimeout(() => setIsLoading(false), 1500);
    } else {
      setOpportunities([]);
    }
  };

  const refreshOpportunities = () => {
    if (!connected || !isMonitoring) return;
    
    setIsLoading(true);
    setTimeout(() => {
      const newOpportunities = Array.from({ length: 2 + Math.floor(Math.random() * 4)}, generateMockOpportunity);
      setOpportunities(newOpportunities);
      setIsLoading(false);
    }, 1000);
  };

  const getTypeColor = (type: ArbitrageOpportunity['opportunityType']) => {
    switch (type) {
      case 'dex_arbitrage': return 'text-ngl-teal';
      case 'cross_chain': return 'text-ngl-magenta';
      case 'liquidation': return 'text-ngl-gold';
      default: return 'text-ngl-gray';
    }
  };

  const getTypeLabel = (type: ArbitrageOpportunity['opportunityType']) => {
    switch (type) {
      case 'dex_arbitrage': return 'DEX Arb';
      case 'cross_chain': return 'Cross-Chain';
      case 'liquidation': return 'Liquidation';
      default: return 'Unknown';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    
    if (minutes > 0) return `${minutes}m ${seconds}s ago`;
    return `${seconds}s ago`;
  };

  const sortedOpportunities = opportunities
    .sort((a, b) => b.profitPercentage - a.profitPercentage)
    .slice(0, 6); // Show top 6 opportunities

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-ngl-magenta" />
          <h3 className="widget-title">Arbitrage Opportunities</h3>
        </div>
        <GripVertical className="widget-drag-handle w-5 h-5" />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={toggleMonitoring}
            disabled={!connected}
            className={`btn-neon text-xs px-3 py-1 ${
              !connected ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            <div className="flex items-center gap-1">
              {isMonitoring ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
              {isMonitoring ? 'Stop' : 'Start'}
            </div>
          </button>
          
          <button
            onClick={refreshOpportunities}
            disabled={!connected || !isMonitoring || isLoading}
            className="btn-neon-gold text-xs px-3 py-1"
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${
            isMonitoring ? 'bg-ngl-green animate-pulse' : 'bg-ngl-gray'
          }`}></div>
          <span className="text-ngl-gray-light font-pixel">
            {isMonitoring ? `${opportunities.length} active` : 'Stopped'}
          </span>
        </div>
      </div>

      {/* Opportunities List */}
      <div className="flex-1 opportunity-list">
        {!connected ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            Connect wallet to detect opportunities
          </div>
        ) : !isMonitoring ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Click "Start" to begin monitoring
          </div>
        ) : isLoading ? (
          <div className="text-center text-ngl-teal font-pixel text-sm py-8">
            <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Scanning for opportunities...
          </div>
        ) : sortedOpportunities.length === 0 ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
            No opportunities found
          </div>
        ) : (
          sortedOpportunities.map((opportunity) => (
            <div
              key={opportunity.id}
              className={`opportunity-item ${selectedOpportunity === opportunity.id ? 'ring-2 ring-ngl-teal' : ''}`}
              onClick={() => setSelectedOpportunity(
                selectedOpportunity === opportunity.id ? null : opportunity.id
              )}
            >
              <div className="opportunity-header">
                <div className="flex items-center gap-2">
                  <span className="opportunity-pair">{opportunity.tokenPair}</span>
                  <span className={`text-xs font-pixel px-2 py-1 rounded ${getTypeColor(opportunity.opportunityType)} bg-current bg-opacity-10`}>
                    {getTypeLabel(opportunity.opportunityType)}
                  </span>
                </div>
                <div className="text-right">
                  <div className="opportunity-profit">
                    +{opportunity.profitPercentage.toFixed(2)}%
                  </div>
                  <div className="text-ngl-gray-light font-pixel text-xs">
                    ${opportunity.potentialProfit.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="opportunity-details">
                <div>
                  <span className="text-ngl-gray-light">Pool A:</span>
                  <span className="text-ngl-teal ml-1">
                    ${opportunity.priceA.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-ngl-gray-light">Pool B:</span>
                  <span className="text-ngl-teal ml-1">
                    ${opportunity.priceB.toFixed(4)}
                  </span>
                </div>
                <div>
                  <span className="text-ngl-gray-light">Amount:</span>
                  <span className="text-ngl-gold ml-1">
                    {opportunity.recommendedAmount.toFixed(0)} SUI
                  </span>
                </div>
                <div>
                  <span className="text-ngl-gray-light">Age:</span>
                  <span className="text-ngl-gray ml-1">
                    {formatTime(opportunity.timestamp)}
                  </span>
                </div>
              </div>

              {selectedOpportunity === opportunity.id && (
                <div className="mt-2 pt-2 border-t border-ngl-magenta/20">
                  <button className="w-full btn-neon-magenta text-xs py-1">
                    Execute Arbitrage
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Summary Stats */}
      {isMonitoring && opportunities.length > 0 && (
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="bg-ngl-dark/30 rounded p-2">
            <div className="text-ngl-teal font-pixel text-lg font-bold">
              {opportunities.length}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Active</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2">
            <div className="text-ngl-green font-pixel text-lg font-bold">
              {Math.max(...opportunities.map(o => o.profitPercentage)).toFixed(1)}%
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Best</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2">
            <div className="text-ngl-gold font-pixel text-lg font-bold">
              ${opportunities.reduce((sum, o) => sum + o.potentialProfit, 0).toFixed(0)}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Total</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ArbitrageWidget;