/**
 * Main component for displaying Tumblr liked posts with full pagination support
 * 
 * Features:
 * - Offset-based pagination (0-1000 posts)
 * - Timestamp-based pagination beyond 1000 posts
 * - Image extraction and grid display
 * - Full pagination controls
 * - Error handling and loading states
 */

import { useEffect } from 'react';
import { useTumblrLikesPagination } from '../../hooks/useTumblrLikesPagination';
import { LikesImageGrid } from '../../components/ui/LikesImageGrid';
import { LikesPaginationControls } from '../../components/ui/LikesPaginationControls';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';

interface TumblrLikesGalleryProps {
  blogIdentifier: string;
  userId?: string;
  postsPerPage?: number;
  autoLoadFirstPage?: boolean;
  onError?: (error: Error) => void;
}

export function TumblrLikesGallery({
  blogIdentifier,
  userId,
  postsPerPage = 20,
  autoLoadFirstPage = true,
  onError,
}: TumblrLikesGalleryProps) {
  const {
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
  } = useTumblrLikesPagination({
    blogIdentifier,
    userId,
    postsPerPage,
    onError,
  });

  // Auto-load first page on mount
  useEffect(() => {
    if (autoLoadFirstPage && images.length === 0 && !loading) {
      fetchPage(1).catch((err) => {
        console.error('[TumblrLikesGallery] Error loading first page:', err);
      });
    }
  }, [autoLoadFirstPage, images.length, loading, fetchPage]);

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Liked Posts</h2>
          {totalLikedCount !== undefined && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {totalLikedCount.toLocaleString()} total liked posts
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

      {/* Error Display */}
      {error && (
        <div className="mb-4 rounded-lg bg-red-50 p-4 text-red-800 dark:bg-red-900 dark:text-red-200">
          <div className="flex items-start">
            <svg className="mr-2 h-5 w-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <div className="flex-1">
              <p className="font-medium">Error loading liked posts</p>
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
      )}

      {/* Loading State */}
      {loading && images.length === 0 && (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading liked posts...</span>
        </div>
      )}

      {/* Image Grid */}
      {!error && (
        <>
          <LikesImageGrid images={images} loading={loading && images.length === 0} />

          {/* Pagination Controls */}
          {images.length > 0 && (
            <LikesPaginationControls
              pagination={pagination}
              hasPrevious={pagination.currentPage > 1}
              hasNext={hasMore}
              canJumpToPage={canJumpToPage}
              totalLikedCount={totalLikedCount}
              onPrevious={fetchPrevious}
              onNext={fetchNext}
              onJumpToPage={jumpToPage}
              loading={loading}
            />
          )}

          {/* Loading indicator for pagination */}
          {loading && images.length > 0 && (
            <div className="flex items-center justify-center py-4">
              <LoadingSpinner size="sm" />
              <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
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
              d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
            />
          </svg>
          <p className="text-lg font-medium text-gray-900 dark:text-white">No liked posts found</p>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This blog hasn't liked any posts yet, or likes are private.
          </p>
        </div>
      )}
    </div>
  );
}

