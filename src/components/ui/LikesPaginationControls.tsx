/**
 * Pagination controls for Tumblr liked posts
 */

import { useState } from 'react';
import { Button } from './Button';
import type { PaginationState } from '../../types/tumblrLikes';

interface LikesPaginationControlsProps {
  pagination: PaginationState;
  hasPrevious: boolean;
  hasNext: boolean;
  canJumpToPage: boolean;
  totalLikedCount?: number;
  onPrevious: () => void;
  onNext: () => void;
  onJumpToPage: (page: number) => Promise<void>;
  loading?: boolean;
}

export function LikesPaginationControls({
  pagination,
  hasPrevious,
  hasNext,
  canJumpToPage,
  totalLikedCount,
  onPrevious,
  onNext,
  onJumpToPage,
  loading,
}: LikesPaginationControlsProps) {
  const [jumpPageInput, setJumpPageInput] = useState('');
  const [jumpError, setJumpError] = useState<string | null>(null);

  const maxPageWithOffset = Math.floor(1000 / pagination.postsPerPage);
  const estimatedTotalPages = totalLikedCount
    ? Math.ceil(totalLikedCount / pagination.postsPerPage)
    : undefined;

  const handleJumpToPage = async () => {
    const page = parseInt(jumpPageInput, 10);
    if (isNaN(page) || page < 1) {
      setJumpError('Please enter a valid page number');
      return;
    }

    if (!canJumpToPage && page > maxPageWithOffset) {
      setJumpError(`Cannot jump beyond page ${maxPageWithOffset} with offset pagination`);
      return;
    }

    setJumpError(null);
    try {
      await onJumpToPage(page);
      setJumpPageInput('');
    } catch (error: any) {
      setJumpError(error.message || 'Failed to jump to page');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 sm:flex-row sm:justify-between">
      {/* Previous/Next Controls */}
      <div className="flex items-center gap-2">
        <Button
          onClick={onPrevious}
          disabled={!hasPrevious || loading}
          variant="secondary"
          size="sm"
        >
          <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </Button>

        <div className="flex items-center gap-2 px-4">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Page <span className="font-semibold">{pagination.currentPage}</span>
            {estimatedTotalPages && (
              <>
                {' '}
                of <span className="font-semibold">{estimatedTotalPages}</span>
              </>
            )}
          </span>
          {pagination.method === 'before' && (
            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
              Timestamp pagination
            </span>
          )}
        </div>

        <Button onClick={onNext} disabled={!hasNext || loading} variant="secondary" size="sm">
          Next
          <svg className="ml-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Button>
      </div>

      {/* Jump to Page */}
      {canJumpToPage && (
        <div className="flex items-center gap-2">
          <label htmlFor="jump-page" className="text-sm text-gray-600 dark:text-gray-400">
            Jump to:
          </label>
          <input
            id="jump-page"
            type="number"
            min="1"
            max={maxPageWithOffset}
            value={jumpPageInput}
            onChange={(e) => {
              setJumpPageInput(e.target.value);
              setJumpError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleJumpToPage();
              }
            }}
            className="w-20 rounded-md border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-800"
            placeholder="Page #"
          />
          <Button onClick={handleJumpToPage} disabled={loading} variant="secondary" size="sm">
            Go
          </Button>
          {jumpError && (
            <span className="text-xs text-red-500 dark:text-red-400">{jumpError}</span>
          )}
        </div>
      )}

      {/* Total Count */}
      {totalLikedCount !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {totalLikedCount.toLocaleString()} total liked posts
        </div>
      )}
    </div>
  );
}

