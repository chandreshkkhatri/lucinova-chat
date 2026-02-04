import "server-only";

/**
 * Sales tax calculation result
 */
export interface TaxCalculationResult {
  taxAmount: number; // Tax amount in cents/paise
  taxRate: number; // Tax rate (e.g., 0.0875 for 8.75%)
  taxJurisdiction: string; // State code or jurisdiction identifier
  isTaxable: boolean; // Whether this purchase is taxable
  provider: "taxjar" | "manual" | "none"; // Which service calculated it
}

/**
 * Calculate sales tax using TaxJar API with fallback to manual rates
 *
 * For US customers: Attempts to use TaxJar API (if configured) for accurate
 * multi-state tax rates including local taxes. Falls back to manual state rates.
 * Non-US customers: Returns 0 tax.
 *
 * @param amount - Amount in cents/paise
 * @param currency - Currency code (USD, INR, etc.)
 * @param country - ISO 3166-1 alpha-2 country code
 * @param state - State/province code (e.g., "CA", "NY")
 * @param customerEmail - Customer email for logging purposes
 * @returns Tax calculation result
 */
export async function calculateSalesTax(
  amount: number,
  currency: string,
  country: string,
  state?: string,
  customerEmail?: string
): Promise<TaxCalculationResult> {
  // Non-US: No tax
  if (country !== "US") {
    return {
      taxAmount: 0,
      taxRate: 0,
      taxJurisdiction: "None",
      isTaxable: false,
      provider: "none",
    };
  }

  // US customer without state: Can't calculate
  if (!state) {
    console.warn(
      `[Tax] US customer without state - unable to calculate tax. Email: ${customerEmail}`
    );
    return {
      taxAmount: 0,
      taxRate: 0,
      taxJurisdiction: "Unknown",
      isTaxable: true, // Mark as taxable for compliance
      provider: "none",
    };
  }

  // Try TaxJar API if configured
  if (process.env.TAXJAR_API_KEY) {
    try {
      return await calculateTaxWithTaxJar(amount, state);
    } catch (error) {
      console.error("[Tax] TaxJar API error:", error);
      // Fall back to manual rate if TaxJar fails
      return calculateManualTaxRate(amount, state);
    }
  }

  // No TaxJar API - use manual rates
  console.log(
    `[Tax] TaxJar not configured - using manual rates for ${state}`
  );
  return calculateManualTaxRate(amount, state);
}

/**
 * Calculate tax using TaxJar API
 * API docs: https://developers.taxjar.com/api/reference/
 */
async function calculateTaxWithTaxJar(
  amount: number,
  state: string
): Promise<TaxCalculationResult> {
  const amountInDollars = amount / 100;
  const apiKey = process.env.TAXJAR_API_KEY;

  if (!apiKey) {
    throw new Error("TAXJAR_API_KEY not configured");
  }

  try {
    const response = await fetch("https://api.taxjar.com/v2/taxes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        // Required fields
        from_country: "US",
        from_state: "CA", // Default origin state (configure as needed)
        to_state: state,
        amount: amountInDollars,
        // Optional fields for accuracy
        product_type: "software", // SaaS categorized as software
      }),
    });

    if (!response.ok) {
      throw new Error(
        `TaxJar API error: ${response.status} ${response.statusText}`
      );
    }

    const data = (await response.json()) as any;
    const taxData = data.tax;

    const taxAmountInCents = Math.round(taxData.amount_to_collect * 100);
    const taxRate = taxData.rate || 0;

    console.log(
      `[Tax] TaxJar: $${taxData.amount_to_collect.toFixed(2)} tax for ${state} (${(taxRate * 100).toFixed(2)}%)`
    );

    return {
      taxAmount: taxAmountInCents,
      taxRate: taxRate,
      taxJurisdiction: state,
      isTaxable: true,
      provider: "taxjar",
    };
  } catch (error) {
    console.error("[Tax] TaxJar calculation failed:", error);
    throw error;
  }
}

/**
 * Fallback: Calculate tax using manual state tax rates
 * These are approximate and may not include all local taxes
 * For full compliance, use TaxJar when possible
 */
function calculateManualTaxRate(
  amount: number,
  state: string
): TaxCalculationResult {
  // Common US state sales tax rates (approximate, updated for 2025)
  // NOTE: These are STATE rates only and do not include local/county taxes
  // TaxJar provides more accurate rates including local taxes
  const stateTaxRates: Record<string, number> = {
    AL: 0.04,
    AK: 0.0,
    AZ: 0.056,
    AR: 0.065,
    CA: 0.0725,
    CO: 0.029,
    CT: 0.064,
    DE: 0.0,
    FL: 0.06,
    GA: 0.04,
    HI: 0.04,
    ID: 0.06,
    IL: 0.0625,
    IN: 0.07,
    IA: 0.06,
    KS: 0.0575,
    KY: 0.06,
    LA: 0.045,
    ME: 0.055,
    MD: 0.06,
    MA: 0.0625,
    MI: 0.06,
    MN: 0.0685,
    MS: 0.07,
    MO: 0.0425,
    MT: 0.0,
    NE: 0.055,
    NV: 0.0685,
    NH: 0.0,
    NJ: 0.0625,
    NM: 0.0525,
    NY: 0.04,
    NC: 0.03,
    ND: 0.05,
    OH: 0.0575,
    OK: 0.045,
    OR: 0.0,
    PA: 0.06,
    RI: 0.07,
    SC: 0.05,
    SD: 0.045,
    TN: 0.0925,
    TX: 0.0625,
    UT: 0.0485,
    VT: 0.06,
    VA: 0.0575,
    WA: 0.065,
    WV: 0.06,
    WI: 0.05,
    WY: 0.04,
  };

  const taxRate = stateTaxRates[state] || 0.07; // Default to 7% if unknown
  const taxAmount = Math.round(amount * taxRate);

  console.log(
    `[Tax] Manual fallback: ${state} = ${(taxRate * 100).toFixed(2)}% (${(taxAmount / 100).toFixed(2)} USD)`
  );

  return {
    taxAmount,
    taxRate,
    taxJurisdiction: state,
    isTaxable: true,
    provider: "manual",
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
