import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';

/**
 * Props for MetadataPanel component
 */
interface MetadataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl?: string;
  metadata?: {
    blogName?: string;
    blogUrl?: string;
    tags?: string[];
    notes?: number;
    timestamp?: number;
    description?: string;
    postUrl?: string;
    imageText?: string;
    imageWidth?: number;
    imageHeight?: number;
  };
  exifData?: any; // EXIF data from server
}

/**
 * MetadataPanel Component
 * 
 * Displays comprehensive image metadata including:
 * - Basic information (blog name, timestamp, notes, dimensions)
 * - Tags, description, and image text/caption
 * - EXIF data (when available)
 * 
 * @param isOpen - Whether the panel is visible
 * @param onClose - Callback to close the panel
 * @param imageUrl - URL of the image to display
 * @param metadata - Basic metadata object
 * @param exifData - EXIF data from server (optional)
 */
export function MetadataPanel({ isOpen, onClose, imageUrl, metadata, exifData }: MetadataPanelProps) {
  if (!isOpen) return null;

  // Format timestamp
  const formatDate = (timestamp?: number) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString();
  };


  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed inset-x-4 top-20 bottom-4 z-50 mx-auto max-w-4xl overflow-y-auto rounded-lg bg-white shadow-xl dark:bg-gray-800"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4 dark:border-gray-700 dark:bg-gray-800">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Image Metadata & EXIF</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            </div>

            <div className="p-6 space-y-6">
              {/* Image Preview */}
              {imageUrl && (
                <div className="flex justify-center">
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="max-h-64 max-w-full rounded-lg object-contain"
                  />
                </div>
              )}

              {/* Basic Metadata */}
              {metadata && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Basic Information</h3>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {metadata.blogName && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Blog Name</div>
                        <div className="text-base text-gray-900 dark:text-white">{metadata.blogName}</div>
                      </div>
                    )}
                    {metadata.timestamp && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Posted</div>
                        <div className="text-base text-gray-900 dark:text-white">{formatDate(metadata.timestamp)}</div>
                      </div>
                    )}
                    {metadata.notes !== undefined && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</div>
                        <div className="text-base text-gray-900 dark:text-white">{metadata.notes.toLocaleString()}</div>
                      </div>
                    )}
                    {metadata.imageWidth && metadata.imageHeight && (
                      <div>
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Dimensions</div>
                        <div className="text-base text-gray-900 dark:text-white">
                          {metadata.imageWidth} × {metadata.imageHeight} px
                        </div>
                      </div>
                    )}
                    {metadata.blogUrl && (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Blog URL</div>
                        <a
                          href={metadata.blogUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {metadata.blogUrl}
                        </a>
                      </div>
                    )}
                    {metadata.postUrl && (
                      <div className="sm:col-span-2">
                        <div className="text-sm font-medium text-gray-500 dark:text-gray-400">Post URL</div>
                        <a
                          href={metadata.postUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base text-blue-600 hover:underline dark:text-blue-400"
                        >
                          {metadata.postUrl}
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Tags */}
                  {metadata.tags && metadata.tags.length > 0 && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Tags</div>
                      <div className="flex flex-wrap gap-2">
                        {metadata.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="rounded-full bg-primary-100 px-3 py-1 text-sm text-primary-700 dark:bg-primary-900 dark:text-primary-300"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Description */}
                  {metadata.description && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Description</div>
                      <div className="text-base text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                        {metadata.description}
                      </div>
                    </div>
                  )}

                  {/* Image Text */}
                  {metadata.imageText && (
                    <div>
                      <div className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Image Text/Caption</div>
                      <div className="text-base text-gray-900 dark:text-white whitespace-pre-wrap break-words">
                        {metadata.imageText}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* EXIF Data */}
              {exifData && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">EXIF Data</h3>
                  <div className="rounded-lg bg-gray-50 p-4 dark:bg-gray-900">
                    <pre className="text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap break-words overflow-x-auto">
                      {JSON.stringify(exifData, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* No EXIF Data Message */}
              {!exifData && (
                <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    EXIF data is not available for this image. Metadata embedding occurs when images are downloaded.
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

