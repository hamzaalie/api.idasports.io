# PayDunya IPN - Quick Setup Guide

## 🚀 Quick Start (5 Minutes)

### Step 1: Install Dependencies
```bash
cd central-backend
npm install
```

### Step 2: Configure Environment Variables

Edit `central-backend/.env` and add your PayDunya credentials:

```env
# PayDunya Configuration
PAYDUNYA_API_KEY=your_paydunya_master_key_here
PAYDUNYA_SECRET_KEY=your_paydunya_secret_key_here
```

**Where to get these:**
1. Log in to your PayDunya dashboard
2. Go to Settings → API Keys
3. Copy your **Master Key** → use as `PAYDUNYA_API_KEY`
4. Copy your **Secret Key** → use as `PAYDUNYA_SECRET_KEY`

### Step 3: Start the Server

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

### Step 4: Configure PayDunya Dashboard

**IMPORTANT:** Set your IPN URL in PayDunya dashboard:

1. Log in to PayDunya
2. Go to Settings → Webhooks/IPN
3. Enter IPN URL: `https://yourdomain.com/api/webhooks/paydunya/ipn`
4. Enable IPN notifications
5. Save

**For local testing with ngrok:**
```bash
# Install ngrok
npm install -g ngrok

# Start ngrok
ngrok http 3000

# Use the HTTPS URL in PayDunya:
# https://abc123.ngrok.io/api/webhooks/paydunya/ipn
```

### Step 5: Test the Integration

**Quick Test (Development Only):**
```bash
# Create a test payment first, then:
curl "http://localhost:3000/api/webhooks/test-paydunya-success?transaction_id=YOUR_TRANSACTION_ID"
```

**Real Test with PayDunya:**
1. Make a real payment through PayDunya
2. Watch server logs for:
   ```
   📨 PayDunya IPN received
   ✅ Signature verified
   ✅ API verification successful
   🎉 Payment completed & subscription activated!
   ```

---

## 🎯 What You Get

✅ **Automatic Payment Processing**
- Real-time notifications from PayDunya
- Payments processed even if user closes browser

✅ **Security Built-In**
- Signature verification
- API verification
- Amount validation
- Idempotency protection

✅ **Automatic Subscription Activation**
- Subscriptions activated ONLY after verified payment
- 30-day access granted automatically
- Email confirmation sent

✅ **Comprehensive Logging**
- Every step logged for debugging
- Audit trail for disputes
- Error tracking

---

## 📊 How It Works

```
User Pays → PayDunya
         ↓
PayDunya sends IPN → Your Server (/api/webhooks/paydunya/ipn)
         ↓
Server verifies payment (signature + API call)
         ↓
Database updated (payment status)
         ↓
Subscription activated (30 days access)
         ↓
User gets access to M3 platform
         ↓
Email confirmation sent
         ↓
Response 200 OK → PayDunya
```

---

## 🔍 Monitoring

### Check Payment Status
```sql
SELECT * FROM payments 
WHERE transaction_id = 'TXN-123456' 
ORDER BY created_at DESC;
```

### Check Subscription Status
```sql
SELECT * FROM subscriptions 
WHERE user_id = 'user-uuid-here' 
ORDER BY created_at DESC;
```

### Check Audit Logs
```sql
SELECT * FROM audit_logs 
WHERE action LIKE '%paydunya%' 
ORDER BY created_at DESC 
LIMIT 10;
```

---

## 🚨 Common Issues

### Issue: "Payment not found"
**Solution:** Ensure payment was created before PayDunya calls the IPN:
1. User must click "Pay" on your site first
2. Backend creates PENDING payment
3. Then redirect to PayDunya

### Issue: "Signature verification failed"
**Solution:** Check your `PAYDUNYA_SECRET_KEY` in `.env` matches PayDunya dashboard

### Issue: "IPN not received"
**Solution:** 
- Verify IPN URL in PayDunya dashboard
- Use HTTPS in production
- Use ngrok for local testing
- Check firewall allows incoming POST

---

## 📞 Need Help?

1. Check server logs (terminal output)
2. Check database audit_logs table
3. Read full documentation: `PAYDUNYA_IPN_IMPLEMENTATION.md`
4. Check PayDunya docs: https://paydunya.com/developers

---

## ✅ Production Checklist

Before going live:
- [ ] PayDunya credentials in `.env`
- [ ] IPN URL configured in PayDunya dashboard
- [ ] Server running with HTTPS
- [ ] Test payment successful
- [ ] Subscription activated after test
- [ ] Remove/disable test endpoints

---

**Ready in 5 minutes! 🚀**
