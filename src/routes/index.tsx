import { createRootRoute, createRoute, createRouter, ErrorComponent } from '@tanstack/react-router';

import { RootLayout } from '@/components/layouts/RootLayout';
import Dashboard from '@/features/dashboard/Dashboard';
import Profile from '@/features/profile/Profile';
import Settings from '@/features/settings/Settings';
import Search from '@/features/search/Search';
import Auth from '@/features/auth/Auth';
import { Blog } from '@/features/blog/Blog';
import { TagView } from '@/features/tag/TagView';
import { StoredImages } from '@/features/stored/StoredImages';
import { TumblrCallback } from '@/features/auth/TumblrCallback';
import Admin from '@/features/admin/Admin';

// Error boundary component
function RootErrorComponent({ error }: { error: Error }) {
  console.error('[Router] Uncaught error:', error);
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-lg shadow-xl p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg 
              className="h-8 w-8 text-red-500" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              An unexpected error occurred. Try refreshing the page or going back to the dashboard.
            </p>
            <details className="mb-4">
              <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                Error details
              </summary>
              <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-mono text-red-600 dark:text-red-400 mb-2">
                  {error.message}
                </p>
                {error.stack && (
                  <pre className="text-xs text-gray-600 dark:text-gray-400 overflow-auto max-h-64">
                    {error.stack}
                  </pre>
                )}
              </div>
            </details>
            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Define root route with error boundary
const rootRoute = createRootRoute({
  component: RootLayout,
  errorComponent: RootErrorComponent,
});

// Define child routes
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: Dashboard,
});

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/dashboard',
  component: Dashboard,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/profile',
  component: Profile,
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/settings',
  component: Settings,
});

const searchRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/search',
  component: Search,
});

const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth',
  component: Auth,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      mode: (search.mode as string) || 'login',
    };
  },
});

const blogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/blog/$username',
  component: Blog,
});

const tagRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/tag/$tag',
  component: TagView,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      scope: (search.scope as string) || 'all',
      blog: search.blog as string | undefined,
    };
  },
});

const storedImagesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/stored',
  component: StoredImages,
});

const tumblrCallbackRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/auth/tumblr/callback',
  component: TumblrCallback,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/admin',
  component: Admin,
});

// Create and export the router
const routeTree = rootRoute.addChildren([
  indexRoute,
  dashboardRoute,
  profileRoute,
  settingsRoute,
  searchRoute,
  authRoute,
  blogRoute,
  tagRoute,
  storedImagesRoute,
  tumblrCallbackRoute,
  adminRoute,
]);

export const router = createRouter({ 
  routeTree,
  defaultPreload: 'intent',
});

// Type-safe route definitions
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}