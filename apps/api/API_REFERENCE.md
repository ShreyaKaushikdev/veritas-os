# 🔌 Authentication API Reference

Complete reference for integrating with the DOGFOOD OS authentication system.

---

## Base URL
```
http://localhost:4000/api/v1/auth
```

---

## 📋 Endpoints

### 1. Register New User
Creates a new user account and sends OTP verification email.

**Endpoint:** `POST /register`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123",
  "name": "John Doe",
  "role": "PARTICIPANT"  // Optional: VISITOR, PARTICIPANT, JUDGE, ORGANIZER, ADMIN
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for OTP verification.",
  "userId": "uuid-here",
  "email": "user@example.com"
}
```

**Error Responses:**
- `409 Conflict` - User with email already exists
- `400 Bad Request` - Invalid email or password format

---

### 2. Verify OTP
Verifies the OTP code and activates the user account.

**Endpoint:** `POST /verify-otp`

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "token": "session-token-32-chars",
  "expiresAt": "2026-10-27T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PARTICIPANT",
    "createdAt": "2026-09-27T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid OTP or user not found
- `400 Bad Request` - Email already verified, OTP expired, or no OTP found

**Notes:**
- OTP expires after 10 minutes
- After verification, a welcome email is sent
- Session token is valid for 30 days

---

### 3. Resend OTP
Resends the OTP verification email if the previous one expired.

**Endpoint:** `POST /resend-otp`

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP has been resent to your email."
}
```

**Error Responses:**
- `401 Unauthorized` - User not found
- `400 Bad Request` - Email already verified
- `500 Internal Server Error` - Failed to send email

---

### 4. Login
Authenticates a user with email and password.

