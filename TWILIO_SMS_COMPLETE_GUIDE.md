# 📱 Complete Twilio SMS Integration Guide

## 🎉 Your SMS System is Ready!

Your Twilio account is active with **100 FREE SMS credits**! Let's get SMS notifications working in 10 minutes.

---

## 📋 Quick Start Checklist

- [ ] **Step 1:** Get Twilio credentials from console (2 min)
- [ ] **Step 2:** Buy a free Twilio phone number (3 min)
- [ ] **Step 3:** Add credentials to `.env` file (1 min)
- [ ] **Step 4:** Restart API server (1 min)
- [ ] **Step 5:** Send test SMS to your phone (2 min)
- [ ] **Step 6:** Configure participant SMS preferences (1 min)

**Total Time: ~10 minutes** ⏱️

---

## 🚀 Step 1: Get Your Twilio Credentials (2 minutes)

### 1.1 Open Your Twilio Console

Go to: **https://console.twilio.com/**

You should see your dashboard with:
- Account SID
- Auth Token (hidden)
- 100 Free SMS credits remaining
- 30 days trial active

### 1.2 Copy Your Account SID

**Location:** Top of the dashboard under "Account Info"

```
Account SID: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Copy this value!** ✂️

### 1.3 Reveal and Copy Your Auth Token

1. Click the **eye icon** 👁️ next to "Auth Token"
2. It will reveal a 32-character string
3. **Copy this value!** ✂️

```
Auth Token: your32characterauthtoken123456
```

⚠️ **Keep this secret!** Never share your Auth Token publicly.

---

## 📞 Step 2: Get Your FREE Twilio Phone Number (3 minutes)

### 2.1 Navigate to Phone Numbers

In your Twilio Console:

1. Click **"Phone Numbers"** in the left sidebar
2. Click **"Manage"** → **"Buy a number"**

### 2.2 Choose Your Country and Capabilities

1. **Country:** Select your country (USA recommended for best pricing)
2. **Capabilities:** Make sure **"SMS"** is checked ✅
3. **Optional:** You can also check "Voice" and "MMS" if you want

### 2.3 Search and Buy a Number

1. Click **"Search"**
2. Browse available numbers (all FREE with trial!)
3. Find a number you like
4. Click **"Buy"** next to that number
5. Confirm purchase (uses $0 of your trial credit for the number itself)

### 2.4 Copy Your New Phone Number

After purchase, you'll see your number:

```
+1 234 567 8900
```

**Copy this in E.164 format (no spaces or dashes):**

```
+12345678900
```

✅ **You now have a Twilio phone number!**

---

## ⚙️ Step 3: Configure Your Environment (1 minute)

### 3.1 Open Your `.env` File

Navigate to your API directory:

```bash
cd apps/api
```

Edit `.env` file (create it if it doesn't exist):

```bash
# Windows
notepad .env

# Mac/Linux
nano .env
```

### 3.2 Add Twilio Credentials

Add these lines to your `.env` file:

```env
# ==========================================
# TWILIO SMS CONFIGURATION
# ==========================================

# Your Account SID from Step 1.2
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Auth Token from Step 1.3
TWILIO_AUTH_TOKEN=your32characterauthtoken123456

# Your Twilio Phone Number from Step 2.4
# MUST be in E.164 format: +1234567890 (no spaces or dashes)
TWILIO_PHONE_NUMBER=+12345678900

# Optional: Enable SMS for all urgent notifications
ENABLE_SMS_NOTIFICATIONS=true
```

### 3.3 Save and Close

**Windows:** Ctrl + S, then close  
**Mac/Linux:** Ctrl + X, then Y, then Enter

✅ **Configuration complete!**

---

## 🔄 Step 4: Restart Your API Server (1 minute)

### 4.1 Stop Your Current Server

If your API server is running, stop it:

**Press:** `Ctrl + C` in the terminal

### 4.2 Restart the Server

```bash
npm run dev
```

Wait for the server to start. You should see:

```
✅ Server running on http://localhost:4000
✅ Twilio SMS configured: +12345678900
```

✅ **Server restarted with SMS enabled!**

---

## 📱 Step 5: Send Test SMS (2 minutes)

### 5.1 Test with cURL (Terminal)

Open a new terminal and run:

```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "phone": "+12345678900",
    "message": "Test SMS from DOGFOOD OS! If you receive this, SMS is working perfectly. 🎉"
  }'
