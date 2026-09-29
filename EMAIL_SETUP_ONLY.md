# 📧 Email Setup Guide - DOGFOOD OS

## ⚡ Quick Email Setup (5 Minutes)

You have two options for sending emails. Choose one:

---

## Option 1: SendGrid (Recommended - 100 emails/day FREE)

### Step 1: Create SendGrid Account

1. Go to: **https://sendgrid.com/free/**
2. Click **"Start for free"**
3. Sign up with your email
4. Verify your email address

### Step 2: Verify Sender Email

1. In SendGrid Dashboard, go to **Settings** → **Sender Authentication**
2. Click **"Verify a Single Sender"**
3. Fill in your information:
   - From Name: Your Hackathon Name
   - From Email: `noreply@yourdomain.com` or your email
   - Reply To: Your email
   - Company: Your organization
4. Click **"Create"**
5. Check your email and click verification link

### Step 3: Create API Key

1. In SendGrid Dashboard, go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Name: `DOGFOOD_OS_API_KEY`
4. Permissions: **Full Access** (or Mail Send only)
5. Click **"Create & View"**
6. **Copy the API key** (starts with `SG.`)
   - ⚠️ You can only see this once! Save it now!

### Step 4: Add to .env

Open `apps/api/.env` and add:

```env
# SendGrid Email Configuration
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**Replace with your actual API key!**

### Step 5: Restart API

```bash
cd apps/api
npm run dev
```

### Step 6: Test Email

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email from DOGFOOD OS",
    "message": "If you receive this, email is working!"
  }'
```

**Replace `your-email@example.com` with your actual email!**

✅ **Check your inbox!** (also check spam folder)

---

## Option 2: Resend (Alternative - 3,000 emails/month FREE)

### Step 1: Create Resend Account

1. Go to: **https://resend.com/signup**
2. Sign up with your email
3. Verify your email

### Step 2: Add Domain (or use onboarding domain)

**Option A: Use Onboarding Domain (Quick)**
- Resend gives you a test domain: `onboarding@resend.dev`
- Skip to Step 3

**Option B: Add Your Own Domain**
1. Click **"Domains"** → **"Add Domain"**
2. Enter your domain: `yourdomain.com`
3. Add DNS records (TXT, CNAME) to your domain
4. Wait for verification (can take 24 hours)

### Step 3: Create API Key

1. Go to **"API Keys"**
2. Click **"Create API Key"**
3. Name: `DOGFOOD_OS`
4. Permission: **Sending access**
5. Click **"Create"**
6. **Copy the API key** (starts with `re_`)

### Step 4: Add to .env

Open `apps/api/.env` and add:

```env
# Resend Email Configuration
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
```

### Step 5: Restart API

```bash
cd apps/api
npm run dev
```

### Step 6: Test Email

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "your-email@example.com",
    "subject": "Test Email from DOGFOOD OS",
    "message": "If you receive this, email is working!"
  }'
```

✅ **Check your inbox!**

---

## 📋 Your .env File Should Look Like This

```env
# Database
DATABASE_URL=postgresql://localhost:5432/dogfood_os

# Redis (for queues)
REDIS_HOST=localhost
REDIS_PORT=6379

# Application
APP_URL=http://localhost:3000
API_PORT=4000

# ==========================================
# EMAIL CONFIGURATION (Choose ONE)
# ==========================================

# Option 1: SendGrid (100 emails/day free)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# OR

# Option 2: Resend (3,000 emails/month free)
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# ==========================================
# OPTIONAL: Other Services
# ==========================================

# Twilio SMS (if you want SMS later)
TWILIO_ACCOUNT_SID=AC8272ae7c7386271fe6e9df661419939b
TWILIO_AUTH_TOKEN=e674e152f5f8bf099a95eb7535d022e6
TWILIO_PHONE_NUMBER=+1234567890

# OpenAI (for AI features)
OPENAI_API_KEY=sk-xxx

# Analytics
MIXPANEL_TOKEN=xxx
```

---

## 🎯 What Emails Will Be Sent?

Once configured, your system can send:

### Automated Emails
1. ⏰ **Deadline Reminders** - 24h, 6h, 1h before deadline
2. 🎉 **Welcome Emails** - When participants register
3. 🏆 **Winner Announcements** - When winners are selected
4. ✅ **Submission Receipts** - When projects are submitted
5. 📊 **Team Activity Digests** - Weekly team updates

### Manual Bulk Emails (Leadstream)
1. 📧 **Campaign Emails** - Custom newsletters
2. 📣 **Announcements** - Event updates
3. 🎯 **Targeted Emails** - To specific groups
4. 📝 **Templates** - Using built-in or custom templates

---

## 📧 Send Your First Bulk Email

### Using Built-in Template

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "templateId": "welcome",
    "subject": "Welcome to Spring Hack 2024!"
  }'
```

