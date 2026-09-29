# ✅ Setup Checklist - OTP & Google OAuth

Use this checklist to configure and test your new authentication system.

---

## 📋 Pre-Flight Checklist

### ☐ 1. Install Dependencies
```bash
cd apps/api
npm install
```
**Status:** ✅ Already completed

---

### ☐ 2. Configure Email (REQUIRED)

Choose your email provider and get credentials:

#### Option A: Gmail (Easiest for Development)
1. Go to [Google Account Security](https://myaccount.google.com/security)
2. Enable **2-Step Verification** (required)
3. Go to **App passwords**
4. Generate new app password for "Mail"
5. Copy the 16-character password

Update `.env`:
```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="xxxx xxxx xxxx xxxx"  # 16-char app password
```

#### Option B: Mailtrap (Testing Only)
1. Sign up at [Mailtrap.io](https://mailtrap.io/)
2. Create inbox
3. Copy SMTP credentials

Update `.env`:
```env
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-username"
SMTP_PASSWORD="your-mailtrap-password"
```

**✅ Checklist:**
- [ ] Email provider chosen
- [ ] SMTP credentials obtained
- [ ] `.env` file updated with SMTP settings
- [ ] `SMTP_USER` set
- [ ] `SMTP_PASSWORD` set
- [ ] `APP_NAME` set
- [ ] `FRONTEND_URL` set

---

### ☐ 3. Configure Google OAuth (OPTIONAL)

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project (or select existing)
3. Enable **Google+ API**:
   - APIs & Services → Library
   - Search "Google+ API"
   - Click Enable
4. Create OAuth 2.0 Client ID:
   - APIs & Services → Credentials
   - Create Credentials → OAuth 2.0 Client ID
   - Application type: **Web application**
   - Add Authorized redirect URIs:
     - `http://localhost:4000/api/v1/auth/google/callback`
     - `http://localhost:3000/auth/callback` (if needed)
5. Copy Client ID and Client Secret

Update `.env`:
```env
GOOGLE_CLIENT_ID="123456789.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-abc123def456"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"
```

**✅ Checklist:**
- [ ] Google Cloud project created
- [ ] Google+ API enabled
- [ ] OAuth 2.0 Client ID created
- [ ] Redirect URI added
- [ ] `.env` updated with Google credentials

---

### ☐ 4. Configure Database

Choose your database:

#### Option A: PostgreSQL (Production)
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dogfood_os?schema=public"
```

**PostgreSQL Setup:**
```bash
# Install PostgreSQL
# Windows: Download from postgresql.org
# Mac: brew install postgresql

# Create database
psql -U postgres
CREATE DATABASE dogfood_os;
CREATE USER dogfood WITH PASSWORD 'dogfood_secret';
GRANT ALL PRIVILEGES ON DATABASE dogfood_os TO dogfood;
\q
```

#### Option B: SQLite (Quick Development)
1. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./dev.db"
   }
   ```

2. Update `.env`:
   ```env
   DATABASE_URL="file:./dev.db"
   ```

**✅ Checklist:**
- [ ] Database choice made
- [ ] Database installed/running
- [ ] `DATABASE_URL` configured
- [ ] Prisma schema updated (if using SQLite)

---

### ☐ 5. Apply Database Migrations

```bash
cd apps/api
npm run prisma:generate
npm run prisma:push
```

**Expected Output:**
```
✔ Generated Prisma Client
✔ Database schema updated
```

**✅ Checklist:**
- [ ] Prisma client generated successfully
- [ ] Database schema pushed successfully
- [ ] No errors in output

---

### ☐ 6. Verify Environment Variables

Check your `.env` file has all required variables:

```bash
# Required Variables:
✅ PORT
✅ DATABASE_URL
✅ JWT_SECRET
✅ SMTP_HOST
✅ SMTP_PORT
✅ SMTP_USER
✅ SMTP_PASSWORD
✅ APP_NAME
✅ FRONTEND_URL

# Optional (for Google OAuth):
⭕ GOOGLE_CLIENT_ID
⭕ GOOGLE_CLIENT_SECRET
⭕ GOOGLE_CALLBACK_URL
```

**Test Configuration:**
Create `apps/api/test-config.js`:
```javascript
require('dotenv').config();

console.log('✅ Environment Check:');
console.log('PORT:', process.env.PORT || '❌ Missing');
console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Missing');
console.log('SMTP_USER:', process.env.SMTP_USER || '❌ Missing');
console.log('SMTP_PASSWORD:', process.env.SMTP_PASSWORD ? '✅ Set' : '❌ Missing');
console.log('GOOGLE_CLIENT_ID:', process.env.GOOGLE_CLIENT_ID || '⚠️ Optional');
```

Run: `node test-config.js`

---

## 🚀 Launch Checklist

### ☐ 7. Start the Server

```bash
cd apps/api
npm run start:dev
```

**Expected Output:**
```
[NestJS] Application is running on: http://localhost:4000
```

**✅ Checklist:**
- [ ] Server starts without errors
- [ ] No database connection errors
- [ ] Port 4000 is accessible

---

### ☐ 8. Test API Endpoints

#### Test 1: Health Check
```bash
curl http://localhost:4000/
```
Expected: API should respond

#### Test 2: Registration
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "userId": "...",
  "email": "test@example.com"
}
```

**✅ Checklist:**
- [ ] Registration request successful
- [ ] Response includes userId and email
- [ ] Email received with OTP code
- [ ] OTP code is 6 digits
- [ ] Email looks professional

---

#### Test 3: Verify OTP
Check your email for OTP, then:

```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

**Expected Response:**
```json
{
  "token": "...",
  "expiresAt": "...",
  "user": {
    "id": "...",
    "email": "test@example.com",
    "name": "Test User",
    "role": "PARTICIPANT"
  }
}
```

**✅ Checklist:**
- [ ] OTP verification successful
- [ ] Session token received
- [ ] User object returned
- [ ] Welcome email received

---

#### Test 4: Login
```bash
curl -X POST http://localhost:4000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456"
  }'
```

**Expected:** Should return session token

**✅ Checklist:**
- [ ] Login successful
- [ ] Token received
- [ ] Can access protected routes with token

---

#### Test 5: Get Current User
```bash
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

**Expected:** User profile returned

**✅ Checklist:**
- [ ] User profile retrieved
- [ ] Token authentication working

---

#### Test 6: Resend OTP (Optional)
```bash
curl -X POST http://localhost:4000/api/v1/auth/resend-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com"
  }'
