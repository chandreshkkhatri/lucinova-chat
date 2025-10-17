# Razorpay Subscriptions Integration Guide

This document provides comprehensive instructions for integrating and using Razorpay subscriptions in the Lucidity project.

## Overview

The project now supports both **Cashfree** and **Razorpay** payment gateways. The active payment provider is controlled by the `PAYMENT_PROVIDER` environment variable.

### Key Differences: Cashfree vs Razorpay

| Feature | Cashfree | Razorpay |
|---------|----------|----------|
| Payment Type | One-time payments | Recurring subscriptions |
| Billing | Manual renewal | Auto-renewal (until total_count) |
| Customer Management | Session-based | Customer entity stored |
| Plan Management | Per-transaction | Pre-created plans |
| Webhook Events | Payment events | Subscription lifecycle events |

## Setup Instructions

### 1. Install Razorpay SDK

```bash
pnpm add razorpay
```

### 2. Configure Environment Variables

Add the following to your `.env` file:

```bash
# Payment Gateway Selection
PAYMENT_PROVIDER=razorpay  # or "cashfree"

# Razorpay Configuration
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
RAZORPAY_ENVIRONMENT=test  # or "production"

# IMPORTANT: Pre-created Plan ID (see step 3)
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx
```

### 3. Create a Razorpay Plan

Razorpay subscriptions require a **plan** to be created first. You have two options:

#### Option A: Via Razorpay Dashboard (Recommended)

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to **Subscriptions** → **Plans**
3. Click **Create Plan**
4. Fill in the details:
   - **Plan Name**: Pro Monthly Subscription
   - **Billing Cycle**: Monthly
   - **Billing Amount**: Amount in paise (e.g., 200000 for ₹2000)
   - **Currency**: INR
5. Copy the Plan ID (format: `plan_xxxxxxxxxxxxx`)
6. Add it to your `.env` as `RAZORPAY_PLAN_ID`

#### Option B: Via API (Automatic)

If `RAZORPAY_PLAN_ID` is not set, the `/api/payment/razorpay/create-subscription` endpoint will automatically create a plan on the first subscription request. The plan ID will be logged in the console.

**⚠️ Note**: Add the logged plan ID to your `.env` file to avoid creating duplicate plans.

### 4. Configure Webhooks

Razorpay needs to send subscription events to your server.

1. Go to **Settings** → **Webhooks** in Razorpay Dashboard
2. Click **Create Webhook**
3. Add your webhook URL:
   ```
   https://yourdomain.com/api/payment/razorpay/webhook
   ```
4. Select the following events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.halted`
   - `subscription.paused`
   - `payment.failed`
5. Generate and copy the **Webhook Secret**
6. Add it to `.env` as `RAZORPAY_WEBHOOK_SECRET`

### 5. Update Middleware (if needed)

Ensure webhook endpoints are not blocked by authentication:

In `middleware.ts`, the webhook route should be publicly accessible:
```typescript
// Already configured - no changes needed
```

## Architecture

### File Structure

```
lib/
  razorpay.ts                    # Razorpay SDK client and helper functions

app/api/payment/
  provider/route.ts              # Returns active payment provider
  razorpay/
    create-subscription/route.ts # Creates Razorpay subscription
    webhook/route.ts             # Handles Razorpay webhook events

components/
  payment-button.tsx             # Unified payment button (auto-selects provider)
  razorpay-payment-modal.tsx     # Razorpay checkout UI
  cashfree-payment-button.tsx    # Existing Cashfree implementation

db/
  models.ts                      # Updated to support razorpay provider
  queries.ts                     # Updated to handle multi-provider

types/
  razorpay.d.ts                  # TypeScript definitions for Razorpay
