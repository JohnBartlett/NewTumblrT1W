/**
 * Tumblr OAuth 1.0a Service
 * Handles OAuth authentication flow with Tumblr
 */

import { OAuth } from 'oauth';

// OAuth configuration
const TUMBLR_REQUEST_TOKEN_URL = 'https://www.tumblr.com/oauth/request_token';
const TUMBLR_ACCESS_TOKEN_URL = 'https://www.tumblr.com/oauth/access_token';
const TUMBLR_AUTHORIZE_URL = 'https://www.tumblr.com/oauth/authorize';
const CALLBACK_URL = process.env.VITE_APP_URL ? `${process.env.VITE_APP_URL}/auth/tumblr/callback` : 'http://localhost:5173/auth/tumblr/callback';

// Get OAuth credentials from environment
const CONSUMER_KEY = process.env.VITE_TUMBLR_API_KEY || '';
const CONSUMER_SECRET = process.env.TUMBLR_CONSUMER_SECRET || '';

if (!CONSUMER_KEY || !CONSUMER_SECRET) {
  console.warn('⚠️ Tumblr OAuth credentials not configured. Set VITE_TUMBLR_API_KEY and TUMBLR_CONSUMER_SECRET');
}

// Create OAuth client
const oauth = new OAuth(
  TUMBLR_REQUEST_TOKEN_URL,
  TUMBLR_ACCESS_TOKEN_URL,
  CONSUMER_KEY,
  CONSUMER_SECRET,
  '1.0A',
  CALLBACK_URL,
  'HMAC-SHA1'
);

// Store for temporary tokens (in production, use Redis or similar)
const tempTokenStore = new Map<string, {
  token: string;
  tokenSecret: string;
  timestamp: number;
}>();

