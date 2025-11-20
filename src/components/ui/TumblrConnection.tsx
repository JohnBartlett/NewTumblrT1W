import { useState, useEffect } from 'react';
import { useAtom } from 'jotai';
import { userAtom } from '@/store/auth';
import { 
  getTumblrConnectionStatus, 
  connectTumblrAccount, 
  disconnectTumblrAccount,
  type TumblrConnectionStatus 
} from '@/services/api';
import { Button } from './Button';
import { Card } from './Card';

export function TumblrConnection() {
  const [user] = useAtom(userAtom);
  const [status, setStatus] = useState<TumblrConnectionStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (user?.id) {
      checkStatus();
    }
  }, [user?.id]);

  const checkStatus = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    const data = await getTumblrConnectionStatus(user.id);
    setStatus(data);
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!user?.id) return;
    
    setConnecting(true);
    
    try {
      const result = await connectTumblrAccount(user.id);
      
      if (result?.authUrl) {
        // Open Tumblr authorization in popup
        const width = 600;
        const height = 700;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        
        const authWindow = window.open(
          result.authUrl,
          'Tumblr Authorization',
          `width=${width},height=${height},left=${left},top=${top}`
        );
        
        // Store request token for callback
        localStorage.setItem('tumblr_oauth_request_token', result.requestToken);
        localStorage.setItem('tumblr_oauth_user_id', user.id);
        
        // Monitor the popup
        const checkPopup = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkPopup);
            // Check status after popup closed
            setTimeout(() => {
              checkStatus();
              setConnecting(false);
            }, 1000);
          }
        }, 500);
      }
    } catch (error) {
      console.error('Error connecting Tumblr:', error);
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!user?.id) return;
    
    if (!confirm('Are you sure you want to disconnect your Tumblr account?')) {
      return;
    }
    
    const success = await disconnectTumblrAccount(user.id);
    
    if (success) {
      await checkStatus();
    }
  };

  if (loading) {
    return (
      <Card>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-2">Tumblr Account</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold mb-2">Tumblr Account</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {status?.connected 
                ? 'Connect your Tumblr account to access full API features including detailed notes data.'
                : 'Your Tumblr account is connected.'}
            </p>
          </div>
          
          {status?.connected && (
            <div className="flex items-center gap-2 text-sm">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-green-600 dark:text-green-400 font-medium">Connected</span>
            </div>
          )}
        </div>

        {status?.connected ? (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Connected as: <span className="text-primary-600 dark:text-primary-400">{status.tumblrUsername}</span>
                  </p>
                  {status.connectedAt && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Connected {new Date(status.connectedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-sm font-semibold mb-2">OAuth Features Enabled:</h4>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access to real notes data with usernames
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  View likes, reblogs, and comments
                </li>
                <li className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Access your own dashboard and likes
                </li>
              </ul>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnect}
              className="w-full"
            >
              Disconnect Tumblr Account
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h4 className="text-sm font-semibold mb-2 text-blue-900 dark:text-blue-300">
                Why connect your Tumblr account?
              </h4>
              <ul className="space-y-1 text-sm text-blue-800 dark:text-blue-400">
                <li>• Access real notes with usernames instead of mock data</li>
                <li>• See who liked, reblogged, and commented on posts</li>
                <li>• View your own dashboard and likes</li>
                <li>• No rate limits - full API access</li>
              </ul>
            </div>

            <Button
              variant="primary"
              size="md"
              onClick={handleConnect}
              disabled={connecting}
              className="w-full"
            >
              {connecting ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M14.563 24c-5.093 0-7.031-3.756-7.031-6.411V9.747H5.116V6.648c3.63-1.313 4.512-4.596 4.71-6.469C9.84.051 9.93 0 9.974 0h3.248v6.2h4.322v3.547h-4.322v7.68c0 1.404.724 2.098 1.934 2.098.658 0 1.369-.178 2.111-.531l1.071 3.596c-1.035.437-2.424.91-3.775.91z" />
                  </svg>
                  Connect Tumblr Account
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}

