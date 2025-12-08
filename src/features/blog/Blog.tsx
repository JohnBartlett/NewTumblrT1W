import { useParams, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Card, Button, ImageViewer, NotesPanel, MetadataPanel, VersionBadge, SelectionToolbar, ImageFilters, type ImageFiltersState } from '@/components/ui';
import { startOperationAtom, updateOperationProgressAtom, endOperationAtom } from '@/store/operations';
import type { Note } from '@/components/ui/NotesPanel';
import { downloadImagesServerSide, canShareFiles, getImageFilename, type ImageMetadata } from '@/utils/imageDownload';
import { filenamePatternAtom, includeIndexInFilenameAtom, includeSidecarMetadataAtom, downloadMethodAtom, gridColumnsAtom, gridImageSizeAtom } from '@/store/preferences';
import { userAtom } from '@/store/auth';
import { useTumblrBlog } from '@/hooks/useTumblrBlog';
// import { getTumblrConnectionStatus } from '@/services/api';
// import { trackBlogVisit } from '@/utils/blogHistory';
import { getStoredDirectoryHandle } from '@/utils/downloadDirectory';

// Dynamic API URL based on current host
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};
const API_URL = getApiUrl();

interface BlogPost {
  id: string;
  type: 'text' | 'photo' | 'quote' | 'link';
  content: string;
  timestamp: number;
  notes: number;
  notesData?: any[]; // Real notes data from Tumblr API
  tags: string[];
  images?: string[];
  imageWidth?: number;
  imageHeight?: number;
}

// Helper function to get image resolution category
function getImageResolution(width: number, height: number): string {
  // Map actual dimensions to size categories
  // Test images are: 800Ã—600 (small), 1000Ã—800 (medium), 1200Ã—900 (large)
  if (width === 800 && height === 600) {
    return 'small';
  } else if (width === 1000 && height === 800) {
    return 'medium';
  } else if (width === 1200 && height === 900) {
    return 'large';
  } else {
    return 'medium'; // default
  }
}