```

### Payment Flow

#### 1. User Initiates Payment
- User clicks "Subscribe Now" on pricing page
- `PaymentButton` component fetches active provider from `/api/payment/provider`
- Opens appropriate modal (Razorpay or Cashfree)

#### 2. Create Subscription
- Client calls `/api/payment/razorpay/create-subscription`
- Server creates/fetches customer in Razorpay
- Server creates subscription linked to plan
- Returns subscription details to client

#### 3. Checkout
- Client loads Razorpay checkout.js script
- Opens Razorpay checkout modal with subscription_id
- User completes payment via UPI/Card/NetBanking

#### 4. Webhook Processing
- Razorpay sends `subscription.charged` webhook
- Server verifies signature using `RAZORPAY_WEBHOOK_SECRET`
- Records payment in database
- Activates 30-day Pro subscription for user

#### 5. Auto-Renewal
- Razorpay automatically charges customer monthly
- Each charge triggers `subscription.charged` webhook
- Server extends subscription by 30 days

### Database Schema Updates

#### User Model
```typescript
interface IUser {
  // ... existing fields
  subscriptionProvider?: "cashfree" | "razorpay" | "manual" | null;
  subscriptionId?: string;           // Razorpay subscription_id
  razorpayCustomerId?: string;       // Razorpay customer_id
}
```

#### Payment Model
```typescript
interface IPayment {
  // ... existing fields
  provider?: "cashfree" | "razorpay";
  subscriptionId?: string;           // Razorpay subscription_id
  paymentId?: string;                // Razorpay payment_id
  environment?: "production" | "sandbox" | "test";
}
```

## API Endpoints

### GET /api/payment/provider
Returns the active payment provider.

**Response:**
```json
{
  "provider": "razorpay"
}
```

### POST /api/payment/razorpay/create-subscription
Creates a new Razorpay subscription.

**Request:**
```json
{
  "customerName": "John Doe",
  "customerEmail": "john@example.com",
  "customerPhone": "9876543210"
}
```

**Response:**
```json
{
  "success": true,
  "subscriptionId": "sub_xxxxxxxxxxxxx",
  "razorpayKeyId": "rzp_test_xxxxx",
  "customerId": "cust_xxxxxxxxxxxxx",
  "amount": 200000,
  "currency": "INR",
  "planId": "plan_xxxxxxxxxxxxx",
  "environment": "test"
}
```

### POST /api/payment/razorpay/webhook
Handles Razorpay webhook events.

**Headers:**
```
x-razorpay-signature: <signature>
```

**Events Handled:**
- `subscription.charged` → Activates/extends Pro subscription
- `subscription.activated` → Logs activation
- `subscription.cancelled` → User cancelled, expires at period end
- `subscription.completed` → Subscription reached total_count
- `subscription.halted/paused` → Payment failures
- `payment.failed` → Records failed payment

## Testing

### Test Mode Setup

1. Set `RAZORPAY_ENVIRONMENT=test`
2. Use test API keys from Razorpay Dashboard
3. Use test cards:
   - **Success**: 4111 1111 1111 1111
   - **Failure**: 4111 1111 1111 1234
   - CVV: Any 3 digits
   - Expiry: Any future date

### Test Subscription Flow

1. Visit `/pricing` page
2. Click "Subscribe Now" on Pro plan
3. Fill in test customer details
4. Use test UPI: `success@razorpay` or test card
5. Complete payment
6. Check server logs for webhook events
7. Verify user is upgraded to Pro in database

### Webhook Testing

Use Razorpay's webhook testing tool:
1. Go to **Settings** → **Webhooks**
2. Click on your webhook
3. Use "Test Webhook" feature
4. Select event type and send test payload

Alternatively, use ngrok for local testing:
```bash
ngrok http 3000
# Update webhook URL to: https://xxxxx.ngrok.io/api/payment/razorpay/webhook
```

## Switching Payment Providers

To switch between Cashfree and Razorpay:

1. Update `.env`:
   ```bash
   PAYMENT_PROVIDER=razorpay  # or "cashfree"
   ```

2. Restart your Next.js server:
   ```bash
   pnpm dev
   ```

3. The `PaymentButton` component automatically renders the correct UI

**Note**: Both providers can coexist. Existing subscriptions continue to work regardless of the active provider.

## Migration from Cashfree to Razorpay

If you have existing Cashfree users:

1. **No immediate action needed** - Cashfree subscriptions are one-time payments
2. When users renew, they'll use the new provider (Razorpay)
3. User data remains intact:
   - `subscriptionProvider` field tracks which gateway was used
   - `currentPeriodEnd` determines when subscription expires

## Subscription Management

### Cancel Subscription

```typescript
import { cancelRazorpaySubscription } from "@/lib/razorpay";

// Cancel at end of current cycle (recommended)
await cancelRazorpaySubscription(subscriptionId, true);

// Cancel immediately
await cancelRazorpaySubscription(subscriptionId, false);
```

### Fetch Subscription Details

```typescript
import { fetchRazorpaySubscription } from "@/lib/razorpay";

const subscription = await fetchRazorpaySubscription(subscriptionId);
console.log(subscription.status); // active, cancelled, completed, etc.
```

## Common Issues & Troubleshooting

### Issue: "Webhook signature verification failed"
**Solution**: Ensure `RAZORPAY_WEBHOOK_SECRET` matches the secret in Razorpay Dashboard.

### Issue: "Plan not found"
**Solution**: Create a plan in Razorpay Dashboard and add the ID to `RAZORPAY_PLAN_ID` in `.env`.

### Issue: "Payment successful but subscription not activated"
**Solution**: 
- Check server logs for webhook errors
- Verify webhook URL is publicly accessible
- Ensure `RAZORPAY_WEBHOOK_SECRET` is configured

### Issue: "Razorpay checkout not loading"
**Solution**: Ensure the checkout script is loaded. Check browser console for errors.

### Issue: Duplicate plans being created
**Solution**: Set `RAZORPAY_PLAN_ID` in `.env` to reuse the same plan.

## Security Considerations

1. **Never expose secrets client-side**
   - Only `RAZORPAY_KEY_ID` (public key) is sent to client
   - `RAZORPAY_KEY_SECRET` stays server-side only

2. **Always verify webhook signatures**
   - Prevents malicious webhook requests
   - Implemented in `/api/payment/razorpay/webhook`

3. **Use HTTPS in production**
   - Required for webhook delivery
   - Protects payment data in transit

4. **Environment separation**
   - Use test keys in development
   - Switch to production keys only when ready
   - Never commit `.env` files

## Production Checklist

- [ ] Create production Razorpay account
- [ ] Generate production API keys
- [ ] Create production plan in Razorpay Dashboard
- [ ] Update `.env` with production credentials
- [ ] Set `RAZORPAY_ENVIRONMENT=production`
- [ ] Configure production webhook URL
- [ ] Test end-to-end flow in production mode
- [ ] Enable webhook logging and monitoring
- [ ] Set up payment failure alerts
- [ ] Configure subscription reminder emails (Razorpay dashboard)
- [ ] Verify tax compliance (GST/invoicing if required)

## Support & Resources

- **Razorpay Documentation**: https://razorpay.com/docs/
- **Razorpay API Reference**: https://razorpay.com/docs/api/
- **Razorpay Dashboard**: https://dashboard.razorpay.com/
- **Razorpay Support**: https://razorpay.com/support/

---

**Last Updated**: October 18, 2025