// Clean up old tokens every hour
setInterval(() => {
  const oneHourAgo = Date.now() - (60 * 60 * 1000);
  for (const [key, value] of tempTokenStore.entries()) {
    if (value.timestamp < oneHourAgo) {
      tempTokenStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

/**
 * Step 1: Get request token and redirect URL
 */
export function getRequestToken(): Promise<{ token: string; tokenSecret: string; authUrl: string }> {
  return new Promise((resolve, reject) => {
    oauth.getOAuthRequestToken((error, token, tokenSecret) => {
      if (error) {
        console.error('[Tumblr OAuth] Error getting request token:', error);
        reject(error);
        return;
      }

      // Store token temporarily
      tempTokenStore.set(token, {
        token,
        tokenSecret,
        timestamp: Date.now()
      });

      const authUrl = `${TUMBLR_AUTHORIZE_URL}?oauth_token=${token}`;
      
      console.log('[Tumblr OAuth] Request token obtained:', token);
      resolve({ token, tokenSecret, authUrl });
    });
  });
}

/**
 * Step 2: Exchange request token for access token
 */
export function getAccessToken(
  requestToken: string,
  oauthVerifier: string
): Promise<{ accessToken: string; accessTokenSecret: string; tumblrUsername: string }> {
  return new Promise((resolve, reject) => {
    // Get the stored token secret
    const stored = tempTokenStore.get(requestToken);
    if (!stored) {
      reject(new Error('Request token not found or expired'));
      return;
    }

    const { tokenSecret } = stored;

    oauth.getOAuthAccessToken(
      requestToken,
      tokenSecret,
      oauthVerifier,
      async (error, accessToken, accessTokenSecret, results: any) => {
        if (error) {
          console.error('[Tumblr OAuth] Error getting access token:', error);
          reject(error);
          return;
        }

        // Clean up temp token
        tempTokenStore.delete(requestToken);

        console.log('[Tumblr OAuth] Access token obtained');
        
        // Fetch user info to get the actual username
        try {
          const userInfo = await getUserInfo(accessToken, accessTokenSecret);
          // Extract username from user info response
          const username = userInfo?.response?.user?.blogs?.[0]?.name || 
                          results.oauth_token || 
                          'unknown';
          console.log('[Tumblr OAuth] Username from user info:', username);
          resolve({
            accessToken,
            accessTokenSecret,
            tumblrUsername: username
          });
        } catch (userInfoError) {
          console.error('[Tumblr OAuth] Error fetching user info, using fallback:', userInfoError);
          // Fallback if user info fetch fails
          resolve({
            accessToken,
            accessTokenSecret,
            tumblrUsername: results.oauth_token || 'unknown'
          });
        }
      }
    );
  });
}

/**
 * Make an authenticated request to Tumblr API
 */
export function makeAuthenticatedRequest(
  url: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  return new Promise((resolve, reject) => {
    oauth.get(
      url,
      accessToken,
      accessTokenSecret,
      (error, data) => {
        if (error) {
          console.error('[Tumblr OAuth] API request error:', error);
          reject(error);
          return;
        }

        try {
          const parsed = typeof data === 'string' ? JSON.parse(data) : data;
          resolve(parsed);
        } catch (e) {
          reject(new Error('Failed to parse response'));
        }
      }
    );
  });
}

/**
 * Get user info with OAuth
 */
export async function getUserInfo(
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  const url = 'https://api.tumblr.com/v2/user/info';
  return makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
}

/**
 * Get blog info with OAuth (includes additional data like follower counts)
 */
export async function getBlogInfo(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/info`;
  return makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
}

/**
 * Get blogs that the authenticated user is following
 * Returns list of blogs the user follows
 */
export async function getUserFollowing(
  accessToken: string,
  accessTokenSecret: string,
  limit: number = 20,
  offset: number = 0
): Promise<any> {
  const url = `https://api.tumblr.com/v2/user/following?limit=${limit}&offset=${offset}`;
  return makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
}

/**
 * Get followers of a blog (only works for blogs you own)
 * Requires OAuth authentication as the owner of the blog
 */
export async function getBlogFollowers(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string,
  limit: number = 20,
  offset: number = 0
): Promise<any> {
  const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/followers?limit=${limit}&offset=${offset}`;
  return makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
}

/**
 * Get blog posts with OAuth (includes notes!)
 */
export async function getBlogPosts(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string,
  options: {
    limit?: number;
    offset?: number;
    notes_info?: boolean; // Enable notes data
  } = {}
): Promise<any> {
  const params = new URLSearchParams({
    limit: String(options.limit || 20),
    offset: String(options.offset || 0),
    notes_info: String(options.notes_info !== false) // Default to true
  });

  const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/posts?${params}`;
  return makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
}

/**
 * Options for fetching blog likes
 */
export interface BlogLikesOptions {
  /** Number of results per request (1-20, default: 20) */
  limit?: number;
  /** Post number to start at (0 is first, max 1000 total posts with offset) */
  offset?: number;
  /** Retrieve posts liked before this timestamp (alternative to offset) */
  before?: number;
  /** Retrieve posts liked after this timestamp (alternative to offset) */
  after?: number;
}

/**
 * Response from blog likes endpoint
 */
export interface BlogLikesResponse {
  /** Array of liked post objects */
  likedPosts: Array<{
    blog_name: string;
    id: number;
    post_url: string;
    type: string;
    timestamp: number;
    date: string;
    format: string;
    reblog_key: string;
    tags: string[];
    liked_timestamp: number;
    note_count: number;
    title?: string;
    body?: string;
    summary?: string;
    photos?: Array<{
      original_size: {
        url: string;
        width: number;
        height: number;
      };
    }>;
  }>;
  /** Total number of liked posts */
  likedCount: number;
  /** Suggested offset for next request (if using offset pagination) */
  nextOffset?: number;
  /** Suggested timestamp for next request (if using timestamp pagination) */
  nextTimestamp?: number;
  /** Whether there are more posts available */
  hasMore: boolean;
  /** Warning message if applicable */
  warning?: string;
}

/**
 * Get liked posts from a blog
 * 
 * @remarks
 * **IMPORTANT LIMITATIONS:**
 * - Only works for blogs you own (authenticated user's blogs)
 * - Maximum 1000 posts retrievable with offset parameter
 * - Use timestamp-based pagination (before/after) for accessing older posts beyond 1000
 * - Respects blog privacy settings ("Share posts you like" must be enabled)
 * - Each call returns max 20 posts
 * 
 * @param blogIdentifier - The blog name or identifier (e.g., "myblog.tumblr.com")
 * @param accessToken - OAuth access token
 * @param accessTokenSecret - OAuth access token secret
 * @param options - Pagination and limit options
 * @returns Promise resolving to BlogLikesResponse with liked posts and pagination info
 * 
 * @throws {Error} If authentication fails, invalid parameters, or API errors
 * 
 * @example
 * ```typescript
 * // Basic call with offset
 * const result = await getBlogLikes(
 *   'myblog.tumblr.com',
 *   accessToken,
 *   accessTokenSecret,
 *   { limit: 20, offset: 0 }
 * );
 * console.log(`Found ${result.likedCount} liked posts`);
 * 
 * // Pagination beyond 1000 posts using timestamps
 * const result = await getBlogLikes(
 *   'myblog.tumblr.com',
 *   accessToken,
 *   accessTokenSecret,
 *   { limit: 20, before: 1234567890 }
 * );
 * ```
 */
export async function getBlogLikes(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string,
  options: BlogLikesOptions = {}
): Promise<BlogLikesResponse> {
  const {
    limit = 20,
    offset,
    before,
    after
  } = options;

  // Validation: Only one pagination method allowed
  const paginationMethods = [offset !== undefined, before !== undefined, after !== undefined].filter(Boolean).length;
  if (paginationMethods > 1) {
    throw new Error('Only one pagination method allowed at a time (offset, before, or after)');
  }

  // Validation: limit must be between 1 and 20
  if (limit < 1 || limit > 20) {
    throw new Error('limit must be between 1 and 20');
  }

  // Validation: offset must not exceed 1000
  if (offset !== undefined && offset > 1000) {
    throw new Error('offset cannot exceed 1000. Use timestamp-based pagination (before/after) for posts beyond 1000');
  }

  // Build URL with parameters
  const params = new URLSearchParams({
    limit: String(limit)
  });

  if (offset !== undefined) {
    params.append('offset', String(offset));
  } else if (before !== undefined) {
    params.append('before', String(before));
  } else if (after !== undefined) {
    params.append('after', String(after));
  }

  const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/likes?${params}`;

  try {
    const response = await makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
    
    // Handle API errors
    if (response.meta && response.meta.status !== 200) {
      const errorMsg = response.meta.msg || 'Unknown error';
      
      // Check for rate limiting
      if (response.meta.status === 429) {
        throw new Error(`Rate limit exceeded: ${errorMsg}`);
      }
      
      // Check for privacy settings
      if (errorMsg.includes('privacy') || errorMsg.includes('private')) {
        throw new Error('Blog privacy settings prevent accessing likes. Enable "Share posts you like" in blog settings.');
      }
      
      // Check for authentication issues
      if (response.meta.status === 401 || response.meta.status === 403) {
        throw new Error(`Authentication failed: ${errorMsg}. This endpoint only works for blogs you own.`);
      }
      
      throw new Error(`API error (${response.meta.status}): ${errorMsg}`);
    }

    const likedPosts = response.response?.liked_posts || [];
    const likedCount = response.response?.liked_count || 0;

    // Determine pagination info
    const hasMore = likedPosts.length === limit;
    let nextOffset: number | undefined;
    let nextTimestamp: number | undefined;
    let warning: string | undefined;

    if (offset !== undefined) {
      // Offset-based pagination
      if (hasMore) {
        const newOffset = offset + limit;
        if (newOffset >= 1000) {
          // Switch to timestamp-based pagination
          const lastPost = likedPosts[likedPosts.length - 1];
          if (lastPost && lastPost.liked_timestamp) {
            nextTimestamp = lastPost.liked_timestamp;
            warning = 'Reached 1000-post offset limit. Use timestamp-based pagination (before parameter) to continue.';
          } else {
            warning = 'Reached 1000-post offset limit and cannot determine timestamp. Cannot paginate further.';
          }
        } else {
          nextOffset = newOffset;
        }
      }
    } else if (before !== undefined || after !== undefined) {
      // Timestamp-based pagination
      if (hasMore && likedPosts.length > 0) {
        const lastPost = likedPosts[likedPosts.length - 1];
        if (lastPost && lastPost.liked_timestamp) {
          nextTimestamp = lastPost.liked_timestamp;
        }
      }
    }

    return {
      likedPosts,
      likedCount,
      nextOffset,
      nextTimestamp,
      hasMore,
      warning
    };
  } catch (error: any) {
    // Re-throw validation errors
    if (error.message && (
      error.message.includes('limit must be') ||
      error.message.includes('offset cannot exceed') ||
      error.message.includes('Only one pagination method')
    )) {
      throw error;
    }

    // Handle network/API errors
    if (error.statusCode === 429) {
      throw new Error('Rate limit exceeded. Please wait before making more requests.');
    }

    if (error.statusCode === 401 || error.statusCode === 403) {
      throw new Error('Authentication failed. This endpoint only works for blogs you own.');
    }

    throw new Error(`Failed to fetch blog likes: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Helper function to handle pagination beyond 1000 posts
 * Automatically switches from offset-based to timestamp-based pagination
 * 
 * @param blogIdentifier - The blog name or identifier
 * @param accessToken - OAuth access token
 * @param accessTokenSecret - OAuth access token secret
 * @param startOffset - Starting offset (default: 0)
 * @param onProgress - Optional callback for progress updates
 * @returns Promise resolving to all liked posts (up to the API limit)
 * 
 * @example
 * ```typescript
 * const allLikes = await getAllBlogLikes(
 *   'myblog.tumblr.com',
 *   accessToken,
 *   accessTokenSecret,
 *   0,
 *   (current, total) => console.log(`Fetched ${current} of ${total} posts`)
 * );
 * ```
 */
export async function getAllBlogLikes(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string,
  startOffset: number = 0,
  onProgress?: (current: number, total: number) => void
): Promise<BlogLikesResponse['likedPosts']> {
  const allPosts: BlogLikesResponse['likedPosts'] = [];
  let currentOffset = startOffset;
  let currentTimestamp: number | undefined;
  let totalCount: number | undefined;
  let useTimestampPagination = false;

  try {
    // First request to get total count and initial posts
    const firstResponse = await getBlogLikes(
      blogIdentifier,
      accessToken,
      accessTokenSecret,
      { limit: 20, offset: currentOffset }
    );

    totalCount = firstResponse.likedCount;
    allPosts.push(...firstResponse.likedPosts);

    if (onProgress) {
      onProgress(allPosts.length, totalCount);
    }

    // Check if we need to switch to timestamp pagination
    if (firstResponse.warning && firstResponse.nextTimestamp) {
      useTimestampPagination = true;
      currentTimestamp = firstResponse.nextTimestamp;
    } else if (firstResponse.nextOffset !== undefined) {
      currentOffset = firstResponse.nextOffset;
    } else {
      // No more posts
      return allPosts;
    }

    // Continue fetching until no more posts
    while (true) {
      let response: BlogLikesResponse;

      if (useTimestampPagination && currentTimestamp) {
        // Use timestamp-based pagination
        response = await getBlogLikes(
          blogIdentifier,
          accessToken,
          accessTokenSecret,
          { limit: 20, before: currentTimestamp }
        );
      } else if (currentOffset !== undefined) {
        // Use offset-based pagination
        response = await getBlogLikes(
          blogIdentifier,
          accessToken,
          accessTokenSecret,
          { limit: 20, offset: currentOffset }
        );

        // Check if we need to switch to timestamp pagination
        if (response.warning && response.nextTimestamp) {
          useTimestampPagination = true;
          currentTimestamp = response.nextTimestamp;
          currentOffset = undefined;
        } else if (response.nextOffset !== undefined) {
          currentOffset = response.nextOffset;
        } else {
          break;
        }
      } else {
        break;
      }

      if (response.likedPosts.length === 0) {
        break;
      }

      allPosts.push(...response.likedPosts);

      if (onProgress && totalCount) {
        onProgress(allPosts.length, totalCount);
      }

      // Update pagination cursor
      if (useTimestampPagination) {
        if (response.nextTimestamp) {
          currentTimestamp = response.nextTimestamp;
        } else {
          break;
        }
      } else if (response.nextOffset === undefined) {
        break;
      }

      // Safety limit to prevent infinite loops
      if (allPosts.length > 10000) {
        console.warn('Reached safety limit of 10,000 posts. Stopping pagination.');
        break;
      }
    }

    return allPosts;
  } catch (error: any) {
    // If we got some posts before error, return them
    if (allPosts.length > 0) {
      console.warn(`Error during pagination, returning ${allPosts.length} posts fetched so far:`, error.message);
      return allPosts;
    }
    throw error;
  }
}

/**
 * Get notes for a specific post (requires OAuth)
 */
export async function getPostNotes(
  blogIdentifier: string,
  postId: string,
  accessToken: string,
  accessTokenSecret: string
): Promise<any> {
  const url = `https://api.tumblr.com/v2/blog/${blogIdentifier}/notes?id=${postId}`;
  return makeAuthenticatedRequest(url, accessToken, accessTokenSecret);
}

