# Blog.tsx Refactoring Proposal
**Date**: December 1, 2024  
**Current State**: 2,409 lines, monolithic component  
**Proposed State**: ~800-line main component + 8 modular hooks  
**Estimated Effort**: 12-16 hours  
**Risk Level**: Medium (with phased approach)

---

## Executive Summary

**Problem**: Blog.tsx is a 2,409-line monolithic component that is difficult to:
- Test in isolation
- Maintain and debug
- Reuse across other components
- Understand without extensive documentation

**Solution**: Extract logical concerns into custom hooks while maintaining 100% functionality.

**Benefits**:
- ✅ 70% reduction in main file size (2,409 → ~800 lines)
- ✅ Each hook testable independently
- ✅ Improved code discoverability
- ✅ Better separation of concerns
- ✅ Reusable logic across components
- ✅ Easier onboarding for new developers

---

## Proposed File Structure

```
src/features/blog/
├── Blog.tsx                          (~800 lines) - Main component & UI
├── hooks/
│   ├── useBlogData.ts                (~100 lines) - Blog/likes data fetching
│   ├── useImageFilters.ts            (~150 lines) - Filter logic & state
│   ├── useImageSelection.ts          (~120 lines) - Selection & range mode
│   ├── useDownloadOperations.ts      (~300 lines) - All download logic
│   ├── useStorageOperations.ts       (~250 lines) - Database storage
│   ├── useImageNavigation.ts         (~80 lines)  - Viewer navigation
│   ├── useKeyboardShortcuts.ts       (~100 lines) - Keyboard handlers
│   └── index.ts                      (~20 lines)  - Re-exports
├── utils/
│   ├── filterHelpers.ts              (~50 lines)  - Pure filter functions
│   ├── imageHelpers.ts               (~40 lines)  - Image utilities
│   └── index.ts                      (~10 lines)  - Re-exports
├── types/
│   └── index.ts                      (~60 lines)  - Shared interfaces
└── components/                       (optional - future)
    ├── BlogGrid.tsx
    ├── BlogToolbar.tsx
    └── FilterPanel.tsx
```

**Total Lines**: ~2,080 (vs 2,409 current)  
**Main Component**: ~800 lines (67% reduction)  
**New Hooks**: 8 files, highly focused

---

## Phase 1: Foundation & Types (Low Risk - 1 hour)

### Step 1.1: Extract Types
**File**: `src/features/blog/types/index.ts`

```typescript
// Before: Scattered throughout Blog.tsx
interface BlogPost { ... }

// After: Centralized, exportable
export interface BlogPost {
  id: string;
  type: 'text' | 'photo' | 'quote' | 'link';
  content: string;
  timestamp: number;
  notes: number;
  notesData?: Note[];
  tags: string[];
  images?: string[];
  imageWidth?: number;
  imageHeight?: number;
}

export interface ImageFiltersState {
  sizes: Set<'small' | 'medium' | 'large'>;
  dates: Set<'today' | 'week' | 'month' | 'year'>;
  sort: 'recent' | 'oldest' | 'popular';
}

export interface DownloadOptions {
  preSelectedHandle?: FileSystemDirectoryHandle | null;
  skipConfirmation?: boolean;
  skipExisting?: boolean;
}

export interface DownloadProgress {
  current: number;
  total: number;
}

export type ViewMode = 'all' | 'images-only';
export type ContentMode = 'posts' | 'likes';
```

**Impact**: Makes types reusable, improves IDE autocomplete

---

### Step 1.2: Extract Pure Utility Functions
**File**: `src/features/blog/utils/imageHelpers.ts`

```typescript
/**
 * Categorize image dimensions into size buckets
 */
export function getImageResolution(width: number, height: number): 'small' | 'medium' | 'large' {
  if (width === 800 && height === 600) return 'small';
  if (width === 1000 && height === 800) return 'medium';
  if (width === 1200 && height === 900) return 'large';
  return 'medium'; // default
}

/**
 * Dynamic API URL based on environment
 */
export function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}
```

**File**: `src/features/blog/utils/filterHelpers.ts`

