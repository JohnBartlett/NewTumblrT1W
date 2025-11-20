# Security Implementation Guide - Priority 1

This document outlines all security hardening changes for the Tumblr T3 application.

## 📋 Overview

**Status:** ✅ Files Created, ⚠️ Migration & Integration Pending

**What Was Implemented:**
1. ✅ JWT-based authentication system
2. ✅ OAuth token encryption utilities
3. ✅ Comprehensive input validation (Zod schemas)
4. ✅ Rate limiting middleware
5. ✅ Security headers (Helmet)
6. ✅ Updated Prisma schema with security improvements
7. ✅ CSRF protection ready
8. ✅ Request sanitization
9. ✅ Soft delete support

---

## 🔐 Security Features Implemented

### 1. JWT Authentication System

**File:** `server/middleware/security.ts`

**Features:**
- ✅ Access tokens (15 minutes expiry)
- ✅ Refresh tokens (7 days expiry)
- ✅ HttpOnly cookies (not accessible via JavaScript)
- ✅ Secure cookies (HTTPS in production)
- ✅ SameSite=strict (CSRF protection)
- ✅ Token verification with issuer/audience checks
- ✅ Auto-refresh token rotation

**Functions:**
```typescript
generateTokenPair(payload: JWTPayload): TokenPair
verifyAccessToken(token: string): JWTPayload | null
verifyRefreshToken(token: string): { userId: string } | null
setAuthCookies(res: Response, tokens: TokenPair)
clearAuthCookies(res: Response)
```

**Middleware:**
```typescript
requireAuth(req, res, next) // Protect routes
requireRole(...roles) // Role-based access control
```

### 2. OAuth Token Encryption

**File:** `server/utils/encryption.ts`

**Features:**
- ✅ AES-256-GCM encryption
- ✅ PBKDF2 key derivation (100,000 iterations)
- ✅ Random IV and salt per encryption
- ✅ Authentication tags for integrity
- ✅ Constant-time comparison (timing attack prevention)

**Functions:**
```typescript
encrypt(plaintext: string): string
decrypt(encryptedData: string): string
encryptOAuthTokens(token, tokenSecret)
decryptOAuthTokens(encryptedToken, encryptedTokenSecret)
hash(input: string): string
generateSecureToken(length: number): string
constantTimeCompare(a: string, b: string): boolean
```

**Usage:**
```typescript
// Before storing OAuth tokens
const { encryptedToken, encryptedTokenSecret } = encryptOAuthTokens(
  accessToken,
  accessTokenSecret
);

// When retrieving OAuth tokens
const { token, tokenSecret } = decryptOAuthTokens(
  user.tumblrOAuthToken,
  user.tumblrOAuthTokenSecret
);
```

### 3. Input Validation

**File:** `server/middleware/validation.ts`

**Schemas Created:**
- ✅ `registerSchema` - User registration
- ✅ `loginSchema` - User login
- ✅ `changePasswordSchema` - Password changes
- ✅ `passwordResetRequestSchema` - Password reset
- ✅ `passwordResetSchema` - Password reset completion
- ✅ `storeImageSchema` - Image storage (with limits)
- ✅ `updatePreferencesSchema` - User preferences
- ✅ `searchQuerySchema` - Search queries
- ✅ And 10+ more schemas

**Middleware:**
```typescript
validateBody(schema) // Validate request.body
validateParams(schema) // Validate request.params
validateQuery(schema) // Validate request.query
```

**Usage Example:**
```typescript
app.post('/api/auth/register',
  validateBody(registerSchema),
  async (req, res) => {
    // req.body is now validated and sanitized
  }
);
```

### 4. Rate Limiting

**File:** `server/middleware/security.ts`

**Limiters:**
```typescript
apiLimiter        // 100 requests per 15 minutes (general API)
authLimiter       // 5 login attempts per 15 minutes
strictLimiter     // 10 requests per hour (sensitive operations)
```

**Usage:**
```typescript
app.post('/api/auth/login', authLimiter, loginHandler);
app.use('/api/', apiLimiter);
```

### 5. Security Headers (Helmet)

**File:** `server/middleware/security.ts`

**Headers Configured:**
- ✅ Content Security Policy (CSP)
- ✅ HTTP Strict Transport Security (HSTS)
- ✅ X-Frame-Options: DENY
- ✅ X-Content-Type-Options: nosniff
- ✅ X-XSS-Protection: 1; mode=block
- ✅ Referrer-Policy: strict-origin-when-cross-origin

**Usage:**
```typescript
app.use(getHelmetConfig());
```

### 6. Database Security Improvements

**File:** `prisma/schema.prisma`

**Changes:**
1. ✅ Added `deletedAt` to User and StoredImage (soft deletes)
2. ✅ Added `onDelete: Cascade` to all foreign keys
3. ✅ Created normalized `Note` table (replaces JSON notesData)
4. ✅ Added security indexes (deletedAt, composite indexes)
5. ✅ Added comments about encrypted fields

