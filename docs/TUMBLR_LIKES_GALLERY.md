# Tumblr Likes Gallery Component

A comprehensive React component for displaying images from Tumblr liked posts with full pagination support, respecting Tumblr API limitations.

## Features

- ✅ **Offset-based pagination** (0-1000 posts)
- ✅ **Timestamp-based pagination** (beyond 1000 posts)
- ✅ **Image extraction** from multiple post types
- ✅ **Responsive grid layout** with lazy loading
- ✅ **Full pagination controls** (Previous/Next, Jump to Page)
- ✅ **Error handling** with retry logic
- ✅ **Loading states** and empty states
- ✅ **Image lightbox** for full-size viewing
- ✅ **TypeScript** with comprehensive types

## Installation

The component is already integrated into the codebase. Import it where needed:

```typescript
import { TumblrLikesGallery } from '@/features/blog/TumblrLikesGallery';
```

## Usage

### Basic Example

```typescript
import { TumblrLikesGallery } from '@/features/blog/TumblrLikesGallery';

function MyComponent() {
  return (
    <TumblrLikesGallery
      blogIdentifier="myblog.tumblr.com"
      userId="user-id-here" // Optional, for OAuth
      postsPerPage={20} // Optional, default: 20
      autoLoadFirstPage={true} // Optional, default: true
      onError={(error) => {
        console.error('Error loading likes:', error);
      }}
    />
  );
}
```

### Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `blogIdentifier` | `string` | Yes | - | Blog identifier (e.g., "myblog" or "myblog.tumblr.com") |
| `userId` | `string` | No | - | User ID for OAuth authentication (optional) |
| `postsPerPage` | `number` | No | `20` | Number of posts per page (1-20) |
| `autoLoadFirstPage` | `boolean` | No | `true` | Automatically load first page on mount |
| `onError` | `(error: Error) => void` | No | - | Error callback function |

## Pagination Strategy

### Offset-Based Pagination (Pages 1-50)

For the first 1000 posts (assuming 20 posts per page = 50 pages), the component uses offset-based pagination:

- **Offset range**: 0-1000
- **Page calculation**: `offset = (page - 1) * postsPerPage`
- **Example**: Page 1 = offset 0, Page 2 = offset 20, Page 50 = offset 980

### Timestamp-Based Pagination (Beyond Page 50)

When navigating beyond the 1000-post limit, the component automatically switches to timestamp-based pagination:

- **Transition point**: Captures the `liked_timestamp` of the oldest post on page 50
- **Method**: Uses `before` parameter with the timestamp
- **Caching**: Timestamps are cached for efficient backward navigation
- **Limitation**: Forward navigation beyond 1000 posts requires sequential fetching

## API Endpoint

The component uses the Tumblr API endpoint:

```
GET /v2/blog/{blog-identifier}/likes
```

**Parameters:**
- `limit` (1-20): Number of posts per request
- `offset` (0-1000): Post number to start at (offset pagination)
- `before` (timestamp): Retrieve posts liked before this timestamp
- `after` (timestamp): Retrieve posts liked after this timestamp

**Important**: Only one pagination parameter can be used at a time (offset XOR before XOR after).

## Component Architecture

### Custom Hook: `useTumblrLikesPagination`

Manages all pagination logic, API calls, and state:

```typescript
const {
  images,              // Array of extracted images
  pagination,          // Current pagination state
  loading,             // Loading state
  error,               // Error state
  totalLikedCount,     // Total liked posts count
  hasMore,             // Whether more posts are available
  fetchPage,           // Fetch specific page
  fetchNext,           // Fetch next page
  fetchPrevious,       // Fetch previous page
  jumpToPage,          // Jump to specific page (offset limit only)
  refresh,             // Refresh current page
  canJumpToPage,       // Whether jump to page is available
} = useTumblrLikesPagination({
  blogIdentifier: 'myblog.tumblr.com',
  userId: 'user-id',
  postsPerPage: 20,
  onError: (error) => console.error(error),
});
```

### Sub-Components

1. **LikesImageGrid**: Displays images in a responsive grid with lightbox
2. **LikesPaginationControls**: Pagination buttons and page jump input

## Error Handling

The component handles various error scenarios:

- **401/403**: Blog not owned by authenticated user
- **429**: Rate limiting (displays user-friendly message)
- **Network errors**: Retry button available
- **Invalid pagination**: Clear error messages

## Performance Optimizations

- **Lazy loading**: Images load as user scrolls
- **Request cancellation**: Previous requests are cancelled when new ones are made
- **Timestamp caching**: Caches timestamps for efficient navigation
- **Loading skeletons**: Shows loading placeholders during fetch

## Limitations

1. **Offset limit**: Maximum 1000 posts retrievable with offset parameter
2. **Jump to page**: Only works within offset limit (pages 1-50 with 20 posts/page)
3. **Own blog only**: Endpoint only works for blogs you own
4. **Privacy settings**: Respects blog privacy settings ("Share posts you like")

## Example: Integration in Blog Page

```typescript
import { TumblrLikesGallery } from '@/features/blog/TumblrLikesGallery';
import { useAuth } from '@/hooks/queries/useAuth';

function BlogPage({ blogIdentifier }: { blogIdentifier: string }) {
  const { user } = useAuth();
  
  return (
    <div>
      <h1>Blog: {blogIdentifier}</h1>
      <TumblrLikesGallery
        blogIdentifier={blogIdentifier}
        userId={user?.id}
        postsPerPage={20}
        onError={(error) => {
          // Handle error (show toast, log, etc.)
          console.error('Failed to load liked posts:', error);
        }}
      />
    </div>
  );
}
```

## TypeScript Types

All types are exported from `@/types/tumblrLikes`:

```typescript
import type {
  TumblrLikedPost,
  TumblrLikesResponse,
  PaginationState,
  PaginationMethod,
  LikedImage,
  TimestampCache,
} from '@/types/tumblrLikes';
```

## Future Enhancements

- [ ] Date range filtering using `before`/`after` timestamps
- [ ] Virtual scrolling for very large datasets
- [ ] Prefetch next page on scroll
- [ ] Export liked posts to CSV/JSON
- [ ] Filter by post type or tags
- [ ] Search within liked posts

## Troubleshooting

### Images not loading

- Check that the blog identifier is correct
- Verify OAuth connection if required
- Check browser console for API errors
- Ensure "Share posts you like" is enabled in blog settings

### Pagination not working beyond page 50

- This is expected behavior - timestamp pagination is used
- The component will automatically switch methods
- Forward navigation may be slower due to sequential fetching

### Rate limiting errors

- Tumblr API allows 1,000 requests/hour and 5,000 requests/day
- The component displays a user-friendly error message
- Wait before retrying