**Endpoint:** `POST /login`

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePassword123"
}
```

**Success Response (200):**
```json
{
  "token": "session-token-32-chars",
  "expiresAt": "2026-10-27T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "PARTICIPANT",
    "createdAt": "2026-09-27T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials or email not verified

**Notes:**
- Email must be verified before login
- Use the token in the `Authorization` header for authenticated requests

---

### 5. Google OAuth (JWT Credential)
Authenticate using Google Identity Services JWT credential.

**Endpoint:** `POST /google`

**Request Body:**
```json
{
  "credential": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Alternative Format:**
```json
{
  "email": "user@gmail.com",
  "name": "John Doe",
  "googleId": "google-user-id"
}
```

**Success Response (200):**
```json
{
  "token": "session-token-32-chars",
  "expiresAt": "2026-10-27T12:00:00.000Z",
  "user": {
    "id": "uuid",
    "email": "user@gmail.com",
    "name": "John Doe",
    "role": "PARTICIPANT",
    "createdAt": "2026-09-27T12:00:00.000Z"
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Missing email or invalid credential

**Notes:**
- Google users are automatically verified
- New accounts are created automatically
- Existing accounts are linked with Google ID

---

### 6. Google OAuth Flow (Redirect)
Initiates the Google OAuth 2.0 redirect flow.

**Endpoint:** `GET /google/login`

**Usage:**
Redirect user to this endpoint to start Google OAuth.

**Flow:**
1. User clicks "Sign in with Google"
2. Frontend redirects to `GET /api/v1/auth/google/login`
3. User authenticates with Google
4. Google redirects to callback URL
5. Backend redirects to `{FRONTEND_URL}/auth/callback?token={session-token}`
6. Frontend extracts token from URL and stores it

---

### 7. Google OAuth Callback
Handles the OAuth callback from Google (internal use).

**Endpoint:** `GET /google/callback`

**Parameters:** (Handled by Passport)
- `code` - Authorization code from Google

**Response:**
Redirects to: `{FRONTEND_URL}/auth/callback?token={session-token}`

---

### 8. Logout
Invalidates the current session token.

**Endpoint:** `POST /logout`

**Headers:**
```
Authorization: Bearer {session-token}
```

**Success Response (200):**
```json
{
  "success": true
}
```

**Notes:**
- Deletes the session from database
- Token becomes invalid immediately

---

### 9. Get Current User
Retrieves the authenticated user's profile.

**Endpoint:** `GET /me`

**Headers:**
```
Authorization: Bearer {session-token}
```

**Success Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "PARTICIPANT",
  "createdAt": "2026-09-27T12:00:00.000Z",
  "memberships": [...],
  "judgeProfile": null
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token
- `403 Forbidden` - Insufficient permissions

---

## 🔒 Authentication

All protected endpoints require the session token:

```
Authorization: Bearer {session-token}
```

Or alternatively:
```
X-Session-Token: {session-token}
```

---

## 🎨 Frontend Integration Examples

### React/Next.js Registration Flow

```typescript
// 1. Register User
const register = async (email: string, password: string, name: string) => {
  const response = await fetch('http://localhost:4000/api/v1/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name })
  });
  
  if (!response.ok) throw new Error('Registration failed');
  
  const data = await response.json();
  return data;
};

// 2. Verify OTP
const verifyOTP = async (email: string, otp: string) => {
  const response = await fetch('http://localhost:4000/api/v1/auth/verify-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, otp })
  });
  
  if (!response.ok) throw new Error('OTP verification failed');
  
  const data = await response.json();
  
  // Store token
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};

// 3. Resend OTP
const resendOTP = async (email: string) => {
  const response = await fetch('http://localhost:4000/api/v1/auth/resend-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  return response.json();
};

// 4. Login
const login = async (email: string, password: string) => {
  const response = await fetch('http://localhost:4000/api/v1/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  if (!response.ok) throw new Error('Login failed');
  
  const data = await response.json();
  
  // Store token
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  return data;
};

// 5. Get Current User
const getCurrentUser = async () => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch('http://localhost:4000/api/v1/auth/me', {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) throw new Error('Unauthorized');
  
  return response.json();
};

// 6. Logout
const logout = async () => {
  const token = localStorage.getItem('authToken');
  
  await fetch('http://localhost:4000/api/v1/auth/logout', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  // Clear local storage
  localStorage.removeItem('authToken');
  localStorage.removeItem('user');
};
```

---

### Google Sign-In Integration

#### Using Google Identity Services (Recommended)

```html
<!-- Include Google Identity Services -->
<script src="https://accounts.google.com/gsi/client" async defer></script>

<!-- Google Sign-In Button -->
<div id="g_id_onload"
     data-client_id="YOUR_GOOGLE_CLIENT_ID"
     data-callback="handleGoogleResponse">
</div>
<div class="g_id_signin" data-type="standard"></div>

<script>
async function handleGoogleResponse(response) {
  const res = await fetch('http://localhost:4000/api/v1/auth/google', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential: response.credential })
  });
  
  const data = await res.json();
  
  // Store token
  localStorage.setItem('authToken', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));
  
  // Redirect to dashboard
  window.location.href = '/dashboard';
}
</script>
```

#### Using OAuth Redirect Flow

```typescript
// Redirect to Google OAuth
const loginWithGoogle = () => {
  window.location.href = 'http://localhost:4000/api/v1/auth/google/login';
};

// Handle callback on /auth/callback page
const handleGoogleCallback = () => {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  
  if (token) {
    localStorage.setItem('authToken', token);
    
    // Fetch user details
    getCurrentUser().then(user => {
      localStorage.setItem('user', JSON.stringify(user));
      window.location.href = '/dashboard';
    });
  }
};
```

---

### TypeScript Types

```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'VISITOR' | 'PARTICIPANT' | 'JUDGE' | 'ORGANIZER' | 'ADMIN';
  createdAt: string;
}

interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

interface RegisterResponse {
  success: boolean;
  message: string;
  userId: string;
  email: string;
}

interface ResendOTPResponse {
  success: boolean;
  message: string;
}
```

---

## ⚠️ Error Handling

All endpoints follow standard HTTP status codes:

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Request completed successfully |
| 400 | Bad Request | Invalid input, OTP expired |
| 401 | Unauthorized | Invalid credentials, OTP mismatch |
| 403 | Forbidden | Insufficient permissions |
| 409 | Conflict | Email already exists |
| 500 | Server Error | Database or email service error |

**Error Response Format:**
```json
{
  "statusCode": 400,
  "message": "OTP has expired. Please request a new one.",
  "error": "Bad Request"
}
```

---

## 🧪 Testing with cURL

### Complete Registration Flow
```bash
# 1. Register
curl -X POST http://localhost:4000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123456",
    "name": "Test User"
  }'

# 2. Verify OTP (check email for code)
curl -X POST http://localhost:4000/api/v1/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "otp": "123456"
  }'

# 3. Get current user (use token from step 2)
curl http://localhost:4000/api/v1/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

---

## 📧 Email Templates

### OTP Email
- **Subject:** "Verify Your Email - OTP Code"
- **Content:** HTML formatted with OTP code
- **Expiry:** 10 minutes
- **From:** Configured APP_NAME

### Welcome Email
- **Subject:** "Welcome to DOGFOOD OS!"
- **Content:** HTML formatted welcome message
- **Sent:** After successful OTP verification

---

## 🔐 Security Notes

1. **Tokens:** 30-day expiration, stored securely
2. **Passwords:** bcrypt hashed, never returned in responses
3. **OTP:** 6 digits, 10-minute expiry, one-time use
4. **Google OAuth:** Pre-verified, secure token exchange
5. **Sessions:** Server-side validation, can be revoked

---

## 🚀 Rate Limiting (Recommended)

Consider implementing rate limiting on:
- `/register` - 5 requests per hour per IP
- `/verify-otp` - 10 attempts per email per hour
- `/resend-otp` - 3 requests per email per hour
- `/login` - 10 attempts per IP per 15 minutes

---

## 📝 Notes

- All timestamps are in ISO 8601 format (UTC)
- Email addresses are case-insensitive
- Passwords must be at least 8 characters
- Role defaults to "PARTICIPANT" if not specified
- Google accounts bypass OTP verification

---

## 🆘 Support

For issues or questions:
- Check `SETUP_GUIDE.md` for configuration help
- Review error messages for specific guidance
- Ensure environment variables are correctly set

