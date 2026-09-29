# 🔄 Authentication Flow Diagrams

Visual guides for understanding the authentication flows.

---

## 📧 Email Registration with OTP Flow

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │
       │ 1. POST /register
       │    { email, password, name }
       ▼
┌─────────────────────┐
│   Auth Controller   │
└──────┬──────────────┘
       │
       │ 2. Create user
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Hash password     │
│ • Generate 6-digit  │
│   OTP (123456)      │
│ • Set expiry        │
│   (10 minutes)      │
│ • Save to DB        │
└──────┬──────────────┘
       │
       │ 3. Send OTP email
       ▼
┌─────────────────────┐
│   Email Service     │
├─────────────────────┤
│ • Create HTML email │
│ • Send via SMTP     │
└──────┬──────────────┘
       │
       │ 4. Email sent ✉️
       ▼
┌─────────────────────┐
│   User's Inbox      │
├─────────────────────┤
│ Subject: Verify     │
│         Your Email  │
│                     │
│ Your OTP: 123456    │
│ Expires in 10 min   │
└─────────────────────┘
       │
       │ 5. User enters OTP
       ▼
┌─────────────┐
│   Frontend  │
│ OTP Form    │
└──────┬──────┘
       │
       │ 6. POST /verify-otp
       │    { email, otp }
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Validate OTP      │
│ • Check expiry      │
│ • Mark verified     │
│ • Clear OTP         │
│ • Create session    │
└──────┬──────────────┘
       │
       │ 7. Send welcome email
       ▼
┌─────────────────────┐
│   Email Service     │
└──────┬──────────────┘
       │
       │ 8. Return session token
       ▼
┌─────────────┐
│   Frontend  │
├─────────────┤
│ Store token │
│ Redirect to │
│ Dashboard   │
└─────────────┘
```

---

## 🔐 Login Flow

```
┌─────────────┐
│   Frontend  │
│ Login Form  │
└──────┬──────┘
       │
       │ 1. POST /login
       │    { email, password }
       ▼
┌─────────────────────┐
│   Auth Controller   │
└──────┬──────────────┘
       │
       │ 2. Authenticate
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Find user by      │
│   email             │
│ • Check isVerified  │
│   = true ✅         │
│ • Compare password  │
│   with bcrypt       │
│ • Create session    │
│ • Generate token    │
└──────┬──────────────┘
       │
       │ 3. Return token
       ▼
┌─────────────┐
│   Frontend  │
├─────────────┤
│ • Store     │
│   token     │
│ • Redirect  │
│   to app    │
└─────────────┘
```

---

## 🔄 Resend OTP Flow

```
┌─────────────┐
│   Frontend  │
│ "Resend OTP"│
│   Button    │
└──────┬──────┘
       │
       │ 1. POST /resend-otp
       │    { email }
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Check user exists │
│ • Check not already │
│   verified          │
│ • Generate new OTP  │
│ • Update DB         │
│ • Reset expiry      │
└──────┬──────────────┘
       │
       │ 2. Send new OTP
       ▼
┌─────────────────────┐
│   Email Service     │
└──────┬──────────────┘
       │
       │ 3. New OTP sent ✉️
       ▼
┌─────────────┐
│   User      │
└─────────────┘
```

---

## 🔵 Google OAuth (JWT Credential) Flow

```
┌─────────────────────┐
│   Frontend          │
│ Google Sign-In      │
│ Button              │
└──────┬──────────────┘
       │
       │ 1. User clicks
       ▼
┌─────────────────────┐
│ Google Identity     │
│ Services            │
├─────────────────────┤
│ • Show Google login │
│ • User authenticates│
│ • Generate JWT      │
└──────┬──────────────┘
       │
       │ 2. JWT credential
       ▼
┌─────────────────────┐
│   Frontend          │
│ handleCallback()    │
└──────┬──────────────┘
       │
       │ 3. POST /google
       │    { credential: "jwt..." }
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Decode JWT        │
│ • Extract email,    │
│   name, googleId    │
│ • Find/create user  │
│ • Set isVerified    │
│   = true            │
│ • Link Google ID    │
│ • Create session    │
└──────┬──────────────┘
       │
       │ 4. Return token
       ▼
┌─────────────┐
│   Frontend  │
├─────────────┤
│ Store token │
│ Redirect    │
└─────────────┘
```

---

## 🔵 Google OAuth (Redirect) Flow

```
┌─────────────────────┐
│   Frontend          │
│ "Sign in with       │
│  Google" Button     │
└──────┬──────────────┘
       │
       │ 1. Redirect to
       │    /google/login
       ▼
