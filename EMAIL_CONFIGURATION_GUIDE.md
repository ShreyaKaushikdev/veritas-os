# 📧 Email Configuration Guide for Hackathon Owners

## Complete Setup Guide for Sending Emails to Participants

---

## ✅ YES! Email is Fully Configured

The system **already has complete email sending capabilities** built-in. You just need to add your email service API key.

---

## 🚀 Quick Setup (5 Minutes)

### Option 1: SendGrid (Recommended)

**Why SendGrid:**
- ✅ **100 emails/day FREE** (no credit card needed!)
- ✅ Most reliable delivery
- ✅ Used by major companies
- ✅ Easy setup

**Step-by-step:**

1. **Sign up for SendGrid FREE**
   - Go to: https://sendgrid.com/
   - Click "Start for Free"
   - No credit card required for free tier!

2. **Verify your email**
   - Check your inbox for verification email
   - Click the verification link

3. **Create API Key**
   - Login to SendGrid
   - Go to: Settings → API Keys
   - Click "Create API Key"
   - Name it: "DOGFOOD OS"
   - Permissions: Select "Full Access" or "Mail Send"
   - Click "Create & View"
   - **COPY THE KEY NOW** (you won't see it again!)

4. **Verify Sender Email**
   - Go to: Settings → Sender Authentication
   - Click "Verify a Single Sender"
   - Fill in your email (e.g., noreply@your-domain.com)
   - Check your email and verify

5. **Add to .env file**
   ```env
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
   ```

6. **Restart your API**
   ```bash
   npm run dev
   ```

✅ **Done!** You can now send 100 emails/day for FREE!

---

### Option 2: Resend (Modern Alternative)

**Why Resend:**
- ✅ **3,000 emails/month FREE**
- ✅ Modern, developer-friendly
- ✅ Better dashboard
- ✅ No credit card for free tier

**Step-by-step:**

1. **Sign up for Resend**
   - Go to: https://resend.com/
   - Click "Start Building"
   - Sign up with GitHub/Google

2. **Create API Key**
   - Go to API Keys tab
   - Click "Create API Key"
   - Name it: "DOGFOOD OS"
   - Click "Create"
   - Copy the key

3. **Add to .env file**
   ```env
   RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
   ```

4. **Restart your API**
   ```bash
   npm run dev
   ```

✅ **Done!** You can now send 3,000 emails/month for FREE!

---

## 📝 Complete .env Configuration

Add these to your `.env` file:

```env
# ==========================================
# EMAIL CONFIGURATION (Required)
# ==========================================

# Option 1: SendGrid (100 emails/day free)
SENDGRID_API_KEY=SG.your-sendgrid-api-key-here

# Option 2: Resend (3,000 emails/month free)
RESEND_API_KEY=re_your-resend-api-key-here

# Customize email sender (optional)
LEADSTREAM_FROM_EMAIL=noreply@your-domain.com
LEADSTREAM_FROM_NAME=Your Hackathon Team
LEADSTREAM_REPLY_TO=support@your-domain.com

# ==========================================
# EMAIL FEATURES (Optional)
# ==========================================

# Enable/disable tracking
LEADSTREAM_TRACK_OPENS=true
LEADSTREAM_TRACK_CLICKS=true

# Rate limiting (emails per minute)
LEADSTREAM_RATE_LIMIT=600

# Batch processing
LEADSTREAM_BATCH_SIZE=100
```

---

## 🧪 Test Your Email Setup

### Test 1: Send a Test Email

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-bulk \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ORGANIZER_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "subject": "Test Email from DOGFOOD OS",
    "htmlContent": "<h1>Success!</h1><p>If you receive this, your email configuration is working perfectly.</p>",
    "recipients": ["your-email@example.com"]
  }'
```

✅ **Check your inbox!** You should receive the email within seconds.

---

### Test 2: Send to Multiple Participants

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-group \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "subject": "Welcome to the Hackathon!",
    "htmlContent": "<div style=\"font-family:Arial,sans-serif;\"><h1>Welcome!</h1><p>We are excited to have you join us.</p></div>",
    "targetGroup": "participants"
  }'
```

✅ **All participants** in your event will receive the email!

---

## 📧 What Email Features Are Available?

### ✅ Automatic Emails (Already Built-in)

The system automatically sends emails for:

1. **Deadline Reminders**
   - 24 hours before deadline
   - 6 hours before deadline
   - 1 hour before deadline

2. **Submission Receipts**
   - Automatic email with cryptographic proof
   - PDF attachment
   - QR code for verification

3. **Team Notifications**
   - Team activity updates
   - Collaboration alerts

4. **Validation Alerts**
   - Project validation failures
   - Pre-flight check warnings

### ✅ Manual Emails (Leadstream)

You can send:

1. **Bulk Emails**
   - Send to specific email addresses
   - Send to all participants
   - Send to judges only
   - Send to teams

