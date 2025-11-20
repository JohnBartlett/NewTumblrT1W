/**
 * Pagination controls for Tumblr liked posts images
 * Handles offset-based and timestamp-based pagination
 */

import { Button } from './Button';
import { LoadingSpinner } from './LoadingSpinner';
import type { TumblrLikesImagesPagination } from '../../types/tumblrLikesImages';

interface LikesImagesPaginationProps {
  pagination: TumblrLikesImagesPagination;
  canGoNext: boolean;
  canGoPrevious: boolean;
  onNext: () => void;
  onPrevious: () => void;
  loading?: boolean;
}

export function LikesImagesPagination({
  pagination,
  canGoNext,
  canGoPrevious,
  onNext,
  onPrevious,
  loading,
}: LikesImagesPaginationProps) {
  const currentPage = pagination.method === 'offset' 
    ? Math.floor((pagination.offset ?? 0) / 20) + 1
    : undefined;

  const totalPages = pagination.totalLikedCount
    ? Math.ceil(pagination.totalLikedCount / 20)
    : undefined;

  return (
    <div className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:justify-between">
      {/* Previous/Next Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrevious}
          disabled={!canGoPrevious || loading}
          variant="secondary"
          size="sm"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="flex items-center gap-2 px-4">
          {loading && <LoadingSpinner size="sm" />}
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {currentPage && totalPages ? (
              <>
                Page <span className="font-semibold">{currentPage}</span> of{' '}
                <span className="font-semibold">{totalPages}</span>
              </>
            ) : (
              <span className="font-semibold">Loading images...</span>
            )}
          </span>
          {pagination.method === 'before' && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Timestamp pagination
            </span>
          )}
          {pagination.reachedOffsetLimit && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              Beyond 1000 posts
            </span>
          )}
        </div>

        <Button onClick={onNext} disabled={!canGoNext || loading} variant="secondary" size="sm">
          Next
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Total Count */}
      {pagination.totalLikedCount !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {pagination.totalLikedCount.toLocaleString()} total liked posts
        </div>
      )}
    </div>
  );
}

