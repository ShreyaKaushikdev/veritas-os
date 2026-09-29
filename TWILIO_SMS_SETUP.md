# 📱 Twilio SMS Configuration - Complete Setup Guide

## Your Twilio Account is Ready! Let's Configure SMS Notifications

---

## 🎉 What You Have

Based on your Twilio console, you have:

✅ **Active Twilio Account**  
✅ **30 Days Trial Period**  
✅ **100 Free SMS Credits**  
✅ **Account SID** (visible in console)  
✅ **Auth Token** (hidden, click to reveal)  

---

## 🚀 Quick Setup (5 Minutes)

### Step 1: Get Your Twilio Credentials

From your Twilio Console (https://console.twilio.com/):

1. **Account SID** - Copy this from your dashboard
   - It looks like: `ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

2. **Auth Token** - Click the eye icon to reveal it
   - It looks like: `your32characterauthtoken123456`

3. **Get a Phone Number**:
   - Click on "Phone Numbers" in the left sidebar
   - Click "Buy a number"
   - Select your country (USA recommended)
   - Choose a number with SMS capability
   - Click "Buy" (it's FREE with your trial credits!)
   - Copy your new phone number (e.g., `+1234567890`)

---

### Step 2: Add to Your .env File

Open `apps/api/.env` and add these lines:

```env
# ==========================================
# TWILIO SMS CONFIGURATION
# ==========================================

# Your Account SID (from Twilio Console)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Your Auth Token (click eye icon to reveal)
TWILIO_AUTH_TOKEN=your32characterauthtoken123456

# Your Twilio Phone Number (the one you just bought)
TWILIO_PHONE_NUMBER=+1234567890

# Enable SMS notifications
ENABLE_SMS_NOTIFICATIONS=true
```

---

### Step 3: Restart Your API

```bash
cd apps/api
npm run dev
```

✅ **Done! SMS is now enabled!**

---

## 📱 Test Your SMS Configuration

### Test 1: Send a Test SMS

```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "phone": "+1234567890",
    "message": "Test SMS from DOGFOOD OS! If you receive this, SMS is working perfectly."
  }'
```

**Replace `+1234567890` with your phone number!**

✅ **Check your phone** - you should receive the SMS within seconds!

---

### Test 2: SMS Through Notification Service

The system will automatically use SMS for **urgent notifications**:

```typescript
// This code is already in your system
await notificationService.sendNotification({
  userId: "user-id",
  title: "Urgent Deadline",
  message: "Submission deadline is in 1 hour!",
  type: "deadline",
  priority: "urgent",  // This triggers SMS!
  channels: ["email", "sms"]
});
```

---

## 🎯 What Gets Sent via SMS

### Automatic SMS Notifications (Already Built-in)

The system automatically sends SMS for:

1. **⏰ Urgent Deadline Alerts**
   - 1 hour before submission deadline
   - Only sent if priority is "urgent"

2. **🚨 Critical System Alerts**
   - Account security issues
   - Payment failures
   - Important account changes

3. **✅ Verification Codes**
   - Two-factor authentication
   - Phone number verification
   - Account recovery

### Manual SMS (You Control)

You can send SMS for:

1. **Emergency Announcements**
   - Event cancellation
   - Venue changes
   - Security alerts

2. **Winner Notifications**
   - Immediate notification to winners
   - Prize claim instructions

3. **VIP Communications**
   - Sponsor messages
   - Judge coordination
   - Team leader updates

---

## 📊 SMS Usage & Limits

### Your Trial Account

| Resource | Available | Usage |
|----------|-----------|-------|
| **SMS Credits** | 100 | FREE during trial |
| **Trial Period** | 30 days | Active |
| **WhatsApp** | 100 messages | FREE during trial |
| **Voice Minutes** | 75 minutes | FREE during trial |
| **Email** | 3,000 emails | FREE during trial |

### After Trial / Paid Account

**SMS Pricing:**
- 🇺🇸 USA: $0.0079/SMS (~$8 for 1,000 SMS)
- 🇨🇦 Canada: $0.0079/SMS
- 🇬🇧 UK: $0.04/SMS
- 🇮🇳 India: $0.0051/SMS
- 🌍 International: Varies by country

**Monthly Cost Estimate:**
- Small hackathon (100 participants): $1-2/month
- Medium hackathon (500 participants): $5-10/month
- Large hackathon (2000 participants): $20-40/month

---

## 🔧 Advanced Configuration

### Customize SMS Messages

Edit the notification service to customize SMS format:

```typescript
// In notification.service.ts
private formatSMSMessage(title: string, message: string): string {
  return `[HACKATHON] ${title}: ${message}
  
Reply STOP to unsubscribe.
  `;
}
```

### SMS-Only Notifications

Send SMS without email:

```typescript
await notificationService.sendNotification({
  userId: "user-id",
  title: "Winner Announcement",
  message: "Congratulations! You won 1st place!",
  type: "system",
  priority: "urgent",
  channels: ["sms"]  // SMS only, no email
});
```

### Bulk SMS to Winners

```typescript
POST /api/v1/leadstream/send-sms-bulk

