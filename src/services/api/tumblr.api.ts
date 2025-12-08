/**
 * Tumblr API Service - Real API Integration
 * Proxies through backend to avoid CORS issues
 */

import { isRateLimited, recordRateLimit, clearRateLimit, getRetryAfter } from '@/utils/rateLimiter';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const TUMBLR_PROXY_BASE = `${API_BASE}/api/tumblr`;

// Get API key from environment
const getApiKey = () => {
  const key = import.meta.env.VITE_TUMBLR_API_KEY;
  if (!key || key === 'your_api_key_here') {
    console.warn('⚠️ Tumblr API Key not configured. Using mock data.');
    return null;
  }
  return key;
};

// Normalize blog identifier to include .tumblr.com if needed and convert to lowercase
const normalizeBlogIdentifier = (identifier: string): string => {
  // Tumblr blog names are case-insensitive, but the API expects lowercase
  const lowercase = identifier.toLowerCase();
  
  if (lowercase.includes('.')) {
    return lowercase; // Already has domain
  }
  return `${lowercase}.tumblr.com`;
};

export interface TumblrNote {
  type: 'like' | 'reblog' | 'reply' | 'posted';
  timestamp: number;
  blog_name: string;
  blog_uuid?: string;
  blog_url?: string;
  followed?: boolean;
  avatar_shape?: string;
  reply_text?: string;
  reblog_parent_blog_name?: string;
  added_text?: string;
}

export interface TumblrPost {
  id: string | number;
  blog_name: string;
  post_url: string;
  type: 'text' | 'photo' | 'quote' | 'link' | 'video' | 'audio';
  timestamp: number;
  date: string;
  tags: string[];
  note_count: number;
  notes?: TumblrNote[];
  summary?: string;
  caption?: string;
  body?: string;
  photos?: Array<{
    original_size: {
      url: string;
      width: number;
      height: number;
    };
    alt_sizes: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  }>;
}

export interface TumblrBlogPostsResponse {
  meta: {
    status: number;
    msg: string;
  };
  errors?: Array<{
    title: string;
    code: number;
    detail: string;
  }>;
  response: {
    posts: TumblrPost[];
    total_posts: number;
    blog?: {
      name: string;
      title: string;
      description: string;
      url: string;
      posts: number;
      updated: number;
    };
  };
}

export interface TumblrTaggedResponse {
  meta: {
    status: number;
    msg: string;
  };
  response: TumblrPost[];
}

/**
 * Fetch posts from a specific Tumblr blog
 */
export async function fetchBlogPosts(
  blogIdentifier: string,
  options: {
    type?: 'text' | 'photo' | 'quote' | 'link' | 'video' | 'audio';
    tag?: string;
    limit?: number;
    offset?: number;
    before?: number;
    notes_info?: boolean;
  } = {}
): Promise<TumblrBlogPostsResponse | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const normalizedBlog = normalizeBlogIdentifier(blogIdentifier);
    const params = new URLSearchParams({
      limit: String(options.limit || 20),
      offset: String(options.offset || 0),
      notes_info: String(options.notes_info !== false), // Default to true to get notes!
    });

    if (options.type) params.append('type', options.type);
    if (options.tag) params.append('tag', options.tag);
    if (options.before) params.append('before', String(options.before));

    // Check if we're rate limited before making the request
    const rateLimitKey = `tumblr:posts:${normalizedBlog}`;
    if (isRateLimited(rateLimitKey)) {
      const retryAfter = getRetryAfter(rateLimitKey);
      throw new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
    }

    const url = `${TUMBLR_PROXY_BASE}/blog/${normalizedBlog}/posts?${params}`;
    
    console.log(`[Tumblr API] Fetching posts from ${normalizedBlog} (notes_info=${options.notes_info !== false})`);
    const response = await fetch(url);
    
    // Handle rate limiting (429) before trying to parse JSON
    if (response.status === 429) {
      console.error('[Tumblr API] ⚠️ Rate limit exceeded (429)');
      // Try to get the text response (might not be JSON)
      const text = await response.text();
      // Record rate limit with exponential backoff
      const retryAfter = response.headers.get('Retry-After');
      recordRateLimit(rateLimitKey, retryAfter ? parseInt(retryAfter) : undefined);
      throw new Error(`Rate limit exceeded. ${text || 'Please try again in a few minutes.'}`);
    }
    
    // Clear rate limit on successful response
    if (response.ok) {
      clearRateLimit(rateLimitKey);
    }
    
    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      // Not JSON - read as text
      const text = await response.text();
      console.error('[Tumblr API] Non-JSON response:', text);
      throw new Error(`API error: ${text || response.statusText}`);
    }
    
    // Parse JSON response to get error details
    const data: TumblrBlogPostsResponse = await response.json();
    
    if (!response.ok || data.meta.status !== 200) {
      const status = data.meta.status || response.status;
      const errorMsg = data.meta.msg || response.statusText;
      
      // Get detailed error information if available
      const errorCode = data.errors?.[0]?.code;
      const errorDetail = data.errors?.[0]?.detail;
      
      // Build comprehensive error message
      let fullErrorMsg = `[${status}] ${errorMsg}`;
      if (errorCode) {
        fullErrorMsg += ` (Code: ${errorCode})`;
      }
      if (errorDetail) {
        fullErrorMsg += ` - ${errorDetail}`;
      }
      
      console.error(`[Tumblr API] Error: ${fullErrorMsg}`);
      
      // Throw with full error information
      throw new Error(fullErrorMsg);
    }

    console.log(`[Tumblr API] Fetched ${data.response.posts.length} posts`);
    
    return data;
  } catch (error) {
    console.error('[Tumblr API] Fetch error:', error);
    throw error;
  }
}

