# Tumblr Blog Likes API

This document describes the TypeScript/JavaScript functions for interacting with the Tumblr API `/blog/{identifier}/likes` endpoint.

## Overview

The blog likes endpoint allows you to retrieve posts that a blog has liked. **Important**: This endpoint only works for blogs you own (authenticated user's blogs).

## Functions

### `getBlogLikes`

Fetches liked posts from a blog with pagination support.

**Location**: `server/tumblrOAuth.ts`

**Signature**:
```typescript
async function getBlogLikes(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string,
  options: BlogLikesOptions = {}
): Promise<BlogLikesResponse>
```

**Parameters**:
- `blogIdentifier` (string): The blog name or identifier (e.g., "myblog.tumblr.com")
- `accessToken` (string): OAuth access token
- `accessTokenSecret` (string): OAuth access token secret
- `options` (BlogLikesOptions): Pagination and limit options
  - `limit` (number, 1-20): Number of results per request (default: 20)
  - `offset` (number): Post number to start at (0 is first, max 1000 total posts with offset)
  - `before` (timestamp, optional): Retrieve posts liked before this timestamp (alternative to offset)
  - `after` (timestamp, optional): Retrieve posts liked after this timestamp (alternative to offset)

**Returns**: `BlogLikesResponse` object containing:
- `likedPosts` (array): Array of post objects with metadata
- `likedCount` (number): Total number of liked posts
- `nextOffset` (number, optional): Suggested offset for next request
- `nextTimestamp` (number, optional): Suggested timestamp for next request
- `hasMore` (boolean): Whether there are more posts available
- `warning` (string, optional): Warning message if applicable

### `getAllBlogLikes`

Helper function that automatically handles pagination beyond 1000 posts, switching from offset-based to timestamp-based pagination.

**Signature**:
```typescript
async function getAllBlogLikes(
  blogIdentifier: string,
  accessToken: string,
  accessTokenSecret: string,
  startOffset: number = 0,
  onProgress?: (current: number, total: number) => void
): Promise<BlogLikesResponse['likedPosts']>
```

## API Limitations

⚠️ **IMPORTANT LIMITATIONS:**

1. **Only works for blogs you own** - The endpoint requires OAuth authentication and only works for blogs belonging to the authenticated user
2. **Maximum 1000 posts with offset** - The `offset` parameter can only retrieve up to 1000 posts. Use timestamp-based pagination (`before`/`after`) for posts beyond 1000
3. **Privacy settings** - Respects blog privacy settings ("Share posts you like" must be enabled in blog settings)
4. **Max 20 posts per call** - Each API call returns a maximum of 20 posts
5. **Rate limiting** - Subject to Tumblr's API rate limits (1,000 requests/hour, 5,000 requests/day)

## Validation Rules

- Only one pagination method allowed at a time (`offset`, `before`, or `after`)
- `limit` must be between 1 and 20
- `offset` must not exceed 1000 (use timestamp pagination for posts beyond 1000)

## Error Handling

The function handles various error scenarios:

- **Authentication failures** (401/403): Returns error message indicating the endpoint only works for blogs you own
- **Rate limiting** (429): Returns specific rate limit error message
- **Privacy settings**: Returns error if blog privacy settings prevent accessing likes
- **Invalid parameters**: Returns validation errors for invalid pagination parameters

## Usage Examples

### Example 1: Basic Call with Offset

```typescript
import { getBlogLikes } from './server/tumblrOAuth';

try {
  const result = await getBlogLikes(
    'myblog.tumblr.com',
    accessToken,
    accessTokenSecret,
    { limit: 20, offset: 0 }
  );

  console.log(`Found ${result.likedCount} total liked posts`);
  console.log(`Retrieved ${result.likedPosts.length} posts`);
  
  // Access post data
  result.likedPosts.forEach(post => {
    console.log(`- ${post.blog_name}: ${post.post_url}`);
    console.log(`  Liked on: ${new Date(post.liked_timestamp * 1000).toLocaleString()}`);
  });

  // Paginate to next page
  if (result.nextOffset !== undefined) {
    const nextPage = await getBlogLikes(
      'myblog.tumblr.com',
      accessToken,
      accessTokenSecret,
      { limit: 20, offset: result.nextOffset }
    );
  }
} catch (error) {
  console.error('Error fetching likes:', error.message);
}
```

### Example 2: Pagination Beyond 1000 Posts Using Timestamps

```typescript
import { getBlogLikes } from './server/tumblrOAuth';

// First, get posts up to offset 1000
let result = await getBlogLikes(
  'myblog.tumblr.com',
  accessToken,
  accessTokenSecret,
  { limit: 20, offset: 980 } // Near the 1000 limit
);

// Check if we need to switch to timestamp pagination
if (result.warning && result.nextTimestamp) {
  console.log('Switching to timestamp-based pagination');
  
  // Continue with timestamp pagination
  result = await getBlogLikes(
    'myblog.tumblr.com',
    accessToken,
    accessTokenSecret,
    { limit: 20, before: result.nextTimestamp }
  );
}
```

### Example 3: Using getAllBlogLikes Helper

```typescript
import { getAllBlogLikes } from './server/tumblrOAuth';

try {
  const allLikes = await getAllBlogLikes(
    'myblog.tumblr.com',
    accessToken,
    accessTokenSecret,
    0, // Start from offset 0
    (current, total) => {
      // Progress callback
      console.log(`Fetched ${current} of ${total} posts`);
    }
  );

  console.log(`Retrieved ${allLikes.length} total liked posts`);
  
  // Process all posts
  allLikes.forEach(post => {
    // Your processing logic here
  });
} catch (error) {
  console.error('Error fetching all likes:', error.message);
}
```

### Example 4: Error Handling

```typescript
import { getBlogLikes } from './server/tumblrOAuth';

try {
  const result = await getBlogLikes(
    'myblog.tumblr.com',
    accessToken,
    accessTokenSecret,
    { limit: 20, offset: 0 }
  );
} catch (error: any) {
  if (error.message.includes('Rate limit')) {
    console.error('Rate limit exceeded. Please wait before making more requests.');
  } else if (error.message.includes('Authentication failed')) {
    console.error('Authentication failed. This endpoint only works for blogs you own.');
  } else if (error.message.includes('privacy')) {
    console.error('Blog privacy settings prevent accessing likes.');
  } else if (error.message.includes('limit must be')) {
    console.error('Invalid limit parameter:', error.message);
  } else if (error.message.includes('offset cannot exceed')) {
    console.error('Offset too high. Use timestamp pagination for posts beyond 1000.');
  } else {
    console.error('Unexpected error:', error.message);
  }
}
```

## Backend API Endpoints

### GET `/api/tumblr/blog/:blogIdentifier/likes`

Fetches liked posts for a blog (only works for blogs you own).

**Query Parameters**:
- `userId` (required): User ID for OAuth authentication
- `limit` (optional): Number of results (1-20, default: 20)
- `offset` (optional): Starting offset (max 1000)
- `before` (optional): Timestamp for posts before this time
- `after` (optional): Timestamp for posts after this time

**Example Request**:
```bash
curl "http://localhost:3001/api/tumblr/blog/myblog.tumblr.com/likes?userId=123&limit=20&offset=0"
```

**Response**:
```json
{
  "likedPosts": [
    {
      "blog_name": "example-blog",
      "id": 123456789,
      "post_url": "https://example-blog.tumblr.com/post/123456789",
      "type": "photo",
      "timestamp": 1234567890,
      "date": "2024-01-01 12:00:00 GMT",
      "liked_timestamp": 1234567890,
      "note_count": 42,
      "tags": ["photography", "art"],
      "photos": [...]
    }
  ],
  "likedCount": 1500,
  "nextOffset": 20,
  "hasMore": true
}
```

### GET `/api/tumblr/blog/:blogIdentifier/likes/all`

Fetches all liked posts with automatic pagination (switches from offset to timestamp pagination automatically).

**Query Parameters**:
- `userId` (required): User ID for OAuth authentication
- `startOffset` (optional): Starting offset (default: 0)

**Example Request**:
```bash
curl "http://localhost:3001/api/tumblr/blog/myblog.tumblr.com/likes/all?userId=123"
```

## TypeScript Types

```typescript
interface BlogLikesOptions {
  limit?: number;      // 1-20, default: 20
  offset?: number;     // Max 1000
  before?: number;     // Timestamp
  after?: number;      // Timestamp
}

interface BlogLikesResponse {
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
  likedCount: number;
  nextOffset?: number;
  nextTimestamp?: number;
  hasMore: boolean;
  warning?: string;
}
```

## Best Practices

1. **Use offset pagination for first 1000 posts** - It's simpler and more efficient
2. **Switch to timestamp pagination after 1000** - Use the `warning` and `nextTimestamp` fields to detect when to switch
3. **Respect rate limits** - Implement exponential backoff for 429 errors
4. **Handle privacy settings** - Check if blog has "Share posts you like" enabled
5. **Use getAllBlogLikes for bulk operations** - It handles pagination automatically
6. **Cache results when possible** - Liked posts don't change frequently

## Troubleshooting

### "Authentication failed" Error
- Ensure OAuth tokens are valid
- Verify the blog belongs to the authenticated user
- Check that OAuth flow completed successfully

### "Rate limit exceeded" Error
- Wait before making more requests
- Implement request throttling
- Consider caching results

### "Privacy settings prevent accessing likes" Error
- Enable "Share posts you like" in Tumblr blog settings
- This setting is found in Blog Settings → Privacy

### "offset cannot exceed 1000" Error
- Use timestamp-based pagination (`before` parameter) for posts beyond 1000
- The function automatically provides `nextTimestamp` when approaching the limit