**New Note Table:**
```prisma
model Note {
  id              String   @id @default(uuid())
  userId          String
  storedImageId   String
  type            String   // like, reblog, comment, posted
  blogName        String
  avatarUrl       String?
  timestamp       DateTime?
  replyText       String?
  reblogParentBlog String?
  createdAt       DateTime @default(now())
  
  user         User         @relation(...)
  storedImage  StoredImage  @relation(...)
  
  @@index([userId])
  @@index([storedImageId])
  @@index([blogName])
  @@index([type])
}
```

### 7. Additional Security Features

**Sanitization:**
```typescript
sanitizeInput(input: string): string // Remove XSS attempts
sanitizeUser(user: any) // Remove sensitive fields from responses
```

**CORS Configuration:**
```typescript
getCorsOptions() // Environment-based CORS
```

**Request Size Limiting:**
```typescript
requestSizeLimit(maxSize: number) // Prevent DoS
```

**Environment Validation:**
```typescript
validateEnvironment() // Validate required env vars on startup
```

---

## 🔧 Integration Steps

### Step 1: Install Dependencies

Already installed:
```bash
npm install jsonwebtoken cookie-parser express-rate-limit helmet compression
npm install --save-dev @types/jsonwebtoken @types/cookie-parser
```

### Step 2: Set Up Environment Variables

**Create `.env` file with required secrets:**

```bash
# Generate secrets (run 3 times for 3 different secrets)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Add to `.env`:
```bash
JWT_SECRET=<generated_secret_1>
JWT_REFRESH_SECRET=<generated_secret_2>
ENCRYPTION_SECRET=<generated_secret_3>
ALLOWED_ORIGINS=http://localhost:5173
```

See `ENV_SETUP.md` for complete configuration.

### Step 3: Run Database Migration

**Create migration:**
```bash
npx prisma migrate dev --name security_improvements
```

This will:
- Add `deletedAt` columns
- Create `Note` table
- Add indexes
- Update foreign keys

### Step 4: Update server/index.ts

**Add imports at the top:**
```typescript
import cookieParser from 'cookie-parser';
import compression from 'compression';
import {
  validateEnvironment,
  getHelmetConfig,
  getCorsOptions,
  apiLimiter,
  authLimiter,
  requireAuth,
  requireRole,
  sanitizeUser,
} from './middleware/security.js';
import { validateBody, registerSchema, loginSchema } from './middleware/validation.js';
```

**Add middleware (before routes):**
```typescript
// Validate environment on startup
try {
  validateEnvironment();
} catch (error) {
  console.error('Environment validation failed:', error);
  process.exit(1);
}

// Security middleware
app.use(getHelmetConfig());
app.use(compression());
app.use(cookieParser());

// CORS with credentials
app.use(cors(getCorsOptions()));

