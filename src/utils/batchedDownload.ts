/**
 * ⚠️ LEGACY FILE - SCHEDULED FOR REFACTORING IN v1.0.0
 *
 * This file will be DEPRECATED and replaced with new architecture:
 * → src/services/download/strategies/BatchDownloadStrategy.ts
 *
 * Batched Download Utility
 * Handles large-scale image downloads with batching, rate limiting,
 * retry logic, and cancellation support.
 *
 * Current Issues:
 * - Tightly coupled to specific use case
 * - Should be part of download service layer
 * - Strategy pattern not implemented
 *
 * Migration Target: v1.0.0 Phase 2 (Service Layer)
 * See: docs/refactoring-plan.md
 *
 * DO NOT ADD NEW FEATURES HERE - Add to new architecture instead
 * Bug fixes only until migration is complete
 *
 * Created: 2025-11-02
 * Deprecated: 2025-11-03 (v0.93.0-pre-refactor checkpoint)
 * Removal Target: After v1.0.0 deployment (7-14 days of monitoring)
 */

import { log } from './logger';

export interface DownloadItem {
  url: string;
  filename: string;
  metadata?: unknown;
}

export interface BatchedDownloadOptions {
  items: DownloadItem[];
  batchSize?: number;
  delayBetweenBatches?: number;
  delayBetweenItems?: number;
  maxRetries?: number;
  retryDelay?: number;
  onProgress?: (current: number, total: number) => void;
  onBatchStart?: (batchNum: number, totalBatches: number) => void;
  onBatchComplete?: (batchNum: number, totalBatches: number) => void;
  onItemSuccess?: (item: DownloadItem, index: number) => void;
  onItemError?: (item: DownloadItem, index: number, error: string) => void;
  shouldCancel?: () => boolean;
}

export interface DownloadResult {
  blobs: Array<{ blob: Blob; filename: string; metadata?: unknown }>;
  succeeded: number;
  failed: number;
  errors: Array<{
    url: string;
    filename: string;
    error: string;
    index: number;
  }>;
  cancelled: boolean;
}

/**
 * Download a single item with retry logic
 */
async function downloadItemWithRetry(
  item: DownloadItem,
  maxRetries: number,
  retryDelay: number
): Promise<Blob> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      log.debug(
        'Download',
        `Fetching ${item.filename} (attempt ${attempt + 1}/${maxRetries + 1})`,
        {
          url: item.url,
          filename: item.filename,
        }
      );

      const response = await fetch(item.url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();

      log.debug('Download', `Successfully fetched ${item.filename}`, {
        size: blob.size,
        type: blob.type,
      });

      return blob;
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxRetries) {
        log.warn(
          'Download',
          `Retry ${attempt + 1}/${maxRetries} for ${item.filename}`,
          {
            error: error.message,
            retryDelay,
          }
        );

        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

  throw lastError || new Error('Download failed');
}

/**
 * Download items in batches with rate limiting
 */