```typescript
import type { BlogPost, ImageFiltersState } from '../types';

/**
 * Filter posts by size category
 */
export function filterBySize(posts: BlogPost[], sizes: Set<string>): BlogPost[] {
  if (sizes.size === 0) return posts;
  
  return posts.filter(post => {
    if (!post.imageWidth || !post.imageHeight) return true;
    
    const postSize = getImageResolution(post.imageWidth, post.imageHeight);
    return sizes.has(postSize);
  });
}

/**
 * Filter posts by date range
 */
export function filterByDate(posts: BlogPost[], dates: Set<string>): BlogPost[] {
  if (dates.size === 0) return posts;
  
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  return posts.filter(post => {
    const diff = now - post.timestamp;
    
    for (const dateFilter of dates) {
      if (dateFilter === 'today' && diff < day) return true;
      if (dateFilter === 'week' && diff < 7 * day) return true;
      if (dateFilter === 'month' && diff < 30 * day) return true;
      if (dateFilter === 'year' && diff < 365 * day) return true;
    }
    return false;
  });
}

/**
 * Sort posts by criteria
 */
export function sortPosts(
  posts: BlogPost[], 
  sort: 'recent' | 'oldest' | 'popular'
): BlogPost[] {
  return [...posts].sort((a, b) => {
    if (sort === 'recent') return b.timestamp - a.timestamp;
    if (sort === 'oldest') return a.timestamp - b.timestamp;
    if (sort === 'popular') return b.notes - a.notes;
    return 0;
  });
}
```

**Benefits**: 
- Pure functions → Easy to test
- No React dependencies
- Can be used in Node.js context

---

## Phase 2: Extract Data Fetching (Low Risk - 2 hours)

### Step 2.1: Blog Data Hook
**File**: `src/features/blog/hooks/useBlogData.ts`

```typescript
import { useState, useCallback } from 'react';
import type { BlogPost, ContentMode } from '../types';
import { useTumblrBlog } from '@/hooks/useTumblrBlog';

export function useBlogData(username: string) {
  // Blog posts (from useTumblrBlog hook)
  const {
    blogData,
    loading: blogLoading,
    loadingMore: blogLoadingMore,
    error: blogError,
    hasMore: blogHasMore,
    loadMore: blogLoadMore,
    loadAll: blogLoadAll,
    loadMultiple: blogLoadMultiple,
    usingMockData
  } = useTumblrBlog(username);

  // Liked posts (custom fetcher)
  const [likedPostsData, setLikedPostsData] = useState<BlogPost[]>([]);
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingMoreLikes, setLoadingMoreLikes] = useState(false);
  const [likesError, setLikesError] = useState<string | null>(null);
  const [likesOffset, setLikesOffset] = useState(0);
  const [likesHasMore, setLikesHasMore] = useState(false);
  const [likesTotalCount, setLikesTotalCount] = useState<number | null>(null);
  const [likesNextTimestamp, setLikesNextTimestamp] = useState<number | undefined>();

  const fetchLikedPosts = useCallback(async (limit = 20, reset = false) => {
    if (loadingLikes || loadingMoreLikes) return;

    const isInitial = reset || likedPostsData.length === 0;
    if (isInitial) {
      setLoadingLikes(true);
    } else {
      setLoadingMoreLikes(true);
    }

    try {
      // ... existing fetch logic ...
    } catch (error) {
      setLikesError(error instanceof Error ? error.message : 'Failed to fetch liked posts');
    } finally {
      setLoadingLikes(false);
      setLoadingMoreLikes(false);
    }
  }, [loadingLikes, loadingMoreLikes, likedPostsData.length]);

  const loadMoreLikes = useCallback(() => {
    fetchLikedPosts(20, false);
  }, [fetchLikedPosts]);

  const loadMultipleLikes = useCallback((count: number) => {
    fetchLikedPosts(count, false);
  }, [fetchLikedPosts]);

  return {
    // Blog data
    blogData,
    blogLoading,
    blogLoadingMore,
    blogError,
    blogHasMore,
    blogLoadMore,
    blogLoadAll,
    blogLoadMultiple,
    usingMockData,
    
    // Liked posts data
    likedPostsData,
    loadingLikes,
    loadingMoreLikes,
    likesError,
    likesHasMore,
    likesTotalCount,
    fetchLikedPosts,
    loadMoreLikes,
    loadMultipleLikes
  };
}
```