┌─────────────────────┐
│   Backend           │
│ Passport Strategy   │
└──────┬──────────────┘
       │
       │ 2. Redirect to Google
       ▼
┌─────────────────────┐
│   Google OAuth      │
│   Login Page        │
├─────────────────────┤
│ • User enters       │
│   credentials       │
│ • Grants permission │
└──────┬──────────────┘
       │
       │ 3. Redirect with code
       ▼
┌─────────────────────┐
│   Backend           │
│ /google/callback    │
├─────────────────────┤
│ • Exchange code     │
│   for profile       │
│ • Find/create user  │
│ • Set verified      │
│ • Create session    │
└──────┬──────────────┘
       │
       │ 4. Redirect to frontend
       │    {FRONTEND_URL}/auth/
       │    callback?token=xxx
       ▼
┌─────────────────────┐
│   Frontend          │
│ /auth/callback      │
├─────────────────────┤
│ • Extract token     │
│   from URL          │
│ • Store token       │
│ • Fetch user        │
│ • Redirect to       │
│   dashboard         │
└─────────────────────┘
```

---

## 🔒 Protected Route Access Flow

```
┌─────────────────────┐
│   Frontend          │
│ Requests protected  │
│ resource            │
└──────┬──────────────┘
       │
       │ GET /api/v1/auth/me
       │ Authorization: Bearer token
       ▼
┌─────────────────────┐
│   Auth Guard        │
├─────────────────────┤
│ • Extract token     │
│ • Query session     │
│   from DB           │
│ • Check expiry      │
│ • Attach user to    │
│   request           │
└──────┬──────────────┘
       │
       │ Valid? ✅
       ▼
┌─────────────────────┐
│   Roles Guard       │
├─────────────────────┤
│ • Check user role   │
│ • Compare with      │
│   required roles    │
└──────┬──────────────┘
       │
       │ Authorized? ✅
       ▼
┌─────────────────────┐
│   Controller        │
├─────────────────────┤
│ • Execute handler   │
│ • Return response   │
└──────┬──────────────┘
       │
       │ User profile
       ▼
┌─────────────┐
│   Frontend  │
└─────────────┘
```

---

## 🚪 Logout Flow

```
┌─────────────────────┐
│   Frontend          │
│ "Logout" Button     │
└──────┬──────────────┘
       │
       │ 1. POST /logout
       │    Authorization: Bearer token
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Find session by   │
│   token             │
│ • Delete from DB    │
└──────┬──────────────┘
       │
       │ 2. { success: true }
       ▼
┌─────────────────────┐
│   Frontend          │
├─────────────────────┤
│ • Remove token from │
│   localStorage      │
│ • Clear user data   │
│ • Redirect to login │
└─────────────────────┘
```

---

## 📊 Database State Changes

### Registration → Verification

**After Registration:**
```
User Table:
┌──────────┬──────────────┬────────────┬────────┬──────────────┐
│ email    │ passwordHash │ isVerified │ otp    │ otpExpiresAt │
├──────────┼──────────────┼────────────┼────────┼──────────────┤
│ user@... │ $2a$10$...   │ false ❌   │ 123456 │ 2026-09-27   │
│          │              │            │        │ 12:10:00     │
└──────────┴──────────────┴────────────┴────────┴──────────────┘
```

**After Verification:**
```
User Table:
┌──────────┬──────────────┬────────────┬────────┬──────────────┐
│ email    │ passwordHash │ isVerified │ otp    │ otpExpiresAt │
├──────────┼──────────────┼────────────┼────────┼──────────────┤
│ user@... │ $2a$10$...   │ true ✅    │ null   │ null         │
└──────────┴──────────────┴────────────┴────────┴──────────────┘

Session Table:
┌────────────┬─────────┬────────────┬─────────────┐
│ token      │ userId  │ expiresAt  │ createdAt   │
├────────────┼─────────┼────────────┼─────────────┤
│ a1b2c3...  │ uuid... │ 2026-10-27 │ 2026-09-27  │
└────────────┴─────────┴────────────┴─────────────┘
```

### Google Login (New User)

**Before:**
```
User Table: (empty)
```

**After:**
```
User Table:
┌──────────────┬──────────────┬────────────┬────────────┬──────────┐
│ email        │ passwordHash │ isVerified │ googleId   │ name     │
├──────────────┼──────────────┼────────────┼────────────┼──────────┤
│ user@gmail...│ $2a$10$...   │ true ✅    │ google123  │ John Doe │
└──────────────┴──────────────┴────────────┴────────────┴──────────┘
                    ↑ Random                                        
                    (not used)                                      

