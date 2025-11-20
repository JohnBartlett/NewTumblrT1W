import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import sharp from 'sharp';
import * as tumblrOAuth from './tumblrOAuth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Constants
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const PASSWORD_RESET_EXPIRY = 60 * 60 * 1000; // 1 hour in milliseconds

// Helper functions
const generateToken = () => crypto.randomBytes(32).toString('hex');

const validatePassword = (password: string): { valid: boolean; error?: string } => {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { valid: false, error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one letter' };
  }
  if (!/\d/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }
  return { valid: true };
};

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for bulk image downloads
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve static files from the React app (production)
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../dist')));
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Emergency stop endpoint
app.post('/api/emergency-stop', async (req, res) => {
  console.log('[EMERGENCY] 🚨 Emergency stop requested');
  
  try {
    // Log the emergency stop
    console.log('[EMERGENCY] ⚠️ Emergency stop initiated at:', new Date().toISOString());
    
    // In a real implementation, you might want to:
    // 1. Cancel any ongoing database operations
    // 2. Clear any queues or background jobs
    // 3. Reset rate limiters
    // 4. Force garbage collection
    
    // For now, just acknowledge the request
    console.log('[EMERGENCY] ✅ Emergency stop acknowledged');
    
    res.json({ 
      success: true,
      message: 'Emergency stop acknowledged',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[EMERGENCY] ❌ Emergency stop error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Emergency stop failed',
    });
  }
});

// Tumblr API Proxy - Handles CORS by proxying through backend
const TUMBLR_API_KEY = process.env.VITE_TUMBLR_API_KEY;

// API Call Tracking for Admin Dashboard
// Function to increment API call counter (now persists to database!)
async function incrementApiCallCounter() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Use upsert to create or update today's record
    const stats = await prisma.apiCallStats.upsert({
      where: { date: today },
      update: {
        count: { increment: 1 },
      },
      create: {
        date: today,
        count: 1,
      },
    });
    
    console.log(`[API Tracker] 📊 API call #${stats.count} today (${today})`);
    return stats;
  } catch (error) {
    console.error('[API Tracker] ❌ Error updating counter:', error);
    throw error;
  }
}

// Function to get API stats (now reads from database!)
async function getApiStats() {
  const today = new Date().toISOString().split('T')[0];
  
  try {
    // Get or create today's stats record
    const stats = await prisma.apiCallStats.upsert({
      where: { date: today },
      update: {},
      create: {
        date: today,
        count: 0,
      },
    });
    
    const limit = 5000; // Tumblr's typical daily limit
    const percentage = (stats.count / limit) * 100;
    
    // Calculate reset time (midnight tonight)
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    const resetTime = midnight.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    
    return {
      date: stats.date,
      count: stats.count,
      limit,
      percentage: Math.round(percentage * 10) / 10,
      resetTime,
    };
  } catch (error) {
    console.error('[API Tracker] ❌ Error getting stats:', error);
    // Return safe fallback
    return {
      date: today,
      count: 0,
      limit: 5000,
      percentage: 0,
      resetTime: '12:00 AM',
    };
  }
}

// Avatar proxy endpoint (with size parameter)
app.get('/api/tumblr/blog/:blogIdentifier/avatar/:size', async (req, res) => {
  try {
    const { blogIdentifier, size } = req.params;
    const avatarUrl = `https://api.tumblr.com/v2/blog/${blogIdentifier}/avatar/${size}`;
    
    // Fetch the avatar URL (this will be a redirect)
    const response = await fetch(avatarUrl, { redirect: 'follow' });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch avatar' });
    }
    
    // Get the final URL after redirects
    const finalUrl = response.url;
    
    // Redirect to the actual image URL
    res.redirect(finalUrl);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
});

// Avatar proxy endpoint (default size)
app.get('/api/tumblr/blog/:blogIdentifier/avatar', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const avatarUrl = `https://api.tumblr.com/v2/blog/${blogIdentifier}/avatar/128`;
    
    // Fetch the avatar URL (this will be a redirect)
    const response = await fetch(avatarUrl, { redirect: 'follow' });
    
    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch avatar' });
    }
    
    // Get the final URL after redirects
    const finalUrl = response.url;
    
    // Redirect to the actual image URL
    res.redirect(finalUrl);
  } catch (error) {
    console.error('Avatar proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch avatar' });
  }
});

app.get('/api/tumblr/blog/:blogIdentifier/info', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const { userId } = req.query;
    
    incrementApiCallCounter(); // Track API call
    
    // Try OAuth first if userId is provided
    if (userId && typeof userId === 'string') {
      try {
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { tumblrOAuthToken: true, tumblrOAuthTokenSecret: true }
        });
        
        if (user?.tumblrOAuthToken && user?.tumblrOAuthTokenSecret) {
          console.log(`[OAuth] Fetching blog info with OAuth for ${blogIdentifier}`);
          const data = await tumblrOAuth.getBlogInfo(
            blogIdentifier,
            user.tumblrOAuthToken,
            user.tumblrOAuthTokenSecret
          );
          // Note: Blog info endpoint doesn't include follower/following counts
          // Those must be fetched separately from /user/following and /blog/{blog}/followers
          return res.json(data);
        } else {
          console.log(`[OAuth] No OAuth tokens found for user ${userId}`);
        }
      } catch (oauthError) {
        console.error('[OAuth] Failed to fetch with OAuth, falling back to API key:', oauthError);
      }
    }
    
    // Fallback to API key
    const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/info?api_key=${TUMBLR_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Tumblr API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Tumblr API' });
  }
});

// Search Tumblr by tag
app.get('/api/tumblr/tagged', async (req, res) => {
  try {
    const { tag, before, limit = '20', filter = 'text' } = req.query;
    
    if (!tag) {
      return res.status(400).json({ error: 'Tag parameter is required' });
    }
    
    const params = new URLSearchParams({
      tag: tag as string,
      api_key: TUMBLR_API_KEY,
      limit: limit as string,
      filter: filter as string,
    });
    
    if (before) {
      params.append('before', before as string);
    }
    
    const url = `https://api.tumblr.com/v2/tagged?${params}`;
    
    console.log(`[Tumblr API] Searching for tag: "${tag}"`);
    incrementApiCallCounter(); // Track API call
    
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Tumblr tagged search error:', error);
    res.status(500).json({ error: 'Failed to search Tumblr' });
  }
});

