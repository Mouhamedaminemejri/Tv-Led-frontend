# Authentication API Requirements

This document outlines all the API endpoints required for the authentication module to function properly.

## Base URL

```
{API_BASE_URL}/api
```

Configure via environment variable: `NEXT_PUBLIC_API_URL`

---

## ✅ Implemented Endpoints (Backend Ready)

| Endpoint | Method | Status |
|----------|--------|--------|
| `/auth/register` | POST | ✅ Ready |
| `/auth/login` | POST | ✅ Ready |
| `/auth/google` | GET | ✅ Ready |
| `/auth/google/callback` | GET | ✅ Ready |
| `/auth/facebook` | GET | ✅ Ready |
| `/auth/facebook/callback` | GET | ✅ Ready |
| `/auth/apple` | GET | 🚧 Placeholder |
| `/auth/profile` | GET | ✅ Ready |
| `/auth/profile` | PUT | ✅ Ready |
| `/auth/change-password` | PUT | ✅ Ready |

## 🔜 Optional Endpoints (For Future Implementation)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/logout` | POST | Invalidate tokens |
| `/auth/refresh` | POST | Refresh access token |
| `/auth/forgot-password` | POST | Request password reset |
| `/auth/reset-password` | POST | Reset password with token |
| `/auth/verify-email` | POST | Verify email address |
| `/auth/resend-verification` | POST | Resend verification email |

---

## 1. Authentication Endpoints

### 1.1 Login

**POST** `/auth/login`

Authenticate user with email and password.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123",
    "rememberMe": true
}
```

**Response (200 OK):**
```json
{
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://...",
        "phone": "+216XXXXXXXX",
        "emailVerified": true,
        "provider": "local",
        "role": "customer",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
}
```

**Error Responses:**
- `401` - Invalid credentials
- `403` - Email not verified
- `423` - Account locked

---

### 1.2 Register

**POST** `/auth/register`

Create a new user account.

**Request Body:**
```json
{
    "email": "user@example.com",
    "password": "password123",
    "confirmPassword": "password123",
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+216XXXXXXXX",
    "acceptTerms": true,
    "subscribeNewsletter": false
}
```

**Response (201 Created):**
```json
{
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "emailVerified": false,
        "provider": "local",
        "role": "customer",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
    },
    "message": "Registration successful. Please check your email to verify your account.",
    "requiresVerification": true
}
```

**Error Responses:**
- `400` - Validation error (weak password, invalid email, etc.)
- `409` - Email already exists

---

### 1.3 Logout

**POST** `/auth/logout`

Invalidate user session and tokens.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
    "message": "Logged out successfully"
}
```

---

### 1.4 Get Current User

**GET** `/auth/me`

Get authenticated user's profile.

**Headers:**
```
Authorization: Bearer {accessToken}
```

**Response (200 OK):**
```json
{
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://...",
        "phone": "+216XXXXXXXX",
        "emailVerified": true,
        "provider": "local",
        "role": "customer",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
    }
}
```

**Error Responses:**
- `401` - Unauthorized (invalid/expired token)

---

### 1.5 Refresh Token

**POST** `/auth/refresh`

Refresh access token using refresh token.

**Request Body:**
```json
{
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response (200 OK):**
```json
{
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600
}
```

**Error Responses:**
- `401` - Invalid refresh token
- `403` - Refresh token expired

---

## 2. Password Reset Endpoints

### 2.1 Forgot Password

**POST** `/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
    "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
    "message": "If an account with that email exists, we've sent password reset instructions.",
    "expiresIn": 3600
}
```

> **Note:** Always return success to prevent email enumeration attacks.

---

### 2.2 Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
    "token": "reset-token-from-email",
    "password": "newPassword123",
    "confirmPassword": "newPassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Password reset successfully",
    "success": true
}
```

