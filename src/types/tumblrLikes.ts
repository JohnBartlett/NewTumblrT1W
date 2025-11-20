/**
 * TypeScript types for Tumblr Likes API responses and pagination
 */

export interface TumblrLikedPost {
  blog_name: string;
  blog_uuid?: string;
  id: number;
  post_url: string;
  type: string;
  timestamp: number;
  date: string;
  format: string;
  reblog_key: string;
  tags: string[];
  liked_timestamp: number;
  note_count: number;
  title?: string;
  body?: string;
  summary?: string;
  photos?: Array<{
    caption?: string;
    original_size: {
      url: string;
      width: number;
      height: number;
    };
    alt_sizes?: Array<{
      url: string;
      width: number;
      height: number;
    }>;
  }>;
  // Other post types may have different structures
  [key: string]: any;
}

export interface TumblrLikesResponse {
  meta: {
    status: number;
    msg: string;
  };
  response: {
    liked_posts: TumblrLikedPost[];
    liked_count: number;
  };
}

export type PaginationMethod = 'offset' | 'before' | 'after';

export interface PaginationState {
  method: PaginationMethod;
  offset?: number;
  before?: number;
  after?: number;
  currentPage: number;
  postsPerPage: number;
  totalLikedCount?: number;
}

export interface TimestampCache {
  [page: number]: number; // page number -> timestamp
}

export interface LikedImage {
  id: string;
  url: string;
  width: number;
  height: number;
  postId: number;
  blogName: string;
  likedTimestamp: number;
  tags: string[];
  postUrl: string;
  caption?: string;
}

export interface PaginationControls {
  hasPrevious: boolean;
  hasNext: boolean;
  currentPage: number;
  totalPages?: number;
  canJumpToPage: boolean; // true if within offset limit (0-1000)
}

