import { useState, useEffect } from 'react';
import { fetchBlogPosts, fetchBlogInfo, isApiConfigured, type TumblrPost, type TumblrNote, getTumblrConnectionStatus } from '@/services/api';

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
  notesData?: TumblrNote[];
  tags: string[];
  images?: string[];
  imageWidth?: number;
  imageHeight?: number;
}

interface BlogData {
  username: string;
  displayName: string;
  avatar?: string;
  description: string;
  followerCount: number;
  followingCount: number;
  postCount: number;
  likesCount?: number; // Total number of posts the blog has liked
  posts: BlogPost[];
}

/**
 * Extract image URLs from HTML content
 */
function extractImagesFromHtml(html: string): string[] {
  const images: string[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  // Find all <img> tags
  const imgElements = doc.querySelectorAll('img');
  imgElements.forEach((img) => {
    const src = img.getAttribute('src');
    if (src) {
      // Prefer higher resolution from srcset if available
      const srcset = img.getAttribute('srcset');
      if (srcset) {
        // Parse srcset and get the highest resolution image
        const srcsetParts = srcset.split(',').map(s => s.trim());
        const highestRes = srcsetParts[srcsetParts.length - 1].split(' ')[0];
        images.push(highestRes);
      } else {
        images.push(src);
      }
    }
  });

  return images;
}

/**
 * Convert Tumblr API post to our internal format
 */
function convertTumblrPost(post: TumblrPost): BlogPost {
  // For photo posts, prioritize caption (full text) over summary (truncated)
  // For text posts, use body (full content)
  // Summary is often truncated, so use it as last resort
  let content = '';
  if (post.type === 'photo') {
    // Photo posts: caption contains full text, summary is truncated
    content = post.caption || post.summary || '';
  } else if (post.type === 'text') {
    // Text posts: body contains full content
    content = post.body || post.summary || '';
  } else {
    // Other post types: try caption first, then body, then summary
    content = post.caption || post.body || post.summary || '';
  }

  const images: string[] = [];
  let imageWidth: number | undefined;
  let imageHeight: number | undefined;

  // Extract images from photo posts
  if (post.type === 'photo' && post.photos && post.photos.length > 0) {
    const photo = post.photos[0];
    images.push(photo.original_size.url);
    imageWidth = photo.original_size.width;
    imageHeight = photo.original_size.height;
  }

  // Extract images from HTML content (text posts, captions, etc.)
  if (post.body) {
    const htmlImages = extractImagesFromHtml(post.body);
    images.push(...htmlImages);
  }
  if (post.caption) {
    const htmlImages = extractImagesFromHtml(post.caption);
    images.push(...htmlImages);
  }

  // If we found HTML images but no dimensions, try to extract from first image
  if (images.length > 0 && !imageWidth && post.body) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(post.body, 'text/html');
    const firstImg = doc.querySelector('img');
    if (firstImg) {
      const width = firstImg.getAttribute('data-orig-width') || firstImg.getAttribute('width');
      const height = firstImg.getAttribute('data-orig-height') || firstImg.getAttribute('height');
      if (width) imageWidth = parseInt(width);
      if (height) imageHeight = parseInt(height);
    }
  }

  return {
    id: String(post.id),
    type: post.type === 'photo' ? 'photo' : post.type === 'quote' ? 'quote' : post.type === 'link' ? 'link' : 'text',
    content,
    timestamp: post.timestamp * 1000, // Convert to milliseconds
    notes: post.note_count,
    notesData: post.notes, // Pass through notes data if available
    tags: post.tags,
    images: images.length > 0 ? images : undefined,
    imageWidth,
    imageHeight,
  };
}

/**
 * Generate mock data as fallback
 */
