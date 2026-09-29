# 📧 Setup Email in 5 Minutes

## ✅ Choose Your Email Provider

Pick **ONE** option below:

---

## 🟢 OPTION 1: SendGrid (Easiest - Recommended)

### ✅ Step 1: Sign Up (2 minutes)

1. Go to: **https://sendgrid.com/free/**
2. Click **"Start for free"**
3. Enter:
   - Email: `your-email@gmail.com`
   - Password: (create one)
4. Click **"Create Account"**
5. **Check your email** and verify

---

### ✅ Step 2: Verify Your Sender Email (2 minutes)

1. In SendGrid Dashboard:
2. Click **Settings** (left sidebar)
3. Click **Sender Authentication**
4. Click **"Verify a Single Sender"**
5. Fill form:
   ```
   From Name: Your Hackathon Name
   From Email: your-email@gmail.com
   Reply To: your-email@gmail.com
   Company: Your Organization
   Address: Your address
   City: Your city
   Country: Your country
   ```
6. Click **"Create"**
7. **Check your email** and click verification link

✅ **Sender verified!**

---

### ✅ Step 3: Create API Key (1 minute)

1. In SendGrid Dashboard:
2. Click **Settings** → **API Keys**
3. Click **"Create API Key"**
4. Enter name: `DOGFOOD_OS`
5. Select: **Full Access**
6. Click **"Create & View"**
7. **COPY THE KEY!** (starts with `SG.`)

⚠️ **Important:** Save it now! You can't see it again!

Example: `SG.abcd1234efgh5678ijkl9012mnop3456`

---

### ✅ Step 4: Add to Your .env File

1. Open your project folder
2. Go to: `apps/api/`
3. Open `.env` file (create if doesn't exist)
4. Add this line:

```env
SENDGRID_API_KEY=SG.your-actual-api-key-here
```

**Replace with your actual key!**

---

### ✅ Step 5: Restart Your API

```bash
cd apps/api
npm run dev
```

Look for: `✅ SendGrid configured`

---

### ✅ Step 6: Test Email!

Create a file `test-email.js`:

```javascript
// test-email.js
const axios = require('axios');

const sendTestEmail = async () => {
  try {
    const response = await axios.post(
      'https://api.sendgrid.com/v3/mail/send',
      {
        personalizations: [
          {
            to: [{ email: 'YOUR_EMAIL@gmail.com' }]
          }
        ],
        from: { email: 'YOUR_VERIFIED_EMAIL@gmail.com' },
        subject: '🎉 Test Email from DOGFOOD OS',
        content: [
          {
            type: 'text/html',
            value: '<h1>Success!</h1><p>Your email is working! 🚀</p>'
          }
        ]
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_SENDGRID_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

sendTestEmail();
```

**Edit the file:**
- Replace `YOUR_EMAIL@gmail.com` with your email
- Replace `YOUR_VERIFIED_EMAIL@gmail.com` with the email you verified
- Replace `YOUR_SENDGRID_API_KEY` with your actual API key

**Run it:**
```bash
node test-email.js
```

**Check your email!** (also check spam folder) 📧

---

## 🟦 OPTION 2: Resend (Alternative)

### ✅ Step 1: Sign Up

1. Go to: **https://resend.com/signup**
2. Sign up with email
3. Verify email

### ✅ Step 2: Get API Key

1. In Resend Dashboard
2. Click **"API Keys"**
3. Click **"Create API Key"**
4. Name: `DOGFOOD_OS`
5. **Copy the key** (starts with `re_`)

### ✅ Step 3: Add to .env

```env
RESEND_API_KEY=re_your-actual-api-key-here
```

### ✅ Step 4: Test

```javascript
// test-resend.js
const axios = require('axios');

const sendTestEmail = async () => {
  try {
    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: 'onboarding@resend.dev',
        to: 'YOUR_EMAIL@gmail.com',
        subject: '🎉 Test Email from DOGFOOD OS',
        html: '<h1>Success!</h1><p>Your email is working! 🚀</p>'
      },
      {
        headers: {
          'Authorization': 'Bearer YOUR_RESEND_API_KEY',
          'Content-Type': 'application/json'
        }
      }
    );
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
};

sendTestEmail();
```

Run: `node test-resend.js`

---

## 📋 Complete .env Example

```env
# Database
DATABASE_URL=postgresql://localhost:5432/dogfood_os

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# App
APP_URL=http://localhost:3000
API_PORT=4000

# EMAIL - Choose ONE:
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
# OR
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx

# Optional: SMS (you already have these)
TWILIO_ACCOUNT_SID=AC8272ae7c7386271fe6e9df661419939b
TWILIO_AUTH_TOKEN=e674e152f5f8bf099a95eb7535d022e6
# TWILIO_PHONE_NUMBER=+1234567890  (get this if you want SMS)
```

---

## ✅ What Works Now?

Once configured, your hackathon can send:

✅ **Automated Emails:**
- Deadline reminders (24h, 6h, 1h before)
- Welcome emails to new participants
- Winner announcements
- Submission receipts
- Team activity digests

✅ **Manual Bulk Emails:**
- Campaign newsletters
- Event announcements
- Custom broadcasts
- Targeted group emails

---

## 🎯 Quick Test via API

After setup, test through your API:

```bash
curl -X POST http://localhost:4000/api/v1/leadstream/campaigns \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "name": "Test Campaign",
    "subject": "Test Email",
    "htmlBody": "<h1>Hello!</h1><p>This is a test.</p>",
    "recipientListId": "list-id",
    "scheduledFor": null
  }'
```

---

## 🚨 Troubleshooting

### Email not sending?

1. **Check API key in .env**
   ```bash
   cat apps/api/.env | grep SENDGRID
   ```

2. **Restart API server** (required!)
   ```bash
   cd apps/api
   npm run dev
   ```

3. **Check spam folder**
   - First emails often go to spam
   - Mark as "Not Spam"

4. **Verify sender email** (SendGrid only)
   - Check SendGrid dashboard
   - Must be verified!

5. **Check API logs**
   - Look at terminal where API runs
   - Should show email sending status

---

## 💰 Costs

| Provider | Free Tier | Good For |
|----------|-----------|----------|
| **SendGrid** | 100 emails/day | Testing, small events |
| **Resend** | 3,000 emails/month | Production, most hackathons |

**Recommendation:** Start with SendGrid free tier to test, then switch to Resend for production if needed.

---

## ✅ Checklist

- [ ] Signed up for SendGrid or Resend
- [ ] Verified sender email (SendGrid) or got API key (Resend)
- [ ] Created API key
- [ ] Added to `.env` file
- [ ] Restarted API server
- [ ] Tested with test script
- [ ] Received test email ✅

---

## 🎉 Done!

You can now:
✅ Send bulk emails to participants  
✅ Automated deadline reminders  
✅ Winner announcements  
✅ Custom campaigns  

**Check your inbox for test email!** 📧

---

## 📚 Next Steps

1. **Read:** `LEADSTREAM_GUIDE.md` - Full email features
2. **Read:** `LEADSTREAM_QUICK_START.md` - Quick tutorial
3. **Explore:** Built-in email templates
4. **Create:** Your first campaign

---

**Need help?**
- See: `EMAIL_SETUP_ONLY.md` for detailed guide
- SendGrid Docs: https://docs.sendgrid.com/
- Resend Docs: https://resend.com/docs

📧 **Happy emailing!** 🚀
