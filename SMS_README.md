# 📱 SMS Integration - Quick Setup

## ⚡ 5-Minute Setup

### Step 1: Get Twilio Credentials (2 min)

1. Go to: **https://console.twilio.com/**
2. Copy your **Account SID**
3. Click eye icon to reveal **Auth Token**
4. Go to **Phone Numbers** → **Buy a number** → Select one → **Buy** (FREE!)

### Step 2: Configure .env (1 min)

Add these to `apps/api/.env`:

```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your32characterauthtoken123456
TWILIO_PHONE_NUMBER=+12345678900
```

### Step 3: Restart API (1 min)

```bash
cd apps/api
npm run dev
```

### Step 4: Test SMS (1 min)

```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"phone": "+12345678900"}'
```

✅ **Done! Check your phone for the test message.**

---

## 📱 What Gets Sent Automatically?

Your system now sends SMS for:

- ⏰ **1 hour before deadline** - "Submission deadline in 1 hour!"
- 🏆 **Winner announcements** - "Congratulations! You won!"
- 🚨 **Emergency alerts** - "Venue changed to Building B"
- ✅ **Verification codes** - "Your code is: 123456"

---

## 💰 Pricing

| Account | SMS Included | Cost per SMS |
|---------|--------------|--------------|
| Trial (30 days) | 100 FREE | $0 |
| Paid (USA) | Pay as you go | $0.0079 |

**Example:** 500 participants × 3 SMS = **$11.85 total**

---

## 📚 Full Documentation

- **Quick Reference:** `SMS_QUICK_REFERENCE.md`
- **Complete Guide:** `TWILIO_SMS_COMPLETE_GUIDE.md`
- **Feature Summary:** `SMS_INTEGRATION_SUMMARY.md`

---

## 🆘 Troubleshooting

### SMS not sending?

**Trial Account:** You need to verify recipient numbers first!

1. Go to: Phone Numbers → Verified Caller IDs
2. Add your test phone number
3. Verify with code sent to your phone
4. Try sending SMS again

**Or upgrade to paid account** (no restrictions, still cheap!)

### Wrong phone format?

Use E.164 format:
- ✅ `+12345678900` (USA)
- ❌ `234-567-8900` (wrong)

---

## 🎯 API Endpoints

```bash
# Send test SMS
POST /api/v1/participant-automation/test-sms
Body: { "phone": "+12345678900" }

# Enable SMS for user
POST /api/v1/participant-automation/users/{userId}/sms-preferences
Body: { "enableSMS": true, "phone": "+12345678900" }

# Disable SMS for user
POST /api/v1/participant-automation/users/{userId}/sms-preferences
Body: { "enableSMS": false }
```

---

## ✅ Setup Checklist

- [ ] Twilio account created
- [ ] Phone number purchased (FREE!)
- [ ] Credentials in .env
- [ ] API restarted
- [ ] Test SMS sent
- [ ] SMS received ✅

---

**Status:** ✅ Ready to use!  
**Cost:** ~$0.008 per SMS after trial  
**Delivery:** 30 seconds average  

📱 **Professional SMS notifications for your hackathons!**
