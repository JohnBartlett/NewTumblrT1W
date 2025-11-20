/**
 * Blog visit history tracking utility
 * Stores blog visits in database (persists across server restarts)
 * with localStorage cache for quick access
 */

export interface BlogVisit {
  blogName: string;
  displayName?: string;
  avatar?: string;
  lastVisited: number; // timestamp
  visitCount: number;
}

const STORAGE_KEY = 'tumblr_blog_history';
const MAX_HISTORY = 100; // Keep last 100 blogs in history
const SYNC_DEBOUNCE_MS = 2000; // Debounce sync calls

let syncTimeout: NodeJS.Timeout | null = null;

/**
 * Get API URL
 */
function getApiUrl(): string {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
}

/**
 * Migrate old Tumblr API avatar URLs to use backend proxy
 */
function migrateAvatarUrl(avatarUrl?: string): string | undefined {
  if (!avatarUrl) return undefined;
  
  // Check if it's an old direct Tumblr API URL
  if (avatarUrl.startsWith('https://api.tumblr.com/v2/blog/')) {
    const API_URL = getApiUrl();
    // Extract the path after /v2/blog/
    const match = avatarUrl.match(/https:\/\/api\.tumblr\.com\/v2\/blog\/(.+)/);
    if (match) {
      const newUrl = `${API_URL}/api/tumblr/blog/${match[1]}`;
      console.log(`[BlogHistory] Migrated avatar URL: ${avatarUrl} → ${newUrl}`);
      return newUrl;
    }
  }
  
  return avatarUrl;
}

/**
 * Get all blog visits from localStorage
 */
export function getBlogHistory(): BlogVisit[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    
    let history = JSON.parse(stored) as BlogVisit[];
    
    // Migrate old avatar URLs to use backend proxy
    let needsUpdate = false;
    history = history.map(visit => {
      const oldAvatar = visit.avatar;
      const newAvatar = migrateAvatarUrl(visit.avatar);
      if (oldAvatar !== newAvatar) {
        needsUpdate = true;
      }
      return {
        ...visit,
        avatar: newAvatar
      };
    });
    
    // Save migrated history back to localStorage
    if (needsUpdate) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
      console.log('[BlogHistory] Migrated avatar URLs to use backend proxy');
    }
    
    // Sort by last visited (most recent first)
    return history.sort((a, b) => b.lastVisited - a.lastVisited);
  } catch (error) {
    console.error('[BlogHistory] Error loading history:', error);
    return [];
  }
}

/**
 * Get current user ID from localStorage (assumes user is logged in)
 */
function getCurrentUserId(): string | null {
  try {
    const userStr = localStorage.getItem('currentUser');
    if (!userStr) return null;
    const user = JSON.parse(userStr);
    return user?.id || null;
  } catch {
    return null;
  }
}

/**
 * Load blog history from database
 */
