import { Cashfree, CFEnvironment } from "cashfree-pg";

export type CashfreeClientResult =
  | { client: Cashfree; environment: "production" | "sandbox" }
  | { error: string };

export function ensureCashfreeClient(): CashfreeClientResult {
  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  const isProd = process.env.CASHFREE_ENVIRONMENT === "production";

  if (!appId || !secret) {
    return {
      error:
        "Server payment configuration missing. Set CASHFREE_APP_ID and CASHFREE_SECRET_KEY.",
    };
  }

  const env = isProd ? CFEnvironment.PRODUCTION : CFEnvironment.SANDBOX;
  const client = new Cashfree(env, appId, secret);
  return { client, environment: isProd ? "production" : "sandbox" };
}
