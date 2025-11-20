/**
 * ⚠️ LEGACY FILE - SCHEDULED FOR REFACTORING IN v1.0.0
 *
 * This file will be MERGED with store/operations.ts into unified:
 * → src/store/operations.ts (NEW VERSION - single source of truth)
 *
 * Download State Management
 * Manages state for download operations with persistence
 * so users can navigate away and return to see progress.
 *
 * Current Issues:
 * - Separate from operations.ts (should be unified)
 * - Overlapping concerns with operations.ts
 * - Should have derived atoms for different UI needs
 *
 * Migration Target: v1.0.0 Phase 1 (Foundation)
 * See: docs/refactoring-plan.md
 *
 * DO NOT ADD NEW FEATURES HERE - Add to new unified store instead
 * Bug fixes only until migration is complete
 *
 * Created: 2025-11-02
 * Deprecated: 2025-11-03 (v0.93.0-pre-refactor checkpoint)
 * Removal Target: After v1.0.0 deployment (7-14 days of monitoring)
 */

import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type DownloadType = 'download' | 'share' | 'store' | 'download-folder';
export type DownloadStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled'
  | 'error';

export interface DownloadError {
  url: string;
  filename?: string;
  error: string;
  timestamp: number;
}

export interface DownloadOperation {
  id: string;
  type: DownloadType;
  blogName?: string;
  folderName?: string;
  totalImages: number;
  processedImages: number;
  succeededImages: number;
  failedImages: number;
  currentBatch: number;
  totalBatches: number;
  status: DownloadStatus;
  startedAt: number;
  completedAt?: number;
  errors: DownloadError[];
  estimatedTimeRemaining?: number;
}

/**
 * Active download operation (persisted to localStorage)
 * Survives page navigation and browser refresh
 */
export const activeDownloadAtom = atomWithStorage<DownloadOperation | null>(
  'active-download-operation',
  null
);

/**
 * Download progress (derived from active download)
 */
export const downloadProgressAtom = atom(get => {
  const operation = get(activeDownloadAtom);
  if (!operation) return null;

  const progress =
    operation.totalImages > 0
      ? (operation.processedImages / operation.totalImages) * 100
      : 0;

  return {
    current: operation.processedImages,
    total: operation.totalImages,
    percentage: Math.round(progress * 10) / 10,
    succeeded: operation.succeededImages,
    failed: operation.failedImages,
    batch: operation.currentBatch,
    totalBatches: operation.totalBatches,
  };
});

/**
 * Check if download is running
 */
export const isDownloadingAtom = atom(get => {
  const operation = get(activeDownloadAtom);
  return operation?.status === 'running';
});

/**
 * Check if download can be cancelled
 */
export const canCancelDownloadAtom = atom(get => {
  const operation = get(activeDownloadAtom);
  return operation?.status === 'running' || operation?.status === 'paused';
});

/**
 * Cancel flag (separate from status for immediate response)
 */
export const cancelRequestedAtom = atom(false);

/**
 * Actions for managing download state
 */

/**
 * Start a new download operation
 */
export const startDownloadAtom = atom(
  null,
  (
    get,
    set,
    operation: Omit<
      DownloadOperation,
      | 'id'
      | 'startedAt'
      | 'status'
      | 'processedImages'
      | 'succeededImages'
      | 'failedImages'
      | 'currentBatch'
      | 'errors'
    >
  ) => {
    const newOperation: DownloadOperation = {
      ...operation,
      id: `download-${Date.now()}`,
      startedAt: Date.now(),
      status: 'running',
      processedImages: 0,
      succeededImages: 0,
      failedImages: 0,
      currentBatch: 0,
      errors: [],
    };

    set(activeDownloadAtom, newOperation);
    set(cancelRequestedAtom, false);
  }
);

/**
 * Update download progress
 */
