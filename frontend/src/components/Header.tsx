import React from 'react';
import { Zap, Activity, BarChart3 } from 'lucide-react';

const Header: React.FC = () => {
  return (
    <header className="relative bg-ngl-dark/80 backdrop-blur-sm border-b border-ngl-teal/30">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-repeat" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%2300ffff' fill-opacity='0.1'%3E%3Cpolygon points='10,0 20,10 10,20 0,10'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '20px 20px'
        }}></div>
      </div>

      <div className="relative container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between">
          {/* Logo and Branding */}
          <div className="flex items-center gap-4 mb-4 md:mb-0">
            <div className="flex items-center gap-2">
              <Zap className="w-8 h-8 text-ngl-teal animate-pulse-neon" />
              <div className="flex flex-col">
                <h1 className="ngl-logo text-2xl md:text-3xl">
                  NO_GAS-LABS
                </h1>
                <p className="ngl-tagline">
                  "Back in my day... gas fees cost your soul™"
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Stats */}
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-ngl-magenta" />
              <div className="flex flex-col">
                <span className="text-ngl-gray-light font-pixel text-xs">Flash Loans</span>
                <span className="text-ngl-magenta font-pixel text-sm font-bold">24/7 Active</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-ngl-gold" />
              <div className="flex flex-col">
                <span className="text-ngl-gray-light font-pixel text-xs">Arbitrage</span>
                <span className="text-ngl-gold font-pixel text-sm font-bold">Auto-Detect</span>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center gap-3 p-3 bg-ngl-dark/30 rounded-lg border border-ngl-teal/20">
            <div className="w-2 h-2 bg-ngl-teal rounded-full animate-pulse"></div>
            <span className="text-ngl-teal font-pixel text-xs">DEX Arbitrage Detection</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-ngl-dark/30 rounded-lg border border-ngl-magenta/20">
            <div className="w-2 h-2 bg-ngl-magenta rounded-full animate-pulse"></div>
            <span className="text-ngl-magenta font-pixel text-xs">Cross-Chain Opportunities</span>
          </div>
          
          <div className="flex items-center gap-3 p-3 bg-ngl-dark/30 rounded-lg border border-ngl-gold/20">
            <div className="w-2 h-2 bg-ngl-gold rounded-full animate-pulse"></div>
            <span className="text-ngl-gold font-pixel text-xs">Liquidation Arbitrage</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;