// Rate limiting
app.use('/api/', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Body parser with size limits
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

**Update authentication routes:**
```typescript
import { generateTokenPair, setAuthCookies, clearAuthCookies } from './middleware/security.js';
import { encryptOAuthTokens, decryptOAuthTokens } from './utils/encryption.js';

// Register
app.post('/api/auth/register', 
  validateBody(registerSchema),
  async (req, res) => {
    // ... validation ...
    
    // Generate JWT tokens
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    // Set httpOnly cookies
    setAuthCookies(res, tokens);
    
    // Return user (sanitized)
    res.json(sanitizeUser(user));
  }
);

// Login
app.post('/api/auth/login',
  validateBody(loginSchema),
  async (req, res) => {
    // ... authentication ...
    
    const tokens = generateTokenPair({
      userId: user.id,
      email: user.email,
      role: user.role,
    });
    
    setAuthCookies(res, tokens);
    res.json(sanitizeUser(user));
  }
);

// Logout
app.post('/api/auth/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out successfully' });
});

// Refresh token
app.post('/api/auth/refresh', async (req, res) => {
  const refreshToken = req.cookies.refreshToken;
  
  if (!refreshToken) {
    return res.status(401).json({ error: 'No refresh token' });
  }
  
  const payload = verifyRefreshToken(refreshToken);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
  
  // Get user from database
  const user = await prisma.user.findUnique({
    where: { id: payload.userId }
  });
  
  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }
  
  // Generate new tokens
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
  
  setAuthCookies(res, tokens);
  res.json(sanitizeUser(user));
});
```

**Protect routes with middleware:**
```typescript
// Require authentication
app.get('/api/users/:id', requireAuth, async (req, res) => {
  const user = (req as any).user; // From middleware
  // ... handler ...
});

// Require admin role
app.delete('/api/admin/users/:id', 
  requireAuth,
  requireRole('ADMIN'),
  async (req, res) => {
    // ... handler ...
  }
);
```

**Encrypt OAuth tokens when storing:**
```typescript
app.post('/api/auth/tumblr/callback', async (req, res) => {
  // ... get access tokens from Tumblr ...
  
  const { encryptedToken, encryptedTokenSecret } = encryptOAuthTokens(
    accessToken,
    accessTokenSecret
  );
  
  await prisma.user.update({
    where: { id: userId },
    data: {
      tumblrOAuthToken: encryptedToken,
      tumblrOAuthTokenSecret: encryptedTokenSecret,
      tumblrUsername: tumblrUsername,
      tumblrConnectedAt: new Date()
    }
  });
});
```

**Decrypt OAuth tokens when using:**
```typescript
// When making Tumblr API calls
const user = await prisma.user.findUnique({ where: { id: userId } });

if (user.tumblrOAuthToken) {
  const { token, tokenSecret } = decryptOAuthTokens(
    user.tumblrOAuthToken,
    user.tumblrOAuthTokenSecret
  );
  
  // Use decrypted tokens with OAuth library
  oauth.get(url, token, tokenSecret, (error, data) => {
    // ...
  });
}
```

---

## 🧪 Testing Steps

### 1. Test Environment Validation

```bash
# Should fail without required env vars
npm run server

# Should succeed with all env vars
# Add JWT_SECRET, JWT_REFRESH_SECRET, ENCRYPTION_SECRET to .env
npm run server
```

### 2. Test Registration & Login

```bash
# Register new user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test1234"}'

# Should receive Set-Cookie headers with accessToken and refreshToken
```

### 3. Test Protected Routes

```bash
# Without cookie - should fail (401)
curl http://localhost:3001/api/users/123

# With cookie - should succeed
curl http://localhost:3001/api/users/123 \
  --cookie "accessToken=<your_token>"
```

### 4. Test Rate Limiting

```bash
# Try logging in 6 times quickly - 6th should fail
for i in {1..6}; do
  curl -X POST http://localhost:3001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"emailOrUsername":"test","password":"wrong"}'
done
```

### 5. Test Validation

```bash
# Should fail - password too short
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"test","password":"123"}'

# Should receive detailed validation errors
```

### 6. Test Encryption

```typescript
// In server console or test file
import { encrypt, decrypt } from './server/utils/encryption.js';

const secret = "my_oauth_token_secret";
const encrypted = encrypt(secret);
console.log('Encrypted:', encrypted); // Long hex string

const decrypted = decrypt(encrypted);
console.log('Decrypted:', decrypted); // "my_oauth_token_secret"
console.log('Match:', secret === decrypted); // true
```

---

## ⚠️ Breaking Changes

### 1. Authentication System Changed

**Before:** localStorage sessions
**After:** httpOnly cookie-based JWT

**Migration Required:**
- Update frontend to handle cookie-based auth
- Remove localStorage auth code
- Handle token refresh on 401 responses

### 2. OAuth Tokens Now Encrypted

**Before:** Stored in plain text
**After:** Encrypted with AES-256-GCM

**Migration Required:**
- Existing tokens in database need re-encryption
- Or prompt users to reconnect Tumblr accounts

### 3. API Responses Changed

**Before:** Included `passwordHash` in user objects
**After:** Sensitive fields removed

**Impact:** None (these should never have been exposed)

### 4. Database Schema Changes

**Before:** No soft deletes, no Note table
**After:** Soft deletes, normalized Note table

**Migration Required:**
- Run `npx prisma migrate dev`
- Migrate existing `notesData` JSON to Note table (optional)

---

## 🔒 Security Checklist

- [x] JWT authentication with httpOnly cookies
- [x] Token refresh mechanism
- [x] OAuth token encryption
- [x] Input validation (Zod schemas)
- [x] Rate limiting (auth, API, strict)
- [x] Security headers (Helmet)
- [x] CORS configuration
- [x] Request sanitization
- [x] Request size limits
- [x] Password strength validation
- [x] Sensitive data removal from responses
- [x] Cascade deletes
- [x] Soft deletes
- [x] Database indexes
- [x] Environment validation
- [ ] Frontend integration (pending)
- [ ] Database migration (pending)
- [ ] Testing (pending)
- [ ] Documentation update (pending)

---

## 📚 Next Steps

1. **Run database migration**
2. **Update frontend authentication**
3. **Test all authentication flows**
4. **Update documentation**
5. **Deploy to staging**
6. **Security audit**
7. **Production deployment**

---

## 🆘 Troubleshooting

### "Environment validation failed"
- Check that `.env` file exists
- Verify all required variables are set
- Ensure secrets are at least 32 characters

### "Failed to encrypt data"
- Check ENCRYPTION_SECRET is set correctly
- Verify Node.js version supports crypto

### "Invalid or expired token"
- Token may have expired (15 minutes for access tokens)
- Use refresh token to get new access token
- Check JWT_SECRET hasn't changed

### Rate limit errors
- Wait for the time window to pass
- Adjust rate limits in `security.ts` if needed
- Whitelist IPs in production if necessary

---

**Status:** ✅ Implementation Complete - Ready for Integration

**Next:** Integrate into server/index.ts and test thoroughly






