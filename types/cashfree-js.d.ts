declare module "@cashfreepayments/cashfree-js" {
  export type CashfreeMode = "sandbox" | "production";

  export interface CashfreeCheckoutResult {
    error?: unknown;
    paymentDetails?: unknown;
  }

  export interface CashfreeCheckoutAppearance {
    theme?: string;
    primaryColor?: string;
    [key: string]: unknown;
  }

  export interface CashfreeCheckoutOptions {
    paymentSessionId: string;
    redirectTarget?: "_self" | "_blank" | "_modal";
    appearance?: CashfreeCheckoutAppearance;
    [key: string]: unknown;
  }

  export interface Cashfree {
    checkout(options: CashfreeCheckoutOptions): Promise<CashfreeCheckoutResult>;
  }

  export function load(config: { mode: CashfreeMode }): Promise<Cashfree>;
}