// Fetch ALL notes for a specific post (paginated)
app.get('/api/tumblr/blog/:blogIdentifier/post/:postId/notes', async (req, res) => {
  try {
    const { blogIdentifier, postId } = req.params;
    const { mode = 'all' } = req.query; // 'all', 'likes', 'conversation', 'rollup', 'reblogs_with_tags'
    
    // Tumblr Notes Timeline API endpoint
    const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/notes?id=${postId}&mode=${mode}`;
    
    console.log(`[Tumblr API] Fetching ALL notes for post ${postId} from ${blogIdentifier}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Tumblr API] Notes fetch failed: ${response.status} ${response.statusText}`);
      return res.status(response.status).json({ error: 'Failed to fetch notes from Tumblr' });
    }
    
    const html = await response.text();
    
    // The Notes API returns HTML, not JSON. We need to parse it or return raw HTML
    // For now, let's check if there's a JSON endpoint version
    try {
      const jsonData = JSON.parse(html);
      res.json(jsonData);
    } catch (e) {
      // If it's HTML, we need to parse it or use a different approach
      console.log('[Tumblr API] Notes endpoint returned HTML, checking for JSON API...');
      
      // Try the v2 API with api_key
      const jsonUrl = `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?id=${postId}&api_key=${TUMBLR_API_KEY}&notes_info=true`;
      const jsonResponse = await fetch(jsonUrl);
      const jsonData = await jsonResponse.json();
      
      res.json(jsonData);
    }
  } catch (error) {
    console.error('[Tumblr API] Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

app.get('/api/tumblr/blog/:blogIdentifier/posts', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const { limit = '20', offset = '0', type, tag, before, notes_info = 'true' } = req.query;
    
    const params = new URLSearchParams({
      api_key: TUMBLR_API_KEY || '',
      limit: String(limit),
      offset: String(offset),
      notes_info: String(notes_info), // Pass through notes_info parameter!
    });
    
    if (type) params.append('type', String(type));
    if (tag) params.append('tag', String(tag));
    if (before) params.append('before', String(before));
    
    const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?${params}`;
    
    incrementApiCallCounter(); // Track API call
    console.log(`[Tumblr API Proxy] Fetching ${blogIdentifier} with notes_info=${notes_info}`);
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Tumblr API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Tumblr API' });
  }
});

app.get('/api/tumblr/tagged', async (req, res) => {
  try {
    const { tag, limit = '20', before, filter } = req.query;
    
    if (!tag) {
      return res.status(400).json({ error: 'Tag parameter is required' });
    }

    const params = new URLSearchParams({
      api_key: TUMBLR_API_KEY || '',
      tag: String(tag),
      limit: String(limit),
    });
    
    if (before) params.append('before', String(before));
    if (filter) params.append('filter', String(filter));
    
    const url = `https://api.tumblr.com/v2/tagged?${params}`;

    incrementApiCallCounter(); // Track API call
    const response = await fetch(url);
    const data = await response.json();
    
    res.json(data);
  } catch (error) {
    console.error('Tumblr API proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch from Tumblr API' });
  }
});

// ===== TUMBLR OAUTH ENDPOINTS =====

// Step 1: Initiate OAuth flow
app.post('/api/auth/tumblr/connect', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Verify user exists
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Get request token and auth URL
    const { token, tokenSecret, authUrl } = await tumblrOAuth.getRequestToken();
    
    console.log(`[OAuth] User ${user.username} initiating Tumblr connection`);
    
    res.json({ authUrl, requestToken: token });
  } catch (error) {
    console.error('[OAuth] Error initiating connection:', error);
    res.status(500).json({ error: 'Failed to initiate Tumblr connection' });
  }
});

// Step 2: Handle OAuth callback
app.post('/api/auth/tumblr/callback', async (req, res) => {
  try {
    const { userId, oauthToken, oauthVerifier } = req.body;
    
    if (!userId || !oauthToken || !oauthVerifier) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    // Exchange for access token
    const { accessToken, accessTokenSecret, tumblrUsername } = await tumblrOAuth.getAccessToken(
      oauthToken,
      oauthVerifier
    );
    
    // Save tokens to database
    await prisma.user.update({
      where: { id: userId },
      data: {
        tumblrOAuthToken: accessToken,
        tumblrOAuthTokenSecret: accessTokenSecret,
        tumblrUsername: tumblrUsername,
        tumblrConnectedAt: new Date()
      }
    });
    
    console.log(`[OAuth] User ${userId} successfully connected Tumblr account: ${tumblrUsername}`);
    
    res.json({ 
      success: true,
      tumblrUsername 
    });
  } catch (error) {
    console.error('[OAuth] Error handling callback:', error);
    res.status(500).json({ error: 'Failed to complete Tumblr connection' });
  }
});

// Disconnect Tumblr account
app.post('/api/auth/tumblr/disconnect', async (req, res) => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    await prisma.user.update({
      where: { id: userId },
      data: {
        tumblrOAuthToken: null,
        tumblrOAuthTokenSecret: null,
        tumblrUsername: null,
        tumblrConnectedAt: null
      }
    });
    
    console.log(`[OAuth] User ${userId} disconnected Tumblr account`);
    
    res.json({ success: true });
  } catch (error) {
    console.error('[OAuth] Error disconnecting:', error);
    res.status(500).json({ error: 'Failed to disconnect Tumblr account' });
  }
});

// Get user's Tumblr connection status
app.get('/api/auth/tumblr/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        tumblrUsername: true,
        tumblrConnectedAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      connected: !!user.tumblrUsername,
      tumblrUsername: user.tumblrUsername,
      connectedAt: user.tumblrConnectedAt
    });
  } catch (error) {
    console.error('[OAuth] Error checking status:', error);
    res.status(500).json({ error: 'Failed to check connection status' });
  }
});

// Get blogs the authenticated user is following
app.get('/api/tumblr/user/following', async (req, res) => {
  try {
    const { userId, limit = '20', offset = '0' } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tumblrOAuthToken: true, tumblrOAuthTokenSecret: true }
    });
    
    if (!user?.tumblrOAuthToken || !user?.tumblrOAuthTokenSecret) {
      return res.status(401).json({ error: 'Tumblr account not connected' });
    }
    
    const data = await tumblrOAuth.getUserFollowing(
      user.tumblrOAuthToken,
      user.tumblrOAuthTokenSecret,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(data);
  } catch (error) {
    console.error('[OAuth] Error fetching user following:', error);
    res.status(500).json({ error: 'Failed to fetch following list' });
  }
});

