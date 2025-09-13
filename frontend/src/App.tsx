import React from 'react';
import { WalletProvider } from '@suiet/wallet-kit';
import Dashboard from './components/Dashboard';
import { SuiProvider } from './context/SuiContext';
import '@suiet/wallet-kit/style.css';
import './App.css';

function App() {
  return (
    <div className="App min-h-screen bg-ngl-darker text-ngl-teal">
      <WalletProvider>
        <SuiProvider>
          <Dashboard />
        </SuiProvider>
      </WalletProvider>
    </div>
  );
}

export default App;