# 🚀 Sui Flash Loan System: User Guide

Welcome to your No-Code Flash Loan Dashboard! This guide is designed for **non-coders** and is optimized for viewing on any device, including Android.

---

## 📱 How to Interact (Android/Mobile)

1.  **Install a Sui Wallet**: Download the **Suiet** or **Sui Wallet** extension/app from the Play Store or their official websites.
2.  **Import Your Wallet**:
    *   Open the wallet app.
    *   Select "Import existing wallet" using your **Mnemonic Phrase**:
        > `sponsor scheme wink rail father credit change coral among birth jaguar jealous`
3.  **Switch to Testnet**:
    *   In your wallet settings, change the network from "Mainnet" to **"Testnet"**.
4.  **Access the Dashboard**:
    *   Open your browser and navigate to your hosted frontend URL (or run it locally).
    *   Click **"Connect Wallet"** and approve the connection.
5.  **Execute a Flash Loan**:
    *   **Drag & Drop**: Use the interface to select a pool (e.g., SUI/USDC).
    *   **Enter Amount**: Type how much SUI you want to borrow.
    *   **Click Execute**: The system handles the complex "Programmable Transaction Block" (PTB) logic in the background.

---

## 🏗️ Deployed Contracts: What do they do?

| Contract | Purpose | Functionality |
| :--- | :--- | :--- |
| **Pool Registry** | The "Library" | Keeps track of all available liquidity pools where you can borrow funds. |
| **DeepBook Manager** | The "Trader" | Connects your flash loan to DeepBook (Sui's central exchange) to find trading profits. |
| **Arbitrage Detector** | The "Scout" | Automatically looks for price differences between markets to ensure your loan is profitable. |
| **Price Oracle** | The "Clock" | Provides real-time, accurate prices for tokens to prevent trading at a loss. |

---

## 🔍 Verification on Sui Explorer

You can track every move on the blockchain. Click the links below to see your live contracts:

*   **Main Package**: [0xf44e...1bc7](https://suiscan.xyz/testnet/package/0xf44e96ad7aa2155c7bf68b7debf5ea9e63445b9342bc4138c219f330742c1bc7)
*   **Your Wallet**: [0xbef3...9278](https://suiscan.xyz/testnet/account/0xbef3b050e23e19c877a984843e708344d90e830776f946ffdb08a9720c1a9278)

---

## 🛠️ Technical Compatibility

*   **Blockchain**: Fully compatible with Sui Move 2024 standards.
*   **Backend**: Deploys custom Move modules that handle the "Hot Potato" flash loan logic (must repay in the same block).
*   **Frontend**: Uses **Programmable Transaction Blocks (PTB)**. This allows the "Drag & Drop" interface to chain multiple actions (Borrow -> Trade -> Repay) into a single, safe transaction. If the trade isn't profitable, the whole thing cancels automatically, protecting your funds.

---

**Note for Android Users**: If your screen is broken, use "Auto-rotate" or a Bluetooth mouse to navigate the dashboard more easily!
