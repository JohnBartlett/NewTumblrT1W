import { useQuery } from '@tanstack/react-query';

interface BlogStatsProps {
    blogName: string;
}

interface StatsResponse {
    storedCount: number;
    lastStoredTimestamp: string | null;
    totalPostsOnTumblr: number;
    newSinceLastDownload: number;
    hasMoreNew: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export function BlogStats({ blogName }: BlogStatsProps) {
    const { data: stats, isLoading, isError } = useQuery({
        queryKey: ['blogStats', blogName],
        queryFn: async () => {
            const response = await fetch(`${API_URL}/api/tumblr/blog/${blogName}/stats`, {
                credentials: 'include',
            });
            if (!response.ok) {
                throw new Error('Failed to fetch stats');
            }
            return response.json() as Promise<StatsResponse>;
        },
        staleTime: 0, // Always fetch fresh data
        refetchOnWindowFocus: true,
    });

    if (isLoading) {
        return <div className="h-4 w-16 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />;
    }

    if (isError || !stats) {
        return null;
    }

    return (
        <div className="mt-2 flex items-center space-x-3 text-xs">
            <div className="flex items-center text-gray-600 dark:text-gray-400" title="Downloaded Images">
                <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {stats.storedCount}
            </div>

            {stats.newSinceLastDownload > 0 && (
                <div className="flex items-center font-medium text-green-600 dark:text-green-400" title="New posts since last download">
                    <svg className="mr-1 h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {stats.newSinceLastDownload}{stats.hasMoreNew ? '+' : ''} new
                </div>
            )}
        </div>
    );
}