```

**Replace:**
- `YOUR_AUTH_TOKEN` → Your actual auth token
- `+12345678900` → Your real phone number

### 5.2 Expected Response

```json
{
  "success": true,
  "message": "✅ SMS sent successfully to +12345678900!",
  "phone": "+12345678900",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "twilioConfigured": true,
  "instructions": "Check your phone for the test message!"
}
```

### 5.3 Check Your Phone

You should receive an SMS within **5-30 seconds**! 📱

✅ **If you got the SMS, everything is working!**

---

## ⚠️ Troubleshooting Step 5

### Problem: "SMS failed to send"

**Response looks like:**

```json
{
  "success": false,
  "message": "❌ SMS failed to send. Check your Twilio configuration.",
  "twilioConfigured": false
}
```

**Solutions:**

1. **Verify `.env` credentials:**
   ```bash
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. **Restart the server** (you must restart after editing .env!)

3. **Check Twilio Console logs:**
   - Go to: https://console.twilio.com/
   - Click "Monitor" → "Logs" → "Messaging"
   - Look for error messages

### Problem: "Not Authorized" or "Permission Denied"

**You're in Trial Mode!** Trial accounts can only send to **verified phone numbers**.

**Solution A: Verify Your Phone Number** (Recommended for testing)

1. Go to: https://console.twilio.com/
2. Navigate to **"Phone Numbers"** → **"Verified Caller IDs"**
3. Click **"Add a new Caller ID"**
4. Enter your phone number
5. Choose verification method: **Call** or **Text**
6. Enter the verification code you receive
7. ✅ Now try sending test SMS again!

**Solution B: Upgrade to Paid Account** (Remove all restrictions)

1. Go to: https://console.twilio.com/
2. Click **"Upgrade"** in the top banner
3. Add billing information (credit card)
4. No restrictions anymore!
5. You still have your $15 free credit

### Problem: Wrong phone number format

**SMS requires E.164 format:**

❌ **Wrong:**
- `234-567-8900`
- `(234) 567-8900`
- `2345678900`

✅ **Correct:**
- `+12345678900` (USA)
- `+447912345678` (UK)
- `+919876543210` (India)

**Always include:**
- ✅ Plus sign `+`
- ✅ Country code (1 for USA/Canada)
- ✅ Full number with area code
- ❌ No spaces, dashes, or parentheses

---

## 👥 Step 6: Configure Participant SMS Preferences (1 minute)

### 6.1 Enable SMS for a User

```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/users/USER_ID/sms-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "enableSMS": true,
    "phone": "+12345678900"
  }'
```

### 6.2 Expected Response

```json
{
  "success": true,
  "message": "✅ SMS notifications enabled!",
  "preferences": {
    "email": true,
    "inApp": true,
    "sms": true,
    "phone": "+12345678900",
    "slack": false,
    "discord": false
  },
  "twilioConfigured": true
}
```

### 6.3 Disable SMS for a User

```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/users/USER_ID/sms-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{
    "enableSMS": false
  }'
```

✅ **SMS preferences configured!**

---

## 🎯 What SMS Notifications Are Sent Automatically?

Your system now automatically sends SMS for:

### 1. ⏰ Urgent Deadline Alerts

**Sent when:**
- Submission deadline is in 1 hour
- Priority: `urgent`
- User has SMS enabled

**Example message:**
```
[SpringHack] ⏰ Urgent: Submission deadline in 1 HOUR! 
Submit now at springhack.com/submit

Reply STOP to unsubscribe.
```

### 2. 🏆 Winner Announcements

**Sent when:**
- Organizer announces winners
- Priority: `urgent`

**Example message:**
```
[SpringHack] 🏆 Congratulations! You won 1st place in Spring Hack 2024! 
Check your email for prize details.

Reply STOP to unsubscribe.
```

### 3. 🚨 Emergency Notifications

**Sent when:**
- Venue change
- Event cancellation
- Security alerts
- Priority: `urgent`

**Example message:**
```
[SpringHack] 🚨 Venue Change: Event moved to Building B, Room 201. 
See you there!

Reply STOP to unsubscribe.
```

### 4. ✅ Verification Codes

**Sent when:**
- Two-factor authentication
- Phone verification
- Account recovery