2. **Campaign Emails**
   - Use professional templates
   - Schedule for later
   - Track opens and clicks
   - View analytics

3. **Custom Emails**
   - Create your own templates
   - Use variables for personalization
   - Import recipients from CSV

---

## 🎯 Common Use Cases

### Use Case 1: Welcome Email to New Participants

```typescript
POST /api/v1/leadstream/send-to-group

{
  "eventId": "spring-hack-2024",
  "subject": "🎉 Welcome to Spring Hack 2024!",
  "htmlContent": `
    <div style="font-family: Arial, sans-serif;">
      <h1 style="color: #10b981;">Welcome!</h1>
      <p>We're thrilled to have you join Spring Hack 2024.</p>
      <h3>What to do next:</h3>
      <ol>
        <li>Complete your profile</li>
        <li>Form or join a team</li>
        <li>Submit your project idea</li>
      </ol>
      <a href="https://your-hackathon.com/dashboard" 
         style="background: #10b981; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; display: inline-block;">
        Go to Dashboard
      </a>
    </div>
  `,
  "targetGroup": "participants"
}
```

---

### Use Case 2: Deadline Reminder (Urgent)

```typescript
POST /api/v1/leadstream/send-to-group

{
  "eventId": "spring-hack-2024",
  "subject": "⏰ Only 24 Hours Left to Submit!",
  "htmlContent": `
    <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b;">
      <h2 style="color: #92400e;">⏰ Deadline Approaching!</h2>
      <p>You have <strong>24 hours</strong> remaining to submit your project.</p>
      <p><strong>Deadline:</strong> March 17, 2024 at 5:00 PM EST</p>
      <a href="https://your-hackathon.com/submit" 
         style="background: #ef4444; color: white; padding: 12px 24px; 
                text-decoration: none; border-radius: 8px; display: inline-block;">
        Submit Now
      </a>
    </div>
  `,
  "targetGroup": "participants"
}
```

---

### Use Case 3: Results Announcement

```typescript
POST /api/v1/leadstream/send-to-group

{
  "eventId": "spring-hack-2024",
  "subject": "🏆 Spring Hack 2024 Results Are Here!",
  "htmlContent": `
    <div style="font-family: Arial, sans-serif;">
      <h1>🏆 Results Announced!</h1>
      <p>Thank you for participating in Spring Hack 2024!</p>
      <h3>🥇 Winners:</h3>
      <ol>
        <li><strong>Team Alpha</strong> - $5,000 Grand Prize</li>
        <li><strong>Team Beta</strong> - $3,000 Second Place</li>
        <li><strong>Team Gamma</strong> - $2,000 Third Place</li>
      </ol>
      <a href="https://your-hackathon.com/results">View Full Leaderboard</a>
      <p>Certificates will be emailed within 48 hours.</p>
    </div>
  `,
  "targetGroup": "all"
}
```

---

### Use Case 4: Judge Instructions

```typescript
POST /api/v1/leadstream/send-to-group

{
  "eventId": "spring-hack-2024",
  "subject": "Judging Begins Tomorrow - Instructions Inside",
  "htmlContent": `
    <div>
      <h2>Judging Instructions</h2>
      <p>Dear Judge,</p>
      <p>Judging for Spring Hack 2024 begins tomorrow at 9:00 AM.</p>
      <h3>Your Responsibilities:</h3>
      <ul>
        <li>Review assigned projects (you have 15)</li>
        <li>Score based on rubric criteria</li>
        <li>Complete by 5:00 PM tomorrow</li>
      </ul>
      <a href="https://your-hackathon.com/judge">Start Judging</a>
    </div>
  `,
  "targetGroup": "judges"
}
```

---

## 📊 Email Tracking & Analytics

### What Gets Tracked Automatically

✅ **Opens**: When recipient opens the email  
✅ **Clicks**: When recipient clicks any link  
✅ **Deliveries**: Successful delivery confirmation  
✅ **Bounces**: Failed deliveries  
✅ **Unsubscribes**: Opt-out requests  

### View Email Statistics

```bash
# Get campaign statistics
GET /api/v1/leadstream/campaigns/CAMPAIGN_ID/stats

# Response:
{
  "total": 500,
  "sent": 500,
  "delivered": 495,
  "opened": 320,      # 64% open rate
  "clicked": 145,     # 29% click rate
  "failed": 5,
  "openRate": 64,
  "clickRate": 29
}
```

### View Dashboard

```bash
GET /api/v1/leadstream/analytics/overview?eventId=your-event-id

# Shows:
# - Total campaigns sent
# - Total emails sent
# - Average open rate
# - Average click rate
# - Campaign performance
```

---

## 🔧 Advanced Configuration

### Custom Email Templates

Create your own branded templates:

