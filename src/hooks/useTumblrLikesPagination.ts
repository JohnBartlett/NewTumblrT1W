/**
 * Custom hook for managing Tumblr Likes API pagination
 * Handles offset-based pagination (0-1000) and timestamp-based pagination beyond 1000 posts
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  PaginationState,
  PaginationMethod,
  TumblrLikesResponse,
  LikedImage,
  TimestampCache,
} from '../types/tumblrLikes';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MAX_OFFSET = 1000;
const DEFAULT_POSTS_PER_PAGE = 20;
const MAX_POSTS_PER_PAGE = 20;
const MIN_POSTS_PER_PAGE = 1;

interface UseTumblrLikesPaginationOptions {
  blogIdentifier: string;
  userId?: string;
  postsPerPage?: number;
  onError?: (error: Error) => void;
}

interface UseTumblrLikesPaginationReturn {
  images: LikedImage[];
  pagination: PaginationState;
  loading: boolean;
  error: Error | null;
  totalLikedCount: number | undefined;
  hasMore: boolean;
  fetchPage: (page: number) => Promise<void>;
  fetchNext: () => Promise<void>;
  fetchPrevious: () => Promise<void>;
  jumpToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  canJumpToPage: boolean;
}

/**
 * Extract images from a liked post
 */
function extractImagesFromPost(post: any): LikedImage[] {
  const images: LikedImage[] = [];

  // Handle photo posts
  if (post.photos && Array.isArray(post.photos)) {
    post.photos.forEach((photo: any, index: number) => {
      if (photo.original_size?.url) {
        images.push({
          id: `${post.id}-img-${index}`,
          url: photo.original_size.url,
          width: photo.original_size.width || 0,
          height: photo.original_size.height || 0,
          postId: post.id,
          blogName: post.blog_name || 'unknown',
          likedTimestamp: post.liked_timestamp || post.timestamp,
          tags: post.tags || [],
          postUrl: post.post_url || '',
          caption: photo.caption || post.caption || post.summary,
        });
      }
    });
  }

  return images;
}

/**
 * Calculate page number from offset
 */
function offsetToPage(offset: number, postsPerPage: number): number {
  return Math.floor(offset / postsPerPage) + 1;
}

/**
 * Calculate offset from page number
 */
function pageToOffset(page: number, postsPerPage: number): number {
  return (page - 1) * postsPerPage;
}

