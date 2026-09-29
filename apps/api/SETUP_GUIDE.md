# OTP Email & Google OAuth Setup Guide

## ✅ What Has Been Implemented

### 1. **OTP Email Verification with Nodemailer**
- Registration now generates a 6-digit OTP code
- OTP sent via email using Nodemailer
- OTP expires after 10 minutes
- Email verification required before login
- Welcome email sent after successful verification
- Resend OTP functionality

### 2. **Enhanced Google OAuth**
- Passport.js Google OAuth 2.0 strategy
- Support for both JWT credential and OAuth flow
- Automatic account creation for new Google users
- Links Google ID to existing accounts
- Pre-verified status for Google accounts

### 3. **Database Schema Updates**
- `isVerified`: Boolean flag for email verification
- `otp`: Stores current OTP code
- `otpExpiresAt`: OTP expiration timestamp
- `googleId`: Unique Google account identifier

### 4. **New API Endpoints**
- `POST /api/v1/auth/register` - Register with email/password (sends OTP)
- `POST /api/v1/auth/verify-otp` - Verify OTP and activate account
- `POST /api/v1/auth/resend-otp` - Resend OTP email
- `POST /api/v1/auth/login` - Login (requires verified email)
- `POST /api/v1/auth/google` - Google login via JWT credential
- `GET /api/v1/auth/google/login` - Initiate Google OAuth flow
- `GET /api/v1/auth/google/callback` - Google OAuth callback

---

## 🔧 Required Configuration

### Step 1: Update Database Configuration

Your current `.env` is configured for MongoDB, but the schema is for PostgreSQL. Choose one:

**Option A: Use PostgreSQL (Recommended for Production)**
```env
DATABASE_URL="postgresql://username:password@localhost:5432/dogfood_os?schema=public"
```

**Option B: Use SQLite (Quick Development Setup)**
Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}
```

### Step 2: Configure Email (Nodemailer)

Add these variables to your `.env` file:

```env
# For Gmail (Recommended for development)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_SECURE="false"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password-here"
APP_NAME="DOGFOOD OS"
FRONTEND_URL="http://localhost:3000"
```

#### How to Get Gmail App Password:
1. Go to your Google Account settings
2. Security → 2-Step Verification (must be enabled)
3. App passwords → Generate new app password
4. Select "Mail" and your device
5. Copy the 16-character password

**For Other Email Providers:**
```env
# Outlook/Office365
SMTP_HOST="smtp-mail.outlook.com"
SMTP_PORT="587"

# Yahoo
SMTP_HOST="smtp.mail.yahoo.com"
SMTP_PORT="587"

# SendGrid
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"

# AWS SES
SMTP_HOST="email-smtp.us-east-1.amazonaws.com"
SMTP_PORT="587"
SMTP_USER="your-ses-access-key"
SMTP_PASSWORD="your-ses-secret-key"
```

### Step 3: Configure Google OAuth

#### Create Google OAuth Credentials:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable **Google+ API**
4. Go to **Credentials** → Create Credentials → OAuth 2.0 Client ID
5. Application type: **Web application**
6. Add authorized redirect URIs:
   - `http://localhost:4000/api/v1/auth/google/callback` (development)
   - `https://yourdomain.com/api/v1/auth/google/callback` (production)

Add to your `.env`:
```env
GOOGLE_CLIENT_ID="your-client-id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-your-secret-here"
GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"
```

---

## 🚀 Running the Application

### 1. Apply Database Migrations
```bash
cd apps/api
npm run prisma:generate
npm run prisma:push
```

### 2. Start the Server
```bash
npm run start:dev
```

---

## 📡 API Usage Examples

### Registration Flow

**1. Register New User**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "role": "PARTICIPANT"
}
```

Response:
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "userId": "uuid",
  "email": "user@example.com"
}
```

**2. Verify OTP**
```bash
POST /api/v1/auth/verify-otp
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456"
}
```

Response:
```json
{
  "token": "session-token-here",
  "expiresAt": "2026-10-27T...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PARTICIPANT"
  }
}
```

