# Quick Start Guide - Security Implementation

## 🚀 Get Started in 5 Steps (30 minutes)

### Step 1: Generate Secrets (2 minutes)

```bash
# Run this 3 times to generate 3 different secrets
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 2: Update .env (2 minutes)

Add these to your `.env` file:
```bash
JWT_SECRET=<paste_first_secret>
JWT_REFRESH_SECRET=<paste_second_secret>
ENCRYPTION_SECRET=<paste_third_secret>
ALLOWED_ORIGINS=http://localhost:5173
```

### Step 3: Run Migration (2 minutes)

```bash
npx prisma migrate dev --name security_improvements
```

### Step 4: Update server/index.ts (15 minutes)

Add at the top:
```typescript
import cookieParser from 'cookie-parser';
import compression from 'compression';
import {
  validateEnvironment,
  getHelmetConfig,
  getCorsOptions,
  apiLimiter,
  requireAuth,
  setAuthCookies,
  clearAuthCookies,
  generateTokenPair,
  sanitizeUser
} from './middleware/security.js';
import { errorHandler, notFoundHandler, asyncHandler } from './middleware/errorHandler.js';
import healthRoutes from './routes/health.js';
```

Add after express app creation:
```typescript
// Validate environment
validateEnvironment();

// Security middleware
app.use(getHelmetConfig());
app.use(compression());
app.use(cookieParser());
app.use(cors(getCorsOptions()));

// Rate limiting
app.use('/api/', apiLimiter);

// Body parser
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

Update login endpoint:
```typescript
app.post('/api/auth/login', async (req, res) => {
  // ... your existing auth logic ...
  
  // After successful authentication:
  const tokens = generateTokenPair({
    userId: user.id,
    email: user.email,
    role: user.role
  });
  
  setAuthCookies(res, tokens);
  res.json(sanitizeUser(user));
});
```

Add logout endpoint:
```typescript
app.post('/api/auth/logout', (req, res) => {
  clearAuthCookies(res);
  res.json({ message: 'Logged out' });
});
```

Add health routes:
```typescript
app.use('/', healthRoutes);
```

Add error handlers (LAST middleware):
```typescript
app.use(notFoundHandler);
app.use(errorHandler);
```

### Step 5: Test (5 minutes)

```bash
# Start server
npm run server

# Should see: ✅ Environment variables validated

# Test health check
curl http://localhost:3001/health
# Should return: {"status":"healthy",...}

# Test login (use your actual credentials)
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername":"youruser","password":"yourpass"}' \
  -c cookies.txt

# Should set cookies and return user data
```

---

## ✅ What You Get

- 🔐 JWT authentication with httpOnly cookies
- 🛡️ Rate limiting (prevents brute force)
- 🔒 Security headers (Helmet)
- ✅ Input validation (Zod schemas)
- 🔑 OAuth token encryption
- 📊 Health check endpoints
- ⚠️ Centralized error handling
- 🚫 CSRF protection (SameSite cookies)

---

## 📖 Full Documentation

- **Complete Guide:** `SECURITY_IMPLEMENTATION.md`
- **Status & Checklist:** `PRIORITY_1_SUMMARY.md`
- **Full Roadmap:** `IMPLEMENTATION_ROADMAP.md`
- **Environment Setup:** `ENV_SETUP.md`

---

## 🆘 Quick Troubleshooting

**"Environment validation failed"**
→ Check `.env` has all 3 secrets (32+ characters each)

**"Migration failed"**
→ Backup database, check Prisma schema, try `npx prisma format`

**"Server won't start"**
→ Check TypeScript imports end with `.js` (ES modules)

**"Cookies not working"**
→ Check `credentials: 'include'` in frontend fetch calls

---

## ⚠️ Important Notes

1. **Don't commit .env** - it's already in .gitignore
2. **Use different secrets** - JWT_SECRET ≠ ENCRYPTION_SECRET
3. **Test thoroughly** - especially auth flows
4. **Backup database** - before running migrations
5. **Update frontend** - to use cookie-based auth

---

## 🔄 Next Steps

After basic integration works:
1. Add validation middleware to all routes
2. Protect routes with `requireAuth`
3. Update OAuth to use encryption
4. Update frontend authentication
5. Add comprehensive tests

See `IMPLEMENTATION_ROADMAP.md` for full plan.

---

**Need help?** Check the full documentation files or review the error logs.






