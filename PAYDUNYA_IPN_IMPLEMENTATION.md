# PayDunya IPN (Instant Payment Notification) Implementation

## ✅ Implementation Complete

This document describes the complete PayDunya IPN system that has been implemented in the Central Backend.

---

## 🎯 What Has Been Implemented

### 1️⃣ **Real-Time Payment Notifications**
- ✅ Public IPN endpoint: `POST /api/webhooks/paydunya/ipn`
- ✅ Accepts POST requests with JSON payload
- ✅ Works independently of browser/frontend
- ✅ Processes payments even if user closes browser

### 2️⃣ **Automatic Database Status Updates**
- ✅ Payment status automatically updated in database
- ✅ Status mapping: PayDunya → Internal
  - `completed` → `COMPLETED`
  - `failed` → `FAILED`
  - `cancelled` → `CANCELLED`
  - `pending` → `PENDING`
- ✅ Transaction records updated with verification data

### 3️⃣ **Server-Side Payment Verification (CRITICAL)**
- ✅ **Signature verification** using HMAC SHA256
- ✅ **API verification** - calls PayDunya API to confirm payment
- ✅ **Amount validation** - ensures payment amount matches
- ✅ **Currency validation** - validates currency code
- ✅ NO trust in browser redirects or frontend

### 4️⃣ **Subscription Activation**
- ✅ Subscription activated ONLY after successful verification
- ✅ Sets start date and expiry date (30 days)
- ✅ Grants access to M3 platform
- ✅ Sends confirmation email to user
- ✅ Decoupled from frontend

### 5️⃣ **Proper Response to PayDunya**
- ✅ Returns `HTTP 200 OK` on success
- ✅ Returns JSON response: `{ "success": true }`
- ✅ Tells PayDunya notification was received

### 6️⃣ **Comprehensive Logging**
- ✅ Logs every IPN request received
- ✅ Logs signature verification results
- ✅ Logs API verification results
- ✅ Logs database update results
- ✅ Logs subscription activation
- ✅ Logs errors with full stack traces
- ✅ Audit trail for all payment events

### 7️⃣ **Security Measures**
- ✅ POST-only endpoint (GET requests rejected)
- ✅ Webhook signature verification
- ✅ API keys never exposed to frontend
- ✅ Amount & currency validation
- ✅ **Idempotency** - prevents duplicate processing
- ✅ Prevents re-processing of completed payments

---

## 📁 Files Created/Modified

### New Files
1. **`src/common/utils/paydunya.helper.ts`**
   - PayDunya signature verification
   - API transaction verification
   - Status mapping
   - Amount/currency validation
   - Helper utilities

2. **`src/webhooks/dto/paydunya-webhook.dto.ts`**
   - Type-safe payload structure
   - Validation rules
   - API documentation

3. **`PAYDUNYA_IPN_IMPLEMENTATION.md`** (this file)
   - Complete documentation
   - Usage instructions
   - Testing guide

### Modified Files
1. **`src/webhooks/webhooks.controller.ts`**
   - Added `handlePayDunyaIPN()` endpoint
   - Added test endpoint `test-paydunya-success`
   - Comprehensive error handling

2. **`src/payments/payments.service.ts`**
   - Added `processPayDunyaPayment()` method
   - Added `cancelPayment()` method
   - Enhanced idempotency checks

3. **`src/payments/entities/payment.entity.ts`**
   - Added `CANCELLED` status to enum

4. **`.env`**
   - Added PayDunya configuration variables

5. **`package.json`**
   - Added `axios` dependency for API calls

---

## 🔧 Configuration Required

### Environment Variables (.env)

Add these to your `.env` file:

```env
# PayDunya (Add your credentials here)
PAYDUNYA_API_KEY=your_paydunya_master_key_here
PAYDUNYA_SECRET_KEY=your_paydunya_secret_key_here
```

**Where to get these:**
1. Log in to your PayDunya dashboard
2. Go to Settings → API Keys
3. Copy your **Master Key** (API Key)
4. Copy your **Secret Key** (for webhook signature)

---

## 🚀 How to Deploy

### 1. Install Dependencies
```bash
cd central-backend
npm install
```

