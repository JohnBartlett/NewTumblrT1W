import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export type ThemeMode = 'light' | 'dark' | 'system';
export type FilenamePattern = 'original' | 'blog-original' | 'blog-tags-date' | 'date-blog-tags' | 'blog-description' | 'tags-only' | 'timestamp' | 'simple';
export type GridImageSize = 'compact' | 'comfortable' | 'spacious';
export type DownloadMethod = 'client-side' | 'server-side';
export type SlideshowSpeed = 'very-slow' | 'slow' | 'normal' | 'fast' | 'very-fast' | 'custom';
export type SlideshowTransition = 'fade' | 'slide' | 'zoom' | 'kenburns';

// Speed presets mapping to intervals (in seconds)
export const SLIDESHOW_SPEED_PRESETS: Record<Exclude<SlideshowSpeed, 'custom'>, number> = {
  'very-slow': 15,
  'slow': 10,
  'normal': 5,
  'fast': 3,
  'very-fast': 1,
};

export interface Preferences {
  theme: ThemeMode;
  fontSize: number;
  reducedMotion: boolean;
  enableHaptics: boolean;
  enableGestures: boolean;
  filenamePattern: FilenamePattern;
  includeIndexInFilename: boolean;
  includeSidecarMetadata: boolean; // Include .txt metadata file with downloads
  downloadMethod: DownloadMethod; // Client-side (browser) or Server-side (parallel fetch + zip)
  gridColumns: number; // Number of columns in image grid (2-6)
  gridImageSize: GridImageSize; // Size/spacing of grid images
  showImageInfo: boolean; // Show resolution/size overlay on grid images
  allowDuplicateImageUrls: boolean; // Allow storing same image URL from different blogs
  maxStoredNotes: number; // Maximum number of notes to store per image
  blogFilterLimit: number; // Number of blogs to show in filter dropdown
  slideshowSpeed: SlideshowSpeed; // Slideshow speed preset
  slideshowInterval: number; // Slideshow interval in seconds (3-60) - used when speed is 'custom'
  slideshowAutoplay: boolean; // Auto-start slideshow when opening viewer
  slideshowFullscreen: boolean; // Enter fullscreen mode when slideshow starts
  slideshowShuffle: boolean; // Random order in slideshow
  slideshowTransition: SlideshowTransition; // Transition effect
}

const initialPreferences: Preferences = {
  theme: 'system',
  fontSize: 16,
  reducedMotion: false,
  enableHaptics: true,
  enableGestures: true,
  filenamePattern: 'blog-tags-date',
  includeIndexInFilename: true,
  includeSidecarMetadata: false, // Default to not including metadata files
  downloadMethod: 'client-side', // Default to client-side downloads
  gridColumns: 4, // Default to 4 columns
  gridImageSize: 'comfortable', // Default to comfortable spacing
  showImageInfo: false, // Default to not showing resolution/size overlay
  allowDuplicateImageUrls: false, // Default to strict deduplication (no duplicate URLs)
  maxStoredNotes: 50, // Default to storing 50 notes per image
  blogFilterLimit: 20, // Default to showing 20 blogs in filter
  slideshowSpeed: 'normal', // Default speed preset
  slideshowInterval: 5, // Default to 5 seconds per image (used when speed is 'custom')
  slideshowAutoplay: false, // Don't auto-start slideshow
  slideshowFullscreen: false, // Don't enter fullscreen by default
  slideshowShuffle: false, // Sequential order by default
  slideshowTransition: 'fade', // Smooth fade transition
};

// Persist preferences in localStorage
export const preferencesAtom = atomWithStorage<Preferences>(
  'preferences',
  initialPreferences
);

// Derived atoms
export const themeModeAtom = atom(get => get(preferencesAtom).theme);
export const fontSizeAtom = atom(get => get(preferencesAtom).fontSize);
export const reducedMotionAtom = atom(get => get(preferencesAtom).reducedMotion);
export const enableHapticsAtom = atom(get => get(preferencesAtom).enableHaptics);
export const enableGesturesAtom = atom(get => get(preferencesAtom).enableGestures);
export const filenamePatternAtom = atom(get => get(preferencesAtom).filenamePattern);
export const includeIndexInFilenameAtom = atom(get => get(preferencesAtom).includeIndexInFilename);
export const includeSidecarMetadataAtom = atom(get => get(preferencesAtom).includeSidecarMetadata);
export const downloadMethodAtom = atom(get => get(preferencesAtom).downloadMethod);
export const gridColumnsAtom = atom(get => get(preferencesAtom).gridColumns);
export const gridImageSizeAtom = atom(get => get(preferencesAtom).gridImageSize);
export const showImageInfoAtom = atom(get => get(preferencesAtom).showImageInfo);
export const allowDuplicateImageUrlsAtom = atom(get => get(preferencesAtom).allowDuplicateImageUrls);
export const maxStoredNotesAtom = atom(get => get(preferencesAtom).maxStoredNotes);
export const blogFilterLimitAtom = atom(get => get(preferencesAtom).blogFilterLimit);
export const slideshowSpeedAtom = atom(get => get(preferencesAtom).slideshowSpeed);
export const slideshowIntervalAtom = atom(get => get(preferencesAtom).slideshowInterval);
export const slideshowAutoplayAtom = atom(get => get(preferencesAtom).slideshowAutoplay);
export const slideshowFullscreenAtom = atom(get => get(preferencesAtom).slideshowFullscreen);
export const slideshowShuffleAtom = atom(get => get(preferencesAtom).slideshowShuffle);
export const slideshowTransitionAtom = atom(get => get(preferencesAtom).slideshowTransition);

// Computed atom that returns the actual interval based on speed preset or custom value
export const effectiveSlideshowIntervalAtom = atom(get => {
  const preferences = get(preferencesAtom);
  if (preferences.slideshowSpeed === 'custom') {
    return preferences.slideshowInterval;
  }
  return SLIDESHOW_SPEED_PRESETS[preferences.slideshowSpeed];
});

// Action atoms
export const updatePreferencesAtom = atom(
  null,
  (get, set, preferences: Partial<Preferences>) => {
    const currentPreferences = get(preferencesAtom);
    set(preferencesAtom, { ...currentPreferences, ...preferences });
  }
);