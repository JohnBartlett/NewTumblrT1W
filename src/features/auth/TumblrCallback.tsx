import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { completeTumblrConnection } from '@/services/api';
import { Container } from '@/components/layouts';
import { Card } from '@/components/ui';

export function TumblrCallback() {
  const navigate = useNavigate();
  const search = useSearch({ from: '/auth/tumblr/callback' });
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [message, setMessage] = useState('Completing Tumblr connection...');

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      // Get OAuth params from URL
      const oauthToken = (search as any).oauth_token;
      const oauthVerifier = (search as any).oauth_verifier;
      
      // Get stored user ID
      const userId = localStorage.getItem('tumblr_oauth_user_id');
      const storedToken = localStorage.getItem('tumblr_oauth_request_token');
      
      if (!userId || !oauthToken || !oauthVerifier) {
        setStatus('error');
        setMessage('Missing required OAuth parameters');
        setTimeout(() => window.close(), 3000);
        return;
      }
      
      if (storedToken !== oauthToken) {
        setStatus('error');
        setMessage('OAuth token mismatch');
        setTimeout(() => window.close(), 3000);
        return;
      }
      
      // Complete the connection
      const result = await completeTumblrConnection(userId, oauthToken, oauthVerifier);
      
      if (result.success) {
        setStatus('success');
        setMessage(`Successfully connected as ${result.tumblrUsername}!`);
        
        // Clean up
        localStorage.removeItem('tumblr_oauth_request_token');
        localStorage.removeItem('tumblr_oauth_user_id');
        
        // Close popup after a moment
        setTimeout(() => {
          window.close();
        }, 2000);
      } else {
        setStatus('error');
        setMessage('Failed to complete connection');
        setTimeout(() => window.close(), 3000);
      }
    } catch (error) {
      console.error('Error handling callback:', error);
      setStatus('error');
      setMessage('An error occurred');
      setTimeout(() => window.close(), 3000);
    }
  };

  return (
    <Container>
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card>
          <div className="p-8 text-center">
            {status === 'processing' && (
              <>
                <svg className="mx-auto h-16 w-16 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">{message}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">Please wait...</p>
              </>
            )}
            
            {status === 'success' && (
              <>
                <svg className="mx-auto h-16 w-16 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-green-600 dark:text-green-400">{message}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">This window will close automatically...</p>
              </>
            )}
            
            {status === 'error' && (
              <>
                <svg className="mx-auto h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-lg font-medium text-red-600 dark:text-red-400">{message}</p>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">This window will close automatically...</p>
              </>
            )}
          </div>
        </Card>
      </div>
    </Container>
  );
}