// Get followers of a blog (only works for blogs you own)
app.get('/api/tumblr/blog/:blogIdentifier/followers', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const { userId, limit = '20', offset = '0' } = req.query;
    
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tumblrOAuthToken: true, tumblrOAuthTokenSecret: true, tumblrUsername: true }
    });
    
    if (!user?.tumblrOAuthToken || !user?.tumblrOAuthTokenSecret) {
      return res.status(401).json({ error: 'Tumblr account not connected' });
    }
    
    // Verify the blog belongs to the user (normalize blog identifier)
    const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
      ? blogIdentifier.toLowerCase()
      : `${blogIdentifier.toLowerCase()}.tumblr.com`;
    const userBlog = user.tumblrUsername 
      ? (user.tumblrUsername.includes('.') ? user.tumblrUsername : `${user.tumblrUsername}.tumblr.com`)
      : null;
    
    if (normalizedBlog !== userBlog) {
      return res.status(403).json({ error: 'Can only get followers for your own blog' });
    }
    
    const data = await tumblrOAuth.getBlogFollowers(
      normalizedBlog,
      user.tumblrOAuthToken,
      user.tumblrOAuthTokenSecret,
      parseInt(limit as string),
      parseInt(offset as string)
    );
    
    res.json(data);
  } catch (error) {
    console.error('[OAuth] Error fetching blog followers:', error);
    res.status(500).json({ error: 'Failed to fetch followers list' });
  }
});

// Get blog likes (works with API key, but only returns results for blogs you own)
app.get('/api/tumblr/blog/:blogIdentifier/likes', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const { limit, offset, before, after } = req.query;

    if (!TUMBLR_API_KEY) {
      return res.status(500).json({ error: 'Tumblr API key not configured' });
    }

    incrementApiCallCounter(); // Track API call

    // Normalize blog identifier
    const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
      ? blogIdentifier.toLowerCase()
      : `${blogIdentifier.toLowerCase()}.tumblr.com`;

        // Build URL with API key (not OAuth - this endpoint only needs API key)
        const params = new URLSearchParams({
          api_key: TUMBLR_API_KEY,
          limit: limit ? String(limit) : '20',
          notes_info: 'true' // Request notes data for liked posts
        });

    // Only add one pagination parameter
    if (offset !== undefined) {
      params.append('offset', String(offset));
    } else if (before) {
      params.append('before', String(before));
    } else if (after) {
      params.append('after', String(after));
    }

    const url = `https://api.tumblr.com/v2/blog/${normalizedBlog}/likes?${params}`;
    console.log(`[Tumblr API] Fetching blog likes: ${normalizedBlog}`);

    const response = await fetch(url);
    const data = await response.json();

    // Check for API errors
    if (data.meta && data.meta.status !== 200) {
      const errorMsg = data.meta.msg || 'Unknown error';
      
      if (data.meta.status === 429) {
        return res.status(429).json({ error: 'Rate limit exceeded' });
      }
      
      // The API will return an error if trying to access another blog's likes
      // or if privacy settings prevent it
      return res.status(data.meta.status).json({ 
        error: errorMsg,
        meta: data.meta 
      });
    }

    res.json(data);
  } catch (error: any) {
    console.error('[Tumblr API] Error fetching blog likes:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch blog likes' });
  }
});

// Get all blog likes with automatic pagination (helper endpoint)
app.get('/api/tumblr/blog/:blogIdentifier/likes/all', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const { userId, startOffset = '0' } = req.query;

    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'User ID required' });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { tumblrOAuthToken: true, tumblrOAuthTokenSecret: true, tumblrUsername: true }
    });

    if (!user?.tumblrOAuthToken || !user?.tumblrOAuthTokenSecret) {
      return res.status(401).json({ error: 'Tumblr account not connected' });
    }

    // Verify the blog belongs to the user
    const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
      ? blogIdentifier.toLowerCase()
      : `${blogIdentifier.toLowerCase()}.tumblr.com`;
    const userBlog = user.tumblrUsername
      ? (user.tumblrUsername.includes('.') ? user.tumblrUsername : `${user.tumblrUsername}.tumblr.com`)
      : null;

    if (normalizedBlog !== userBlog?.toLowerCase()) {
      return res.status(403).json({ error: 'Can only get likes for your own blog' });
    }

    const allLikes = await tumblrOAuth.getAllBlogLikes(
      normalizedBlog,
      user.tumblrOAuthToken,
      user.tumblrOAuthTokenSecret,
      parseInt(startOffset as string)
    );

    res.json({ likedPosts: allLikes, count: allLikes.length });
  } catch (error: any) {
    console.error('[OAuth] Error fetching all blog likes:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch all blog likes' });
  }
});

// Get blog posts with OAuth (includes notes!)
app.get('/api/tumblr/oauth/blog/:blogIdentifier/posts', async (req, res) => {
  try {
    const { blogIdentifier } = req.params;
    const { userId, limit, offset } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Get user's OAuth tokens
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: {
        tumblrOAuthToken: true,
        tumblrOAuthTokenSecret: true
      }
    });
    
    if (!user?.tumblrOAuthToken || !user?.tumblrOAuthTokenSecret) {
      return res.status(401).json({ error: 'Tumblr account not connected' });
    }
    
    // Fetch posts with OAuth
    const data = await tumblrOAuth.getBlogPosts(
      blogIdentifier,
      user.tumblrOAuthToken,
      user.tumblrOAuthTokenSecret,
      {
        limit: limit ? parseInt(String(limit)) : 20,
        offset: offset ? parseInt(String(offset)) : 0,
        notes_info: true
      }
    );
    
    res.json(data);
  } catch (error) {
    console.error('[OAuth] Error fetching posts:', error);
    res.status(500).json({ error: 'Failed to fetch posts' });
  }
});

