import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { VersionBadge } from '@/components/ui/VersionBadge';
import { Container } from '@/components/layouts';
import { useAuth } from '@/hooks/queries/useAuth';
import { getRecentBlogs, getRemainingBlogs, clearBlogHistory, loadBlogHistoryFromDatabase, type BlogVisit } from '@/utils/blogHistory';

const RECENT_BLOGS_LIMIT = 20;
const INFINITE_SCROLL_PAGE_SIZE = 20;

export default function Dashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  
  const [recentBlogs, setRecentBlogs] = useState<BlogVisit[]>([]);
  const [remainingBlogs, setRemainingBlogs] = useState<BlogVisit[]>([]);
  const [displayedBlogs, setDisplayedBlogs] = useState<BlogVisit[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  // Load blog history on mount and when returning to dashboard
  useEffect(() => {
    loadBlogHistory();
    
    // Reload history when window gains focus (in case blogs were visited in other tabs)
    const handleFocus = () => loadBlogHistory();
    window.addEventListener('focus', handleFocus);
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  const loadBlogHistory = async () => {
    try {
      // Load from database (with localStorage fallback)
      await loadBlogHistoryFromDatabase();
      
      // Get the loaded history
      const recent = getRecentBlogs(RECENT_BLOGS_LIMIT);
      const remaining = getRemainingBlogs(RECENT_BLOGS_LIMIT);
      
      setRecentBlogs(recent);
      setRemainingBlogs(remaining);
      setDisplayedBlogs(remaining.slice(0, INFINITE_SCROLL_PAGE_SIZE));
      setPage(0);
      setHasMore(remaining.length > INFINITE_SCROLL_PAGE_SIZE);
      
      console.log(`[Dashboard] Loaded ${recent.length} recent blogs, ${remaining.length} remaining`);
    } catch (error) {
      console.error('[Dashboard] Error loading blog history:', error);
      
      // Fallback to localStorage only
      const recent = getRecentBlogs(RECENT_BLOGS_LIMIT);
      const remaining = getRemainingBlogs(RECENT_BLOGS_LIMIT);
      
      setRecentBlogs(recent);
      setRemainingBlogs(remaining);
      setDisplayedBlogs(remaining.slice(0, INFINITE_SCROLL_PAGE_SIZE));
      setPage(0);
      setHasMore(remaining.length > INFINITE_SCROLL_PAGE_SIZE);
    }
  };

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        setIsInView(entries[0].isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => {
      if (loadMoreRef.current) {
        observer.unobserve(loadMoreRef.current);
      }
    };
  }, []);

  // Load more when in view
  useEffect(() => {
    if (isInView && hasMore) {
      loadMoreBlogs();
    }
  }, [isInView, hasMore]);

  const loadMoreBlogs = useCallback(() => {
    const nextPage = page + 1;
    const start = nextPage * INFINITE_SCROLL_PAGE_SIZE;
    const end = start + INFINITE_SCROLL_PAGE_SIZE;
    const newBlogs = remainingBlogs.slice(start, end);
    
    if (newBlogs.length > 0) {
      setDisplayedBlogs(prev => [...prev, ...newBlogs]);
      setPage(nextPage);
      setHasMore(end < remainingBlogs.length);
      console.log(`[Dashboard] Loaded page ${nextPage}, ${newBlogs.length} blogs`);
    } else {
      setHasMore(false);
    }
  }, [page, remainingBlogs]);

  const handleClearHistory = async () => {
    if (window.confirm('Clear all blog history? This cannot be undone.')) {
      await clearBlogHistory();
      await loadBlogHistory();
    }
  };

  const handleBlogClick = (blogName: string) => {
    navigate({ to: `/blog/${blogName}` });
  };

  const formatLastVisited = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    if (days < 30) return `${Math.floor(days / 7)}w ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  if (!currentUser) {
    return (
      <Container>
        <div className="flex min-h-[60vh] items-center justify-center">
          <Card>
            <CardContent className="p-8 text-center">
              <h2 className="mb-4 text-2xl font-bold">Welcome to Tumblr T3</h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Sign in to see your recently viewed blogs and explore Tumblr.
              </p>
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline"
                  onClick={() => navigate({ to: '/auth', search: { mode: 'login' } })}
                >
                  Log in
                </Button>
                <Button
                  onClick={() => navigate({ to: '/auth', search: { mode: 'register' } })}
                >
                  Sign up
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>
    );
  }

  const totalBlogs = recentBlogs.length + remainingBlogs.length;

  return (
    <Container>
      <div className="py-8">
        {/* Dashboard header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {totalBlogs === 0 ? (
                'No blog history yet. Visit blogs to see them here!'
              ) : (
                `${totalBlogs} blog${totalBlogs !== 1 ? 's' : ''} in history`
              )}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            {totalBlogs > 0 && (
              <Button variant="outline" size="sm" onClick={handleClearHistory}>
                Clear History
              </Button>
            )}
            <Button onClick={() => navigate({ to: '/search' })}>
              Search Blogs
            </Button>
          </div>
        </div>

        {totalBlogs === 0 ? (
          /* Empty state */
          <Card>
            <CardContent className="p-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <svg className="h-8 w-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">
                Start Exploring
              </h2>
              <p className="mb-6 text-gray-600 dark:text-gray-400">
                Search for blogs and they'll appear here for quick access
              </p>
              <Button onClick={() => navigate({ to: '/search' })}>
                Search Blogs
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Recent Blogs Section */}
            {recentBlogs.length > 0 && (
              <div className="mb-12">
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  Recently Viewed
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  <AnimatePresence mode="popLayout">
                    {recentBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.blogName}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ delay: index * 0.02 }}
                      >
                        <Card 
                          className="group cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-lg"
                          onClick={() => handleBlogClick(blog.blogName)}
                        >
                          <CardContent className="p-0">
                            {/* Blog Avatar */}
                            <div className="aspect-square w-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                              {blog.avatar ? (
                                <img
                                  src={blog.avatar}
                                  alt={blog.displayName || blog.blogName}
                                  className="h-full w-full object-cover transition-transform group-hover:scale-110"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                                  <span className="text-4xl font-bold text-white">
                                    {(blog.displayName || blog.blogName).charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                            </div>
                            
                            {/* Blog Info */}
                            <div className="p-3">
                              <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                {blog.displayName || blog.blogName}
                              </h3>
                              <p className="truncate text-xs text-gray-600 dark:text-gray-400">
                                @{blog.blogName}
                              </p>
                              <div className="mt-2 flex items-center justify-between text-xs text-gray-500 dark:text-gray-500">
                                <span>{formatLastVisited(blog.lastVisited)}</span>
                                <span>{blog.visitCount}x</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* Remaining Blogs - Infinite Scroll */}
            {remainingBlogs.length > 0 && (
              <div>
                <h2 className="mb-4 text-xl font-semibold text-gray-900 dark:text-white">
                  More Blogs
                  <span className="ml-2 text-sm font-normal text-gray-500">
                    ({remainingBlogs.length} total)
                  </span>
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <AnimatePresence mode="popLayout">
                    {displayedBlogs.map((blog, index) => (
                      <motion.div
                        key={blog.blogName}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.01 }}
                      >
                        <Card 
                          className="group cursor-pointer transition-all hover:scale-[1.01] hover:shadow-md"
                          onClick={() => handleBlogClick(blog.blogName)}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-3">
                              {/* Avatar */}
                              <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                                {blog.avatar ? (
                                  <img
                                    src={blog.avatar}
                                    alt={blog.displayName || blog.blogName}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-400 to-purple-500">
                                    <span className="text-lg font-bold text-white">
                                      {(blog.displayName || blog.blogName).charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                )}
                              </div>
                              
                              {/* Info */}
                              <div className="min-w-0 flex-1">
                                <h3 className="truncate font-semibold text-gray-900 dark:text-white">
                                  {blog.displayName || blog.blogName}
                                </h3>
                                <p className="truncate text-sm text-gray-600 dark:text-gray-400">
                                  @{blog.blogName}
                                </p>
                              </div>
                              
                              {/* Meta */}
                              <div className="flex flex-col items-end text-xs text-gray-500 dark:text-gray-500">
                                <span>{formatLastVisited(blog.lastVisited)}</span>
                                <span className="mt-1">{blog.visitCount} visit{blog.visitCount !== 1 ? 's' : ''}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Infinite scroll trigger */}
                <div
                  ref={loadMoreRef}
                  className="mt-8 flex justify-center"
                >
                  {hasMore && (
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Loading more blogs...
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      
      <VersionBadge />
    </Container>
  );
}
