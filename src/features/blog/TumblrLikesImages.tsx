/**
 * Tumblr Likes Images Component
 * 
 * Displays ONLY images from a user's Tumblr liked posts with full pagination support.
 * 
 * Features:
 * - Fetches liked posts from /v2/blog/{blog-identifier}/likes endpoint
 * - Extracts and displays only images (filters out posts without images)
 * - Handles offset-based pagination (0-1000 posts)
 * - Automatically switches to timestamp-based pagination beyond 1000 posts
 * - Responsive image grid with lazy loading
 * - Full pagination controls (Previous/Next)
 * - Error handling and loading states
 * - Performance optimizations (caching, prefetching)
 * 
 * @example
 * ```tsx
 * <TumblrLikesImages
 *   blogIdentifier="myblog.tumblr.com"
 *   apiKey="your-api-key"
 *   limit={20}
 *   onError={(error) => console.error(error)}
 * />
 * ```
 */

import { useEffect, useRef } from 'react';
import { useTumblrLikesImages } from '../../hooks/useTumblrLikesImages';
import { LikesImagesGrid } from '../../components/ui/LikesImagesGrid';
import { LikesImagesPagination } from '../../components/ui/LikesImagesPagination';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface TumblrLikesImagesProps {
  /** Blog identifier (e.g., "myblog" or "myblog.tumblr.com") */
  blogIdentifier: string;
  /** Tumblr API key (optional, can be set via env var) */
  apiKey?: string;
  /** Number of posts per request (1-20, default: 20) */
  limit?: number;
  /** Target number of images to fetch (default: 50) */
  targetImageCount?: number;
  /** Automatically load first page on mount (default: true) */
  autoLoad?: boolean;
  /** Error callback */
  onError?: (error: Error) => void;
}

export function TumblrLikesImages({
  blogIdentifier,
  apiKey,
  limit = 20,
  targetImageCount = 50,
  autoLoad = true,
  onError,
}: TumblrLikesImagesProps) {
  const {
    images,
    pagination,
    loading,
    error,
    fetchNext,
    fetchPrevious,
    refresh,
    canGoNext,
    canGoPrevious,
  } = useTumblrLikesImages({
    blogIdentifier,
    apiKey,
    limit,
    targetImageCount,
    autoLoad,
    onError,
  });

  // Prefetch next page when user approaches end (optional enhancement)
  const prefetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Cleanup prefetch timeout on unmount
    return () => {
      if (prefetchTimeoutRef.current) {
        clearTimeout(prefetchTimeoutRef.current);
      }
    };
  }, []);

  const handleError = (err: Error) => {
    console.error('[TumblrLikesImages] Error:', err);
    onError?.(err);
  };

  // Handle error state
  if (error) {
    return (
      <div className="w-full">
        <div className="rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
          <div className="flex items-start">
            <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Error loading liked posts images</p>
              <p className="mt-1 text-sm">{error.message}</p>
              <button
                onClick={() => refresh()}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Liked Images</h2>
          {pagination.totalLikedCount !== undefined && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {images.length} images from {pagination.totalLikedCount.toLocaleString()} liked posts
            </p>
          )}
        </div>
        {pagination.method === 'before' && (
          <div className="rounded-lg bg-yellow-50 px-3 py-2 text-sm text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <p className="font-medium">Beyond 1000-post limit</p>
            <p className="text-xs">Using timestamp pagination</p>
          </div>
        )}
      </div>

      {/* Loading State (Initial) */}
      {loading && images.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading images...</span>
        </div>
      )}

      {/* Image Grid */}
      {!error && (
        <>
          <LikesImagesGrid images={images} loading={loading && images.length === 0} />

          {/* Pagination Controls */}
          {images.length > 0 && (
            <LikesImagesPagination
              pagination={pagination}
              canGoNext={canGoNext}
              canGoPrevious={canGoPrevious}
              onNext={fetchNext}
              onPrevious={fetchPrevious}
              loading={loading}
            />
          )}

          {/* Loading indicator for pagination */}
          {loading && images.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading more images...</span>
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!loading && !error && images.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <svg
            className="mb-4 h-16 w-16 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900 dark:text-white">No images found</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This blog hasn't liked any posts with images yet, or likes are private.
          </p>
        </div>
      )}
    </div>
  );
}

