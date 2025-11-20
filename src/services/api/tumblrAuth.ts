/**
 * Tumblr OAuth Authentication Service (Frontend)
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface TumblrConnectionStatus {
  connected: boolean;
  tumblrUsername?: string;
  connectedAt?: string;
}

/**
 * Check if user has connected their Tumblr account
 */
export async function getTumblrConnectionStatus(userId: string): Promise<TumblrConnectionStatus | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/tumblr/status/${userId}`);
    
    if (!response.ok) {
      console.error(`[Tumblr Auth] Status check failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Tumblr Auth] Error checking status:', error);
    return null;
  }
}

/**
 * Initiate Tumblr OAuth connection
 */
export async function connectTumblrAccount(userId: string): Promise<{ authUrl: string; requestToken: string } | null> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/tumblr/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      console.error(`[Tumblr Auth] Connect failed: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Tumblr Auth] Error connecting:', error);
    return null;
  }
}

/**
 * Complete OAuth callback
 */
export async function completeTumblrConnection(
  userId: string,
  oauthToken: string,
  oauthVerifier: string
): Promise<{ success: boolean; tumblrUsername?: string }> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/tumblr/callback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, oauthToken, oauthVerifier })
    });
    
    if (!response.ok) {
      console.error(`[Tumblr Auth] Callback failed: ${response.status}`);
      return { success: false };
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('[Tumblr Auth] Error completing connection:', error);
    return { success: false };
  }
}

/**
 * Disconnect Tumblr account
 */
export async function disconnectTumblrAccount(userId: string): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE}/api/auth/tumblr/disconnect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    
    if (!response.ok) {
      console.error(`[Tumblr Auth] Disconnect failed: ${response.status}`);
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('[Tumblr Auth] Error disconnecting:', error);
    return false;
  }
}

/**
 * Fetch blog posts with OAuth (includes notes!)
 */
export async function fetchBlogPostsWithOAuth(
  userId: string,
  blogIdentifier: string,
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<any> {
  try {
    const params = new URLSearchParams({
      userId,
      limit: String(options.limit || 20),
      offset: String(options.offset || 0)
    });
    
    const url = `${API_BASE}/api/tumblr/oauth/blog/${blogIdentifier}/posts?${params}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Tumblr OAuth API] Error: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[Tumblr OAuth API] Fetched ${data.response.posts.length} posts with notes data`);
    
    return data;
  } catch (error) {
    console.error('[Tumblr OAuth API] Fetch error:', error);
    return null;
  }
}

/**
 * Fetch notes for a specific post with OAuth
 */
export async function fetchPostNotes(
  userId: string,
  blogIdentifier: string,
  postId: string
): Promise<any> {
  try {
    const params = new URLSearchParams({ userId });
    const url = `${API_BASE}/api/tumblr/oauth/blog/${blogIdentifier}/notes/${postId}?${params}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`[Tumblr OAuth API] Error fetching notes: ${response.status}`);
      return null;
    }
    
    const data = await response.json();
    console.log(`[Tumblr OAuth API] Fetched notes for post ${postId}`);
    
    return data;
  } catch (error) {
    console.error('[Tumblr OAuth API] Error fetching notes:', error);
    return null;
  }
}