**Example message:**
```
[DOGFOOD OS] Your verification code is: 123456

This code expires in 10 minutes.
```

---

## 📊 Monitor SMS Usage

### Check SMS Usage in Twilio Console

1. Go to: https://console.twilio.com/
2. Click **"Monitor"** → **"Usage"**
3. View SMS sent by day/week/month

### Check SMS Logs

1. Go to: https://console.twilio.com/
2. Click **"Monitor"** → **"Logs"** → **"Messaging"**
3. See all sent messages with status

### Set Usage Alerts

1. Go to: https://console.twilio.com/
2. Click **"Settings"** → **"Notifications"**
3. Set usage alerts (e.g., notify at $10 spent)
4. Add your email

---

## 💰 SMS Pricing & Cost Estimates

### Your Trial Account

| Resource | Amount | Cost |
|----------|--------|------|
| **SMS Credits** | 100 | FREE |
| **Trial Duration** | 30 days | FREE |
| **Restrictions** | Must verify recipient numbers | Trial only |

### After Trial Upgrade

**SMS Pricing by Country:**

| Country | Price per SMS |
|---------|---------------|
| 🇺🇸 USA | $0.0079 |
| 🇨🇦 Canada | $0.0079 |
| 🇬🇧 UK | $0.04 |
| 🇮🇳 India | $0.0051 |
| 🌍 Others | Varies |

**Cost Calculator:**

```
Small Hackathon (100 participants × 2 SMS):
100 × 2 × $0.0079 = $1.58 total

Medium Hackathon (500 participants × 3 SMS):
500 × 3 × $0.0079 = $11.85 total

Large Hackathon (2000 participants × 3 SMS):
2000 × 3 × $0.0079 = $47.40 total
```

💡 **Very affordable for urgent notifications!**

---

## 🔐 Security & Compliance

### Automatic Opt-Out Handling

**Users can opt-out by:**

1. **Reply "STOP"** to any SMS from your Twilio number
   - Twilio automatically blocks future messages
   - User receives confirmation
   - No action needed from you!

2. **Update preferences** via API:
   ```bash
   POST /api/v1/participant-automation/users/{userId}/sms-preferences
   { "enableSMS": false }
   ```

### Legal Compliance

✅ **TCPA (USA):**
- ✅ Obtain consent before sending SMS
- ✅ Include opt-out instructions ("Reply STOP")
- ✅ Identify your hackathon name
- ✅ Honor opt-outs immediately

✅ **GDPR (EU):**
- ✅ Document user consent
- ✅ Allow data deletion
- ✅ Encrypt phone numbers
- ✅ Include privacy policy

---

## 📱 SMS Best Practices

### DO ✅

- ✅ **Keep messages under 160 characters**
- ✅ **Include your hackathon name** in every message
- ✅ **Always add opt-out** ("Reply STOP to unsubscribe")
- ✅ **Send only urgent** notifications via SMS
- ✅ **Test before sending** to all participants
- ✅ **Respect quiet hours** (no SMS after 9 PM)

### DON'T ❌

- ❌ Send promotional content
- ❌ Send more than 3 SMS per day per person
- ❌ Include long URLs (use short links)
- ❌ Send non-urgent updates
- ❌ Ignore opt-out requests
- ❌ Share phone numbers with third parties

---

## 🌍 International SMS

### Sending to International Numbers

**Always use E.164 format:**

```
USA/Canada: +1234567890
UK: +447912345678
India: +919876543210
Australia: +61412345678
Germany: +4915123456789
```

### Enable International SMS

1. Go to: https://console.twilio.com/
2. Navigate to **"Messaging"** → **"Settings"** → **"Geo Permissions"**
3. Enable countries you want to send to
4. Save changes

### Check International Pricing

Visit: **https://www.twilio.com/en-us/sms/pricing**

---

## 🧪 Testing Scenarios

### Test 1: Basic SMS Send

```bash
POST /api/v1/participant-automation/test-sms
{
  "phone": "+12345678900",
  "message": "Test message"
}
```

**Expected:** SMS received within 30 seconds

---

### Test 2: Urgent Deadline Alert

```bash
# Trigger automatic SMS via notification service
POST /api/v1/participant-automation/users/{userId}/notification-preferences
{
  "email": true,
  "inApp": true,
  "sms": true,
  "phone": "+12345678900"
}

# System automatically sends SMS for urgent deadlines
```

