import "server-only";

/**
 * Sales tax calculation result
 */
export interface TaxCalculationResult {
  taxAmount: number; // Tax amount in cents/paise
  taxRate: number; // Tax rate (e.g., 0.0875 for 8.75%)
  taxJurisdiction: string; // State code or jurisdiction identifier
  isTaxable: boolean; // Whether this purchase is taxable
}

/**
 * Calculate sales tax based on customer location
 *
 * PLACEHOLDER: Currently returns 0 tax
 * TODO: Integrate with TaxJar or Avalara API for actual calculation
 *
 * @param amount - Amount in cents/paise
 * @param currency - Currency code (USD, INR, etc.)
 * @param country - ISO 3166-1 alpha-2 country code
 * @param state - State/province code (e.g., "CA", "NY")
 * @returns Tax calculation result
 */
export async function calculateSalesTax(
  amount: number,
  currency: string,
  country: string,
  state?: string
): Promise<TaxCalculationResult> {
  // Phase 1: Return no tax (placeholder)
  // Phase 2: Integrate TaxJar or Avalara

  // US customers: Mark as taxable but return 0 for now
  if (country === "US" && state) {
    console.log(
      `[Tax] Would calculate tax for ${state} on ${amount} ${currency}`
    );

    return {
      taxAmount: 0, // Placeholder - will be calculated in Phase 3
      taxRate: 0,
      taxJurisdiction: state,
      isTaxable: true, // Mark as taxable for future implementation
    };
  }

  // Non-US or no state info: No tax
  return {
    taxAmount: 0,
    taxRate: 0,
    taxJurisdiction: "None",
    isTaxable: false,
  };
}

/**
 * Get total amount including tax
 */
export function getTotalWithTax(
  subtotal: number,
  taxAmount: number
): number {
  return subtotal + taxAmount;
}

/**
 * Format tax for display
 */
export function formatTaxDisplay(taxAmount: number, currency: string): string {
  if (taxAmount === 0) return "No tax";
  return `+${(taxAmount / 100).toFixed(2)} ${currency} tax`;
}