export async function batchedDownload(
  options: BatchedDownloadOptions
): Promise<DownloadResult> {
  const {
    items,
    batchSize = 20,
    delayBetweenBatches = 1000,
    delayBetweenItems = 50,
    maxRetries = 3,
    retryDelay = 1000,
    onProgress,
    onBatchStart,
    onBatchComplete,
    onItemSuccess,
    onItemError,
    shouldCancel,
  } = options;

  log.info('Download', 'Starting batched download', {
    totalItems: items.length,
    batchSize,
    delayBetweenBatches,
    maxRetries,
  });

  const result: DownloadResult = {
    blobs: [],
    succeeded: 0,
    failed: 0,
    errors: [],
    cancelled: false,
  };

  const totalBatches = Math.ceil(items.length / batchSize);

  for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
    // Check for cancellation
    if (shouldCancel && shouldCancel()) {
      log.warn('Download', 'Download cancelled by user', {
        processed: result.blobs.length,
        total: items.length,
      });
      result.cancelled = true;
      break;
    }

    const batchStart = batchNum * batchSize;
    const batchEnd = Math.min(batchStart + batchSize, items.length);
    const batch = items.slice(batchStart, batchEnd);

    log.info('Download', `Processing batch ${batchNum + 1}/${totalBatches}`, {
      batchSize: batch.length,
      range: `${batchStart + 1}-${batchEnd}`,
    });

    if (onBatchStart) {
      onBatchStart(batchNum + 1, totalBatches);
    }

    // Process batch
    for (let i = 0; i < batch.length; i++) {
      // Check for cancellation
      if (shouldCancel && shouldCancel()) {
        log.warn('Download', 'Download cancelled by user', {
          processed: result.blobs.length,
          total: items.length,
        });
        result.cancelled = true;
        break;
      }

      const item = batch[i];
      const globalIndex = batchStart + i;

      try {
        const blob = await downloadItemWithRetry(item, maxRetries, retryDelay);

        result.blobs.push({
          blob,
          filename: item.filename,
          metadata: item.metadata,
        });
        result.succeeded++;

        log.debug(
          'Download',
          `Item ${globalIndex + 1}/${items.length} succeeded`,
          {
            filename: item.filename,
          }
        );

        if (onItemSuccess) {
          onItemSuccess(item, globalIndex);
        }
      } catch (error) {
        result.failed++;
        const errorMsg = (error as Error).message || 'Unknown error';

        result.errors.push({
          url: item.url,
          filename: item.filename,
          error: errorMsg,
          index: globalIndex,
        });

        log.error(
          'Download',
          `Item ${globalIndex + 1}/${items.length} failed`,
          {
            filename: item.filename,
            error: errorMsg,
          }
        );

        if (onItemError) {
          onItemError(item, globalIndex, errorMsg);
        }
      }

      if (onProgress) {
        onProgress(globalIndex + 1, items.length);
      }

      // Delay between items within batch
      if (i < batch.length - 1 && delayBetweenItems > 0) {
        await new Promise(resolve => setTimeout(resolve, delayBetweenItems));
      }
    }

    if (result.cancelled) {
      break;
    }

    if (onBatchComplete) {
      onBatchComplete(batchNum + 1, totalBatches);
    }

    // Delay between batches (except for last batch)
    if (batchNum < totalBatches - 1 && delayBetweenBatches > 0) {
      log.debug(
        'Download',
        `Waiting ${delayBetweenBatches}ms before next batch`
      );
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
    }
  }

  log.info('Download', 'Batched download completed', {
    total: items.length,
    succeeded: result.succeeded,
    failed: result.failed,
    cancelled: result.cancelled,
    errorCount: result.errors.length,
  });

  return result;
}

/**
 * Save blobs to File System Access API directory
 */
export async function saveBlobsToDirectory(
  blobs: Array<{ blob: Blob; filename: string }>,
  directoryHandle: FileSystemDirectoryHandle,
  options?: {
    onProgress?: (current: number, total: number) => void;
    onItemSuccess?: (filename: string, index: number) => void;
    onItemError?: (filename: string, index: number, error: string) => void;
    delayBetweenFiles?: number;
    shouldCancel?: () => boolean;
  }
): Promise<{
  succeeded: number;
  failed: number;
  errors: Array<{ filename: string; error: string }>;
}> {
  const {
    onProgress,
    onItemSuccess,
    onItemError,
    delayBetweenFiles = 50,
    shouldCancel,
  } = options || {};

  log.info('FileSave', 'Starting file save to directory', {
    totalFiles: blobs.length,
    directory: directoryHandle.name,
  });

  const result = {
    succeeded: 0,
    failed: 0,
    errors: [] as Array<{ filename: string; error: string }>,
  };

  for (let i = 0; i < blobs.length; i++) {
    // Check for cancellation
    if (shouldCancel && shouldCancel()) {
      log.warn('FileSave', 'File save cancelled by user', {
        saved: result.succeeded,
        total: blobs.length,
      });
      break;
    }

    const { blob, filename } = blobs[i];

    try {
      const fileHandle = await directoryHandle.getFileHandle(filename, {
        create: true,
      });
      const writable = await fileHandle.createWritable();
      await writable.write(blob);
      await writable.close();

      result.succeeded++;

      log.debug('FileSave', `Saved file ${i + 1}/${blobs.length}`, {
        filename,
      });

      if (onItemSuccess) {
        onItemSuccess(filename, i);
      }
    } catch (error) {
      result.failed++;
      const errorMsg = (error as Error).message || 'Unknown error';

      result.errors.push({ filename, error: errorMsg });

      log.error('FileSave', `Failed to save file ${i + 1}/${blobs.length}`, {
        filename,
        error: errorMsg,
      });

      if (onItemError) {
        onItemError(filename, i, errorMsg);
      }
    }

    if (onProgress) {
      onProgress(i + 1, blobs.length);
    }

    // Delay between files
    if (i < blobs.length - 1 && delayBetweenFiles > 0) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenFiles));
    }
  }

  log.info('FileSave', 'File save completed', {
    total: blobs.length,
    succeeded: result.succeeded,
    failed: result.failed,
  });

  return result;
}