function generateMockBlogData(username: string): BlogData {
  const isPhotoArchive = username === 'photoarchive';
  const postCount = isPhotoArchive ? 300 : 30;

  const allTags = [
    'photography', 'nature', 'landscape', 'travel', 'wanderlust',
    'aesthetic', 'vsco', 'art', 'beautiful', 'stunning',
    'sunset', 'mountains', 'ocean', 'cityscape', 'architecture',
    'minimalism', 'vintage', 'retro', 'mood', 'vibes',
  ];

  const normalizedBlog = username.toLowerCase().includes('.')
    ? username.toLowerCase()
    : `${username.toLowerCase()}.tumblr.com`;

  return {
    username,
    displayName: isPhotoArchive ? 'Photo Archive 📸' : (username.charAt(0).toUpperCase() + username.slice(1)),
    avatar: `${API_URL}/api/tumblr/blog/${normalizedBlog}/avatar/128`,
    description: isPhotoArchive
      ? 'A massive collection of curated photography from around the world.'
      : `This is ${username}'s blog. A collection of thoughts, photos, and creative content.`,
    followerCount: isPhotoArchive ? 45238 : Math.floor(Math.random() * 10000),
    followingCount: isPhotoArchive ? 892 : Math.floor(Math.random() * 1000),
    postCount: isPhotoArchive ? 8547 : Math.floor(Math.random() * 500) + 50,
    posts: Array.from({ length: postCount }, (_, i) => {
      const isPhoto = isPhotoArchive ? true : (Math.random() > 0.4);
      const tags = Array.from({ length: Math.floor(Math.random() * 4) + 2 }, () =>
        allTags[Math.floor(Math.random() * allTags.length)]
      );

      return {
        id: `post-${i}`,
        type: isPhoto ? 'photo' : 'text',
        content: isPhoto ? '' : `This is post #${i + 1} from ${username}`,
        timestamp: Date.now() - (i * 86400000), // Days ago
        notes: Math.floor(Math.random() * 10000),
        tags,
        images: isPhoto ? [`https://picsum.photos/800/600?random=${i}`] : undefined,
        imageWidth: 800,
        imageHeight: 600,
      };
    }),
  };
}

/**
 * Hook to fetch Tumblr blog data
 */