**Usage in Blog.tsx**:
```typescript
// Before: 100+ lines of state and logic
const [likedPostsData, setLikedPostsData] = useState<BlogPost[]>([]);
// ... 20+ more state variables
const fetchLikedPosts = async () => { /* ... */ };

// After: 4 lines
const {
  blogData, blogLoading, blogHasMore, blogLoadMore, blogLoadAll,
  likedPostsData, loadingLikes, likesHasMore, loadMoreLikes
} = useBlogData(username);
```

---

## Phase 3: Extract Image Filters (Low Risk - 2 hours)

### Step 3.1: Image Filters Hook
**File**: `src/features/blog/hooks/useImageFilters.ts`

```typescript
import { useState, useMemo, useCallback } from 'react';
import type { BlogPost, ImageFiltersState } from '../types';
import { filterBySize, filterByDate, sortPosts } from '../utils/filterHelpers';

export function useImageFilters(allPosts: BlogPost[]) {
  const [filters, setFilters] = useState<ImageFiltersState>({
    sizes: new Set(),
    dates: new Set(),
    sort: 'recent'
  });

  // Memoized filtered & sorted posts
  const filteredPosts = useMemo(() => {
    let posts = allPosts;
    posts = filterBySize(posts, filters.sizes);
    posts = filterByDate(posts, filters.dates);
    posts = sortPosts(posts, filters.sort);
    return posts;
  }, [allPosts, filters]);

  // Filter actions
  const toggleSize = useCallback((size: string) => {
    setFilters(prev => {
      const newSizes = new Set(prev.sizes);
      if (newSizes.has(size)) {
        newSizes.delete(size);
      } else {
        newSizes.add(size);
      }
      return { ...prev, sizes: newSizes };
    });
  }, []);

  const toggleDate = useCallback((date: string) => {
    setFilters(prev => {
      const newDates = new Set(prev.dates);
      if (newDates.has(date)) {
        newDates.delete(date);
      } else {
        newDates.add(date);
      }
      return { ...prev, dates: newDates };
    });
  }, []);

  const setSort = useCallback((sort: 'recent' | 'oldest' | 'popular') => {
    setFilters(prev => ({ ...prev, sort }));
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({
      sizes: new Set(),
      dates: new Set(),
      sort: 'recent'
    });
  }, []);

  return {
    filters,
    filteredPosts,
    toggleSize,
    toggleDate,
    setSort,
    clearAllFilters
  };
}
```

**Usage in Blog.tsx**:
```typescript
// Before: 80+ lines
const [imageFilters, setImageFilters] = useState<ImageFiltersState>({ ... });
const handleToggleSize = (size) => { /* ... */ };
const handleToggleDate = (date) => { /* ... */ };
// ...

// After: 2 lines
const { filters, filteredPosts, toggleSize, toggleDate, setSort, clearAllFilters } 
  = useImageFilters(allPhotoPosts);
```

---

## Phase 4: Extract Selection Logic (Medium Risk - 3 hours)

### Step 4.1: Selection Hook
**File**: `src/features/blog/hooks/useImageSelection.ts`

