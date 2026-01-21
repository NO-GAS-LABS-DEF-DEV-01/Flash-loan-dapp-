import { getDb } from './db';
import { flashLoans, flashLoanTransactions } from '../drizzle/schema';
import { eq, and } from 'drizzle-orm';

/**
 * Flash Loan Factory - Sui Blockchain Integration
 * Manages flash loan creation, execution, and monitoring
 */

export interface FlashLoanConfig {
  name: string;
  protocol: 'aave' | 'uniswap' | 'dydx' | 'sui-native';
  assetAddress: string;
  amount: string;
  repaymentAmount: string;
  maxFeePercentage: number;
  description?: string;
}

/**
 * Create a new flash loan configuration
 */
export async function createFlashLoan(userId: number, config: FlashLoanConfig) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db.insert(flashLoans).values({
      userId,
      name: config.name,
      protocol: config.protocol,
      assetAddress: config.assetAddress,
      amount: config.amount,
      repaymentAmount: config.repaymentAmount,
      maxFeePercentage: config.maxFeePercentage.toString(),
      description: config.description || '',
      status: 'active',
    });

    return result;
  } catch (error) {
    console.error('Error creating flash loan:', error);
    throw new Error('Failed to create flash loan');
  }
}

/**
 * Get all flash loans for a user
 */
export async function getFlashLoans(userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const loans = await db
      .select()
      .from(flashLoans)
      .where(eq(flashLoans.userId, userId));

    return loans;
  } catch (error) {
    console.error('Error fetching flash loans:', error);
    throw new Error('Failed to fetch flash loans');
  }
}

/**
 * Get a specific flash loan by ID
 */
export async function getFlashLoanById(id: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const loan = await db
      .select()
      .from(flashLoans)
      .where(and(eq(flashLoans.id, id), eq(flashLoans.userId, userId)))
      .limit(1);

    return loan[0] || null;
  } catch (error) {
    console.error('Error fetching flash loan:', error);
    throw new Error('Failed to fetch flash loan');
  }
}

/**
 * Execute a flash loan transaction
 */
export async function executeFlashLoan(loanId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const loan = await getFlashLoanById(loanId, userId);
    if (!loan) {
      throw new Error('Flash loan not found');
    }

    // Simulate flash loan execution
    // In production, this would interact with Sui blockchain
    const txHash = `0x${Math.random().toString(16).slice(2)}`;
    const gasUsed = (Math.random() * 1000000).toFixed(0);
    const profit = (parseFloat(loan.repaymentAmount) - parseFloat(loan.amount)).toFixed(2);

    const transaction = await db.insert(flashLoanTransactions).values({
      loanId,
      txHash,
      status: 'success',
      borrowedAmount: loan.amount,
      repaidAmount: loan.repaymentAmount,
      profit,
      gasUsed,
    });

    return transaction;
  } catch (error) {
    console.error('Error executing flash loan:', error);
    throw new Error('Failed to execute flash loan');
  }
}

/**
 * Get transaction history for a flash loan
 */
export async function getFlashLoanTransactions(loanId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const transactions = await db
      .select()
      .from(flashLoanTransactions)
      .where(eq(flashLoanTransactions.loanId, loanId));

    return transactions;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    throw new Error('Failed to fetch transactions');
  }
}

/**
 * Update flash loan status
 */
export async function updateFlashLoanStatus(
  loanId: number,
  userId: number,
  status: 'active' | 'paused' | 'completed',
) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db
      .update(flashLoans)
      .set({ status })
      .where(and(eq(flashLoans.id, loanId), eq(flashLoans.userId, userId)));

    return result;
  } catch (error) {
    console.error('Error updating flash loan status:', error);
    throw new Error('Failed to update flash loan status');
  }
}

/**
 * Delete a flash loan
 */
export async function deleteFlashLoan(loanId: number, userId: number) {
  try {
    const db = await getDb();
    if (!db) throw new Error('Database not available');
    const result = await db
      .delete(flashLoans)
      .where(and(eq(flashLoans.id, loanId), eq(flashLoans.userId, userId)));

    return result;
  } catch (error) {
    console.error('Error deleting flash loan:', error);
    throw new Error('Failed to delete flash loan');
  }
}

/**
 * Calculate flash loan profitability
 */
export function calculateProfitability(
  borrowedAmount: string,
  repaidAmount: string,
  gasUsed: string,
  gasPrice: string = '1',
) {
  const borrowed = parseFloat(borrowedAmount);
  const repaid = parseFloat(repaidAmount);
  const gas = parseFloat(gasUsed) * parseFloat(gasPrice);

  const profit = repaid - borrowed - gas;
  const roi = (profit / borrowed) * 100;

  return {
    profit: profit.toFixed(6),
    roi: roi.toFixed(2),
    gasUsed,
  };
}

/**
 * Get flash loan statistics for a user
 */
export async function getFlashLoanStats(userId: number) {
  try {
    const loans = await getFlashLoans(userId);
    const allTransactions = [];

    for (const loan of loans) {
      const txs = await getFlashLoanTransactions(loan.id);
      allTransactions.push(...txs);
    }

    const totalLoans = loans.length;
    const successfulTxs = allTransactions.filter((tx) => tx.status === 'success').length;
    const totalProfit = allTransactions.reduce((sum, tx) => sum + parseFloat(tx.profit), 0);
    const totalGasUsed = allTransactions.reduce((sum, tx) => sum + parseFloat(tx.gasUsed), 0);

    return {
      totalLoans,
      successfulTransactions: successfulTxs,
      totalProfit: totalProfit.toFixed(6),
      totalGasUsed: totalGasUsed.toFixed(0),
      averageProfitPerTx: successfulTxs > 0 ? (totalProfit / successfulTxs).toFixed(6) : '0',
    };
  } catch (error) {
    console.error('Error calculating stats:', error);
    throw new Error('Failed to calculate statistics');
  }
}
