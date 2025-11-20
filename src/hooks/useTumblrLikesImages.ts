/**
 * Custom hook for fetching and paginating Tumblr liked posts images
 * 
 * Handles:
 * - Offset-based pagination (0-1000 posts)
 * - Timestamp-based pagination (beyond 1000 posts)
 * - Image extraction from liked posts
 * - Pagination state management
 * - Error handling and retry logic
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type {
  TumblrLikedPostImage,
  TumblrLikesImagesPagination,
  TumblrLikesImagesState,
} from '../types/tumblrLikesImages';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const MAX_OFFSET = 1000;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 20;
const MIN_LIMIT = 1;

interface UseTumblrLikesImagesOptions {
  blogIdentifier: string;
  apiKey?: string;
  limit?: number;
  autoLoad?: boolean;
  targetImageCount?: number; // Target number of images to fetch (default: 50)
  onError?: (error: Error) => void;
}

interface UseTumblrLikesImagesReturn {
  images: TumblrLikedPostImage[];
  pagination: TumblrLikesImagesPagination;
  loading: boolean;
  error: Error | null;
  fetchNext: () => Promise<void>;
  fetchPrevious: () => Promise<void>;
  refresh: () => Promise<void>;
  canGoNext: boolean;
  canGoPrevious: boolean;
}

/**
 * Extract images from a liked post
 * Returns empty array if post has no images
 */
function extractImagesFromLikedPost(post: any): TumblrLikedPostImage[] {
  const images: TumblrLikedPostImage[] = [];

  // Handle photo posts (most common)
  if (post.photos && Array.isArray(post.photos) && post.photos.length > 0) {
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
          caption: photo.caption || post.caption || post.summary || '',
          postType: post.type || 'photo',
        });
      }
    });
  }

  // Handle text posts with embedded images (less common but possible)
  // Some text posts may have images in body HTML
  if (post.type === 'text' && post.body) {
    // Extract image URLs from HTML body if present
    // This is a basic implementation - could be enhanced with HTML parsing
    const imgRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const matches = post.body.matchAll(imgRegex);
    let imgIndex = 0;
    for (const match of matches) {
      if (match[1]) {
        images.push({
          id: `${post.id}-embedded-img-${imgIndex}`,
          url: match[1],
          width: 0, // Unknown from HTML
          height: 0,
          postId: post.id,
          blogName: post.blog_name || 'unknown',
          likedTimestamp: post.liked_timestamp || post.timestamp,
          tags: post.tags || [],
          postUrl: post.post_url || '',
          caption: post.summary || post.body.substring(0, 100),
          postType: 'text',
        });
        imgIndex++;
      }
    }
  }

  return images;
}

