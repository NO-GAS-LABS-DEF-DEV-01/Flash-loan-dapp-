import React, { useState } from 'react';
import { GripVertical, Zap, DollarSign, Clock, AlertTriangle } from 'lucide-react';
import { useSui } from '../../context/SuiContext';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { useWallet } from '@suiet/wallet-kit';

interface FlashLoanFormData {
  amount: string;
  poolId: string;
  strategy: 'arbitrage' | 'liquidation';
  maxSlippage: string;
}

const FlashLoanWidget: React.FC = () => {
  const { client, packageId, connected, network } = useSui();
  const wallet = useWallet();
  const [formData, setFormData] = useState<FlashLoanFormData>({
    amount: '',
    poolId: '',
    strategy: 'arbitrage',
    maxSlippage: '1.0',
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<{
    success: boolean;
    message: string;
    txHash?: string;
  } | null>(null);

  // Available pools based on network
  const availablePools = {
    testnet: [
      { id: '0x123456789abcdef', name: 'SUI/USDC Pool', pair: 'SUI/USDC' },
      { id: '0x987654321fedcba', name: 'SUI/USDT Pool', pair: 'SUI/USDT' },
    ],
    mainnet: [
      { id: '0xmainnet123456789abcdef', name: 'SUI/USDC Pool', pair: 'SUI/USDC' },
      { id: '0xmainnet987654321fedcba', name: 'SUI/USDT Pool', pair: 'SUI/USDT' },
    ]
  };

  const handleInputChange = (field: keyof FlashLoanFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear previous results when form changes
    if (executionResult) {
      setExecutionResult(null);
    }
  };

  const executeFlashLoan = async () => {
    if (!connected || !client || !wallet.signAndExecuteTransactionBlock) {
      setExecutionResult({
        success: false,
        message: 'Please connect your wallet first'
      });
      return;
    }

    if (!formData.amount || !formData.poolId) {
      setExecutionResult({
        success: false,
        message: 'Please fill in all required fields'
      });
      return;
    }

    try {
      setIsExecuting(true);
      setExecutionResult(null);

      // Convert amount to proper units (assuming 9 decimals for SUI)
      const amountInUnits = Math.floor(parseFloat(formData.amount) * 1e9);
      const maxSlippageInBps = Math.floor(parseFloat(formData.maxSlippage) * 100);

      // Build transaction
      const txb = new TransactionBlock();
      
      // Create flash loan transaction
      const [borrowedCoin, flashLoan] = txb.moveCall({
        target: `${packageId}::flash_loan::borrow`,
        typeArguments: ['0x2::sui::SUI'],
        arguments: [
          txb.object(formData.poolId),
          txb.pure(amountInUnits, 'u64'),
          txb.object('0x6'), // Clock object
        ],
      });

      // Execute arbitrage strategy (simplified)
      if (formData.strategy === 'arbitrage') {
        txb.moveCall({
          target: `${packageId}::arbitrage_detector::execute_arbitrage`,
          typeArguments: ['0x2::sui::SUI'],
          arguments: [
            borrowedCoin,
            txb.pure(maxSlippageInBps, 'u64'),
          ],
        });
      }

      // Repay flash loan (this would be more complex in reality)
      txb.moveCall({
        target: `${packageId}::flash_loan::repay`,
        typeArguments: ['0x2::sui::SUI'],
        arguments: [
          txb.object(formData.poolId),
          borrowedCoin, // In reality, this would be the result of arbitrage
          flashLoan,
          txb.object('0x6'), // Clock object
        ],
      });

      // Set gas budget
      txb.setGasBudget(10000000); // 0.01 SUI

      // Execute transaction
      const result = await wallet.signAndExecuteTransactionBlock({
        transactionBlock: txb,
        options: {
          showEffects: true,
          showEvents: true,
        },
      });

      if (result.effects?.status?.status === 'success') {
        setExecutionResult({
          success: true,
          message: `Flash loan executed successfully! Gas used: ${result.effects.gasUsed?.computationCost || 'N/A'}`,
          txHash: result.digest,
        });
      } else {
        setExecutionResult({
          success: false,
          message: 'Transaction failed: ' + (result.effects?.status?.error || 'Unknown error'),
        });
      }
    } catch (error) {
      console.error('Flash loan execution error:', error);
      setExecutionResult({
        success: false,
        message: error instanceof Error ? error.message : 'Transaction failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const selectedPool = availablePools[network].find(pool => pool.id === formData.poolId);
  const estimatedProfit = parseFloat(formData.amount) * 0.005; // 0.5% estimated profit
  const estimatedFee = parseFloat(formData.amount) * 0.003; // 0.3% flash loan fee

  return (
    <div className="h-full flex flex-col">
      {/* Widget Header */}
      <div className="widget-header">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-ngl-teal" />
          <h3 className="widget-title">Flash Loan Execution</h3>
        </div>
        <GripVertical className="widget-drag-handle w-5 h-5" />
      </div>

      {/* Widget Content */}
      <div className="flex-1 space-y-4">
        {/* Network Status */}
        <div className="flex items-center gap-2 text-xs">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-ngl-green' : 'bg-ngl-red'}`}></div>
          <span className="text-ngl-gray-light font-pixel">
            Network: {network} {connected ? '(Connected)' : '(Disconnected)'}
          </span>
        </div>

        {/* Form */}
        <div className="space-y-3">
          {/* Amount Input */}
          <div className="form-group">
            <label className="form-label">Amount (SUI)</label>
            <input
              type="number"
              value={formData.amount}
              onChange={(e) => handleInputChange('amount', e.target.value)}
              placeholder="Enter amount to borrow"
              className="form-input"
              min="0"
              step="0.1"
            />
          </div>

          {/* Pool Selection */}
          <div className="form-group">
            <label className="form-label">Liquidity Pool</label>
            <select
              value={formData.poolId}
              onChange={(e) => handleInputChange('poolId', e.target.value)}
              className="form-select"
            >
              <option value="">Select a pool</option>
              {availablePools[network].map((pool) => (
                <option key={pool.id} value={pool.id}>
                  {pool.name} ({pool.pair})
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Selection */}
          <div className="form-group">
            <label className="form-label">Strategy</label>
            <select
              value={formData.strategy}
              onChange={(e) => handleInputChange('strategy', e.target.value as 'arbitrage' | 'liquidation')}
              className="form-select"
            >
              <option value="arbitrage">DEX Arbitrage</option>
              <option value="liquidation">Liquidation Arbitrage</option>
            </select>
          </div>

          {/* Max Slippage */}
          <div className="form-group">
            <label className="form-label">Max Slippage (%)</label>
            <input
              type="number"
              value={formData.maxSlippage}
              onChange={(e) => handleInputChange('maxSlippage', e.target.value)}
              placeholder="1.0"
              className="form-input"
              min="0.1"
              max="10"
              step="0.1"
            />
          </div>
        </div>

        {/* Estimation Section */}
        {formData.amount && selectedPool && (
          <div className="bg-ngl-dark/30 rounded-lg p-3 border border-ngl-teal/20">
            <h4 className="text-ngl-teal font-pixel text-sm mb-2">Estimation</h4>
            <div className="space-y-2 text-xs font-pixel">
              <div className="flex justify-between">
                <span className="text-ngl-gray-light">Flash Loan Amount:</span>
                <span className="text-ngl-teal">{formData.amount} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ngl-gray-light">Estimated Fee:</span>
                <span className="text-ngl-red">{estimatedFee.toFixed(4)} SUI</span>
              </div>
              <div className="flex justify-between">
                <span className="text-ngl-gray-light">Estimated Profit:</span>
                <span className="text-ngl-green">+{estimatedProfit.toFixed(4)} SUI</span>
              </div>
              <div className="flex justify-between border-t border-ngl-teal/20 pt-2 font-bold">
                <span className="text-ngl-gray-light">Net Profit:</span>
                <span className={estimatedProfit > estimatedFee ? 'text-ngl-green' : 'text-ngl-red'}>
                  {(estimatedProfit - estimatedFee).toFixed(4)} SUI
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Execution Result */}
        {executionResult && (
          <div className={`p-3 rounded-lg border ${
            executionResult.success 
              ? 'bg-ngl-green/10 border-ngl-green/30 text-ngl-green' 
              : 'bg-ngl-red/10 border-ngl-red/30 text-ngl-red'
          }`}>
            <div className="flex items-start gap-2">
              {executionResult.success ? (
                <DollarSign className="w-4 h-4 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-pixel text-xs">{executionResult.message}</p>
                {executionResult.txHash && (
                  <p className="font-pixel text-xs mt-1 opacity-75">
                    TX: {executionResult.txHash.slice(0, 16)}...
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Execute Button */}
        <button
          onClick={executeFlashLoan}
          disabled={!connected || isExecuting || !formData.amount || !formData.poolId}
          className={`w-full btn-neon-magenta ${
            isExecuting ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          <div className="flex items-center justify-center gap-2">
            {isExecuting ? (
              <>
                <Clock className="w-4 h-4 animate-spin" />
                Executing Flash Loan...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Execute Flash Loan
              </>
            )}
          </div>
        </button>
      </div>
    </div>
  );
};

export default FlashLoanWidget;