```typescript
import { useState, useCallback } from 'react';
import type { BlogPost } from '../types';

export function useImageSelection(filteredPosts: BlogPost[]) {
  const [gridSelection, setGridSelection] = useState<Set<string>>(new Set());
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null);

  const selectAll = useCallback(() => {
    const allIds = new Set(filteredPosts.map(p => p.id));
    setGridSelection(allIds);
  }, [filteredPosts]);

  const selectNone = useCallback(() => {
    setGridSelection(new Set());
  }, []);

  const invertSelection = useCallback(() => {
    const newSelection = new Set<string>();
    filteredPosts.forEach(p => {
      if (!gridSelection.has(p.id)) {
        newSelection.add(p.id);
      }
    });
    setGridSelection(newSelection);
  }, [filteredPosts, gridSelection]);

  const toggleSelect = useCallback((id: string) => {
    const newSelection = new Set(gridSelection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setGridSelection(newSelection);
  }, [gridSelection]);

  const handleGridClick = useCallback((post: BlogPost, index: number, e: React.MouseEvent) => {
    if (rangeMode) {
      e.stopPropagation();
      if (rangeStart === null) {
        setRangeStart(index);
      } else {
        // Complete range
        const start = Math.min(rangeStart, index);
        const end = Math.max(rangeStart, index);
        const newSelection = new Set(gridSelection);
        
        for (let i = start; i <= end; i++) {
          if (filteredPosts[i]) {
            newSelection.add(filteredPosts[i].id);
          }
        }
        
        setGridSelection(newSelection);
        setRangeStart(null);
        setRangeMode(false);
      }
      return;
    }
    
    // Default: open viewer (handled by parent)
  }, [rangeMode, rangeStart, gridSelection, filteredPosts]);

  const toggleRangeMode = useCallback(() => {
    setRangeMode(!rangeMode);
    setRangeStart(null);
  }, [rangeMode]);

  return {
    gridSelection,
    rangeMode,
    rangeStart,
    selectAll,
    selectNone,
    invertSelection,
    toggleSelect,
    handleGridClick,
    toggleRangeMode
  };
}
```

**Usage in Blog.tsx**:
```typescript
// Before: 120+ lines
const [gridSelection, setGridSelection] = useState<Set<string>>(new Set());
const [rangeMode, setRangeMode] = useState(false);
// ... lots of logic

// After: 2 lines
const { gridSelection, rangeMode, selectAll, selectNone, handleGridClick } 
  = useImageSelection(filteredPosts);
```

---

## Phase 5: Extract Download Operations (High Risk - 4 hours)

### Step 5.1: Download Operations Hook
**File**: `src/features/blog/hooks/useDownloadOperations.ts`

```typescript
import { useState, useCallback, useRef, useEffect } from 'react';
import type { BlogPost, DownloadOptions, DownloadProgress } from '../types';
import { getImageFilename, type ImageMetadata } from '@/utils/imageDownload';
import { useAtom } from 'jotai';
import { filenamePatternAtom, includeIndexInFilenameAtom } from '@/store/preferences';

export function useDownloadOperations(
  username: string,
  contentMode: 'posts' | 'likes',
  filteredPosts: BlogPost[],
  hasMore: boolean,
  loadMultiple: (count: number) => Promise<void>
) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);
  
  // Smart Download state
  const [smartDownloadCount, setSmartDownloadCount] = useState(100);
  const [smartDownloadSkipExisting, setSmartDownloadSkipExisting] = useState(true);
  const [smartDownloadDirHandle, setSmartDownloadDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [downloadOffset, setDownloadOffset] = useState(0);
  
  // Refs for async access
  const filteredPostsRef = useRef<BlogPost[]>([]);
  const hasMoreRef = useRef(false);
  
  const [filenamePattern] = useAtom(filenamePatternAtom);
  const [includeIndex] = useAtom(includeIndexInFilenameAtom);

  useEffect(() => {
    filteredPostsRef.current = filteredPosts;
    hasMoreRef.current = hasMore;
  }, [filteredPosts, hasMore]);

  const downloadPostsToFolder = useCallback(async (
    posts: BlogPost[],
    folderName: string,
    options: DownloadOptions = {}
  ) => {
    // ... existing implementation ...
  }, [username, filenamePattern, includeIndex]);

  const handleDownload = useCallback(async (selectedPosts: BlogPost[]) => {
    if (selectedPosts.length === 0) return;
    const folderName = contentMode === 'likes' ? `${username}-liked` : username;
    await downloadPostsToFolder(selectedPosts, folderName, { skipConfirmation: false });
  }, [contentMode, username, downloadPostsToFolder]);

  const handleDownloadAll = useCallback(async () => {
    const folderName = contentMode === 'likes' ? `${username}-liked` : username;
    await downloadPostsToFolder(filteredPosts, folderName, { skipConfirmation: false });
  }, [contentMode, username, filteredPosts, downloadPostsToFolder]);

  const handleSmartDownload = useCallback(async () => {
    // ... existing implementation ...
  }, [/* deps */]);

  const handleDownloadRest = useCallback(async () => {
    // ... existing implementation ...
  }, [/* deps */]);

  return {
    // State
    isDownloading,
    downloadProgress,
    smartDownloadCount,
    smartDownloadSkipExisting,
    downloadOffset,
    
    // Actions
    setSmartDownloadCount,
    setSmartDownloadSkipExisting,
    handleDownload,
    handleDownloadAll,
    handleSmartDownload,
    handleDownloadRest
  };
}
```

