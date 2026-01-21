import { describe, it, expect } from 'vitest';
import { calculateProfitability } from './flashLoanFactory';

describe('Flash Loan Factory', () => {
  describe('calculateProfitability', () => {
    it('should calculate profit correctly', () => {
      const result = calculateProfitability('1000', '1010', '0.5');
      expect(result.profit).toBeDefined();
      expect(result.roi).toBeDefined();
      expect(result.gasUsed).toBe('0.5');
    });

    it('should calculate negative profit', () => {
      const result = calculateProfitability('1000', '990', '10');
      expect(parseFloat(result.profit)).toBeLessThan(0);
    });

    it('should calculate ROI correctly', () => {
      const result = calculateProfitability('1000', '1100', '0');
      const roi = parseFloat(result.roi);
      expect(roi).toBeCloseTo(10, 1);
    });

    it('should handle zero borrowed amount', () => {
      const result = calculateProfitability('0', '100', '0');
      expect(result.profit).toBeDefined();
    });

    it('should calculate with high gas fees', () => {
      const result = calculateProfitability('1000', '1050', '100');
      const profit = parseFloat(result.profit);
      expect(profit).toBeLessThan(50);
    });

    it('should format profit to 6 decimals', () => {
      const result = calculateProfitability('1000.123456789', '1010.987654321', '0.5');
      const profitParts = result.profit.split('.');
      expect(profitParts[1].length).toBeLessThanOrEqual(6);
    });

    it('should format ROI to 2 decimals', () => {
      const result = calculateProfitability('1000', '1050', '0');
      const roiParts = result.roi.split('.');
      expect(roiParts[1].length).toBeLessThanOrEqual(2);
    });
  });
});
