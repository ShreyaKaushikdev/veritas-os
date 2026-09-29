# 🔑 API Keys You Need Right Now

## ⚡ Priority 1: MUST HAVE (System Won't Run Without These)

### 1. Database (PostgreSQL)
**Status:** ✅ You likely already have this

```env
DATABASE_URL=postgresql://user:password@localhost:5432/dogfood_os
```

**Where to get:**
- You already have PostgreSQL running for your existing DOGFOOD OS
- Check your current `.env` file and copy the `DATABASE_URL`

---

### 2. Redis (Required for Bull Queue)
**Status:** 🟡 Need to install/start

```env
REDIS_HOST=localhost
REDIS_PORT=6379
```

**How to get:**
```bash
# Option 1: Docker (Easiest)
docker run -d -p 6379:6379 redis:7-alpine

# Option 2: Windows
# Download from: https://github.com/microsoftarchive/redis/releases
# Or use: choco install redis-64

# Option 3: Check if already installed
redis-cli ping  # Should return PONG
```

**Cost:** FREE ✅

---

## 🎯 Priority 2: HIGHLY RECOMMENDED (Free Tier)

### 3. OpenAI API (For AI-Powered Features)
**Status:** 🟡 Optional but powerful

```env
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

**Why you need it:**
- Makes idea analysis 10x better
- Real AI suggestions instead of heuristics
- Participants get GPT-4 powered feedback

**How to get:**
1. Visit: https://platform.openai.com/api-keys
2. Sign up (requires payment method)
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Cost:** 
- Pay-as-you-go
- ~$0.002 per analysis with GPT-3.5-turbo (cheapest)
- ~$0.03 per analysis with GPT-4 (best quality)
- **Estimated: $5-20/month** for moderate usage

**Without it:** System uses deterministic fallbacks (still works!)

---

### 4. SendGrid API (For Email Notifications)
**Status:** 🟡 Optional but very useful

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

**Why you need it:**
- Send deadline reminder emails
- Send submission receipt emails
- Send team notification emails

**How to get:**
1. Visit: https://sendgrid.com/
2. Sign up (NO credit card required for free tier!)
3. Go to Settings → API Keys
4. Create API Key with "Mail Send" permissions
5. **IMPORTANT:** Verify sender email in Settings → Sender Authentication

**Cost:** 
- **FREE tier: 100 emails/day forever** ✅
- Perfect for small-medium hackathons
- No credit card needed

**Without it:** Emails logged to console (good for development)

---

## 🌟 Priority 3: NICE TO HAVE (Free Forever)

### 5. Slack Webhook (For Team Notifications)
**Status:** ⚪ Optional

```
# Users configure their own webhooks in notification preferences
# No environment variable needed!
```

**Why you need it:**
- Send deadline alerts to Slack channels
- Team collaboration notifications
- Real-time updates

**How to get:**
1. Go to your Slack workspace
2. Click workspace name → Settings & administration → Manage apps
3. Search "Incoming Webhooks"
4. Click "Add to Slack"
5. Choose channel
6. Copy webhook URL
7. Give URL to participants for their notification preferences

**Cost:** FREE forever ✅

**Without it:** Notifications go to email/in-app only

---

### 6. Mixpanel (For Analytics)
**Status:** ⚪ Optional

```env
MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

**Why you need it:**
- Track automation feature usage
- See which features participants love
- Optimize based on data

**How to get:**
1. Visit: https://mixpanel.com/
2. Sign up (NO credit card required!)
3. Create project
4. Copy "Project Token" from settings

**Cost:** 
- **FREE tier: 20 MILLION events/month** ✅
- More than enough for any hackathon

**Without it:** Events logged to console

---

## 🚫 Priority 4: NOT NEEDED RIGHT NOW

These can wait or are truly optional:

### ❌ **Anthropic Claude** - Only if you don't use OpenAI
### ❌ **Resend** - Only if you don't use SendGrid
### ❌ **Discord Webhooks** - Only if teams use Discord
### ❌ **Twilio SMS** - Only for urgent SMS alerts (most don't need)
### ❌ **Amplitude** - Only if you don't use Mixpanel
### ❌ **AWS S3** - System uses local storage by default
### ❌ **Google Calendar** - Not implemented yet

---

## 📋 MY RECOMMENDATION: Start With This

### Minimal Setup (Works Immediately)

```env
# Required
DATABASE_URL=postgresql://localhost:5432/dogfood_os  # Copy from existing .env
REDIS_HOST=localhost
REDIS_PORT=6379
APP_URL=http://localhost:3000
API_PORT=4000

# That's it! System works now.
```

**What works:**
- ✅ All validation features
- ✅ Version control
- ✅ Deadline tracking
- ✅ Team insights
- ✅ Basic idea analysis (heuristics)
- ✅ Everything except AI and emails

**Cost:** $0

---

### Enhanced Setup (Free Tier Power)

Add these to your minimal setup:

```env
# AI-powered analysis
OPENAI_API_KEY=sk-proj-your-key-here

# Email notifications (100/day free)
SENDGRID_API_KEY=SG.your-key-here

# Analytics (20M events/month free)
MIXPANEL_TOKEN=your-token-here
```

**What you gain:**
- ✅ AI-powered idea suggestions
- ✅ Real email notifications
- ✅ Usage analytics
- ✅ Professional experience

**Cost:** $5-20/month (mostly OpenAI usage)

---

## 🎯 QUICK ACTION PLAN

