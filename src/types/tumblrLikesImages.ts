/**
 * TypeScript types for Tumblr Likes Images component
 * Focused on image-only display with pagination
 */

export interface TumblrLikedPostImage {
  /** Unique identifier for the image */
  id: string;
  /** Image URL */
  url: string;
  /** Image width */
  width: number;
  /** Image height */
  height: number;
  /** Original post ID */
  postId: number;
  /** Blog name that created the post */
  blogName: string;
  /** Timestamp when the post was liked */
  likedTimestamp: number;
  /** Tags from the original post */
  tags: string[];
  /** URL to the original Tumblr post */
  postUrl: string;
  /** Caption/text from the post */
  caption?: string;
  /** Post type (photo, text, etc.) */
  postType: string;
}

export interface TumblrLikesImagesPagination {
  /** Current pagination method */
  method: 'offset' | 'before';
  /** Current offset (0-1000) */
  offset?: number;
  /** Current before timestamp (for posts beyond 1000) */
  before?: number;
  /** Total liked posts count from API */
  totalLikedCount?: number;
  /** Whether there are more posts available */
  hasMore: boolean;
  /** Whether we've reached the offset limit (1000) */
  reachedOffsetLimit: boolean;
}

export interface TumblrLikesImagesState {
  /** Array of extracted images */
  images: TumblrLikedPostImage[];
  /** Current pagination state */
  pagination: TumblrLikesImagesPagination;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Timestamp history for navigation beyond offset limit */
  timestampHistory: number[];
}

