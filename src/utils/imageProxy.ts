/**
 * Image Proxy Utility
 * Wraps Tumblr media URLs with the backend proxy to bypass connection issues.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

/**
 * Checks if a URL is a Tumblr media URL that needs proxying
 */
export function isTumblrMediaUrl(url: string): boolean {
    if (!url) return false;

    const tumblrHosts = [
        'media.tumblr.com',
        '64.media.tumblr.com',
        'assets.tumblr.com',
        'va.media.tumblr.com',
        'at.tumblr.com'
    ];

    try {
        const urlObj = new URL(url);
        return tumblrHosts.some(host => urlObj.hostname.endsWith(host));
    } catch (e) {
        return false;
    }
}

/**
 * Proxies a URL if it's from Tumblr, otherwise returns original
 */
export function getProxiedUrl(url: string): string {
    if (!url) return '';

    if (isTumblrMediaUrl(url)) {
        // If it's already a proxied URL, don't wrap it again
        if (url.includes('/api/tumblr/image-proxy')) {
            return url;
        }

        return `${API_URL}/api/tumblr/image-proxy?url=${encodeURIComponent(url)}`;
    }

    return url;
}

/**
 * Higher-order function to use in img src attributes
 */
export const withProxy = (url: string | undefined): string => {
    if (!url) return '';
    return getProxiedUrl(url);
};
