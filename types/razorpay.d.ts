declare module "razorpay" {
  export interface RazorpayConfig {
    key_id: string;
    key_secret: string;
  }

  export interface RazorpayPlanItem {
    name: string;
    amount: number;
    currency: string;
    description?: string;
  }

  export interface RazorpayPlan {
    id: string;
    entity: string;
    interval: number;
    period: string;
    item: RazorpayPlanItem;
    notes: Record<string, any>;
    created_at: number;
  }

  export interface RazorpaySubscription {
    id: string;
    entity: string;
    plan_id: string;
    customer_id?: string;
    status: string;
    current_start?: number;
    current_end?: number;
    ended_at?: number | null;
    quantity: number;
    notes: Record<string, any>;
    charge_at?: number;
    start_at?: number;
    end_at?: number;
    auth_attempts: number;
    total_count: number;
    paid_count: number;
    customer_notify: number;
    created_at: number;
    expire_by?: number;
    short_url?: string;
    has_scheduled_changes: boolean;
    change_scheduled_at?: number | null;
    source: string;
    payment_method?: string;
  }

  export interface RazorpayCustomer {
    id: string;
    entity: string;
    name: string;
    email: string;
    contact: string;
    gstin?: string | null;
    notes: Record<string, any>;
    created_at: number;
  }

  export interface RazorpayPayment {
    id: string;
    entity: string;
    amount: number;
    currency: string;
    status: string;
    order_id?: string;
    invoice_id?: string | null;
    international: boolean;
    method: string;
    amount_refunded: number;
    refund_status?: string | null;
    captured: boolean;
    description?: string;
    card_id?: string | null;
    bank?: string | null;
    wallet?: string | null;
    vpa?: string | null;
    email: string;
    contact: string;
    customer_id?: string;
    notes: Record<string, any>;
    fee?: number;
    tax?: number;
    error_code?: string | null;
    error_description?: string | null;
    error_source?: string | null;
    error_step?: string | null;
    error_reason?: string | null;
    acquirer_data?: Record<string, any>;
    created_at: number;
  }

  export interface RazorpayPlansAPI {
    create(params: {
      period: "daily" | "weekly" | "monthly" | "yearly";
      interval: number;
      item: RazorpayPlanItem;
      notes?: Record<string, any>;
    }): Promise<RazorpayPlan>;

    fetch(planId: string): Promise<RazorpayPlan>;

    all(params?: {
      count?: number;
      skip?: number;
    }): Promise<{ entity: string; count: number; items: RazorpayPlan[] }>;
  }

  export interface RazorpaySubscriptionsAPI {
    create(params: {
      plan_id: string;
      customer_id?: string;
      total_count?: number;
      quantity?: number;
      start_at?: number;
      expire_by?: number;
      customer_notify?: 0 | 1;
      addons?: Array<{ item: RazorpayPlanItem }>;
      notes?: Record<string, any>;
      notify_info?: {
        notify_phone?: string;
        notify_email?: string;
      };
    }): Promise<RazorpaySubscription>;

    fetch(subscriptionId: string): Promise<RazorpaySubscription>;

    cancel(
      subscriptionId: string,
      params?: { cancel_at_cycle_end: 0 | 1 }
    ): Promise<RazorpaySubscription>;

    update(
      subscriptionId: string,
      params: {
        plan_id?: string;
        quantity?: number;
        customer_notify?: 0 | 1;
        remaining_count?: number;
        schedule_change_at?: "now" | "cycle_end";
        pause_at?: "now" | "cycle_end";
        resume_at?: number;
      }
    ): Promise<RazorpaySubscription>;

    all(params?: {
      count?: number;
      skip?: number;
      plan_id?: string;
    }): Promise<{
      entity: string;
      count: number;
      items: RazorpaySubscription[];
    }>;
  }

  export interface RazorpayCustomersAPI {
    create(params: {
      name: string;
      email: string;
      contact: string;
      fail_existing?: "0" | "1";
      gstin?: string;
      notes?: Record<string, any>;
    }): Promise<RazorpayCustomer>;

    fetch(customerId: string): Promise<RazorpayCustomer>;

    edit(
      customerId: string,
      params: {
        name?: string;
        email?: string;
        contact?: string;
      }
    ): Promise<RazorpayCustomer>;
  }

  class Razorpay {
    constructor(config: RazorpayConfig);

    plans: RazorpayPlansAPI;
    subscriptions: RazorpaySubscriptionsAPI;
    customers: RazorpayCustomersAPI;
  }

  export default Razorpay;
}

// Razorpay Checkout (client-side)
interface RazorpayCheckoutOptions {
  key: string;
  subscription_id?: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, any>;
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  handler?: (response: RazorpaySuccessResponse) => void;
  modal?: {
    ondismiss?: () => void;
    escape?: boolean;
    backdropclose?: boolean;
  };
  redirect?: boolean;
  callback_url?: string;
}

interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
  razorpay_subscription_id?: string;
}

interface RazorpayErrorResponse {
  error: {
    code: string;
    description: string;
    source: string;
    step: string;
    reason: string;
    metadata: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

interface RazorpayInstance {
  open(): void;
  close(): void;
  on(event: "payment.failed", handler: (response: RazorpayErrorResponse) => void): void;
}

interface RazorpayConstructor {
  new (options: RazorpayCheckoutOptions): RazorpayInstance;
}

interface Window {
  Razorpay: RazorpayConstructor;
}
