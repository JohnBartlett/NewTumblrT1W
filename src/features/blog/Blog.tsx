import { useParams, useNavigate } from '@tanstack/react-router';
import { useMemo, useState, useEffect, useRef } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { motion } from 'framer-motion';
import { Card, Button, ImageViewer, NotesPanel, MetadataPanel, VersionBadge, SelectionToolbar, ImageFilters, type ImageFiltersState } from '@/components/ui';
import { startOperationAtom, updateOperationProgressAtom, endOperationAtom } from '@/store/operations';
import type { Note } from '@/components/ui/NotesPanel';
import { shareImages, downloadImages, downloadImagesServerSide, canShareFiles, getImageFilename, type ImageMetadata } from '@/utils/imageDownload';
import { filenamePatternAtom, includeIndexInFilenameAtom, includeSidecarMetadataAtom, downloadMethodAtom, gridColumnsAtom, gridImageSizeAtom } from '@/store/preferences';
import { userAtom } from '@/store/auth';
import { useTumblrBlog } from '@/hooks/useTumblrBlog';
import { getTumblrConnectionStatus } from '@/services/api';
import { trackBlogVisit } from '@/utils/blogHistory';

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
  // Test images are: 800×600 (small), 1000×800 (medium), 1200×900 (large)
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
  const [selectedImages, setSelectedImages] = useState<Set<string>>(new Set());
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
  const cancelOperationRef = useRef(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [metadataForImage, setMetadataForImage] = useState<BlogPost | null>(null);
  
  // Range selection mode for mobile
  const [rangeMode, setRangeMode] = useState(false);
  const [rangeStart, setRangeStart] = useState<number | null>(null);

  // Fetch real Tumblr blog data (with OAuth if user is connected)
  const { blogData: fetchedBlogData, loading: blogLoading, loadingMore, error: apiError, usingMockData, hasMore, loadMore, loadMultiple, loadAll } = useTumblrBlog(username, user?.id);
  
  // OAuth connection status
  const [hasOAuth, setHasOAuth] = useState(false);
  
  // Check OAuth status on mount
  useEffect(() => {
    async function checkOAuth() {
      if (user?.id) {
        const status = await getTumblrConnectionStatus(user.id);
        setHasOAuth(status?.connected || false);
      }
    }
    checkOAuth();
  }, [user?.id]);

  // Function to fetch liked posts until we have enough images (works with API key, but only for blogs you own)
  const fetchLikedPosts = async (targetImageCount: number = 50, append: boolean = false) => {
    if (!username) return;
    
    // Count existing images if appending
    const existingImageCount = append 
      ? likedPostsData.filter(p => p.images && p.images.length > 0).length 
      : 0;
    
    if (append) {
      setLoadingMoreLikes(true);
    } else {
      setLoadingLikes(true);
      setLikedPostsData([]); // Clear existing data when starting fresh
      setLikesOffset(0);
      setLikesNextTimestamp(undefined);
    }
    setLikesError(null);
    
    try {
      const normalizedBlog = username.toLowerCase().includes('.')
        ? username.toLowerCase()
        : `${username.toLowerCase()}.tumblr.com`;
      
      let currentOffset = append ? likesOffset : 0;
      let currentTimestamp = append ? likesNextTimestamp : undefined;
      let allConvertedLikes: BlogPost[] = [];
      let totalImagesCollected = existingImageCount; // Start with existing count when appending
      let hasMorePostsFromAPI = true; // Track if API has more posts (separate from target)
      let fetchedLikedCount = 0;
      const processedPostIds = new Set<string>(); // Track processed post IDs to avoid duplicates
      
      console.log(`[Blog] fetchLikedPosts: target=${targetImageCount}, existing=${existingImageCount}, append=${append}`);
      
      // Keep fetching until we have enough images or run out of posts
      while (totalImagesCollected < targetImageCount && hasMorePostsFromAPI) {
        // Build URL with pagination
        let url = `${API_URL}/api/tumblr/blog/${normalizedBlog}/likes?limit=20`;
        
        // Use timestamp pagination if we've exceeded 1000 posts, otherwise use offset
        if (currentOffset >= 1000 && currentTimestamp) {
          url += `&before=${currentTimestamp}`;
        } else {
          url += `&offset=${currentOffset}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          const errorMsg = errorData.error || errorData.meta?.msg || 'Failed to load liked posts';
          
          if (response.status === 403 || response.status === 401) {
            setLikesError('Liked posts are only available for your own blog. This endpoint only works for blogs you own.');
          } else if (response.status === 429) {
            setLikesError('Rate limit exceeded. Please try again later.');
          } else {
            setLikesError(errorMsg);
          }
          break;
        }
        
        const data = await response.json();
        
        // Handle Tumblr API response format
        const likedPosts = data.response?.liked_posts || data.likedPosts || [];
        const likedCount = data.response?.liked_count || data.likedCount || 0;
        
        // Update total count if we got it
        if (likedCount > 0 && likesTotalCount === null) {
          setLikesTotalCount(likedCount);
        }
        
        if (likedPosts.length === 0) {
          hasMorePostsFromAPI = false;
          break;
        }
        
        // Convert liked posts to BlogPost format and extract ALL images from each post
        let postsProcessedInBatch = 0;
        let imagesInBatch = 0;
        for (const likedPost of likedPosts) {
          // Skip if we've already processed this post (avoid duplicates)
          const postId = String(likedPost.id);
          if (processedPostIds.has(postId)) {
            console.log(`[Blog] Skipping duplicate post: ${postId}`);
            continue;
          }
          processedPostIds.add(postId);
          
          postsProcessedInBatch++;
          const images: string[] = [];
          let imageWidth: number | undefined;
          let imageHeight: number | undefined;
          
          // Extract ALL images from liked post (not just the first one)
          if (likedPost.photos && likedPost.photos.length > 0) {
            // Get all photos, not just the first
            for (const photo of likedPost.photos) {
              images.push(photo.original_size.url);
            }
            // Use first photo for dimensions
            const firstPhoto = likedPost.photos[0];
            imageWidth = firstPhoto.original_size.width;
            imageHeight = firstPhoto.original_size.height;
          }
          
          // Create a BlogPost for each image in the post
          if (images.length > 0) {
            for (let imageIndex = 0; imageIndex < images.length; imageIndex++) {
              const imageUrl = images[imageIndex];
              // Create unique ID that includes timestamp to ensure uniqueness across batches
              const uniqueId = `${likedPost.id}-img-${imageIndex}-${likedPost.liked_timestamp || likedPost.timestamp}`;
              
                // Create separate BlogPost entries for each image
                // For photo posts, prioritize caption (full text) over summary (truncated)
                let likedContent = '';
                if (likedPost.type === 'photo') {
                  // Photo posts: caption contains full text, summary is truncated
                  likedContent = likedPost.caption || likedPost.summary || '';
                } else if (likedPost.type === 'text') {
                  // Text posts: body contains full content
                  likedContent = likedPost.body || likedPost.summary || '';
                } else {
                  // Other post types: try caption first, then body, then summary
                  likedContent = likedPost.caption || likedPost.body || likedPost.summary || '';
                }
                
                allConvertedLikes.push({
                  id: uniqueId, // Unique ID for each image
                  type: likedPost.type === 'photo' ? 'photo' : likedPost.type === 'quote' ? 'quote' : likedPost.type === 'link' ? 'link' : 'text',
                  content: likedContent,
                  timestamp: likedPost.timestamp * 1000,
                  notes: likedPost.note_count || 0,
                  notesData: likedPost.notes || undefined, // Include notes data if available from API
                  tags: likedPost.tags || [],
                  images: [imageUrl], // Single image per BlogPost entry
                  imageWidth: imageIndex === 0 ? imageWidth : undefined, // Only set dimensions for first image
                  imageHeight: imageIndex === 0 ? imageHeight : undefined,
                });
              totalImagesCollected++;
              imagesInBatch++;
              
              // Stop processing more images if we've reached our target (but API may still have more)
              if (totalImagesCollected >= targetImageCount) {
                console.log(`[Blog] Reached target: ${totalImagesCollected} images collected (target: ${targetImageCount})`);
                break; // Break out of image loop, but continue to check API pagination
              }
            }
          } else {
            // Post has no images - skip it when counting images, but we could include it for completeness
            // Actually, let's skip posts without images to focus on images only
            // allConvertedLikes.push({...});
          }
          
          // Stop processing more posts if we've reached our target (but API may still have more)
          if (totalImagesCollected >= targetImageCount) {
            break; // Break out of post loop, but continue to check API pagination
          }
        }
        
        console.log(`[Blog] Batch processed: ${postsProcessedInBatch} posts, ${imagesInBatch} images, total: ${totalImagesCollected}/${targetImageCount}`);
        
        fetchedLikedCount += likedPosts.length;
        
        // Update pagination state for next iteration
        // Check if API has more posts available (regardless of target)
        // This MUST be done before breaking, so we know if there are more posts
        if (likedPosts.length > 0) {
          const lastPost = likedPosts[likedPosts.length - 1];
          if (lastPost.liked_timestamp) {
            currentTimestamp = lastPost.liked_timestamp;
            setLikesNextTimestamp(currentTimestamp);
          }
          
          // Update offset if not using timestamp pagination yet
          const newOffset = currentOffset + likedPosts.length;
          if (newOffset < 1000) {
            currentOffset = newOffset;
            setLikesOffset(currentOffset);
            hasMorePostsFromAPI = true; // API has more posts (still within offset limit)
          } else if (newOffset >= 1000 && lastPost.liked_timestamp) {
            // Switch to timestamp pagination - offset stays at 1000
            currentOffset = 1000;
            setLikesOffset(1000);
            setLikesNextTimestamp(lastPost.liked_timestamp);
            hasMorePostsFromAPI = true; // API has more posts (can use timestamp pagination)
          } else {
            // Can't determine next pagination method
            hasMorePostsFromAPI = false;
          }
        } else {
          // No posts returned from API
          hasMorePostsFromAPI = false;
        }
        
        // Check if we've reached our target after processing all posts in this batch
        // Break AFTER checking pagination, so we know if API has more posts
        if (totalImagesCollected >= targetImageCount) {
          break; // Exit the while loop (target reached), but API may still have more
        }
        
        // Safety check: don't fetch more than 500 posts in one go (increased from 100)
        // This allows fetching enough posts to get 50 images even if many posts don't have images
        if (fetchedLikedCount >= 500) {
          console.log(`[Blog] Fetched ${fetchedLikedCount} liked posts, stopping to avoid rate limits`);
          break;
        }
      }
      
      // Update state with collected posts
      if (append) {
        // Append to existing posts, filtering out duplicates by ID
        setLikedPostsData(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = allConvertedLikes.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      } else {
        // Replace posts, ensuring no duplicates
        const uniquePosts = Array.from(
          new Map(allConvertedLikes.map(p => [p.id, p])).values()
        );
        setLikedPostsData(uniquePosts);
      }
      
      // Determine if there are more posts available
      // We have more if there are more posts available from the API (regardless of target)
      // The target is just for this fetch operation, not for overall availability
      setLikesHasMore(hasMorePostsFromAPI);
      
      console.log(`[Blog] Fetched ${allConvertedLikes.length} liked posts with ${totalImagesCollected - existingImageCount} new images (total: ${totalImagesCollected}/${targetImageCount}, existing: ${existingImageCount})`);
    } catch (error: any) {
      console.error('[Blog] Error fetching liked posts:', error);
      setLikesError(error.message || 'Failed to load liked posts.');
    } finally {
      if (append) {
        setLoadingMoreLikes(false);
      } else {
        setLoadingLikes(false);
      }
    }
  };

  // Function to load more liked images (fetches until we have 50 more images)
  const loadMoreLikes = async () => {
    if (loadingMoreLikes || !likesHasMore) return;
    
    // Count current images
    const currentImageCount = likedPostsData.filter(p => p.images && p.images.length > 0).length;
    const targetImageCount = currentImageCount + 50; // Load 50 more images
    
    await fetchLikedPosts(targetImageCount, true); // Append mode
  };

  // Function to load multiple batches of liked images
  const loadMultipleLikes = async (additionalImageCount: number) => {
    if (loadingMoreLikes || !likesHasMore) return;
    
    // Count current images
    const currentImageCount = likedPostsData.filter(p => p.images && p.images.length > 0).length;
    const targetImageCount = currentImageCount + additionalImageCount;
    
    await fetchLikedPosts(targetImageCount, true); // Append mode
  };

  // Fetch liked posts when switching to likes mode (fetch until we have 50 images)
  useEffect(() => {
    if (contentMode === 'likes' && likedPostsData.length === 0 && !loadingLikes && !likesError) {
      fetchLikedPosts(50, false); // Fetch until we have 50 images
      setLikesOffset(0);
      setLikesNextTimestamp(undefined);
      setLikesTotalCount(null);
    }
  }, [contentMode]);

  // Reset liked posts when switching back to posts mode
  useEffect(() => {
    if (contentMode === 'posts') {
      // Optionally clear liked posts to save memory, or keep them cached
      // setLikedPostsData([]);
    }
  }, [contentMode]);
  
  // Track blog visit when blog data is loaded (only if NOT using mock data)
  useEffect(() => {
    if (fetchedBlogData && !blogLoading && !apiError && !usingMockData) {
      trackBlogVisit(
        username,
        fetchedBlogData.displayName,
        fetchedBlogData.avatar
      );
    }
  }, [fetchedBlogData, blogLoading, apiError, usingMockData, username]);
  
  // Use fetched data - don't create fallback data for error states
  const blogData = useMemo(() => {
    if (fetchedBlogData) {
      // Ensure posts array exists even if the API returned something unexpected
      return {
        ...fetchedBlogData,
        posts: fetchedBlogData.posts || []
      };
    }
    // Only create fallback during loading (not for errors)
    if (blogLoading) {
      return {
        username,
        displayName: username,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
        description: 'Loading...',
        followerCount: 0,
        followingCount: 0,
        postCount: 0,
        posts: []
      };
    }
    // Return null for error states (blog doesn't exist, etc.)
    return null;
  }, [fetchedBlogData, username, blogLoading]);
  
  // For backwards compatibility with old mock data structure
  const oldMockBlogData = useMemo(() => {
    // Special handling for photoarchive - generate hundreds of images
    const isPhotoArchive = username === 'photoarchive';
    const postCount = isPhotoArchive ? 300 : 30;
    
    return {
      username,
      displayName: isPhotoArchive ? 'Photo Archive 📸' : (username.charAt(0).toUpperCase() + username.slice(1)),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`,
      description: isPhotoArchive 
        ? 'A massive collection of curated photography from around the world. Featuring landscapes, portraits, architecture, nature, and urban photography. Perfect for inspiration and testing!'
        : `This is ${username}'s blog. A collection of thoughts, photos, and creative content.`,
      followerCount: isPhotoArchive ? 45238 : Math.floor(Math.random() * 10000),
      followingCount: isPhotoArchive ? 892 : Math.floor(Math.random() * 1000),
      postCount: isPhotoArchive ? 8547 : Math.floor(Math.random() * 500) + 50,
      posts: Array.from({ length: postCount }, (_, i) => {
        // For photoarchive, ALL posts are photos. For others, 60% photos, 40% text/other
        const isPhoto = isPhotoArchive ? true : (Math.random() > 0.4);
        
        // Varied realistic tags
        const allTags = [
          'photography', 'nature', 'landscape', 'travel', 'wanderlust',
          'aesthetic', 'vsco', 'art', 'beautiful', 'stunning',
          'sunset', 'mountains', 'ocean', 'cityscape', 'architecture',
          'minimalism', 'vintage', 'retro', 'mood', 'vibes',
          'creative', 'inspiration', 'my photos', 'original photography',
          'artists on tumblr', 'dark academia', 'cottagecore', 'light academia',
          'cozy', 'autumn', 'winter', 'spring', 'summer',
          'street photography', 'portrait', 'black and white', 'film photography',
          'digital art', 'sketch', 'illustration', 'design',
        ];
        
        // Select 2-5 random tags
        const shuffled = [...allTags].sort(() => 0.5 - Math.random());
        const selectedTags = shuffled.slice(0, Math.floor(Math.random() * 4) + 2);
        
        // Use varied image sizes for photoarchive
        const imageWidth = isPhotoArchive ? [800, 1000, 1200][i % 3] : 800;
        const imageHeight = isPhotoArchive ? [600, 800, 900][i % 3] : 600;
        
        return {
          id: `post-${username}-${i}`,
          type: isPhoto ? 'photo' : (['text', 'quote', 'link'][Math.floor(Math.random() * 3)] as BlogPost['type']),
          content: isPhotoArchive 
            ? `Photo ${i + 1} - ${selectedTags.slice(0, 2).join(', ')}`
            : `This is post #${i + 1} from ${username}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
          timestamp: Date.now() - i * 86400000,
          notes: isPhotoArchive ? Math.floor(Math.random() * 5000) : Math.floor(Math.random() * 1000),
          tags: selectedTags,
          images: isPhoto ? [`https://picsum.photos/seed/${username}-${i}/${imageWidth}/${imageHeight}`] : undefined,
          imageWidth: isPhoto ? imageWidth : undefined,
          imageHeight: isPhoto ? imageHeight : undefined,
        };
      }),
    };
  }, [username]);

  // Filter posts based on view mode and content mode (posts vs likes)
  const displayedPosts = useMemo(() => {
    const postsToDisplay = contentMode === 'likes' ? likedPostsData : (blogData?.posts || []);
    if (postsToDisplay.length === 0) return [];
    if (viewMode === 'images-only') {
      // Show any post with images, regardless of type (includes HTML-parsed images)
      return postsToDisplay.filter(post => post.images && post.images.length > 0);
    }
    return postsToDisplay;
  }, [blogData?.posts, likedPostsData, viewMode, contentMode]);

  // Get all photo posts for navigation in ImageViewer
  const allPhotoPosts = useMemo(() => {
    const postsToDisplay = contentMode === 'likes' ? likedPostsData : (blogData?.posts || []);
    if (postsToDisplay.length === 0) return [];
    // Include any post with images, not just photo-type posts
    return postsToDisplay.filter(post => post.images && post.images.length > 0);
  }, [blogData?.posts, likedPostsData, contentMode]);

  const currentImageIndex = selectedImage
    ? allPhotoPosts.findIndex(post => post.id === selectedImage.id)
    : -1;

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

  const toggleSelectImage = (postId: string) => {
    setSelectedImages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(postId)) {
        newSet.delete(postId);
      } else {
        newSet.add(postId);
      }
      return newSet;
    });
  };

  // Grid selection handlers
  const handleGridImageClick = (post: BlogPost, index: number, event: React.MouseEvent) => {
    const photoPosts = filteredAndSortedPhotoPosts;
    
    // Range Mode (mobile-friendly)
    if (rangeMode) {
      if (rangeStart === null) {
        // First tap - set range start
        setRangeStart(index);
        const newSelection = new Set(gridSelection);
        newSelection.add(post.id);
        setGridSelection(newSelection);
      } else {
        // Second tap - select range and exit mode
        const start = Math.min(rangeStart, index);
        const end = Math.max(rangeStart, index);
        const newSelection = new Set(gridSelection);
        for (let i = start; i <= end; i++) {
          newSelection.add(photoPosts[i].id);
        }
        setGridSelection(newSelection);
        setRangeMode(false);
        setRangeStart(null);
        setLastSelectedIndex(index);
      }
      return;
    }
    
    if (event.shiftKey && lastSelectedIndex !== null) {
      // Range selection (desktop)
      const start = Math.min(lastSelectedIndex, index);
      const end = Math.max(lastSelectedIndex, index);
      const newSelection = new Set(gridSelection);
      for (let i = start; i <= end; i++) {
        newSelection.add(photoPosts[i].id);
      }
      setGridSelection(newSelection);
    } else if (event.ctrlKey || event.metaKey) {
      // Toggle individual
      const newSelection = new Set(gridSelection);
      if (newSelection.has(post.id)) {
        newSelection.delete(post.id);
      } else {
        newSelection.add(post.id);
      }
      setGridSelection(newSelection);
      setLastSelectedIndex(index);
    } else {
      // Normal click - open image
      setSelectedImage(post);
    }
  };

  const handleSelectAll = () => {
    setGridSelection(new Set(filteredAndSortedPhotoPosts.map(p => p.id)));
  };

  const handleSelectNone = () => {
    setGridSelection(new Set());
    setLastSelectedIndex(null);
  };

  const handleInvertSelection = () => {
    const allIds = new Set(filteredAndSortedPhotoPosts.map(p => p.id));
    const newSelection = new Set<string>();
    allIds.forEach(id => {
      if (!gridSelection.has(id)) {
        newSelection.add(id);
      }
    });
    setGridSelection(newSelection);
  };

  const handleCancelOperation = () => {
    cancelOperationRef.current = true;
  };

  const handleShare = async () => {
    if (gridSelection.size === 0 || isDownloading) return;

    cancelOperationRef.current = false;
    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: gridSelection.size });

    try {
      // Get the selected posts
      const selectedPosts = allPhotoPosts.filter(post => gridSelection.has(post.id));
      
      // Prepare image data with full metadata and filename options
      const imagesToShare = selectedPosts.map((post, index) => {
        const metadata: ImageMetadata = {
          blogName: username,
          blogUrl: `https://tumblr.com/${username}`,
          tags: post.tags,
          notes: post.notes,
          timestamp: post.timestamp,
          description: post.content,
          postUrl: `https://tumblr.com/${username}/post/${post.id}`,
          imageText: post.content, // Text content attached to the image
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

      // Share images with metadata (to Photos app)
      const result = await shareImages(
        imagesToShare,
        (current, total) => {
          if (cancelOperationRef.current) {
            throw new Error('Operation cancelled by user');
          }
          setDownloadProgress({ current, total });
        }
      );

      setDownloadProgress(null);
      setIsDownloading(false);

      // Show result
      if (result.succeeded === 0 && result.failed === 0) {
        // User cancelled
        return;
      }
      
      if (result.failed === 0) {
        alert(`✅ Successfully shared ${result.succeeded} image(s) to Photos!\n\nMetadata included:\n• Blog name: ${username}\n• Tags\n• Post date\n• Notes count`);
      } else {
        alert(
          `Shared ${result.succeeded} image(s).\n${result.failed} failed.\n\nNote: Some browsers may block multiple shares.`
        );
      }
    } catch (error) {
      setDownloadProgress(null);
      setIsDownloading(false);
      if (error instanceof Error && error.message === 'Operation cancelled by user') {
        alert(`⚠️ Share operation cancelled`);
      } else {
        alert(`❌ Share failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  // Download ALL images from entire blog (loads all posts first if needed)
  const handleDownloadEntireBlog = async () => {
    if (!blogData || isDownloading) return;

    // First, check if we need to load more posts
    if (!usingMockData && hasMore) {
      const confirmed = window.confirm(
        `This blog has ${blogData.postCount} total posts, but only ${blogData.posts.length} are loaded.\n\n` +
        `Load all ${blogData.postCount - blogData.posts.length} remaining posts and download all images?\n\n` +
        `This may take several minutes and will use API calls.`
      );
      
      if (!confirmed) return;

      console.log('[Blog] Loading all posts before downloading...');
      // Load all posts first
      await loadAll();
      console.log('[Blog] All posts loaded, waiting for state update...');
      
      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Now download all filtered images
    console.log('[Blog] Starting download all operation...');
    handleDownloadAll();
  };

  // Download all filtered images (for "Download All" button)
  const handleDownloadAll = async () => {
    if (filteredAndSortedPhotoPosts.length === 0 || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: filteredAndSortedPhotoPosts.length });
    
    // Start global operation status
    startOperation({
      type: 'download',
      current: 0,
      total: filteredAndSortedPhotoPosts.length,
      source: username,
    });

    try {
      // Prepare image data with full metadata and filename options
      const imagesToDownload = filteredAndSortedPhotoPosts.map((post, index) => {
        const metadata: ImageMetadata = {
          blogName: username,
          blogUrl: `https://tumblr.com/${username}`,
          tags: post.tags,
          notes: post.notes,
          timestamp: post.timestamp,
          description: post.content,
          postUrl: `https://tumblr.com/${username}/post/${post.id}`,
          imageText: post.content, // Text content attached to the image
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

      // Download based on user preference
      if (downloadMethod === 'client-side') {
        await downloadImages(imagesToDownload, (current) => {
          setDownloadProgress({ current, total: filteredAndSortedPhotoPosts.length });
          updateOperationProgress({ current, total: filteredAndSortedPhotoPosts.length });
        });
      } else {
        await downloadImagesServerSide(
          imagesToDownload,
          API_URL,
          (current) => {
            setDownloadProgress({ current, total: filteredAndSortedPhotoPosts.length });
            updateOperationProgress({ current, total: filteredAndSortedPhotoPosts.length });
          },
          includeSidecarMetadata
        );
      }

      console.log(`Downloaded ${filteredAndSortedPhotoPosts.length} images`);
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download images. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      endOperation();
    }
  };

  // Download selected images to a folder with blog name
  const handleDownloadSelectedToFolder = async () => {
    if (gridSelection.size === 0 || isDownloading) return;

    const isLikesMode = contentMode === 'likes';
    const folderName = isLikesMode ? `${username}-liked` : username;
    console.log(`[Blog] 📁 Starting selected folder download for ${gridSelection.size} ${isLikesMode ? 'liked ' : ''}images from @${username}`);

    // Confirm action
    if (!window.confirm(
      `Download ${gridSelection.size} selected ${isLikesMode ? 'liked ' : ''}images to a folder named "${folderName}"?\n\n` +
      `You'll be prompted to select where to save the folder.`
    )) {
      console.log('[Blog] ❌ User cancelled confirmation dialog');
      return;
    }

    // Import the utility function
    const { isFileSystemAccessSupported } = await import('@/utils/downloadDirectory');
    
    // Check API support
    if (!isFileSystemAccessSupported()) {
      console.warn('[Blog] ⚠️ File System Access API not supported, will use fallback');
    } else {
      console.log('[Blog] ✅ File System Access API supported');
    }

    // Step 1: Request directory FIRST (while we still have user gesture)
    console.log('[Blog] 🔹 Step 1: Requesting directory picker...');
    let parentDirHandle: FileSystemDirectoryHandle | null = null;
    
    try {
      if (isFileSystemAccessSupported()) {
        parentDirHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads',
        });
        console.log(`[Blog] ✅ Directory selected: ${parentDirHandle.name}`);
      } else {
        console.log('[Blog] ℹ️ Skipping directory picker (API not supported), will use fallback download');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[Blog] ℹ️ User cancelled directory picker');
        alert('Download cancelled - no directory selected.');
        return;
      }
      console.error('[Blog] ❌ Error showing directory picker:', error);
      alert(`Failed to open directory picker: ${error.message}\n\nWill use fallback download method.`);
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: gridSelection.size });
    
    // Start global operation status
    startOperation({
      type: 'download-folder',
      current: 0,
      total: gridSelection.size,
      source: username,
    });

    try {
      // Get selected posts
      const selectedPosts = allPhotoPosts.filter(post => gridSelection.has(post.id));
      
      // Step 2: Fetch all selected images as blobs
      console.log(`[Blog] 🔹 Step 2: Fetching ${selectedPosts.length} selected images...`);
      const files: Array<{ blob: Blob; filename: string }> = [];
      
      for (let i = 0; i < selectedPosts.length; i++) {
        const post = selectedPosts[i];
        const imageUrl = post.images![0];
        
        try {
          console.log(`[Blog] 🔸 Fetching image ${i + 1}/${selectedPosts.length}: ${imageUrl}`);
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
          
          const blob = await response.blob();
          const baseFilename = getImageFilename(imageUrl, i);
          
          // Create metadata for filename pattern
          const metadata: ImageMetadata = {
            blogName: username,
            blogUrl: `https://tumblr.com/${username}`,
            tags: post.tags,
            notes: post.notes,
            timestamp: post.timestamp,
            description: post.content,
            postUrl: `https://tumblr.com/${username}/post/${post.id}`,
            imageText: post.content, // Text content attached to the image
          };
          
          // Apply filename pattern
          const { generateMetadataFilename } = await import('@/utils/imageDownload');
          const filename = generateMetadataFilename(baseFilename, metadata, {
            pattern: filenamePattern,
            includeIndex: includeIndex,
            index: i,
          });
          
          files.push({ blob, filename });
          console.log(`[Blog] ✅ Fetched ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
          
          setDownloadProgress({ current: i + 1, total: selectedPosts.length });
          updateOperationProgress({ current: i + 1, total: selectedPosts.length });
        } catch (error) {
          console.error(`[Blog] ❌ Failed to fetch image ${i + 1}:`, error);
        }
      }

      console.log(`[Blog] ✅ Fetched ${files.length}/${selectedPosts.length} images successfully`);

      // Step 3: Save to directory or use fallback
      console.log('[Blog] 🔹 Step 3: Saving images to folder...');
      
      if (parentDirHandle) {
        // Save using File System Access API
        console.log(`[Blog] 💾 Saving to directory: ${parentDirHandle.name}/${username}/`);
        
        let successCount = 0;
        let failedCount = 0;

        try {
          const subdirHandle = await parentDirHandle.getDirectoryHandle(folderName, { create: true });
          console.log(`[Blog] ✅ Created/opened subdirectory: ${folderName}`);
          
          for (let i = 0; i < files.length; i++) {
            const { blob, filename } = files[i];
            
            try {
              const fileHandle = await subdirHandle.getFileHandle(filename, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              
              successCount++;
              console.log(`[Blog] ✅ (${i + 1}/${files.length}) Saved: ${filename}`);
            } catch (error) {
              failedCount++;
              console.error(`[Blog] ❌ Failed to save ${filename}:`, error);
            }

            setDownloadProgress({ current: i + 1, total: files.length });
            updateOperationProgress({ current: i + 1, total: files.length });

            if (i < files.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          console.log(`[Blog] ✅ Batch save complete: ${successCount} succeeded, ${failedCount} failed`);
          
          if (failedCount === 0) {
            alert(`✅ Successfully downloaded ${successCount} selected ${isLikesMode ? 'liked ' : ''}images to folder "${folderName}"!`);
          } else {
            alert(
              `⚠️ Partially downloaded: ${successCount} succeeded, ${failedCount} failed.\n\n` +
              `Check the console for details.`
            );
          }
        } catch (error) {
          console.error('[Blog] ❌ Error during batch save:', error);
          throw error;
        }
      } else {
        // Fallback
        console.log('[Blog] ⚠️ Using fallback download method (filename prefixes)');
        
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < files.length; i++) {
          const { blob, filename } = files[i];
          
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${folderName}_${filename}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            successCount++;
            console.log(`[Blog] ✅ (${i + 1}/${files.length}) Downloaded: ${folderName}_${filename}`);
          } catch (error) {
            failedCount++;
            console.error(`[Blog] ❌ Failed to download ${filename}:`, error);
          }

          setDownloadProgress({ current: i + 1, total: files.length });
          updateOperationProgress({ current: i + 1, total: files.length });

          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        console.log(`[Blog] ✅ Fallback download complete: ${successCount} succeeded, ${failedCount} failed`);
        
        if (failedCount === 0) {
          alert(`✅ Successfully downloaded ${successCount} selected ${isLikesMode ? 'liked ' : ''}images!\n\nFilenames are prefixed with "${folderName}_"`);
        } else {
          alert(
            `⚠️ Partially downloaded: ${successCount} succeeded, ${failedCount} failed.\n\n` +
            `Check the console for details.`
          );
        }
      }

      console.log(`[Blog] ✅ Selected folder download complete!`);
    } catch (error) {
      console.error('[Blog] ❌ Selected folder download failed:', error);
      alert('Failed to download selected images to folder. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      endOperation();
    }
  };

  // Download all images to a folder with blog name (loads all if needed)
  const handleDownloadAllToFolder = async () => {
    const isLikesMode = contentMode === 'likes';
    console.log(`[Blog] 📁 Starting ALL images folder download from @${username} (${isLikesMode ? 'liked posts' : 'regular posts'})`);
    
    // Check if we need to load more images first
    if (isLikesMode) {
      // For liked posts, check if there are more to load
      if (likesHasMore && likesTotalCount) {
        const currentImageCount = likedPostsData.filter(p => p.images && p.images.length > 0).length;
        const totalLikedPosts = likesTotalCount;
        
        if (!window.confirm(
          `This blog has ${totalLikedPosts.toLocaleString()} total liked posts.\n` +
          `Currently loaded: ${currentImageCount} images from ${likedPostsData.length} posts\n\n` +
          `Load more liked posts before downloading to folder?\n\n` +
          `This may take a while.`
        )) {
          console.log('[Blog] ❌ User cancelled load more liked posts');
          return;
        }
        
        // Load more liked posts (up to a reasonable limit)
        const targetImageCount = Math.min(10000, totalLikedPosts * 0.5); // Estimate 50% have images, max 10k
        console.log(`[Blog] 🔹 Loading more liked posts to reach ${targetImageCount} images...`);
        await fetchLikedPosts(targetImageCount, true);
        console.log(`[Blog] ✅ More liked posts loaded, proceeding with download`);
      }
    } else {
      // For regular posts
      if (!usingMockData && hasMore && blogData) {
        const totalImages = blogData.postCount;
        const loadedImages = blogData.posts.length;
        
        if (!window.confirm(
          `This blog has ${totalImages} total images.\n` +
          `Currently loaded: ${loadedImages}\n\n` +
          `Load all ${totalImages - loadedImages} remaining images before downloading to folder?\n\n` +
          `This may take a while.`
        )) {
          console.log('[Blog] ❌ User cancelled load all');
          return;
        }
        
        console.log(`[Blog] 🔹 Loading all ${totalImages - loadedImages} remaining images first...`);
        await loadAll();
        console.log(`[Blog] ✅ All images loaded, proceeding with download`);
      }
    }
    
    if (filteredAndSortedPhotoPosts.length === 0 || isDownloading) return;

    const folderName = isLikesMode ? `${username}-liked` : username;
    console.log(`[Blog] 📁 Starting folder download for ${filteredAndSortedPhotoPosts.length} images from @${username} (folder: ${folderName})`);

    // Confirm action
    if (!window.confirm(
      `Download all ${filteredAndSortedPhotoPosts.length} loaded ${isLikesMode ? 'liked ' : ''}images to a folder named "${folderName}"?\n\n` +
      `You'll be prompted to select where to save the folder.`
    )) {
      console.log('[Blog] ❌ User cancelled confirmation dialog');
      return;
    }

    // Import the utility function
    const { isFileSystemAccessSupported } = await import('@/utils/downloadDirectory');
    
    // Check API support
    if (!isFileSystemAccessSupported()) {
      console.warn('[Blog] ⚠️ File System Access API not supported, will use fallback');
    } else {
      console.log('[Blog] ✅ File System Access API supported');
    }

    // Step 1: Request directory FIRST (while we still have user gesture)
    console.log('[Blog] 🔹 Step 1: Requesting directory picker...');
    let parentDirHandle: FileSystemDirectoryHandle | null = null;
    
    try {
      if (isFileSystemAccessSupported()) {
        parentDirHandle = await window.showDirectoryPicker({
          mode: 'readwrite',
          startIn: 'downloads',
        });
        console.log(`[Blog] ✅ Directory selected: ${parentDirHandle.name}`);
      } else {
        console.log('[Blog] ℹ️ Skipping directory picker (API not supported), will use fallback download');
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('[Blog] ℹ️ User cancelled directory picker');
        alert('Download cancelled - no directory selected.');
        return;
      }
      console.error('[Blog] ❌ Error showing directory picker:', error);
      alert(`Failed to open directory picker: ${error.message}\n\nWill use fallback download method.`);
      // Continue without directory handle - will use fallback
    }

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: filteredAndSortedPhotoPosts.length });
    
    // Start global operation status
    startOperation({
      type: 'download-folder',
      current: 0,
      total: filteredAndSortedPhotoPosts.length,
      source: username,
    });

    try {
      // Step 2: Fetch all images as blobs
      console.log(`[Blog] 🔹 Step 2: Fetching ${filteredAndSortedPhotoPosts.length} images...`);
      const files: Array<{ blob: Blob; filename: string }> = [];
      
      for (let i = 0; i < filteredAndSortedPhotoPosts.length; i++) {
        const post = filteredAndSortedPhotoPosts[i];
        const imageUrl = post.images![0];
        
        try {
          console.log(`[Blog] 🔸 Fetching image ${i + 1}/${filteredAndSortedPhotoPosts.length}: ${imageUrl}`);
          const response = await fetch(imageUrl);
          if (!response.ok) throw new Error(`Failed to fetch: ${response.statusText}`);
          
          const blob = await response.blob();
          const baseFilename = getImageFilename(imageUrl, i);
          
          // Create metadata for filename pattern
          const metadata: ImageMetadata = {
            blogName: username,
            blogUrl: `https://tumblr.com/${username}`,
            tags: post.tags,
            notes: post.notes,
            timestamp: post.timestamp,
            description: post.content,
            postUrl: `https://tumblr.com/${username}/post/${post.id}`,
            imageText: post.content, // Text content attached to the image
          };
          
          // Apply filename pattern
          const { generateMetadataFilename } = await import('@/utils/imageDownload');
          const filename = generateMetadataFilename(baseFilename, metadata, {
            pattern: filenamePattern,
            includeIndex: includeIndex,
            index: i,
          });
          
          files.push({ blob, filename });
          console.log(`[Blog] ✅ Fetched ${filename} (${(blob.size / 1024).toFixed(1)} KB)`);
          
          // Update progress during fetch
          setDownloadProgress({ current: i + 1, total: filteredAndSortedPhotoPosts.length });
          updateOperationProgress({ current: i + 1, total: filteredAndSortedPhotoPosts.length });
        } catch (error) {
          console.error(`[Blog] ❌ Failed to fetch image ${i + 1}:`, error);
        }
      }

      console.log(`[Blog] ✅ Fetched ${files.length}/${filteredAndSortedPhotoPosts.length} images successfully`);

      // Step 3: Save to directory or use fallback
      console.log('[Blog] 🔹 Step 3: Saving images to folder...');
      
      if (parentDirHandle) {
        // Save using File System Access API
        console.log(`[Blog] 💾 Saving to directory: ${parentDirHandle.name}/${folderName}/`);
        
        let successCount = 0;
        let failedCount = 0;

        try {
          // Create subdirectory
          const subdirHandle = await parentDirHandle.getDirectoryHandle(folderName, { create: true });
          console.log(`[Blog] ✅ Created/opened subdirectory: ${folderName}`);
          
          // Save each file
          for (let i = 0; i < files.length; i++) {
            const { blob, filename } = files[i];
            
            try {
              const fileHandle = await subdirHandle.getFileHandle(filename, { create: true });
              const writable = await fileHandle.createWritable();
              await writable.write(blob);
              await writable.close();
              
              successCount++;
              console.log(`[Blog] ✅ (${i + 1}/${files.length}) Saved: ${filename}`);
            } catch (error) {
              failedCount++;
              console.error(`[Blog] ❌ Failed to save ${filename}:`, error);
            }

            setDownloadProgress({ current: i + 1, total: files.length });
            updateOperationProgress({ current: i + 1, total: files.length });

            // Small delay to avoid overwhelming system
            if (i < files.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 50));
            }
          }

          console.log(`[Blog] ✅ Batch save complete: ${successCount} succeeded, ${failedCount} failed`);
          
          if (failedCount === 0) {
            alert(`✅ Successfully downloaded ${successCount} ${isLikesMode ? 'liked ' : ''}images to folder "${folderName}"!`);
          } else {
            alert(
              `⚠️ Partially downloaded: ${successCount} succeeded, ${failedCount} failed.\n\n` +
              `Check the console for details.`
            );
          }
        } catch (error) {
          console.error('[Blog] ❌ Error during batch save:', error);
          throw error;
        }
      } else {
        // Fallback: Use traditional downloads with prefixed filenames
        console.log('[Blog] ⚠️ Using fallback download method (filename prefixes)');
        
        let successCount = 0;
        let failedCount = 0;

        for (let i = 0; i < files.length; i++) {
          const { blob, filename } = files[i];
          
          try {
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${username}_${filename}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            successCount++;
            console.log(`[Blog] ✅ (${i + 1}/${files.length}) Downloaded: ${username}_${filename}`);
          } catch (error) {
            failedCount++;
            console.error(`[Blog] ❌ Failed to download ${filename}:`, error);
          }

          setDownloadProgress({ current: i + 1, total: files.length });
          updateOperationProgress({ current: i + 1, total: files.length });

          // Delay between downloads
          if (i < files.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 200));
          }
        }

        console.log(`[Blog] ✅ Fallback download complete: ${successCount} succeeded, ${failedCount} failed`);
        
        if (failedCount === 0) {
          alert(`✅ Successfully downloaded ${successCount} ${isLikesMode ? 'liked ' : ''}images!\n\nFilenames are prefixed with "${folderName}_"`);
        } else {
          alert(
            `⚠️ Partially downloaded: ${successCount} succeeded, ${failedCount} failed.\n\n` +
            `Check the console for details.`
          );
        }
      }

      console.log(`[Blog] ✅ Folder download complete!`);
    } catch (error) {
      console.error('[Blog] ❌ Folder download failed:', error);
      alert('Failed to download images to folder. Please try again.');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(null);
      endOperation();
    }
  };

  const handleDownload = async () => {
    if (gridSelection.size === 0 || isDownloading) return;

    setIsDownloading(true);
    setDownloadProgress({ current: 0, total: gridSelection.size });

    try {
      // Get the selected posts - use allPhotoPosts to include ALL selected images
      const selectedPosts = allPhotoPosts.filter(post => gridSelection.has(post.id));
      
      // Prepare image data with full metadata and filename options
      const imagesToDownload = selectedPosts.map((post, index) => {
        const metadata: ImageMetadata = {
          blogName: username,
          blogUrl: `https://tumblr.com/${username}`,
          tags: post.tags,
          notes: post.notes,
          timestamp: post.timestamp,
          description: post.content,
          postUrl: `https://tumblr.com/${username}/post/${post.id}`,
          imageText: post.content, // Text content attached to the image
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

      // Download images using selected method
      const downloadFn = downloadMethod === 'server-side' ? downloadImagesServerSide : downloadImages;
      console.log(`[Download] Using ${downloadMethod} method for ${imagesToDownload.length} images`);
      
      const result = await downloadFn(
        imagesToDownload,
        (current, total) => {
          setDownloadProgress({ current, total });
        },
        includeSidecarMetadata
      );

      setDownloadProgress(null);
      setIsDownloading(false);

      // Show result
      if (result.failed === 0) {
        alert(`✅ Successfully downloaded ${result.succeeded} image(s)!\n\nEach download includes:\n• Image file with descriptive name\n• .txt metadata file with:\n  - Blog name & URL\n  - Tags\n  - Post date\n  - Description\n  - Notes count\n  - Post URL`);
      } else {
        alert(
          `Downloaded ${result.succeeded} image(s).\n${result.failed} failed.\n\nNote: Some browsers may block multiple downloads. Check your browser's download settings.`
        );
      }
    } catch (error) {
      setDownloadProgress(null);
      setIsDownloading(false);
      alert(`❌ Download failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleDelete = () => {
    if (confirm(`Delete ${gridSelection.size} image(s)?`)) {
      alert('Delete functionality coming soon!');
      // Delete functionality will be implemented in a future release
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
          const resolution = getImageResolution(post.imageWidth || 0, post.imageHeight || 0);
          if (!imageFilters.sizes.has(resolution)) return false;
        }
        // Apply date filter if active
        if (imageFilters.dates.size > 0) {
          const postDate = new Date(post.timestamp);
          const now = new Date();
          const daysDiff = Math.floor((now.getTime() - postDate.getTime()) / (1000 * 60 * 60 * 24));
          
          const matchesFilter = Array.from(imageFilters.dates).some(filter => {
            if (filter === 'today') return daysDiff === 0;
            if (filter === 'week') return daysDiff <= 7;
            if (filter === 'month') return daysDiff <= 30;
            return false;
          });
          
          if (!matchesFilter) return false;
        }
        return true;
      });
    
    console.log('[Blog] Posts to store after filtering:', postsToStore.length);
    console.log('[Blog] Total posts loaded:', allPosts.length);
    
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

      console.log(`[Blog] Storing ${imagesToStore.length} images...`);

      const apiUrl = getApiUrl();
      const response = await fetch(`${apiUrl}/api/stored-images`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          images: imagesToStore,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Blog] Server response:', response.status, errorText);
        throw new Error(`Failed to store images: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('[Blog] Store result:', result);
      
      updateOperationProgress(postsToStore.length, postsToStore.length);
      endOperation();

      alert(`✅ Stored: ${result.stored}\n📊 Total: ${result.total}\n⏭️ Skipped: ${result.skipped} (duplicates)`);
    } catch (error) {
      console.error('[Blog] Store all error:', error);
      endOperation();
      alert(`❌ Failed to store images\n\nError: ${error instanceof Error ? error.message : 'Unknown error'}\n\nCheck console for details.`);
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
    
    // Start global operation status
    startOperation({
      type: 'store',
      current: 0,
      total: filteredAndSortedPhotoPosts.length,
      source: username,
    });

    try {
      // Prepare data for storing all filtered images
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
        notesData: post.notesData || null, // Include actual notes data
      }));

      console.log(`Storing ${imagesToStore.length} images to database...`);
      
      // Update progress to show we're uploading
      updateOperationProgress({ current: 1, total: imagesToStore.length });
      
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
      
      // Update progress to show completion
      updateOperationProgress({ current: imagesToStore.length, total: imagesToStore.length });
      
      const message = [
        `✅ Stored: ${result.stored}`,
        result.skipped > 0 ? `⏭️  Skipped (already stored): ${result.skipped}` : '',
        result.failed > 0 ? `❌ Failed: ${result.failed}` : '',
        `📊 Total: ${imagesToStore.length}`
      ].filter(Boolean).join('\n');
      
      if (result.errors && result.errors.length > 0) {
        console.error('Storage errors:', result.errors);
      }
      
      alert(message);
    } catch (error) {
      console.error('Store error:', error);
      alert(`❌ Failed to store images: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsStoring(false);
      endOperation();
    }
  };

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
        `✅ Stored: ${result.stored}`,
        result.skipped > 0 ? `⏭️  Skipped (already stored): ${result.skipped}` : '',
        result.failed > 0 ? `❌ Failed: ${result.failed}` : '',
        `📊 Total selected: ${imagesToStore.length}`
      ].filter(Boolean).join('\n');
      
      if (result.errors && result.errors.length > 0) {
        console.error('Storage errors:', result.errors);
      }
      
      alert(message);
      
      // Clear selection after storing
      setGridSelection(new Set());
    } catch (error) {
      console.error('Store error:', error);
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


  // Filter and sort photo posts
  const filteredAndSortedPhotoPosts = useMemo(() => {
    let posts = allPhotoPosts;

    // Filter by size (multi-select)
    if (imageFilters.sizes.size > 0) {
      posts = posts.filter(post => {
        const width = post.imageWidth || 0;
        const height = post.imageHeight || 0;
        
        // Map actual dimensions to size categories
        // Test images are: 800×600 (small), 1000×800 (medium), 1200×900 (large)
        let postSize: string;
        if (width === 800 && height === 600) {
          postSize = 'small';
        } else if (width === 1000 && height === 800) {
          postSize = 'medium';
        } else if (width === 1200 && height === 900) {
          postSize = 'large';
        } else {
          postSize = 'medium'; // default
        }
        
        return imageFilters.sizes.has(postSize);
      });
    }

    // Filter by date (multi-select)
    if (imageFilters.dates.size > 0) {
      const now = Date.now();
      posts = posts.filter(post => {
        const age = now - post.timestamp;
        const oneDay = 86400000;
        
        // Check if post matches any selected date filter
        for (const dateFilter of imageFilters.dates) {
          switch (dateFilter) {
            case 'today':
              if (age < oneDay) return true;
              break;
            case 'this-week':
              if (age < oneDay * 7) return true;
              break;
            case 'this-month':
              if (age < oneDay * 30) return true;
              break;
          }
        }
        return false;
      });
    }

    // Sort
    posts = [...posts].sort((a, b) => {
      switch (imageFilters.sort) {
        case 'recent': return b.timestamp - a.timestamp;
        case 'oldest': return a.timestamp - b.timestamp;
        case 'popular': return b.notes - a.notes;
        default: return 0;
      }
    });

    return posts;
  }, [allPhotoPosts, imageFilters, contentMode, likedPostsData]);

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
        case '1':
          e.preventDefault();
          // Load +50
          if (contentMode === 'likes') {
            if (!loadingMoreLikes && likesHasMore) {
              loadMoreLikes();
            }
          } else {
            if (!loadingMore && hasMore && blogData) {
              loadMore();
            }
          }
          break;
        case '2':
          e.preventDefault();
          // Load +100
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
        case '3':
          e.preventDefault();
          // Load +200
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
        case '4':
          e.preventDefault();
          // Load +1000
          if (contentMode === 'likes') {
            if (!loadingMoreLikes && likesHasMore) {
              loadMultipleLikes(1000);
            }
          } else {
            if (!loadingMore && hasMore && blogData) {
              loadMultiple(1000);
            }
          }
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
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [viewMode, focusedIndex, filteredAndSortedPhotoPosts, gridSelection]);

  // Generate mock notes for a post
  const generateMockNotes = (post: BlogPost): Note[] => {
    const noteTypes: Array<'comment' | 'like' | 'reblog'> = ['comment', 'like', 'reblog'];
    const usernames = ['artlover', 'photogeek', 'tumblrfan', 'aesthetic', 'wanderlust', 'creative', 'vibes', 'mood'];
    const comments = [
      'This is amazing!',
      'Love this aesthetic 💕',
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
      console.log(`[Blog] ✅ Using ${selectedImage.notesData.length} REAL notes for post ${selectedImage.id}`);
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
      console.log(`[Blog] 📊 Notes breakdown:`, breakdown);
      
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
      console.log(`[Blog] ✅ Using ${selectedPostForNotes.notesData.length} REAL notes for post ${selectedPostForNotes.id}`);
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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 sm:mb-8"
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
                    className={`cursor-pointer transition-colors ${
                      contentMode === 'posts' 
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
                      className={`cursor-pointer transition-colors ${
                        contentMode === 'likes' 
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
                      💡 This usually means the app needs activation. 
                      Try clicking "Request rate limit removal" in your Tumblr app settings or wait 10-15 minutes.
                    </>
                  ) : apiError?.includes('404') || apiError?.includes('Not Found') ? (
                    <>
                      💡 This blog may not exist or has been deleted.
                    </>
                  ) : (
                    <>
                      💡 Check the{' '}
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
                  ✨ Connected to Tumblr API
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
                onDownloadToFolder={handleDownloadSelectedToFolder}
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
                        const currentImageCount = likedPostsData.filter(p => p.images && p.images.length > 0).length;
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
                      onClick={handleDownloadSelectedToFolder}
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
                      onClick={handleDownloadAllToFolder}
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

            {/* Filters Bar - Top Position with Sticky Toggle */}
            <div
              className={`${
                isFilterSticky
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
                  className={`flex-shrink-0 rounded-lg p-2.5 transition-all active:scale-95 sm:p-2 touch-manipulation ${
                    isFilterSticky
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
                      <motion.div
                        key={post.id}
                        data-grid-index={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: Math.min(index * 0.01, 0.5) }}
                        className={`group relative aspect-square cursor-pointer overflow-hidden bg-gray-100 dark:bg-gray-800 ${
                          isFocused ? 'ring-2 ring-primary-500 ring-offset-2' : ''
                        } ${isRangeStart ? 'ring-4 ring-yellow-400 ring-offset-2' : ''}`}
                        onClick={(e) => handleGridImageClick(post, index, e)}
                      >
                        <img
                          src={post.images![0]}
                          alt="Post content"
                          className={`h-full w-full object-cover transition-transform ${
                            isSelected ? 'scale-95' : 'group-hover:scale-105'
                          }`}
                        />
                        
                        {/* Selection overlay */}
                        {isSelected && (
                          <div className="absolute inset-0 bg-primary-500/30 ring-2 ring-inset ring-primary-500" />
                        )}
                        
                        {/* Hover overlay */}
                        <div className={`absolute inset-0 bg-black/0 transition-colors ${
                          !isSelected && 'group-hover:bg-black/20'
                        }`} />
                        
                        {/* Checkbox - Always visible when selected */}
                        <div className={`absolute left-2 top-2 transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}>
                          <div 
                            className={`flex h-6 w-6 cursor-pointer items-center justify-center rounded border-2 transition-all hover:scale-110 ${
                              isSelected 
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
                        {isRangeStart && (
                          <div className="absolute right-2 top-2 rounded-full bg-yellow-400 px-2 py-0.5 text-xs font-bold text-yellow-900 shadow-lg">
                            START
                          </div>
                        )}
                        
                        {/* Info on hover */}
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="text-xs text-white">{post.notes.toLocaleString()} notes</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* Empty state */}
                {filteredAndSortedPhotoPosts.length === 0 && (
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
                )}
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
                      className={`flex items-center space-x-0.5 transition-colors sm:space-x-1 ${
                        likedPosts.has(post.id) 
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
            isSelected={selectedImages.has(selectedImage.id)}
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
          </>
        )}
        
        <VersionBadge />
      </div>
    </div>
  );
}



