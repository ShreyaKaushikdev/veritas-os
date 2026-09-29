# 🔌 Third-Party API Integration Guide

## Overview

This guide provides detailed instructions for obtaining API keys for all third-party services used in the Participant Automation System.

---

## 🤖 AI Services

### OpenAI (Recommended)

**Purpose:** AI-powered idea analysis, suggestions, and improvement recommendations

**Get API Key:**
1. Visit: https://platform.openai.com/api-keys
2. Sign up or login
3. Click "Create new secret key"
4. Copy the key (starts with `sk-`)

**Pricing:**
- Pay-as-you-go
- ~$0.03 per 1K tokens (GPT-4)
- ~$0.002 per 1K tokens (GPT-3.5-turbo)

**Environment Variable:**
```
OPENAI_API_KEY=sk-proj-xxxxxxxxxxxxxxxxxxxxx
```

---

### Anthropic Claude (Alternative)

**Purpose:** Alternative AI provider for idea analysis

**Get API Key:**
1. Visit: https://console.anthropic.com/
2. Sign up for an account
3. Navigate to API Keys section
4. Generate new key

**Pricing:**
- ~$0.015 per 1K tokens (Claude 3 Sonnet)
- ~$0.003 per 1K tokens (Claude 3 Haiku)

**Environment Variable:**
```
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxxxxxxxxxx
```

---

## 📧 Email Services

### SendGrid (Recommended)

**Purpose:** Transactional emails, deadline reminders, receipts

**Get API Key:**
1. Visit: https://sendgrid.com/
2. Sign up (Free tier: 100 emails/day)
3. Go to Settings → API Keys
4. Create API Key with "Mail Send" permissions

**Free Tier:**
- 100 emails/day forever free
- No credit card required

**Environment Variable:**
```
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxx
```

**Setup Sender Identity:**
1. Go to Settings → Sender Authentication
2. Verify a single sender (your email)
3. Or set up domain authentication for production

---

### Resend (Modern Alternative)

**Purpose:** Developer-friendly email API

**Get API Key:**
1. Visit: https://resend.com/
2. Sign up
3. Go to API Keys tab
4. Create new API key

**Free Tier:**
- 3,000 emails/month
- 100 emails/day

**Environment Variable:**
```
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

---

## 💬 Team Communication

### Slack Integration

**Purpose:** Team notifications, deadline alerts, collaboration updates

**Setup Webhook (Simple Method):**
1. Go to your Slack workspace
2. Click on workspace name → Settings & administration → Manage apps
3. Search for "Incoming Webhooks"
4. Click "Add to Slack"
5. Choose a channel
6. Copy the Webhook URL

**Webhook URL Format:**
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

**Setup Bot Token (Advanced Method):**
1. Visit: https://api.slack.com/apps
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app and select workspace
5. Go to "OAuth & Permissions"
6. Add scopes: `chat:write`, `chat:write.public`
7. Install app to workspace
8. Copy "Bot User OAuth Token"

**Environment Variables:**
```
SLACK_BOT_TOKEN=xoxb-xxxxxxxxxxxxx
```

---

### Discord Integration

**Purpose:** Alternative team communication platform

**Setup Webhook:**
1. Open Discord and go to your server
2. Right-click on channel → Edit Channel
3. Go to Integrations → Webhooks
4. Click "New Webhook"
5. Customize and copy Webhook URL

**Webhook URL Format:**
```
https://discord.com/api/webhooks/123456789/xxxxxxxxxxxxx
```

**No environment variable needed - users provide webhook URLs in their preferences**

---

## 📱 SMS Services

### Twilio

**Purpose:** Urgent deadline notifications, critical alerts

**Get Credentials:**
1. Visit: https://www.twilio.com/
2. Sign up (Free trial: $15 credit)
3. Go to Console
4. Find your Account SID and Auth Token
5. Get a phone number from Phone Numbers → Manage → Buy a number

**Free Trial:**
- $15 credit
- Can send SMS, make calls
- Limited to verified numbers

**Environment Variables:**
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxxxxxxxxxx
TWILIO_PHONE_NUMBER=+1234567890
```

---

## 📊 Analytics & Monitoring

### Mixpanel

**Purpose:** Track user behavior, automation usage, engagement metrics

**Get API Token:**
1. Visit: https://mixpanel.com/
2. Sign up (Free tier: 20M events/month)
3. Create a project
4. Go to Project Settings
5. Copy the "Project Token"

**Free Tier:**
- 20 million events/month
- 1 year data retention

**Environment Variable:**
```
MIXPANEL_TOKEN=xxxxxxxxxxxxxxxxxxxxx
```

---

### Amplitude

**Purpose:** Alternative product analytics

**Get API Key:**
1. Visit: https://amplitude.com/
2. Sign up
3. Create a project
4. Go to Settings
5. Copy API Key

**Free Tier:**
- 10 million events/month
- Unlimited users

