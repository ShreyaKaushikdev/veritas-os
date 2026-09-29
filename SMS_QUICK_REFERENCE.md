# 📱 SMS Integration - Quick Reference Card

## ⚡ 5-Minute Setup

### 1. Get Twilio Credentials
1. Visit: https://console.twilio.com/
2. Copy **Account SID** and **Auth Token**
3. Buy a phone number: **Phone Numbers** → **Buy a number**

### 2. Configure .env
```env
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your32characterauthtoken123456
TWILIO_PHONE_NUMBER=+12345678900
```

### 3. Test SMS
```bash
curl -X POST http://localhost:4000/api/v1/participant-automation/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"phone": "+12345678900"}'
```

---

## 📞 API Endpoints

### Send Test SMS
```
POST /api/v1/participant-automation/test-sms
Body: { "phone": "+12345678900", "message": "Optional custom message" }
```

### Enable SMS for User
```
POST /api/v1/participant-automation/users/{userId}/sms-preferences
Body: { "enableSMS": true, "phone": "+12345678900" }
```

### Disable SMS for User
```
POST /api/v1/participant-automation/users/{userId}/sms-preferences
Body: { "enableSMS": false }
```

---

## 🎯 Automatic SMS Triggers

| Event | When Sent | Priority |
|-------|-----------|----------|
| ⏰ Deadline Alert | 1 hour before deadline | urgent |
| 🏆 Winner Announcement | When winners announced | urgent |
| 🚨 Emergency Alert | Venue/schedule change | urgent |
| ✅ Verification Code | 2FA, phone verification | urgent |

---

## 💰 Pricing

| Account Type | SMS Included | Price per SMS |
|--------------|--------------|---------------|
| **Trial** | 100 FREE | $0 |
| **Paid (USA)** | Pay as you go | $0.0079 |

**Example Costs:**
- 100 participants × 2 SMS = **$1.58**
- 500 participants × 3 SMS = **$11.85**
- 2000 participants × 3 SMS = **$47.40**

---

## 📱 Phone Number Format

### ✅ Correct (E.164 Format)
```
+12345678900   (USA/Canada)
+447912345678  (UK)
+919876543210  (India)
```

### ❌ Wrong
```
234-567-8900
(234) 567-8900
2345678900
```

**Rule:** Always include `+` and country code!

---

## 🚨 Troubleshooting

### SMS Not Sending?

1. **Check .env file has all 3 variables**
   ```bash
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   ```

2. **Restart server** (required after .env changes!)
   ```bash
   npm run dev
   ```

3. **Verify recipient phone** (Trial accounts only!)
   - Go to: Phone Numbers → Verified Caller IDs
   - Add and verify your test number

4. **Check Twilio logs**
   - Monitor → Logs → Messaging

---

## ✅ Best Practices

### DO
- ✅ Keep messages under 160 characters
- ✅ Include hackathon name
- ✅ Add "Reply STOP to unsubscribe"
- ✅ Send only urgent notifications
- ✅ Test before bulk sending

### DON'T
- ❌ Send promotional content
- ❌ Send after 9 PM
- ❌ Send more than 3 SMS/day per person
- ❌ Include long URLs
- ❌ Ignore opt-outs

---

## 🔗 Important Links

| Resource | URL |
|----------|-----|
| **Twilio Console** | https://console.twilio.com/ |
| **Buy Phone Number** | Console → Phone Numbers → Buy |
| **View SMS Logs** | Console → Monitor → Logs → Messaging |
| **Check Usage** | Console → Monitor → Usage |
| **Pricing** | https://www.twilio.com/sms/pricing |
| **API Docs** | https://www.twilio.com/docs/sms |

---

## 💡 Example Messages

### Good ✅
```
[SpringHack] ⏰ Deadline in 1 hour! Submit at springhack.com/submit
Reply STOP to unsubscribe.
(137 characters)
```

### Bad ❌
```
Hey everyone! Don't forget about our amazing hackathon event next week! 
We have so many cool prizes and sponsors lined up. You don't want to miss this!
(Too long, not urgent, promotional)
```

---

## 🎯 Common Commands

```bash
# Test SMS
curl -X POST http://localhost:4000/api/v1/participant-automation/test-sms \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"phone": "+12345678900"}'

# Enable SMS
curl -X POST http://localhost:4000/api/v1/participant-automation/users/USER_ID/sms-preferences \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"enableSMS": true, "phone": "+12345678900"}'

# Check Twilio console
open https://console.twilio.com/

# View SMS logs
open https://console.twilio.com/us1/monitor/logs/sms
```

---

## 📊 SMS Usage Monitor

### Set Usage Alerts
1. Console → Settings → Notifications
2. Set threshold: e.g., alert at $10
3. Add your email

### View Usage
1. Console → Monitor → Usage
2. Filter by: SMS, date range
3. Export reports if needed

---

## 🎉 Setup Checklist

- [ ] Got Account SID
- [ ] Got Auth Token
- [ ] Bought Twilio phone number
- [ ] Added to .env file
- [ ] Restarted server
- [ ] Sent test SMS
- [ ] Received SMS on phone
- [ ] Verified test numbers (trial only)
- [ ] Set usage alerts
- [ ] Ready to go! 🚀

---

## 🆘 Need Help?

**Full Guide:** See `TWILIO_SMS_COMPLETE_GUIDE.md`

**Twilio Support:**
- Docs: https://www.twilio.com/docs/sms
- Support: https://support.twilio.com/

---

**Status:** ✅ SMS Integration Active  
**Free Credits:** 100 SMS (Trial)  
**After Trial:** ~$0.008 per SMS

📱 **Happy texting!**
