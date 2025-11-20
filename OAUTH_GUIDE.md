# Tumblr OAuth 1.0a Integration Guide

Complete guide for implementing authenticated Tumblr features using OAuth 1.0a.

## Overview

The application supports **two authentication modes**:

1. **API Key Mode** (Basic) - Public data access only
2. **OAuth Mode** (Advanced) - Full authenticated access

## What OAuth Enables

### Without OAuth (API Key Only):
- ✅ View public blog posts
- ✅ Search public blogs
- ✅ View public blog information
- ❌ Access user dashboard
- ❌ Like/unlike posts
- ❌ Reblog posts
- ❌ Create posts
- ❌ Access private blogs
- ❌ Access full notes data (limited to ~50 notes)

### With OAuth:
- ✅ **Everything above, plus:**
- ✅ Access authenticated user's dashboard
- ✅ Like/unlike posts on behalf of user
- ✅ Reblog posts to user's blog
- ✅ Create new posts
- ✅ Access private blogs user follows
- ✅ Higher API rate limits (per-user quotas)
- ✅ Full notes data access

---

## Setup Instructions

### Step 1: Get OAuth Credentials

1. Go to **https://www.tumblr.com/oauth/apps**
2. Click **"Register application"** (if you haven't already)
3. Fill out the form:
   ```
   Application Name: Tumblr T3 (or your name)
   Application Website: http://localhost:5173
   Application Description: Modern Tumblr web client
   Default callback URL: http://localhost:5173/auth/tumblr/callback
   ```
4. After registration, you'll receive:
   - **OAuth Consumer Key** (same as API key)
   - **OAuth Consumer Secret** ⚠️ (NEW - keep this secret!)

### Step 2: Configure Environment Variables

Add to your `.env` file:

```bash
# Required for OAuth
VITE_TUMBLR_API_KEY=your_oauth_consumer_key_here
TUMBLR_CONSUMER_SECRET=your_consumer_secret_here

# Optional: Custom callback URL (defaults to localhost:5173)
VITE_APP_URL=http://localhost:5173
```

**Important Security Notes:**
- ⚠️ **Never commit** `.env` to version control
- ⚠️ **Never expose** `TUMBLR_CONSUMER_SECRET` to the frontend
- ⚠️ Consumer Secret must **only** be used in backend code
- ✅ `.env` is already in `.gitignore`

### Step 3: Restart Development Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## OAuth Flow Architecture

### Complete OAuth 1.0a Flow

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   User      │         │  Your App    │         │   Tumblr    │
│  (Browser)  │         │  (Backend)   │         │   (OAuth)   │
└─────────────┘         └──────────────┘         └─────────────┘
       │                       │                         │
       │  1. Click "Connect"   │                         │
       ├──────────────────────>│                         │
       │                       │  2. Request Token       │
       │                       ├────────────────────────>│
       │                       │  3. Request Token +     │
       │                       │<────────────────────────┤
       │                       │     Secret              │
       │  4. Redirect to Auth  │                         │
       │<──────────────────────┤                         │
       │                       │                         │
       │  5. Authorize App     │                         │
       ├─────────────────────────────────────────────────>│
       │  6. Redirect to       │                         │
       │     Callback          │                         │
       │<─────────────────────────────────────────────────┤
       │  (with oauth_token    │                         │
       │   + oauth_verifier)   │                         │
       │                       │                         │
       │  7. Send token +      │                         │
       │     verifier          │                         │
       ├──────────────────────>│                         │
       │                       │  8. Exchange for        │
       │                       │     Access Token        │
       │                       ├────────────────────────>│
       │                       │  9. Access Token +      │
       │                       │<────────────────────────┤
       │                       │     Secret              │
       │                       │ 10. Save to DB          │
       │                       │                         │
       │  11. Connected!       │                         │
       │<──────────────────────┤                         │
```

### Technical Implementation

#### Frontend Flow (`src/components/ui/TumblrConnection.tsx`)

```typescript
// User clicks "Connect Tumblr Account"
const handleConnect = async () => {
  // 1. Request auth URL from backend
  const result = await connectTumblrAccount(userId);
  
  // 2. Open Tumblr auth in popup
  const authWindow = window.open(result.authUrl, ...);
  
  // 3. Store request token for callback verification
  localStorage.setItem('tumblr_oauth_request_token', result.requestToken);
  localStorage.setItem('tumblr_oauth_user_id', userId);
  
  // 4. Monitor popup closure
  const checkPopup = setInterval(() => {
    if (authWindow?.closed) {
      // Refresh connection status
      checkStatus();
    }
  }, 500);
};
```

#### Backend Flow (`server/index.ts`)

**Step 1: Get Request Token**
```typescript
POST /api/auth/tumblr/connect
Body: { userId: string }

Response: { 
  authUrl: "https://www.tumblr.com/oauth/authorize?oauth_token=...",
  requestToken: "..." 
}
```

**Step 2: Handle Callback**
```typescript
POST /api/auth/tumblr/callback
Body: { 
  userId: string,
  oauthToken: string,
  oauthVerifier: string 
}

Response: { 
  success: true,
  tumblrUsername: "yourname" 
}
```

**Step 3: Save Tokens to Database**
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    tumblrOAuthToken: accessToken,
    tumblrOAuthTokenSecret: accessTokenSecret,
    tumblrUsername: tumblrUsername,
    tumblrConnectedAt: new Date()
  }
});
```

---

## Using OAuth Endpoints

### Check Connection Status

```typescript
GET /api/auth/tumblr/status/:userId

Response: {
  connected: true,
  tumblrUsername: "yourname",
  connectedAt: "2025-10-26T12:00:00.000Z"
}
```

### Authenticated Blog Posts

```typescript
GET /api/tumblr/oauth/blog/:blogIdentifier/posts
Headers: { 'X-User-Id': userId }

// Returns posts using user's OAuth credentials
// Accesses private blogs if user follows them
```

### Authenticated Notes

```typescript
GET /api/tumblr/oauth/blog/:blogIdentifier/notes/:postId
Headers: { 'X-User-Id': userId }

// Returns FULL notes data (not limited to 50)
// Includes all likes, reblogs, and comments
```

### Disconnect Account

```typescript
POST /api/auth/tumblr/disconnect
Body: { userId: string }

// Removes OAuth tokens from database
// Reverts to API key mode
```

---

## Security Considerations

### Token Storage

**Backend (Secure):**
```typescript
// Tokens stored in PostgreSQL database
tumblrOAuthToken: string        // Access token
tumblrOAuthTokenSecret: string  // Access token secret
tumblrUsername: string          // Tumblr username
tumblrConnectedAt: DateTime     // Connection timestamp
```

**Frontend (Temporary Only):**
```typescript
// Only request token stored temporarily
localStorage.setItem('tumblr_oauth_request_token', requestToken);
// Cleared after callback completes
```

### Request Signing

All OAuth requests are signed using **HMAC-SHA1**:

```typescript
// Backend only (never expose to frontend)
const oauth = new OAuth(
  TUMBLR_REQUEST_TOKEN_URL,
  TUMBLR_ACCESS_TOKEN_URL,
  CONSUMER_KEY,
  CONSUMER_SECRET,  // ⚠️ Secret never sent to frontend
  '1.0A',
  CALLBACK_URL,
  'HMAC-SHA1'
);
```

### Token Lifecycle

1. **Request Token**: Temporary (1 hour), stored in memory on backend
2. **Access Token**: Permanent until revoked, stored in database
3. **Cleanup**: Old request tokens purged every hour

---

## User Interface

### Connection Card (`Settings > Tumblr Account`)

**When Not Connected:**
```
┌───────────────────────────────────────┐
│  Tumblr Account                       │
│  ─────────────────────────────────    │
│                                       │
│  Not connected                        │
│                                       │
│  Connect your Tumblr account to:     │
│  • Access your dashboard              │
│  • Like and reblog posts              │
│  • Create new posts                   │
│  • Access private blogs               │
│                                       │
│  [Connect Tumblr Account]             │
└───────────────────────────────────────┘
```

**When Connected:**
```
┌───────────────────────────────────────┐
│  Tumblr Account                       │
│  ─────────────────────────────────    │
│                                       │
│  ✓ Connected as @yourname            │
│  Connected on: Oct 26, 2025          │
│                                       │
│  [Disconnect Account]                │
└───────────────────────────────────────┘
```

---

## Troubleshooting

### "OAuth credentials not configured" Warning

**Problem:** Backend logs show credentials missing.

**Solution:**
1. Check `.env` file exists in project root
2. Verify both `VITE_TUMBLR_API_KEY` and `TUMBLR_CONSUMER_SECRET` are set
3. Restart backend server completely

### "OAuth token mismatch" Error

**Problem:** Callback fails with token mismatch.

**Solution:**
1. Clear localStorage: `localStorage.clear()`
2. Close all popup windows
3. Try connecting again
4. Check browser isn't blocking popups

### Callback URL Errors

**Problem:** Tumblr redirects to wrong URL.

**Solution:**
1. Verify callback URL in Tumblr app settings: `http://localhost:5173/auth/tumblr/callback`
2. Match port number with dev server (default: 5173)
3. For production, update to your domain

### Popup Blocked

**Problem:** Browser blocks OAuth popup.

**Solution:**
1. Allow popups for your domain
2. Check browser popup blocker settings
3. Try clicking "Connect" again after allowing

### Tokens Not Saving

**Problem:** Connection succeeds but tokens disappear.

**Solution:**
1. Check database connection
2. Verify Prisma schema includes OAuth fields
3. Run migrations: `npx prisma migrate dev`
4. Check server logs for database errors

---

## Rate Limits

### API Key Mode (No OAuth):
- 1,000 requests/hour
- 5,000 requests/day

### OAuth Mode:
- **Per-user limits**: 5,000 requests/day per user
- 250 requests/hour per user
- Cumulative across all OAuth users

### Best Practices:
1. Use OAuth for authenticated users
2. Use API key for public data
3. Cache responses aggressively
4. Monitor usage in Admin Dashboard

---

## Production Deployment

### Environment Variables

```bash
# Production .env
VITE_TUMBLR_API_KEY=your_key
TUMBLR_CONSUMER_SECRET=your_secret
VITE_APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://...
```

### Callback URL

Update Tumblr app settings:
```
Default callback URL: https://yourdomain.com/auth/tumblr/callback
```

### Security Checklist

- [ ] Consumer Secret never exposed to frontend
- [ ] HTTPS enabled for production
- [ ] Callback URL whitelisted in Tumblr app settings
- [ ] Database backups configured
- [ ] Token storage encrypted at rest (optional)
- [ ] Rate limiting implemented
- [ ] Error logging configured

---

## API Reference

### OAuth Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/tumblr/connect` | POST | Initiate OAuth flow |
| `/api/auth/tumblr/callback` | POST | Complete OAuth flow |
| `/api/auth/tumblr/disconnect` | POST | Disconnect account |
| `/api/auth/tumblr/status/:userId` | GET | Check connection status |
| `/api/tumblr/oauth/blog/:blog/posts` | GET | Get posts (authenticated) |
| `/api/tumblr/oauth/blog/:blog/notes/:postId` | GET | Get notes (authenticated) |

### Request Headers

```http
X-User-Id: user-uuid-here
```

Used to identify which user's OAuth tokens to use for authenticated requests.

---

## Future Enhancements

Potential OAuth features to implement:

- [ ] Like/unlike posts via API
- [ ] Reblog posts to user's blog
- [ ] Create new posts (text, photo, etc.)
- [ ] Access user's dashboard feed
- [ ] Follow/unfollow blogs
- [ ] Queue and draft management
- [ ] Blog settings management
- [ ] Analytics and insights

---

## Support

For OAuth-related issues:

1. Check browser console for errors
2. Check backend logs: `[OAuth]` prefix
3. Verify environment variables
4. Check database for saved tokens
5. Review Tumblr app settings

**Current Version**: v0.91.0

