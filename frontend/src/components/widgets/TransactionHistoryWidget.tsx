import React, { useState, useEffect } from 'react';
import { GripVertical, History, ExternalLink, CheckCircle, Clock, XCircle, Zap, TrendingUp, Droplet } from 'lucide-react';
import { useSui } from '../../context/SuiContext';

interface Transaction {
  id: string;
  hash: string;
  type: 'flash_loan' | 'arbitrage' | 'liquidity' | 'swap';
  status: 'success' | 'pending' | 'failed';
  timestamp: Date;
  amount: number;
  token: string;
  profit?: number;
  gasUsed: number;
  gasPrice: number;
  blockNumber?: number;
  network: 'testnet' | 'mainnet';
  details: {
    poolA?: string;
    poolB?: string;
    strategy?: string;
    slippage?: number;
  };
}

const TransactionHistoryWidget: React.FC = () => {
  const { network, connected, address } = useSui();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedTx, setSelectedTx] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'flash_loan' | 'arbitrage' | 'liquidity'>('all');

  // Mock transaction generator
  const generateMockTransaction = (): Transaction => {
    const types: Transaction['type'][] = ['flash_loan', 'arbitrage', 'liquidity', 'swap'];
    const statuses: Transaction['status'][] = ['success', 'pending', 'failed'];
    const tokens = ['SUI', 'USDC', 'USDT'];
    
    const type = types[Math.floor(Math.random() * types.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const token = tokens[Math.floor(Math.random() * tokens.length)];
    const amount = 100 + Math.random() * 10000;
    const gasUsed = 1000000 + Math.random() * 9000000; // 1-10M gas
    const gasPrice = 1000 + Math.random() * 4000; // 1000-5000 MIST per gas
    
    const profit = type === 'flash_loan' || type === 'arbitrage' 
      ? status === 'success' 
        ? amount * (0.001 + Math.random() * 0.02) // 0.1-2% profit
        : undefined
      : undefined;

    return {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      hash: `0x${Math.random().toString(16).substr(2, 64)}`,
      type,
      status,
      timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // Last 24 hours
      amount,
      token,
      profit,
      gasUsed,
      gasPrice,
      blockNumber: Math.floor(1000000 + Math.random() * 1000000),
      network,
      details: {
        poolA: type === 'arbitrage' ? '0x123...abc' : undefined,
        poolB: type === 'arbitrage' ? '0x456...def' : undefined,
        strategy: type === 'flash_loan' ? 'arbitrage' : undefined,
        slippage: Math.random() * 2, // 0-2% slippage
      },
    };
  };

  // Load transaction history
  useEffect(() => {
    if (connected && address) {
      setIsLoading(true);
      setTimeout(() => {
        const mockTransactions = Array.from({ length: 8 + Math.floor(Math.random() * 12) }, generateMockTransaction)
          .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTransactions(mockTransactions);
        setIsLoading(false);
      }, 1500);
    } else {
      setTransactions([]);
    }
  }, [connected, address, network]);

  // Simulate pending transactions completing
  useEffect(() => {
    const interval = setInterval(() => {
      setTransactions(prev => 
        prev.map(tx => {
          if (tx.status === 'pending' && Math.random() < 0.1) { // 10% chance per interval
            return {
              ...tx,
              status: Math.random() < 0.8 ? 'success' : 'failed' as Transaction['status'],
              profit: tx.type === 'flash_loan' || tx.type === 'arbitrage' 
                ? tx.amount * (0.001 + Math.random() * 0.02)
                : undefined,
            };
          }
          return tx;
        })
      );
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: Transaction['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="w-4 h-4 text-ngl-green" />;
      case 'pending': return <Clock className="w-4 h-4 text-ngl-gold animate-pulse" />;
      case 'failed': return <XCircle className="w-4 h-4 text-ngl-red" />;
    }
  };

  const getTypeIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'flash_loan': return <Zap className="w-4 h-4 text-ngl-teal" />;
      case 'arbitrage': return <TrendingUp className="w-4 h-4 text-ngl-magenta" />;
      case 'liquidity': return <Droplet className="w-4 h-4 text-ngl-gold" />;
      case 'swap': return <ExternalLink className="w-4 h-4 text-ngl-gray" />;
    }
  };

  const getTypeLabel = (type: Transaction['type']) => {
    switch (type) {
      case 'flash_loan': return 'Flash Loan';
      case 'arbitrage': return 'Arbitrage';
      case 'liquidity': return 'Liquidity';
      case 'swap': return 'Swap';
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return `${Math.floor(diff / 1000)}s ago`;
  };

  const formatNumber = (num: number, decimals: number = 2): string => {
    if (num >= 1e6) return `${(num / 1e6).toFixed(decimals)}M`;
    if (num >= 1e3) return `${(num / 1e3).toFixed(decimals)}K`;
    return num.toFixed(decimals);
  };

  const filteredTransactions = transactions.filter(tx => 
    filter === 'all' || tx.type === filter
  );

  const stats = {
    total: transactions.length,
    successful: transactions.filter(tx => tx.status === 'success').length,
    pending: transactions.filter(tx => tx.status === 'pending').length,
    totalProfit: transactions
      .filter(tx => tx.status === 'success' && tx.profit)
      .reduce((sum, tx) => sum + (tx.profit || 0), 0),
  };

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-ngl-green" />
          <h3 className="widget-title">Transaction History</h3>
        </div>
        <GripVertical className="widget-drag-handle w-5 h-5" />
      </div>

      {/* Stats Summary */}
      {connected && transactions.length > 0 && (
        <div className="grid grid-cols-4 gap-2 mb-4">
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-teal font-pixel text-sm font-bold">{stats.total}</div>
            <div className="text-ngl-gray-light font-pixel text-xs">Total</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-green font-pixel text-sm font-bold">{stats.successful}</div>
            <div className="text-ngl-gray-light font-pixel text-xs">Success</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-gold font-pixel text-sm font-bold">{stats.pending}</div>
            <div className="text-ngl-gray-light font-pixel text-xs">Pending</div>
          </div>
          <div className="bg-ngl-dark/30 rounded p-2 text-center">
            <div className="text-ngl-magenta font-pixel text-sm font-bold">
              {formatNumber(stats.totalProfit)}
            </div>
            <div className="text-ngl-gray-light font-pixel text-xs">Profit</div>
          </div>
        </div>
      )}

      {/* Filter Buttons */}
      {connected && transactions.length > 0 && (
        <div className="flex gap-1 mb-4 overflow-x-auto">
          {(['all', 'flash_loan', 'arbitrage', 'liquidity'] as const).map((filterType) => (
            <button
              key={filterType}
              onClick={() => setFilter(filterType)}
              className={`px-2 py-1 rounded text-xs font-pixel whitespace-nowrap transition-all ${
                filter === filterType
                  ? 'bg-ngl-teal text-ngl-dark'
                  : 'bg-ngl-dark/30 text-ngl-teal hover:bg-ngl-teal/10'
              }`}
            >
              {filterType === 'all' ? 'All' : getTypeLabel(filterType)}
            </button>
          ))}
        </div>
      )}

      {/* Transaction List */}
      <div className="flex-1 transaction-list">
        {!connected ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            Connect wallet to view transactions
          </div>
        ) : isLoading ? (
          <div className="text-center text-ngl-teal font-pixel text-sm py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 animate-spin" />
            Loading transaction history...
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center text-ngl-gray font-pixel text-sm py-8">
            <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
            {filter === 'all' ? 'No transactions found' : `No ${getTypeLabel(filter)} transactions`}
          </div>
        ) : (
          filteredTransactions.map((tx) => (
            <div
              key={tx.id}
              className={`transaction-item cursor-pointer ${
                selectedTx === tx.id ? 'ring-2 ring-ngl-green' : ''
              }`}
              onClick={() => setSelectedTx(selectedTx === tx.id ? null : tx.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {getStatusIcon(tx.status)}
                  {getTypeIcon(tx.type)}
                  <div>
                    <div className="font-pixel text-xs text-ngl-teal">
                      {getTypeLabel(tx.type)}
                    </div>
                    <div className="font-pixel text-xs text-ngl-gray-light">
                      {formatTime(tx.timestamp)}
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-pixel text-xs text-ngl-teal">
                    {formatNumber(tx.amount)} {tx.token}
                  </div>
                  {tx.profit && tx.status === 'success' && (
                    <div className="font-pixel text-xs text-ngl-green">
                      +{formatNumber(tx.profit)} profit
                    </div>
                  )}
                </div>
              </div>

              {selectedTx === tx.id && (
                <div className="mt-3 pt-3 border-t border-ngl-green/20 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs font-pixel">
                    <div>
                      <span className="text-ngl-gray-light">Hash:</span>
                      <div className="text-ngl-teal break-all">
                        {tx.hash.slice(0, 10)}...{tx.hash.slice(-6)}
                      </div>
                    </div>
                    <div>
                      <span className="text-ngl-gray-light">Block:</span>
                      <div className="text-ngl-teal">
                        {tx.blockNumber?.toLocaleString() || 'Pending'}
                      </div>
                    </div>
                    <div>
                      <span className="text-ngl-gray-light">Gas Used:</span>
                      <div className="text-ngl-gold">
                        {formatNumber(tx.gasUsed, 0)}
                      </div>
                    </div>
                    <div>
                      <span className="text-ngl-gray-light">Gas Price:</span>
                      <div className="text-ngl-gold">
                        {formatNumber(tx.gasPrice, 0)} MIST
                      </div>
                    </div>
                  </div>

                  {tx.details.poolA && tx.details.poolB && (
                    <div className="text-xs font-pixel">
                      <span className="text-ngl-gray-light">Pools:</span>
                      <div className="text-ngl-magenta">
                        {tx.details.poolA} ↔ {tx.details.poolB}
                      </div>
                    </div>
                  )}

                  {tx.details.slippage !== undefined && (
                    <div className="text-xs font-pixel">
                      <span className="text-ngl-gray-light">Slippage:</span>
                      <span className={`ml-1 ${
                        tx.details.slippage > 1 ? 'text-ngl-red' : 'text-ngl-green'
                      }`}>
                        {tx.details.slippage.toFixed(2)}%
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button 
                      className="flex-1 btn-neon text-xs py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(`https://explorer.sui.io/txn/${tx.hash}?network=${network}`, '_blank');
                      }}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Explorer
                    </button>
                    <button 
                      className="btn-neon-gold text-xs px-3 py-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(tx.hash);
                      }}
                    >
                      Copy
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

export default TransactionHistoryWidget;