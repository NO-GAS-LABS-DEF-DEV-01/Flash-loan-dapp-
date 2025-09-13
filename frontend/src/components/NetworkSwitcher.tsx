import React from 'react';
import { Globe, Wifi } from 'lucide-react';
import { useSui } from '../context/SuiContext';

const NetworkSwitcher: React.FC = () => {
  const { network, switchNetwork } = useSui();

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-ngl-teal" />
      <div className="flex bg-ngl-dark rounded-lg border border-ngl-teal/30 overflow-hidden">
        <button
          onClick={() => switchNetwork('testnet')}
          className={`px-3 py-1 font-pixel text-xs transition-all duration-300 ${
            network === 'testnet'
              ? 'bg-ngl-teal text-ngl-dark'
              : 'text-ngl-teal hover:bg-ngl-teal/10'
          }`}
        >
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Testnet
          </div>
        </button>
        <button
          onClick={() => switchNetwork('mainnet')}
          className={`px-3 py-1 font-pixel text-xs transition-all duration-300 ${
            network === 'mainnet'
              ? 'bg-ngl-teal text-ngl-dark'
              : 'text-ngl-teal hover:bg-ngl-teal/10'
          }`}
        >
          <div className="flex items-center gap-1">
            <Wifi className="w-3 h-3" />
            Mainnet
          </div>
        </button>
      </div>
    </div>
  );
};

export default NetworkSwitcher;