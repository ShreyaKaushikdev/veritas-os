# 🚀 Quick Start - OTP & Google OAuth

## What You Need to Do Now

### 1️⃣ Update Your `.env` File

Copy these to your `apps/api/.env`:

```env
# Email Configuration (REQUIRED for OTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-gmail-app-password"
APP_NAME="DOGFOOD OS"
FRONTEND_URL="http://localhost:3000"

# Google OAuth (Get from Google Cloud Console)
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"

# Database - Choose ONE:
# Option A: PostgreSQL
DATABASE_URL="postgresql://username:password@localhost:5432/dogfood_os?schema=public"

# Option B: SQLite (for quick testing)
DATABASE_URL="file:./dev.db"
# Also change provider in prisma/schema.prisma to "sqlite"
```

### 2️⃣ Get Gmail App Password
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. App passwords → Generate new
4. Copy the 16-character password
5. Use as `SMTP_PASSWORD` in .env

### 3️⃣ Setup Google OAuth (Optional but Recommended)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create project → Enable Google+ API
3. Credentials → Create OAuth 2.0 Client ID
4. Add redirect URI: `http://localhost:4000/api/v1/auth/google/callback`
5. Copy Client ID and Secret to .env

### 4️⃣ Run Database Migrations
```bash
cd apps/api
npm run prisma:generate
npm run prisma:push
```

### 5️⃣ Start the Server
```bash
npm run start:dev
```

## ✅ Test It Out

### Register a new user:
```bash
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

Check your email for the OTP code!

### Verify OTP:
```bash
curl -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'
```

---

## 📁 What Was Changed

### New Files Created:
- ✅ `src/email/email.service.ts` - Nodemailer email sending
- ✅ `src/email/email.module.ts` - Email module
- ✅ `src/auth/google.strategy.ts` - Google OAuth strategy

### Modified Files:
- ✅ `prisma/schema.prisma` - Added OTP & verification fields
- ✅ `src/auth/auth.service.ts` - OTP generation & verification
- ✅ `src/auth/auth.controller.ts` - New endpoints
- ✅ `src/auth/auth.module.ts` - Integrated email & passport
- ✅ `.env.example` - Added email & Google config

### New Packages Installed:
- ✅ nodemailer
- ✅ @types/nodemailer
- ✅ @nestjs/passport
- ✅ passport
- ✅ passport-google-oauth20
- ✅ @types/passport-google-oauth20

---

## 🆘 Need Help?

See `SETUP_GUIDE.md` for detailed documentation and examples!