**Environment Variable:**
```
AMPLITUDE_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

---

## ☁️ File Storage

### AWS S3

**Purpose:** Store submission receipts, PDFs, attachments

**Get Credentials:**
1. Visit: https://aws.amazon.com/s3/
2. Create AWS account
3. Go to IAM → Users → Create User
4. Attach policy: `AmazonS3FullAccess` (or create custom policy)
5. Create access key
6. Create S3 bucket in S3 console

**Environment Variables:**
```
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxx
AWS_S3_BUCKET=dogfood-uploads
AWS_REGION=us-east-1
```

**Estimated Cost:**
- $0.023 per GB stored/month
- $0.09 per GB transferred
- Free tier: 5GB storage, 20K requests/month (first year)

---

## 📅 Calendar Integration

### Google Calendar API

**Purpose:** Deadline syncing, event reminders

**Get API Key:**
1. Visit: https://console.cloud.google.com/
2. Create a new project
3. Enable Google Calendar API
4. Go to Credentials
5. Create "API Key" or "OAuth 2.0 Client ID"

**Environment Variable:**
```
GOOGLE_CALENDAR_API_KEY=xxxxxxxxxxxxxxxxxxxxx
```

---

## 💳 Cost Summary

### Recommended Starter Setup (Free Tier)

| Service | Monthly Cost | Purpose |
|---------|--------------|---------|
| OpenAI | $0-10 | AI analysis (use GPT-3.5) |
| SendGrid | $0 | 100 emails/day |
| Slack | $0 | Team notifications |
| Discord | $0 | Alternative notifications |
| Mixpanel | $0 | Analytics (20M events) |
| AWS S3 | $0-5 | File storage (first year free) |
| **TOTAL** | **$0-15/month** | |

### Production Setup

| Service | Monthly Cost | Purpose |
|---------|--------------|---------|
| OpenAI | $20-50 | GPT-4 for better analysis |
| SendGrid | $15 | Pro plan (40K emails) |
| Twilio | $20 | SMS alerts |
| AWS S3 | $10-30 | Larger storage needs |
| **TOTAL** | **$65-110/month** | |

---

## 🧪 Development Mode

**Good news!** The system works WITHOUT any API keys:

- **AI Analysis:** Falls back to deterministic heuristics
- **Email:** Simulated (console.log)
- **SMS:** Simulated (console.log)
- **Analytics:** Console logging
- **File Storage:** Local filesystem

**To enable specific features, just add the relevant API keys. The system gracefully degrades.**

---

## 🔐 Security Best Practices

### 1. Never commit API keys to Git

Add to `.gitignore`:
```
.env
.env.local
.env.*.local
```

### 2. Use environment variables

```bash
# Development
cp .env.example .env
# Add your keys to .env

# Production
# Use your hosting provider's environment variable system
```

### 3. Rotate keys regularly

- Set calendar reminder every 90 days
- Rotate keys if team member leaves
- Use separate keys for dev/staging/production

### 4. Use least-privilege access

- OpenAI: Limit to specific models
- AWS: Use IAM roles with minimal permissions
- SendGrid: Restrict to mail send only

---

## 📚 Quick Start Templates

### Minimal Setup (Free, No Credit Card)

```bash
# .env
OPENAI_API_KEY=  # Optional - system works without it
SENDGRID_API_KEY=  # Optional - 100/day free tier
DATABASE_URL=postgresql://localhost:5432/dogfood
REDIS_HOST=localhost
APP_URL=http://localhost:3000
```

### Full Production Setup

```bash
# .env.production
# AI
OPENAI_API_KEY=sk-proj-xxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Email
SENDGRID_API_KEY=SG.xxxxx
RESEND_API_KEY=re_xxxxx

# Messaging
SLACK_BOT_TOKEN=xoxb-xxxxx
TWILIO_ACCOUNT_SID=ACxxxxx
TWILIO_AUTH_TOKEN=xxxxx
TWILIO_PHONE_NUMBER=+1234567890

# Analytics
MIXPANEL_TOKEN=xxxxx
AMPLITUDE_API_KEY=xxxxx

# Storage
AWS_ACCESS_KEY_ID=AKIAxxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=dogfood-prod
AWS_REGION=us-east-1

# Database
DATABASE_URL=postgresql://user:pass@db.example.com:5432/dogfood
REDIS_HOST=redis.example.com
REDIS_PORT=6379

# App
APP_URL=https://dogfood.example.com
```

---

## 🎯 Priority Order for Setup

1. **Phase 1 (Essential):**
   - Database (PostgreSQL)
   - Redis
   - Basic email (SendGrid free tier)

2. **Phase 2 (Enhanced):**
   - OpenAI (for better AI analysis)
   - Slack webhooks (for team notifications)

3. **Phase 3 (Production):**
   - Twilio (for urgent SMS)
   - AWS S3 (for file storage)
   - Analytics (Mixpanel/Amplitude)

---

## 🆘 Support & Resources

### Official Documentation
- [OpenAI API Docs](https://platform.openai.com/docs)
- [SendGrid API Docs](https://docs.sendgrid.com/)
- [Slack API Docs](https://api.slack.com/)
- [Twilio Docs](https://www.twilio.com/docs)
- [AWS S3 Docs](https://docs.aws.amazon.com/s3/)

### Community
- Stack Overflow for technical issues
- Each service's support portal for API problems

---

**Need help setting up?** Check the main `PARTICIPANT_AUTOMATION_GUIDE.md` for troubleshooting!