export function useTumblrBlog(blogIdentifier: string, userId?: string) {
  const [blogData, setBlogData] = useState<BlogData | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function fetchBlog() {
      setLoading(true);
      setError(null);

      // Check if API is configured
      if (!isApiConfigured()) {
        console.log('[useTumblrBlog] API not configured, using mock data');
        if (mounted) {
          setBlogData(generateMockBlogData(blogIdentifier));
          setUsingMockData(true);
          setLoading(false);
        }
        return;
      }

      try {
        // Check OAuth status once and get user blog name
        let hasOAuth = false;
        let userBlogName: string | undefined;
        if (userId) {
          const status = await getTumblrConnectionStatus(userId);
          hasOAuth = status?.connected || false;
          userBlogName = status?.tumblrUsername;
        }

        // Fetch posts with notes_info=true to get real notes data!
        const postsResponse = await fetchBlogPosts(blogIdentifier, {
          limit: 50,
          type: undefined,
          notes_info: true  // This gets us up to 50 notes per post!
        });

        if (!mounted) return;

        if (!postsResponse) {
          throw new Error('No response from API');
        }

        // fetchBlogPosts now handles all error cases and throws with full details
        // So if we reach here, we have a successful response

        // Fetch blog info separately (with OAuth if available)
        const infoResponse = await fetchBlogInfo(blogIdentifier, userId);
        const info = infoResponse || postsResponse.response.blog;

        // Log the full info response for debugging
        console.log(`[useTumblrBlog] Blog info response:`, info);
        console.log(`[useTumblrBlog] Info keys:`, Object.keys(info || {}));

        // Use actual Tumblr blog avatar via backend proxy (avoids CORS issues)
        const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
          ? blogIdentifier.toLowerCase()
          : `${blogIdentifier.toLowerCase()}.tumblr.com`;
        const avatarUrl = `${API_URL}/api/tumblr/blog/${normalizedBlog}/avatar/128`;

        // Check if we got notes data
        const firstPostWithNotes = postsResponse.response.posts.find(p => p.notes && p.notes.length > 0);
        if (firstPostWithNotes) {
          console.log(`[useTumblrBlog] ✅ Got real notes! Total: ${firstPostWithNotes.notes?.length}`);
          console.log(`[useTumblrBlog] Sample note structure:`, JSON.stringify(firstPostWithNotes.notes?.[0], null, 2));
        } else {
          console.log(`[useTumblrBlog] ⚠️ No notes data in response. First post:`, postsResponse.response.posts[0]);
        }

        const totalPosts = info?.posts || postsResponse.response.total_posts || 0;

        // Fetch follower/following counts ONLY using the dedicated endpoints (not from blog info API)
        let followerCount = -1; // -1 means "not available"
        let followingCount = -1;

        // Only fetch counts if OAuth is connected AND we're viewing the user's own blog
        if (hasOAuth && userId && userBlogName) {
          const normalizedUserBlog = userBlogName.includes('.')
            ? userBlogName.toLowerCase()
            : `${userBlogName.toLowerCase()}.tumblr.com`;
          const normalizedCurrentBlog = blogIdentifier.toLowerCase().includes('.')
            ? blogIdentifier.toLowerCase()
            : `${blogIdentifier.toLowerCase()}.tumblr.com`;

          // If viewing your own blog, fetch follower/following counts using dedicated endpoints
          if (normalizedCurrentBlog === normalizedUserBlog) {
            try {
              console.log(`[useTumblrBlog] Viewing own blog, fetching follower/following counts from dedicated endpoints...`);

              // Get followers count (blogs following you) - using /blog/{blog}/followers endpoint
              const followersResponse = await fetch(`${API_URL}/api/tumblr/blog/${normalizedCurrentBlog}/followers?userId=${userId}&limit=1&offset=0`);
              if (followersResponse.ok) {
                const followersData = await followersResponse.json();
                console.log(`[useTumblrBlog] Followers response:`, followersData);
                // Tumblr API returns total_users field in response
                followerCount = followersData?.response?.total_users ??
                  (followersData?.response?.users?.length || 0);
                console.log(`[useTumblrBlog] ✅ Got followers count: ${followerCount}`);
              } else {
                console.warn(`[useTumblrBlog] Failed to fetch followers: ${followersResponse.status}`);
              }

              // Get following count (blogs you follow) - using /user/following endpoint
              const followingResponse = await fetch(`${API_URL}/api/tumblr/user/following?userId=${userId}&limit=1&offset=0`);
              if (followingResponse.ok) {
                const followingData = await followingResponse.json();
                console.log(`[useTumblrBlog] Following response:`, followingData);
                // Tumblr API returns total_blogs field in response
                followingCount = followingData?.response?.total_blogs ??
                  (followingData?.response?.blogs?.length || 0);
                console.log(`[useTumblrBlog] ✅ Got following count: ${followingCount}`);
              } else {
                console.warn(`[useTumblrBlog] Failed to fetch following: ${followingResponse.status}`);
              }
            } catch (countError) {
              console.error('[useTumblrBlog] Error fetching follower/following counts:', countError);
            }
          } else {
            console.log(`[useTumblrBlog] Viewing other user's blog (${normalizedCurrentBlog} vs ${normalizedUserBlog}), counts not available`);
          }
        } else {
          console.log(`[useTumblrBlog] Cannot fetch follower/following counts: hasOAuth=${hasOAuth}, userId=${!!userId}, userBlogName=${!!userBlogName}`);
        }

        const blogData: BlogData = {
          username: blogIdentifier,
          displayName: info?.title || blogIdentifier,
          avatar: avatarUrl,
          description: info?.description || '',
          followerCount,
          followingCount,
          postCount: totalPosts,
          likesCount: info?.likes !== undefined ? info.likes : undefined, // Total posts liked by this blog
          posts: postsResponse.response.posts.map(convertTumblrPost),
        };

        setBlogData(blogData);
        setUsingMockData(false);
        setOffset(50); // We loaded the first 50
        setHasMore(50 < totalPosts); // Check if there are more posts
        console.log(`[useTumblrBlog] Loaded ${blogData.posts.length} posts from ${blogIdentifier} (total: ${totalPosts})`);
      } catch (err) {
        console.error('[useTumblrBlog] Error fetching blog:', err);
        if (mounted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load blog';

          // Determine if blog is truly inaccessible (vs temporary API issues)
          const isInaccessible =
            errorMessage.includes('[404]') || errorMessage.includes('Not Found') || errorMessage.includes('does not exist') ||
            errorMessage.includes('[403]') || errorMessage.includes('Forbidden') ||
            errorMessage.includes('[401]') || errorMessage.includes('Unauthorized') ||
            errorMessage.includes('Code: 4012') || errorMessage.includes('only viewable within') ||
            errorMessage.includes('dashboard only') || errorMessage.includes('restricted');

          if (isInaccessible) {
            // Blog is inaccessible - show header info but no posts
            console.log(`[useTumblrBlog] Blog ${blogIdentifier} is inaccessible:`, errorMessage);

            // Try to fetch blog info to show the header
            const infoResponse = await fetchBlogInfo(blogIdentifier);

            // Create blog data with info but NO posts
            const normalizedBlog = blogIdentifier.toLowerCase().includes('.')
              ? blogIdentifier.toLowerCase()
              : `${blogIdentifier.toLowerCase()}.tumblr.com`;
            const blogDataWithoutPosts: BlogData = {
              username: blogIdentifier,
              displayName: infoResponse?.blog?.title || blogIdentifier,
              avatar: `${API_URL}/api/tumblr/blog/${normalizedBlog}/avatar/128`,
              description: infoResponse?.blog?.description || 'This blog is not accessible.',
              followerCount: 0,
              followingCount: 0,
              postCount: infoResponse?.blog?.posts || 0,
              likesCount: infoResponse?.blog?.likes !== undefined ? infoResponse.blog.likes : undefined,
              posts: [], // NO POSTS - this is the key difference
            };

            setBlogData(blogDataWithoutPosts);
            setUsingMockData(false);
            setError(errorMessage);
          } else {
            // Temporary errors (rate limit, network issues, API key not configured) - fall back to mock data
            const isRateLimit = errorMessage.includes('Rate limit') || errorMessage.includes('429') || errorMessage.includes('Too many requests');

            if (isRateLimit) {
              console.warn(`[useTumblrBlog] ⚠️ RATE LIMITED - Using mock data temporarily. Please wait a few minutes before refreshing.`);
              setError('⚠️ Rate limit exceeded. Tumblr is temporarily limiting requests. Showing sample data. Please try again in a few minutes.');
            } else {
              console.log(`[useTumblrBlog] Temporary error, using mock data:`, errorMessage);
              setError(errorMessage);
            }

            setBlogData(generateMockBlogData(blogIdentifier));
            setUsingMockData(true);
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    fetchBlog();

    return () => {
      mounted = false;
    };
  }, [blogIdentifier, userId]);

  // Function to load more posts
  const loadMore = async () => {
    if (loadingMore || !hasMore || usingMockData || !blogData) return;

    setLoadingMore(true);
    try {
      const postsResponse = await fetchBlogPosts(blogIdentifier, {
        limit: 50,
        offset,
        type: undefined,
        notes_info: true,
      });

      if (postsResponse && postsResponse.meta.status === 200) {
        const newPosts = postsResponse.response.posts.map(convertTumblrPost);

        setBlogData(prev => {
          if (!prev) return null;
          const existingIds = new Set(prev.posts.map(p => p.id));
          const uniqueNewPosts = newPosts.filter(p => !existingIds.has(p.id));
          return {
            ...prev,
            posts: [...prev.posts, ...uniqueNewPosts],
          };
        });

        const newOffset = offset + 50;
        setOffset(newOffset);
        setHasMore(newOffset < blogData.postCount);

        console.log(`[useTumblrBlog] Loaded ${newPosts.length} more posts (total: ${blogData.posts.length + newPosts.length}/${blogData.postCount})`);
      }
    } catch (err) {
      console.error('[useTumblrBlog] Error loading more posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load more posts');
    } finally {
      setLoadingMore(false);
    }
  };

  // Function to load a specific number of posts (e.g., 100, 200)
  // Returns the updated posts array after loading
  const loadMultiple = async (count: number): Promise<BlogPost[]> => {
    if (loadingMore || !hasMore || usingMockData || !blogData) {
      return blogData?.posts || [];
    }

    setLoadingMore(true);
    try {
      const remaining = blogData.postCount - blogData.posts.length;
      const toLoad = Math.min(count, remaining);
      console.log(`[useTumblrBlog] Loading ${toLoad} posts...`);

      // Load in batches of 50, tracking offset internally
      const allNewPosts: BlogPost[] = [];
      let currentOffset = offset;
      const batches = Math.ceil(toLoad / 50);

      for (let i = 0; i < batches; i++) {
        const postsResponse = await fetchBlogPosts(blogIdentifier, {
          limit: 50,
          offset: currentOffset,
          type: undefined,
          notes_info: true,
        });

        if (postsResponse && postsResponse.meta.status === 200) {
          const transformed = postsResponse.response.posts.map(convertTumblrPost);
          allNewPosts.push(...transformed);
          currentOffset += 50;

          // Update progress
          console.log(`[useTumblrBlog] Progress: ${allNewPosts.length}/${toLoad} posts loaded...`);
        } else {
          break;
        }
      }

      // Combine existing posts with newly loaded posts (avoiding duplicates)
      const existingIds = new Set(blogData.posts.map(p => p.id));
      const filteredNewPosts = allNewPosts.filter(p => !existingIds.has(p.id));
      const allPosts = [...blogData.posts, ...filteredNewPosts];

      setBlogData(prev => prev ? {
        ...prev,
        posts: allPosts,
      } : null);

      setOffset(currentOffset);
      setHasMore(currentOffset < blogData.postCount);

      console.log(`[useTumblrBlog] ✅ Loaded ${filteredNewPosts.length} new posts! Total: ${allPosts.length}`);

      // Return the complete posts array directly
      return allPosts;
    } catch (err) {
      console.error('[useTumblrBlog] Error loading posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load posts');
      return blogData?.posts || [];
    } finally {
      setLoadingMore(false);
    }
  };

  // Function to load ALL remaining posts
  // Returns the complete posts array after loading (to avoid React state timing issues)
  const loadAll = async (): Promise<BlogPost[]> => {
    if (loadingMore || !hasMore || usingMockData || !blogData) {
      return blogData?.posts || [];
    }

    setLoadingMore(true);
    try {
      const remaining = blogData.postCount - blogData.posts.length;
      console.log(`[useTumblrBlog] Loading all remaining ${remaining} posts...`);

      // Load in batches of 50
      const allNewPosts: BlogPost[] = [];
      let currentOffset = offset;

      while (currentOffset < blogData.postCount) {
        const postsResponse = await fetchBlogPosts(blogIdentifier, {
          limit: 50,
          offset: currentOffset,
          type: undefined,
          notes_info: true,
        });

        if (postsResponse && postsResponse.meta.status === 200) {
          const transformed = postsResponse.response.posts.map(convertTumblrPost);
          allNewPosts.push(...transformed);
          currentOffset += 50;

          // Update progress
          console.log(`[useTumblrBlog] Progress: ${allNewPosts.length}/${remaining} posts loaded...`);
        } else {
          break;
        }
      }

      // Combine existing posts with newly loaded posts (avoiding duplicates)
      const existingIds = new Set(blogData.posts.map(p => p.id));
      const filteredNewPosts = allNewPosts.filter(p => !existingIds.has(p.id));
      const allPosts = [...blogData.posts, ...filteredNewPosts];

      setBlogData(prev => prev ? {
        ...prev,
        posts: allPosts,
      } : null);

      setOffset(currentOffset);
      setHasMore(false);

      console.log(`[useTumblrBlog] ✅ Loaded all ${filteredNewPosts.length} new posts! Total: ${allPosts.length}`);

      // Return the complete posts array directly
      return allPosts;
    } catch (err) {
      console.error('[useTumblrBlog] Error loading all posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to load all posts');
      return blogData?.posts || [];
    } finally {
      setLoadingMore(false);
    }
  };

  return { blogData, loading, loadingMore, error, usingMockData, hasMore, loadMore, loadMultiple, loadAll };
}