export function Blog() {
  const { username } = useParams({ from: '/blog/$username' });
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const startOperation = useSetAtom(startOperationAtom);
  const updateOperationProgress = useSetAtom(updateOperationProgressAtom);
  const endOperation = useSetAtom(endOperationAtom);
  const [viewMode, setViewMode] = useState<'all' | 'images-only'>('all');
  const [contentMode, setContentMode] = useState<'posts' | 'likes'>('posts'); // Track if viewing posts or liked posts
  const [likedPostsData, setLikedPostsData] = useState<BlogPost[]>([]); // Store liked posts
  const [loadingLikes, setLoadingLikes] = useState(false);
  const [loadingMoreLikes, setLoadingMoreLikes] = useState(false);
  const [likesError, setLikesError] = useState<string | null>(null);
  const [likesOffset, setLikesOffset] = useState(0); // Current offset for liked posts pagination
  const [likesHasMore, setLikesHasMore] = useState(false); // Whether there are more liked posts
  const [likesTotalCount, setLikesTotalCount] = useState<number | null>(null); // Total liked posts count
  const [likesNextTimestamp, setLikesNextTimestamp] = useState<number | undefined>(undefined); // For timestamp pagination beyond 1000
  const [filenamePattern] = useAtom(filenamePatternAtom);
  const [includeIndex] = useAtom(includeIndexInFilenameAtom);
  const [includeSidecarMetadata] = useAtom(includeSidecarMetadataAtom);
  const [downloadMethod] = useAtom(downloadMethodAtom);
  const [gridColumns] = useAtom(gridColumnsAtom);
  const [gridImageSize] = useAtom(gridImageSizeAtom);
  const [selectedImage, setSelectedImage] = useState<BlogPost | null>(null);
  const [selectedPostForNotes, setSelectedPostForNotes] = useState<BlogPost | null>(null);
  const [notesFilter, setNotesFilter] = useState<'all' | 'comments' | 'likes' | 'reblogs'>('all');
  const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

  const [isFollowing, setIsFollowing] = useState(false);
  const [gridSelection, setGridSelection] = useState<Set<string>>(new Set());
  const [lastSelectedIndex, setLastSelectedIndex] = useState<number | null>(null);
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const [isFilterSticky, setIsFilterSticky] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const [imageFilters, setImageFilters] = useState<ImageFiltersState>({
    sizes: new Set<string>(),
    dates: new Set<string>(),
    sort: 'recent',
  });
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<{ current: number; total: number } | null>(null);
  const [isStoring, setIsStoring] = useState(false);

  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataForImage, setMetadataForImage] = useState<BlogPost | null>(null);
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  const {
    blogData,
    loading: blogLoading,
    loadingMore,
    error: apiError,
    hasMore,
    loadMore,
    loadAll,
    loadMultiple,
    usingMockData
  } = useTumblrBlog(username);

  // Fetch liked posts (improved version with target image count)
  const fetchLikedPosts = async (targetImageCount: number = 50, reset: boolean = false) => {
    if (loadingLikes || loadingMoreLikes) return;

    const isInitial = reset || likedPostsData.length === 0;
    if (isInitial) {
      setLoadingLikes(true);
    } else {
      setLoadingMoreLikes(true);
    }
    setLikesError(null);

    try {
      const apiUrl = getApiUrl();
      let currentOffset = reset ? 0 : likesOffset;
      let currentTimestamp = reset ? undefined : likesNextTimestamp;
      let allTransformedPosts: BlogPost[] = reset ? [] : [...likedPostsData];
      let totalLikes = 0;
      let hasMore = true;
      const batchSize = 20; // Fetch 20 posts at a time
      const maxBatches = 50; // Safety limit - allow up to 1000 posts to find images
      let batchCount = 0;

      // Keep fetching until we have enough images or run out of posts
      while (hasMore && batchCount < maxBatches) {
        // Build URL with timestamp-based pagination only (no offset to avoid duplicates)
        const timestampParam = currentTimestamp ? `&before=${currentTimestamp}` : '';
        const response = await fetch(`${apiUrl}/api/tumblr/blog/${username}/likes?limit=${batchSize}${timestampParam}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch likes: ${response.statusText}`);
        }

        const data = await response.json();
        const rawLikedPosts = data.response?.liked_posts || [];
        totalLikes = data.response?.liked_count || 0;

        // No more posts available
        if (rawLikedPosts.length === 0) {
          hasMore = false;
          break;
        }

        // Transform this batch
        const transformedBatch = rawLikedPosts.map((post: any): BlogPost => {
          const images = post.photos?.map((photo: any) => photo.original_size?.url).filter(Boolean) || [];

          return {
            id: String(post.id),
            type: post.type || 'photo',
            content: post.summary || post.caption || post.body || '',
            timestamp: (post.liked_timestamp || post.timestamp || 0) * 1000,
            notes: post.note_count || 0,
            notesData: post.notes || [],
            tags: post.tags || [],
            images: images,
            imageWidth: post.photos?.[0]?.original_size?.width,
            imageHeight: post.photos?.[0]?.original_size?.height,
          };
        });

        // Add to accumulated posts (avoid duplicates)
        const existingIds = new Set(allTransformedPosts.map(p => p.id));
        const newPosts = transformedBatch.filter(p => !existingIds.has(p.id));
        allTransformedPosts = [...allTransformedPosts, ...newPosts];

        // Update offset for state tracking (even though we don't use it for pagination)
        currentOffset += newPosts.length;

        // Update pagination timestamp for next batch
        if (data.response?._links?.next?.query_params?.before) {
          currentTimestamp = data.response._links.next.query_params.before;
        } else if (rawLikedPosts.length > 0) {
          // Fallback: use the timestamp of the last post
          const lastPost = rawLikedPosts[rawLikedPosts.length - 1];
          currentTimestamp = lastPost.liked_timestamp || lastPost.timestamp;
        }

        // Continue if we got posts AND haven't reached our target yet
        batchCount++;

        const currentImageCount = allTransformedPosts.filter(p => p.images && p.images.length > 0).length;
        const batchHasImages = newPosts.filter((p: BlogPost) => p.images?.length).length;

        // Keep going if we got NEW posts and need more images
        hasMore = newPosts.length > 0 && currentImageCount < targetImageCount;

        console.log(`[Blog] Batch ${batchCount}: Got ${rawLikedPosts.length} posts (${newPosts.length} new), ${batchHasImages} with images. Total: ${allTransformedPosts.length} posts, ${currentImageCount} images. Need ${Math.max(0, targetImageCount - currentImageCount)} more images. hasMore=${hasMore}`);
      }

      // Update state with all accumulated posts
      setLikedPostsData(allTransformedPosts);
      setLikesOffset(currentOffset);
      setLikesTotalCount(totalLikes);
      setLikesHasMore(hasMore);
      if (currentTimestamp) {
        setLikesNextTimestamp(currentTimestamp);
      }

      const finalImageCount = allTransformedPosts.filter(p => p.images && p.images.length > 0).length;
      console.log(`[Blog] Finished fetching likes: ${allTransformedPosts.length} posts total, ${finalImageCount} with images`);

    } catch (err) {
      console.error('Error fetching likes:', err);
      setLikesError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoadingLikes(false);
      setLoadingMoreLikes(false);
    }
  };

  const loadMoreLikes = () => {
    fetchLikedPosts(50, false); // Fetch 50 more images
  };

  const loadMultipleLikes = (imageCount: number) => {
    fetchLikedPosts(imageCount, false);
  };

  // Range selection mode for mobile
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null);

  // Smart Download State
  const [smartDownloadCount, setSmartDownloadCount] = useState<number>(100);
  const [smartDownloadSkipExisting, setSmartDownloadSkipExisting] = useState<boolean>(true);
  const [smartDownloadDirHandle, setSmartDownloadDirHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [downloadOffset, setDownloadOffset] = useState<number>(0);

  // All photo posts (from blog or likes)
  const allPhotoPosts = useMemo(() => {
    const posts = contentMode === 'likes' ? likedPostsData : (blogData?.posts || []);
    return posts.filter(post => post.type === 'photo' || (post.images && post.images.length > 0));
  }, [contentMode, likedPostsData, blogData]);

  // Filter and sort photo posts
  const filteredAndSortedPhotoPosts = useMemo(() => {
    let posts = allPhotoPosts;

    // Filter by size
    if (imageFilters.sizes.size > 0) {
      posts = posts.filter(post => {
        if (!post.imageWidth || !post.imageHeight) return true;

        // Map actual dimensions to size categories
        let postSize: string;
        if (post.imageWidth === 800 && post.imageHeight === 600) {
          postSize = 'small';
        } else if (post.imageWidth === 1000 && post.imageHeight === 800) {
          postSize = 'medium';
        } else if (post.imageWidth === 1200 && post.imageHeight === 900) {
          postSize = 'large';
        } else {
          postSize = 'medium'; // default
        }

        return imageFilters.sizes.has(postSize);
      });
    }

    // Filter by date
    if (imageFilters.dates.size > 0) {
      const now = Date.now();
      const day = 24 * 60 * 60 * 1000;
      posts = posts.filter(post => {
        const diff = now - post.timestamp;
        for (const dateFilter of imageFilters.dates) {
          if (dateFilter === 'today' && diff < day) return true;
          if (dateFilter === 'week' && diff < 7 * day) return true;
          if (dateFilter === 'month' && diff < 30 * day) return true;
          if (dateFilter === 'year' && diff < 365 * day) return true;
        }
        return false;
      });
    }

    // Sort
    return [...posts].sort((a, b) => {
      if (imageFilters.sort === 'recent') return b.timestamp - a.timestamp;
      if (imageFilters.sort === 'oldest') return a.timestamp - b.timestamp;
      if (imageFilters.sort === 'popular') return b.notes - a.notes;
      return 0;
    });
  }, [allPhotoPosts, imageFilters]);

  // Filter posts for display
  const displayedPosts = useMemo(() => {
    const posts = contentMode === 'likes' ? likedPostsData : (blogData?.posts || []);
    if (viewMode === 'images-only') {
      return posts.filter(post => post.type === 'photo' || (post.images && post.images.length > 0));
    }
    return posts;
  }, [contentMode, likedPostsData, blogData, viewMode]);

  // Refs for accessing latest state in async loops
  const filteredPostsRef = useRef<BlogPost[]>([]);
  const hasMoreRef = useRef(false);

  // Update refs for async access
  useEffect(() => {
    filteredPostsRef.current = filteredAndSortedPhotoPosts;
    hasMoreRef.current = contentMode === 'likes' ? likesHasMore : hasMore;
  }, [filteredAndSortedPhotoPosts, hasMore, likesHasMore, contentMode]);

  // Helper to download posts to a folder
  const downloadPostsToFolder = async (
    posts: BlogPost[],
    folderName: string,
    options: {
      preSelectedHandle?: FileSystemDirectoryHandle | null;
      skipConfirmation?: boolean;
      skipExisting?: boolean;
    } = {}
  ) => {
    const { preSelectedHandle, skipConfirmation, skipExisting } = options;
    if (posts.length === 0) return null;

    // 1. Prepare images
    const imagesToDownload = posts.map((post, index) => {
      const metadata: ImageMetadata = {
        blogName: username,
        blogUrl: `https://tumblr.com/${username}`,
        tags: post.tags,
        notes: post.notes,
        timestamp: post.timestamp,
        description: post.content,
        postUrl: `https://tumblr.com/${username}/post/${post.id}`,
        imageText: post.content,
      };

      return {
        url: post.images![0],
        filename: getImageFilename(post.images![0], index),
        metadata,
        options: {
          pattern: filenamePattern,
          includeIndex: includeIndex,
        },
      };
    });

    if (!skipConfirmation && !window.confirm(`Download ${imagesToDownload.length} images?`)) return null;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: imagesToDownload.length });

    let succeeded = 0;
    let failed = 0;

    try {
      const { downloadToSubdirectory, isFileSystemAccessSupported } = await import('@/utils/downloadDirectory');

      let parentHandle = preSelectedHandle;
      if (!parentHandle && isFileSystemAccessSupported()) {
        try {
          parentHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
        } catch (e) {
          return null;
        }
      }

      if (parentHandle) {
        // Create blobs and save
        for (let i = 0; i < imagesToDownload.length; i++) {
          const img = imagesToDownload[i];
          try {
            // Check existing if requested
            if (skipExisting) {
              try {
                // Try to get handle to check existence
                // Note: This is a bit hacky, we try to get the file from the subdir
                // We need to get the subdir handle first
                const subdir = await parentHandle.getDirectoryHandle(folderName);
                await subdir.getFileHandle(img.filename);
                // If successful, file exists
                succeeded++;
                continue;
              } catch (e) {
                // File doesn't exist or subdir doesn't exist, proceed
              }
            }

            const response = await fetch(img.url);
            const blob = await response.blob();
            await downloadToSubdirectory(parentHandle, folderName, blob, img.filename);
            succeeded++;
          } catch (e) {
            failed++;
          }
          setDownloadProgress({ current: i + 1, total: imagesToDownload.length });
        }
      } else {
        // Fallback
        const { downloadImages } = await import('@/utils/imageDownload');
        const result = await downloadImages(imagesToDownload, (c, t) => setDownloadProgress({ current: c, total: t }));
        succeeded = result.succeeded;
        failed = result.failed;
      }

      return { succeeded, failed };

    } catch (error) {
      console.error('Download error:', error);
      alert('Download failed');
      return null;
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
    }
  };

  // Smart Download - Download a batch of images
  const handleSmartDownload = async () => {
    if (isDownloading) return;

    const isLikesMode = contentMode === 'likes';
    const { isFileSystemAccessSupported, getStoredDirectoryHandle } = await import('@/utils/downloadDirectory');

    // 1. Get directory handle if needed
    let dirHandle = smartDownloadDirHandle;
    if (!dirHandle && isFileSystemAccessSupported()) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: await getStoredDirectoryHandle() || undefined
        });
        if (dirHandle) {
          setSmartDownloadDirHandle(dirHandle);
        }
      } catch (err) {
        console.error('Failed to get directory handle:', err);
        return; // User cancelled or error
      }
    }

    setIsDownloading(true);
    const folderName = isLikesMode ? `${username}-liked` : username;

    try {
      const start = downloadOffset;
      const end = start + smartDownloadCount;

      // Check if we need to load more
      if (end > filteredAndSortedPhotoPosts.length && (isLikesMode ? likesHasMore : hasMore)) {
        const needed = end - filteredAndSortedPhotoPosts.length;
        if (isLikesMode) {
          await loadMultipleLikes(needed + 20);
        } else {
          await loadMultiple(needed + 20);
        }
        // Wait a bit for state to update
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      const batch = filteredAndSortedPhotoPosts.slice(start, end);

      if (batch.length === 0) {
        alert('No images to download');
        return;
      }

      const result = await downloadPostsToFolder(batch, folderName, {
        preSelectedHandle: dirHandle,
        skipConfirmation: true,
        skipExisting: smartDownloadSkipExisting
      });

      if (result) {
        setDownloadOffset(prev => prev + batch.length);
      }

    } catch (error) {
      console.error('Smart Download error:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };

  // Download Rest - iteratively download batches until done
  const handleDownloadRest = async () => {
    if (isDownloading) return;

    const isLikesMode = contentMode === 'likes';
    const { isFileSystemAccessSupported, getStoredDirectoryHandle } = await import('@/utils/downloadDirectory');

    // Ensure we have a directory handle first
    let dirHandle = smartDownloadDirHandle;
    if (!dirHandle && isFileSystemAccessSupported()) {
      try {
        dirHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite',
          startIn: await getStoredDirectoryHandle() || undefined
        });
        if (dirHandle) {
          setSmartDownloadDirHandle(dirHandle);
        } else {
          return;
        }
      } catch (err) {
        return;
      }
    }

    setIsDownloading(true);
    const folderName = isLikesMode ? `${username}-liked` : username;

    try {
      let keepGoing = true;
      let localOffset = downloadOffset;

      while (keepGoing) {
        // 1. Check if we need to load more posts
        const neededTotal = localOffset + smartDownloadCount;
        const currentTotal = filteredPostsRef.current.length;

        if (currentTotal < neededTotal && hasMoreRef.current) {
          console.log(`[Blog] Loading more posts for batch (Need ${neededTotal}, Have ${currentTotal})...`);
          if (isLikesMode) {
            await loadMultipleLikes(smartDownloadCount * 2);
          } else {
            await loadMultiple(smartDownloadCount * 2);
          }
          // Wait for state to update and ref to refresh
          await new Promise(resolve => setTimeout(resolve, 2000));
        }

        // 2. Get the batch
        const postsToDownload = filteredPostsRef.current.slice(localOffset, localOffset + smartDownloadCount);

        if (postsToDownload.length === 0) {
          if (!hasMoreRef.current) {
            keepGoing = false;
          } else {
            // Should not happen if load worked, but break to avoid infinite loop
            keepGoing = false;
          }
          continue;
        }

        // 3. Download batch
        await downloadPostsToFolder(postsToDownload, folderName, {
          preSelectedHandle: dirHandle,
          skipConfirmation: true,
          skipExisting: smartDownloadSkipExisting
        });

        // 4. Update offset
        localOffset += postsToDownload.length;
        setDownloadOffset(localOffset);

        // 5. Check if we reached the end
        if (postsToDownload.length < smartDownloadCount && !hasMoreRef.current) {
          keepGoing = false;
        }

        // Pause between batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error) {
      console.error('Download Rest error:', error);
      alert(`Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsDownloading(false);
    }
  };



  // Download handlers
  const handleDownload = async () => {
    if (gridSelection.size === 0) return;
    const isLikesMode = contentMode === 'likes';
    const folderName = isLikesMode ? `${username}-liked` : username;
    const selectedPosts = filteredAndSortedPhotoPosts.filter(p => gridSelection.has(p.id));
    await downloadPostsToFolder(selectedPosts, folderName, { skipConfirmation: false });
  };

  const handleDownloadAll = async () => {
    const isLikesMode = contentMode === 'likes';
    const folderName = isLikesMode ? `${username}-liked` : username;
    await downloadPostsToFolder(filteredAndSortedPhotoPosts, folderName, { skipConfirmation: false });
  };

  // Selection handlers
  const handleSelectAll = () => {
    const allIds = new Set(filteredAndSortedPhotoPosts.map(p => p.id));
    setGridSelection(allIds);
  };

  const handleSelectNone = () => {
    setGridSelection(new Set());
  };

  const handleInvertSelection = () => {
    const newSelection = new Set<string>();
    filteredAndSortedPhotoPosts.forEach(p => {
      if (!gridSelection.has(p.id)) {
        newSelection.add(p.id);
      }
    });
    setGridSelection(newSelection);
  };

  const handleShare = async () => {
    if (gridSelection.size === 0) return;
    const selectedPosts = filteredAndSortedPhotoPosts.filter(p => gridSelection.has(p.id));
    const urls = selectedPosts.map(p => p.images?.[0]).filter(Boolean) as string[];
    const { shareImages } = await import('@/utils/imageDownload');
    await shareImages(urls);
  };

  // Image navigation
  const currentImageIndex = useMemo(() => {
    if (!selectedImage) return -1;
    return allPhotoPosts.findIndex(p => p.id === selectedImage.id);
  }, [selectedImage, allPhotoPosts]);

  const handleNextImage = () => {
    if (currentImageIndex < allPhotoPosts.length - 1) {
      setSelectedImage(allPhotoPosts[currentImageIndex + 1]);
    }
  };

  const handlePreviousImage = () => {
    if (currentImageIndex > 0) {
      setSelectedImage(allPhotoPosts[currentImageIndex - 1]);
    }
  };

  const handleJumpToEnd = () => {
    if (allPhotoPosts.length > 0) {
      setSelectedImage(allPhotoPosts[allPhotoPosts.length - 1]);
    }
  };

  const handleJumpToStart = () => {
    if (allPhotoPosts.length > 0) {
      setSelectedImage(allPhotoPosts[0]);
    }
  };

  const toggleSelectImage = (id: string) => {
    const newSelection = new Set(gridSelection);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setGridSelection(newSelection);
  };

  const handleGridImageClick = (post: BlogPost, index: number, e: React.MouseEvent) => {
    // If we are in range mode, handle range selection
    if (rangeMode) {
      e.stopPropagation();
      if (rangeStart === null) {
        setRangeStart(index);
      } else {
        // Complete the range
        const start = Math.min(rangeStart, index);
        const end = Math.max(rangeStart, index);
        const newSelection = new Set(gridSelection);

        // Add all items in range
        for (let i = start; i <= end; i++) {
          if (filteredAndSortedPhotoPosts[i]) {
            newSelection.add(filteredAndSortedPhotoPosts[i].id);
          }
        }

        setGridSelection(newSelection);
        setRangeStart(null);
        setRangeMode(false);
      }
      return;
    }

    // Default behavior: open image viewer
    setSelectedImage(post);
  };







  const handleDelete = () => {
    if (confirm(`Delete ${gridSelection.size} image(s)?`)) {
      alert('Delete functionality coming soon!');
      // Delete functionality will be implemented in a future release
    }
  };

  // Store ALL filtered images to database (loads all posts first if needed)
  const handleStore = async () => {
    if (gridSelection.size === 0 || !user?.id) {
      console.log('Store blocked - gridSelection:', gridSelection.size, 'user:', user?.id);
      return;
    }

    setIsStoring(true);

    try {
      console.log('=== STORE DEBUG START ===');
      console.log('All photo posts count:', allPhotoPosts.length);
      console.log('Grid selection size:', gridSelection.size);
      console.log('Grid selection IDs:', Array.from(gridSelection));

      // Get the selected posts - use allPhotoPosts to include ALL selected images regardless of current filters
      const selectedPosts = allPhotoPosts.filter(post => gridSelection.has(post.id));
      console.log('Selected posts after filter:', selectedPosts.length);
      console.log('Selected post IDs:', selectedPosts.map(p => p.id));

      // Prepare data for storing
      const imagesToStore = selectedPosts.map(post => ({
        postId: post.id,
        blogName: username || 'unknown',
        url: post.images![0],
        width: post.imageWidth || null,
        height: post.imageHeight || null,
        tags: post.tags,
        timestamp: post.timestamp,
        description: post.content,
        notes: post.notes,
        notesData: post.notesData || null, // Include actual notes data
      }));

      console.log('Storing images:', imagesToStore);
      console.log('User ID:', user.id);
      console.log('Selected posts count:', selectedPosts.length);
      console.log('Images to store count:', imagesToStore.length);

      // Call API to store images in database
      const response = await fetch(`${API_URL}/api/stored-images`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          images: imagesToStore,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store images');
      }

      const result = await response.json();

      console.log('Store result:', result);

      const message = [
        `âœ… Stored: ${result.stored}`,
        result.skipped > 0 ? `â­ï¸  Skipped (already stored): ${result.skipped}` : '',
        result.failed > 0 ? `âŒ Failed: ${result.failed}` : '',
        `ðŸ“Š Total selected: ${imagesToStore.length}`
      ].filter(Boolean).join('\n');

      if (result.errors && result.errors.length > 0) {
        console.error('Storage errors:', result.errors);
      }

      alert(message);

      // Clear selection after storing
      setGridSelection(new Set());
    } catch (error) {
      console.error('Store error:', error);
      alert(`âŒ Failed to store images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStoring(false);
    }
  };

  // Store all filtered images to database (for "Store ALL" button)
  const handleStoreAll = async () => {
    if (filteredAndSortedPhotoPosts.length === 0 || !user?.id) return;

    // Confirm if storing a large number of images
    const count = filteredAndSortedPhotoPosts.length;
    if (count > 100) {
      const confirmed = window.confirm(
        `Store ${count} images to database?\n\n` +
        `This will fetch and store notes data for each image, which uses API calls.\n\n` +
        `Continue?`
      );
      if (!confirmed) return;
    }

    setIsStoring(true);
    startOperation({
      type: 'store',
      current: 0,
      total: count,
      source: username,
    });

    try {
      // Prepare data for storing
      const imagesToStore = filteredAndSortedPhotoPosts.map(post => ({
        postId: post.id,
        blogName: username || 'unknown',
        url: post.images![0],
        width: post.imageWidth || null,
        height: post.imageHeight || null,
        tags: post.tags,
        timestamp: post.timestamp,
        description: post.content,
        notes: post.notes,
        notesData: post.notesData || null,
      }));

      const response = await fetch(`${API_URL}/api/stored-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          images: imagesToStore,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store images');
      }

      const result = await response.json();
      updateOperationProgress({ current: count, total: count });
      endOperation();

      alert(`✅ Stored: ${result.stored}\n⏭️ Skipped: ${result.skipped} (duplicates)`);

    } catch (error) {
      console.error('Store all error:', error);
      endOperation();
      alert(`❌ Failed to store images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStoring(false);
    }
  };

  // Store ALL filtered images to database (loads all posts first if needed)
  const handleStoreEntireBlog = async () => {
    if (!blogData || !user?.id) return;

    const initialPostCount = blogData.posts.length;
    let allPosts = blogData.posts;

    // First, check if we need to load more posts
    if (!usingMockData && hasMore) {
      const confirmed = window.confirm(
        `This blog has ${blogData.postCount} total posts, but only ${initialPostCount} are loaded.\n\n` +
        `Load all ${blogData.postCount - initialPostCount} remaining posts and store all images to database?\n\n` +
        `This may take several minutes and will use API calls.`
      );

      if (!confirmed) return;

      console.log('[Blog] Loading all posts before storing...');
      // Load all posts first - loadAll() now returns the complete posts array
      allPosts = await loadAll();
      console.log('[Blog] All posts loaded. Total posts:', allPosts.length);
    }

    // Filter to only photo posts with images, applying the same logic as filteredAndSortedPhotoPosts
    const postsToStore = allPosts
      .filter(post => post.images && post.images.length > 0)
      .filter(post => {
        // Apply size filter if active
        if (imageFilters.sizes.size > 0) {
          const width = post.imageWidth || 0;
          const height = post.imageHeight || 0;
          let postSize: string;
          if (width === 800 && height === 600) postSize = 'small';
          else if (width === 1000 && height === 800) postSize = 'medium';
          else if (width === 1200 && height === 900) postSize = 'large';
          else postSize = 'medium';

          if (!imageFilters.sizes.has(postSize)) return false;
        }
        // Apply date filter if active
        if (imageFilters.dates.size > 0) {
          const now = Date.now();
          const age = now - post.timestamp;
          const oneDay = 86400000;
          for (const dateFilter of imageFilters.dates) {
            if (dateFilter === 'today' && age < oneDay) return true;
            if (dateFilter === 'this-week' && age < oneDay * 7) return true;
            if (dateFilter === 'this-month' && age < oneDay * 30) return true;
          }
          return false;
        }
        return true;
      });

    if (postsToStore.length === 0) {
      alert('No images to store!');
      return;
    }

    // Confirm if storing a large number
    if (postsToStore.length > 100) {
      const confirmed = window.confirm(
        `Store ${postsToStore.length} images to database?\n\n` +
        `This will fetch and store notes data for each image, which uses API calls.\n\n` +
        `Continue?`
      );
      if (!confirmed) return;
    }

    // Now store all images directly
    setIsStoring(true);
    startOperation({
      type: 'store',
      current: 0,
      total: postsToStore.length,
      source: username,
    });

    try {
      const imagesToStore = postsToStore.map(post => ({
        postId: post.id,
        blogName: username || 'unknown',
        url: post.images![0],
        width: post.imageWidth || null,
        height: post.imageHeight || null,
        tags: post.tags,
        timestamp: post.timestamp,
        description: post.content,
        notes: post.notes,
        notesData: post.notesData || null,
      }));

      const response = await fetch(`${API_URL}/api/stored-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          images: imagesToStore,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to store images');
      }

      const result = await response.json();
      updateOperationProgress({ current: postsToStore.length, total: postsToStore.length });
      endOperation();

      alert(`✅ Stored: ${result.stored}\n⏭️ Skipped: ${result.skipped} (duplicates)`);
    } catch (error) {
      console.error('[Blog] Store all error:', error);
      endOperation();
      alert(`❌ Failed to store images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStoring(false);
    }
  };

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








  // Initialize focused index when entering Images Only mode
  useEffect(() => {
    if (viewMode === 'images-only' && focusedIndex === null && filteredAndSortedPhotoPosts.length > 0) {
      setFocusedIndex(0);
    }
  }, [viewMode, focusedIndex, filteredAndSortedPhotoPosts.length]);

  // Scroll focused element into view
  useEffect(() => {
    if (viewMode !== 'images-only' || focusedIndex === null) return;

    // Find the focused element and scroll it into view
    const focusedElement = document.querySelector(`[data-grid-index="${focusedIndex}"]`);
    if (focusedElement) {
      focusedElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest',
      });
    }
  }, [focusedIndex, viewMode]);

  // Keyboard handler for Full view - 'I' key to switch to Images Only, number keys for loading
  useEffect(() => {
    if (viewMode !== 'all') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setViewMode('images-only');
        return;
      }

      // Number keys for loading more posts/images
      if (contentMode === 'likes') {
        // Liked posts loading
        if (e.key === '1' && !loadingMoreLikes && likesHasMore) {
          e.preventDefault();
          loadMoreLikes();
        } else if (e.key === '2' && !loadingMoreLikes && likesHasMore) {
          e.preventDefault();
          loadMultipleLikes(100);
        } else if (e.key === '3' && !loadingMoreLikes && likesHasMore) {
          e.preventDefault();
          loadMultipleLikes(200);
        } else if (e.key === '4' && !loadingMoreLikes && likesHasMore) {
          e.preventDefault();
          loadMultipleLikes(1000);
        }
      } else {
        // Regular posts loading
        if (e.key === '1' && !loadingMore && hasMore && blogData) {
          e.preventDefault();
          loadMore();
        } else if (e.key === '2' && !loadingMore && hasMore && blogData) {
          e.preventDefault();
          loadMultiple(100);
        } else if (e.key === '3' && !loadingMore && hasMore && blogData) {
          e.preventDefault();
          loadMultiple(200);
        } else if (e.key === '4' && !loadingMore && hasMore && blogData) {
          e.preventDefault();
          loadMultiple(1000);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, contentMode, loadingMore, loadingMoreLikes, hasMore, likesHasMore, blogData, loadMore, loadMultiple, loadMoreLikes, loadMultipleLikes]);

  // Keyboard navigation for grid
  useEffect(() => {
    if (viewMode !== 'images-only' || !gridRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if not typing in an input/textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const photoPosts = filteredAndSortedPhotoPosts;
      const cols = window.innerWidth >= 1024 ? 4 : window.innerWidth >= 768 ? 3 : 2;

      switch (e.key) {
        case '?':
          e.preventDefault();
          // Show keyboard shortcuts help
          setShowShortcutsHelp(true);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          // Switch to Full View
          setViewMode('all');
          break;
        case 'x':
        case 'X':
          e.preventDefault();
          // Show metadata for focused image
          if (photoPosts[focusedIndex]) {
            setMetadataForImage(photoPosts[focusedIndex]);
            setShowMetadata(true);
          }
          break;
        case '5':
          e.preventDefault();
          // Load +50 images
          if (contentMode === 'likes') {
            if (!loadingMoreLikes && likesHasMore) {
              loadMultipleLikes(50);
            }
          } else {
            if (!loadingMore && hasMore && blogData) {
              loadMultiple(50);
            }
          }
          break;
        case '1':
          e.preventDefault();
          // Load +100 images
          if (contentMode === 'likes') {
            if (!loadingMoreLikes && likesHasMore) {
              loadMultipleLikes(100);
            }
          } else {
            if (!loadingMore && hasMore && blogData) {
              loadMultiple(100);
            }
          }
          break;
        case '2':
          e.preventDefault();
          // Load +200 images
          if (contentMode === 'likes') {
            if (!loadingMoreLikes && likesHasMore) {
              loadMultipleLikes(200);
            }
          } else {
            if (!loadingMore && hasMore && blogData) {
              loadMultiple(200);
            }
          }
          break;
        case 't':
        case 'T':
          e.preventDefault();
          // Jump to top (first image)
          setFocusedIndex(0);
          break;
        case 'b':
        case 'B':
          e.preventDefault();
          // Jump to bottom (last image)
          setFocusedIndex(photoPosts.length - 1);
          break;
        case 'Home':
          e.preventDefault();
          setFocusedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setFocusedIndex(photoPosts.length - 1);
          break;
        case 'PageUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(0, prev - cols * 3));
          break;
        case 'PageDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(photoPosts.length - 1, prev + cols * 3));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(0, prev - cols));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(photoPosts.length - 1, prev + cols));
          break;
        case 'ArrowLeft':
          e.preventDefault();
          setFocusedIndex(prev => Math.max(0, prev - 1));
          break;
        case 'ArrowRight':
          e.preventDefault();
          setFocusedIndex(prev => Math.min(photoPosts.length - 1, prev + 1));
          break;
        case 'Enter':
          e.preventDefault();
          if (photoPosts[focusedIndex]) {
            setSelectedImage(photoPosts[focusedIndex]);
          }
          break;
        case ' ':
          e.preventDefault();
          if (photoPosts[focusedIndex]) {
            const newSelection = new Set(gridSelection);
            const id = photoPosts[focusedIndex].id;
            if (newSelection.has(id)) {
              newSelection.delete(id);
            } else {
              newSelection.add(id);
            }
            setGridSelection(newSelection);
          }
          break;
        case 'Escape':
          e.preventDefault();
          // Close shortcuts help if open
          if (showShortcutsHelp) {
            setShowShortcutsHelp(false);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    viewMode,
    focusedIndex,
    filteredAndSortedPhotoPosts,
    gridSelection,
    contentMode,
    loadingMore,
    loadingMoreLikes,
    hasMore,
    likesHasMore,
    blogData,
    loadMultiple,
    loadMultipleLikes,
    showShortcutsHelp
  ]);

  // Generate mock notes for a post
  const generateMockNotes = (post: BlogPost): Note[] => {
    const noteTypes: Array<'comment' | 'like' | 'reblog'> = ['comment', 'like', 'reblog'];
    const usernames = ['artlover', 'photogeek', 'tumblrfan', 'aesthetic', 'wanderlust', 'creative', 'vibes', 'mood'];
    const comments = [
      'This is amazing!',
      'Love this aesthetic ðŸ’•',
      'Wow, beautiful capture',
      'This speaks to me',
      'Obsessed with this',
      'Adding to my collection',
      'Perfect vibes',
    ];

    return Array.from({ length: Math.min(post.notes, 50) }, (_, i) => {
      const type = noteTypes[Math.floor(Math.random() * noteTypes.length)];
      const user = usernames[Math.floor(Math.random() * usernames.length)] + Math.floor(Math.random() * 999);

      return {
        id: `note-${post.id}-${i}`,
        type,
        user: {
          username: user,
          avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user}`,
        },
        timestamp: Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000,
        comment: type === 'comment' ? comments[Math.floor(Math.random() * comments.length)] : undefined,
        reblogComment: type === 'reblog' && Math.random() > 0.5 ? comments[Math.floor(Math.random() * comments.length)] : undefined,
      };
    });
  };

  // Convert notes data from post (available with notes_info=true!)
  const mockNotesForImage = useMemo((): Note[] => {
    if (!selectedImage) return [];

    console.log(`[Blog] Selected image:`, selectedImage.id, `Has notesData?`, !!selectedImage.notesData, `Length:`, selectedImage.notesData?.length);

    // Check if we have real notes data from Tumblr API
    if (selectedImage.notesData && selectedImage.notesData.length > 0) {
      console.log(`[Blog] âœ… Using ${selectedImage.notesData.length} REAL notes for post ${selectedImage.id}`);
      console.log(`[Blog] First note:`, selectedImage.notesData[0]);

      const mappedNotes = selectedImage.notesData.map((note: any, i: number) => {
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

        // Get avatar from note data or fallback to backend proxy
        const normalizedBlog = note.blog_name?.includes('.')
          ? note.blog_name
          : `${note.blog_name}.tumblr.com`;
        const avatarUrl = note.avatar_url?.['64']
          || `${API_URL}/api/tumblr/blog/${normalizedBlog}/avatar/64`;

        return {
          id: `note-${selectedImage.id}-${i}`,
          type: noteType,
          user: {
            username: note.blog_name || 'anonymous',
            avatar: avatarUrl,
          },
          timestamp: note.timestamp * 1000,
          comment: note.reply_text || note.added_text,
          reblogComment: note.reblog_parent_blog_name ? `Reblogged from ${note.reblog_parent_blog_name}` : undefined,
        };
      });

      // Log breakdown of note types
      const breakdown = {
        comments: mappedNotes.filter(n => n.type === 'comment').length,
        likes: mappedNotes.filter(n => n.type === 'like').length,
        reblogs: mappedNotes.filter(n => n.type === 'reblog').length,
      };
      console.log(`[Blog] ðŸ“Š Notes breakdown:`, breakdown);

      return mappedNotes;
    }

    // Fall back to mock notes if no real notes available
    console.log(`[Blog] Using mock notes for post ${selectedImage.id} (no real notes data)`);
    return generateMockNotes(selectedImage);
  }, [selectedImage]);

  // Generate notes for the selected post (use real data if available!)
  const mockNotesForPost = useMemo((): Note[] => {
    if (!selectedPostForNotes) return [];

    console.log(`[Blog] Selected post for notes:`, selectedPostForNotes.id, `Has notesData?`, !!selectedPostForNotes.notesData, `Length:`, selectedPostForNotes.notesData?.length);

    // Check if we have real notes data from Tumblr API
    if (selectedPostForNotes.notesData && selectedPostForNotes.notesData.length > 0) {
      console.log(`[Blog] âœ… Using ${selectedPostForNotes.notesData.length} REAL notes for post ${selectedPostForNotes.id}`);
      return selectedPostForNotes.notesData.map((note: any, i: number) => {
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
          id: `note-${selectedPostForNotes.id}-${i}`,
          type: noteType,
          user: {
            username: note.blog_name || 'anonymous',
            avatar: note.avatar_url?.['64'] || `https://api.dicebear.com/7.x/avataaars/svg?seed=${note.blog_name || 'anon'}`,
          },
          timestamp: note.timestamp * 1000,
          comment: note.reply_text || note.added_text,
          reblogComment: note.reblog_parent_blog_name ? `Reblogged from ${note.reblog_parent_blog_name}` : undefined,
        };
      });
    }

    // Fall back to mock notes if no real notes available
    console.log(`[Blog] Using mock notes for post ${selectedPostForNotes.id} (no real notes data)`);
    return generateMockNotes(selectedPostForNotes);
  }, [selectedPostForNotes]);

  // Handle like toggle
  const handleLike = (postId: string) => {
    setLikedPosts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-4xl px-4 py-8">
        {/* Blog Header - only show if we have blog data or are loading */}
        {(blogData || blogLoading) && (
          <div className="mb-4 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card>
                <div className="flex items-start space-x-3 p-4 sm:space-x-6 sm:p-6">
                  <img
                    src={blogData?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`}
                    alt={blogData?.username || username}
                    className="h-16 w-16 rounded-full bg-gray-200 dark:bg-gray-700 sm:h-24 sm:w-24"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-3xl truncate">
                          {blogData?.displayName || username}
                        </h1>
                        <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-400 sm:mt-1 truncate">@{blogData?.username || username}</p>
                      </div>

                      {/* Follow button */}
                      <Button
                        onClick={() => setIsFollowing(!isFollowing)}
                        variant={isFollowing ? "outline" : "primary"}
                        size="sm"
                        className={`flex-shrink-0 ${isFollowing ? "border-primary-500 text-primary-600 dark:text-primary-400" : ""}`}
                      >
                        <svg className="h-4 w-4 sm:mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          {isFollowing ? (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          )}
                        </svg>
                        <span className="hidden sm:inline">{isFollowing ? 'Following' : 'Follow'}</span>
                      </Button>
                    </div>

                    <p className="mt-2 text-sm text-gray-700 dark:text-gray-300 line-clamp-2 sm:mt-4 sm:text-base sm:line-clamp-none whitespace-pre-line">
                      {blogLoading ? 'Loading...' : (blogData?.description
                        ? blogData.description
                          .replace(/<p>/g, '')
                          .replace(/<\/p>/g, '\n')
                          .replace(/<br\s*\/?>/gi, '\n')
                          .replace(/<[^>]+>/g, '') // Remove any remaining HTML tags
                          .trim()
                        : '\u00A0')}
                    </p>
                    <div className="mt-2 flex space-x-4 text-xs sm:mt-4 sm:space-x-6 sm:text-sm">
                      <button
                        className={`cursor-pointer transition-colors ${contentMode === 'posts'
                          ? 'text-primary-500 dark:text-primary-400 font-semibold'
                          : 'hover:text-primary-500 dark:hover:text-primary-400'
                          }`}
                        onClick={() => {
                          setContentMode('posts');
                          // Scroll to posts section
                          document.querySelector('#posts-section')?.scrollIntoView({ behavior: 'smooth' });
                        }}
                        title="View posts"
                      >
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {blogData?.postCount || 0}
                        </span>
                        <span className="ml-1 text-gray-600 dark:text-gray-400">posts</span>
                      </button>
                      {/* Show likes count if available (public data) */}
                      {blogData?.likesCount !== undefined && (
                        <button
                          className={`cursor-pointer transition-colors ${contentMode === 'likes'
                            ? 'text-primary-500 dark:text-primary-400 font-semibold'
                            : 'hover:text-primary-500 dark:hover:text-primary-400'
                            }`}
                          onClick={() => {
                            setContentMode('likes');
                            // Scroll to posts section
                            document.querySelector('#posts-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          title="View liked posts"
                        >
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {blogData.likesCount.toLocaleString()}
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">likes</span>
                        </button>
                      )}
                      {/* Only show follower/following counts for your own blog */}
                      {blogData?.followerCount !== -1 && (
                        <button
                          className="cursor-pointer transition-colors hover:text-primary-500 dark:hover:text-primary-400"
                          onClick={() => {
                            // Followers modal/page will be implemented in a future release
                            alert(`Followers list for ${username} - Coming soon!`);
                          }}
                          title="View followers"
                        >
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {(blogData?.followerCount || 0).toLocaleString()}
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">followers</span>
                        </button>
                      )}
                      {blogData?.followingCount !== -1 && (
                        <button
                          className="cursor-pointer transition-colors hover:text-primary-500 dark:hover:text-primary-400"
                          onClick={() => {
                            // Following modal/page will be implemented in a future release
                            alert(`Following list for ${username} - Coming soon!`);
                          }}
                          title="View following"
                        >
                          <span className="font-semibold text-gray-900 dark:text-white">
                            {(blogData?.followingCount || 0).toLocaleString()}
                          </span>
                          <span className="ml-1 text-gray-600 dark:text-gray-400">following</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* Error State - Blog Inaccessible */}
        {!blogLoading && apiError && !usingMockData && (
          <div className="mb-4 rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 flex-shrink-0 text-orange-600 dark:text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-orange-800 dark:text-orange-300">
                  Unable to access <span className="font-mono">@{username}</span>
                </p>
                <p className="mt-1 text-xs text-orange-700 dark:text-orange-400">
                  {apiError?.includes('Code: 4012') || apiError?.includes('only viewable within')
                    ? 'This blog is set to "Dashboard Only" and can only be viewed on tumblr.com while logged in.'
                    : apiError?.includes('404') || apiError?.includes('Not Found')
                      ? 'This blog may not exist, has been deleted, or the name is misspelled.'
                      : apiError?.includes('403') || apiError?.includes('Forbidden')
                        ? 'Access to this blog is restricted by the owner.'
                        : apiError?.includes('429') || apiError?.includes('rate limit')
                          ? 'API rate limit exceeded. Please wait a few minutes.'
                          : 'The blog cannot be accessed at this time.'}
                </p>
                {apiError && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-xs text-orange-600 hover:text-orange-700 dark:text-orange-500 dark:hover:text-orange-400">
                      Technical details
                    </summary>
                    <p className="mt-1 text-xs font-mono text-orange-700 dark:text-orange-400">
                      {apiError}
                    </p>
                  </details>
                )}
              </div>
            </div>
          </div>
        )}

        {/* API Status Banner */}
        {usingMockData && (
          <div className="mb-4 rounded-lg border-2 border-yellow-300 bg-yellow-50 p-3 dark:border-yellow-700 dark:bg-yellow-900/20">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-yellow-600 dark:text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                  Using Mock Data
                </p>
                <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-400">
                  Tumblr API unavailable. Showing placeholder images.
                </p>
                {apiError && (
                  <div className="mt-2 rounded-md bg-yellow-100 dark:bg-yellow-900/30 p-2">
                    <p className="text-xs font-mono text-yellow-900 dark:text-yellow-200">
                      <strong>Error:</strong> {apiError}
                    </p>
                  </div>
                )}
                <p className="mt-2 text-xs text-yellow-700 dark:text-yellow-400">
                  {apiError?.includes('401') || apiError?.includes('Unauthorized') ? (
                    <>
                      ðŸ’¡ This usually means the app needs activation.
                      Try clicking "Request rate limit removal" in your Tumblr app settings or wait 10-15 minutes.
                    </>
                  ) : apiError?.includes('404') || apiError?.includes('Not Found') ? (
                    <>
                      ðŸ’¡ This blog may not exist or has been deleted.
                    </>
                  ) : (
                    <>
                      ðŸ’¡ Check the{' '}
                      <a href="/TUMBLR_SETUP.md" target="_blank" className="underline hover:text-yellow-900 dark:hover:text-yellow-200">
                        Setup Guide
                      </a>{' '}
                      for troubleshooting.
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {!usingMockData && !blogLoading && (
          <div className="mb-4 rounded-lg border-2 border-green-300 bg-green-50 p-3 dark:border-green-700 dark:bg-green-900/20">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 flex-shrink-0 text-green-600 dark:text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  âœ¨ Connected to Tumblr API
                </p>
                <p className="mt-1 text-xs text-green-700 dark:text-green-400">
                  Showing real posts from {username}
                </p>
              </div>
            </div>
          </div>
        )}

        {blogLoading && (
          <div className="mb-4 rounded-lg border-2 border-blue-300 bg-blue-50 p-4 dark:border-blue-700 dark:bg-blue-900/20">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent dark:border-blue-400"></div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-300">
                Loading blog from Tumblr...
              </p>
            </div>
          </div>
        )}

        {/* Error State - Blog Not Found */}
        {!blogLoading && apiError && !blogData && (
          <div className="mb-4 rounded-lg border-2 border-red-300 bg-red-50 p-6 dark:border-red-700 dark:bg-red-900/20">
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="mb-2 text-lg font-semibold text-red-800 dark:text-red-300">
                  Blog Not Found
                </h3>
                <p className="mb-1 text-sm text-red-700 dark:text-red-400">
                  {apiError}
                </p>
                <p className="text-xs text-red-600 dark:text-red-500">
                  The blog "@{username}" does not exist on Tumblr or may have been deleted.
                </p>
              </div>
              <button
                onClick={() => navigate({ to: '/search' })}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600"
              >
                Search for another blog
              </button>
            </div>
          </div>
        )}

        {/* Main Content - Only show if blog data is available */}
        {blogData && (
          <>
            {/* View Mode Toggle */}
            <div id="posts-section" className="mb-4 flex items-center justify-between gap-2 sm:mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white sm:text-xl">
                  {contentMode === 'likes' ? 'Liked Posts' : 'Posts'} {viewMode === 'images-only' && <span className="hidden sm:inline">(Images Only)</span>}
                </h2>
                {contentMode === 'likes' && (
                  <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                    Liked
                  </span>
                )}
                {loadingLikes && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Loading...</span>
                )}
                {likesError && (
                  <span className="text-xs text-red-500 dark:text-red-400">{likesError}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  onClick={async (e) => {
                    e.preventDefault();
                    if (window.confirm(`Delete all stored images from @${username} and close this page?`)) {
                      try {
                        if (user?.id) {
                          const response = await fetch(`${API_URL}/api/stored-images/${user.id}/blog/${username}`, {
                            method: 'DELETE',
                          });
                          if (response.ok) {
                            const data = await response.json();
                            console.log(`Deleted ${data.count} images from @${username}`);
                          }
                        }
                        navigate({ to: '/' });
                      } catch (error) {
                        console.error('Error deleting blog images:', error);
                        navigate({ to: '/' });
                      }
                    }
                  }}
                  size="sm"
                  className="flex-shrink-0 active:scale-95 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span className="text-xs sm:text-sm">Close</span>
                  </div>
                </Button>
                <Button
                  variant={viewMode === 'images-only' ? 'primary' : 'outline'}
                  onClick={(e) => {
                    e.preventDefault();
                    setViewMode(viewMode === 'all' ? 'images-only' : 'all');
                  }}
                  onTouchEnd={(e) => {
                    e.preventDefault();
                    setViewMode(viewMode === 'all' ? 'images-only' : 'all');
                  }}
                  size="sm"
                  className="flex-shrink-0 active:scale-95"
                >
                  {viewMode === 'images-only' ? (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                      </svg>
                      <span className="text-xs sm:text-sm">Full View</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs sm:text-sm">Images Only</span>
                    </div>
                  )}
                </Button>
              </div>
            </div>

            {/* Blog Posts */}
            {viewMode === 'images-only' ? (
              /* Images Only Mode - Grid with Selection */
              <div className="space-y-4">
                {/* Selection Toolbar */}
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <SelectionToolbar
                    selectedCount={gridSelection.size}
                    totalCount={filteredAndSortedPhotoPosts.length}
                    onSelectAll={handleSelectAll}
                    onSelectNone={handleSelectNone}
                    onInvertSelection={handleInvertSelection}
                    onShare={handleShare}
                    onDownload={handleDownload}
                    onDownloadToFolder={handleDownload}
                    onStore={handleStore}
                    onDelete={handleDelete}
                    isDownloading={isDownloading}
                    downloadProgress={downloadProgress}
                    canShare={canShareFiles()}
                    isStoring={isStoring}
                    rangeMode={rangeMode}
                    onToggleRangeMode={() => {
                      setRangeMode(!rangeMode);
                      setRangeStart(null);
                    }}
                    rangeStart={rangeStart}
                  />

                  {/* Compact Action Bar */}
                  <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                    {/* Load Section - Show different buttons for posts vs likes */}
                    {contentMode === 'likes' ? (
                      // Load More for Liked Posts - Multiple options like regular posts
                      // Always show buttons (like regular posts), but disable when no more to load
                      <>
                        <Button
                          onClick={loadMoreLikes}
                          disabled={loadingMoreLikes || !likesHasMore}
                          variant="secondary"
                          size="sm"
                        >
                          {loadingMoreLikes ? 'Loading...' : 'Load +50'}
                        </Button>
                        <Button
                          onClick={() => loadMultipleLikes(100)}
                          disabled={loadingMoreLikes || !likesHasMore}
                          variant="secondary"
                          size="sm"
                        >
                          {loadingMoreLikes ? 'Loading...' : 'Load +100'}
                        </Button>
                        <Button
                          onClick={() => loadMultipleLikes(200)}
                          disabled={loadingMoreLikes || !likesHasMore}
                          variant="secondary"
                          size="sm"
                        >
                          {loadingMoreLikes ? 'Loading...' : 'Load +200'}
                        </Button>
                        <Button
                          onClick={() => loadMultipleLikes(1000)}
                          disabled={loadingMoreLikes || !likesHasMore}
                          variant="secondary"
                          size="sm"
                        >
                          {loadingMoreLikes ? 'Loading...' : 'Load +1000'}
                        </Button>
                        <Button
                          onClick={async () => {
                            // Load all remaining images (up to a reasonable limit)
                            // const currentImageCount = likedPostsData.filter(p => p.images && p.images.length > 0).length;
                            // Estimate: if we have 104,950 liked posts, we might have ~50,000 images
                            // But let's set a reasonable limit to avoid overwhelming the browser
                            const maxImages = likesTotalCount ? Math.min(10000, likesTotalCount * 0.5) : 10000; // Estimate 50% have images, max 10k
                            await loadMultipleLikes(maxImages);
                          }}
                          disabled={loadingMoreLikes || !likesHasMore}
                          variant="secondary"
                          size="sm"
                        >
                          {loadingMoreLikes ? 'Loading...' : likesTotalCount ? `Load All (${likesTotalCount.toLocaleString()})` : 'Load All'}
                        </Button>
                        {likesTotalCount && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {likedPostsData.filter(p => p.images && p.images.length > 0).length} images loaded ({likedPostsData.length} posts)
                          </span>
                        )}
                        <div className="hidden h-6 w-px bg-gray-300 dark:bg-gray-600 sm:block" />
                      </>
                    ) : (
                      // Load More for Regular Posts
                      !usingMockData && hasMore && blogData && (
                        <>
                          <Button
                            onClick={loadMore}
                            disabled={loadingMore}
                            variant="secondary"
                            size="sm"
                          >
                            {loadingMore ? 'Loading...' : 'Load +50'}
                          </Button>
                          <Button
                            onClick={() => loadMultiple(100)}
                            disabled={loadingMore || (blogData.postCount - blogData.posts.length) < 50}
                            variant="secondary"
                            size="sm"
                          >
                            {loadingMore ? 'Loading...' : 'Load +100'}
                          </Button>
                          <Button
                            onClick={() => loadMultiple(200)}
                            disabled={loadingMore || (blogData.postCount - blogData.posts.length) < 50}
                            variant="secondary"
                            size="sm"
                          >
                            {loadingMore ? 'Loading...' : 'Load +200'}
                          </Button>
                          <Button
                            onClick={() => loadMultiple(1000)}
                            disabled={loadingMore || (blogData.postCount - blogData.posts.length) < 50}
                            variant="secondary"
                            size="sm"
                          >
                            {loadingMore ? 'Loading...' : 'Load +1000'}
                          </Button>
                          <Button
                            onClick={loadAll}
                            disabled={loadingMore}
                            variant="secondary"
                            size="sm"
                          >
                            {loadingMore ? 'Loading...' : `Load All (${blogData.postCount - blogData.posts.length})`}
                          </Button>
                          <div className="hidden h-6 w-px bg-gray-300 dark:bg-gray-600 sm:block" />
                        </>
                      )
                    )}

                    {/* Download & Store Section */}
                    {filteredAndSortedPhotoPosts.length > 0 && (
                      <>
                        <Button
                          onClick={handleDownload}
                          variant="secondary"
                          size="sm"
                          disabled={isDownloading || (contentMode === 'likes' ? loadingMoreLikes : loadingMore) || gridSelection.size === 0}
                        >
                          Download Selected ({gridSelection.size})
                        </Button>
                        <Button
                          onClick={handleDownload}
                          variant="secondary"
                          size="sm"
                          disabled={isDownloading || (contentMode === 'likes' ? loadingMoreLikes : loadingMore) || gridSelection.size === 0}
                          title="Download Selected to Folder"
                        >
                          Selected to Folder
                        </Button>
                        <Button
                          onClick={() => {
                            const count = filteredAndSortedPhotoPosts.length;
                            if (count > 100 && !window.confirm(`Download ${count} images?\n\nThis may take several minutes.`)) return;
                            handleDownloadAll();
                          }}
                          variant="secondary"
                          size="sm"
                          disabled={isDownloading || (contentMode === 'likes' ? loadingMoreLikes : loadingMore)}
                        >
                          {isDownloading && downloadProgress
                            ? `Downloading... (${downloadProgress.current}/${downloadProgress.total})`
                            : `Download All (${filteredAndSortedPhotoPosts.length})`
                          }
                        </Button>
                        <Button
                          onClick={handleDownloadAll}
                          variant="secondary"
                          size="sm"
                          disabled={isDownloading || (contentMode === 'likes' ? loadingMoreLikes : loadingMore)}
                          title="Download All to Folder"
                        >
                          {isDownloading && downloadProgress
                            ? `Saving... (${downloadProgress.current}/${downloadProgress.total})`
                            : contentMode === 'likes'
                              ? `All to Folder (${likesTotalCount ? likesTotalCount.toLocaleString() : filteredAndSortedPhotoPosts.length})`
                              : `All to Folder${!usingMockData && hasMore && blogData ? ` (${blogData.postCount})` : ` (${filteredAndSortedPhotoPosts.length})`}`
                          }
                        </Button>

                        {user?.id && (
                          <>
                            <div className="hidden h-6 w-px bg-gray-300 dark:bg-gray-600 sm:block" />
                            <Button
                              onClick={handleStore}
                              variant="secondary"
                              size="sm"
                              disabled={isStoring || (contentMode === 'likes' ? loadingMoreLikes : loadingMore) || gridSelection.size === 0}
                            >
                              Store Selected ({gridSelection.size})
                            </Button>
                            <Button
                              onClick={contentMode === 'likes' ? handleStoreAll : handleStoreEntireBlog}
                              variant="secondary"
                              size="sm"
                              disabled={isStoring || (contentMode === 'likes' ? loadingMoreLikes : loadingMore)}
                            >
                              {isStoring
                                ? 'Storing...'
                                : contentMode === 'likes'
                                  ? `Store All (${likesTotalCount ? likesTotalCount.toLocaleString() : filteredAndSortedPhotoPosts.length})`
                                  : !usingMockData && hasMore && blogData
                                    ? `Store All (${blogData.postCount})`
                                    : `Store All (${filteredAndSortedPhotoPosts.length})`
                              }
                            </Button>
                          </>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Smart Download Section */}
                <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-gray-200 bg-white p-2 dark:border-gray-700 dark:bg-gray-800">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Smart Download:</span>
                    <input
                      type="number"
                      value={smartDownloadCount}
                      onChange={(e) => setSmartDownloadCount(parseInt(e.target.value) || 0)}
                      className="w-16 rounded border border-gray-300 px-2 py-1 text-sm dark:border-gray-600 dark:bg-gray-700"
                      placeholder="Count"
                    />
                    <label className="flex items-center gap-1 text-sm text-gray-700 dark:text-gray-300" title="Skip files that already exist in the destination folder">
                      <input
                        type="checkbox"
                        checked={smartDownloadSkipExisting}
                        onChange={(e) => setSmartDownloadSkipExisting(e.target.checked)}
                        className="rounded border-gray-300 dark:border-gray-600"
                      />
                      Skip Existing
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleSmartDownload}
                      variant="primary"
                      size="sm"
                      disabled={isDownloading}
                      title={`Download batch of ${smartDownloadCount} images`}
                    >
                      {isDownloading ? 'Downloading...' : 'Download Batch'}
                    </Button>
                    <Button
                      onClick={handleSmartDownload}
                      variant="secondary"
                      size="sm"
                      disabled={isDownloading}
                      title="Download next batch"
                    >
                      Download Next {smartDownloadCount}
                    </Button>
                    <Button
                      onClick={handleDownloadRest}
                      variant="outline"
                      size="sm"
                      disabled={isDownloading}
                      title="Download all remaining images in batches"
                    >
                      Download Rest
                    </Button>
                    {downloadOffset > 0 && (
                      <span className="text-xs text-gray-500">
                        Offset: {downloadOffset}
                      </span>
                    )}
                  </div>
                </div>

                {/* Filters Bar - Top Position with Sticky Toggle */}
                <div
                  className={`${isFilterSticky
                    ? 'sticky top-32 z-10 bg-white/95 backdrop-blur-sm shadow-md dark:bg-gray-900/95'
                    : 'relative'
                    } rounded-lg border border-gray-200 p-2 transition-all dark:border-gray-800 sm:p-4`}
                >
                  <div className="flex items-start justify-between gap-2 sm:gap-4">
                    <div className="flex-1 min-w-0">
                      <ImageFilters
                        filters={imageFilters}
                        onToggleSize={handleToggleSize}
                        onToggleDate={handleToggleDate}
                        onSetSort={handleSetSort}
                        onClearAll={handleClearAllFilters}
                      />
                    </div>

                    {/* Sticky Toggle Button - Larger for mobile */}
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsFilterSticky(prev => !prev);
                      }}
                      className={`flex-shrink-0 rounded-lg p-2.5 transition-all active:scale-95 sm:p-2 touch-manipulation ${isFilterSticky
                        ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500 dark:bg-primary-900/30 dark:text-primary-400 dark:ring-primary-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700'
                        }`}
                      title={isFilterSticky ? 'Unlock filters (scroll with page)' : 'Lock filters (keep visible)'}
                      aria-label={isFilterSticky ? 'Unlock filters' : 'Lock filters'}
                    >
                      {isFilterSticky ? (
                        // Locked - filters stay at top
                        <svg className="h-5 w-5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      ) : (
                        // Unlocked - filters scroll with page
                        <svg className="h-5 w-5 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                <div ref={gridRef} className="w-full">
                  <div
                    className="grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridColumns}, minmax(0, 1fr))`,
                      gap: gridImageSize === 'compact' ? '0.25rem' : gridImageSize === 'comfortable' ? '0.5rem' : '1rem'
                    }}
                  >
                    {filteredAndSortedPhotoPosts.map((post, index) => {
                      const isSelected = gridSelection.has(post.id);
                      const isFocused = index === focusedIndex;
                      const isRangeStart = rangeMode && rangeStart === index;

                      return (

                        <div
                          key={post.id}
                          data-grid-index={index}
                          className={`group relative aspect-square cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800 ${isFocused ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                            } ${isRangeStart ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                          onClick={(e: React.MouseEvent) => handleGridImageClick(post, index, e)}
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: Math.min(index * 0.01, 0.5) }}
                            style={{ width: '100%', height: '100%' }}
                          >
                            <img
                              src={post.images![0]}
                              alt="Post content"
                              className={`h-full w-full object-cover transition-transform ${isSelected ? 'scale-95' : 'group-hover:scale-105'
                                }`}
                            />

                            {/* Selection overlay */}
                            {
                              isSelected && (
                                <div className="absolute inset-0 bg-primary-500/30 ring-2 ring-inset ring-primary-500" />
                              )
                            }

                            {/* Hover overlay */}
                            <div className={`absolute inset-0 bg-black/0 transition-colors ${!isSelected && 'group-hover:bg-black/20'
                              }`} />

                            {/* Checkbox - Always visible when selected */}
                            <div className={`absolute left-2 top-2 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                              }`}>
                              <div
                                className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded border-2 transition-all hover:scale-110 ${isSelected
                                  ? 'border-primary-500 bg-primary-500 shadow-lg'
                                  : 'border-white bg-white/20 backdrop-blur-sm hover:bg-white/40'
                                  }`}
                                onClick={(e) => {
                                  e.stopPropagation();

                                  // Handle Shift+Click for range selection
                                  if (e.shiftKey && lastSelectedIndex !== null) {
                                    const start = Math.min(lastSelectedIndex, index);
                                    const end = Math.max(lastSelectedIndex, index);
                                    const newSelection = new Set(gridSelection);
                                    for (let i = start; i <= end; i++) {
                                      newSelection.add(filteredAndSortedPhotoPosts[i].id);
                                    }
                                    console.log(`Range select: ${start} to ${end} (${end - start + 1} images) | Total: ${newSelection.size}`);
                                    setGridSelection(newSelection);
                                    setLastSelectedIndex(index);
                                  } else {
                                    // Normal toggle
                                    const newSelection = new Set(gridSelection);
                                    const action = newSelection.has(post.id) ? 'deselect' : 'select';
                                    if (newSelection.has(post.id)) {
                                      newSelection.delete(post.id);
                                    } else {
                                      newSelection.add(post.id);
                                    }
                                    console.log(`Checkbox ${action}:`, post.id, '| New selection size:', newSelection.size);
                                    setGridSelection(newSelection);
                                    setLastSelectedIndex(index);
                                  }
                                }}
                              >
                                {isSelected && (
                                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                              </div>
                            </div>

                            {/* Range start indicator */}
                            {
                              isRangeStart && (
                                <div className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-lg">
                                  START
                                </div>
                              )
                            }

                            {/* Info on hover */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                              <p className="text-xs text-white">{post.notes.toLocaleString()} notes</p>
                            </div>
                          </motion.div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Empty state */}
                  {
                    filteredAndSortedPhotoPosts.length === 0 && (
                      <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 py-12 dark:border-gray-700">
                        <svg className="mb-3 h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {blogData.posts.length === 0
                            ? 'No posts available'
                            : 'No images match your filters'}
                        </p>
                        {blogData.posts.length > 0 && (
                          <button
                            onClick={handleClearAllFilters}
                            className="mt-2 text-sm text-primary-600 hover:underline dark:text-primary-400"
                          >
                            Clear filters
                          </button>
                        )}
                      </div>
                    )
                  }
                </div>
              </div>
            ) : (
              /* All Posts Mode - Card View */
              <div className="space-y-3 sm:space-y-4">
                {displayedPosts.length === 0 && loadingLikes && (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="mb-2 inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Loading liked posts...</p>
                    </div>
                  </div>
                )}
                {displayedPosts.length === 0 && !loadingLikes && likesError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-600 dark:text-red-400">{likesError}</p>
                  </div>
                )}
                {displayedPosts.map((post, index) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card>
                      <div className="p-3 sm:p-6">
                        <div className="mb-2 flex items-center space-x-2 sm:mb-4 sm:space-x-3">
                          <img
                            src={blogData.avatar}
                            alt={blogData.username}
                            className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 sm:h-10 sm:w-10"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                              {blogData.username}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 sm:text-sm">
                              {new Date(post.timestamp).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {post.images && post.images.length > 0 && (
                          <img
                            src={post.images[0]}
                            alt="Post content"
                            className="mb-2 w-full cursor-pointer rounded-lg transition-transform active:scale-[0.98] sm:mb-4 sm:hover:scale-[1.02]"
                            onClick={() => setSelectedImage(post)}
                          />
                        )}

                        {/* Only show text content if it's not HTML markup */}
                        {post.content && !post.content.includes('<') && (
                          <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 sm:text-base sm:line-clamp-none">{post.content}</p>
                        )}

                        {post.tags.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5 sm:mt-4 sm:gap-2">
                            {post.tags.map((tag, tagIndex) => (
                              <button
                                key={`${post.id}-tag-${tagIndex}-${tag}`}
                                onClick={() => navigate({
                                  to: '/tag/$tag',
                                  params: { tag },
                                  search: { scope: 'user', blog: username }
                                })}
                                className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700 transition-colors hover:bg-primary-500 hover:text-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-primary-600 sm:px-3 sm:py-1 sm:text-sm"
                              >
                                #{tag}
                              </button>
                            ))}
                          </div>
                        )}

                        <div className="mt-3 flex items-center space-x-4 text-xs text-gray-600 dark:text-gray-400 sm:mt-4 sm:space-x-6 sm:text-sm">
                          <button
                            onClick={() => handleLike(post.id)}
                            className={`flex items-center space-x-0.5 transition-colors sm:space-x-1 ${likedPosts.has(post.id)
                              ? 'text-red-500 hover:text-red-600'
                              : 'hover:text-primary-500'
                              }`}
                          >
                            <svg
                              className="h-4 w-4 sm:h-5 sm:w-5"
                              fill={likedPosts.has(post.id) ? 'currentColor' : 'none'}
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
                            <span className="hidden sm:inline">Like</span>
                          </button>
                          <button
                            onClick={() => {
                              setNotesFilter('comments');
                              setSelectedPostForNotes(post);
                            }}
                            className="flex items-center space-x-0.5 transition-colors hover:text-primary-500 sm:space-x-1"
                          >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                              />
                            </svg>
                            <span className="hidden sm:inline">Comment</span>
                          </button>
                          <button
                            onClick={() => {
                              setNotesFilter('reblogs');
                              setSelectedPostForNotes(post);
                            }}
                            className="flex items-center space-x-0.5 transition-colors hover:text-primary-500 sm:space-x-1"
                          >
                            <svg className="h-4 w-4 sm:h-5 sm:w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                              />
                            </svg>
                            <span className="hidden sm:inline">Reblog</span>
                          </button>
                          <div className="ml-auto flex flex-col items-end gap-0.5 sm:flex-row sm:items-center sm:gap-3">
                            <button
                              onClick={() => {
                                setNotesFilter('all');
                                setSelectedPostForNotes(post);
                              }}
                              className="font-medium transition-colors hover:text-primary-500 hover:underline"
                            >
                              {post.notes.toLocaleString()} <span className="hidden sm:inline">notes</span>
                            </button>
                            <div className="flex gap-2 sm:gap-3">
                              <button
                                onClick={() => {
                                  setNotesFilter('likes');
                                  setSelectedPostForNotes(post);
                                }}
                                className="transition-colors hover:text-red-500 hover:underline"
                              >
                                {Math.floor(post.notes * 0.6).toLocaleString()} <span className="hidden xs:inline">likes</span>
                              </button>
                              <button
                                onClick={() => {
                                  setNotesFilter('reblogs');
                                  setSelectedPostForNotes(post);
                                }}
                                className="transition-colors hover:text-green-500 hover:underline"
                              >
                                {Math.floor(post.notes * 0.2).toLocaleString()} <span className="hidden xs:inline">reblogs</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
                {/* Load More button for liked posts */}
                {contentMode === 'likes' && likesHasMore && (
                  <div className="flex justify-center pt-4">
                    <Button
                      onClick={loadMoreLikes}
                      disabled={loadingMoreLikes}
                      variant="secondary"
                      size="lg"
                    >
                      {loadingMoreLikes ? (
                        <>
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></div>
                          Loading...
                        </>
                      ) : (
                        'Load More Liked Posts'
                      )}
                    </Button>
                  </div>
                )}
                {contentMode === 'likes' && !likesHasMore && likedPostsData.length > 0 && (
                  <div className="flex justify-center pt-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {likesTotalCount
                        ? `All ${likesTotalCount.toLocaleString()} liked posts loaded (${likedPostsData.filter(p => p.images && p.images.length > 0).length} images)`
                        : `All ${likedPostsData.length} liked posts loaded (${likedPostsData.filter(p => p.images && p.images.length > 0).length} images)`}
                    </p>
                  </div>
                )}
              </div>
            )}


            {/* Image Viewer */}
            {selectedImage && selectedImage.images && (
              <ImageViewer
                imageUrl={selectedImage.images[0]}
                isOpen={!!selectedImage}
                onClose={() => setSelectedImage(null)}
                onNext={currentImageIndex < allPhotoPosts.length - 1 ? handleNextImage : undefined}
                onPrevious={currentImageIndex > 0 ? handlePreviousImage : undefined}
                onJumpToEnd={handleJumpToEnd}
                onJumpToStart={handleJumpToStart}
                currentIndex={currentImageIndex}
                totalImages={allPhotoPosts.length}
                postId={selectedImage.id}
                blogId={username}
                userId={user?.id}
                totalNotes={selectedImage.notes}
                notesList={mockNotesForImage}
                isSelected={gridSelection.has(selectedImage.id)}
                onToggleSelect={() => toggleSelectImage(selectedImage.id)}
                imageText={selectedImage.content} // Pass text content for 't' key toggle
              />
            )}

            {/* Notes Panel for regular posts */}
            <NotesPanel
              isOpen={!!selectedPostForNotes}
              onClose={() => setSelectedPostForNotes(null)}
              notes={mockNotesForPost}
              totalNotes={selectedPostForNotes?.notes || 0}
              initialFilter={notesFilter}
            />

            {/* Metadata Panel */}
            <MetadataPanel
              isOpen={showMetadata}
              onClose={() => {
                setShowMetadata(false);
                setMetadataForImage(null);
              }}
              imageUrl={metadataForImage?.images?.[0]}
              metadata={metadataForImage ? {
                blogName: username,
                blogUrl: `https://tumblr.com/${username}`,
                tags: metadataForImage.tags,
                notes: metadataForImage.notes,
                timestamp: metadataForImage.timestamp,
                description: metadataForImage.content,
                postUrl: `https://tumblr.com/${username}/post/${metadataForImage.id}`,
                imageText: metadataForImage.content,
                imageWidth: metadataForImage.imageWidth,
                imageHeight: metadataForImage.imageHeight,
              } : undefined}
            />

            {/* Keyboard Shortcuts Help Modal */}
            {showShortcutsHelp && (
              <div
                className="fixed inset-0 bg-black/70 flex items-center justify-center z-50"
                onClick={() => setShowShortcutsHelp(false)}
              >
                <div
                  className="bg-gray-900 border border-gray-700 rounded-lg p-8 max-w-2xl w-full mx-4 shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Keyboard Shortcuts</h2>
                    <button
                      onClick={() => setShowShortcutsHelp(false)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Navigation Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-blue-400 mb-3">Navigation</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Arrow Keys</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">← ↑ → ↓</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Navigate Images</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Home / End</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">Home / End</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">First / Last Image</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Page Up / Down</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">PgUp / PgDn</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Jump 3 Rows</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-green-400 mb-3">Actions</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">View Image</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">Enter</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Open Fullscreen</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Select Image</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">Space</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Toggle Selection</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Show Metadata</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">X</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Image Details</span>
                        </div>
                      </div>
                    </div>

                    {/* Load More Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-purple-400 mb-3">Load More Images</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Load +50</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">5</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">50 More Images</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Load +100</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">1</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">100 More Images</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Load +200</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">2</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">200 More Images</span>
                        </div>
                      </div>
                    </div>

                    {/* View Mode Section */}
                    <div>
                      <h3 className="text-lg font-semibold text-yellow-400 mb-3">View Mode</h3>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Full View</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">F</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Switch to Full View</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Close Help</span>
                          <kbd className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-sm text-white">Esc</kbd>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-gray-300">Close This Dialog</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-700 text-center">
                    <p className="text-gray-400 text-sm">Press <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white">?</kbd> to show shortcuts, <kbd className="px-2 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-white">Esc</kbd> to close</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )
        }

        <VersionBadge />
      </div >
    </div >
  );
}



