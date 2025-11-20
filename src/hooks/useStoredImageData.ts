import { useState, useEffect } from 'react';
import type { Note } from '@/components/ui/NotesPanel';

// Dynamic API URL
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};
const API_URL = getApiUrl();

interface StoredImageData {
  isStored: boolean;
  notes?: Note[];
  loading: boolean;
}

/**
 * Hook to check if an image is already stored in the database
 * and fetch its notes data to avoid Tumblr API calls
 */
export function useStoredImageData(
  userId: string | undefined,
  postId: string | undefined,
  enabled: boolean = true
): StoredImageData {
  const [data, setData] = useState<StoredImageData>({
    isStored: false,
    notes: undefined,
    loading: false,
  });

  useEffect(() => {
    if (!enabled || !userId || !postId) {
      setData({ isStored: false, notes: undefined, loading: false });
      return;
    }

    let mounted = true;

    async function checkStoredImage() {
      setData(prev => ({ ...prev, loading: true }));

      try {
        // Query optimized endpoint to check if this specific post is stored
        const response = await fetch(
          `${API_URL}/api/stored-images/${userId}/post/${postId}`
        );

        if (!response.ok) {
          throw new Error('Failed to check stored post');
        }

        const result = await response.json();

        if (!mounted) return;

        if (result.stored && result.image?.notesData) {
          const storedImage = result.image;
          // Parse stored notes
          try {
            const notesArray = JSON.parse(storedImage.notesData);
            const parsedNotes: Note[] = notesArray.map((note: any, i: number) => {
              const normalizedBlog = note.blog_name?.includes('.') 
                ? note.blog_name 
                : `${note.blog_name}.tumblr.com`;
              
              // Determine note type: prioritize text comments over generic types
              let noteType: 'like' | 'reblog' | 'comment' = 'reblog';
              if (note.type === 'like') {
                noteType = 'like';
              } else if (note.reply_text || note.added_text) {
                // If there's text content, it's a comment (even if Tumblr marks it as reblog)
                noteType = 'comment';
              } else if (note.type === 'reblog' || note.type === 'posted') {
                noteType = 'reblog';
              }
              
              return {
                id: `stored-note-${postId}-${i}`,
                type: noteType,
                user: {
                  username: note.blog_name || 'anonymous',
                  avatar: note.avatar_url?.['64'] || 
                          `${API_URL}/api/tumblr/blog/${normalizedBlog}/avatar/64`,
                },
                timestamp: note.timestamp * 1000,
                comment: note.reply_text || note.added_text,
                reblogComment: note.reblog_parent_blog_name 
                  ? `Reblogged from ${note.reblog_parent_blog_name}` 
                  : undefined,
              };
            });

            console.log(`[useStoredImageData] ✅ Found stored image with ${parsedNotes.length} notes for post ${postId}`);
            setData({ isStored: true, notes: parsedNotes, loading: false });
          } catch (parseError) {
            console.error('[useStoredImageData] Error parsing notes:', parseError);
            setData({ isStored: true, notes: undefined, loading: false });
          }
        } else {
          console.log(`[useStoredImageData] ℹ️ Post ${postId} not in stored database`);
          setData({ isStored: false, notes: undefined, loading: false });
        }
      } catch (error) {
        console.error('[useStoredImageData] Error checking stored image:', error);
        if (mounted) {
          setData({ isStored: false, notes: undefined, loading: false });
        }
      }
    }

    checkStoredImage();

    return () => {
      mounted = false;
    };
  }, [userId, postId, enabled]);

  return data;
}