**Expected:** SMS sent 1 hour before deadline

---

### Test 3: Custom Notification with SMS

```typescript
// In your code
await notificationService.sendNotification({
  userId: "user-id",
  title: "Test Urgent Alert",
  message: "This is a test urgent notification!",
  type: "system",
  priority: "urgent",  // This triggers SMS!
  channels: ["email", "sms"]
});
```

**Expected:** Both email and SMS received

---

## 📞 API Endpoints Reference

### Test SMS

```
POST /api/v1/participant-automation/test-sms
```

**Body:**
```json
{
  "phone": "+12345678900",
  "message": "Optional custom message"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ SMS sent successfully to +12345678900!",
  "phone": "+12345678900",
  "timestamp": "2024-03-15T10:30:00.000Z",
  "twilioConfigured": true,
  "instructions": "Check your phone for the test message!"
}
```

---

### Update SMS Preferences

```
POST /api/v1/participant-automation/users/{userId}/sms-preferences
```

**Body:**
```json
{
  "enableSMS": true,
  "phone": "+12345678900"
}
```

**Response:**
```json
{
  "success": true,
  "message": "✅ SMS notifications enabled!",
  "preferences": {
    "email": true,
    "inApp": true,
    "sms": true,
    "phone": "+12345678900"
  },
  "twilioConfigured": true
}
```

---

### Get Notification Preferences

```
GET /api/v1/participant-automation/users/{userId}/notification-preferences
```

**Response:**
```json
{
  "email": true,
  "inApp": true,
  "sms": true,
  "phone": "+12345678900",
  "slack": false,
  "discord": false
}
```

---

## 🎉 Success! You're All Set!

### ✅ What You've Accomplished

- ✅ Configured Twilio SMS integration
- ✅ Got a FREE Twilio phone number
- ✅ Sent test SMS successfully
- ✅ Enabled automatic urgent notifications
- ✅ Set up participant SMS preferences
- ✅ Learned SMS best practices

### 📱 Your SMS System Features

- ✅ **Automatic deadline alerts** (1 hour before)
- ✅ **Winner announcements**
- ✅ **Emergency notifications**
- ✅ **Verification codes**
- ✅ **Automatic opt-out handling**
- ✅ **International SMS support**
- ✅ **Usage monitoring**
- ✅ **Cost-effective** (~$0.008 per SMS)

### 🚀 Next Steps

1. **Test with real participants** during your next hackathon
2. **Monitor usage** in Twilio Console
3. **Adjust notification frequency** based on feedback
4. **Set up usage alerts** to avoid surprises
5. **Upgrade to paid account** when ready (removes restrictions)

---

## 🆘 Need Help?

### Twilio Support

- **Documentation:** https://www.twilio.com/docs/sms
- **Support Portal:** https://support.twilio.com/
- **Pricing Info:** https://www.twilio.com/en-us/sms/pricing
- **API Reference:** https://www.twilio.com/docs/sms/api

### Common Questions

**Q: How many SMS can I send per second?**  
A: Trial: 1/second. Paid: 100/second (configurable)

**Q: Can I send MMS (picture messages)?**  
A: Yes! Enable MMS when buying your number. Costs ~$0.02/MMS.

**Q: Can I use my own phone number?**  
A: No, you must use a Twilio number. But you can port your existing number to Twilio.

**Q: What happens if I run out of credits?**  
A: Messages will fail. Add a credit card to auto-reload.

**Q: Can I send WhatsApp messages?**  
A: Yes! Twilio supports WhatsApp. See: https://www.twilio.com/whatsapp

---

## 🎯 Quick Command Reference

```bash
# Test SMS
curl -X POST http://localhost:4000/api/v1/participant-automation/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"phone": "+12345678900"}'

# Enable SMS for user
curl -X POST http://localhost:4000/api/v1/participant-automation/users/USER_ID/sms-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"enableSMS": true, "phone": "+12345678900"}'

# Disable SMS for user
curl -X POST http://localhost:4000/api/v1/participant-automation/users/USER_ID/sms-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"enableSMS": false}'

# Check Twilio logs
open https://console.twilio.com/us1/monitor/logs/sms

# Check usage
open https://console.twilio.com/us1/monitor/usage
```

---

Built with ❤️ for DOGFOOD OS | Last updated: March 2024

**Your hackathons now have professional SMS capabilities!** 🎉📱
