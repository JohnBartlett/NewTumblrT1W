import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import { useNavigate } from '@tanstack/react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { userAtom } from '@/store/auth';

// Dynamic API URL
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};
const API_URL = getApiUrl();

interface ApiStats {
  date: string;
  count: number;
  limit: number;
  percentage: number;
  resetTime: string;
}

interface UsageCapacity {
  viewBlog: number;          // How many blogs (50 images each)
  view500Images: number;     // How many times can view 500 images
  view1000Images: number;    // How many times can view 1000 images
  browse20Blogs: number;     // How many times can browse 20 different blogs
}

interface DatabaseStats {
  totalSize: number;
  databaseName: string;
  tables: Array<{
    name: string;
    totalSize: number;
    tableSize: number;
    indexesSize: number;
    rowCount: number;
  }>;
  breakdown: {
    storedImages: {
      metadata: number;
      notes: number;
      total: number;
    };
    users: number;
    preferences: number;
    posts: number;
    socialData: number;
    searchHistory: number;
    blogs: number;
    apiStats: number;
    other: number;
  };
}

export default function Admin() {
  const navigate = useNavigate();
  const [user] = useAtom(userAtom);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [dbStats, setDbStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [dbLoading, setDbLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbError, setDbError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setError(null);
      console.log('[Admin] Fetching stats from:', `${API_URL}/api/admin/stats`);
      const response = await fetch(`${API_URL}/api/admin/stats`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Admin] API error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch stats'}`);
      }

      const data = await response.json();
      console.log('[Admin] Stats received:', data);
      setStats(data);
      setError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[Admin] Error fetching stats:', errorMsg);
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const fetchDatabaseStats = async () => {
    if (!user?.id) return;

    try {
      setDbError(null);
      setDbLoading(true);
      console.log('[Admin] Fetching database stats from:', `${API_URL}/api/admin/database-stats`);
      const response = await fetch(`${API_URL}/api/admin/database-stats?adminId=${user.id}`);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Admin] Database stats API error:', response.status, errorText);
        throw new Error(`HTTP ${response.status}: ${errorText || 'Failed to fetch database stats'}`);
      }

      const data = await response.json();
      console.log('[Admin] Database stats received:', data);
      setDbStats(data);
      setDbError(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('[Admin] Error fetching database stats:', errorMsg);
      setDbError(errorMsg);
    } finally {
      setDbLoading(false);
    }
  };

  const resetCounter = async () => {
    if (!confirm('Reset API call counter to 0?')) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/reset`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to reset');
      alert('✅ Counter reset successfully');
      fetchStats();
    } catch (error) {
      console.error('[Admin] Error resetting counter:', error);
      alert('❌ Failed to reset counter');
    }
  };

  useEffect(() => {
    // Redirect if not logged in
    if (!user) {
      navigate({ to: '/auth', search: { mode: 'login' } });
      return;
    }

    fetchStats();
    fetchDatabaseStats(); // Fetch database stats on load
    // Refresh API stats every 60 seconds
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, [user, navigate]);

  // Helper function to format bytes to human-readable size
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading API stats...</p>
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <svg className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Failed to Load Stats
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  {error || 'Unable to connect to the API server'}
                </p>
                <div className="text-sm text-gray-500 dark:text-gray-500 font-mono bg-gray-100 dark:bg-gray-800 p-3 rounded">
                  API URL: {API_URL}/api/admin/stats
                </div>
              </div>
              <Button onClick={fetchStats} className="mt-4">
                <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusColor = (percentage: number) => {
    if (percentage < 50) return 'text-green-600 dark:text-green-400';
    if (percentage < 80) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getProgressColor = (percentage: number) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  // Calculate remaining capacity for common actions
  const calculateCapacity = (): UsageCapacity => {
    if (!stats) return { viewBlog: 0, view500Images: 0, view1000Images: 0, browse20Blogs: 0 };

    const remaining = stats.limit - stats.count;

    return {
      viewBlog: Math.floor(remaining / 2),           // 1 blog info + 1 posts = 2 calls
      view500Images: Math.floor(remaining / 11),     // 1 info + 10 posts = 11 calls
      view1000Images: Math.floor(remaining / 21),    // 1 info + 20 posts = 21 calls
      browse20Blogs: Math.floor(remaining / 40),     // 20 blogs × 2 calls = 40 calls
    };
  };

  const capacity = calculateCapacity();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor Tumblr API usage and system health
        </p>
      </div>

      {/* API Usage Card */}
      <Card>
        <CardHeader>
          <CardTitle>Tumblr API Usage</CardTitle>
          <CardDescription>
            Daily API call tracking for rate limit monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Main Counter */}
          <div className="text-center">
            <div className={`text-6xl font-bold ${getStatusColor(stats.percentage)}`}>
              {stats.count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
              of {stats.limit.toLocaleString()} daily limit
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
              <span>Usage</span>
              <span className={`font-semibold ${getStatusColor(stats.percentage)}`}>
                {stats.percentage.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full ${getProgressColor(stats.percentage)} transition-all duration-500`}
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Date
              </div>
              <div className="text-lg font-semibold">
                {new Date(stats.date).toLocaleDateString()}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Remaining
              </div>
              <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                {(stats.limit - stats.count).toLocaleString()}
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                Resets At
              </div>
              <div className="text-lg font-semibold">
                {stats.resetTime}
              </div>
            </div>
          </div>

          {/* Status Messages */}
          {stats.percentage >= 90 && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5"
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
                <div>
                  <div className="font-semibold text-red-900 dark:text-red-300">
                    ⚠️ Near Rate Limit
                  </div>
                  <div className="text-sm text-red-700 dark:text-red-400 mt-1">
                    You've used {stats.percentage.toFixed(1)}% of your daily API quota.
                    Consider reducing API calls or waiting for the reset.
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats.percentage >= 80 && stats.percentage < 90 && (
            <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="font-semibold text-yellow-900 dark:text-yellow-300">
                    Approaching Limit
                  </div>
                  <div className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                    You've used {stats.percentage.toFixed(1)}% of your daily quota.
                    Monitor usage carefully.
                  </div>
                </div>
              </div>
            </div>
          )}

          {stats.percentage < 50 && (
            <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <div className="font-semibold text-green-900 dark:text-green-300">
                    ✅ Healthy Usage
                  </div>
                  <div className="text-sm text-green-700 dark:text-green-400 mt-1">
                    You're at {stats.percentage.toFixed(1)}% of your daily quota. Plenty of headroom!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tumblr API Limits Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-blue-600 dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Tumblr API Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Daily Limit */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-blue-700 dark:text-blue-300">
                    📅 Daily Limit
                  </div>
                  <div className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded">
                    API Key
                  </div>
                </div>
                <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                  5,000
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  requests per day
                </div>
                <div className="mt-3 text-xs text-blue-700 dark:text-blue-300">
                  Resets at midnight ({stats.resetTime})
                </div>
              </div>

              {/* Hourly Limit */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-purple-700 dark:text-purple-300">
                    ⏰ Hourly Limit
                  </div>
                  <div className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 px-2 py-1 rounded">
                    API Key
                  </div>
                </div>
                <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                  1,000
                </div>
                <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  requests per hour
                </div>
                <div className="mt-3 text-xs text-purple-700 dark:text-purple-300">
                  Rolling 60-minute window
                </div>
              </div>

              {/* OAuth Info */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4 border border-green-200 dark:border-green-800 md:col-span-2">
                <div className="flex items-start gap-3">
                  <svg
                    className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                  <div className="flex-1">
                    <div className="font-semibold text-green-900 dark:text-green-300 mb-1">
                      💎 Upgrade to OAuth for Higher Limits
                    </div>
                    <div className="text-sm text-green-700 dark:text-green-400">
                      Connect your Tumblr account via OAuth to get much higher (or unlimited) rate limits.
                      Click "Connect Tumblr Account" in Settings to upgrade.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Remaining Capacity Section */}
          <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <svg
                className="h-5 w-5 text-indigo-600 dark:text-indigo-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                />
              </svg>
              What You Can Do Today (Remaining Capacity)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* View Single Blog */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    📸 View Blog (50 images)
                  </div>
                  <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    2 calls
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {capacity.viewBlog.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  blogs remaining
                </div>
              </div>

              {/* View 500 Images */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🖼️ View 500 Images
                  </div>
                  <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    11 calls
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {capacity.view500Images.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  times remaining
                </div>
              </div>

              {/* View 1000 Images */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🎨 View 1,000 Images
                  </div>
                  <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    21 calls
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {capacity.view1000Images.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  times remaining
                </div>
              </div>

              {/* Browse 20 Blogs */}
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    🌐 Browse 20 Blogs
                  </div>
                  <div className="text-xs bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded">
                    40 calls
                  </div>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {capacity.browse20Blogs.toLocaleString()}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  times remaining
                </div>
              </div>
            </div>

            {/* Explanation */}
            <div className="mt-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-sm text-blue-700 dark:text-blue-300">
                  <div className="font-semibold mb-2">💡 How API Calls Work:</div>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Each page of images (up to 50) = <strong>1 API call</strong></li>
                    <li>Fetching blog info/avatar = <strong>1 API call</strong></li>
                    <li>Viewing 500 images requires 10 pages + 1 blog info = <strong>11 calls total</strong></li>
                    <li>Using "Load All" on large blogs can use many calls quickly</li>
                    <li>Stored images don't use API calls when viewing (loaded from database)</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              size="sm"
              variant="outline"
              onClick={fetchStats}
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={resetCounter}
              className="border-red-500 text-red-600 hover:bg-red-50 dark:border-red-600 dark:text-red-400 dark:hover:bg-red-950"
            >
              <svg
                className="mr-2 h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Reset Counter
            </Button>
          </div>

          {/* Info */}
          <div className="text-xs text-gray-500 dark:text-gray-400">
            <p>
              <strong>Note:</strong> Counter tracks API calls to Tumblr since server start.
              Tumblr's actual rate limit may differ. Counter resets automatically at midnight.
              Auto-refreshes every 10 seconds.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Database Statistics Card */}
      <Card>
        <CardHeader>
          <CardTitle>Database Statistics</CardTitle>
          <CardDescription>
            Storage usage and table breakdown
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {dbLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading database statistics...</p>
            </div>
          ) : dbError ? (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="h-5 w-5 text-red-600 dark:text-red-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <div className="font-semibold text-red-900 dark:text-red-300">Failed to load database stats</div>
                  <div className="text-sm text-red-700 dark:text-red-400 mt-1">{dbError}</div>
                </div>
              </div>
            </div>
          ) : dbStats ? (
            <>
              {/* Total Database Size */}
              <div className="text-center">
                <div className="text-6xl font-bold text-blue-600 dark:text-blue-400">
                  {formatBytes(dbStats.totalSize)}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                  Total Database Size ({dbStats.databaseName})
                </div>
              </div>

              {/* Breakdown by Category */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                  </svg>
                  Storage Breakdown by Category
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Stored Images */}
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950 dark:to-indigo-950 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-2">
                      📸 Stored Images
                    </div>
                    <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                      {formatBytes(dbStats.breakdown.storedImages.total)}
                    </div>
                    <div className="mt-2 space-y-1 text-xs text-purple-700 dark:text-purple-300">
                      <div className="flex justify-between">
                        <span>Metadata:</span>
                        <span className="font-semibold">{formatBytes(dbStats.breakdown.storedImages.metadata)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Notes Data:</span>
                        <span className="font-semibold">{formatBytes(dbStats.breakdown.storedImages.notes)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Users */}
                  <div className="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-2">
                      👥 Users
                    </div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                      {formatBytes(dbStats.breakdown.users)}
                    </div>
                  </div>

                  {/* Preferences */}
                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div className="text-sm font-medium text-green-700 dark:text-green-300 mb-2">
                      ⚙️ Preferences
                    </div>
                    <div className="text-2xl font-bold text-green-900 dark:text-green-100">
                      {formatBytes(dbStats.breakdown.preferences)}
                    </div>
                  </div>

                  {/* Posts */}
                  <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <div className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-2">
                      📝 Posts
                    </div>
                    <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                      {formatBytes(dbStats.breakdown.posts)}
                    </div>
                  </div>

                  {/* Social Data */}
                  <div className="bg-gradient-to-br from-pink-50 to-rose-50 dark:from-pink-950 dark:to-rose-950 rounded-lg p-4 border border-pink-200 dark:border-pink-800">
                    <div className="text-sm font-medium text-pink-700 dark:text-pink-300 mb-2">
                      ❤️ Social Data
                    </div>
                    <div className="text-2xl font-bold text-pink-900 dark:text-pink-100">
                      {formatBytes(dbStats.breakdown.socialData)}
                    </div>
                    <div className="text-xs text-pink-600 dark:text-pink-400 mt-1">
                      Likes, Saves, Follows
                    </div>
                  </div>

                  {/* Blogs */}
                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950 dark:to-cyan-950 rounded-lg p-4 border border-teal-200 dark:border-teal-800">
                    <div className="text-sm font-medium text-teal-700 dark:text-teal-300 mb-2">
                      🌐 Blogs
                    </div>
                    <div className="text-2xl font-bold text-teal-900 dark:text-teal-100">
                      {formatBytes(dbStats.breakdown.blogs)}
                    </div>
                  </div>

                  {/* Search History */}
                  <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-950 dark:to-purple-950 rounded-lg p-4 border border-violet-200 dark:border-violet-800">
                    <div className="text-sm font-medium text-violet-700 dark:text-violet-300 mb-2">
                      🔍 Search History
                    </div>
                    <div className="text-2xl font-bold text-violet-900 dark:text-violet-100">
                      {formatBytes(dbStats.breakdown.searchHistory)}
                    </div>
                  </div>

                  {/* API Stats */}
                  <div className="bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900 dark:to-slate-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      📊 API Stats
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {formatBytes(dbStats.breakdown.apiStats)}
                    </div>
                  </div>

                  {/* Other */}
                  {dbStats.breakdown.other > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        📦 Other
                      </div>
                      <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                        {formatBytes(dbStats.breakdown.other)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Detailed Table Sizes */}
              <div className="pt-6 border-t border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <svg className="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Detailed Table Sizes
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Table Name
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rows
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Data
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Indexes
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Total
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {dbStats.tables.map((table) => (
                        <tr key={table.name} className="hover:bg-gray-50 dark:hover:bg-gray-750">
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                            {table.name}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                            {table.rowCount.toLocaleString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                            {formatBytes(table.tableSize)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right text-gray-600 dark:text-gray-400">
                            {formatBytes(table.indexesSize)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-gray-900 dark:text-gray-100">
                            {formatBytes(table.totalSize)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Refresh Button */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={fetchDatabaseStats}
                  disabled={dbLoading}
                >
                  <svg className="mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {dbLoading ? 'Refreshing...' : 'Refresh Database Stats'}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No database statistics available.</p>
              <Button size="sm" variant="outline" onClick={fetchDatabaseStats} className="mt-4">
                Load Database Stats
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