**Usage in Blog.tsx**:
```typescript
// Before: 400+ lines of download logic
const [isDownloading, setIsDownloading] = useState(false);
// ... 300+ more lines

// After: 3 lines
const { isDownloading, downloadProgress, handleDownload, handleSmartDownload } 
  = useDownloadOperations(username, contentMode, filteredPosts, hasMore, loadMultiple);
```

---

## Phase 6: Extract Storage Operations (High Risk - 3 hours)

### Step 6.1: Storage Operations Hook
**File**: `src/features/blog/hooks/useStorageOperations.ts`

```typescript
import { useState, useCallback } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { userAtom } from '@/store/auth';
import { startOperationAtom, updateOperationProgressAtom, endOperationAtom } from '@/store/operations';
import type { BlogPost, ImageFiltersState } from '../types';
import { getApiUrl } from '../utils/imageHelpers';

export function useStorageOperations(
  username: string,
  filteredPosts: BlogPost[],
  allPosts: BlogPost[],
  imageFilters: ImageFiltersState,
  loadAll: () => Promise<BlogPost[]>
) {
  const [user] = useAtom(userAtom);
  const [isStoring, setIsStoring] = useState(false);
  
  const startOperation = useSetAtom(startOperationAtom);
  const updateOperationProgress = useSetAtom(updateOperationProgressAtom);
  const endOperation = useSetAtom(endOperationAtom);

  const handleStore = useCallback(async (selectedPosts: BlogPost[]) => {
    if (selectedPosts.length === 0 || !user?.id) return;
    
    setIsStoring(true);
    try {
      const imagesToStore = selectedPosts.map(post => ({
        postId: post.id,
        blogName: username,
        url: post.images![0],
        width: post.imageWidth || null,
        height: post.imageHeight || null,
        tags: post.tags,
        timestamp: post.timestamp,
        description: post.content,
        notes: post.notes,
        notesData: post.notesData || null
      }));

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/stored-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          images: imagesToStore
        })
      });

      if (!response.ok) throw new Error('Failed to store images');
      
      const result = await response.json();
      alert(`✅ Stored: ${result.stored}\n⏭️ Skipped: ${result.skipped} (duplicates)`);
    } catch (error) {
      console.error('Store error:', error);
      alert(`❌ Failed to store images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStoring(false);
    }
  }, [user, username]);

  const handleStoreAll = useCallback(async () => {
    // ... existing implementation ...
  }, [/* deps */]);

  const handleStoreEntireBlog = useCallback(async () => {
    // ... existing implementation ...
  }, [/* deps */]);

  return {
    isStoring,
    handleStore,
    handleStoreAll,
    handleStoreEntireBlog
  };
}
```

---

## Phase 7: Extract Navigation & Keyboard (Low Risk - 2 hours)

### Step 7.1: Image Navigation Hook
**File**: `src/features/blog/hooks/useImageNavigation.ts`

```typescript
import { useState, useMemo, useCallback } from 'react';
import type { BlogPost } from '../types';

