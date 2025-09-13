import React, { useState, useEffect } from 'react';
import { GripVertical, Droplet, Activity, DollarSign, TrendingUp } from 'lucide-react';
import { useSui } from '../../context/SuiContext';

interface PoolData {
  id: string;
  name: string;
  tokenPair: string;
  tvl: number;
  volume24h: number;
  apy: number;
  liquidity: {
    tokenA: number;
    tokenB: number;
  };
  priceImpact: number;
  fees24h: number;
  active: boolean;
  network: 'testnet' | 'mainnet';
}

const PoolMonitorWidget: React.FC = () => {
  const { network, connected } = useSui();
  const [pools, setPools] = useState<PoolData[]>([]);
  const [selectedPool, setSelectedPool] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Mock pool data
  const generateMockPools = (): PoolData[] => {
    const basePools = [
      {
        name: 'SUI/USDC Pool',
        tokenPair: 'SUI/USDC',
        baseId: network === 'testnet' ? '0x123456789abcdef' : '0xmainnet123456789abcdef',
      },
      {
        name: 'SUI/USDT Pool', 
        tokenPair: 'SUI/USDT',
        baseId: network === 'testnet' ? '0x987654321fedcba' : '0xmainnet987654321fedcba',
      },
      {
        name: 'USDC/USDT Pool',
        tokenPair: 'USDC/USDT',
        baseId: network === 'testnet' ? '0xabcdef123456789' : '0xmainnetabcdef123456789',
      },
    ];

    return basePools.map((pool, index) => {
      const tvlMultiplier = network === 'mainnet' ? 100 : 1;
      const baseVolume = (50000 + Math.random() * 200000) * tvlMultiplier;
      
      return {
        id: pool.baseId,
        name: pool.name,
        tokenPair: pool.tokenPair,
        tvl: (100000 + Math.random() * 500000) * tvlMultiplier,
        volume24h: baseVolume,
        apy: 5 + Math.random() * 15, // 5-20% APY
        liquidity: {
          tokenA: 50000 + Math.random() * 100000,
          tokenB: 75000 + Math.random() * 150000,
        },
        priceImpact: 0.1 + Math.random() * 0.4, // 0.1-0.5% price impact
        fees24h: baseVolume * 0.003, // 0.3% fee
        active: Math.random() > 0.1, // 90% chance of being active
        network,
      };
    });
  };

  // Load pool data
  useEffect(() => {
    if (connected) {
      setIsLoading(true);
      setTimeout(() => {
        setPools(generateMockPools());
        setIsLoading(false);
      }, 1000);
    } else {
      setPools([]);
    }
  }, [connected, network]);

  // Update pool data periodically
  useEffect(() => {
    if (!connected || pools.length === 0) return;

    const interval = setInterval(() => {
      setPools(prevPools => 
        prevPools.map(pool => ({
          ...pool,
          volume24h: pool.volume24h * (0.98 + Math.random() * 0.04), // ±2% variation
          apy: Math.max(0, pool.apy + (Math.random() - 0.5) * 0.5), // ±0.25% APY change
          priceImpact: Math.max(0.01, pool.priceImpact + (Math.random() - 0.5) * 0.01),
          fees24h: pool.volume24h * 0.003,
        }))
      );
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [connected, pools.length]);

  const formatNumber = (num: number, prefix: string = '', suffix: string = ''): string => {
    if (num >= 1e9) return `${prefix}${(num / 1e9).toFixed(2)}B${suffix}`;
    if (num >= 1e6) return `${prefix}${(num / 1e6).toFixed(2)}M${suffix}`;
    if (num >= 1e3) return `${prefix}${(num / 1e3).toFixed(2)}K${suffix}`;
    return `${prefix}${num.toFixed(2)}${suffix}`;
  };

  const getPoolHealthColor = (pool: PoolData): string => {
    if (!pool.active) return 'text-ngl-red';
    if (pool.apy > 15) return 'text-ngl-green';
    if (pool.apy > 8) return 'text-ngl-gold';
    return 'text-ngl-teal';
  };

  const totalTVL = pools.reduce((sum, pool) => sum + pool.tvl, 0);
  const totalVolume = pools.reduce((sum, pool) => sum + pool.volume24h, 0);
  const averageAPY = pools.length > 0 ? pools.reduce((sum, pool) => sum + pool.apy, 0) / pools.length : 0;

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center gap-2">
          <Droplet className="w-5 h-5 text-ngl-gold" />
          <h3 className="widget-title">Pool Monitor</h3>
        </div>
        <GripVertical className="widget-drag-handle w-5 h-5" />
      </div>

      {/* Network Status */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-ngl-green' : 'bg-ngl-red'}`}></div>
          <span className="text-ngl-gray-light font-pixel">
            {network} {connected ? '(Connected)' : '(Disconnected)'}
          </span>
        </div>
        <div className="text-ngl-gold font-pixel text-xs">
          {pools.filter(p => p.active).length}/{pools.length} Active
        </div>
      </div>

      {/* Summary Stats */}
      {connected && pools.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-teal font-pixel text-sm font-bold">
              {formatNumber(totalTVL, '$')}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">TVL</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-magenta font-pixel text-sm font-bold">
              {formatNumber(totalVolume, '$')}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Volume</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-gold font-pixel text-sm font-bold">
              {averageAPY.toFixed(1)}%
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Avg APY</div>
          </div>
        </div>
      )}

      {/* Pool List */}
      <div className="flex-1 space-y-2 overflow-y-auto">
        {!connected ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            <Droplet className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Connect wallet to monitor pools
          </div>
        ) : isLoading ? (
          <div className="text-center text-ngl-teal font-pixel text-sm py-8">
            <Activity className="w-8 h-8 mx-auto mb-2 animate-pulse" />
            Loading pool data...
          </div>
        ) : pools.length === 0 ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            No pools found
          </div>
        ) : (
          pools.map((pool) => (
            <div
              key={pool.id}
              className={`pool-card cursor-pointer transition-all duration-300 ${
                selectedPool === pool.id ? 'ring-2 ring-ngl-gold' : ''
              } ${!pool.active ? 'opacity-50' : ''}`}
              onClick={() => setSelectedPool(selectedPool === pool.id ? null : pool.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${pool.active ? 'bg-ngl-green' : 'bg-ngl-red'}`}></div>
                  <span className="pool-name text-sm">{pool.tokenPair}</span>
                </div>
                <span className={`font-pixel text-sm font-bold ${getPoolHealthColor(pool)}`}>
                  {pool.apy.toFixed(1)}%
                </span>
              </div>

              <div className="pool-stats">
                <div className="flex justify-between text-xs">
                  <span>TVL:</span>
                  <span className="text-ngl-teal">{formatNumber(pool.tvl, '$')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Volume:</span>
                  <span className="text-ngl-magenta">{formatNumber(pool.volume24h, '$')}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span>Impact:</span>
                  <span className={pool.priceImpact > 0.3 ? 'text-ngl-red' : 'text-ngl-green'}>
                    {pool.priceImpact.toFixed(2)}%
                  </span>
                </div>
              </div>

              {selectedPool === pool.id && (
                <div className="mt-3 pt-3 border-t border-ngl-gold/20 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-ngl-dark/50 rounded p-2">
                      <div className="text-ngl-gray-light">Liquidity A</div>
                      <div className="text-ngl-teal font-bold">
                        {formatNumber(pool.liquidity.tokenA)}
                      </div>
                    </div>
                    <div className="bg-ngl-dark/50 rounded p-2">
                      <div className="text-ngl-gray-light">Liquidity B</div>
                      <div className="text-ngl-teal font-bold">
                        {formatNumber(pool.liquidity.tokenB)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-ngl-gray-light">24h Fees:</span>
                    <span className="text-ngl-green font-bold">
                      {formatNumber(pool.fees24h, '$')}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 btn-neon-gold text-xs py-1">
                      <DollarSign className="w-3 h-3 mr-1" />
                      Add Liquidity
                    </button>
                    <button className="flex-1 btn-neon text-xs py-1">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      Trade
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default PoolMonitorWidget;