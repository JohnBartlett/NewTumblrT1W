/**
 * ⚠️ LEGACY FILE - SCHEDULED FOR REFACTORING IN v1.0.0
 *
 * This file will be DEPRECATED and replaced with new architecture:
 * → src/components/pages/StoredImagesPage.tsx (orchestration)
 * → src/components/organisms/ImageGallery/ (UI components)
 * → src/hooks/useDownload.ts (download logic)
 * → src/hooks/useStorageOperations.ts (storage logic)
 * → src/hooks/useImageSelection.ts (selection logic)
 *
 * Current Issues:
 * - 2200+ lines (too large, mixed concerns)
 * - Business logic + UI rendering in one file
 * - Difficult to test and maintain
 *
 * Migration Target: v1.0.0 Phase 4 (UI Refactoring)
 * See: docs/refactoring-plan.md, docs/pre-refactoring-state.md
 *
 * DO NOT ADD NEW FEATURES HERE - Add to new architecture instead
 * Bug fixes only until migration is complete
 *
 * Created: 2025-10-30
 * Deprecated: 2025-11-03 (v0.93.0-pre-refactor checkpoint)
 * Removal Target: After v1.0.0 deployment (7-14 days of monitoring)
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { Container } from '@/components/layouts';
import {
  Button,
  ImageViewer,
  SelectionToolbar,
  ImageFilters,
  ActionButtonGroup,
  type ImageFiltersState,
} from '@/components/ui';
import {
  startOperationAtom,
  updateOperationProgressAtom,
  endOperationAtom,
} from '@/store/operations';
import { userAtom } from '@/store/auth';
import {
  shareImages,
  downloadImages,
  downloadImagesServerSide,
  canShareFiles,
  getImageFilename,
  type ImageMetadata,
} from '@/utils/imageDownload';
import {
  filenamePatternAtom,
  includeIndexInFilenameAtom,
  includeSidecarMetadataAtom,
  downloadMethodAtom,
  gridColumnsAtom,
  gridImageSizeAtom,
  blogFilterLimitAtom,
  updatePreferencesAtom,
} from '@/store/preferences';
import {
  batchedDownload,
  saveBlobsToDirectory,
  type DownloadItem,
} from '@/utils/batchedDownload';
import { log } from '@/utils/logger';
import {
  startDownloadAtom,
  updateDownloadProgressAtom,
  completeDownloadAtom,
  cancelRequestedAtom,
  clearDownloadAtom,
  estimateTimeRemaining,
} from '@/store/downloads';
import { withProxy } from '@/utils/imageProxy';

// Dynamic API URL based on current host
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};
const API_URL = getApiUrl();

interface StoredImage {
  id: string;
  postId: string;
  blogName: string;
  url: string;
  width: number | null;
  height: number | null;
  tags: string;
  description: string | null;
  notes: number;
  notesData: string | null; // JSON string of actual notes array
  cost: number | null;
  timestamp: string;
  storedAt: string;
}

interface StoredImagesStats {
  total: number;
  totalCost: number;
  byBlog: Array<{ blogName: string; count: number; totalCost: number }>;
}

export function StoredImages() {
  const [user] = useAtom(userAtom);
  const startOperation = useSetAtom(startOperationAtom);
  const updateOperationProgress = useSetAtom(updateOperationProgressAtom);
  const endOperation = useSetAtom(endOperationAtom);
  const [images, setImages] = useState<StoredImage[]>([]);
  const [stats, setStats] = useState<StoredImagesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const [filterBlog, setFilterBlog] = useState<string | null>(null);

  // Grid preferences
  const [filenamePattern] = useAtom(filenamePatternAtom);
  const [includeIndex] = useAtom(includeIndexInFilenameAtom);
  const [includeSidecarMetadata] = useAtom(includeSidecarMetadataAtom);
  const [downloadMethod] = useAtom(downloadMethodAtom);
  const [gridColumns] = useAtom(gridColumnsAtom);

  // Download state management
  const startDownload = useSetAtom(startDownloadAtom);
  const updateDownloadProgress = useSetAtom(updateDownloadProgressAtom);
  const completeDownload = useSetAtom(completeDownloadAtom);
  const clearDownload = useSetAtom(clearDownloadAtom);
  const [cancelRequested] = useAtom(cancelRequestedAtom);
  const [gridImageSize] = useAtom(gridImageSizeAtom);
  const [blogFilterLimit] = useAtom(blogFilterLimitAtom);
  const [, updatePreferences] = useAtom(updatePreferencesAtom);

  // Selection state
  const [gridSelection, setGridSelection] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(
    null
  );
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const gridRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [imageFilters, setImageFilters] = useState<ImageFiltersState>({
    sizes: new Set<string>(),
    dates: new Set<string>(),
    sort: 'recent',
  });

  // Download/share state
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const [isFilterSticky, setIsFilterSticky] = useState(true);

  // Range selection mode for mobile
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null);

  // Flag to track if we should jump to end after loading
  const [shouldJumpToEnd, setShouldJumpToEnd] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchImages();
      fetchStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, filterBlog]);

  // Filter and sort images - MUST BE BEFORE useEffects that use it
  const filteredAndSortedImages = useMemo(() => {
    let filtered = [...images];

    // Apply size filters
    if (imageFilters.sizes.size > 0) {
      filtered = filtered.filter(img => {
        if (!img.width || !img.height) return false;
        const size = img.width * img.height;
        if (imageFilters.sizes.has('small') && size <= 800 * 600) return true;
        if (
          imageFilters.sizes.has('medium') &&
          size > 800 * 600 &&
          size <= 1000 * 800
        )
          return true;
        if (imageFilters.sizes.has('large') && size > 1000 * 800) return true;
        return false;
      });
    }

    // Apply date filters
    if (imageFilters.dates.size > 0) {
      const now = Date.now();
      filtered = filtered.filter(img => {
        const imgTime = new Date(img.storedAt).getTime();
        const dayAgo = now - 86400000;
        const weekAgo = now - 7 * 86400000;
        const monthAgo = now - 30 * 86400000;

        if (imageFilters.dates.has('today') && imgTime >= dayAgo) return true;
        if (imageFilters.dates.has('this-week') && imgTime >= weekAgo)
          return true;
        if (imageFilters.dates.has('this-month') && imgTime >= monthAgo)
          return true;
        return false;
      });
    }

    // Apply sort
    switch (imageFilters.sort) {
      case 'recent':
        filtered.sort(
          (a, b) =>
            new Date(b.storedAt).getTime() - new Date(a.storedAt).getTime()
        );
        break;
      case 'oldest':
        filtered.sort(
          (a, b) =>
            new Date(a.storedAt).getTime() - new Date(b.storedAt).getTime()
        );
        break;
      case 'popular':
        filtered.sort((a, b) => b.notes - a.notes);
        break;
    }

    return filtered;
  }, [images, imageFilters]);

  // Reset focused index when filters change
  useEffect(() => {
    setFocusedIndex(0);
  }, [imageFilters]);

  // Image viewer navigation handlers - MUST BE AFTER filteredAndSortedImages
  const handleNextImage = async () => {
    if (selectedImage === null) return;

    // If we're at the last image of current batch and there are more images, load next batch
    if (
      selectedImage === filteredAndSortedImages.length - 1 &&
      hasMore &&
      !loadingMore
    ) {
      console.log('[StoredImages] At end of batch, loading more images...');
      await loadMore();
      // After loading, move to the next image (which will now be available)
      setSelectedImage(selectedImage + 1);
    } else if (selectedImage < filteredAndSortedImages.length - 1) {
      // Normal navigation within current batch
      setSelectedImage(selectedImage + 1);
    }
  };

  const handlePreviousImage = () => {
    if (selectedImage !== null && selectedImage > 0) {
      setSelectedImage(selectedImage - 1);
    }
  };

  const handleJumpToEnd = async () => {
    if (
      stats &&
      stats.total > filteredAndSortedImages.length &&
      hasMore &&
      !loadingMore
    ) {
      // If there are more images to load, load all of them first
      console.log(
        '[StoredImages] Jumping to end, loading all remaining images...'
      );
      setShouldJumpToEnd(true);
      await loadAll();
    } else if (filteredAndSortedImages.length > 0) {
      // Already have all images loaded, jump to end
      setSelectedImage(filteredAndSortedImages.length - 1);
    }
  };

  const handleJumpToStart = () => {
    setSelectedImage(0);
  };

  // Effect to handle jump to end after loading completes
  useEffect(() => {
    if (shouldJumpToEnd && !loadingMore && filteredAndSortedImages.length > 0) {
      console.log(
        `[StoredImages] Jumping to last image (${filteredAndSortedImages.length - 1})`
      );
      setSelectedImage(filteredAndSortedImages.length - 1);
      setShouldJumpToEnd(false);
    }
  }, [shouldJumpToEnd, loadingMore, filteredAndSortedImages.length]);

  // Parse notesData for selected image
  const selectedImageNotes = useMemo(() => {
    if (selectedImage === null || !filteredAndSortedImages[selectedImage])
      return [];

    const image = filteredAndSortedImages[selectedImage];
    if (!image.notesData) return [];

    try {
      const notes = JSON.parse(image.notesData);
      if (!notes || !Array.isArray(notes)) return [];

      // Convert to Note format expected by NotesPanel
      return notes.map(
        (
          note: {
            blog_name?: string;
            type?: string;
            reply_text?: string;
            added_text?: string;
            timestamp?: number;
          },
          i: number
        ) => {
          const normalizedBlog = note.blog_name?.includes('.')
            ? note.blog_name
            : `${note.blog_name}.tumblr.com`;

          // Determine note type: prioritize text comments over generic types
          let noteType: 'like' | 'reblog' | 'comment' = 'reblog';
          if (note.type === 'like') {
            noteType = 'like';
          } else if (note.reply_text || note.added_text) {
            // If there's text content, it's a comment (even if Tumblr marks it as reblog)
            noteType = 'comment';
          } else if (note.type === 'reblog' || note.type === 'posted') {
            noteType = 'reblog';
          }

          return {
            id: `note-${image.id}-${i}`,
            type: noteType,
            user: {
              username: note.blog_name || 'anonymous',
              avatar:
                note.avatar_url?.['64'] ||
                `${API_URL}/api/tumblr/blog/${normalizedBlog}/avatar/64`,
            },
            timestamp: note.timestamp * 1000,
            comment: note.reply_text || note.added_text,
            reblogComment: note.reblog_parent_blog_name
              ? `Reblogged from ${note.reblog_parent_blog_name}`
              : undefined,
          };
        }
      );
    } catch (error) {
      console.error('[StoredImages] Error parsing notesData:', error);
      return [];
    }
  }, [selectedImage, filteredAndSortedImages]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!filteredAndSortedImages.length) return;
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const currentIndex = focusedIndex;
      const cols = gridColumns;
      const maxIndex = filteredAndSortedImages.length - 1;

      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(Math.max(0, currentIndex - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(Math.min(maxIndex, currentIndex + 1));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(Math.max(0, currentIndex - cols));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(Math.min(maxIndex, currentIndex + cols));
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(maxIndex);
          break;
        case 'PageUp':
          e.preventDefault();
          setFocusedIndex(Math.max(0, currentIndex - cols * 3));
          break;
        case 'PageDown':
          e.preventDefault();
          setFocusedIndex(Math.min(maxIndex, currentIndex + cols * 3));
          break;
        case 'Enter':
          e.preventDefault();
          setSelectedImage(currentIndex);
          break;
        case ' ': {
          e.preventDefault();
          const image = filteredAndSortedImages[currentIndex];
          if (image) {
            const newSelection = new Set(gridSelection);
            if (newSelection.has(image.id)) {
              newSelection.delete(image.id);
            } else {
              newSelection.add(image.id);
            }
            setGridSelection(newSelection);
          }
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [focusedIndex, filteredAndSortedImages, gridColumns, gridSelection]);

  // Scroll focused element into view
  useEffect(() => {
    const element = document.querySelector(
      `[data-grid-index="${focusedIndex}"]`
    );
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [focusedIndex]);

  const fetchImages = async (reset = true) => {
    if (!user?.id) return;

    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
        setImages([]);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      const params = new URLSearchParams({
        limit: '50',
        offset: String(currentOffset),
      });

      if (filterBlog) {
        params.append('blogName', filterBlog);
      }

      const response = await fetch(
        `${API_URL}/api/stored-images/${user.id}?${params}`
      );

      if (!response.ok) throw new Error('Failed to fetch images');

      const data = await response.json();

      if (reset) {
        setImages(data.images);
      } else {
        setImages(prev => [...prev, ...data.images]);
      }

      // Update pagination state
      const newOffset = currentOffset + data.images.length;
      setOffset(newOffset);
      setHasMore(data.images.length === 50 && newOffset < data.total);

      console.log(
        `[StoredImages] Loaded ${data.images.length} images (offset: ${currentOffset}, total: ${data.total})`
      );
    } catch (error) {
      console.error('Error fetching images:', error);
      alert('Failed to load stored images');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Load more images (next 50)
  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchImages(false);
    }
  };

  // Load more and select the newly loaded images
  const loadMoreAndSelect = async () => {
    if (!loadingMore && hasMore) {
      const currentCount = filteredAndSortedImages.length;
      await fetchImages(false);

      // Wait for state to update, then select the new images
      setTimeout(() => {
        const newImages = filteredAndSortedImages.slice(currentCount);
        const newSelection = new Set(gridSelection);
        newImages.forEach(img => newSelection.add(img.id));
        setGridSelection(newSelection);
      }, 500);
    }
  };

  // Load ALL remaining images
  const loadAll = async () => {
    if (!user?.id || !hasMore || loadingMore) return;

    setLoadingMore(true);
    try {
      const remaining = stats?.total ? stats.total - images.length : 0;
      console.log(
        `[StoredImages] Loading all ${remaining} remaining images...`
      );

      // Fetch all remaining in batches of 50
      let currentOffset = offset;
      const allNewImages: StoredImage[] = [];

      while (currentOffset < (stats?.total || 0)) {
        const params = new URLSearchParams({
          limit: '50',
          offset: String(currentOffset),
        });

        if (filterBlog) {
          params.append('blogName', filterBlog);
        }

        const response = await fetch(
          `${API_URL}/api/stored-images/${user.id}?${params}`
        );

        if (!response.ok) break;

        const data = await response.json();
        allNewImages.push(...data.images);
        currentOffset += data.images.length;

        console.log(
          `[StoredImages] Progress: ${allNewImages.length}/${remaining} loaded...`
        );

        if (data.images.length < 50) break; // No more images
      }

      setImages(prev => [...prev, ...allNewImages]);
      setOffset(currentOffset);
      setHasMore(false);

      console.log(
        `[StoredImages] ✅ Loaded all ${allNewImages.length} remaining images!`
      );
    } catch (error) {
      console.error('[StoredImages] Error loading all images:', error);
      alert('Failed to load all images');
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchStats = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(
        `${API_URL}/api/stored-images/${user.id}/stats`
      );

      if (!response.ok) throw new Error('Failed to fetch stats');

      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Selection handlers
  const handleSelectAll = async () => {
    // If there are more images to load, ask if user wants to load all first
    if (hasMore) {
      const totalAvailable = filterBlog
        ? stats.byBlog.find(b => b.blogName === filterBlog)?.count ||
        images.length
        : stats.total;
      const currentlyLoaded = filteredAndSortedImages.length;
      const remaining = totalAvailable - currentlyLoaded;

      const shouldLoadAll = window.confirm(
        `You have ${currentlyLoaded} images loaded out of ${totalAvailable} total${filterBlog ? ` from @${filterBlog}` : ''}.\n\n` +
        `Do you want to:\n` +
        `• OK - Load all ${remaining} remaining images first, then select all ${totalAvailable}\n` +
        `• Cancel - Just select the ${currentlyLoaded} images currently loaded`
      );

      if (shouldLoadAll) {
        console.log(`[StoredImages] Loading all images before selecting...`);
        await loadAll();
        // After loading, select all (including the newly loaded ones)
        // Wait a moment for state to update
        setTimeout(() => {
          setGridSelection(new Set(filteredAndSortedImages.map(img => img.id)));
        }, 500);
      } else {
        // Just select what's currently loaded
        setGridSelection(new Set(filteredAndSortedImages.map(img => img.id)));
      }
    } else {
      // All images are already loaded, just select them
      setGridSelection(new Set(filteredAndSortedImages.map(img => img.id)));
    }
  };

  const handleSelectNone = () => {
    setGridSelection(new Set());
    setLastSelectedIndex(null);
  };

  const handleInvertSelection = () => {
    const allIds = new Set(filteredAndSortedImages.map(img => img.id));
    const newSelection = new Set<string>();
    allIds.forEach(id => {
      if (!gridSelection.has(id)) {
        newSelection.add(id);
      }
    });
    setGridSelection(newSelection);
  };

  const handleDelete = async () => {
    if (gridSelection.size === 0) return;
    if (!confirm(`Delete ${gridSelection.size} image(s) from storage?`)) return;

    console.log(`[StoredImages] 🗑️ Deleting ${gridSelection.size} images...`);

    try {
      let successCount = 0;
      let failedCount = 0;
      const selectedIds = Array.from(gridSelection);

      for (const imageId of selectedIds) {
        console.log(`[StoredImages] Deleting image ID: ${imageId}`);
        const response = await fetch(
          `${API_URL}/api/stored-images/${imageId}?userId=${user?.id}`,
          { method: 'DELETE' }
        );

        if (response.ok) {
          successCount++;
          console.log(`[StoredImages] ✅ Deleted image ${imageId}`);
        } else {
          failedCount++;
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Unknown error' }));
          console.error(
            `[StoredImages] ❌ Failed to delete image ${imageId}:`,
            errorData
          );
        }
      }

      console.log(
        `[StoredImages] 📊 Delete summary: ${successCount} successful, ${failedCount} failed`
      );
      alert(
        `✅ Deleted ${successCount} image(s) from storage${failedCount > 0 ? ` (${failedCount} failed)` : ''}`
      );

      // Clear selection
      setGridSelection(new Set());

      // Refresh data - AWAIT to ensure UI updates after fetch completes
      console.log(`[StoredImages] 🔄 Refreshing data...`);
      await fetchImages(true); // Reset and fetch fresh data
      await fetchStats();
      console.log(`[StoredImages] ✅ Data refreshed`);
    } catch (error) {
      console.error('[StoredImages] Error deleting images:', error);
      alert('❌ Failed to delete images');
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.id) return;

    const totalCount = stats?.total || 0;
    if (totalCount === 0) {
      alert('No images to delete');
      return;
    }

    const confirmMessage = `⚠️ DELETE ALL STORED IMAGES?\n\nThis will permanently delete ALL ${totalCount} images from your Stored collection.\n\nThis action CANNOT be undone!\n\nType "DELETE ALL" to confirm:`;
    const userInput = prompt(confirmMessage);

    if (userInput !== 'DELETE ALL') {
      console.log('[StoredImages] Delete all cancelled by user');
      return;
    }

    console.log(`[StoredImages] 🗑️💥 Deleting ALL ${totalCount} images...`);

    try {
      const response = await fetch(
        `${API_URL}/api/stored-images/${user.id}/all`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        throw new Error('Failed to delete all images');
      }

      const result = await response.json();
      console.log(`[StoredImages] ✅ Successfully deleted all images:`, result);

      alert(`✅ Successfully deleted all ${result.count} images from storage`);

      // Clear selection and refresh
      setGridSelection(new Set());
      setFilterBlog(null);

      console.log(`[StoredImages] 🔄 Refreshing data...`);
      await fetchImages(true);
      await fetchStats();
      console.log(`[StoredImages] ✅ Data refreshed`);
    } catch (error) {
      console.error('[StoredImages] ❌ Error deleting all images:', error);
      alert('❌ Failed to delete all images');
    }
  };

  const handleShare = async () => {
    if (gridSelection.size === 0 || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: gridSelection.size });

    try {
      const selectedImages = images.filter(img => gridSelection.has(img.id));

      const imagesToShare = selectedImages.map((img, index) => {
        const parsedTags = JSON.parse(img.tags || '[]');
        const metadata: ImageMetadata = {
          blogName: img.blogName,
          blogUrl: `https://tumblr.com/${img.blogName}`,
          tags: parsedTags,
          notes: img.notes,
          timestamp: new Date(img.timestamp).getTime(),
          description: img.description || undefined,
          postUrl: `https://tumblr.com/${img.blogName}/post/${img.postId}`,
        };

        return {
          url: img.url,
          filename: getImageFilename(img.url, index),
          metadata,
          options: {
            pattern: filenamePattern,
            includeIndex: includeIndex,
          },
        };
      });

      const result = await shareImages(imagesToShare, (current, total) => {
        setDownloadProgress({ current, total });
      });

      setDownloadProgress(null);
      setIsDownloading(false);

      if (result.succeeded === 0 && result.failed === 0) return;

      if (result.failed === 0) {
        alert(`✅ Successfully shared ${result.succeeded} image(s) to Photos!`);
      } else {
        alert(`Shared ${result.succeeded} image(s). ${result.failed} failed.`);
      }
    } catch (error) {
      setDownloadProgress(null);
      setIsDownloading(false);
      alert(
        `❌ Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  const handleDownload = async () => {
    if (gridSelection.size === 0 || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: gridSelection.size });

    try {
      const selectedImages = images.filter(img => gridSelection.has(img.id));

      const imagesToDownload = selectedImages.map((img, index) => {
        const parsedTags = JSON.parse(img.tags || '[]');
        const metadata: ImageMetadata = {
          blogName: img.blogName,
          blogUrl: `https://tumblr.com/${img.blogName}`,
          tags: parsedTags,
          notes: img.notes,
          timestamp: new Date(img.timestamp).getTime(),
          description: img.description || undefined,
          postUrl: `https://tumblr.com/${img.blogName}/post/${img.postId}`,
        };

        return {
          url: img.url,
          filename: getImageFilename(img.url, index),
          metadata,
          options: {
            pattern: filenamePattern,
            includeIndex: includeIndex,
          },
        };
      });

      // Download images using selected method
      const downloadFn =
        downloadMethod === 'server-side'
          ? downloadImagesServerSide
          : downloadImages;
      console.log(
        `[Download] Using ${downloadMethod} method for ${imagesToDownload.length} images`
      );

      await downloadFn(
        imagesToDownload,
        (current, total) => {
          setDownloadProgress({ current, total });
        },
        includeSidecarMetadata
      );

      setDownloadProgress(null);
      setIsDownloading(false);
      alert(`✅ Downloaded ${imagesToDownload.length} image(s) with metadata!`);
    } catch (error) {
      setDownloadProgress(null);
      setIsDownloading(false);
      alert(
        `❌ Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  };

  // Download all filtered images to folder (with auto-load all)
  const handleDownloadAll = async () => {
    if (filteredAndSortedImages.length === 0 || isDownloading) return;

    // Determine folder name based on current filter
    const folderName = filterBlog && filterBlog !== '' ? filterBlog : 'Stored';

    // Calculate total available images
    const totalAvailable = stats
      ? filterBlog
        ? stats.byBlog.find(b => b.blogName === filterBlog)?.count ||
        filteredAndSortedImages.length
        : stats.total
      : filteredAndSortedImages.length;

    const currentlyLoaded = filteredAndSortedImages.length;

    log.userAction('clicked', 'Download All', {
      filterBlog,
      folderName,
      currentlyLoaded,
      totalAvailable,
      hasMore,
    });

    // If there are more images to load, load them all first
    if (hasMore && totalAvailable > currentlyLoaded) {
      const remaining = totalAvailable - currentlyLoaded;

      const shouldLoadAll = window.confirm(
        `Download all ${totalAvailable} images from ${filterBlog ? `@${filterBlog}` : 'Stored'} to a folder?\n\n` +
        `Currently loaded: ${currentlyLoaded}\n` +
        `Need to load: ${remaining} more images\n\n` +
        `This will:\n` +
        `• Load all ${remaining} remaining images first\n` +
        `• Then prompt you to select download location\n` +
        `• Process images in batches of 20\n` +
        `• Allow you to cancel at any time`
      );

      if (!shouldLoadAll) {
        log.info('StoredImages', 'User cancelled download - need to load more');
        return;
      }

      // Load all images first
      log.info(
        'StoredImages',
        `Loading all ${remaining} remaining images before download...`
      );

      // Use loadingMore flag instead of isDownloading to avoid blocking handleDownloadAllToFolder
      setLoadingMore(true);

      try {
        await loadAll();
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        log.error('StoredImages', 'Failed to load all images', {
          error: (error as Error).message,
        });
        alert('❌ Failed to load all images. Please try again.');
        setLoadingMore(false);
        return;
      }

      setLoadingMore(false);
      log.info('StoredImages', 'All images loaded, starting download...', {
        totalLoaded: images.length,
      });
    }

    // Now proceed with the folder download (same as handleDownloadAllToFolder)
    // Note: Don't check isDownloading here since we just finished loading
    await handleDownloadAllToFolder();
  };

  // Download all filtered images to a folder
  const handleDownloadAllToFolder = async () => {
    if (filteredAndSortedImages.length === 0 || isDownloading) return;

    // Determine folder name based on current filter
    const folderName = filterBlog && filterBlog !== '' ? filterBlog : 'Stored';
    const count = filteredAndSortedImages.length;

    log.userAction('clicked', 'Download All to Folder', {
      filterBlog,
      folderName,
      imageCount: count,
    });

    log.info('StoredImages', `Initiating download all to folder`, {
      folderName,
      imageCount: count,
    });

    // Check browser support first (synchronous check)
    if (!('showDirectoryPicker' in window)) {
      const errorMsg = 'Folder download not supported in this browser';
      log.error('StoredImages', errorMsg, {
        userAgent: navigator.userAgent,
      });
      alert(
        '❌ Folder download not supported in this browser.\n\nPlease use Chrome, Edge, or another Chromium-based browser.'
      );
      return;
    }

    // Directory picker FIRST - must be called while user gesture is active
    let parentDirHandle: FileSystemDirectoryHandle | null = null;

    try {
      parentDirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads',
      });
      log.info('StoredImages', `Directory selected`, {
        directory: parentDirHandle.name,
      });
    } catch (error) {
      if ((error as Error & { name: string }).name === 'AbortError') {
        log.info('StoredImages', 'User cancelled directory picker');
        return;
      }
      log.error('StoredImages', 'Directory picker failed', {
        error: (error as Error).message,
      });
      alert(
        `❌ Failed to open directory picker: ${(error as Error).message}\n\nPlease try again.`
      );
      return;
    }

    // Confirmation dialog AFTER directory selection
    if (
      !window.confirm(
        `Download all ${count} images to folder "${folderName}"?\n\n` +
        `Selected location: ${parentDirHandle.name}\n\n` +
        `This will:\n` +
        `• Process images in batches of 20\n` +
        `• Take approximately ${Math.ceil(count / 20)} batches\n` +
        `• Allow you to cancel at any time`
      )
    ) {
      log.info('StoredImages', 'User cancelled download confirmation');
      return;
    }

    // Prepare download items
    const downloadItems: DownloadItem[] = filteredAndSortedImages.map(
      (img, index) => {
        const baseFilename = getImageFilename(img.url, index);

        const metadata: ImageMetadata = {
          blogName: img.blogName,
          blogUrl: `https://tumblr.com/${img.blogName}`,
          tags: img.tags ? JSON.parse(img.tags) : [],
          notes: img.notes,
          timestamp: new Date(img.timestamp).getTime(),
          description: img.description || undefined,
          postUrl: `https://tumblr.com/${img.blogName}/post/${img.postId}`,
        };

        return {
          url: img.url,
          filename: baseFilename,
          metadata,
        };
      }
    );

    const totalBatches = Math.ceil(count / 20);

    // Clear any previous download state first
    clearDownload();

    log.info('StoredImages', 'Starting new download with folder name', {
      folderName,
      filterBlog,
      imageCount: count,
    });

    // Initialize download state
    startDownload({
      type: 'download-folder',
      blogName: folderName,
      folderName,
      totalImages: count,
      totalBatches,
    });

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: count });

    startOperation({
      type: 'download-folder',
      current: 0,
      total: count,
      source: folderName,
    });

    const operationStartTime = Date.now();
    log.info('StoredImages', 'Download operation started', {
      totalImages: count,
      totalBatches,
      startTime: new Date(operationStartTime).toISOString(),
    });

    // Track counts locally for callbacks
    let succeededCount = 0;
    let failedCount = 0;

    try {
      // Download images in batches
      const downloadResult = await batchedDownload({
        items: downloadItems,
        batchSize: 20,
        delayBetweenBatches: 1000,
        delayBetweenItems: 100,
        maxRetries: 3,
        retryDelay: 1000,
        onProgress: (current, total) => {
          setDownloadProgress({ current, total });
          updateOperationProgress({ current, total });

          const elapsed = Date.now() - operationStartTime;
          const estimate = estimateTimeRemaining(current, total, elapsed);

          updateDownloadProgress({
            processedImages: current,
            succeededImages: succeededCount,
            failedImages: failedCount,
            estimatedTimeRemaining: estimate,
          });
        },
        onBatchStart: (batchNum, totalBatches) => {
          log.info(
            'StoredImages',
            `Starting batch ${batchNum}/${totalBatches}`
          );
          updateDownloadProgress({
            currentBatch: batchNum,
          });
        },
        onBatchComplete: (batchNum, totalBatches) => {
          log.info(
            'StoredImages',
            `Completed batch ${batchNum}/${totalBatches}`
          );
        },
        onItemSuccess: (item, index) => {
          succeededCount++;
          log.debug('StoredImages', `Downloaded image ${index + 1}/${count}`, {
            filename: item.filename,
          });
          updateDownloadProgress({
            succeededImages: succeededCount,
          });
        },
        onItemError: (item, index, error) => {
          failedCount++;
          log.error(
            'StoredImages',
            `Failed to download image ${index + 1}/${count}`,
            {
              filename: item.filename,
              url: item.url,
              error,
            }
          );
          updateDownloadProgress({
            failedImages: failedCount,
            error: {
              url: item.url,
              filename: item.filename,
              error,
              timestamp: Date.now(),
            },
          });
        },
        shouldCancel: () => cancelRequested,
      });

      if (downloadResult.cancelled) {
        log.warn('StoredImages', 'Download cancelled by user', {
          processed: downloadResult.blobs.length,
          succeeded: downloadResult.succeeded,
          failed: downloadResult.failed,
        });
        alert(
          `⚠️ Download cancelled.\n\n${downloadResult.succeeded} images were downloaded before cancellation.`
        );
        return;
      }

      log.info('StoredImages', 'Download phase completed', {
        total: count,
        succeeded: downloadResult.succeeded,
        failed: downloadResult.failed,
        errorCount: downloadResult.errors.length,
      });

      // Apply filename patterns
      const { generateMetadataFilename } = await import(
        '@/utils/imageDownload'
      );
      const filesWithPatterns = downloadResult.blobs.map((item, index) => {
        const filename = generateMetadataFilename(
          item.filename,
          item.metadata,
          {
            pattern: filenamePattern,
            includeIndex: includeIndex,
            index: filteredAndSortedImages.findIndex(
              img => getImageFilename(img.url, index) === item.filename
            ),
          }
        );
        return { blob: item.blob, filename };
      });

      // Save files to directory
      log.info('StoredImages', 'Starting file save phase', {
        fileCount: filesWithPatterns.length,
      });

      const subdirHandle = await parentDirHandle.getDirectoryHandle(
        folderName,
        { create: true }
      );
      log.info('StoredImages', `Created/opened subdirectory: ${folderName}`);

      const saveResult = await saveBlobsToDirectory(
        filesWithPatterns,
        subdirHandle,
        {
          onProgress: (current, total) => {
            setDownloadProgress({ current, total });
            updateOperationProgress({ current, total });
          },
          onItemSuccess: (filename, index) => {
            log.debug(
              'StoredImages',
              `Saved file ${index + 1}/${filesWithPatterns.length}`,
              {
                filename,
              }
            );
          },
          onItemError: (filename, index, error) => {
            log.error(
              'StoredImages',
              `Failed to save file ${index + 1}/${filesWithPatterns.length}`,
              {
                filename,
                error,
              }
            );
          },
          delayBetweenFiles: 50,
          shouldCancel: () => cancelRequested,
        }
      );

      const operationDuration = Date.now() - operationStartTime;

      log.info('StoredImages', 'Download operation completed', {
        downloadSucceeded: downloadResult.succeeded,
        downloadFailed: downloadResult.failed,
        saveSucceeded: saveResult.succeeded,
        saveFailed: saveResult.failed,
        duration: operationDuration,
        durationFormatted: `${Math.floor(operationDuration / 1000)}s`,
      });

      completeDownload();

      if (saveResult.failed === 0 && downloadResult.failed === 0) {
        alert(
          `✅ Successfully downloaded ${saveResult.succeeded} images to folder "${folderName}"!`
        );
      } else {
        const message =
          `⚠️ Download completed with some issues:\n\n` +
          `✅ ${saveResult.succeeded} images saved successfully\n` +
          `❌ ${downloadResult.failed} failed to download\n` +
          `❌ ${saveResult.failed} failed to save\n\n` +
          `Check the browser console for details.`;
        alert(message);
      }
    } catch (error) {
      log.error('StoredImages', 'Download operation failed', {
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      alert(
        `❌ Download failed: ${(error as Error).message}\n\nPlease try again.`
      );
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      endOperation();
    }
  };

  // Download selected images to a folder
  const handleDownloadSelectedToFolder = async () => {
    if (gridSelection.size === 0 || isDownloading) return;

    // Determine folder name based on current filter
    const folderName = filterBlog && filterBlog !== '' ? filterBlog : 'Stored';

    console.log(
      `[Stored] 📁 Download folder (selected) - filterBlog: "${filterBlog}", folderName: "${folderName}"`
    );

    // Check browser support first (synchronous check)
    if (!('showDirectoryPicker' in window)) {
      alert(
        '❌ Folder download not supported in this browser.\n\nPlease use Chrome, Edge, or another Chromium-based browser.'
      );
      return;
    }

    // Directory picker FIRST - must be called while user gesture is active
    let parentDirHandle: FileSystemDirectoryHandle | null = null;

    try {
      parentDirHandle = await window.showDirectoryPicker({
        mode: 'readwrite',
        startIn: 'downloads',
      });
      console.log(`[Stored] ✅ Directory selected: ${parentDirHandle.name}`);
    } catch (error) {
      if ((error as Error & { name: string }).name === 'AbortError') {
        console.log('[Stored] ℹ️ User cancelled directory picker');
        return;
      }
      console.error('[Stored] ❌ Error showing directory picker:', error);
      alert(
        `❌ Failed to open directory picker: ${(error as Error).message}\n\nPlease try again.`
      );
      return;
    }

    // Confirmation dialog AFTER directory selection
    if (
      !window.confirm(
        `Download ${gridSelection.size} selected images to folder "${folderName}"?\n\n` +
        `Selected location: ${parentDirHandle.name}`
      )
    ) {
      return;
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: gridSelection.size });

    startOperation({
      type: 'download-folder',
      current: 0,
      total: gridSelection.size,
      source: folderName,
    });

    try {
      const selectedImages = images.filter(img => gridSelection.has(img.id));
      const files: Array<{ blob: Blob; filename: string }> = [];

      for (let i = 0; i < selectedImages.length; i++) {
        const img = selectedImages[i];
        try {
          const response = await fetch(img.url);
          if (!response.ok)
            throw new Error(`Failed to fetch: ${response.statusText}`);

          const blob = await response.blob();
          const baseFilename = getImageFilename(img.url, i);

          // Create metadata for filename pattern
          const metadata: ImageMetadata = {
            blogName: img.blogName,
            blogUrl: `https://tumblr.com/${img.blogName}`,
            tags: img.tags ? JSON.parse(img.tags) : [],
            notes: img.notes,
            timestamp: new Date(img.timestamp).getTime(),
            description: img.description || undefined,
            postUrl: `https://tumblr.com/${img.blogName}/post/${img.postId}`,
          };

          // Apply filename pattern
          const { generateMetadataFilename } = await import(
            '@/utils/imageDownload'
          );
          const filename = generateMetadataFilename(baseFilename, metadata, {
            pattern: filenamePattern,
            includeIndex: includeIndex,
            index: i,
          });

          files.push({ blob, filename });

          setDownloadProgress({ current: i + 1, total: selectedImages.length });
          updateOperationProgress({
            current: i + 1,
            total: selectedImages.length,
          });
        } catch (error) {
          console.error(`[Stored] ❌ Failed to fetch image ${i + 1}:`, error);
        }
      }

      // Save files to selected directory
      let successCount = 0;
      let failedCount = 0;

      const subdirHandle = await parentDirHandle.getDirectoryHandle(
        folderName,
        { create: true }
      );
      console.log(`[Stored] ✅ Created/opened subdirectory: ${folderName}`);

      for (let i = 0; i < files.length; i++) {
        const { blob, filename } = files[i];

        try {
          const fileHandle = await subdirHandle.getFileHandle(filename, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();

          successCount++;
        } catch (error) {
          failedCount++;
          console.error(`[Stored] ❌ Failed to save ${filename}:`, error);
        }

        setDownloadProgress({ current: i + 1, total: files.length });
        updateOperationProgress({ current: i + 1, total: files.length });

        if (i < files.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      if (failedCount === 0) {
        alert(
          `✅ Successfully downloaded ${successCount} selected images to folder "${folderName}"!`
        );
      } else {
        alert(
          `⚠️ Partially downloaded: ${successCount} succeeded, ${failedCount} failed.`
        );
      }
    } catch (error) {
      console.error('[Stored] ❌ Selected folder download failed:', error);
      alert('Failed to download selected images to folder. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      endOperation();
    }
  };

  // Filter handlers
  const handleToggleSize = (size: string) => {
    setImageFilters(prev => {
      const newSizes = new Set(prev.sizes);
      if (newSizes.has(size)) {
        newSizes.delete(size);
      } else {
        newSizes.add(size);
      }
      return { ...prev, sizes: newSizes };
    });
  };

  const handleToggleDate = (date: string) => {
    setImageFilters(prev => {
      const newDates = new Set(prev.dates);
      if (newDates.has(date)) {
        newDates.delete(date);
      } else {
        newDates.add(date);
      }
      return { ...prev, dates: newDates };
    });
  };

  const handleSetSort = (sort: 'recent' | 'popular' | 'oldest') => {
    setImageFilters(prev => ({ ...prev, sort }));
  };

  const handleClearAllFilters = () => {
    setImageFilters({
      sizes: new Set(),
      dates: new Set(),
      sort: 'recent',
    });
  };

  const handleGridColumnsChange = (columns: number) => {
    updatePreferences({ gridColumns: columns });
  };

  const handleGridImageSizeChange = (
    size: 'compact' | 'comfortable' | 'spacious'
  ) => {
    updatePreferences({ gridImageSize: size });
  };

  if (!user) {
    return (
      <Container>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">
            Please login to view stored images
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="space-y-6 pb-20">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Stored Images</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {stats ? (
                <>
                  {stats.total} total images stored
                  {stats.totalCost > 0 && (
                    <span className="ml-2 font-semibold text-green-600 dark:text-green-400">
                      • ${stats.totalCost.toFixed(2)} total value
                    </span>
                  )}
                </>
              ) : (
                'Loading...'
              )}
            </p>
          </div>
          <Button
            onClick={() => {
              setFilterBlog(null);
              fetchImages();
            }}
            variant="outline"
          >
            Refresh
          </Button>
        </div>

        {/* Stats / Blog Filter */}
        {stats && stats.byBlog.length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <h2 className="text-sm font-semibold mb-3">Filter by Blog</h2>
            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={filterBlog === null ? 'default' : 'outline'}
                onClick={() => setFilterBlog(null)}
              >
                All ({stats.total})
                {stats.totalCost > 0 && (
                  <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                    ${stats.totalCost.toFixed(2)}
                  </span>
                )}
              </Button>
              {stats.byBlog.slice(0, blogFilterLimit).map(blog => (
                <Button
                  key={blog.blogName}
                  size="sm"
                  variant={filterBlog === blog.blogName ? 'default' : 'outline'}
                  onClick={() => setFilterBlog(blog.blogName)}
                >
                  {blog.blogName} ({blog.count})
                  {blog.totalCost > 0 && (
                    <span className="ml-1 text-xs text-green-600 dark:text-green-400">
                      ${blog.totalCost.toFixed(2)}
                    </span>
                  )}
                </Button>
              ))}
              {stats.byBlog.length > blogFilterLimit && (
                <span className="text-xs text-gray-500 dark:text-gray-400 self-center">
                  +{stats.byBlog.length - blogFilterLimit} more blogs (change
                  limit in Settings)
                </span>
              )}
            </div>

            {/* Delete All Button - Prominent Warning */}
            {stats && stats.total > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleDeleteAll}
                  className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950"
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
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                  Delete All{' '}
                  {filterBlog
                    ? `${filterBlog} (${stats.byBlog.find(b => b.blogName === filterBlog)?.count || 0})`
                    : `${stats.total} Images`}
                </Button>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  ⚠️ This will permanently delete{' '}
                  {filterBlog
                    ? `all images from @${filterBlog}`
                    : 'all stored images'}
                  . Type "DELETE ALL" to confirm.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pagination Controls */}
        {!loading && images.length > 0 && stats && (
          <div className="flex items-center justify-between bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedImages.length} of{' '}
              {filterBlog
                ? stats.byBlog.find(b => b.blogName === filterBlog)?.count ||
                stats.total
                : stats.total}{' '}
              images
              {hasMore && (
                <span className="ml-2 text-blue-600 dark:text-blue-400">
                  (
                  {filterBlog
                    ? (stats.byBlog.find(b => b.blogName === filterBlog)
                      ?.count || 0) - filteredAndSortedImages.length
                    : stats.total - images.length}{' '}
                  more available)
                </span>
              )}
            </div>
            {hasMore && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? 'Loading...' : 'Load More (50)'}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadMoreAndSelect}
                  disabled={loadingMore}
                  title="Load next 50 images and add them to selection"
                >
                  {loadingMore ? 'Loading...' : 'Load & Select +50'}
                </Button>
                <Button size="sm" onClick={loadAll} disabled={loadingMore}>
                  {loadingMore
                    ? 'Loading...'
                    : `Load All (${filterBlog
                      ? (stats.byBlog.find(b => b.blogName === filterBlog)
                        ?.count || 0) - filteredAndSortedImages.length
                      : stats.total - images.length
                    })`}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto" />
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              Loading images...
            </p>
          </div>
        ) : images.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              {filterBlog
                ? `No images stored from ${filterBlog}`
                : 'No images stored yet'}
            </p>
            <p className="text-sm text-gray-500">
              Use the "Store" button in the blog view to save images
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selection Toolbar */}
            <SelectionToolbar
              selectedCount={gridSelection.size}
              totalCount={
                filterBlog
                  ? stats.byBlog.find(b => b.blogName === filterBlog)?.count ||
                  filteredAndSortedImages.length
                  : filteredAndSortedImages.length
              }
              filterContext={filterBlog ? `from @${filterBlog}` : undefined}
              onSelectAll={handleSelectAll}
              onSelectNone={handleSelectNone}
              onInvertSelection={handleInvertSelection}
              onDownload={handleDownload}
              onDownloadToFolder={handleDownloadSelectedToFolder}
              onShare={handleShare}
              onDelete={handleDelete}
              isDownloading={isDownloading}
              downloadProgress={downloadProgress}
              canShare={canShareFiles()}
              rangeMode={rangeMode}
              onToggleRangeMode={() => {
                setRangeMode(!rangeMode);
                setRangeStart(null);
              }}
              rangeStart={rangeStart}
            />

            {/* Action Button Groups */}
            <div className="flex flex-col gap-2">
              {/* Load Section */}
              {hasMore && stats && (
                <ActionButtonGroup
                  title="Load"
                  icon={
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                  }
                  compact
                >
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadMore}
                    disabled={loadingMore}
                  >
                    {loadingMore ? 'Loading...' : 'Load More (50)'}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadMoreAndSelect}
                    disabled={loadingMore}
                    title="Load next 50 images and add them to selection"
                  >
                    {loadingMore ? 'Loading...' : 'Load & Select +50'}
                  </Button>
                  <Button size="sm" onClick={loadAll} disabled={loadingMore}>
                    {loadingMore
                      ? 'Loading...'
                      : `Load All (${filterBlog
                        ? (stats.byBlog.find(b => b.blogName === filterBlog)
                          ?.count || 0) - filteredAndSortedImages.length
                        : stats.total - images.length
                      })`}
                  </Button>
                </ActionButtonGroup>
              )}

              {/* Download Section */}
              {filteredAndSortedImages.length > 0 && (
                <ActionButtonGroup
                  title="Download"
                  icon={
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  }
                  compact
                >
                  <Button
                    onClick={handleDownload}
                    variant="secondary"
                    size="sm"
                    disabled={isDownloading || gridSelection.size === 0}
                  >
                    Download Selected ({gridSelection.size})
                  </Button>
                  <Button
                    onClick={handleDownloadSelectedToFolder}
                    variant="secondary"
                    size="sm"
                    disabled={isDownloading || gridSelection.size === 0}
                    className="flex items-center gap-1"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    Download Selected to Folder
                  </Button>
                  <Button
                    onClick={handleDownloadAll}
                    variant="secondary"
                    size="sm"
                    disabled={isDownloading || loadingMore}
                    className="flex items-center gap-1"
                  >
                    <svg
                      className="h-3.5 w-3.5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                      />
                    </svg>
                    {loadingMore
                      ? `Loading images...`
                      : isDownloading && downloadProgress
                        ? `Downloading... (${downloadProgress.current}/${downloadProgress.total})`
                        : `Download All${filterBlog ? ` @${filterBlog}` : ''} to Folder${hasMore && stats ? ` (${stats ? (filterBlog ? stats.byBlog.find(b => b.blogName === filterBlog)?.count || filteredAndSortedImages.length : stats.total) : filteredAndSortedImages.length})` : ` (${filteredAndSortedImages.length})`}`}
                  </Button>
                </ActionButtonGroup>
              )}

              {/* Delete Section */}
              {stats && stats.total > 0 && (
                <ActionButtonGroup
                  title="Delete"
                  icon={
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  }
                  compact
                >
                  <Button
                    onClick={handleDelete}
                    variant="secondary"
                    size="sm"
                    disabled={gridSelection.size === 0}
                  >
                    Delete Selected ({gridSelection.size})
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleDeleteAll}
                    className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950"
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
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                    Delete All{filterBlog ? ` ${filterBlog}` : ''} (
                    {filterBlog
                      ? stats.byBlog.find(b => b.blogName === filterBlog)
                        ?.count || 0
                      : stats.total}
                    )
                  </Button>
                </ActionButtonGroup>
              )}
            </div>

            {/* Filters */}
            <div
              className={`bg-white dark:bg-gray-800 ${isFilterSticky ? 'sticky top-16 z-40' : 'relative'
                } rounded-lg border border-gray-200 p-4 shadow-sm transition-all dark:border-gray-800`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <ImageFilters
                    filters={imageFilters}
                    onToggleSize={handleToggleSize}
                    onToggleDate={handleToggleDate}
                    onSetSort={handleSetSort}
                    onClearAll={handleClearAllFilters}
                    gridColumns={gridColumns}
                    onGridColumnsChange={handleGridColumnsChange}
                    gridImageSize={gridImageSize}
                    onGridImageSizeChange={handleGridImageSizeChange}
                  />
                </div>

                {/* Sticky Toggle Button */}
                <button
                  onClick={() => setIsFilterSticky(!isFilterSticky)}
                  className={`flex-shrink-0 rounded-lg p-2 transition-colors ${isFilterSticky
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-400'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                    }`}
                  title={
                    isFilterSticky
                      ? 'Unlock filters (scroll with page)'
                      : 'Lock filters (stay at top)'
                  }
                >
                  {isFilterSticky ? (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Image Grid */}
            {filteredAndSortedImages.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  No images match your filters
                </p>
                <Button
                  onClick={handleClearAllFilters}
                  variant="outline"
                  size="sm"
                >
                  Clear Filters
                </Button>
              </div>
            ) : (
              <div ref={gridRef} className="w-full">
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                    gap:
                      gridImageSize === 'compact'
                        ? '0.25rem'
                        : gridImageSize === 'comfortable'
                          ? '0.5rem'
                          : '1rem',
                  }}
                >
                  {filteredAndSortedImages.map((image, index) => {
                    const isSelected = gridSelection.has(image.id);
                    const isFocused = index === focusedIndex;
                    const isRangeStart = rangeMode && rangeStart === index;

                    return (
                      <motion.div
                        key={image.id}
                        data-grid-index={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.01 }}
                        className={`group relative aspect-square cursor-pointer overflow-hidden rounded ${isFocused
                          ? 'ring-2 ring-primary-500 ring-offset-2 ring-offset-gray-50 dark:ring-offset-gray-900'
                          : ''
                          } ${isRangeStart ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                        onClick={e => {
                          // Range Mode (mobile-friendly)
                          if (rangeMode) {
                            if (rangeStart === null) {
                              // First tap - set range start
                              setRangeStart(index);
                              const newSelection = new Set(gridSelection);
                              newSelection.add(image.id);
                              setGridSelection(newSelection);
                            } else {
                              // Second tap - select range and exit mode
                              const start = Math.min(rangeStart, index);
                              const end = Math.max(rangeStart, index);
                              const newSelection = new Set(gridSelection);
                              for (let i = start; i <= end; i++) {
                                newSelection.add(filteredAndSortedImages[i].id);
                              }
                              setGridSelection(newSelection);
                              setRangeMode(false);
                              setRangeStart(null);
                              setLastSelectedIndex(index);
                            }
                            return;
                          }

                          if (e.shiftKey && lastSelectedIndex !== null) {
                            const start = Math.min(lastSelectedIndex, index);
                            const end = Math.max(lastSelectedIndex, index);
                            const newSelection = new Set(gridSelection);
                            for (let i = start; i <= end; i++) {
                              newSelection.add(filteredAndSortedImages[i].id);
                            }
                            setGridSelection(newSelection);
                            setLastSelectedIndex(index);
                          } else if (e.ctrlKey || e.metaKey) {
                            const newSelection = new Set(gridSelection);
                            if (newSelection.has(image.id)) {
                              newSelection.delete(image.id);
                            } else {
                              newSelection.add(image.id);
                            }
                            setGridSelection(newSelection);
                            setLastSelectedIndex(index);
                          } else {
                            setSelectedImage(index);
                          }
                        }}
                      >
                        <img
                          src={withProxy(image.url)}
                          alt={image.description || 'Stored image'}
                          className={`h-full w-full object-cover transition-transform ${isSelected ? 'scale-95' : 'group-hover:scale-105'
                            }`}
                        />

                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary-500/30 ring-2 ring-inset ring-primary-500" />
                        )}

                        {/* Hover overlay */}
                        <div
                          className={`absolute inset-0 bg-black/0 transition-colors ${!isSelected && 'group-hover:bg-black/20'
                            }`}
                        />

                        {/* Checkbox - Always visible when selected */}
                        <div
                          className={`absolute left-2 top-2 transition-opacity ${isSelected
                            ? 'opacity-100'
                            : 'opacity-0 group-hover:opacity-100'
                            }`}
                        >
                          <div
                            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded border-2 transition-all hover:scale-110 ${isSelected
                              ? 'border-primary-500 bg-primary-500 shadow-lg'
                              : 'border-white bg-white/20 backdrop-blur-sm hover:bg-white/40'
                              }`}
                            onClick={e => {
                              e.stopPropagation();

                              // Handle Shift+Click for range selection
                              if (e.shiftKey && lastSelectedIndex !== null) {
                                const start = Math.min(
                                  lastSelectedIndex,
                                  index
                                );
                                const end = Math.max(lastSelectedIndex, index);
                                const newSelection = new Set(gridSelection);
                                for (let i = start; i <= end; i++) {
                                  newSelection.add(
                                    filteredAndSortedImages[i].id
                                  );
                                }
                                setGridSelection(newSelection);
                                setLastSelectedIndex(index);
                              } else {
                                // Normal toggle
                                const newSelection = new Set(gridSelection);
                                if (newSelection.has(image.id)) {
                                  newSelection.delete(image.id);
                                } else {
                                  newSelection.add(image.id);
                                }
                                setGridSelection(newSelection);
                                setLastSelectedIndex(index);
                              }
                            }}
                          >
                            {isSelected && (
                              <svg
                                className="h-4 w-4 text-white"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={3}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </div>

                        {/* Range start indicator */}
                        {isRangeStart && (
                          <div className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-lg">
                            START
                          </div>
                        )}

                        {/* Info on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="text-xs font-semibold text-white">
                            {image.blogName}
                          </p>
                          <p className="text-xs text-white/80">
                            {image.notes} notes
                          </p>
                          {image.cost && (
                            <p className="text-xs font-semibold text-green-400">
                              ${image.cost.toFixed(2)}
                            </p>
                          )}
                          <p className="text-[10px] text-white/60">
                            {new Date(image.storedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Image Viewer */}
        <AnimatePresence>
          {selectedImage !== null && filteredAndSortedImages[selectedImage] && (
            <ImageViewer
              key="stored-image-viewer"
              imageUrl={filteredAndSortedImages[selectedImage].url}
              isOpen={true}
              onClose={() => setSelectedImage(null)}
              onNext={
                selectedImage < filteredAndSortedImages.length - 1 || hasMore
                  ? handleNextImage
                  : undefined
              }
              onPrevious={selectedImage > 0 ? handlePreviousImage : undefined}
              onJumpToEnd={handleJumpToEnd}
              onJumpToStart={handleJumpToStart}
              currentIndex={selectedImage}
              totalImages={stats?.total || filteredAndSortedImages.length}
              postId={filteredAndSortedImages[selectedImage].postId}
              blogId={filteredAndSortedImages[selectedImage].blogName}
              userId={user?.id}
              totalNotes={selectedImageNotes.length}
              notesList={selectedImageNotes}
              isSelected={gridSelection.has(
                filteredAndSortedImages[selectedImage].id
              )}
              onToggleSelect={() => {
                const newSelection = new Set(gridSelection);
                if (
                  newSelection.has(filteredAndSortedImages[selectedImage].id)
                ) {
                  newSelection.delete(
                    filteredAndSortedImages[selectedImage].id
                  );
                } else {
                  newSelection.add(filteredAndSortedImages[selectedImage].id);
                }
                setGridSelection(newSelection);
              }}
            />
          )}

          {/* Loading indicator for navigation */}
          {loadingMore && selectedImage !== null && (
            <div
              key="stored-loading-more"
              className="fixed bottom-20 left-1/2 transform -translate-x-1/2 z-[60] bg-black/80 text-white px-4 py-2 rounded-full backdrop-blur-sm"
            >
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                <span className="text-sm">Loading more images...</span>
              </div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </Container>
  );
}