// Get post notes with OAuth
app.get('/api/tumblr/oauth/blog/:blogIdentifier/notes/:postId', async (req, res) => {
  try {
    const { blogIdentifier, postId } = req.params;
    const { userId } = req.query;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }
    
    // Get user's OAuth tokens
    const user = await prisma.user.findUnique({
      where: { id: String(userId) },
      select: {
        tumblrOAuthToken: true,
        tumblrOAuthTokenSecret: true
      }
    });
    
    if (!user?.tumblrOAuthToken || !user?.tumblrOAuthTokenSecret) {
      return res.status(401).json({ error: 'Tumblr account not connected' });
    }
    
    // Fetch notes with OAuth
    const data = await tumblrOAuth.getPostNotes(
      blogIdentifier,
      postId,
      user.tumblrOAuthToken,
      user.tumblrOAuthTokenSecret
    );
    
    res.json(data);
  } catch (error) {
    console.error('[OAuth] Error fetching notes:', error);
    res.status(500).json({ error: 'Failed to fetch notes' });
  }
});

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, username, password, displayName } = req.body;

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }]
      }
    });

    if (existing) {
      if (existing.email === email) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      return res.status(400).json({ error: 'Username already taken' });
    }

    // Validate password
    const validation = validatePassword(password);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

    // Generate email verification token
    const emailVerificationToken = generateToken();

    // Create user with preferences
    const user = await prisma.user.create({
      data: {
        email,
        username,
        passwordHash,
        displayName: displayName || username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        emailVerified: false,
        emailVerificationToken,
        preferences: {
          create: {
            theme: 'system',
            fontSize: 16,
            viewMode: 'full',
            reducedMotion: false,
            enableHaptics: true,
            enableGestures: true,
          }
        }
      },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        emailVerified: true,
        role: true,
      }
    });

    // In production, send verification email here
    console.log(`📧 Email verification URL: http://localhost:5173/auth/verify-email?token=${emailVerificationToken}`);

    res.json(user);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { emailOrUsername, password } = req.body;

    // Find user
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login time
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      emailVerified: user.emailVerified,
      lastLoginAt: new Date(),
      role: user.role,
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Change password
app.post('/api/auth/change-password', async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, user.passwordHash);
    if (isSamePassword) {
      return res.status(400).json({ error: 'New password must be different from current password' });
    }

    // Update password
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// Request password reset
app.post('/api/auth/request-password-reset', async (req, res) => {
  try {
    const { emailOrUsername } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername }
        ]
      }
    });

    // Always return success to prevent account enumeration
    if (!user) {
      return res.json({ message: 'If that account exists, a password reset link has been sent' });
    }

    // Generate reset token
    const passwordResetToken = generateToken();
    const passwordResetExpiry = new Date(Date.now() + PASSWORD_RESET_EXPIRY);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiry
      }
    });

    // In production, send password reset email here
    console.log(`🔐 Password reset URL: http://localhost:5173/auth/reset-password?token=${passwordResetToken}`);

    res.json({ message: 'If that account exists, a password reset link has been sent' });
  } catch (error) {
    console.error('Request password reset error:', error);
    res.status(500).json({ error: 'Failed to request password reset' });
  }
});