export function useTumblrLikesImages({
  blogIdentifier,
  apiKey,
  limit = DEFAULT_LIMIT,
  autoLoad = true,
  targetImageCount = 50, // Default: fetch until we have 50 images
  onError,
}: UseTumblrLikesImagesOptions): UseTumblrLikesImagesReturn {
  // Validate limit
  const validatedLimit = Math.max(MIN_LIMIT, Math.min(MAX_LIMIT, limit));

  const [state, setState] = useState<TumblrLikesImagesState>({
    images: [],
    pagination: {
      method: 'offset',
      offset: 0,
      hasMore: true,
      reachedOffsetLimit: false,
    },
    loading: false,
    error: null,
    timestampHistory: [],
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const responseCacheRef = useRef<Map<string, any>>(new Map());

  /**
   * Make API request to fetch liked posts
   * @param offset - Offset for pagination (0-1000)
   * @param before - Timestamp for posts before this time (beyond 1000)
   */
  const fetchLikedPosts = useCallback(
    async (offset?: number, before?: number): Promise<any> => {
      // Cancel previous request if still pending
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
        ? blogIdentifier.toLowerCase()
        : `${blogIdentifier.toLowerCase()}.tumblr.com`;

      // Build cache key
      const cacheKey = `likes-${normalizedBlog}-${offset ?? 'none'}-${before ?? 'none'}`;

      // Check cache first
      if (responseCacheRef.current.has(cacheKey)) {
        return responseCacheRef.current.get(cacheKey);
      }

      const params = new URLSearchParams({
        limit: String(validatedLimit),
      });

      // Add pagination parameter (only one at a time)
      if (before !== undefined) {
        params.append('before', String(before));
      } else if (offset !== undefined) {
        if (offset > MAX_OFFSET) {
          throw new Error(
            `Offset cannot exceed ${MAX_OFFSET}. Use timestamp-based pagination for posts beyond this limit.`
          );
        }
        params.append('offset', String(offset));
      }

      const url = `${API_URL}/api/tumblr/blog/${normalizedBlog}/likes?${params}`;

      try {
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

        const data = await response.json();

        // Check for API-level errors
        if (data.meta && data.meta.status !== 200) {
          const errorMsg = data.meta.msg || 'Unknown error';
          if (data.meta.status === 429) {
            throw new Error('Rate limit exceeded');
          }
          throw new Error(`API error: ${errorMsg}`);
        }

        // Cache successful response
        responseCacheRef.current.set(cacheKey, data);

        // Limit cache size (keep last 10 responses)
        if (responseCacheRef.current.size > 10) {
          const firstKey = responseCacheRef.current.keys().next().value;
          responseCacheRef.current.delete(firstKey);
        }

        return data;
      } catch (err: any) {
        if (err.name === 'AbortError') {
          throw new Error('Request cancelled');
        }
        throw err;
      }
    },
    [blogIdentifier, validatedLimit]
  );

  /**
   * Load images from liked posts until we reach targetImageCount
   * @param offset - Offset for pagination
   * @param before - Timestamp for posts before this time
   * @param append - Whether to append to existing images or replace
   */
  const loadImages = useCallback(
    async (offset?: number, before?: number, append: boolean = false) => {
      setState((prev) => ({ ...prev, loading: true, error: null }));

      try {
        let currentOffset = offset ?? 0;
        let currentBefore = before;
        let allExtractedImages: TumblrLikedPostImage[] = [];
        let totalLikedCount: number | undefined;
        let hasMorePosts = true;
        let reachedOffsetLimit = false;
        let oldestTimestamp: number | undefined;
        let fetchedPostCount = 0;
        const maxPostsToFetch = 100; // Safety limit to avoid infinite loops

        // Keep fetching until we have enough images or run out of posts
        while (allExtractedImages.length < targetImageCount && hasMorePosts && fetchedPostCount < maxPostsToFetch) {
          const response = await fetchLikedPosts(currentOffset, currentBefore);
          const likedPosts = response.response?.liked_posts || [];
          const likedCount = response.response?.liked_count || 0;

          if (totalLikedCount === undefined) {
            totalLikedCount = likedCount;
          }

          if (likedPosts.length === 0) {
            hasMorePosts = false;
            break;
          }

          // Extract images from all posts
          likedPosts.forEach((post: any) => {
            const postImages = extractImagesFromLikedPost(post);
            allExtractedImages.push(...postImages);
          });

          fetchedPostCount += likedPosts.length;

          // Check if we've reached our target
          if (allExtractedImages.length >= targetImageCount) {
            break;
          }

          // Update pagination for next batch
          reachedOffsetLimit = currentOffset >= MAX_OFFSET;
          hasMorePosts = likedPosts.length === validatedLimit;

          if (likedPosts.length > 0) {
            const oldestPost = likedPosts[likedPosts.length - 1];
            oldestTimestamp = oldestPost.liked_timestamp || oldestPost.timestamp;
          }

          // Determine next pagination parameters
          if (reachedOffsetLimit && oldestTimestamp) {
            // Switch to timestamp-based pagination
            currentBefore = oldestTimestamp;
            currentOffset = undefined;
          } else if (!reachedOffsetLimit) {
            // Continue with offset pagination
            currentOffset = (currentOffset ?? 0) + validatedLimit;
            if (currentOffset >= MAX_OFFSET) {
              reachedOffsetLimit = true;
            }
          } else {
            // No more posts available
            hasMorePosts = false;
            break;
          }
        }

        setState((prev) => {
          // Update timestamp history
          const newTimestampHistory = [...prev.timestampHistory];
          if (oldestTimestamp && !newTimestampHistory.includes(oldestTimestamp)) {
            newTimestampHistory.push(oldestTimestamp);
          }

          // Determine pagination method
          let paginationMethod: 'offset' | 'before' = 'offset';
          let paginationOffset: number | undefined = currentOffset;
          let paginationBefore: number | undefined = currentBefore;

          if (reachedOffsetLimit && oldestTimestamp) {
            paginationMethod = 'before';
            paginationOffset = undefined;
            paginationBefore = oldestTimestamp;
          }

          return {
            ...prev,
            images: append ? [...prev.images, ...allExtractedImages] : allExtractedImages,
            pagination: {
              method: paginationMethod,
              offset: paginationOffset,
              before: paginationBefore,
              totalLikedCount: totalLikedCount,
              hasMore: hasMorePosts && allExtractedImages.length < targetImageCount,
              reachedOffsetLimit,
            },
            timestampHistory: newTimestampHistory,
            loading: false,
          };
        });

        console.log(
          `[useTumblrLikesImages] Fetched ${fetchedPostCount} posts, extracted ${allExtractedImages.length} images (target: ${targetImageCount})`
        );
      } catch (err: any) {
        const error = err instanceof Error ? err : new Error(String(err));
        setState((prev) => ({ ...prev, error, loading: false }));
        if (onError) {
          onError(error);
        }
      }
    },
    [fetchLikedPosts, validatedLimit, targetImageCount, onError]
  );

  /**
   * Fetch next page of images (loads 50 more images)
   */
  const fetchNext = useCallback(async () => {
    setState((prev) => {
      if (!prev.pagination.hasMore || prev.loading) return prev;
      return prev;
    });

    // Get current state
    const currentState = state;
    if (!currentState.pagination.hasMore || currentState.loading) return;

    const { pagination } = currentState;
    let nextOffset: number | undefined;
    let nextBefore: number | undefined;

    if (pagination.method === 'offset' && pagination.offset !== undefined) {
      nextOffset = pagination.offset;
    } else if (pagination.method === 'before' && pagination.before !== undefined) {
      nextBefore = pagination.before;
    }

    // Load 50 more images starting from current position
    await loadImages(nextOffset, nextBefore, false);
  }, [state, loadImages]);

  /**
   * Fetch previous page of images
   */
  const fetchPrevious = useCallback(async () => {
    const currentState = state;
    if (currentState.loading) return;

    const { pagination, timestampHistory } = currentState;
    let prevOffset: number | undefined;
    let prevBefore: number | undefined;

    if (pagination.method === 'offset' && pagination.offset !== undefined) {
      const newOffset = Math.max(0, pagination.offset - validatedLimit);
      prevOffset = newOffset;
    } else if (pagination.method === 'before') {
      // For timestamp-based pagination going backward, we need to use the history
      // This is a simplified approach - in production, you might want more sophisticated navigation
      if (timestampHistory.length > 1) {
        // Use the second-to-last timestamp
        prevBefore = timestampHistory[timestampHistory.length - 2];
      } else {
        // Fall back to offset pagination
        prevOffset = MAX_OFFSET - validatedLimit;
      }
    }

    // Load images with calculated pagination
    await loadImages(prevOffset, prevBefore, false);
  }, [state, validatedLimit, loadImages]);

  /**
   * Refresh current page
   */
  const refresh = useCallback(async () => {
    const currentState = state;
    const { pagination } = currentState;
    await loadImages(pagination.offset, pagination.before, false);
  }, [state, loadImages]);

  // Auto-load first page
  useEffect(() => {
    if (autoLoad && state.images.length === 0 && !state.loading && !state.error) {
      loadImages(0, undefined, false).catch((err) => {
        console.error('[useTumblrLikesImages] Error loading initial images:', err);
      });
    }
  }, [autoLoad, state.images.length, state.loading, state.error, loadImages]);

  const canGoNext = state.pagination.hasMore && !state.loading;
  const canGoPrevious =
    (state.pagination.method === 'offset'
      ? (state.pagination.offset ?? 0) > 0
      : state.timestampHistory.length > 1) && !state.loading;

  return {
    images: state.images,
    pagination: state.pagination,
    loading: state.loading,
    error: state.error,
    fetchNext,
    fetchPrevious,
    refresh,
    canGoNext,
    canGoPrevious,
  };
}