export function useTumblrLikesPagination({
  blogIdentifier,
  userId,
  postsPerPage = DEFAULT_POSTS_PER_PAGE,
  onError,
}: UseTumblrLikesPaginationOptions): UseTumblrLikesPaginationReturn {
  // Validate postsPerPage
  const validatedPostsPerPage = Math.max(
    MIN_POSTS_PER_PAGE,
    Math.min(MAX_POSTS_PER_PAGE, postsPerPage)
  );

  const [images, setImages] = useState<LikedImage[]>([]);
  const [pagination, setPagination] = useState<PaginationState>({
    method: 'offset',
    offset: 0,
    currentPage: 1,
    postsPerPage: validatedPostsPerPage,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [totalLikedCount, setTotalLikedCount] = useState<number | undefined>();
  const [hasMore, setHasMore] = useState(true);

  // Cache for timestamp-based pagination (page -> timestamp)
  const timestampCacheRef = useRef<TimestampCache>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Make API request to fetch liked posts
   */
  const fetchLikedPosts = useCallback(
    async (
      method: PaginationMethod,
      offset?: number,
      before?: number,
      after?: number
    ): Promise<TumblrLikesResponse> => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
        ? blogIdentifier.toLowerCase()
        : `${blogIdentifier.toLowerCase()}.tumblr.com`;

      const params = new URLSearchParams({
        limit: String(validatedPostsPerPage),
      });

      // Add pagination parameter (only one at a time)
      if (method === 'offset' && offset !== undefined) {
        if (offset > MAX_OFFSET) {
          throw new Error(
            `Offset cannot exceed ${MAX_OFFSET}. Use timestamp-based pagination for posts beyond this limit.`
          );
        }
        params.append('offset', String(offset));
      } else if (method === 'before' && before !== undefined) {
        params.append('before', String(before));
      } else if (method === 'after' && after !== undefined) {
        params.append('after', String(after));
      }

      const url = `${API_URL}/api/tumblr/blog/${normalizedBlog}/likes?${params}`;

      const response = await fetch(url, {
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error || errorData.meta?.msg || 'Failed to fetch liked posts';

        if (response.status === 401 || response.status === 403) {
          throw new Error(
            'Liked posts are only available for your own blog. This endpoint only works for blogs you own.'
          );
        } else if (response.status === 429) {
          throw new Error('Rate limit exceeded. Please wait before making more requests.');
        } else {
          throw new Error(`API error (${response.status}): ${errorMsg}`);
        }
      }

      const data: TumblrLikesResponse = await response.json();

      // Check for API-level errors
      if (data.meta && data.meta.status !== 200) {
        const errorMsg = data.meta.msg || 'Unknown error';
        if (data.meta.status === 429) {
          throw new Error('Rate limit exceeded');
        }
        throw new Error(`API error: ${errorMsg}`);
      }

      return data;
    },
    [blogIdentifier, validatedPostsPerPage]
  );

  /**
   * Fetch a specific page
   */
  const fetchPage = useCallback(
    async (page: number) => {
      if (page < 1) {
        throw new Error('Page number must be at least 1');
      }

      setLoading(true);
      setError(null);

      try {
        const offset = pageToOffset(page, validatedPostsPerPage);
        let method: PaginationMethod = 'offset';
        let before: number | undefined;
        let after: number | undefined;

        // Check if we need timestamp-based pagination
        if (offset >= MAX_OFFSET) {
          // Use timestamp cache if available
          if (timestampCacheRef.current[page]) {
            method = 'before';
            before = timestampCacheRef.current[page];
          } else {
            // Need to navigate from offset pagination to timestamp pagination
            // Fetch the last available offset page (page 50 if 20 per page) to get transition timestamp
            const lastOffsetPage = Math.floor(MAX_OFFSET / validatedPostsPerPage);
            const lastOffset = pageToOffset(lastOffsetPage, validatedPostsPerPage);
            
            // If we have the transition timestamp cached, use it
            if (timestampCacheRef.current[lastOffsetPage]) {
              // Calculate how many pages beyond the offset limit we need to go
              const pagesBeyondOffset = page - lastOffsetPage;
              // For now, fetch the transition point and use its timestamp
              // In a real implementation, you'd need to track multiple timestamps
              method = 'before';
              before = timestampCacheRef.current[lastOffsetPage];
            } else {
              // Fetch the transition point to get the timestamp
              const transitionResponse = await fetchLikedPosts('offset', lastOffset);
              const transitionPosts = transitionResponse.response.liked_posts || [];
              if (transitionPosts.length > 0) {
                const oldestPost = transitionPosts[transitionPosts.length - 1];
                if (oldestPost?.liked_timestamp) {
                  method = 'before';
                  before = oldestPost.liked_timestamp;
                  timestampCacheRef.current[lastOffsetPage] = before;
                } else {
                  throw new Error('Cannot determine timestamp for pagination beyond 1000 posts');
                }
              } else {
                throw new Error('No posts found at transition point');
              }
            }
          }
        }

        const response = await fetchLikedPosts(method, offset, before, after);
        const likedPosts = response.response.liked_posts || [];
        const likedCount = response.response.liked_count || 0;

        // Extract images from all posts
        const extractedImages: LikedImage[] = [];
        likedPosts.forEach((post) => {
          const postImages = extractImagesFromPost(post);
          extractedImages.push(...postImages);
        });

        // Store timestamp for future navigation
        if (likedPosts.length > 0) {
          const oldestPost = likedPosts[likedPosts.length - 1];
          if (oldestPost.liked_timestamp) {
            timestampCacheRef.current[page] = oldestPost.liked_timestamp;
          }
        }

        setImages(extractedImages);
        setTotalLikedCount(likedCount);
        setHasMore(likedPosts.length === validatedPostsPerPage);

        setPagination({
          method,
          offset: method === 'offset' ? offset : undefined,
          before: method === 'before' ? before : undefined,
          after: method === 'after' ? after : undefined,
          currentPage: page,
          postsPerPage: validatedPostsPerPage,
          totalLikedCount: likedCount,
        });
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        if (onError) {
          onError(error);
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchLikedPosts, validatedPostsPerPage, onError]
  );

  /**
   * Fetch next page
   */
  const fetchNext = useCallback(async () => {
    if (!hasMore || loading) return;
    await fetchPage(pagination.currentPage + 1);
  }, [fetchPage, pagination.currentPage, hasMore, loading]);

  /**
   * Fetch previous page
   */
  const fetchPrevious = useCallback(async () => {
    if (pagination.currentPage <= 1 || loading) return;
    await fetchPage(pagination.currentPage - 1);
  }, [fetchPage, pagination.currentPage, loading]);

  /**
   * Jump to specific page (only works within offset limit)
   */
  const jumpToPage = useCallback(
    async (page: number) => {
      const offset = pageToOffset(page, validatedPostsPerPage);
      if (offset > MAX_OFFSET) {
        throw new Error(
          `Cannot jump to page ${page}. Maximum page with offset pagination is ${Math.floor(MAX_OFFSET / validatedPostsPerPage)}`
        );
      }
      await fetchPage(page);
    },
    [fetchPage, validatedPostsPerPage]
  );

  /**
   * Refresh current page
   */
  const refresh = useCallback(async () => {
    await fetchPage(pagination.currentPage);
  }, [fetchPage, pagination.currentPage]);

  // Calculate if we can jump to pages (only within offset limit)
  const canJumpToPage = pagination.currentPage <= Math.floor(MAX_OFFSET / validatedPostsPerPage);

  return {
    images,
    pagination,
    loading,
    error,
    totalLikedCount,
    hasMore,
    fetchPage,
    fetchNext,
    fetchPrevious,
    jumpToPage,
    refresh,
    canJumpToPage,
  };
}