```

**✅ Checklist:**
- [ ] Resend successful
- [ ] New OTP received

---

#### Test 7: Google OAuth (If Configured)
```bash
curl -X POST http://localhost:4000/api/v1/auth/google \
  -H "Content-Type: application/json" \
  -d '{
    "credential": "GOOGLE_JWT_TOKEN_HERE"
  }'
```

**Or visit:** `http://localhost:4000/api/v1/auth/google/login`

**✅ Checklist:**
- [ ] Google login working
- [ ] Redirects correctly
- [ ] Token received

---

## 🐛 Troubleshooting

### Email Not Sending

**Check 1: SMTP Credentials**
```bash
node -e "console.log(require('dotenv').config()); console.log('SMTP_USER:', process.env.SMTP_USER);"
```

**Check 2: Test Email Manually**
Create `apps/api/test-email.js`:
```javascript
const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD
  }
});

transporter.sendMail({
  from: process.env.SMTP_USER,
  to: 'your-email@example.com',
  subject: 'Test Email',
  text: 'If you receive this, email is working!'
}).then(info => {
  console.log('✅ Email sent:', info.messageId);
}).catch(err => {
  console.error('❌ Email failed:', err.message);
});
```

Run: `node test-email.js`

**Common Issues:**
- ❌ Gmail: "Less secure app access" disabled
  - **Solution:** Use App Password instead
- ❌ Wrong SMTP credentials
  - **Solution:** Double-check username and password
- ❌ Firewall blocking port 587
  - **Solution:** Check firewall settings

---

### Database Connection Failed

**Check 1: Database Running**
```bash
# PostgreSQL
pg_isready

# Check connection
psql -U postgres -d dogfood_os
```

**Check 2: DATABASE_URL Format**
```
postgresql://username:password@host:port/database?schema=public
```

**Common Issues:**
- ❌ Database not running
- ❌ Wrong credentials
- ❌ Database doesn't exist
  - **Solution:** Create database first

---

### Google OAuth Not Working

**Check 1: Redirect URI**
- Must match EXACTLY in Google Console
- No trailing slashes
- Correct protocol (http vs https)

**Check 2: API Enabled**
- Google+ API must be enabled
- May take a few minutes to propagate

**Check 3: Credentials**
```bash
node -e "require('dotenv').config(); console.log('CLIENT_ID:', process.env.GOOGLE_CLIENT_ID);"
```

---

## ✅ Final Verification

**Your system is ready when:**
- [✅] Server starts without errors
- [✅] Registration creates user
- [✅] OTP email received
- [✅] OTP verification works
- [✅] Welcome email received
- [✅] Login works
- [✅] Token authentication works
- [✅] Protected routes accessible
- [✅] (Optional) Google OAuth works

---

## 📚 Next Steps

1. **Frontend Integration**
   - See `API_REFERENCE.md` for complete API docs
   - Use provided TypeScript types
   - Implement registration/login forms

2. **Production Setup**
   - Switch to production email service (SendGrid, AWS SES)
   - Use PostgreSQL instead of SQLite
   - Set up proper domain for Google OAuth
   - Enable rate limiting

3. **Security Hardening**
   - Set strong JWT_SECRET
   - Enable HTTPS
   - Add rate limiting
   - Set up monitoring

4. **Testing**
   - Write unit tests
   - Integration tests
   - E2E tests

---

## 🎉 Congratulations!

You now have a production-ready authentication system with:
- ✅ Email verification via OTP
- ✅ Professional email templates
- ✅ Google OAuth integration
- ✅ Secure session management
- ✅ Complete API documentation

**Need Help?**
- `QUICK_START.md` - Fast setup guide
- `SETUP_GUIDE.md` - Detailed documentation
- `API_REFERENCE.md` - Complete API reference
- `IMPLEMENTATION_SUMMARY.md` - Technical overview

Happy coding! 🚀