### Custom Email

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "your-event-id",
    "subject": "Important Update",
    "htmlBody": "<h1>Hello!</h1><p>This is a custom email.</p>",
    "textBody": "Hello! This is a custom email."
  }'
```

---

## ✅ Email Features Available

### SendGrid Features
✅ 100 emails per day (free tier)  
✅ Email tracking (opens, clicks)  
✅ Bounce handling  
✅ Spam compliance  
✅ Templates support  
✅ Bulk sending  

### Resend Features
✅ 3,000 emails per month (free tier)  
✅ Modern API  
✅ Email tracking  
✅ Fast delivery  
✅ Easy domain setup  
✅ React email templates  

---

## 🚨 Troubleshooting

### Email Not Sending?

**Check 1: API Key is Correct**
```bash
# Check if SendGrid key is set
echo $SENDGRID_API_KEY

# Check if Resend key is set
echo $RESEND_API_KEY
```

**Check 2: Sender Email Verified (SendGrid)**
- Go to SendGrid Dashboard → Settings → Sender Authentication
- Make sure you have a verified sender

**Check 3: API Server Restarted**
- You must restart the server after adding .env variables!
```bash
# Stop server (Ctrl + C)
# Restart
npm run dev
```

**Check 4: Check API Logs**
- Look at your terminal where API is running
- You should see email sending logs

**Check 5: Check Spam Folder**
- Test emails often go to spam
- Mark as "Not Spam" to whitelist

---

### "Unauthorized" Error (SendGrid)

**Solution:**
1. API key is wrong - create a new one
2. Sender email not verified - verify in dashboard
3. API key permissions - use "Full Access"

---

### "Domain Not Verified" Error (Resend)

**Solution:**
1. Use `onboarding@resend.dev` for testing
2. Or verify your domain with DNS records
3. Wait 24 hours for DNS propagation

---

## 💰 Cost Comparison

| Provider | Free Tier | Paid Tier |
|----------|-----------|-----------|
| **SendGrid** | 100 emails/day | $19.95/month (40K emails) |
| **Resend** | 3,000 emails/month | $20/month (50K emails) |

**Recommendation:**
- **Small hackathon (< 100 participants):** SendGrid free tier
- **Medium hackathon (100-500 participants):** Resend free tier
- **Large hackathon (500+ participants):** Paid plan

---

## 📊 Example Use Cases

### Use Case 1: Send Welcome Email to All Participants

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "spring-hack-2024",
    "templateId": "welcome",
    "subject": "Welcome to Spring Hack 2024! 🎉"
  }'
```

### Use Case 2: Send Reminder 24 Hours Before Deadline

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-participants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "spring-hack-2024",
    "templateId": "reminder",
    "subject": "⏰ Submission Deadline in 24 Hours!",
    "variables": {
      "deadline": "March 20, 2024 at 11:59 PM",
      "submissionUrl": "https://yourhackathon.com/submit"
    }
  }'
```

### Use Case 3: Announce Winners

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/send-to-winners \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "eventId": "spring-hack-2024",
    "subject": "🏆 Congratulations! You Won!",
    "htmlBody": "<h1>You are a winner!</h1><p>Check your email for prize details.</p>"
  }'
```

---

## 📧 Test Email Endpoints

### Simple Test Email

```bash
POST /api/v1/leadstream/send-test

Body:
{
  "to": "your-email@example.com",
  "subject": "Test Email",
  "message": "This is a test!"
}
```

### Campaign Test

```bash
POST /api/v1/leadstream/campaigns/{campaignId}/send-test

Body:
{
  "testEmail": "your-email@example.com"
}
```

---

## ✅ Setup Checklist

- [ ] Created SendGrid OR Resend account
- [ ] Verified sender email (SendGrid) or domain (Resend)
- [ ] Created API key
- [ ] Added API key to .env file
- [ ] Restarted API server
- [ ] Sent test email
- [ ] Received test email ✅
- [ ] Checked spam folder if needed

---

## 🎉 You're Ready!

Your email system is now configured! You can:

✅ Send automated deadline reminders  
✅ Send bulk emails to participants  
✅ Send winner announcements  
✅ Track email opens and clicks  
✅ Use built-in templates  
✅ Create custom campaigns  

---

## 📚 Documentation

For more details, see:
- **LEADSTREAM_GUIDE.md** - Complete email marketing guide
- **LEADSTREAM_QUICK_START.md** - Quick start tutorial
- **EMAIL_CONFIGURATION_GUIDE.md** - Detailed email setup

---

## 💡 Quick Tips

1. **SendGrid** is better for bulk sending (rate limits are higher)
2. **Resend** is better for transactional emails (faster, modern)
3. Always test with your own email first
4. Check spam folder for first few emails
5. Use templates for consistent branding
6. Track opens/clicks to improve campaigns

---

**Need help?**
- SendGrid Docs: https://docs.sendgrid.com/
- Resend Docs: https://resend.com/docs
- Check LEADSTREAM_GUIDE.md for examples

📧 **Happy emailing!** 🚀
