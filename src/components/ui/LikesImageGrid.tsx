/**
 * Image grid component for displaying Tumblr liked post images
 */

import { useState } from 'react';
import type { LikedImage } from '../../types/tumblrLikes';
import { ImageViewer } from './ImageViewer';

interface LikesImageGridProps {
  images: LikedImage[];
  loading?: boolean;
  onImageClick?: (image: LikedImage, index: number) => void;
}

export function LikesImageGrid({ images, loading, onImageClick }: LikesImageGridProps) {
  const [selectedImage, setSelectedImage] = useState<{ image: LikedImage; index: number } | null>(null);

  const handleImageClick = (image: LikedImage, index: number) => {
    setSelectedImage({ image, index });
    onImageClick?.(image, index);
  };

  const handleClose = () => {
    setSelectedImage(null);
  };

  const handlePrevious = () => {
    if (selectedImage && selectedImage.index > 0) {
      setSelectedImage({
        image: images[selectedImage.index - 1],
        index: selectedImage.index - 1,
      });
    }
  };

  const handleNext = () => {
    if (selectedImage && selectedImage.index < images.length - 1) {
      setSelectedImage({
        image: images[selectedImage.index + 1],
        index: selectedImage.index + 1,
      });
    }
  };

  if (loading && images.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="aspect-square animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700"
          />
        ))}
      </div>
    );
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <svg
          className="mb-4 h-12 w-12 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="text-gray-500 dark:text-gray-400">No images found</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        {images.map((image, index) => (
          <button
            key={image.id}
            onClick={() => handleImageClick(image, index)}
            className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100 transition-transform hover:scale-105 dark:bg-gray-800"
          >
            <img
              src={image.url}
              alt={image.caption || `Image from ${image.blogName}`}
              className="h-full w-full object-cover"
              loading="lazy"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23ddd"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999"%3EFailed to load%3C/text%3E%3C/svg%3E';
              }}
            />
            <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10" />
          </button>
        ))}
      </div>

      {selectedImage && (
        <ImageViewer
          imageUrl={selectedImage.image.url}
          onClose={handleClose}
          onPrevious={selectedImage.index > 0 ? handlePrevious : undefined}
          onNext={selectedImage.index < images.length - 1 ? handleNext : undefined}
        />
      )}
    </>
  );
}