### 2. Update Environment Variables
Edit `.env` file with your PayDunya credentials:
```env
PAYDUNYA_API_KEY=your_actual_master_key
PAYDUNYA_SECRET_KEY=your_actual_secret_key
```

### 3. Run Database Migrations (if needed)
```bash
npm run migration:run
```

### 4. Start the Server
```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

### 5. Configure PayDunya Dashboard

**CRITICAL:** You must configure the IPN URL in PayDunya dashboard:

1. Log in to PayDunya
2. Go to Settings → Webhooks/IPN
3. Set IPN URL to: `https://yourdomain.com/api/webhooks/paydunya/ipn`
   - Replace `yourdomain.com` with your actual domain
   - Use HTTPS (required for production)
4. Enable IPN notifications
5. Save settings

**Local Testing URL:**
```
https://your-ngrok-url.ngrok.io/api/webhooks/paydunya/ipn
```

---

## 🧪 Testing the IPN System

### Method 1: Test Endpoint (Development Only)

Use the built-in test endpoint:

```bash
# Replace transaction_id with actual ID from database
curl "http://localhost:3000/api/webhooks/test-paydunya-success?transaction_id=TXN-1234567890-abcd"
```

This simulates a successful payment notification.

### Method 2: Use ngrok for Real PayDunya Testing

1. **Install ngrok:**
   ```bash
   npm install -g ngrok
   ```

2. **Start your backend:**
   ```bash
   npm run start:dev
   ```

3. **Start ngrok:**
   ```bash
   ngrok http 3000
   ```

4. **Copy the HTTPS URL** (e.g., `https://abc123.ngrok.io`)

5. **Configure in PayDunya:**
   - IPN URL: `https://abc123.ngrok.io/api/webhooks/paydunya/ipn`

6. **Make a real payment** using PayDunya

7. **Check logs:**
   ```bash
   # Watch the terminal for log output
   # You'll see:
   # 📨 PayDunya IPN received
   # ✅ Signature verified
   # 🔍 Verifying with PayDunya API...
   # ✅ API verification successful
   # 🎉 Payment completed & subscription activated!
   ```

### Method 3: Manual IPN Test with Postman/cURL

```bash
curl -X POST http://localhost:3000/api/webhooks/paydunya/ipn \
  -H "Content-Type: application/json" \
  -H "x-paydunya-signature: test-signature" \
  -d '{
    "transaction_id": "TXN-1234567890-abcd",
    "invoice_token": "test-invoice-token",
    "status": "completed",
    "amount": 32740,
    "currency": "XOF",
    "customer_email": "user@example.com"
  }'
```

---

## 🔍 Monitoring and Debugging

### Check Logs

All IPN activity is logged in the terminal:

```
📨 PayDunya IPN received
✅ Signature verified
💳 Payment found: uuid-123 | Status: pending
🔍 Verifying with PayDunya API...
✅ API verification successful: completed
✅ Amount & currency validated
📊 Status mapping: completed → completed
✅ Processing successful payment...
🎉 Payment completed & subscription activated!
✅ IPN processed successfully in 342ms
```

### Check Database

```sql
-- Check payment status
SELECT 
  id, 
  transaction_id, 
  status, 
  amount, 
  completed_at, 
  subscription_id
FROM payments 
WHERE transaction_id = 'TXN-1234567890-abcd';

-- Check subscription status
SELECT 
  id, 
  user_id, 
  status, 
  starts_at, 
  expires_at
FROM subscriptions 
WHERE user_id = 'user-uuid-here';

-- Check audit logs
SELECT 
  action, 
  metadata, 
  created_at
FROM audit_logs 
WHERE action LIKE '%paydunya%'
ORDER BY created_at DESC
LIMIT 10;
```

### Check Audit Logs

The system creates audit log entries for:
- `paydunya_ipn_received` - IPN received
- `paydunya_signature_invalid` - Invalid signature
- `paydunya_payment_not_found` - Payment not in DB
- `paydunya_duplicate_ipn` - Duplicate notification
- `paydunya_verification_failed` - API verification failed
- `paydunya_amount_mismatch` - Amount/currency mismatch
- `paydunya_payment_completed` - Payment successful
- `paydunya_payment_failed` - Payment failed
- `paydunya_payment_cancelled` - Payment cancelled
- `paydunya_ipn_processed` - Processing complete
- `paydunya_ipn_error` - Error occurred