Session Table:
┌────────────┬─────────┬────────────┬─────────────┐
│ token      │ userId  │ expiresAt  │ createdAt   │
├────────────┼─────────┼────────────┼─────────────┤
│ x1y2z3...  │ uuid... │ 2026-10-27 │ 2026-09-27  │
└────────────┴─────────┴────────────┴─────────────┘
```

---

## 🔄 Error Scenarios

### Expired OTP

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /verify-otp
       │ { email, otp: "123456" }
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Find user ✅      │
│ • OTP matches ✅    │
│ • Check expiry      │
│   otpExpiresAt <    │
│   now() ❌          │
└──────┬──────────────┘
       │
       │ 400 Bad Request
       │ "OTP has expired"
       ▼
┌─────────────┐
│   Frontend  │
├─────────────┤
│ Show error  │
│ "Resend OTP"│
│ button      │
└─────────────┘
```

### Login Before Verification

```
┌─────────────┐
│   Frontend  │
└──────┬──────┘
       │ POST /login
       │ { email, password }
       ▼
┌─────────────────────┐
│   Auth Service      │
├─────────────────────┤
│ • Find user ✅      │
│ • Check isVerified  │
│   = false ❌        │
└──────┬──────────────┘
       │
       │ 401 Unauthorized
       │ "Please verify email"
       ▼
┌─────────────┐
│   Frontend  │
├─────────────┤
│ Redirect to │
│ verify page │
└─────────────┘
```

---

## 📧 Email Templates Visual

### OTP Email
```
╔══════════════════════════════════════════╗
║                                          ║
║  ┌────────────────────────────────────┐ ║
║  │  📧 Email Verification             │ ║
║  └────────────────────────────────────┘ ║
║                                          ║
║  Hello John Doe!                         ║
║                                          ║
║  Thank you for registering. Use the     ║
║  following OTP code to verify:          ║
║                                          ║
║  ┌────────────────────────────────────┐ ║
║  │                                    │ ║
║  │          1 2 3 4 5 6              │ ║
║  │                                    │ ║
║  └────────────────────────────────────┘ ║
║                                          ║
║  ⏱️ Expires in 10 minutes               ║
║                                          ║
║  If you didn't request this, ignore.    ║
║                                          ║
║  ────────────────────────────────────   ║
║  © 2026 DOGFOOD OS                      ║
╚══════════════════════════════════════════╝
```

### Welcome Email
```
╔══════════════════════════════════════════╗
║                                          ║
║  ┌────────────────────────────────────┐ ║
║  │  🎉 Welcome Aboard!                │ ║
║  └────────────────────────────────────┘ ║
║                                          ║
║  Hello John Doe!                         ║
║                                          ║
║  Your email has been successfully       ║
║  verified. Welcome to DOGFOOD OS!       ║
║                                          ║
║  You can now access all features.       ║
║                                          ║
║  Questions? Contact our support team.   ║
║                                          ║
║  ────────────────────────────────────   ║
║  © 2026 DOGFOOD OS                      ║
╚══════════════════════════════════════════╝
```

---

## 🎯 Quick Reference

| Flow | Endpoints Used | Emails Sent |
|------|---------------|-------------|
| Registration | `/register` → `/verify-otp` | OTP + Welcome |
| Login | `/login` | None |
| Google (JWT) | `/google` | Welcome (new users) |
| Google (OAuth) | `/google/login` → `/google/callback` | Welcome (new users) |
| Resend | `/resend-otp` | OTP |
| Logout | `/logout` | None |

---

## 📱 Frontend State Management

```
Authentication State Machine:
┌──────────────┐
│ LOGGED_OUT   │
└──────┬───────┘
       │
       ├─→ Register ─→ [AWAITING_VERIFICATION]
       │                     │
       │                     │ Verify OTP
       │                     ▼
       │              [LOGGED_IN]
       │                     │
       └─→ Login ────────────┤
       │                     │
       └─→ Google Login ─────┤
                             │
                             │ Logout
                             ▼
                      [LOGGED_OUT]
```

---

This visual guide should help you understand all the authentication flows! 🎨
