import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { useWallet } from '@suiet/wallet-kit';

// Configuration for both testnet and mainnet
export const SUI_NETWORKS = {
  testnet: {
    rpcUrl: getFullnodeUrl('testnet'),
    packageId: '0x123456789abcdef', // Will be updated after deployment
    deepbookPackageId: '0xdee9'
  },
  mainnet: {
    rpcUrl: getFullnodeUrl('mainnet'),
    packageId: '0x987654321fedcba', // Will be updated for mainnet
    deepbookPackageId: '0xdee9'
  }
};

interface SuiContextType {
  client: SuiClient | null;
  network: 'testnet' | 'mainnet';
  switchNetwork: (network: 'testnet' | 'mainnet') => void;
  packageId: string;
  deepbookPackageId: string;
  connected: boolean;
  address: string | null;
  balance: string;
  isLoading: boolean;
  error: string | null;
  refreshBalance: () => Promise<void>;
}

const SuiContext = createContext<SuiContextType | null>(null);

export const useSui = () => {
  const context = useContext(SuiContext);
  if (!context) {
    throw new Error('useSui must be used within a SuiProvider');
  }
  return context;
};

interface SuiProviderProps {
  children: ReactNode;
}

export const SuiProvider: React.FC<SuiProviderProps> = ({ children }) => {
  const wallet = useWallet();
  const [client, setClient] = useState<SuiClient | null>(null);
  const [network, setNetwork] = useState<'testnet' | 'mainnet'>('testnet');
  const [balance, setBalance] = useState<string>('0');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Sui client
  useEffect(() => {
    const config = SUI_NETWORKS[network];
    const suiClient = new SuiClient({
      url: config.rpcUrl,
    });
    setClient(suiClient);
  }, [network]);

  // Fetch balance when wallet connects or network changes
  useEffect(() => {
    if (wallet.connected && wallet.account && client) {
      refreshBalance();
    }
  }, [wallet.connected, wallet.account, client, network]);

  const refreshBalance = async () => {
    if (!client || !wallet.account?.address) return;

    try {
      setIsLoading(true);
      setError(null);

      const balance = await client.getBalance({
        owner: wallet.account.address,
        coinType: '0x2::sui::SUI',
      });

      setBalance(balance.totalBalance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch balance');
    } finally {
      setIsLoading(false);
    }
  };

  const switchNetwork = (newNetwork: 'testnet' | 'mainnet') => {
    setNetwork(newNetwork);
    setBalance('0');
    setError(null);
  };

  const contextValue: SuiContextType = {
    client,
    network,
    switchNetwork,
    packageId: SUI_NETWORKS[network].packageId,
    deepbookPackageId: SUI_NETWORKS[network].deepbookPackageId,
    connected: wallet.connected,
    address: wallet.account?.address || null,
    balance,
    isLoading,
    error,
    refreshBalance,
  };

  return (
    <SuiContext.Provider value={contextValue}>
      {children}
    </SuiContext.Provider>
  );
};