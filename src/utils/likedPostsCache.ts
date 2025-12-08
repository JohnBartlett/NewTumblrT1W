import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface LikedPostsCacheDB extends DBSchema {
    'liked-posts': {
        key: string; // Format: {username}:{offset}
        value: {
            data: any; // Raw API response
            timestamp: number;
            username: string;
            offset: number;
        };
    };
    'cache-metadata': {
        key: string; // username
        value: {
            username: string;
            totalCount: number;
            lastUpdated: number;
            lastTimestamp?: number;
        };
    };
}

const DB_NAME = 'tumblr-likes-cache';
const DB_VERSION = 1;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

let dbPromise: Promise<IDBPDatabase<LikedPostsCacheDB>> | null = null;

/**
 * Initialize the IndexedDB database
 */
async function getDB(): Promise<IDBPDatabase<LikedPostsCacheDB>> {
    if (!dbPromise) {
        dbPromise = openDB<LikedPostsCacheDB>(DB_NAME, DB_VERSION, {
            upgrade(db) {
                // Create object stores if they don't exist
                if (!db.objectStoreNames.contains('liked-posts')) {
                    db.createObjectStore('liked-posts');
                }
                if (!db.objectStoreNames.contains('cache-metadata')) {
                    db.createObjectStore('cache-metadata');
                }
            },
        });
    }
    return dbPromise;
}

/**
 * Check if cached data is still valid (not expired)
 */
function isCacheValid(timestamp: number): boolean {
    return Date.now() - timestamp < CACHE_TTL;
}

/**
 * Get cached liked posts for a specific offset
 */
export async function getCachedLikedPosts(
    username: string,
    offset: number
): Promise<any | null> {
    try {
        const db = await getDB();
        const key = `${username}:${offset}`;
        const cached = await db.get('liked-posts', key);

        if (cached && isCacheValid(cached.timestamp)) {
            console.log(`[Cache] Hit for ${username} offset ${offset}`);
            return cached.data;
        }

        console.log(`[Cache] Miss for ${username} offset ${offset}`);
        return null;
    } catch (error) {
        console.error('[Cache] Error reading from cache:', error);
        return null;
    }
}

/**
 * Cache liked posts data
 */
export async function cacheLikedPosts(
    username: string,
    offset: number,
    data: any
): Promise<void> {
    try {
        const db = await getDB();
        const key = `${username}:${offset}`;

        await db.put('liked-posts', {
            data,
            timestamp: Date.now(),
            username,
            offset,
        }, key);

        console.log(`[Cache] Stored data for ${username} offset ${offset}`);
    } catch (error) {
        console.error('[Cache] Error writing to cache:', error);
    }
}

/**
 * Get cache metadata for a user
 */
export async function getCacheMetadata(username: string): Promise<{
    totalCount: number;
    lastUpdated: number;
    lastTimestamp?: number;
} | null> {
    try {
        const db = await getDB();
        const metadata = await db.get('cache-metadata', username);

        if (metadata && isCacheValid(metadata.lastUpdated)) {
            console.log(`[Cache] Metadata hit for ${username}`);
            return metadata;
        }

        console.log(`[Cache] Metadata miss for ${username}`);
        return null;
    } catch (error) {
        console.error('[Cache] Error reading metadata:', error);
        return null;
    }
}

/**
 * Update cache metadata
 */
export async function updateCacheMetadata(
    username: string,
    totalCount: number,
    lastTimestamp?: number
): Promise<void> {
    try {
        const db = await getDB();

        await db.put('cache-metadata', {
            username,
            totalCount,
            lastUpdated: Date.now(),
            lastTimestamp,
        }, username);

        console.log(`[Cache] Updated metadata for ${username}`);
    } catch (error) {
        console.error('[Cache] Error updating metadata:', error);
    }
}

/**
 * Clear all cached data for a user (force refresh)
 */
export async function clearUserCache(username: string): Promise<void> {
    try {
        const db = await getDB();

        // Delete metadata
        await db.delete('cache-metadata', username);

        // Delete all posts for this user
        const tx = db.transaction('liked-posts', 'readwrite');
        const store = tx.objectStore('liked-posts');
        const allKeys = await store.getAllKeys();

        for (const key of allKeys) {
            if (key.startsWith(`${username}:`)) {
                await store.delete(key);
            }
        }

        await tx.done;
        console.log(`[Cache] Cleared all data for ${username}`);
    } catch (error) {
        console.error('[Cache] Error clearing cache:', error);
    }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(username: string): Promise<{
    cachedPages: number;
    totalSize: number;
    lastUpdated: number | null;
}> {
    try {
        const db = await getDB();
        const metadata = await db.get('cache-metadata', username);

        // Count cached pages
        const allKeys = await db.getAllKeys('liked-posts');
        const userKeys = allKeys.filter(key => key.startsWith(`${username}:`));

        return {
            cachedPages: userKeys.length,
            totalSize: 0, // We could calculate this if needed
            lastUpdated: metadata?.lastUpdated || null,
        };
    } catch (error) {
        console.error('[Cache] Error getting stats:', error);
        return {
            cachedPages: 0,
            totalSize: 0,
            lastUpdated: null,
        };
    }
}

/**
 * Clear all caches (for debugging/maintenance)
 */
export async function clearAllCaches(): Promise<void> {
    try {
        const db = await getDB();
        await db.clear('liked-posts');
        await db.clear('cache-metadata');
        console.log('[Cache] Cleared all caches');
    } catch (error) {
        console.error('[Cache] Error clearing all caches:', error);
    }
}
