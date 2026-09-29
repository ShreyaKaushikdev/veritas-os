# ⚡ Quick Start - Participant Automation

## 🚀 Get Running in 3 Minutes

### Step 1: Install (30 seconds)

```bash
cd apps/api
npm install @nestjs/bull bull @nestjs/schedule axios
```

### Step 2: Configure (30 seconds)

```bash
# Copy template
cp .env.automation.example .env

# Edit .env - add these 3 lines (minimum):
DATABASE_URL=postgresql://localhost:5432/dogfood_os
REDIS_HOST=localhost
APP_URL=http://localhost:3000
```

### Step 3: Run (2 minutes)

```bash
# Terminal 1: Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Terminal 2: Start API
cd apps/api
npm run dev
```

✅ **Done!** API running at http://localhost:4000

---

## 🧪 Test It Works

```bash
# Test dashboard endpoint
curl http://localhost:4000/api/v1/participant-automation/users/test-user/dashboard

# Test idea analysis
curl -X POST http://localhost:4000/api/v1/participant-automation/events/event-1/analyze-idea \
  -H "Content-Type: application/json" \
  -d '{"title":"AI Assistant","description":"Smart code review system using ML..."}'
```

✅ If you see JSON responses, it works!

---

## 📊 What You Have Now

### 8 Major Features (All Working)

| Feature | Endpoint | Status |
|---------|----------|--------|
| 💡 Idea Analysis | `/analyze-idea` | ✅ Ready |
| ✅ Validation | `/validate` | ✅ Ready |
| 📝 Version Control | `/versions` | ✅ Ready |
| 👥 Team Insights | `/activity-digest` | ✅ Ready |
| 🤝 Team Matching | `/team-recommendations` | ✅ Ready |
| ⏰ Deadlines | `/deadlines` | ✅ Ready |
| 🔍 Blind Spots | `/blindspot-scan` | ✅ Ready |
| 🔐 Receipts | `/submission-receipt` | ✅ Ready |

### 11 Integrations (Optional, with Fallbacks)

- OpenAI / Anthropic (AI)
- SendGrid / Resend (Email)
- Slack / Discord (Chat)
- Twilio (SMS)
- Mixpanel / Amplitude (Analytics)
- AWS S3 (Storage)

**All work without API keys - graceful fallbacks enabled!**

---

## 📚 Documentation

| File | Purpose |
|------|---------|
| `INSTALLATION_COMPLETE.md` | Start here |
| `THIRD_PARTY_APIS.md` | Get API keys |
| `PARTICIPANT_AUTOMATION_GUIDE.md` | Full reference |
| `AUTOMATION_SUMMARY.md` | Overview |

---

## 🎯 Common Commands

```bash
# Start Redis
docker run -d -p 6379:6379 redis:7-alpine

# Check Redis
redis-cli ping  # Should return PONG

# Start API
cd apps/api
npm run dev

# Start Web
cd apps/web
npm run dev

# Watch queue activity
redis-cli MONITOR
```

---

## 🔧 Optional Enhancements

### Add AI Analysis (OpenAI)

1. Get API key: https://platform.openai.com/api-keys
2. Add to `.env`:
   ```
   OPENAI_API_KEY=sk-proj-your-key-here
   ```
3. Restart API
4. ✨ Now idea analysis uses GPT-4!

### Add Email Notifications (SendGrid Free)

1. Sign up: https://sendgrid.com (100/day free)
2. Get API key: Settings → API Keys
3. Add to `.env`:
   ```
   SENDGRID_API_KEY=SG.your-key-here
   ```
4. Restart API
5. 📧 Email notifications now work!

### Add Slack Notifications

1. Create webhook: Slack workspace → Incoming Webhooks
2. Users add webhook URL in their notification preferences
3. 💬 Team gets Slack notifications!

---

## ⚠️ Troubleshooting

### Redis Connection Error
```bash
# Make sure Redis is running
redis-cli ping

# If not, start it:
docker run -d -p 6379:6379 redis:7-alpine
```

### Port Already in Use
```bash
# Check what's using port 4000
# Windows:
netstat -ano | findstr :4000

# Mac/Linux:
lsof -i :4000

# Change port in .env:
API_PORT=4001
```

### Module Not Found
```bash
cd apps/api
rm -rf node_modules
npm install
```

---

## 🎉 Success Checklist

- [ ] Redis running (redis-cli ping returns PONG)
- [ ] API starts without errors
- [ ] Test endpoint returns JSON
- [ ] Environment variables set
- [ ] Documentation reviewed

✅ **All checked?** You're ready to build!

---

## 💡 What To Do Next

### Option 1: Use As-Is (No API Keys)
- ✅ All features work with fallbacks
- ✅ Perfect for development
- ✅ Test everything locally

### Option 2: Add Free Tier APIs
- 📧 SendGrid (100 emails/day)
- 💬 Slack webhooks (unlimited)
- 📊 Mixpanel (20M events/month)
- **Cost:** $0/month

### Option 3: Full Production Setup
- 🤖 OpenAI ($20-50/month)
- 📧 SendGrid Pro ($15/month)
- 📱 Twilio SMS ($20/month)
- **Cost:** $50-100/month

---

## 📞 Need Help?

1. **Installation Issues:** Check `INSTALLATION_COMPLETE.md`
2. **API Setup:** Read `THIRD_PARTY_APIS.md`
3. **Feature Questions:** See `PARTICIPANT_AUTOMATION_GUIDE.md`
4. **Code Questions:** Check inline comments

---

## 🎯 Key Endpoints to Try

```bash
# Dashboard overview
GET /api/v1/participant-automation/users/:userId/dashboard

# Analyze idea
POST /api/v1/participant-automation/events/:eventId/analyze-idea

# Validate project
POST /api/v1/participant-automation/projects/:projectId/validate

# Get deadlines
GET /api/v1/participant-automation/events/:eventId/deadlines

# Team recommendations
GET /api/v1/participant-automation/events/:eventId/team-recommendations

# Create snapshot
POST /api/v1/participant-automation/projects/:projectId/versions/snapshot

# Scan blind spots
POST /api/v1/participant-automation/projects/:projectId/blindspot-scan

# Get receipt
GET /api/v1/participant-automation/projects/:projectId/submission-receipt
```

---

## 🌟 Pro Tips

1. **Start Simple:** Use without API keys first
2. **Add Gradually:** Enable features one at a time
3. **Monitor Redis:** `redis-cli MONITOR` shows queue activity
4. **Check Logs:** API logs show all automation events
5. **Test Thoroughly:** Use provided curl examples

---

## ✨ You're All Set!

Your participant automation system is:
- ✅ Installed
- ✅ Configured
- ✅ Running
- ✅ Tested
- ✅ Ready for production

**Time to build amazing participant experiences! 🚀**

---

**Questions?** All answers in the documentation files.

**Issues?** Check troubleshooting sections.

**Success?** Start coding!

---

Built with ❤️ for DOGFOOD OS
