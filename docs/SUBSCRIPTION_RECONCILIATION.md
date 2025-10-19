# Subscription Reconciliation & Manual Activation

This document explains how to handle missed webhooks and manually activate subscriptions when needed.

## Problem: What If We Miss a Webhook?

Webhooks can be missed for several reasons:
- Server downtime during deployment
- Network issues
- Webhook signature mismatch (incorrect `RAZORPAY_WEBHOOK_SECRET`)
- Database connection failures
- Code errors during webhook processing

**Impact:** User pays successfully but never gets Pro access (or renewal doesn't extend subscription).

## Solution: Two-Tier Recovery System

We've implemented a two-tier system to handle missed webhooks:

### 1. **Automatic Reconciliation** (Cron Job)
Runs daily to automatically detect and fix missed webhooks.

### 2. **Manual Activation** (Support Endpoint)
Allows support team to immediately activate subscriptions when users report issues.

---

## 1. Automatic Reconciliation Cron Job

### How It Works

The reconciliation job:
1. Fetches all successful Razorpay payments from the last 7 days
2. Checks if each payment exists in our database
3. If payment is successful but not recorded → records it and activates the user
4. Logs all actions for audit trail

### Setup Instructions

#### Step 1: Add Environment Variables

Add to your `.env.local` and production environment:

```bash
# Generate a random secret (e.g., using openssl rand -base64 32)
CRON_SECRET=your-random-secret-here
```

#### Step 2: Test Manually

Test the endpoint manually first:

```bash
# Replace YOUR_SECRET with your CRON_SECRET
curl "http://localhost:3000/api/cron/reconcile-subscriptions?cron_secret=YOUR_SECRET"
```

Expected response:
```json
{
  "success": true,
  "message": "Reconciliation completed",
  "stats": {
    "subscriptionsChecked": 0,
    "paymentsFound": 5,
    "paymentsProcessed": 2,
    "paymentsSkipped": 3,
    "errors": [],
    "activatedUsers": ["user1@example.com", "user2@example.com"]
  },
  "duration": 1234
}
```

#### Step 3: Set Up Automated Cron Job

**Option A: Vercel Cron (Recommended for Vercel deployments)**

Create `vercel.json` in your project root:

```json
{
  "crons": [
    {
      "path": "/api/cron/reconcile-subscriptions?cron_secret=YOUR_CRON_SECRET",
      "schedule": "0 2 * * *"
    }
  ]
}
```

This runs daily at 2 AM UTC.

**Option B: GitHub Actions (For any hosting)**

Create `.github/workflows/reconcile-subscriptions.yml`:

```yaml
name: Reconcile Subscriptions

on:
  schedule:
    # Runs daily at 2 AM UTC
    - cron: '0 2 * * *'
  workflow_dispatch: # Allow manual trigger

jobs:
  reconcile:
    runs-on: ubuntu-latest
    steps:
      - name: Call Reconciliation Endpoint
        run: |
          curl -f "https://your-domain.com/api/cron/reconcile-subscriptions?cron_secret=${{ secrets.CRON_SECRET }}"
```

Add `CRON_SECRET` to your GitHub repository secrets.

**Option C: External Cron Service**

Use services like:
- [cron-job.org](https://cron-job.org)
- [EasyCron](https://www.easycron.com)
- AWS CloudWatch Events

Configure them to call:
```
GET https://your-domain.com/api/cron/reconcile-subscriptions?cron_secret=YOUR_SECRET
```

### Monitoring

The cron job logs all actions to console. Set up log monitoring in your production environment:

- **Vercel**: Check deployment logs
- **Other platforms**: Set up log aggregation (e.g., Datadog, LogRocket)

Look for:
- `[Reconciliation] 🚨 MISSED WEBHOOK DETECTED` - Indicates a missed webhook was found
- `[Reconciliation] ✅ Successfully activated` - User was activated
- `stats.activatedUsers` - List of users activated in this run

---

## 2. Manual Activation Endpoint (Support Team)

### When to Use

- User reports: "I paid but don't have Pro access"
- Urgent activation needed (can't wait for daily cron)
- Special cases requiring immediate attention

### Setup Instructions

#### Step 1: Add Admin Secret

Add to your `.env.local` and production environment:

```bash
# Generate a random secret (e.g., using openssl rand -base64 32)
ADMIN_SECRET=your-admin-secret-here
```

**Security Note:** Keep this secret secure! It allows activation of any user.

### How to Use

#### Method 1: With Payment ID (Recommended)

Use when you have the Razorpay payment ID (e.g., from user's email or payment success page):

```bash
curl -X POST https://your-domain.com/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "paymentId": "pay_RVJxIdaCWQBAEj",
    "adminSecret": "your-admin-secret"
  }'
```

This will:
1. ✅ Verify the payment exists in Razorpay
2. ✅ Verify the payment status is "captured"
3. ✅ Record the payment in your database
4. ✅ Activate Pro subscription for 30 days

#### Method 2: With Subscription ID

Use when you have the subscription ID:

```bash
curl -X POST https://your-domain.com/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "subscriptionId": "sub_RVJx6AgSyyOj0V",
    "adminSecret": "your-admin-secret"
  }'
```

#### Method 3: Skip Verification (Emergency Only)

Use ONLY for emergency cases where you manually verified payment outside the system:

```bash
curl -X POST https://your-domain.com/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "adminSecret": "your-admin-secret",
    "skipVerification": true,
    "periodInDays": 30
  }'
```

⚠️ **Warning:** This activates the user WITHOUT verifying payment. Use only when absolutely necessary.

#### Method 4: Check User Status (Read-Only)

Check a user's current subscription status:

```bash
curl "https://your-domain.com/api/admin/activate-subscription?email=user@example.com&admin_secret=your-admin-secret"
```

Response:
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "plan": "pro",
    "isPro": true,
    "currentPeriodEnd": "2025-11-19T00:00:00.000Z",
    "subscriptionStatus": "active",
    "subscriptionProvider": "razorpay",
    "proSince": "2025-10-19T00:00:00.000Z"
  }
}
```

### Response Examples

**Success:**
```json
{
  "success": true,
  "message": "Successfully activated Pro subscription for user@example.com",
  "user": {
    "email": "user@example.com",
    "plan": "pro",
    "isPro": true,
    "currentPeriodEnd": "2025-11-19T00:00:00.000Z",
    "subscriptionStatus": "active",
    "subscriptionProvider": "razorpay"
  },
  "activationDetails": {
    "email": "user@example.com",
    "activatedBy": "admin",
    "activatedAt": "2025-10-19T10:30:00.000Z",
    "paymentVerified": true,
    "paymentRecorded": true,
    "amount": 2000,
    "currency": "INR"
  }
}
```

**Error - Payment Not Captured:**
```json
{
  "error": "Payment pay_xyz123 status is authorized, not captured. Cannot activate.",
  "payment": {
    "id": "pay_xyz123",
    "status": "authorized",
    "amount": 2000
  }
}
```

**Error - User Not Found:**
```json
{
  "error": "User not found: user@example.com"
}
```

---

## Support Team Workflow

### Scenario: User Reports "I paid but don't have Pro access"

1. **Verify the user and payment**
   - Get user's email
   - Get payment ID from user (from confirmation email or success page URL)
   - Or get subscription ID from Razorpay dashboard

2. **Check current status**
   ```bash
   curl "https://your-domain.com/api/admin/activate-subscription?email=user@example.com&admin_secret=SECRET"
   ```

3. **If user is NOT Pro, activate with payment verification**
   ```bash
   curl -X POST https://your-domain.com/api/admin/activate-subscription \
     -H "Content-Type: application/json" \
     -d '{
       "email": "user@example.com",
       "paymentId": "pay_RVJxIdaCWQBAEj",
       "adminSecret": "SECRET"
     }'
   ```

4. **Confirm activation**
   - Check the response for `"success": true`
   - Ask user to refresh their account page
   - Verify they now see "Pro Plan" status

5. **Document the incident**
   - Log the case in your support system
   - Note: Manual activation performed, investigate why webhook was missed

---

## Security Best Practices

### 1. Protect Your Secrets

- ✅ Use strong random secrets (32+ characters)
- ✅ Store in environment variables, never in code
- ✅ Different secrets for staging and production
- ✅ Rotate secrets periodically

### 2. Limit Access

- ✅ Only share `ADMIN_SECRET` with support team leads
- ✅ Use authenticated requests when possible (session-based)
- ✅ Log all manual activations for audit trail

### 3. Monitor Usage

- ✅ Set up alerts for manual activations
- ✅ Review logs weekly to detect patterns
- ✅ If many manual activations needed → investigate webhook issues

---

## Troubleshooting

### Reconciliation Job Not Finding Payments

**Possible causes:**
1. Payments are older than 7 days
   - **Fix:** Increase the date range in the reconciliation code
2. `CRON_SECRET` mismatch
   - **Fix:** Verify secret matches between code and cron job
3. Razorpay API credentials incorrect
   - **Fix:** Check `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`

### Manual Activation Fails with "Unauthorized"

**Possible causes:**
1. `ADMIN_SECRET` not set in environment
2. Secret mismatch between request and environment variable
3. Session expired (if using session-based auth)

**Fix:** Double-check your `.env.local` and ensure secret is correct

### Payment Verified but Activation Failed

**Possible causes:**
1. User doesn't exist in database
2. Database connection issue
3. Email mismatch (different email in payment vs. user account)

**Fix:**
- Verify user exists: Check MongoDB for the email
- Check logs for detailed error messages
- Use correct email that matches user's account

---

## Monitoring & Alerts

### Set Up Alerts For:

1. **Reconciliation job failures**
   - Alert if job returns `success: false`
   - Alert if `stats.errors` is not empty

2. **Manual activations**
   - Alert when `/api/admin/activate-subscription` is called
   - Track frequency (high frequency = systemic webhook issue)

3. **Webhook failures**
   - Alert when webhook returns 401 or 500
   - Track in `/api/payment/razorpay/webhook`

### Metrics to Track:

- Number of manual activations per week
- Number of users activated by reconciliation job
- Webhook success rate
- Time between payment and activation

---

## Testing

### Test the Reconciliation Job

```bash
# Run manually and check output
curl "http://localhost:3000/api/cron/reconcile-subscriptions?cron_secret=YOUR_SECRET" | jq
```

Expected: Should find and process any missed payments from last 7 days

### Test Manual Activation

1. Create a test subscription in Razorpay (test mode)
2. Note the payment ID
3. Manually activate:
```bash
curl -X POST http://localhost:3000/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "paymentId": "pay_test123",
    "adminSecret": "your-secret"
  }'
```
4. Verify user has Pro access in `/account` page

---

## FAQ

**Q: How often should the reconciliation job run?**
A: Daily is recommended. For critical apps, run hourly.

**Q: Will the reconciliation job reprocess already-activated users?**
A: No, it checks if payment already exists and skips if processed.

**Q: Can I activate a user for more than 30 days?**
A: Yes, use `periodInDays` parameter in manual activation:
```json
{
  "email": "user@example.com",
  "adminSecret": "secret",
  "periodInDays": 60,
  "skipVerification": true
}
```

**Q: What if user paid multiple times due to webhook issues?**
A: Each payment creates a separate extension. The system extends from the current `currentPeriodEnd`, so no time is lost.

**Q: How do I know if webhooks are failing?**
A: Check logs for `[Razorpay Webhook] Invalid signature` or monitor the reconciliation job's `activatedUsers` count. If it's consistently non-zero, webhooks are failing.

---

## Next Steps

1. ✅ Add `CRON_SECRET` and `ADMIN_SECRET` to your environment
2. ✅ Test both endpoints manually
3. ✅ Set up automated cron job (Vercel Cron or GitHub Actions)
4. ✅ Document the process for your support team
5. ✅ Set up monitoring and alerts
6. ✅ Fix the webhook signature issue (primary root cause)

**Remember:** These tools are safety nets. The primary goal is to fix the webhook signature issue so webhooks work reliably!
