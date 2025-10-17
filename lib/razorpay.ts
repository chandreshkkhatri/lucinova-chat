import Razorpay from "razorpay";

export type RazorpayClientResult =
  | { client: Razorpay; environment: "production" | "test" }
  | { error: string };

/**
 * Initializes and returns a Razorpay SDK client instance
 * Validates that required credentials are present
 */
export function ensureRazorpayClient(): RazorpayClientResult {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  const isProd = process.env.RAZORPAY_ENVIRONMENT === "production";

  if (!keyId || !keySecret) {
    return {
      error:
        "Server payment configuration missing. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.",
    };
  }

  try {
    const client = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    return { client, environment: isProd ? "production" : "test" };
  } catch (error: any) {
    return {
      error: `Failed to initialize Razorpay client: ${error.message}`,
    };
  }
}

/**
 * Creates a Razorpay subscription plan
 * Plans define the billing cycle and amount
 */
export async function createRazorpayPlan(params: {
  planName: string;
  amount: number; // in paise
  currency?: string;
  interval?: number;
  period?: "daily" | "weekly" | "monthly" | "yearly";
}) {
  const rz = ensureRazorpayClient();
  if ("error" in rz) throw new Error(rz.error);

  const {
    planName,
    amount,
    currency = "INR",
    interval = 1,
    period = "monthly",
  } = params;

  try {
    const plan = await rz.client.plans.create({
      period,
      interval,
      item: {
        name: planName,
        amount,
        currency,
        description: `${planName} subscription`,
      },
    });

    return plan;
  } catch (error: any) {
    throw new Error(
      `Failed to create Razorpay plan: ${error.error?.description || error.message}`
    );
  }
}

/**
 * Creates a Razorpay subscription for a customer
 * Subscriptions are linked to plans
 */
export async function createRazorpaySubscription(params: {
  planId: string;
  customerId?: string;
  totalCount?: number;
  quantity?: number;
  customerNotify?: 0 | 1;
  notes?: Record<string, string>;
}) {
  const rz = ensureRazorpayClient();
  if ("error" in rz) throw new Error(rz.error);

  try {
    const subscription = await rz.client.subscriptions.create({
      plan_id: params.planId,
      customer_id: params.customerId,
      total_count: params.totalCount,
      quantity: params.quantity || 1,
      customer_notify: params.customerNotify ?? 1,
      notes: params.notes,
    });

    return subscription;
  } catch (error: any) {
    throw new Error(
      `Failed to create Razorpay subscription: ${error.error?.description || error.message}`
    );
  }
}

/**
 * Fetches an existing Razorpay subscription by ID
 */
export async function fetchRazorpaySubscription(subscriptionId: string) {
  const rz = ensureRazorpayClient();
  if ("error" in rz) throw new Error(rz.error);

  try {
    const subscription = await rz.client.subscriptions.fetch(subscriptionId);
    return subscription;
  } catch (error: any) {
    throw new Error(
      `Failed to fetch Razorpay subscription: ${error.error?.description || error.message}`
    );
  }
}

/**
 * Fetch a Razorpay payment by ID
 */
export async function fetchRazorpayPayment(paymentId: string) {
  const rz = ensureRazorpayClient();
  if ("error" in rz) throw new Error(rz.error);

  try {
    // The Razorpay SDK exposes payments.fetch
    // @ts-ignore
    const payment = await rz.client.payments.fetch(paymentId);
    return payment;
  } catch (error: any) {
    throw new Error(
      `Failed to fetch Razorpay payment: ${error.error?.description || error.message}`
    );
  }
}

/**
 * Cancels an active Razorpay subscription
 */
export async function cancelRazorpaySubscription(
  subscriptionId: string,
  cancelAtCycleEnd = false
) {
  const rz = ensureRazorpayClient();
  if ("error" in rz) throw new Error(rz.error);

  try {
    const subscription = await rz.client.subscriptions.cancel(subscriptionId, {
      cancel_at_cycle_end: cancelAtCycleEnd ? 1 : 0,
    });
    return subscription;
  } catch (error: any) {
    throw new Error(
      `Failed to cancel Razorpay subscription: ${error.error?.description || error.message}`
    );
  }
}

/**
 * Verifies Razorpay webhook signature
 */
export function verifyRazorpayWebhook(
  body: string,
  signature: string,
  secret: string
): boolean {
  const crypto = require("crypto");
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return expectedSignature === signature;
}