```typescript
POST /api/v1/leadstream/templates

{
  "eventId": "your-event-id",
  "name": "My Custom Template",
  "subject": "{{eventName}} Update",
  "htmlContent": `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; }
        .header { background: #10b981; padding: 40px; text-align: center; }
        .header h1 { color: white; }
        .content { padding: 40px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>{{eventName}}</h1>
      </div>
      <div class="content">
        <p>Hi {{participantName}},</p>
        <p>{{customMessage}}</p>
      </div>
    </body>
    </html>
  `,
  "variables": ["eventName", "participantName", "customMessage"]
}
```

---

### Import Recipients from CSV

```csv
email,name
alice@example.com,Alice Johnson
bob@example.com,Bob Smith
carol@example.com,Carol Williams
```

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/lists/LIST_ID/import-csv \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "file=@participants.csv"
```

---

### Schedule Emails for Later

```typescript
{
  "scheduledAt": "2024-03-15T09:00:00Z",
  ...other fields
}
```

The email will automatically send at the scheduled time!

---

## 🚨 Troubleshooting

### Problem: Emails Not Sending

**Solution:**
1. Check API key is set in `.env`:
   ```bash
   echo $SENDGRID_API_KEY  # Should show your key
   ```

2. Verify sender email in SendGrid:
   - Settings → Sender Authentication
   - Must verify your "from" email

3. Check Redis is running:
   ```bash
   redis-cli ping  # Should return PONG
   ```

4. Check email queue:
   ```bash
   redis-cli LLEN bull:email-queue:wait
   redis-cli LLEN bull:email-queue:failed
   ```

---

### Problem: Emails Going to Spam

**Solution:**
1. **Verify domain** in SendGrid (Settings → Sender Authentication)
2. **Authenticate domain** with SPF/DKIM records
3. **Avoid spam words** in subject line:
   - ❌ "FREE", "WIN", "CLICK HERE", "!!!"
   - ✅ Use professional language
4. **Include unsubscribe link** (automatic in Leadstream)
5. **Don't send too many at once** (rate limiting enabled)

---

### Problem: Low Open Rates

**Solution:**
1. **Better subject lines**:
   - ❌ "Update"
   - ✅ "⏰ Only 24 Hours Left to Submit!"

2. **Send at right time**:
   - Best: Tuesday-Thursday, 10 AM - 2 PM
   - Avoid: Late nights, weekends

3. **Mobile-friendly emails** (all templates are responsive)

4. **Personalize** with recipient names

---

## 💰 Cost Comparison

### SendGrid

| Tier | Emails/Month | Cost |
|------|--------------|------|
| Free | 100/day (3,000/month) | $0 |
| Essentials | 40,000 | $15 |
| Pro | 100,000 | $60 |

### Resend

| Tier | Emails/Month | Cost |
|------|--------------|------|
| Free | 3,000 | $0 |
| Pro | 50,000 | $20 |
| Business | 100,000 | $80 |

**Recommendation for Small Hackathons:**
- Use **SendGrid Free** (100/day) or **Resend Free** (3,000/month)
- **Cost: $0/month** ✅

**For Large Hackathons (>100 participants):**
- Upgrade to **SendGrid Essentials** ($15/month for 40K emails)
- or **Resend Pro** ($20/month for 50K emails)

---

## ✅ Final Checklist

- [ ] Created SendGrid or Resend account
- [ ] Got API key
- [ ] Verified sender email
- [ ] Added API key to `.env` file
- [ ] Restarted API server
- [ ] Sent test email to yourself
- [ ] Received test email successfully
- [ ] Read documentation (`LEADSTREAM_GUIDE.md`)
- [ ] Ready to send emails to participants!

---

## 🎯 Quick Reference

### Send to All Participants
```bash
POST /api/v1/leadstream/send-to-group
{ "targetGroup": "participants", ... }
```

### Send to All Judges
```bash
POST /api/v1/leadstream/send-to-group
{ "targetGroup": "judges", ... }
```

### Send to Specific Emails
```bash
POST /api/v1/leadstream/send-bulk
{ "recipients": ["email1@example.com"], ... }
```

### View Statistics
```bash
GET /api/v1/leadstream/analytics/overview?eventId=EVENT_ID
```

---

## 🎉 You're All Set!

Your hackathon now has **professional email capabilities**:

✅ Automatic deadline reminders  
✅ Submission receipts  
✅ Bulk announcements  
✅ Campaign management  
✅ Open/click tracking  
✅ Analytics dashboard  

**Cost:** $0/month for small hackathons!

**Start sending emails now!** 📧

---

**Questions?** See:
- `LEADSTREAM_GUIDE.md` - Complete documentation
- `LEADSTREAM_QUICK_START.md` - Quick tutorial
- `THIRD_PARTY_APIS.md` - Detailed API setup

Built with ❤️ for DOGFOOD OS
