# 🚀 Sui Flash Loan dApp - NO_GAS-LABS

A comprehensive, no-code Sui blockchain flash loan dApp with drag-and-drop interface, featuring arbitrage detection across DEX pools, cross-chain opportunities, and liquidation arbitrage.

## ⚡ Features

### 🔥 Flash Loan System
- **Atomic Transactions**: Borrow and repay within the same transaction block
- **Multi-Asset Support**: Support for SUI, USDC, USDT, and other major tokens
- **Risk Management**: Built-in safety mechanisms with time limits and amount caps
- **Fee Optimization**: Dynamic fee calculation based on market conditions

### 🎯 Arbitrage Detection
- **DEX Price Differences**: Real-time monitoring across multiple DEX pools
- **Cross-Chain Arbitrage**: Opportunities between Sui testnet and mainnet
- **Liquidation Arbitrage**: Automated detection of under-collateralized positions
- **Multi-Pool Strategies**: Complex arbitrage across multiple liquidity sources

### 🎮 Drag-and-Drop Interface
- **Pool Monitoring Widgets**: Draggable liquidity pool dashboards
- **Trading Strategy Panels**: Customizable arbitrage strategy components
- **Transaction History**: Interactive transaction timeline and analytics
- **Real-Time Price Charts**: Live price feeds with technical indicators

### 🌐 DeepBookV3 Integration
- **Testnet Pools**: Full integration with Sui testnet DeepBook pools
- **Mainnet Ready**: Prepared for mainnet liquidity when available
- **Balance Management**: Automated balance manager creation and funding
- **Order Management**: Advanced order placement and cancellation

## 🏗️ Architecture

### Smart Contracts (Move)
```
/contracts/sources/
├── flash_loan.move           # Core flash loan functionality
├── arbitrage_detector.move   # Opportunity detection algorithms
└── deepbook_integration.move # DeepBookV3 pool interactions
```

### Frontend (React + TypeScript)
```
/frontend/src/
├── components/               # Reusable UI components
├── hooks/                   # Custom React hooks
├── services/                # Blockchain interaction services
├── styles/                  # NO_GAS-LABS theming
└── utils/                   # Utility functions
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Sui CLI
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/sui-flash-loan-dapp.git
cd sui-flash-loan-dapp
```

2. **Install dependencies**
```bash
# Install frontend dependencies
cd frontend
npm install

# Return to project root
cd ..
```

3. **Build Move contracts**
```bash
cd contracts
sui move build
```

4. **Deploy to testnet**
```bash
sui client publish --gas-budget 30000000
```

5. **Start frontend**
```bash
cd frontend
npm start
```

## 🎨 NO_GAS-LABS Theme

The dApp features a custom retro pixel aesthetic inspired by NO_GAS-LABS:

- **Color Palette**: Dark backgrounds with vibrant teal and magenta accents
- **Typography**: Pixel-perfect fonts with gaming aesthetic
- **Animations**: Smooth transitions with retro effects
- **Layout**: Grid-based design with draggable components

## 🔧 Configuration

### Network Settings
```typescript
// testnet configuration
const TESTNET_CONFIG = {
  rpcUrl: 'https://fullnode.testnet.sui.io:443',
  packages: {
    flashLoan: '0x...',
    deepbook: '0xdee9...'
  }
};

// mainnet configuration (when available)
const MAINNET_CONFIG = {
  rpcUrl: 'https://fullnode.mainnet.sui.io:443',
  packages: {
    flashLoan: '0x...',
    deepbook: '0x...'
  }
};
```

### DeepBook Pools
The dApp supports both testnet and mainnet pools:

#### Testnet Pools
- SUI/USDC: `0x123456789abcdef`
- SUI/USDT: `0x987654321fedcba`

#### Mainnet Pools (Ready for Integration)
- SUI/USDC: `0xmainnet123456789abcdef`
- SUI/USDT: `0xmainnet987654321fedcba`

## 🧪 Testing

### Unit Tests
```bash
# Test Move contracts
cd contracts
sui move test

# Test frontend components
cd frontend
npm test
```

### Integration Tests
```bash
# Run full integration test suite
npm run test:integration
```

### E2E Tests
```bash
# Run end-to-end tests
npm run test:e2e
```

## 🚀 Deployment

### Automated Deployment (GitHub Actions)
The project includes automated deployment workflows:

- **Testnet**: Automatically deploys on push to `main` branch
- **Mainnet**: Manual deployment trigger available

### Manual Deployment
```bash
# Deploy to testnet
sui client switch --env testnet
sui client publish --gas-budget 30000000

# Deploy to mainnet (when ready)
sui client switch --env mainnet
sui client publish --gas-budget 50000000
```

## 📚 API Reference

### Flash Loan Functions
```move
// Borrow tokens via flash loan
public fun borrow<T>(
    pool: &mut LiquidityPool<T>,
    amount: u64,
    clock: &Clock,
    ctx: &mut TxContext
): (Coin<T>, FlashLoan<T>)

// Repay flash loan
public fun repay<T>(
    pool: &mut LiquidityPool<T>,
    payment: Coin<T>,
    loan: FlashLoan<T>,
    clock: &Clock,
    ctx: &mut TxContext
)
```

### Arbitrage Detection
```move
// Detect DEX arbitrage opportunity
public fun detect_dex_arbitrage(
    detector: &mut ArbitrageDetector,
    pool_a_info: PoolInfo,
    pool_b_info: PoolInfo,
    clock: &Clock,
    ctx: &mut TxContext
): bool
```

## 🔐 Security

### Smart Contract Security
- **Atomic Execution**: Flash loans must be repaid in the same transaction
- **Access Control**: Admin functions protected with capability-based security
- **Input Validation**: Comprehensive validation of all parameters
- **Time Limits**: Flash loans expire automatically to prevent stale transactions

### Frontend Security
- **Wallet Integration**: Secure wallet connection with signature verification
- **Transaction Signing**: All transactions signed client-side
- **Input Sanitization**: Protection against XSS and injection attacks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is provided for educational and demonstration purposes. Flash loans and arbitrage trading involve significant financial risks. Always conduct thorough testing and risk assessment before using in production with real funds.

## 🆘 Support

- **Documentation**: Check the `/docs` folder for detailed guides
- **Issues**: Report bugs via GitHub Issues
- **Discord**: Join our community Discord server
- **Email**: support@nogaslabs.com

---

**Built with ❤️ by NO_GAS-LABS Team**

*"Back in my day... gas fees cost your soul™"*