{
  "eventId": "your-event-id",
  "message": "🏆 Congratulations! You won a prize in Spring Hack 2024! Check your email for details.",
  "recipients": ["+1234567890", "+1234567891"]
}
```

---

## 📱 SMS Best Practices

### DO ✅

- ✅ Keep messages under 160 characters
- ✅ Include event name in message
- ✅ Always include opt-out instructions ("Reply STOP")
- ✅ Send only urgent/important notifications
- ✅ Use SMS for time-sensitive alerts
- ✅ Test before sending to everyone

### DON'T ❌

- ❌ Send promotional content via SMS
- ❌ Send non-urgent updates via SMS
- ❌ Send more than 2-3 SMS per day per person
- ❌ Include long links (use link shortener)
- ❌ Send SMS after 9 PM local time
- ❌ Forget to honor opt-out requests

---

## 🌍 International SMS

### Send to International Numbers

Always use E.164 format with country code:

```
USA: +1234567890
UK: +447912345678
India: +919876543210
Canada: +1234567890
```

### Check SMS Pricing by Country

Visit: https://www.twilio.com/en-us/sms/pricing

---

## 🔐 Security & Compliance

### Opt-Out Management

**Automatic Opt-Out Handling:**

Users can text "STOP" to your Twilio number, and Twilio automatically:
- Stops all future messages to that number
- Returns confirmation message
- Logs the opt-out

**Manual Opt-Out:**

```typescript
await notificationService.updatePreferences(userId, {
  sms: false  // Disable SMS for this user
});
```

### TCPA Compliance (USA)

✅ **Obtain Consent** - Get explicit permission before sending SMS  
✅ **Provide Opt-Out** - Include "Reply STOP to unsubscribe"  
✅ **Identify Sender** - Include your hackathon name  
✅ **Honor Opt-Outs** - Stop immediately when requested  

### GDPR Compliance (EU)

✅ **Consent Required** - Document user consent  
✅ **Right to Erasure** - Allow users to delete their data  
✅ **Data Protection** - Encrypt phone numbers  
✅ **Privacy Policy** - Disclose SMS usage  

---

## 📊 Monitor SMS Usage

### Check Usage in Twilio Console

1. Go to https://console.twilio.com/
2. Click "Usage" in sidebar
3. View SMS usage by day/month

### Check Usage via API

```bash
curl -X GET "https://api.twilio.com/2010-04-01/Accounts/$TWILIO_ACCOUNT_SID/Usage/Records.json?Category=sms" \
  -u "$TWILIO_ACCOUNT_SID:$TWILIO_AUTH_TOKEN"
```

### Set Usage Alerts

1. Go to Twilio Console
2. Settings → Usage Alerts
3. Set threshold (e.g., alert at $10 spent)
4. Add your email

---

## 🚨 Troubleshooting

### Problem: SMS Not Sending

**Solutions:**

1. **Check Twilio Credentials**
   ```bash
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. **Verify Phone Number Format**
   - Must include country code: `+1234567890`
   - No spaces or dashes: ❌ `+1 (234) 567-8900`
   - Correct format: ✅ `+12345678900`

3. **Check Trial Account Restrictions**
   - Trial accounts can only send to **verified numbers**
   - Go to: Phone Numbers → Verified Caller IDs
   - Add recipient numbers for testing

4. **Check Twilio Logs**
   - Go to Monitor → Logs → Messaging
   - View error messages

---

### Problem: "Not Authorized" Error

**Solution:** You're in trial mode. You need to:

1. **Verify Recipient Numbers**:
   - Go to Phone Numbers → Verified Caller IDs
   - Add the phone number you want to test with
   - Twilio will call/text you with a code
   - Enter the code to verify

2. **Or Upgrade Account**:
   - Click "Upgrade" in console
   - Add billing information
   - No more restrictions!

---

### Problem: International Numbers Not Working

**Solutions:**

1. **Enable Geo Permissions**:
   - Go to Messaging → Settings → Geo Permissions
   - Enable countries you want to send to
   - Save changes