// Reset password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpiry: {
          gt: new Date()
        }
      }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    // Update password and clear reset token
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpiry: null
      }
    });

    res.json({ message: 'Password reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Verify email
app.post('/api/auth/verify-email', async (req, res) => {
  try {
    const { token } = req.body;

    const user = await prisma.user.findFirst({
      where: { emailVerificationToken: token }
    });

    if (!user) {
      return res.status(400).json({ error: 'Invalid verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null
      }
    });

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    res.status(500).json({ error: 'Failed to verify email' });
  }
});

// Resend verification email
app.post('/api/auth/resend-verification', async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new verification token
    const emailVerificationToken = generateToken();
    await prisma.user.update({
      where: { id: userId },
      data: { emailVerificationToken }
    });

    // In production, send verification email here
    console.log(`📧 Email verification URL: http://localhost:5173/auth/verify-email?token=${emailVerificationToken}`);

    res.json({ message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({ error: 'Failed to resend verification email' });
  }
});

// Find account by email
app.post('/api/auth/find-account', async (req, res) => {
  try {
    const { email } = req.body;

    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(404).json({ error: 'No account found with that email address' });
    }

    // Return masked username for security
    const username = user.username;
    const maskedUsername = username.length > 3
      ? username.substring(0, 2) + '*'.repeat(username.length - 3) + username.substring(username.length - 1)
      : '*'.repeat(username.length);

    res.json({
      username: maskedUsername,
      message: `We found an account associated with ${email}. Your username is ${maskedUsername}`
    });
  } catch (error) {
    console.error('Find account error:', error);
    res.status(500).json({ error: 'Failed to find account' });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        emailVerified: true,
        lastLoginAt: true,
        role: true,
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// Get user preferences
app.get('/api/users/:id/preferences', async (req, res) => {
  try {
    let prefs = await prisma.userPreferences.findUnique({
      where: { userId: req.params.id }
    });

    if (!prefs) {
      prefs = await prisma.userPreferences.create({
        data: {
          userId: req.params.id,
          theme: 'system',
          fontSize: 16,
          viewMode: 'full',
          reducedMotion: false,
          enableHaptics: true,
          enableGestures: true,
        }
      });
    }

    res.json(prefs);
  } catch (error) {
    console.error('Get preferences error:', error);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// Update user preferences
app.put('/api/users/:id/preferences', async (req, res) => {
  try {
    const prefs = await prisma.userPreferences.upsert({
      where: { userId: req.params.id },
      update: req.body,
      create: {
        userId: req.params.id,
        ...req.body,
      }
    });

    res.json(prefs);
  } catch (error) {
    console.error('Update preferences error:', error);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

// ==================== STORED IMAGES ROUTES ====================

// Store images
app.post('/api/stored-images', async (req, res) => {
  try {
    const { userId, images } = req.body;

    console.log('📥 Store request - userId:', userId, 'images count:', images?.length);

    if (!userId || !images || !Array.isArray(images)) {
      console.log('❌ Invalid request data');
      return res.status(400).json({ error: 'Invalid request data' });
    }

    // Get user preferences to check deduplication settings and notes limit
    const userPrefs = await prisma.userPreferences.findUnique({
      where: { userId },
      select: { 
        allowDuplicateImageUrls: true,
        maxStoredNotes: true 
      }
    });
    const allowDuplicateUrls = userPrefs?.allowDuplicateImageUrls ?? false;
    const maxStoredNotes = userPrefs?.maxStoredNotes ?? 50;
    
    console.log(`🔍 Deduplication mode: ${allowDuplicateUrls ? 'ALLOW duplicates from different blogs' : 'STRICT (no duplicate URLs)'}`);
    console.log(`📝 Max notes per image: ${maxStoredNotes}`);

    const storedImages = [];
    let successCount = 0;
    let skippedCount = 0;
    const errors = [];

    for (const image of images) {
      try {
        console.log('Processing image:', { postId: image.postId, blogName: image.blogName, url: image.url?.substring(0, 50) });
        
        // Check if already stored by postId (same post from same blog)
        const existingByPostId = await prisma.storedImage.findUnique({
          where: {
            userId_postId: {
              userId,
              postId: image.postId
            }
          }
        });

        if (existingByPostId) {
          console.log('⏭️  Already stored (same post from same blog), skipping:', image.postId);
          skippedCount++;
          continue;
        }

        // Check if same image URL already stored (same image from different blog/reblog)
        // Only perform this check if user preference is STRICT (default)
        if (!allowDuplicateUrls) {
          const existingByUrl = await prisma.storedImage.findFirst({
            where: {
              userId,
              url: image.url
            }
          });

          if (existingByUrl) {
            console.log('⏭️  Already stored (same URL from different blog), skipping:', image.url?.substring(0, 50), `from @${existingByUrl.blogName}`);
            skippedCount++;
            continue;
          }
        }

        // Limit notes data to user preference
        let notesDataToStore = null;
        if (image.notesData && Array.isArray(image.notesData) && image.notesData.length > 0) {
          const limitedNotes = image.notesData.slice(0, maxStoredNotes);
          notesDataToStore = JSON.stringify(limitedNotes);
          console.log(`  📝 Storing ${limitedNotes.length} notes (limited from ${image.notesData.length})`);
        }

        // Store the image
        const stored = await prisma.storedImage.create({
          data: {
            userId,
            postId: image.postId,
            blogName: image.blogName,
            url: image.url,
            width: image.width,
            height: image.height,
            tags: JSON.stringify(image.tags || []),
            description: image.description,
            notes: image.notes || 0,
            notesData: notesDataToStore,
            cost: image.cost || null,
            timestamp: new Date(image.timestamp),
          }
        });

        console.log('✅ Stored image:', stored.id);
        storedImages.push(stored);
        successCount++;
      } catch (err) {
        console.error('❌ Error storing single image:', err);
        errors.push({ postId: image.postId, error: err.message });
      }
    }

    console.log(`📊 Results - Success: ${successCount}, Skipped: ${skippedCount}, Errors: ${errors.length}`);
    
    if (errors.length > 0) {
      console.log('❌ Errors:', errors);
    }

    res.json({
      success: true,
      stored: successCount,
      skipped: skippedCount,
      failed: errors.length,
      total: images.length,
      images: storedImages,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Store images error:', error);
    res.status(500).json({ error: 'Failed to store images' });
  }
});

// Get stored images for a user
// Check if a specific post is stored (optimized for ImageViewer)
app.get('/api/stored-images/:userId/post/:postId', async (req, res) => {
  try {
    const { userId, postId } = req.params;

    const storedImage = await prisma.storedImage.findUnique({
      where: {
        userId_postId: {
          userId,
          postId
        }
      }
    });

    if (!storedImage) {
      return res.json({ stored: false });
    }

    res.json({
      stored: true,
      image: storedImage
    });
  } catch (error) {
    console.error('Check stored post error:', error);
    res.status(500).json({ error: 'Failed to check stored post' });
  }
});

app.get('/api/stored-images/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0, blogName } = req.query;

    const where: any = { userId };
    if (blogName) {
      where.blogName = blogName;
    }

    const images = await prisma.storedImage.findMany({
      where,
      orderBy: { storedAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string),
    });

    const total = await prisma.storedImage.count({ where });

    console.log(`[GET] 📥 Fetched ${images.length} images for user ${userId} (offset: ${offset}, total: ${total})`);

    res.json({
      images,
      total,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    });
  } catch (error) {
    console.error('Get stored images error:', error);
    res.status(500).json({ error: 'Failed to get stored images' });
  }
});

// Update stored image (e.g., cost)
app.patch('/api/stored-images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, cost } = req.body;

    if (!userId) {
      return res.status(401).json({ error: 'User ID required' });
    }

    // Verify ownership
    const image = await prisma.storedImage.findUnique({
      where: { id }
    });

    if (!image) {
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    // Update the image
    const updated = await prisma.storedImage.update({
      where: { id },
      data: { cost: cost !== undefined ? cost : image.cost },
    });

    res.json(updated);
  } catch (error) {
    console.error('Update stored image error:', error);
    res.status(500).json({ error: 'Failed to update image' });
  }
});

// Delete ALL stored images for a user
app.delete('/api/stored-images/:userId/all', async (req, res) => {
  try {
    const { userId } = req.params;

    console.log(`[DELETE ALL] 🗑️💥 Request to delete ALL images for user ${userId}`);

    // Count how many images will be deleted
    const count = await prisma.storedImage.count({ where: { userId } });
    
    console.log(`[DELETE ALL] 📊 Found ${count} images to delete`);

    // Delete all images for this user in one operation
    const result = await prisma.storedImage.deleteMany({
      where: { userId }
    });

    console.log(`[DELETE ALL] ✅ Successfully deleted ${result.count} images`);
    
    res.json({ 
      message: 'All images deleted successfully',
      count: result.count
    });
  } catch (error) {
    console.error('[DELETE ALL] ❌ Error deleting all images:', error);
    res.status(500).json({ error: 'Failed to delete all images' });
  }
});

// Delete stored image
app.delete('/api/stored-images/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.query;

    console.log(`[DELETE] 🗑️ Request to delete image ${id} for user ${userId}`);

    if (!userId) {
      console.log(`[DELETE] ❌ No userId provided`);
      return res.status(401).json({ error: 'User ID required' });
    }

    // Verify ownership
    const image = await prisma.storedImage.findUnique({
      where: { id }
    });

    if (!image) {
      console.log(`[DELETE] ❌ Image ${id} not found in database`);
      return res.status(404).json({ error: 'Image not found' });
    }

    if (image.userId !== userId) {
      console.log(`[DELETE] ❌ User ${userId} not authorized to delete image ${id} (owner: ${image.userId})`);
      return res.status(403).json({ error: 'Not authorized' });
    }

    console.log(`[DELETE] 🔄 Deleting image ${id} from database...`);
    await prisma.storedImage.delete({
      where: { id }
    });

    console.log(`[DELETE] ✅ Successfully deleted image ${id}`);
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('[DELETE] ❌ Error deleting stored image:', error);
    res.status(500).json({ error: 'Failed to delete image' });
  }
});

// Delete stored images by blog name
app.delete('/api/stored-images/:userId/blog/:blogName', async (req, res) => {
  try {
    const { userId, blogName } = req.params;

    console.log(`[DELETE BLOG] 🗑️ Request to delete all images from blog "${blogName}" for user ${userId}`);

    // Count how many images will be deleted
    const count = await prisma.storedImage.count({ 
      where: { 
        userId,
        blogName 
      } 
    });
    
    console.log(`[DELETE BLOG] 📊 Found ${count} images to delete from blog "${blogName}"`);

    // Delete all images from this blog for this user
    const result = await prisma.storedImage.deleteMany({
      where: { 
        userId,
        blogName 
      }
    });

    console.log(`[DELETE BLOG] ✅ Successfully deleted ${result.count} images from blog "${blogName}"`);
    
    res.json({ 
      message: `All images from ${blogName} deleted successfully`,
      count: result.count
    });
  } catch (error) {
    console.error('[DELETE BLOG] ❌ Error deleting blog images:', error);
    res.status(500).json({ error: 'Failed to delete blog images' });
  }
});

// Get stored images stats
app.get('/api/stored-images/:userId/stats', async (req, res) => {
  try {
    const { userId } = req.params;

    const total = await prisma.storedImage.count({ where: { userId } });
    
    const byBlog = await prisma.storedImage.groupBy({
      by: ['blogName'],
      where: { userId },
      _count: true,
      _sum: {
        cost: true,
      },
    });

    // Calculate total cost across all stored images
    const allImages = await prisma.storedImage.findMany({
      where: { userId },
      select: { cost: true },
    });
    const totalCost = allImages.reduce((sum, img) => sum + (img.cost || 0), 0);

    res.json({
      total,
      totalCost: parseFloat(totalCost.toFixed(2)),
      byBlog: byBlog.map(b => ({ 
        blogName: b.blogName, 
        count: b._count,
        totalCost: b._sum.cost ? parseFloat(b._sum.cost.toFixed(2)) : 0,
      })),
    });
  } catch (error) {
    console.error('Get stored images stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// ==================== BLOG VISIT HISTORY ROUTES ====================

// Get user's blog visit history
app.get('/api/users/:userId/blog-visits', async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;

    const visits = await prisma.blogVisitHistory.findMany({
      where: { userId },
      orderBy: { lastVisited: 'desc' },
      take: limit,
    });

    res.json(visits);
  } catch (error) {
    console.error('Get blog visits error:', error);
    res.status(500).json({ error: 'Failed to get blog visits' });
  }
});

// Track or update a blog visit
app.post('/api/users/:userId/blog-visits', async (req, res) => {
  try {
    const { userId } = req.params;
    const { blogName, displayName, avatar } = req.body;

    if (!blogName) {
      return res.status(400).json({ error: 'blogName is required' });
    }

    // Normalize blog name
    const normalizedBlogName = blogName.toLowerCase();

    // Check if visit already exists
    const existing = await prisma.blogVisitHistory.findUnique({
      where: {
        userId_blogName: {
          userId,
          blogName: normalizedBlogName,
        },
      },
    });

    let visit;
    if (existing) {
      // Update existing visit
      visit = await prisma.blogVisitHistory.update({
        where: {
          userId_blogName: {
            userId,
            blogName: normalizedBlogName,
          },
        },
        data: {
          displayName: displayName || existing.displayName,
          avatar: avatar || existing.avatar,
          lastVisited: new Date(),
          visitCount: existing.visitCount + 1,
        },
      });
    } else {
      // Create new visit
      visit = await prisma.blogVisitHistory.create({
        data: {
          userId,
          blogName: normalizedBlogName,
          displayName,
          avatar,
          visitCount: 1,
        },
      });
    }

    res.json(visit);
  } catch (error) {
    console.error('Track blog visit error:', error);
    res.status(500).json({ error: 'Failed to track blog visit' });
  }
});

// Sync multiple blog visits (batch)
app.post('/api/users/:userId/blog-visits/sync', async (req, res) => {
  try {
    const { userId } = req.params;
    const { visits } = req.body;

    if (!Array.isArray(visits)) {
      return res.status(400).json({ error: 'visits must be an array' });
    }

    // Sync each visit
    const results = [];
    for (const visit of visits) {
      const normalizedBlogName = visit.blogName.toLowerCase();
      
      const existing = await prisma.blogVisitHistory.findUnique({
        where: {
          userId_blogName: {
            userId,
            blogName: normalizedBlogName,
          },
        },
      });

      if (existing) {
        // Only update if the incoming visit is newer
        const incomingDate = new Date(visit.lastVisited);
        if (incomingDate > existing.lastVisited) {
          const updated = await prisma.blogVisitHistory.update({
            where: {
              userId_blogName: {
                userId,
                blogName: normalizedBlogName,
              },
            },
            data: {
              displayName: visit.displayName || existing.displayName,
              avatar: visit.avatar || existing.avatar,
              lastVisited: incomingDate,
              visitCount: Math.max(visit.visitCount, existing.visitCount),
            },
          });
          results.push(updated);
        } else {
          results.push(existing);
        }
      } else {
        const created = await prisma.blogVisitHistory.create({
          data: {
            userId,
            blogName: normalizedBlogName,
            displayName: visit.displayName,
            avatar: visit.avatar,
            lastVisited: new Date(visit.lastVisited),
            visitCount: visit.visitCount || 1,
          },
        });
        results.push(created);
      }
    }

    res.json({ synced: results.length, visits: results });
  } catch (error) {
    console.error('Sync blog visits error:', error);
    res.status(500).json({ error: 'Failed to sync blog visits' });
  }
});

// Clear blog visit history
app.delete('/api/users/:userId/blog-visits', async (req, res) => {
  try {
    const { userId } = req.params;

    await prisma.blogVisitHistory.deleteMany({
      where: { userId },
    });

    res.json({ message: 'Blog visit history cleared' });
  } catch (error) {
    console.error('Clear blog visits error:', error);
    res.status(500).json({ error: 'Failed to clear blog visits' });
  }
});

// ==================== ADMIN ROUTES ====================

// Get all users (Admin only)
app.get('/api/admin/users', async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId as string }
    });

    if (!admin || (admin.role !== UserRole.ADMIN && admin.role !== UserRole.MODERATOR)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        username: true,
        displayName: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        lastLoginAt: true,
        _count: {
          select: {
            posts: true,
            followers: true,
            following: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
});

// Update user role (Admin only)
app.put('/api/admin/users/:id/role', async (req, res) => {
  try {
    const { adminId, role } = req.body;

    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId }
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only admins can change user roles' });
    }

    if (!Object.values(UserRole).includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.params.id },
      data: { role },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
      }
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Admin update role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user (Admin only)
app.delete('/api/admin/users/:id', async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId as string }
    });

    if (!admin || admin.role !== UserRole.ADMIN) {
      return res.status(403).json({ error: 'Only admins can delete users' });
    }

    // Prevent self-deletion
    if (req.params.id === adminId) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Admin delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Helper function for batched parallel fetching with concurrency control
// Like Python's asyncio.Semaphore - limits concurrent operations
async function fetchInBatches(items: any[], batchSize: number, fetchFn: (item: any, index: number) => Promise<any>) {
  const results: any[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item, batchIndex) => fetchFn(item, i + batchIndex))
    );
    results.push(...batchResults);
    
    // Small delay between batches to prevent overwhelming the system
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
}

// Bulk download endpoint with parallel fetching (JavaScript equivalent of Python's aiohttp/asyncio)
// Fetches images in controlled batches, returns as base64 data for fast client-side downloads
app.post('/api/download/bulk', async (req, res) => {
  try {
    const { images } = req.body; // Array of { url, filename, metadata }
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return res.status(400).json({ error: 'No images provided' });
    }

    const BATCH_SIZE = 20; // Fetch 20 images at a time (like Python's asyncio.Semaphore(20))
    const startTime = Date.now();
    console.log(`[Parallel Download] Starting batched fetch of ${images.length} images (${BATCH_SIZE} concurrent)...`);

    // Fetch images in controlled batches
    const results = await fetchInBatches(images, BATCH_SIZE, async (image: any, index: number) => {
      try {
        const fetchStart = Date.now();
        const response = await fetch(image.url);
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const buffer = Buffer.from(await response.arrayBuffer());
        const fetchTime = Date.now() - fetchStart;
        
        // Embed metadata into image using sharp
        let processedBuffer = buffer;
        if (image.metadata) {
          try {
            const metadata = image.metadata;
            
            // Build EXIF data
            const exifData: any = {};
            
            // ImageDescription (EXIF tag 270) - use imageText or description
            if (metadata.imageText || metadata.description) {
              exifData.ImageDescription = metadata.imageText || metadata.description || '';
            }
            
            // UserComment (EXIF tag 37510) - full text content
            if (metadata.imageText) {
              exifData.UserComment = metadata.imageText;
            }
            
            // Artist (EXIF tag 315) - blog name
            if (metadata.blogName) {
              exifData.Artist = metadata.blogName;
            }
            
            // Copyright (EXIF tag 33432) - blog URL
            if (metadata.blogUrl) {
              exifData.Copyright = metadata.blogUrl;
            }
            
            // Build IPTC data
            const iptcData: any = {};
            
            // Caption/Abstract (IPTC tag 2:120) - imageText or description
            if (metadata.imageText || metadata.description) {
              iptcData['2:120'] = metadata.imageText || metadata.description || '';
            }
            
            // Keywords (IPTC tag 2:25) - tags
            if (metadata.tags && metadata.tags.length > 0) {
              iptcData['2:25'] = metadata.tags;
            }
            
            // Copyright Notice (IPTC tag 2:116) - blog name
            if (metadata.blogName) {
              iptcData['2:116'] = `© ${metadata.blogName}`;
            }
            
            // Process image with sharp to embed metadata
            // Sharp's withMetadata() preserves existing metadata and allows adding new metadata
            // We'll build a metadata object that sharp can understand
            const metadataObj: any = {
              // EXIF data (ImageDescription, UserComment, Artist, Copyright)
              exif: exifData,
              // IPTC data (Caption, Keywords, Copyright Notice)
              iptc: iptcData,
            };
            
            // Embed metadata into image using sharp
            // Note: sharp may not support all EXIF/IPTC fields, but will preserve what it can
            processedBuffer = await sharp(buffer)
              .withMetadata(metadataObj)
              .toBuffer();
            
            console.log(`[Parallel Download] ✓ ${index + 1}/${images.length}: ${image.filename} (${(buffer.byteLength / 1024).toFixed(1)}KB → ${(processedBuffer.byteLength / 1024).toFixed(1)}KB, metadata embedded, ${fetchTime}ms)`);
          } catch (metadataError) {
            // If metadata embedding fails, use original image
            console.warn(`[Parallel Download] ⚠ Metadata embedding failed for ${image.filename}, using original:`, metadataError);
            processedBuffer = buffer;
          }
        } else {
          console.log(`[Parallel Download] ✓ ${index + 1}/${images.length}: ${image.filename} (${(buffer.byteLength / 1024).toFixed(1)}KB, ${fetchTime}ms)`);
        }
        
        // Convert to base64 for JSON transport
        return {
          filename: image.filename,
          data: processedBuffer.toString('base64'),
          size: processedBuffer.byteLength,
          metadata: image.metadata,
        };
      } catch (error) {
        console.error(`[Parallel Download] ✗ ${index + 1}/${images.length}: ${image.filename} - ${error}`);
        return null;
      }
    });

    const successfulDownloads = results.filter(r => r !== null);
    
    const totalTime = Date.now() - startTime;
    const totalSize = successfulDownloads.reduce((sum, r) => sum + (r?.size || 0), 0);
    
    console.log(`[Parallel Download] Completed ${successfulDownloads.length}/${images.length} images in ${(totalTime / 1000).toFixed(2)}s (${(totalSize / 1024 / 1024).toFixed(2)}MB total)`);

    res.json({
      success: true,
      total: images.length,
      downloaded: successfulDownloads.length,
      failed: images.length - successfulDownloads.length,
      totalTimeMs: totalTime,
      totalSizeBytes: totalSize,
      images: successfulDownloads,
    });
  } catch (error) {
    console.error('[Parallel Download] Error:', error);
    res.status(500).json({ error: 'Bulk download failed' });
  }
});

// ===== ADMIN ENDPOINTS =====

// Get API call statistics
app.get('/api/admin/stats', async (req, res) => {
  try {
    const stats = await getApiStats();
    res.json(stats);
  } catch (error) {
    console.error('[Admin] Error getting stats:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

// Get database size statistics
app.get('/api/admin/database-stats', async (req, res) => {
  try {
    const { adminId } = req.query;

    if (!adminId) {
      return res.status(401).json({ error: 'Admin authentication required' });
    }

    const admin = await prisma.user.findUnique({
      where: { id: adminId as string }
    });

    if (!admin || admin.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Get database name from connection string
    const dbUrl = process.env.DATABASE_URL || '';
    const dbName = dbUrl.split('/').pop()?.split('?')[0] || 'postgres';

    // Query for total database size
    const totalSizeResult = await prisma.$queryRaw<Array<{ size: bigint }>>`
      SELECT pg_database_size(current_database()) as size;
    `;
    const totalSize = Number(totalSizeResult[0]?.size || 0);

    // Query for individual table sizes (only query tables that actually exist)
    // Use quote_ident to safely handle table names and check if table exists first
    const tableSizes = await prisma.$queryRaw<Array<{
      table_name: string;
      total_size: bigint;
      table_size: bigint;
      indexes_size: bigint;
    }>>`
      SELECT 
        c.relname AS table_name,
        pg_total_relation_size(c.oid) AS total_size,
        pg_relation_size(c.oid) AS table_size,
        pg_total_relation_size(c.oid) - pg_relation_size(c.oid) AS indexes_size
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' 
        AND c.relkind = 'r'
      ORDER BY total_size DESC;
    `;

    // Get actual row counts for tables that exist
    // Extract table names from the query results
    const existingTables = tableSizes.map(t => t.table_name);
    
    // Helper to safely count rows
    const safeCount = async (tableName: string, countFn: () => Promise<number>) => {
      try {
        const count = await countFn();
        return { table: tableName, count };
      } catch (error) {
        console.log(`[Admin] Table ${tableName} does not exist, skipping count`);
        return { table: tableName, count: 0 };
      }
    };

    const rowCountPromises = [];
    
    // Only query tables that we know exist
    if (existingTables.includes('User')) {
      rowCountPromises.push(safeCount('User', () => prisma.user.count()));
    }
    if (existingTables.includes('StoredImage')) {
      rowCountPromises.push(safeCount('StoredImage', () => prisma.storedImage.count()));
    }
    if (existingTables.includes('Post')) {
      rowCountPromises.push(safeCount('Post', () => prisma.post.count()));
    }
    if (existingTables.includes('Draft')) {
      rowCountPromises.push(safeCount('Draft', () => prisma.draft.count()));
    }
    if (existingTables.includes('SavedPost')) {
      rowCountPromises.push(safeCount('SavedPost', () => prisma.savedPost.count()));
    }
    if (existingTables.includes('LikedPost')) {
      rowCountPromises.push(safeCount('LikedPost', () => prisma.likedPost.count()));
    }
    if (existingTables.includes('Follow')) {
      rowCountPromises.push(safeCount('Follow', () => prisma.follow.count()));
    }
    if (existingTables.includes('SearchHistory')) {
      rowCountPromises.push(safeCount('SearchHistory', () => prisma.searchHistory.count()));
    }
    if (existingTables.includes('Blog')) {
      rowCountPromises.push(safeCount('Blog', () => prisma.blog.count()));
    }
    if (existingTables.includes('UserPreferences')) {
      rowCountPromises.push(safeCount('UserPreferences', () => prisma.userPreferences.count()));
    }
    if (existingTables.includes('ApiCallStats')) {
      rowCountPromises.push(safeCount('ApiCallStats', () => prisma.apiCallStats.count()));
    }

    const rowCounts = await Promise.all(rowCountPromises);

    const rowCountMap = Object.fromEntries(
      rowCounts.map(({ table, count }) => [table, count])
    );

    // Format the results
    const tables = tableSizes.map(table => ({
      name: table.table_name,
      totalSize: Number(table.total_size),
      tableSize: Number(table.table_size),
      indexesSize: Number(table.indexes_size),
      rowCount: rowCountMap[table.table_name] || 0,
    }));

    // Calculate breakdown by category
    const storedImagesTable = tables.find(t => t.name === 'StoredImage');
    const notesSize = storedImagesTable ? Math.round(storedImagesTable.totalSize * 0.3) : 0; // Estimate ~30% for notes data
    const imagesMetadataSize = storedImagesTable ? storedImagesTable.totalSize - notesSize : 0;

    // Helper to safely get table size
    const getTableSize = (tableName: string) => tables.find(t => t.name === tableName)?.totalSize || 0;

    const breakdown = {
      storedImages: {
        metadata: imagesMetadataSize,
        notes: notesSize,
        total: storedImagesTable?.totalSize || 0,
      },
      users: getTableSize('User'),
      preferences: getTableSize('UserPreferences'),
      posts: getTableSize('Post'),
      socialData: getTableSize('SavedPost') + getTableSize('LikedPost') + getTableSize('Follow'),
      searchHistory: getTableSize('SearchHistory'),
      blogs: getTableSize('Blog'),
      apiStats: getTableSize('ApiCallStats'),
      other: tables.filter(t => 
        !['StoredImage', 'User', 'UserPreferences', 'Post', 'SavedPost', 'LikedPost', 'Follow', 'SearchHistory', 'Blog', 'ApiCallStats', '_prisma_migrations'].includes(t.name)
      ).reduce((sum, t) => sum + t.totalSize, 0),
    };

    res.json({
      totalSize,
      tables,
      breakdown,
      databaseName: dbName,
    });
  } catch (error) {
    console.error('[Admin] Error getting database stats:', error);
    console.error('[Admin] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    res.status(500).json({ 
      error: 'Failed to get database stats',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// Reset API call counter
app.post('/api/admin/reset', async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    
    // Get current count before reset
    const oldStats = await prisma.apiCallStats.findUnique({
      where: { date: today },
    });
    const oldCount = oldStats?.count || 0;
    
    // Reset to 0
    await prisma.apiCallStats.upsert({
      where: { date: today },
      update: { count: 0 },
      create: { date: today, count: 0 },
    });
    
    console.log(`[Admin] 🔄 Counter manually reset from ${oldCount} to 0`);
    res.json({ message: 'Counter reset successfully', oldCount, newCount: 0 });
  } catch (error) {
    console.error('[Admin] Error resetting counter:', error);
    res.status(500).json({ error: 'Failed to reset counter' });
  }
});

// Catch-all handler: serve index.html for client-side routing (production)
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../dist/index.html'));
  });
}

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on:`);
  console.log(`   - Local:      http://localhost:${PORT}`);
  console.log(`   - Network:    http://0.0.0.0:${PORT}`);
  console.log(`   - Tailscale:  http://100.120.207.84:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