export async function loadBlogHistoryFromDatabase(): Promise<BlogVisit[]> {
  try {
    const userId = getCurrentUserId();
    if (!userId) {
      console.log('[BlogHistory] No user logged in, using localStorage only');
      return getBlogHistory();
    }

    const API_URL = getApiUrl();
    const response = await fetch(`${API_URL}/api/users/${userId}/blog-visits?limit=${MAX_HISTORY}`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const dbVisits = await response.json();
    
    // Convert database format to local format
    const visits: BlogVisit[] = dbVisits.map((v: any) => ({
      blogName: v.blogName,
      displayName: v.displayName,
      avatar: v.avatar,
      lastVisited: new Date(v.lastVisited).getTime(),
      visitCount: v.visitCount,
    }));

    // Save to localStorage as cache
    localStorage.setItem(STORAGE_KEY, JSON.stringify(visits));
    
    console.log(`[BlogHistory] Loaded ${visits.length} visits from database`);
    return visits;
  } catch (error) {
    console.error('[BlogHistory] Error loading from database:', error);
    return getBlogHistory(); // Fallback to localStorage
  }
}

/**
 * Sync blog visit to database (debounced)
 */
async function syncToDatabase(blogName: string, displayName?: string, avatar?: string): Promise<void> {
  const userId = getCurrentUserId();
  if (!userId) return;

  try {
    const API_URL = getApiUrl();
    await fetch(`${API_URL}/api/users/${userId}/blog-visits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ blogName, displayName, avatar }),
    });
    console.log(`[BlogHistory] Synced visit to @${blogName} to database`);
  } catch (error) {
    console.error('[BlogHistory] Error syncing to database:', error);
  }
}

/**
 * Track a blog visit (saves to both localStorage and database)
 */
export function trackBlogVisit(blogName: string, displayName?: string, avatar?: string): void {
  try {
    const history = getBlogHistory();
    
    // Normalize blog name to lowercase to avoid duplicates with different capitalization
    const normalizedBlogName = blogName.toLowerCase();
    
    // Find existing visit (case-insensitive comparison)
    const existingIndex = history.findIndex(v => v.blogName.toLowerCase() === normalizedBlogName);
    
    if (existingIndex >= 0) {
      // Update existing visit (keep normalized name)
      history[existingIndex] = {
        ...history[existingIndex],
        blogName: normalizedBlogName, // Ensure it's normalized
        displayName: displayName || history[existingIndex].displayName,
        avatar: avatar || history[existingIndex].avatar,
        lastVisited: Date.now(),
        visitCount: history[existingIndex].visitCount + 1,
      };
    } else {
      // Add new visit (use normalized name)
      history.push({
        blogName: normalizedBlogName,
        displayName,
        avatar,
        lastVisited: Date.now(),
        visitCount: 1,
      });
    }
    
    // Sort by last visited and keep only MAX_HISTORY items
    const sortedHistory = history
      .sort((a, b) => b.lastVisited - a.lastVisited)
      .slice(0, MAX_HISTORY);
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedHistory));
    
    console.log(`[BlogHistory] Tracked visit to @${blogName} (${sortedHistory.length} blogs in history)`);
    
    // Sync to database (debounced)
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }
    syncTimeout = setTimeout(() => {
      syncToDatabase(normalizedBlogName, displayName, avatar);
    }, SYNC_DEBOUNCE_MS);
  } catch (error) {
    console.error('[BlogHistory] Error tracking visit:', error);
  }
}

/**
 * Get recently viewed blogs (top N)
 */
export function getRecentBlogs(limit: number = 20): BlogVisit[] {
  const history = getBlogHistory();
  return history.slice(0, limit);
}

/**
 * Get all blogs except recent ones (for infinite scroll)
 */
export function getRemainingBlogs(skipRecent: number = 20): BlogVisit[] {
  const history = getBlogHistory();
  return history.slice(skipRecent);
}

/**
 * Clear blog history (both localStorage and database)
 */
export async function clearBlogHistory(): Promise<void> {
  try {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEY);
    
    // Clear database
    const userId = getCurrentUserId();
    if (userId) {
      const API_URL = getApiUrl();
      await fetch(`${API_URL}/api/users/${userId}/blog-visits`, {
        method: 'DELETE',
      });
      console.log('[BlogHistory] History cleared from database');
    }
    
    console.log('[BlogHistory] History cleared');
  } catch (error) {
    console.error('[BlogHistory] Error clearing history:', error);
  }
}

/**
 * Remove a specific blog from history
 */
export function removeBlogFromHistory(blogName: string): void {
  try {
    const history = getBlogHistory();
    const normalizedBlogName = blogName.toLowerCase();
    const filtered = history.filter(v => v.blogName.toLowerCase() !== normalizedBlogName);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    console.log(`[BlogHistory] Removed @${blogName} from history`);
  } catch (error) {
    console.error('[BlogHistory] Error removing blog:', error);
  }
}

