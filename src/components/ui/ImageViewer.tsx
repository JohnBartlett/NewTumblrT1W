import { useEffect, useState, useRef, useCallback } from 'react';
import { useAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { NotesPanel, type Note } from './NotesPanel';
import { useStoredImageData } from '@/hooks/useStoredImageData';
import { effectiveSlideshowIntervalAtom, slideshowAutoplayAtom, slideshowFullscreenAtom } from '@/store/preferences';

interface ImageViewerProps {
  isOpen: boolean;
  imageUrl: string;
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onJumpToEnd?: () => void;
  onJumpToStart?: () => void;
  currentIndex?: number;
  totalImages?: number;
  postId?: string;
  blogId?: string;
  userId?: string; // For checking stored images
  totalNotes?: number;
  notesList?: Note[];
  isSelected?: boolean;
  onToggleSelect?: () => void;
  /** Text content attached to the image (caption, description, etc.) - for display toggle with 't' key */
  imageText?: string;
}

export function ImageViewer({
  isOpen,
  imageUrl,
  onClose,
  onNext,
  onPrevious,
  onJumpToEnd,
  onJumpToStart,
  currentIndex = 0,
  totalImages = 0,
  postId,
  blogId,
  userId,
  totalNotes,
  notesList = [],
  isSelected = false,
  onToggleSelect,
  imageText,
}: ImageViewerProps) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [showImageText, setShowImageText] = useState(false); // Toggle text display with 't' key
  const [imageError, setImageError] = useState(false);
  const [imageRetryCount, setImageRetryCount] = useState(0);
  
  // Slideshow settings
  const [effectiveInterval] = useAtom(effectiveSlideshowIntervalAtom);
  const [slideshowAutoplay] = useAtom(slideshowAutoplayAtom);
  const [slideshowFullscreen] = useAtom(slideshowFullscreenAtom);
  const [isSlideshow, setIsSlideshow] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showUI, setShowUI] = useState(true); // Toggle UI visibility
  const [uiTimeout, setUiTimeout] = useState<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Use refs to store the latest callback values without causing effect re-runs
  const onNextRef = useRef(onNext);
  const onPreviousRef = useRef(onPrevious);
  
  useEffect(() => {
    onNextRef.current = onNext;
    onPreviousRef.current = onPrevious;
  }, [onNext, onPrevious]);
  
  // Check if this image is stored in database (to save API calls)
  const storedData = useStoredImageData(userId, postId, isOpen && !!userId && !!postId);
  
  // Use stored notes if available, otherwise use provided notesList
  const displayNotes = storedData.isStored && storedData.notes ? storedData.notes : notesList;

  // Fullscreen functions
  const enterFullscreen = async () => {
    if (containerRef.current && document.fullscreenEnabled) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error('Failed to enter fullscreen:', error);
      }
    }
  };

  const exitFullscreen = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error('Failed to exit fullscreen:', error);
      }
    }
  };

  const toggleFullscreen = () => {
    if (isFullscreen) {
      exitFullscreen();
    } else {
      enterFullscreen();
    }
  };

  // Listen for fullscreen changes (e.g., user presses ESC)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Auto-start slideshow if autoplay is enabled
  useEffect(() => {
    if (isOpen && slideshowAutoplay && onNextRef.current) {
      setIsSlideshow(true);
    }
  }, [isOpen, slideshowAutoplay]); // Removed onNext from dependencies

  // Enter fullscreen when slideshow starts (if setting is enabled)
  useEffect(() => {
    if (isSlideshow && slideshowFullscreen && !isFullscreen) {
      enterFullscreen();
    }
  }, [isSlideshow, slideshowFullscreen, isFullscreen]);

  // Exit fullscreen when viewer closes
  useEffect(() => {
    if (!isOpen && isFullscreen) {
      exitFullscreen();
    }
  }, [isOpen, isFullscreen]);

  // Auto-hide UI in fullscreen after 3 seconds of inactivity
  const showUITemporarily = () => {
    setShowUI(true);
    if (uiTimeout) {
      clearTimeout(uiTimeout);
    }
    if (isFullscreen) {
      const timeout = setTimeout(() => {
        setShowUI(false);
      }, 3000);
      setUiTimeout(timeout);
    }
  };

  // Show UI on mouse movement in fullscreen
  useEffect(() => {
    if (!isFullscreen) {
      setShowUI(true);
      if (uiTimeout) {
        clearTimeout(uiTimeout);
        setUiTimeout(null);
      }
      return;
    }

    const handleMouseMove = () => {
      showUITemporarily();
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      if (uiTimeout) {
        clearTimeout(uiTimeout);
      }
    };
  }, [isFullscreen]);

  // Reset UI visibility when entering fullscreen
  useEffect(() => {
    if (isFullscreen) {
      showUITemporarily();
    }
  }, [isFullscreen]);

  // Slideshow auto-advance with progress bar
  useEffect(() => {
    if (!isSlideshow || !onNextRef.current) return;

    let startTime = Date.now();
    const duration = effectiveInterval * 1000;

    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = (elapsed / duration) * 100;
      
      if (newProgress >= 100) {
        if (onNextRef.current) {
          onNextRef.current();
        }
        startTime = Date.now();
        setProgress(0);
      } else {
        setProgress(newProgress);
      }
    }, 50);

    return () => {
      clearInterval(progressInterval);
      setProgress(0);
    };
  }, [isSlideshow, effectiveInterval]); // Removed onNext from dependencies

  // Reset progress when image changes
  useEffect(() => {
    setProgress(0);
    setImageError(false); // Reset error state when image changes
    setImageRetryCount(0);
    setShowImageText(false); // Reset text display when image changes
  }, [currentIndex, imageUrl]);
  
  // Handle image load errors (QUIC protocol errors, network issues, etc.)
  const handleImageError = useCallback((e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget;
    console.warn('[ImageViewer] Image load error:', {
      src: img.src,
      error: 'Failed to load image (possibly QUIC protocol error)',
      retryCount: imageRetryCount
    });
    
    // Try retrying with HTTP/1.1 fallback (remove QUIC by forcing HTTP)
    if (imageRetryCount < 2) {
      const url = new URL(img.src);
      // Force HTTP/1.1 by adding a cache-busting parameter
      const retryUrl = `${url.origin}${url.pathname}${url.search}${url.search ? '&' : '?'}_retry=${Date.now()}`;
      setImageRetryCount(prev => prev + 1);
      setTimeout(() => {
        img.src = retryUrl;
      }, 500);
    } else {
      setImageError(true);
    }
  }, [imageRetryCount]);

  // Close on Escape key, navigate with arrow keys, toggle slideshow/UI with spacebar, toggle text with 't'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isZoomed) {
          // First ESC unzooms, second ESC closes
          setIsZoomed(false);
        } else if (isFullscreen) {
          // ESC exits fullscreen
          exitFullscreen();
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowRight' && onNextRef.current) {
        onNextRef.current();
        showUITemporarily(); // Show UI briefly when navigating
      } else if (e.key === 'ArrowLeft' && onPreviousRef.current) {
        onPreviousRef.current();
        showUITemporarily(); // Show UI briefly when navigating
      } else if (e.key === ' ') {
        e.preventDefault();
        if (isFullscreen) {
          // In fullscreen, spacebar toggles UI visibility
          setShowUI(!showUI);
          if (!showUI && uiTimeout) {
            clearTimeout(uiTimeout);
            setUiTimeout(null);
          }
        } else if (onNextRef.current) {
          // In normal mode, spacebar toggles slideshow
          setIsSlideshow(!isSlideshow);
        }
      } else if (e.key === 't' || e.key === 'T') {
        // Toggle text display (only if imageText is available)
        if (imageText) {
          e.preventDefault();
          setShowImageText(prev => !prev);
          showUITemporarily(); // Show UI briefly when toggling
        }
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, isZoomed, isSlideshow, isFullscreen, showUI, onClose, imageText]); // Removed onNext and onPrevious

  const handleImageClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsZoomed(!isZoomed);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          key="image-viewer-root" 
          ref={containerRef}
          className="fixed inset-0 z-50 flex items-center justify-center"
        >
          {/* Backdrop */}
          <motion.div
            key="image-viewer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/95 backdrop-blur-sm"
          />

          {/* Image Container */}
          <motion.div
            key="image-viewer-container"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className={`relative z-10 flex flex-col ${isZoomed || isFullscreen ? 'h-screen w-screen' : 'max-h-[95vh] max-w-[95vw]'}`}
          >
            {/* Top Controls */}
            {!isZoomed && showUI && (
              <motion.div 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="mb-4 flex items-center justify-between gap-4"
              >
                {/* Image counter */}
                {totalImages > 0 && (
                  <div className="rounded-lg bg-white/10 px-3 py-1 text-sm font-medium text-white backdrop-blur-sm">
                    {currentIndex + 1} / {totalImages}
                  </div>
                )}

                {/* Navigation hint */}
                {(onPrevious || onNext) && (
                  <div className="flex items-center space-x-2 text-sm text-white/60">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    <span>Arrow keys</span>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                )}
                
                <div className="ml-auto flex items-center gap-2">
                  {/* Select button */}
                  {onToggleSelect && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onToggleSelect}
                      className={`text-white ${isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'hover:bg-white/10'}`}
                    >
                      <svg className="mr-1 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isSelected ? (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        ) : (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        )}
                      </svg>
                      {isSelected ? 'Selected' : 'Select'}
                    </Button>
                  )}

                  {/* Slideshow toggle button */}
                  {onNext && totalImages > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsSlideshow(!isSlideshow)}
                      className="text-white hover:bg-white/10"
                      title={isSlideshow ? `Pause slideshow (${effectiveInterval}s)` : `Play slideshow (${effectiveInterval}s)`}
                    >
                      {isSlideshow ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                    </Button>
                  )}

                  {/* Fullscreen toggle button */}
                  {document.fullscreenEnabled && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleFullscreen}
                      className="text-white hover:bg-white/10"
                      title={isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'}
                    >
                      {isFullscreen ? (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5.25 5.25M20 8V4m0 0h-4m4 0l-5.25 5.25M4 16v4m0 0h4m-4 0l5.25-5.25M20 16v4m0 0h-4m4 0l-5.25-5.25" />
                        </svg>
                      )}
                    </Button>
                  )}

                  {/* Jump to start button */}
                  {onJumpToStart && totalImages > 1 && currentIndex > 0 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onJumpToStart}
                      className="text-white hover:bg-white/10"
                      title="Jump to first image"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                      </svg>
                    </Button>
                  )}

                  {/* Jump to end button */}
                  {onJumpToEnd && totalImages > 1 && currentIndex < totalImages - 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={onJumpToEnd}
                      className="text-white hover:bg-white/10"
                      title="Jump to last image"
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                      </svg>
                    </Button>
                  )}

                  {/* Close button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onClose}
                    className="text-white hover:bg-white/10"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Close button for zoomed mode */}
            {isZoomed && showUI && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="absolute right-4 top-4 z-30 text-white hover:bg-white/10"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </Button>
              </motion.div>
            )}

            {/* Image with zoom */}
            <div className={`relative flex flex-1 items-center justify-center ${isZoomed ? 'overflow-auto' : 'overflow-hidden'}`}>
              {/* Previous button */}
              {onPrevious && !isZoomed && showUI && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onPrevious();
                  }}
                  className="absolute left-4 z-20 text-white hover:bg-white/10"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </Button>
              )}

              {imageError ? (
                <div className="flex flex-col items-center justify-center p-8 text-white">
                  <svg className="mb-4 h-16 w-16 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="mb-2 text-lg font-medium">Failed to load image</p>
                  <p className="mb-4 text-sm text-white/70">Network error (QUIC protocol issue)</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setImageError(false);
                      setImageRetryCount(0);
                    }}
                    className="text-white border-white/20 hover:bg-white/10"
                  >
                    Retry
                  </Button>
                </div>
              ) : (
                <img
                  src={imageUrl}
                  alt="Full size"
                  className={`${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'} ${
                    isZoomed 
                      ? 'min-h-screen min-w-full object-contain' 
                      : isFullscreen 
                      ? 'max-h-screen max-w-screen object-contain'
                      : 'max-h-[80vh] max-w-[90vw] rounded-lg object-contain'
                  }`}
                  onClick={handleImageClick}
                  onError={handleImageError}
                />
              )}

              {/* Next button */}
              {onNext && !isZoomed && showUI && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => {
                    e.stopPropagation();
                    onNext();
                  }}
                  className="absolute right-4 z-20 text-white hover:bg-white/10"
                >
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Button>
              )}

              {/* Slideshow progress bar - only show when UI is visible or not in fullscreen */}
              {isSlideshow && !isZoomed && showUI && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                  <motion.div
                    className="h-full bg-blue-500"
                    style={{ width: `${progress}%` }}
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.05 }}
                  />
                </div>
              )}
            </div>

            {/* Zoom hint */}
            {!isZoomed && showUI && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-2 text-center text-sm text-white/60"
              >
                {isFullscreen ? 'Press SPACE to toggle UI' : 'Click image to zoom'}
                {imageText && ' • Press T to toggle text'}
              </motion.div>
            )}

            {/* Image Text Display - Overlaps image, can be toggled with 't' key */}
            {showImageText && imageText && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-0 bottom-0 z-30 max-h-[60vh] overflow-y-auto rounded-t-lg bg-black/90 p-4 text-white backdrop-blur-md shadow-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
                  {(() => {
                    // Sanitize HTML content: strip tags, convert links to readable text, remove image tags
                    let sanitized = imageText;
                    
                    // Extract blog names from tumblr_blog links: <a class="tumblr_blog" href="...">blogname</a>
                    sanitized = sanitized.replace(/<a\s+class="tumblr_blog"[^>]*>([^<]+)<\/a>/gi, '$1');
                    
                    // Extract text from other links: <a href="...">text</a> -> text
                    sanitized = sanitized.replace(/<a[^>]*>([^<]+)<\/a>/gi, '$1');
                    
                    // Remove image tags completely (we're already showing the image)
                    sanitized = sanitized.replace(/<img[^>]*>/gi, '');
                    sanitized = sanitized.replace(/<figure[^>]*>.*?<\/figure>/gi, '');
                    
                    // Convert blockquotes to indented text
                    sanitized = sanitized.replace(/<blockquote[^>]*>/gi, '');
                    sanitized = sanitized.replace(/<\/blockquote>/gi, '');
                    
                    // Convert paragraph tags to line breaks
                    sanitized = sanitized.replace(/<p[^>]*>/gi, '');
                    sanitized = sanitized.replace(/<\/p>/gi, '\n');
                    
                    // Convert div tags to line breaks
                    sanitized = sanitized.replace(/<div[^>]*>/gi, '');
                    sanitized = sanitized.replace(/<\/div>/gi, '\n');
                    
                    // Convert br tags to line breaks
                    sanitized = sanitized.replace(/<br\s*\/?>/gi, '\n');
                    
                    // Remove all remaining HTML tags
                    sanitized = sanitized.replace(/<[^>]+>/g, '');
                    
                    // Decode HTML entities
                    const textarea = document.createElement('textarea');
                    textarea.innerHTML = sanitized;
                    sanitized = textarea.value;
                    
                    // Clean up multiple line breaks
                    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
                    
                    // Trim whitespace
                    sanitized = sanitized.trim();
                    
                    return sanitized || 'No text content';
                  })()}
                </div>
              </motion.div>
            )}

            {/* Post info - shown when not zoomed */}
            {(blogId || totalNotes !== undefined) && !isZoomed && showUI && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-4 flex items-center justify-between rounded-lg bg-white/10 px-4 py-3 text-white backdrop-blur-sm"
              >
                {blogId && (
                  <div className="flex items-center space-x-2">
                    <div className="h-8 w-8 rounded-full bg-white/20" />
                    <span className="font-medium">{blogId}</span>
                  </div>
                )}
                {totalNotes !== undefined && (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/10"
                    >
                      <svg
                        className="mr-1 h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      Like
                    </Button>
                    <button
                      onClick={() => setShowNotes(true)}
                      className="text-sm hover:underline flex items-center gap-1"
                    >
                      {totalNotes} notes
                      {storedData.isStored && (
                        <span className="text-[10px] px-1 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30" title="Notes loaded from stored database (no API call)">
                          ⚡
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {/* Post info - shown at bottom when zoomed */}
            {(blogId || totalNotes !== undefined) && isZoomed && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="fixed bottom-0 left-0 right-0 z-30 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-6 py-4 text-white backdrop-blur-sm"
              >
                {/* Blog name on the left */}
                {blogId && (
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-white/20" />
                    <span className="text-lg font-semibold">{blogId}</span>
                  </div>
                )}
                
                {/* Spacer if no blog ID */}
                {!blogId && <div />}

                {/* Likes and notes on the right */}
                {totalNotes !== undefined && (
                  <div className="flex items-center space-x-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg
                        className="mr-2 h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                        />
                      </svg>
                      Like
                    </Button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowNotes(true);
                      }}
                      className="text-base font-medium hover:underline flex items-center gap-2"
                    >
                      {totalNotes.toLocaleString()} notes
                      {storedData.isStored && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/30" title="Notes loaded from stored database (no API call)">
                          ⚡ Stored
                        </span>
                      )}
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        </div>
      )}

      {/* Notes Panel */}
      <NotesPanel
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        notes={displayNotes}
        totalNotes={totalNotes || 0}
      />
    </AnimatePresence>
  );
}