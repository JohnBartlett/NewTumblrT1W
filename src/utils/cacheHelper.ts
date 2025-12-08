/**
 * Helper function to force refresh the cache
 * Call this from the browser console: window.refreshLikesCache('username')
 */
import { clearUserCache } from './likedPostsCache';

export async function refreshLikesCache(username: string): Promise<void> {
    console.log(`[Cache] Clearing cache for ${username}...`);
    await clearUserCache(username);
    console.log(`[Cache] Cache cleared! Reload the page to fetch fresh data.`);
    window.location.reload();
}

// Export to window for easy access
if (typeof window !== 'undefined') {
    (window as any).refreshLikesCache = refreshLikesCache;
}
