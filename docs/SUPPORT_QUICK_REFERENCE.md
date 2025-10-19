# Support Team Quick Reference - Subscription Activation

## 🚨 User Reports: "I paid but don't have Pro access"

### Step 1: Get Information from User
- User's email address
- Payment ID (from confirmation email or success page URL)
  - Format: `pay_XXXXXXXXXX`
  - Or subscription ID: `sub_XXXXXXXXXX`

### Step 2: Check Current Status

```bash
curl "https://lucidity.chat/api/admin/activate-subscription?email=USER_EMAIL&admin_secret=SECRET"
```

Replace:
- `USER_EMAIL` with user's email
- `SECRET` with the `ADMIN_SECRET` from environment variables

**Expected Response:**
```json
{
  "success": true,
  "user": {
    "email": "user@example.com",
    "plan": "free" or "pro",
    "isPro": false or true,
    "currentPeriodEnd": "2025-11-19T00:00:00.000Z" or null
  }
}
```

### Step 3: Activate Subscription

**If you have Payment ID (preferred):**
```bash
curl -X POST https://lucidity.chat/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "USER_EMAIL",
    "paymentId": "pay_XXXXXXXXXX",
    "adminSecret": "SECRET"
  }'
```

**If you only have Subscription ID:**
```bash
curl -X POST https://lucidity.chat/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "USER_EMAIL",
    "subscriptionId": "sub_XXXXXXXXXX",
    "adminSecret": "SECRET"
  }'
```

**Emergency (no payment ID, manually verified):**
```bash
curl -X POST https://lucidity.chat/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "USER_EMAIL",
    "adminSecret": "SECRET",
    "skipVerification": true,
    "periodInDays": 30
  }'
```

### Step 4: Verify Success

**Success Response:**
```json
{
  "success": true,
  "message": "Successfully activated Pro subscription for user@example.com",
  "user": {
    "plan": "pro",
    "isPro": true,
    "currentPeriodEnd": "2025-11-19T00:00:00.000Z"
  }
}
```

✅ **Tell user:** "Your Pro subscription is now active! Please refresh your account page."

**Error Response:**
```json
{
  "error": "Payment pay_xyz status is authorized, not captured. Cannot activate."
}
```

❌ **Tell user:** "The payment hasn't been completed yet. Please check with your payment provider."

### Step 5: Document

Log in your support system:
- Date/Time of activation
- User email
- Payment ID
- Manual activation performed
- Reason: Missed webhook

---

## 🔍 Common Scenarios

### Scenario 1: Payment Successful but Not Activated
**Cause:** Webhook was missed
**Solution:** Use Step 3 with payment ID
**Prevention:** Check webhook logs, fix signature issues

### Scenario 2: User Shows "Free" but Claims They Paid
**Steps:**
1. Ask for payment confirmation email
2. Verify payment in Razorpay dashboard
3. If payment is "captured", activate using payment ID
4. If payment is "authorized" or "failed", ask user to retry

### Scenario 3: Renewal Didn't Extend Subscription
**Cause:** Webhook missed for renewal
**Solution:** Get latest payment ID from Razorpay, activate manually
**Result:** Subscription extends by 30 days from previous end date

### Scenario 4: User Paid Multiple Times Due to Errors
**Don't worry!** Each payment creates a separate extension.
**Action:** Activate each payment ID separately - they stack automatically

---

## 📋 Checklist for Manual Activation

- [ ] User's email confirmed
- [ ] Payment ID obtained (from user or Razorpay dashboard)
- [ ] Payment verified in Razorpay dashboard (status: captured)
- [ ] Current user status checked (Step 2)
- [ ] Activation command executed (Step 3)
- [ ] Success response received
- [ ] User notified to refresh their account page
- [ ] Incident logged in support system
- [ ] Tech team notified if multiple similar cases

---

## ⚡ Quick Commands (Copy-Paste)

### Check User Status
```bash
curl "https://lucidity.chat/api/admin/activate-subscription?email=REPLACE_EMAIL&admin_secret=REPLACE_SECRET"
```

### Activate with Payment ID
```bash
curl -X POST https://lucidity.chat/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{"email":"REPLACE_EMAIL","paymentId":"REPLACE_PAYMENT_ID","adminSecret":"REPLACE_SECRET"}'
```

### Emergency Activation (No Verification)
```bash
curl -X POST https://lucidity.chat/api/admin/activate-subscription \
  -H "Content-Type: application/json" \
  -d '{"email":"REPLACE_EMAIL","adminSecret":"REPLACE_SECRET","skipVerification":true,"periodInDays":30}'
```

---

## 🔐 Security Notes

1. **Never share `ADMIN_SECRET` publicly**
2. **Only use "skipVerification" when absolutely necessary**
3. **Always verify payment in Razorpay dashboard first**
4. **Log every manual activation for audit trail**

---

## 📞 When to Escalate to Engineering

Escalate if:
- Multiple users reporting the same issue in a short time
- Webhook signature errors appearing in logs
- Reconciliation job consistently activating users (means webhooks failing)
- Payment verified in Razorpay but activation fails with error

---

## 🛠️ Troubleshooting

### "Unauthorized" Error
- Check that `ADMIN_SECRET` is correct
- Verify secret matches production environment variable

### "User not found" Error
- Verify email spelling (case-sensitive in some systems)
- Check if user is registered in the database

### "Payment not captured" Error
- Payment is still pending or failed
- User needs to complete payment first
- Check Razorpay dashboard for payment status

### Activation Succeeds but User Still Shows Free Plan
- Ask user to hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Ask user to log out and log back in
- Check database directly to verify activation worked

---

## 📚 Additional Resources

- Full Documentation: `SUBSCRIPTION_RECONCILIATION.md`
- Webhook Troubleshooting: `WEBHOOK_TROUBLESHOOTING.md`
- Razorpay Dashboard: https://dashboard.razorpay.com

---

**Need Help?** Contact the engineering team with:
- User email
- Payment ID
- Error message received
- Steps already attempted
