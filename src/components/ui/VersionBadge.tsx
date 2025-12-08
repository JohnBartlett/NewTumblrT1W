import { useEffect, useState } from 'react';

interface ApiStats {
  date: string;
  count: number;
  remaining: number | null;
  limit: number;
  percentage: number;
  resetTime: string;
  source: 'tumblr' | 'internal' | 'fallback';
  lastUpdated: number | null;
  internalCount: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function VersionBadge() {
  const [apiStats, setApiStats] = useState<ApiStats | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Fetch API stats initially
    fetchApiStats();

    // Refresh every 30 seconds
    const interval = setInterval(fetchApiStats, 30000);

    return () => clearInterval(interval);
  }, []);

  const fetchApiStats = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/stats`);
      if (response.ok) {
        const data = await response.json();
        setApiStats(data);
      }
    } catch (error) {
      // Silently fail - stats are not critical
      console.debug('Failed to fetch API stats:', error);
    }
  };

  const getColorClass = (percentage: number) => {
    if (percentage < 50) return 'text-green-400';
    if (percentage < 75) return 'text-yellow-400';
    if (percentage < 90) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div
      className="fixed bottom-4 right-4 z-50 cursor-pointer rounded-lg bg-gray-800/90 backdrop-blur-sm dark:bg-gray-900/90 shadow-lg transition-all hover:bg-gray-800 dark:hover:bg-gray-900"
      onClick={() => setIsExpanded(!isExpanded)}
      title="Click to expand"
    >
      {isExpanded ? (
        // Expanded view
        <div className="px-4 py-3 space-y-2 min-w-[200px]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-gray-400">Version</span>
            <span className="text-xs font-mono text-gray-300 font-semibold">v1.1.0</span>
          </div>

          {apiStats && (
            <>
              <div className="border-t border-gray-700 pt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono text-gray-400">
                    {apiStats.source === 'tumblr' ? 'API Used' : 'API Tracked'}
                  </span>
                  <span className={`text-xs font-mono font-semibold ${getColorClass(apiStats.percentage)}`}>
                    {apiStats.count.toLocaleString()} / {apiStats.limit.toLocaleString()}
                  </span>
                </div>

                {apiStats.remaining !== null && (
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-mono text-gray-400">Remaining</span>
                    <span className={`text-xs font-mono font-semibold ${apiStats.remaining > 100 ? 'text-green-400' :
                        apiStats.remaining > 50 ? 'text-yellow-400' :
                          apiStats.remaining > 10 ? 'text-orange-400' :
                            'text-red-400'
                      }`}>
                      {apiStats.remaining.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${apiStats.percentage < 50 ? 'bg-green-500' :
                        apiStats.percentage < 75 ? 'bg-yellow-500' :
                          apiStats.percentage < 90 ? 'bg-orange-500' :
                            'bg-red-500'
                      }`}
                    style={{ width: `${Math.min(apiStats.percentage, 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[10px] font-mono text-gray-500">
                    {apiStats.percentage.toFixed(1)}%
                    {apiStats.source === 'tumblr' && ' (live)'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">
                    Resets: {apiStats.resetTime}
                  </span>
                </div>
              </div>
            </>
          )}

          <div className="text-[10px] text-gray-500 text-center pt-1 border-t border-gray-700">
            Click to collapse
          </div>
        </div>
      ) : (
        // Collapsed view
        <div className="px-3 py-1.5 flex items-center gap-2">
          <span className="text-xs font-mono text-gray-300">v1.1.0</span>
          {apiStats && (
            <>
              <span className="text-gray-600">•</span>
              {apiStats.remaining !== null ? (
                // Show remaining if we have real Tumblr data
                <span className={`text-xs font-mono font-semibold ${apiStats.remaining > 100 ? 'text-green-400' :
                    apiStats.remaining > 50 ? 'text-yellow-400' :
                      apiStats.remaining > 10 ? 'text-orange-400' :
                        'text-red-400'
                  }`}>
                  {apiStats.remaining} left
                </span>
              ) : (
                // Fall back to showing used count
                <span className={`text-xs font-mono font-semibold ${getColorClass(apiStats.percentage)}`}>
                  {apiStats.count}
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

