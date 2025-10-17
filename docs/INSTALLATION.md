# Installation Instructions

## Quick Start

To complete the Razorpay integration, follow these steps:

### 1. Install the Razorpay Package

```bash
pnpm add razorpay
```

This will install the Razorpay Node.js SDK which is required for server-side operations.

### 2. Update Environment Variables

Create or update your `.env.local` file with the following:

```bash
# Payment Provider Selection (choose one)
PAYMENT_PROVIDER=razorpay  # Use "cashfree" to switch back

# Razorpay Credentials (get from https://dashboard.razorpay.com/)
RAZORPAY_KEY_ID=your_key_id_here
RAZORPAY_KEY_SECRET=your_key_secret_here
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_here
RAZORPAY_ENVIRONMENT=test  # Use "production" for live mode

# IMPORTANT: Create this first in Razorpay Dashboard
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxxx
```

### 3. Create a Razorpay Plan

**Via Razorpay Dashboard (Recommended):**

1. Log in to https://dashboard.razorpay.com/
2. Go to **Subscriptions** → **Plans**
3. Click **Create Plan**
4. Fill in:
   - Name: "Pro Monthly Subscription"
   - Billing Cycle: Monthly
   - Amount: 200000 (for ₹2000 - amount in paise)
   - Currency: INR
5. Copy the Plan ID (format: `plan_xxxxxxxxxxxxx`)
6. Add it to `.env.local` as `RAZORPAY_PLAN_ID`

### 4. Configure Webhook

1. In Razorpay Dashboard, go to **Settings** → **Webhooks**
2. Click **Create Webhook**
3. Add your webhook URL (replace with your domain):
   ```
   https://yourdomain.com/api/payment/razorpay/webhook
   ```
4. Select these events:
   - `subscription.activated`
   - `subscription.charged`
   - `subscription.cancelled`
   - `subscription.completed`
   - `subscription.halted`
   - `subscription.paused`
   - `payment.failed`
5. Copy the **Webhook Secret** and add to `.env.local`

### 5. Run Database Migrations (Optional)

If you want to ensure indexes are up to date:

```bash
pnpm migrate-indexes
```

### 6. Start the Development Server

```bash
pnpm dev
```

### 7. Test the Integration

1. Visit http://localhost:3000/pricing
2. Click "Subscribe Now" on the Pro plan
3. Fill in test customer details
4. Use Razorpay test payment methods:
   - **UPI**: `success@razorpay`
   - **Card**: 4111 1111 1111 1111 (any CVV, future expiry)
5. Complete the payment
6. Check your server logs for webhook events
7. Verify the user is upgraded to Pro in your database

## Switching Between Providers

To switch between Razorpay and Cashfree:

```bash
# In .env.local
PAYMENT_PROVIDER=razorpay  # or "cashfree"
```

Then restart your development server.

## Troubleshooting

### "razorpay" module not found
Run: `pnpm add razorpay`

### Webhook not receiving events (local development)
Use ngrok to expose your local server:
```bash
ngrok http 3000
# Update webhook URL in Razorpay Dashboard to ngrok URL
```

### Type errors in razorpay-payment-modal.tsx
The `Window` interface is defined in `types/razorpay.d.ts`. Make sure TypeScript is recognizing the types directory.

### Plan ID not found
Create a plan in Razorpay Dashboard and add the ID to `.env.local`

## Next Steps

1. Review `/docs/RAZORPAY_INTEGRATION.md` for complete documentation
2. Test the full payment flow
3. Verify webhooks are working correctly
4. When ready for production:
   - Switch to production API keys
   - Set `RAZORPAY_ENVIRONMENT=production`
   - Create a production plan
   - Update webhook URL to production domain

## Support

- **Documentation**: See `/docs/RAZORPAY_INTEGRATION.md`
- **Razorpay Docs**: https://razorpay.com/docs/
- **Razorpay Dashboard**: https://dashboard.razorpay.com/
- **Razorpay Support**: https://razorpay.com/support/

---

**Ready to test!** 🚀