**Error Responses:**
- `400` - Validation error (weak password, passwords don't match)
- `400` - Invalid token (code: `INVALID_TOKEN`)
- `400` - Token expired (code: `TOKEN_EXPIRED`)

---

## 3. Email Verification Endpoints

### 3.1 Verify Email

**POST** `/auth/verify-email`

Verify user's email address.

**Request Body:**
```json
{
    "token": "verification-token-from-email"
}
```

**Response (200 OK):**
```json
{
    "message": "Email verified successfully",
    "user": {
        "id": "uuid",
        "email": "user@example.com",
        "emailVerified": true,
        ...
    }
}
```

**Error Responses:**
- `400` - Invalid token (code: `INVALID_TOKEN`)
- `400` - Token expired (code: `TOKEN_EXPIRED`)
- `400` - Already verified (code: `ALREADY_VERIFIED`)

---

### 3.2 Resend Verification Email

**POST** `/auth/resend-verification`

Resend email verification link.

**Request Body:**
```json
{
    "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
    "message": "Verification email sent",
    "expiresIn": 3600
}
```

**Error Responses:**
- `400` - Email already verified
- `429` - Too many requests (rate limited)

---

## 4. OAuth Endpoints

### 4.1 Google OAuth Redirect

**GET** `/auth/oauth/google`

Redirect user to Google OAuth consent screen.

**Query Parameters:**
- `redirect_uri`: URL to redirect after OAuth (e.g., `http://localhost:3000/auth/callback`)

**Response:** 302 Redirect to Google OAuth

---

### 4.2 Facebook OAuth Redirect

**GET** `/auth/oauth/facebook`

Redirect user to Facebook OAuth consent screen.

**Query Parameters:**
- `redirect_uri`: URL to redirect after OAuth (e.g., `http://localhost:3000/auth/callback`)

**Response:** 302 Redirect to Facebook OAuth

---

### 4.3 OAuth Callback

**POST** `/auth/oauth/callback`

Handle OAuth callback and exchange code for tokens.

**Request Body:**
```json
{
    "provider": "google",
    "code": "authorization-code-from-provider"
}
```

**Response (200 OK):**
```json
{
    "user": {
        "id": "uuid",
        "email": "user@gmail.com",
        "firstName": "John",
        "lastName": "Doe",
        "avatar": "https://lh3.googleusercontent.com/...",
        "emailVerified": true,
        "provider": "google",
        "role": "customer",
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-01-01T00:00:00Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": 3600,
    "isNewUser": false
}
```

**Error Responses:**
- `400` - Invalid authorization code
- `409` - Email already registered with different provider

---

## 5. Error Response Format

All error responses should follow this format:

```json
{
    "code": "ERROR_CODE",
    "message": "Human-readable error message",
    "field": "fieldName",
    "details": {
        "email": ["Email is already in use"],
        "password": ["Password must be at least 8 characters"]
    }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `VALIDATION_ERROR` | 400 | Request validation failed |
| `INVALID_CREDENTIALS` | 401 | Wrong email or password |
| `UNAUTHORIZED` | 401 | Missing or invalid token |
| `EMAIL_NOT_VERIFIED` | 403 | Email verification required |
| `ACCOUNT_LOCKED` | 423 | Account is locked |
| `INVALID_TOKEN` | 400 | Token is invalid |
| `TOKEN_EXPIRED` | 400 | Token has expired |
| `EMAIL_EXISTS` | 409 | Email already registered |
| `ALREADY_VERIFIED` | 400 | Email already verified |
| `RATE_LIMITED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |

---

## 6. Security Requirements

### Token Configuration

| Token Type | Expiration | Storage |
|------------|------------|---------|
| Access Token | 1 hour | localStorage |
| Refresh Token | 30 days | localStorage (with `rememberMe`) or 7 days (without) |
| Reset Token | 1 hour | N/A (email link) |
| Verification Token | 24 hours | N/A (email link) |

### Password Requirements

- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (recommended)

### Rate Limiting

| Endpoint | Limit |
|----------|-------|
| `/auth/login` | 5 requests per minute per IP |
| `/auth/forgot-password` | 3 requests per hour per email |
| `/auth/resend-verification` | 3 requests per hour per email |

---

## 7. OAuth Provider Configuration

### Google OAuth

Required scopes:
- `openid`
- `email`
- `profile`

### Facebook OAuth

Required permissions:
- `email`
- `public_profile`

---

## 8. Email Templates Required

1. **Email Verification**
   - Subject: "Verify your email address"
   - Contains: Verification link with token

2. **Password Reset**
   - Subject: "Reset your password"
   - Contains: Reset link with token, expiration notice

3. **Welcome Email** (optional)
   - Subject: "Welcome to TV Partner!"
   - Sent after successful registration

4. **Password Changed Notification** (optional)
   - Subject: "Your password was changed"
   - Security notification after password reset

---

## 9. Implementation Checklist

- [ ] Implement all authentication endpoints
- [ ] Set up JWT token generation and validation
- [ ] Configure OAuth providers (Google, Facebook)
- [ ] Set up email service for verification and password reset
- [ ] Implement rate limiting
- [ ] Add proper error handling and logging
- [ ] Set up CORS for frontend domains
- [ ] Implement password hashing (bcrypt recommended)
- [ ] Add refresh token rotation for security
- [ ] Set up account lockout after failed attempts