export function useImageNavigation(allPosts: BlogPost[]) {
  const [selectedImage, setSelectedImage] = useState<BlogPost | null>(null);

  const currentIndex = useMemo(() => {
    if (!selectedImage) return -1;
    return allPosts.findIndex(p => p.id === selectedImage.id);
  }, [selectedImage, allPosts]);

  const nextImage = useCallback(() => {
    if (currentIndex < allPosts.length - 1) {
      setSelectedImage(allPosts[currentIndex + 1]);
    }
  }, [currentIndex, allPosts]);

  const previousImage = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedImage(allPosts[currentIndex - 1]);
    }
  }, [currentIndex, allPosts]);

  const jumpToStart = useCallback(() => {
    if (allPosts.length > 0) {
      setSelectedImage(allPosts[0]);
    }
  }, [allPosts]);

  const jumpToEnd = useCallback(() => {
    if (allPosts.length > 0) {
      setSelectedImage(allPosts[allPosts.length - 1]);
    }
  }, [allPosts]);

  return {
    selectedImage,
    setSelectedImage,
    currentIndex,
    nextImage,
    previousImage,
    jumpToStart,
    jumpToEnd
  };
}
```

### Step 7.2: Keyboard Shortcuts Hook
**File**: `src/features/blog/hooks/useKeyboardShortcuts.ts`

```typescript
import { useEffect } from 'react';
import type { ViewMode, ContentMode } from '../types';

interface KeyboardShortcutsConfig {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  focusedIndex: number;
  setFocusedIndex: (index: number) => void;
  filteredPostsCount: number;
  contentMode: ContentMode;
  loadingMore: boolean;
  hasMore: boolean;
  loadMore: () => void;
  loadMultiple: (count: number) => void;
  // ... other handlers
}