2. **Check International Pricing**:
   - Some countries are blocked by default
   - Some countries require special setup

---

## 💡 Smart SMS Strategies

### Strategy 1: SMS + Email Combo

```typescript
// Critical messages: SMS + Email
priority: "urgent" → SMS + Email

// Important messages: Email only
priority: "high" → Email only

// Regular messages: In-app only
priority: "medium" → In-app notification
```

### Strategy 2: Time-Based SMS

```typescript
// Only send SMS during business hours
const hour = new Date().getHours();
const canSendSMS = hour >= 9 && hour <= 21;

if (canSendSMS && priority === "urgent") {
  channels.push("sms");
}
```

### Strategy 3: Cost-Effective SMS

```typescript
// Send SMS only for truly urgent notifications
const urgentKeywords = ["deadline", "winner", "emergency", "critical"];
const isUrgent = urgentKeywords.some(kw => title.toLowerCase().includes(kw));

if (isUrgent) {
  channels.push("sms");
}
```

---

## 📱 Example SMS Messages

### Good Examples ✅

```
[SpringHack] Deadline Alert: Submission closes in 1 hour! Submit now at springhack.com/submit Reply STOP to unsubscribe
```

```
[SpringHack] 🏆 Winner Alert: Congratulations! You won 1st place! Check your email for details. Reply STOP to opt out
```

```
[SpringHack] Venue Change: Event moved to Building B, Room 201. See you there! Reply STOP to unsubscribe
```

### Bad Examples ❌

```
❌ Hey! Don't forget about our hackathon next week! It's going to be awesome! We have so many cool prizes and sponsors...
(Too long, not urgent, promotional)
```

```
❌ New blog post: "10 Tips for Hackathon Success" - Read now!
(Not urgent, should be email)
```

---

## 🎯 Recommended SMS Usage

### DO Send SMS For:

1. ⏰ **1-hour deadline warnings**
2. 🏆 **Winner announcements**
3. 🚨 **Emergency venue/schedule changes**
4. 📍 **Day-of location reminders**
5. ✅ **Verification codes**
6. 🎫 **Check-in confirmation**

### DON'T Send SMS For:

1. ❌ Weekly newsletters
2. ❌ General announcements
3. ❌ Marketing content
4. ❌ Survey requests
5. ❌ Non-urgent updates
6. ❌ Reminder emails

**Rule of Thumb:** If it's not worth interrupting someone for, don't send SMS!

---

## 📊 Cost Calculator

### Estimate Your SMS Costs

**Formula:**
```
Cost = (Number of SMS) × (Price per SMS) × (Number of recipients)
```

**Examples:**

**Small Hackathon (100 participants):**
- 2 SMS per participant (deadline reminders)
- 100 × 2 × $0.0079 = **$1.58 total**

**Medium Hackathon (500 participants):**
- 3 SMS per participant
- 500 × 3 × $0.0079 = **$11.85 total**

**Large Hackathon (2000 participants):**
- 3 SMS per participant
- 2000 × 3 × $0.0079 = **$47.40 total**

💡 **Very affordable for urgent notifications!**

---

## ✅ Setup Checklist

- [ ] Got Account SID from Twilio Console
- [ ] Revealed and copied Auth Token
- [ ] Bought a Twilio phone number (FREE with trial)
- [ ] Added credentials to `.env` file
- [ ] Restarted API server
- [ ] Sent test SMS to your phone
- [ ] Received test SMS successfully
- [ ] Verified numbers for trial account (if needed)
- [ ] Set up usage alerts in Twilio Console
- [ ] Reviewed SMS best practices
- [ ] Ready to send urgent notifications!

---

## 🎉 You're Ready!

Your hackathon now has **professional SMS capabilities**:

✅ Urgent deadline alerts via SMS  
✅ Winner notifications  
✅ Emergency announcements  
✅ Verification codes  
✅ Automatic opt-out handling  
✅ Usage monitoring  

**Trial Credits:** 100 SMS (FREE)  
**After Trial:** ~$0.008 per SMS (very affordable!)

**Start sending urgent notifications now!** 📱

---

## 📞 Quick Reference

### Environment Variables
```env
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE_NUMBER=+1234567890
```

### Send Test SMS
```bash
POST /api/v1/participant-automation/test-sms
{ "phone": "+1234567890", "message": "Test" }
```

### Check Usage
Twilio Console → Usage → Records

### Verify Numbers (Trial)
Phone Numbers → Verified Caller IDs

---

**Questions?** 
- Twilio Docs: https://www.twilio.com/docs/sms
- Support: https://support.twilio.com/

Built with ❤️ for DOGFOOD OS