/**
 * Fetch posts by tag
 */
export async function fetchTaggedPosts(
  tag: string,
  options: {
    before?: number;
    limit?: number;
    filter?: 'text' | 'raw';
  } = {}
): Promise<TumblrTaggedResponse | null> {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const params = new URLSearchParams({
      tag,
      limit: String(options.limit || 20),
    });

    if (options.before) params.append('before', String(options.before));
    if (options.filter) params.append('filter', options.filter);

    const url = `${TUMBLR_PROXY_BASE}/tagged?${params}`;
    
    console.log(`[Tumblr API] Fetching tagged posts: ${tag}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error(`[Tumblr API] ⚠️ RATE LIMIT EXCEEDED (429) - You've hit the hourly (1,000) or daily (5,000) request limit`);
        console.error(`[Tumblr API] Please wait before making more requests or request rate limit removal in your Tumblr app settings`);
      } else {
        console.error(`[Tumblr API] Error: ${response.status} ${response.statusText}`);
      }
      return null;
    }

    const data: TumblrTaggedResponse = await response.json();
    console.log(`[Tumblr API] Fetched ${data.response.length} tagged posts`);
    
    return data;
  } catch (error) {
    console.error('[Tumblr API] Fetch error:', error);
    return null;
  }
}

/**
 * Search Tumblr by tag
 */
export async function searchTumblrByTag(tag: string, options?: {
  before?: number;
  limit?: number;
  filter?: string;
}) {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.log('[Tumblr API] No API key, cannot search');
    return null;
  }

  try {
    const params = new URLSearchParams({
      tag,
      api_key: apiKey,
      limit: String(options?.limit || 20),
      filter: options?.filter || 'text',
    });

    if (options?.before) {
      params.append('before', String(options.before));
    }

    const response = await fetch(
      `${TUMBLR_PROXY_BASE}/tagged?${params}`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to search: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[Tumblr API] Found ${data.response?.length || 0} posts for tag "${tag}"`);
    return data;
  } catch (error) {
    console.error('[Tumblr API] Search error:', error);
    return null;
  }
}

/**
 * Get blog info (with OAuth support for follower/following counts)
 */
export async function fetchBlogInfo(blogIdentifier: string, userId?: string) {
  const apiKey = getApiKey();
  if (!apiKey) return null;

  try {
    const normalizedBlog = normalizeBlogIdentifier(blogIdentifier);
    
    // Check if we're rate limited before making the request
    const rateLimitKey = `tumblr:info:${normalizedBlog}`;
    if (isRateLimited(rateLimitKey)) {
      const retryAfter = getRetryAfter(rateLimitKey);
      console.warn(`[Tumblr API] Blocked by rate limiter. Retry in ${retryAfter}s`);
      return null;
    }
    
    const url = `${TUMBLR_PROXY_BASE}/blog/${normalizedBlog}/info${userId ? `?userId=${userId}` : ''}`;
    
    console.log(`[Tumblr API] Fetching blog info: ${normalizedBlog}${userId ? ' (with OAuth)' : ''}`);
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 429) {
        console.error(`[Tumblr API] ⚠️ RATE LIMIT EXCEEDED (429) - You've hit the hourly (1,000) or daily (5,000) request limit`);
        console.error(`[Tumblr API] Please wait before making more requests or request rate limit removal in your Tumblr app settings`);
        // Read the response body (might be plain text, not JSON)
        const text = await response.text();
        console.error(`[Tumblr API] 429 Response: ${text}`);
        // Record rate limit
        const retryAfter = response.headers.get('Retry-After');
        recordRateLimit(rateLimitKey, retryAfter ? parseInt(retryAfter) : undefined);
      } else {
        console.error(`[Tumblr API] Error: ${response.status} ${response.statusText}`);
      }
      return null;
    }
    
    // Clear rate limit on successful response
    clearRateLimit(rateLimitKey);

    // Check if response is JSON before parsing
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('[Tumblr API] Non-JSON response:', text);
      return null;
    }

    const data = await response.json();
    return data.response?.blog || null;
  } catch (error) {
    console.error('[Tumblr API] Fetch error:', error);
    return null;
  }
}

/**
 * Check if API key is configured
 */
export function isApiConfigured(): boolean {
  const key = getApiKey();
  return key !== null;
}