export function useKeyboardShortcuts(config: KeyboardShortcutsConfig) {
  useEffect(() => {
    if (config.viewMode !== 'images-only') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const cols = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2;

      switch (e.key) {
        case 'f':
        case 'F':
          e.preventDefault();
          config.setViewMode('all');
          break;
        case '1':
          e.preventDefault();
          if (!config.loadingMore && config.hasMore) {
            config.loadMore();
          }
          break;
        // ... other shortcuts
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [config]);
}
```

---

## Final Blog.tsx Structure (After Refactoring)

```typescript
// src/features/blog/Blog.tsx (~800 lines)

import { /* minimal imports */ } from 'react';
import { /* UI components */ } from '@/components/ui';
import { 
  useBlogData,
  useImageFilters,
  useImageSelection,
  useDownloadOperations,
  useStorageOperations,
  useImageNavigation,
  useKeyboardShortcuts
} from './hooks';

export function Blog() {
  const { username } = useParams({ from: '/blog/$username' });
  
  // Data
  const {
    blogData,
    likedPostsData,
    blogLoading,
    loadingLikes,
    hasMore,
    loadMore,
    loadAll
  } = useBlogData(username);
  
  // Filters
  const { filters, filteredPosts, toggleSize, toggleDate, setSort, clearAllFilters } 
    = useImageFilters(allPhotoPosts);
  
  // Selection
  const { gridSelection, selectAll, selectNone, handleGridClick } 
    = useImageSelection(filteredPosts);
  
  // Downloads
  const { isDownloading, downloadProgress, handleDownload, handleSmartDownload } 
    = useDownloadOperations(username, contentMode, filteredPosts, hasMore, loadMultiple);
  
  // Storage
  const { isStoring, handleStore, handleStoreAll } 
    = useStorageOperations(username, filteredPosts, allPosts, filters, loadAll);
  
  // Navigation
  const { selectedImage, setSelectedImage, nextImage, previousImage } 
    = useImageNavigation(allPhotoPosts);
  
  // Keyboard
  useKeyboardShortcuts({
    viewMode,
    setViewMode,
    // ... config
  });

  // Minimal local state (view preferences, UI toggles)
  const [viewMode, setViewMode] = useState<ViewMode>('all');
  const [contentMode, setContentMode] = useState<ContentMode>('posts');
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [isFilterSticky, setIsFilterSticky] = useState(true);

  // Render (JSX stays mostly the same)
  return (
    <div className="...">
      {/* All existing JSX */}
    </div>
  );
}
```

**Reduction**: 2,409 lines → ~800 lines (67% smaller!)

---

## Testing Strategy

### Unit Tests (New - Per Hook)
```typescript
// hooks/__tests__/useImageFilters.test.ts
describe('useImageFilters', () => {
  it('should filter by size correctly', () => {
    const { result } = renderHook(() => useImageFilters(mockPosts));
    act(() => result.current.toggleSize('small'));
    expect(result.current.filteredPosts).toHaveLength(expectedCount);
  });
});
```

### Integration Tests (Existing - Update)
```typescript
// Blog.test.tsx
describe('Blog Component', () => {
  it('should render with filters applied', () => {
    render(<Blog />);
    // ... existing tests
  });
});
```

---

## Migration Checklist

### Pre-Refactoring
- [x] Commit current working state
- [ ] Create feature branch: `git checkout -b refactor/blog-modularization`
- [ ] Run full test suite to establish baseline
- [ ] Document any existing bugs/issues

### During Refactoring (Per Phase)
- [ ] Extract code to new file
- [ ] Update imports in Blog.tsx
- [ ] Verify TypeScript compiles
- [ ] Run relevant tests
- [ ] Manual testing in browser
- [ ] Commit with descriptive message

### Post-Refactoring
- [ ] Full regression testing
- [ ] Performance comparison (before/after)
- [ ] Update documentation
- [ ] Code review
- [ ] Merge to main

---

## Risk Mitigation

### High-Risk Areas
1. **Download Operations**: Complex state interactions
   - Mitigation: Test each download type separately
   - Rollback plan: Keep old function as fallback

2. **Storage Operations**: Database dependencies
   - Mitigation: Mock API calls in tests
   - Rollback plan: Feature flag for old/new code

3. **Selection Logic**: Range mode edge cases
   - Mitigation: Comprehensive test coverage
   - Rollback plan: Isolated hook, easy to revert

### Low-Risk Areas
- Type extraction
- Pure utility functions
- Navigation logic

---

## Performance Considerations

### Potential Improvements
- ✅ Hook memoization prevents unnecessary re-renders
- ✅ Smaller component = faster reconciliation
- ✅ Tree-shaking becomes possible (dead code elimination)

### Potential Regressions
- ⚠️ Additional function calls (hook overhead)
  - Impact: Negligible (<1ms)
- ⚠️ More object destructuring
  - Impact: Negligible

**Net Result**: Neutral to slight improvement

---

## Estimated Timeline

| Phase | Description | Hours | Risk |
|-------|-------------|-------|------|
| 1 | Types & Utils | 1 | Low |
| 2 | Data Fetching | 2 | Low |
| 3 | Image Filters | 2 | Low |
| 4 | Selection | 3 | Medium |
| 5 | Downloads | 4 | High |
| 6 | Storage | 3 | High |
| 7 | Navigation & Keyboard | 2 | Low |
| 8 | Testing & Cleanup | 2 | - |
| **Total** | | **19 hours** | |

**Recommended Approach**: 
- Phases 1-3: Day 1 (5 hours) - Low risk, high value
- Phases 4-5: Day 2 (7 hours) - Medium/high risk, requires focus
- Phases 6-7: Day 3 (5 hours) - Complete remaining extractions
- Phase 8: Day 4 (2 hours) - Polish and verification

---

## Success Metrics

### Before Refactoring
- Main file: 2,409 lines
- Test coverage: ~40% (estimated)
- Hooks: 1 (useTumblrBlog, external)
- Testable units: 1 (entire component)

### After Refactoring (Target)
- Main file: ~800 lines (67% reduction) ✅
- Test coverage: >80% ✅
- Hooks: 8 (modular, reusable) ✅
- Testable units: 15+ (component + hooks + utils) ✅

---

## Recommendation

**Proceed with refactoring using phased approach:**

1. **Start small**: Phases 1-3 (types, utils, filters) - 5 hours, low risk
2. **Validate early**: Test after each phase before proceeding
3. **High-risk last**: Save download/storage for when confident with process
4. **Maintain parallel**: Keep old code commented until verification complete

**Alternative**: Would you like me to execute Phase 1 as a proof-of-concept to demonstrate the value before committing to full refactoring?

---

**Prepared By**: AI Assistant  
**Review Status**: Awaiting approval  
**Next Step**: [Response needed - Proceed? Modify? POC first?]
