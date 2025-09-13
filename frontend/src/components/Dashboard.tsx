import React, { useState, useCallback } from 'react';
import { Responsive, WidthProvider, Layout } from 'react-grid-layout';
import { ConnectButton } from '@suiet/wallet-kit';
import { useSui } from '../context/SuiContext';
import Header from './Header';
import FlashLoanWidget from './widgets/FlashLoanWidget';
import ArbitrageWidget from './widgets/ArbitrageWidget';
import PoolMonitorWidget from './widgets/PoolMonitorWidget';
import TransactionHistoryWidget from './widgets/TransactionHistoryWidget';
import PriceChartWidget from './widgets/PriceChartWidget';
import NetworkSwitcher from './NetworkSwitcher';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  const { connected, address, balance, network, isLoading } = useSui();

  // Default layouts for different screen sizes
  const [layouts, setLayouts] = useState<{ [key: string]: Layout[] }>({
    lg: [
      { i: 'flash-loan', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'arbitrage', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'pools', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'transactions', x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'chart', x: 8, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
    ],
    md: [
      { i: 'flash-loan', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'arbitrage', x: 6, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'pools', x: 0, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'transactions', x: 4, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'chart', x: 8, y: 4, w: 4, h: 3, minW: 3, minH: 2 },
    ],
    sm: [
      { i: 'flash-loan', x: 0, y: 0, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'arbitrage', x: 0, y: 4, w: 6, h: 4, minW: 4, minH: 3 },
      { i: 'pools', x: 0, y: 8, w: 6, h: 3, minW: 3, minH: 2 },
      { i: 'transactions', x: 0, y: 11, w: 6, h: 3, minW: 3, minH: 2 },
      { i: 'chart', x: 0, y: 14, w: 6, h: 3, minW: 3, minH: 2 },
    ],
    xs: [
      { i: 'flash-loan', x: 0, y: 0, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'arbitrage', x: 0, y: 4, w: 4, h: 4, minW: 4, minH: 3 },
      { i: 'pools', x: 0, y: 8, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'transactions', x: 0, y: 11, w: 4, h: 3, minW: 3, minH: 2 },
      { i: 'chart', x: 0, y: 14, w: 4, h: 3, minW: 3, minH: 2 },
    ],
  });

  const handleLayoutChange = useCallback((layout: Layout[], allLayouts: { [key: string]: Layout[] }) => {
    setLayouts(allLayouts);
    // Save to localStorage for persistence
    localStorage.setItem('dashboard-layouts', JSON.stringify(allLayouts));
  }, []);

  // Load saved layouts from localStorage
  React.useEffect(() => {
    const savedLayouts = localStorage.getItem('dashboard-layouts');
    if (savedLayouts) {
      try {
        setLayouts(JSON.parse(savedLayouts));
      } catch (error) {
        console.error('Failed to load saved layouts:', error);
      }
    }
  }, []);

  const formatBalance = (balance: string): string => {
    const balanceInSui = parseInt(balance) / 1e9;
    return balanceInSui.toFixed(4);
  };

  return (
    <div className="min-h-screen bg-ngl-darker">
      <Header />
      
      {/* Main Dashboard Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Connection Status Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 p-4 bg-ngl-dark/50 rounded-lg border border-ngl-teal/30">
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            {connected ? (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-ngl-green rounded-full animate-pulse"></div>
                <span className="text-ngl-teal font-pixel text-sm">
                  Connected: {address?.slice(0, 8)}...{address?.slice(-6)}
                </span>
                <div className="flex items-center gap-2">
                  <span className="text-ngl-gray-light font-pixel text-xs">Balance:</span>
                  <span className="text-ngl-gold font-pixel text-sm font-bold">
                    {isLoading ? '...' : formatBalance(balance)} SUI
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-ngl-red rounded-full"></div>
                <span className="text-ngl-gray font-pixel text-sm">Not Connected</span>
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-4">
            <NetworkSwitcher />
            <ConnectButton className="btn-neon">
              {connected ? 'Connected' : 'Connect Wallet'}
            </ConnectButton>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="w-full">
          <ResponsiveGridLayout
            className="layout"
            layouts={layouts}
            onLayoutChange={handleLayoutChange}
            breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
            cols={{ lg: 12, md: 12, sm: 6, xs: 4, xxs: 2 }}
            rowHeight={60}
            margin={[16, 16]}
            isDraggable={true}
            isResizable={true}
            draggableHandle=".widget-drag-handle"
            useCSSTransforms={true}
          >
            {/* Flash Loan Widget */}
            <div key="flash-loan" className="widget flash-loan-widget">
              <FlashLoanWidget />
            </div>

            {/* Arbitrage Opportunities Widget */}
            <div key="arbitrage" className="widget arbitrage-widget">
              <ArbitrageWidget />
            </div>

            {/* Pool Monitoring Widget */}
            <div key="pools" className="widget pool-widget">
              <PoolMonitorWidget />
            </div>

            {/* Transaction History Widget */}
            <div key="transactions" className="widget transaction-widget">
              <TransactionHistoryWidget />
            </div>

            {/* Price Chart Widget */}
            <div key="chart" className="widget chart-widget">
              <PriceChartWidget />
            </div>
          </ResponsiveGridLayout>
        </div>

        {/* Footer */}
        <footer className="mt-12 text-center">
          <div className="inline-flex items-center gap-2 text-ngl-gray font-pixel text-xs">
            <span>Powered by</span>
            <span className="text-ngl-teal font-bold">NO_GAS-LABS</span>
            <span>•</span>
            <span>Network: {network}</span>
            <span>•</span>
            <span className="italic">"Back in my day... gas fees cost your soul™"</span>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default Dashboard;