---

## 🔐 Security Features

### 1. Signature Verification
- HMAC SHA256 signature validation
- Prevents unauthorized webhook calls
- Uses timing-safe comparison

### 2. API Verification
- Calls PayDunya API to confirm payment
- Double verification for critical payments
- Timeout protection (10 seconds)

### 3. Idempotency
- Prevents duplicate processing
- Checks payment status before processing
- Safe to receive same IPN multiple times

### 4. Amount Validation
- Validates payment amount matches database
- 1% tolerance for currency conversion
- Validates currency code

### 5. Rate Limiting
- Already configured in app (100 req/min)
- Prevents abuse

### 6. Error Handling
- Graceful error handling
- Logs all errors
- Returns proper HTTP codes

---

## 📊 Complete Payment Flow

```
1. User initiates payment
   └─> POST /api/payments/initiate
       └─> Creates PENDING payment in DB
       └─> Returns payment config to frontend

2. Frontend redirects to PayDunya
   └─> User completes payment on PayDunya

3. PayDunya sends IPN to backend
   └─> POST /api/webhooks/paydunya/ipn
       
4. Backend receives IPN
   ├─> ✅ Verify signature
   ├─> ✅ Find payment in DB
   ├─> ✅ Check idempotency
   ├─> ✅ Verify with PayDunya API
   ├─> ✅ Validate amount & currency
   ├─> ✅ Update payment status
   ├─> ✅ Activate subscription
   ├─> ✅ Generate invoice
   ├─> ✅ Send email
   ├─> ✅ Log everything
   └─> ✅ Return 200 OK

5. Subscription is now ACTIVE
   └─> User has access to M3 platform
```

---

## 🚨 Troubleshooting

### Issue: IPN not received

**Solutions:**
1. Check PayDunya dashboard → Webhooks/IPN settings
2. Ensure IPN URL is correct
3. Check firewall/security groups allow incoming POST
4. Use ngrok for local testing
5. Check server logs for incoming requests

### Issue: Signature verification fails

**Solutions:**
1. Verify `PAYDUNYA_SECRET_KEY` in `.env` is correct
2. Check PayDunya dashboard for correct secret key
3. Ensure payload is not modified in transit
4. Check logs for actual vs expected signature

### Issue: API verification fails

**Solutions:**
1. Verify `PAYDUNYA_API_KEY` (Master Key) in `.env`
2. Check internet connectivity from server
3. Check PayDunya API status
4. Verify invoice_token is correct
5. Check logs for API error message

### Issue: Payment not found

**Solutions:**
1. Ensure payment was created with correct transaction_id
2. Check database for payment record
3. Verify transaction_id matches between frontend and IPN
4. Check payment initiation logs

### Issue: Subscription not activated

**Solutions:**
1. Check if payment status is COMPLETED
2. Check subscription table for user
3. Check logs for subscription activation
4. Verify user_id is correct in payment record

---

## 📞 Support

For issues or questions:
1. Check logs first (terminal output)
2. Check audit_logs table in database
3. Review this documentation
4. Check PayDunya documentation: https://paydunya.com/developers

---

## ✅ Checklist for Production

Before going live, ensure:

- [ ] PayDunya API credentials configured in `.env`
- [ ] IPN URL configured in PayDunya dashboard
- [ ] Server accessible via HTTPS
- [ ] Database migrations run
- [ ] `npm install` completed
- [ ] Server started and running
- [ ] Test endpoint removed or disabled
- [ ] Logging configured properly
- [ ] Email service configured
- [ ] Firewall allows incoming POST to IPN endpoint
- [ ] SSL certificate valid
- [ ] Test payment completed successfully
- [ ] Subscription activated after test payment
- [ ] Audit logs working
- [ ] Error notifications configured

---

## 📝 Summary

This implementation provides a **production-ready PayDunya IPN system** with:

✅ Real-time notifications
✅ Server-side verification
✅ Automatic subscription activation
✅ Comprehensive logging
✅ Security measures
✅ Idempotency
✅ Error handling
✅ Testing capabilities

The system is **secure, reliable, and fully automated**.

---

**Last Updated:** December 24, 2025
**Status:** ✅ Ready for Production
