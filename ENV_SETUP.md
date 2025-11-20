# Environment Variables Setup

Create a `.env` file in the project root with the following variables:

## Required Variables

```bash
# ===== Database Configuration =====
DATABASE_URL="postgresql://user:password@localhost:5432/tumblr_dev"

# ===== Security Secrets (REQUIRED - Generate strong random strings) =====
# Generate using: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# JWT Secret for access tokens (minimum 32 characters)
JWT_SECRET=your_32_character_or_longer_secret_here

# JWT Secret for refresh tokens (minimum 32 characters)
JWT_REFRESH_SECRET=your_32_character_or_longer_secret_here

# Encryption secret for OAuth tokens (minimum 32 characters)
ENCRYPTION_SECRET=your_32_character_or_longer_secret_here

# ===== Server Configuration =====
NODE_ENV=development
PORT=3001

# ===== Tumblr API Configuration =====
# Get these from: https://www.tumblr.com/oauth/apps
VITE_TUMBLR_API_KEY=your_tumblr_api_key
TUMBLR_CONSUMER_SECRET=your_tumblr_consumer_secret

# ===== Application URLs =====
VITE_APP_URL=http://localhost:5173
VITE_API_URL=http://localhost:3001

# ===== CORS Configuration =====
# Comma-separated list of allowed origins
ALLOWED_ORIGINS=http://localhost:5173
```

## Optional Variables

```bash
# ===== Email Configuration (for verification emails) =====
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# ===== Feature Flags =====
VITE_ENABLE_OFFLINE_MODE=true
VITE_ENABLE_PUSH_NOTIFICATIONS=false

# ===== Logging =====
LOG_LEVEL=info  # debug, info, warn, error

# ===== Rate Limiting =====
ENABLE_RATE_LIMITING=true

# ===== Additional Security =====
# Optional: IP whitelist (comma-separated)
# IP_WHITELIST=127.0.0.1,::1

# Optional: Basic auth (username:password)
# BASIC_AUTH=admin:secretpassword
```

## Production (Railway) Configuration

Railway automatically provides:
- `DATABASE_URL` - PostgreSQL connection string
- `RAILWAY_ENVIRONMENT` - Set to "production"
- `PORT` - Assigned port

You need to add as Railway variables:
- `JWT_SECRET`
- `JWT_REFRESH_SECRET`
- `ENCRYPTION_SECRET`
- `VITE_TUMBLR_API_KEY`
- `TUMBLR_CONSUMER_SECRET`
- `VITE_APP_URL` (your Railway URL)
- `ALLOWED_ORIGINS` (your Railway URL)

## Generating Secure Secrets

### Option 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Online (be careful with online generators)
Use a trusted password generator with at least 32 characters

## Security Notes

⚠️ **Never commit `.env` to git!**

✅ `.env` is already in `.gitignore`

✅ Each secret should be at least 32 characters

✅ Use different secrets for JWT_SECRET, JWT_REFRESH_SECRET, and ENCRYPTION_SECRET

✅ Store production secrets in Railway's environment variables (encrypted)

✅ Rotate secrets periodically in production






