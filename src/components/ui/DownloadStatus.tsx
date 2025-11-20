/**
 * ⚠️ LEGACY FILE - SCHEDULED FOR REFACTORING IN v1.0.0
 *
 * This file will be DEPRECATED and replaced with new architecture:
 * → src/components/organisms/DownloadManager/DownloadPanel.tsx
 *
 * Download Status Panel
 * Floating panel that shows download progress and allows cancellation.
 * Persists across page navigation so users can see progress anywhere.
 *
 * Current Issues:
 * - Should be an "organism" component in Atomic Design
 * - Uses legacy download store (will be unified)
 * - Should use primitive/molecule components
 *
 * Migration Target: v1.0.0 Phase 4 (UI Refactoring)
 * See: docs/refactoring-plan.md
 *
 * DO NOT ADD NEW FEATURES HERE - Add to new architecture instead
 * Bug fixes only until migration is complete
 *
 * Created: 2025-11-02
 * Deprecated: 2025-11-03 (v0.93.0-pre-refactor checkpoint)
 * Removal Target: After v1.0.0 deployment (7-14 days of monitoring)
 */

import { useAtom, useSetAtom } from 'jotai';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  activeDownloadAtom,
  downloadProgressAtom,
  downloadSummaryAtom,
  cancelDownloadAtom,
  canCancelDownloadAtom,
  clearDownloadAtom,
  estimateTimeRemaining,
} from '@/store/downloads';
import { Button } from './Button';

export function DownloadStatus() {
  const [operation] = useAtom(activeDownloadAtom);
  const [progress] = useAtom(downloadProgressAtom);
  const [summary] = useAtom(downloadSummaryAtom);
  const [canCancel] = useAtom(canCancelDownloadAtom);
  const cancelDownload = useSetAtom(cancelDownloadAtom);
  const clearDownload = useSetAtom(clearDownloadAtom);

  const [isExpanded, setIsExpanded] = useState(true);
  const [showErrors, setShowErrors] = useState(false);
  const [estimatedTime, setEstimatedTime] = useState<number | null>(null);

  // Update estimated time remaining
  useEffect(() => {
    if (!operation || operation.status !== 'running') return;

    const interval = setInterval(() => {
      const elapsed = Date.now() - operation.startedAt;
      const estimate = estimateTimeRemaining(
        operation.processedImages,
        operation.totalImages,
        elapsed
      );
      setEstimatedTime(estimate);
    }, 1000);

    return () => clearInterval(interval);
  }, [operation]);

  // Don't render if no active operation
  if (!operation || !progress || !summary) return null;

  // Format estimated time
  const formatEstimate = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `~${hours}h ${minutes % 60}m remaining`;
    if (minutes > 0) return `~${minutes}m ${seconds % 60}s remaining`;
    return `~${seconds}s remaining`;
  };

  const getStatusColor = () => {
    switch (operation.status) {
      case 'running':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'cancelled':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusText = () => {
    switch (operation.status) {
      case 'running':
        return 'Downloading';
      case 'completed':
        return 'Completed';
      case 'cancelled':
        return 'Cancelled';
      case 'error':
        return 'Error';
      case 'paused':
        return 'Paused';
      default:
        return 'Unknown';
    }
  };

  const handleCancel = () => {
    if (window.confirm('Cancel download? Partial results will be saved.')) {
      cancelDownload();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        className="fixed bottom-4 right-4 z-50 w-96 max-w-[calc(100vw-2rem)]"
      >
        <div className="rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div
                className={`h-2 w-2 rounded-full ${getStatusColor()} animate-pulse`}
              />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {getStatusText()}
                  {operation.blogName && ` @${operation.blogName}`}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {operation.folderName && `Folder: ${operation.folderName}`}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                title={isExpanded ? 'Minimize' : 'Expand'}
              >
                <svg
                  className={`h-5 w-5 text-gray-600 transition-transform dark:text-gray-400 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Expanded Content */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-4">
                  {/* Progress Bar */}
                  <div>
                    <div className="mb-2 flex justify-between text-sm">
                      <span className="text-gray-700 dark:text-gray-300">
                        {progress.current} / {progress.total} images
                      </span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {progress.percentage}%
                      </span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                      <motion.div
                        className={`h-full ${getStatusColor()}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress.percentage}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>

                  {/* Batch Progress */}
                  {progress.totalBatches > 1 && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Batch {progress.batch} of {progress.totalBatches}
                    </div>
                  )}

                  {/* Statistics */}
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="rounded-lg bg-green-50 p-2 dark:bg-green-900/20">
                      <div className="text-lg font-semibold text-green-700 dark:text-green-400">
                        {progress.succeeded}
                      </div>
                      <div className="text-xs text-green-600 dark:text-green-500">
                        Succeeded
                      </div>
                    </div>
                    <div className="rounded-lg bg-red-50 p-2 dark:bg-red-900/20">
                      <div className="text-lg font-semibold text-red-700 dark:text-red-400">
                        {progress.failed}
                      </div>
                      <div className="text-xs text-red-600 dark:text-red-500">
                        Failed
                      </div>
                    </div>
                    <div className="rounded-lg bg-gray-50 p-2 dark:bg-gray-700">
                      <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                        {summary.pending}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Pending
                      </div>
                    </div>
                  </div>

                  {/* Estimated Time */}
                  {operation.status === 'running' &&
                    estimatedTime &&
                    estimatedTime > 0 && (
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {formatEstimate(estimatedTime)}
                      </div>
                    )}

                  {/* Duration (for completed/cancelled) */}
                  {(operation.status === 'completed' ||
                    operation.status === 'cancelled') && (
                    <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                      Duration: {summary.durationFormatted}
                    </div>
                  )}

                  {/* Errors */}
                  {operation.errors.length > 0 && (
                    <div>
                      <button
                        onClick={() => setShowErrors(!showErrors)}
                        className="flex w-full items-center justify-between rounded-lg bg-red-50 p-2 text-sm hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30"
                      >
                        <span className="text-red-700 dark:text-red-400">
                          {operation.errors.length} error(s)
                        </span>
                        <svg
                          className={`h-4 w-4 text-red-600 transition-transform dark:text-red-400 ${showErrors ? 'rotate-180' : ''}`}
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {showErrors && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 max-h-40 overflow-auto rounded-lg bg-red-50 p-2 dark:bg-red-900/10"
                          >
                            {operation.errors.map((error, index) => (
                              <div
                                key={index}
                                className="mb-1 text-xs text-red-700 dark:text-red-400"
                              >
                                {error.filename || error.url}: {error.error}
                              </div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {canCancel && (
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        size="sm"
                        className="flex-1 border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                      >
                        <svg
                          className="mr-2 h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                        Stop Download
                      </Button>
                    )}

                    {(operation.status === 'completed' ||
                      operation.status === 'cancelled' ||
                      operation.status === 'error') && (
                      <Button
                        onClick={() => {
                          clearDownload();
                        }}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        Close
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