export const updateDownloadProgressAtom = atom(
  null,
  (
    get,
    set,
    update: {
      processedImages?: number;
      succeededImages?: number;
      failedImages?: number;
      currentBatch?: number;
      estimatedTimeRemaining?: number;
      error?: DownloadError;
    }
  ) => {
    const current = get(activeDownloadAtom);
    if (!current) return;

    const updated: DownloadOperation = {
      ...current,
      processedImages: update.processedImages ?? current.processedImages,
      succeededImages: update.succeededImages ?? current.succeededImages,
      failedImages: update.failedImages ?? current.failedImages,
      currentBatch: update.currentBatch ?? current.currentBatch,
      estimatedTimeRemaining: update.estimatedTimeRemaining,
    };

    if (update.error) {
      updated.errors = [...current.errors, update.error];
    }

    set(activeDownloadAtom, updated);
  }
);

/**
 * Complete download operation
 */
export const completeDownloadAtom = atom(null, (get, set) => {
  const current = get(activeDownloadAtom);
  if (!current) return;

  set(activeDownloadAtom, {
    ...current,
    status: 'completed',
    completedAt: Date.now(),
  });

  // Clear after 5 seconds
  setTimeout(() => {
    const stillCurrent = get(activeDownloadAtom);
    if (
      stillCurrent?.id === current.id &&
      stillCurrent.status === 'completed'
    ) {
      set(activeDownloadAtom, null);
    }
  }, 5000);
});

/**
 * Cancel download operation
 */
export const cancelDownloadAtom = atom(null, (get, set) => {
  const current = get(activeDownloadAtom);
  if (!current) return;

  set(cancelRequestedAtom, true);
  set(activeDownloadAtom, {
    ...current,
    status: 'cancelled',
    completedAt: Date.now(),
  });
});

/**
 * Pause download operation
 */
export const pauseDownloadAtom = atom(null, (get, set) => {
  const current = get(activeDownloadAtom);
  if (!current || current.status !== 'running') return;

  set(activeDownloadAtom, {
    ...current,
    status: 'paused',
  });
});

/**
 * Resume download operation
 */
export const resumeDownloadAtom = atom(null, (get, set) => {
  const current = get(activeDownloadAtom);
  if (!current || current.status !== 'paused') return;

  set(activeDownloadAtom, {
    ...current,
    status: 'running',
  });

  set(cancelRequestedAtom, false);
});

/**
 * Mark download as error
 */
export const errorDownloadAtom = atom(null, (get, set, error: string) => {
  const current = get(activeDownloadAtom);
  if (!current) return;

  set(activeDownloadAtom, {
    ...current,
    status: 'error',
    completedAt: Date.now(),
    errors: [
      ...current.errors,
      {
        url: '',
        error,
        timestamp: Date.now(),
      },
    ],
  });
});

/**
 * Clear download operation
 */
export const clearDownloadAtom = atom(null, (get, set) => {
  set(activeDownloadAtom, null);
  set(cancelRequestedAtom, false);
});

/**
 * Get download summary
 */
export const downloadSummaryAtom = atom(get => {
  const operation = get(activeDownloadAtom);
  if (!operation) return null;

  const duration = operation.completedAt
    ? operation.completedAt - operation.startedAt
    : Date.now() - operation.startedAt;

  const successRate =
    operation.processedImages > 0
      ? (operation.succeededImages / operation.processedImages) * 100
      : 0;

  return {
    type: operation.type,
    blogName: operation.blogName,
    folderName: operation.folderName,
    total: operation.totalImages,
    succeeded: operation.succeededImages,
    failed: operation.failedImages,
    pending: operation.totalImages - operation.processedImages,
    successRate: Math.round(successRate * 10) / 10,
    duration,
    durationFormatted: formatDuration(duration),
    status: operation.status,
    errors: operation.errors,
  };
});

/**
 * Helper function to format duration
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}

/**
 * Estimate time remaining based on current progress
 */
export function estimateTimeRemaining(
  processedImages: number,
  totalImages: number,
  elapsedMs: number
): number {
  if (processedImages === 0) return 0;

  const avgTimePerImage = elapsedMs / processedImages;
  const remainingImages = totalImages - processedImages;

  return Math.round(avgTimePerImage * remainingImages);
}