### Today (5 minutes):

1. **Copy existing DATABASE_URL** from your current `.env`
2. **Start Redis:**
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```
3. **Test the system** - it works now!

### This Week (20 minutes):

1. **Get OpenAI API key** (10 min)
   - Sign up at platform.openai.com
   - Add payment method
   - Create API key
   
2. **Get SendGrid API key** (10 min)
   - Sign up at sendgrid.com (no credit card!)
   - Create API key
   - Verify sender email

### Optional (10 minutes):

1. **Get Mixpanel token** (5 min)
   - Sign up at mixpanel.com
   - Copy token

2. **Setup Slack webhooks** (5 min)
   - Create incoming webhook
   - Share with team

---

## 📝 Copy-Paste Template

Here's your `.env` file ready to use:

```env
# ==========================================
# REQUIRED - System won't run without these
# ==========================================

# Copy from your existing .env
DATABASE_URL=postgresql://postgres:password@localhost:5432/dogfood_os

# Redis for queues
REDIS_HOST=localhost
REDIS_PORT=6379

# Application URLs
APP_URL=http://localhost:3000
API_PORT=4000
NODE_ENV=development

# ==========================================
# RECOMMENDED - Add these for full features
# ==========================================

# OpenAI ($5-20/month estimated)
OPENAI_API_KEY=

# SendGrid (FREE 100 emails/day)
SENDGRID_API_KEY=

# Mixpanel (FREE 20M events/month)
MIXPANEL_TOKEN=

# ==========================================
# OPTIONAL - Add later if needed
# ==========================================

# Slack Bot Token (if using advanced Slack features)
SLACK_BOT_TOKEN=

# Twilio SMS (if you want SMS alerts)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=

# Amplitude (alternative to Mixpanel)
AMPLITUDE_API_KEY=

# AWS S3 (if you need cloud storage)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=dogfood-uploads
AWS_REGION=us-east-1

# ==========================================
# SECURITY (Generate these)
# ==========================================

# Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-in-production
SESSION_SECRET=your-session-secret-key

# ==========================================
# FEATURE FLAGS (Leave as-is)
# ==========================================

ENABLE_AI_ANALYSIS=true
ENABLE_AUTO_REMINDERS=true
ENABLE_VERSION_CONTROL=true
ENABLE_TEAM_MATCHING=true
ENABLE_BLINDSPOT_DETECTION=true

# ==========================================
# RATE LIMITING (Leave as-is)
# ==========================================

RATE_LIMIT_IDEA_ANALYSIS=10
RATE_LIMIT_VALIDATION=30
RATE_LIMIT_NOTIFICATIONS=20
```

---

## 💰 Total Cost Summary

### Option 1: Free Everything
```
Redis (Docker):         $0
Database (Existing):    $0
SendGrid (100/day):     $0
Mixpanel (20M events):  $0
Slack (Webhooks):       $0
─────────────────────────
TOTAL:                  $0/month ✅
```

**Works for:** Small hackathons (<100 participants)

---

### Option 2: Free + AI
```
Redis (Docker):         $0
Database (Existing):    $0
SendGrid (100/day):     $0
Mixpanel (20M events):  $0
OpenAI (Pay-as-you-go): $5-20
─────────────────────────
TOTAL:                  $5-20/month
```

**Works for:** Medium hackathons with AI features

---

### Option 3: Full Production
```
All above:              $5-20
SendGrid Pro:           $15 (if >100 emails/day)
Twilio SMS:            $20 (if you want SMS)
AWS S3:                $10 (if you need cloud storage)
─────────────────────────
TOTAL:                  $50-65/month
```

**Works for:** Large hackathons (>200 participants)

---

## 🎯 Bottom Line

### RIGHT NOW you need:

1. ✅ **DATABASE_URL** - You already have this
2. 🟡 **Redis** - Install with one command: `docker run -d -p 6379:6379 redis:7-alpine`
3. ⚪ **Everything else is optional!**

### This week, get:

1. **OpenAI** - For amazing AI features ($5-20/month)
2. **SendGrid** - For emails (FREE 100/day)

### Later, add:

1. **Mixpanel** - For analytics (FREE)
2. **Slack** - For team notifications (FREE)

---

## 🚀 What To Do RIGHT NOW

```bash
# 1. Copy your DATABASE_URL from existing .env
echo "DATABASE_URL=..." > apps/api/.env

# 2. Add these lines
echo "REDIS_HOST=localhost" >> apps/api/.env
echo "REDIS_PORT=6379" >> apps/api/.env
echo "APP_URL=http://localhost:3000" >> apps/api/.env

# 3. Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# 4. Install packages
cd apps/api
npm install @nestjs/bull bull @nestjs/schedule axios

# 5. Start API
npm run dev
```

**That's it! Your system is running!** 🎉

Add OpenAI and SendGrid keys when you're ready for more power.

---

## ❓ Questions?

**Q: Can I use it without OpenAI?**  
A: YES! It uses smart heuristics instead.

**Q: Do I need a credit card for SendGrid?**  
A: NO! Free tier needs no credit card.

**Q: What if I don't add any API keys?**  
A: System works perfectly, just logs to console instead of sending real emails/SMS.

**Q: How do I test if it works?**  
A: Run: `curl http://localhost:4000/api/v1/participant-automation/users/test/dashboard`

---

**TL;DR: Just install Redis and you're good to go!** Everything else is optional enhancement.