**3. Resend OTP (if expired)**
```bash
POST /api/v1/auth/resend-otp
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### Login Flow

**Standard Login**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

### Google OAuth Flow

**Method 1: JWT Credential (Google Identity Services)**
```bash
POST /api/v1/auth/google
Content-Type: application/json

{
  "credential": "google-jwt-token-here"
}
```

**Method 2: OAuth Redirect Flow**
```
1. Frontend redirects to: GET /api/v1/auth/google/login
2. User authenticates with Google
3. Google redirects to: GET /api/v1/auth/google/callback
4. Backend redirects to: {FRONTEND_URL}/auth/callback?token={session-token}
```

---

## 🎨 Frontend Integration Example

### Registration with OTP
```javascript
// Step 1: Register
const registerResponse = await fetch('http://localhost:4000/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe'
  })
});

// Step 2: Show OTP input form

// Step 3: Verify OTP
const verifyResponse = await fetch('http://localhost:4000/api/v1/auth/verify-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    otp: '123456'
  })
});

const { token } = await verifyResponse.json();
localStorage.setItem('authToken', token);
```

### Google Sign-In Button (Using Google Identity Services)
```html
<script src="https://accounts.google.com/gsi/client" async defer></script>

<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleGoogleResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>

<script>
function handleGoogleResponse(response) {
  fetch('http://localhost:4000/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: response.credential })
  })
  .then(res => res.json())
  .then(data => {
    localStorage.setItem('authToken', data.token);
    // Redirect to dashboard
  });
}
</script>
```

---

## 🔒 Security Notes

1. **OTP Security**:
   - OTPs expire in 10 minutes
   - One-time use only
   - Cleared from database after verification

2. **Password Security**:
   - Hashed with bcrypt (10 rounds)
   - Never stored in plain text

3. **Session Management**:
   - 30-day session expiration
   - Token-based authentication
   - Secure logout clears sessions

4. **Email Verification**:
   - Login blocked until email verified
   - Google OAuth users pre-verified

---

## 🧪 Testing

### Test Email Sending (Development)
For development, you can use **Mailtrap** or **Ethereal Email**:

```env
# Mailtrap (mailtrap.io)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT="2525"
SMTP_USER="your-mailtrap-username"
SMTP_PASSWORD="your-mailtrap-password"

# Or use Ethereal (automatically generated test account)
# Generate at: https://ethereal.email/
```

---

## 📝 Environment Variables Checklist

Make sure your `.env` file has:
```env
✅ PORT=4000
✅ DATABASE_URL="..." (PostgreSQL or SQLite)
✅ JWT_SECRET="..."
✅ SMTP_HOST="smtp.gmail.com"
✅ SMTP_PORT="587"
✅ SMTP_SECURE="false"
✅ SMTP_USER="your-email@gmail.com"
✅ SMTP_PASSWORD="your-app-password"
✅ APP_NAME="DOGFOOD OS"
✅ FRONTEND_URL="http://localhost:3000"
✅ GOOGLE_CLIENT_ID="..."
✅ GOOGLE_CLIENT_SECRET="..."
✅ GOOGLE_CALLBACK_URL="http://localhost:4000/api/v1/auth/google/callback"
```

---

## 🐛 Troubleshooting

### Email Not Sending
1. Check SMTP credentials are correct
2. For Gmail, ensure "Less secure app access" is enabled OR use App Password
3. Check firewall/antivirus isn't blocking port 587
4. Try a different SMTP provider (Mailtrap for testing)

### Google OAuth Not Working
1. Verify redirect URI matches exactly in Google Console
2. Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are correct
3. Ensure Google+ API is enabled in GCP
4. Clear browser cookies and try again

### Database Connection Issues
1. Ensure PostgreSQL is running: `pg_isready`
2. Check DATABASE_URL format is correct
3. Try SQLite for quick development setup

---

## 🎉 You're All Set!

Your authentication system now includes:
- ✅ Email OTP verification
- ✅ Nodemailer integration
- ✅ Google OAuth 2.0
- ✅ Secure password handling
- ✅ Session management

Need help? Check the logs or reach out to the team!
