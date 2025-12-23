# Tumblr API Setup Guide

## Quick Start (5 minutes)

### Step 1: Register Your Application

1. Go to **https://www.tumblr.com/oauth/apps**
2. Log in to your Tumblr account
3. Click **"Register application"**

### Step 2: Fill Out the Registration Form

**Required fields:**
```
Application Name: Tumblr T3 Dev (or your preferred name)
Application Website: http://localhost:5173
Application Description: Modern Tumblr web client
Default callback URL: http://localhost:5173/callback
```

**Important:** Make sure the port matches your dev server (default: 5173)

### Step 3: Get Your API Key

After submitting, you'll receive:
- **OAuth Consumer Key** ← This is your API key!
- OAuth Consumer Secret (not needed for public API access)

Copy the **OAuth Consumer Key**.

### Step 4: Create `.env` File

In the root of your project, create a file named `.env`:

```bash
# .env
VITE_TUMBLR_API_KEY=your_oauth_consumer_key_here
```

Replace `your_oauth_consumer_key_here` with the actual key you copied.

**Example:**
```bash
VITE_TUMBLR_API_KEY=DoGb8rItuAEprogDCbu7bMuDVWk02y5DUyuwB7N29XFlwns5Kh
```

**Note:** Never commit the `.env` file to Git! It's already in `.gitignore`.

### Step 5: Restart the Dev Server

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

## What You Can Do Now

With just the API key (no OAuth), you can:

✅ **Fetch public blog posts**
```
Visit: http://localhost:5173/blog/staff
Visit: http://localhost:5173/blog/photography
```

✅ **Search by tags**
```
Search for: #photography, #art, #nature
```

✅ **Browse blog content**
```
View any public Tumblr blog
```

✅ **Get blog information**
```
View follower counts, post counts, descriptions
```

## What You CANNOT Do (API Key Only)

❌ Access user dashboard (requires OAuth)  
❌ Like/unlike posts (requires OAuth)  
❌ Reblog posts (requires OAuth)  
❌ Create posts (requires OAuth)  
❌ Access private blogs (requires OAuth)  

## Testing the Integration

1. **Check if API key is working:**
   - Open browser console (F12)
   - Look for: `[Tumblr API] Fetching posts from...`
   - Should see: `[Tumblr API] Fetched X posts`

2. **Try a popular blog:**
   - Go to: `http://localhost:5173/blog/staff`
   - Should load real Tumblr posts!

3. **Try tag search:**
   - Search for `#photography`
   - Should show real tagged posts from Tumblr

## Troubleshooting

### "Using Mock Data" Warning

**Problem**: You see a yellow banner with mock data instead of real Tumblr posts.

**Solution**:
1. Check `.env` file exists in project root (not in `src/` or elsewhere)
2. Check API key is correct (copy-paste from Tumblr)
3. Restart dev server completely (`Ctrl+C`, then `npm run dev`)
4. Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
5. Check browser console for error messages

### "401 Unauthorized" Error

**Problem**: Tumblr API is rejecting your key.

**Possible causes:**
1. **Wrong API key** - Double-check the key in `.env`
2. **Wrong port** - App website URL must match dev server port (5173)
3. **App not activated** - New apps may take 5-10 minutes to activate
4. **Rate limit button** - You may need to click "Request rate limit removal"

**Solution**:
1. Verify `.env` has correct key (no spaces, no quotes)
2. Check Tumblr app settings match: `http://localhost:5173`
3. Wait 10 minutes after registration
4. Try clicking "Request rate limit removal" in Tumblr app settings
5. Check your email for verification requests from Tumblr

### "429 Too Many Requests" Error

**Problem**: Tumblr API rate limit exceeded.

**Solution**:
- Newly registered apps: 1,000 requests/hour, 5,000 requests/day
- Wait a few minutes before retrying
- The app has caching built-in to minimize API calls

### Blog Not Loading

**Problem**: Blog returns empty or error.

**Solution**:
- Check blog name is correct (use just `staff`, not `staff.tumblr.com`)
- Blog might be private (requires OAuth)
- Blog might not exist or be deleted

### Environment Variable Not Loading

**Problem**: App still shows mock data after adding `.env`.

**Solution**:
1. `.env` file must be in project root (same directory as `package.json`)
2. File must be named exactly `.env` (not `.env.txt` or `env`)
3. No spaces around `=`: `VITE_TUMBLR_API_KEY=yourkey`
4. Must restart dev server (HMR doesn't reload env vars)
5. Check terminal output on startup to verify environment is loaded

## API Rate Limits

**Newly Registered Apps (API Key Only):**
- **1,000 requests per hour**
- **5,000 requests per day**

**After Rate Limit Removal:**
- Higher limits (varies based on app usage)

**With OAuth (Future Enhancement):**
- 5,000 requests per day per user
- 250 requests per hour per user

The app includes intelligent caching to stay well under these limits.

## Next Steps

### Want Full Tumblr Integration?

To access authenticated features (dashboard, likes, reblog, posting), you'll need to implement **OAuth 1.0a**. This requires:

1. Backend OAuth endpoints
2. HMAC-SHA1 signature generation
3. Access token storage and management
4. Frontend OAuth authorization flow
5. Token refresh mechanism

This is a more complex integration beyond the scope of quick setup.

## Support

If you encounter issues:
1. Check browser console (F12) for API errors
2. Verify `.env` file is in project root (not in `src/`)
3. Confirm API key is valid at https://www.tumblr.com/oauth/apps
4. Ensure app website URL matches dev server port
5. Restart dev server completely
6. Hard refresh browser

**Current Version**: v1.3.1

## Security Notes

- Never commit `.env` to version control (already in `.gitignore`)
- Never share your OAuth Consumer Key publicly
- For production, use environment variables on your hosting platform
- API key alone is safe for client-side use (public data only)
