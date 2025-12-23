# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.1] - 2025-12-23

### Fixed
- **React Duplicate Key Warning**: Implemented de-duplication in the `useTumblrBlog` hook to prevent "duplicate key" errors in the image grid.
- **API Rate Limiting**: Increased server-side API rate limit to 2,000 requests per 15-minute window to accommodate high-frequency telemetry requests.
- **Admin Dashboard Console Error**: Resolved a duplicate `Button` import in the Admin component.

### Changed
- **Telemetry Polling Optimization**: Reduced polling frequency for API statistics from 30 seconds to 60 seconds (60,000ms) in `VersionBadge` and `Admin` components to minimize background network traffic.
- **UI Consolidation**: Unified the `VersionBadge` component by moving it to the `RootLayout`, ensuring consistent visibility and reducing redundant component instances across the app.

---

## [Unreleased]

### v1.0.0 - Major Refactoring (Planned)

#### Architecture Overhaul

- **Service Layer**: Unified download, storage, and share services with strategy pattern
- **Atomic Design**: Complete UI refactoring (Primitives → Molecules → Organisms → Pages)
- **Unified State**: Merge `operations.ts` and `downloads.ts` into single source of truth
- **Custom Hooks**: Extract business logic (`useDownload`, `useImageGallery`, etc.)
- **Type Safety**: Eliminate all `any` types, comprehensive TypeScript coverage

#### Performance

- **Virtual Scrolling**: Efficiently render 1000+ images
- **Code Splitting**: Lazy load routes and heavy components
- **Optimized Renders**: React.memo, useMemo, useCallback throughout
- **Bundle Size**: Reduce initial bundle by 40%+

#### Testing

- **Unit Tests**: 80%+ coverage for services and utilities
- **Integration Tests**: All critical user flows
- **E2E Tests**: Playwright tests for key journeys
- **Visual Regression**: Percy/Chromatic integration

#### Documentation

- **Architecture Guide**: Comprehensive design documentation
- **API Reference**: All services and hooks documented
- **Migration Guide**: Step-by-step refactoring progress
- **Testing Guide**: How to run and write tests

#### Breaking Changes

- Component import paths changed (moved to atomic design structure)
- State atoms merged (`operations.ts` + `downloads.ts` → unified)
- Service APIs use consistent interfaces
- localStorage keys versioned (automatic migration)

---

## [Released]

## [1.1.0] - 2025-11-24

### Added

- **API Call Counter Badge**: Live monitoring of Tumblr API usage
  - Real-time display in bottom-right corner of all pages
  - Click to expand/collapse detailed view
  - Shows current count, daily limit (5,000), and percentage used
  - Color-coded progress bar (green → yellow → orange → red)
  - Reset time indicator (shows when quota resets at midnight)
  - Auto-refresh every 30 seconds
- **Client-Side Rate Limiter**: Intelligent request throttling
  - Exponential backoff on 429 responses (30s → 60s → 120s → 240s)
  - Pre-request blocking to prevent hammering APIs
  - Separate tracking for different endpoints (posts, info, auth)
  - Console warnings with retry countdown timers
  - Respects server `Retry-After` headers
- **Backend Caching System**: Reduces duplicate API calls
  - In-memory cache with configurable TTL
  - Blog info cached for 10 minutes
  - Blog posts (first page) cached for 2 minutes
  - Automatic cleanup of expired entries every 10 minutes
  - Admin endpoints for cache stats and manual clearing
  - Cache hit/miss logging for debugging
- **API Stats Persistence**: Historical tracking in database
  - `ApiCallStats` model tracks daily usage
  - Persistent across server restarts
  - Admin dashboard endpoint (`/api/admin/stats`)
  - Automatic daily reset (new date record)

### Fixed

- **JSON Parsing Errors**: Fixed `SyntaxError: Unexpected token 'T'`
  - Now checks Content-Type header before parsing
  - Handles plain-text 429 responses correctly
  - Graceful error messages instead of parse failures
- **Auth Refresh Loop**: Fixed infinite token refresh causing backend 429s
  - Added rate limiting to `/api/auth/refresh` calls
  - Won't retry immediately after 429
  - 60-second default backoff for auth failures
  - Centralized refresh logic prevents multiple simultaneous calls
- **Excessive API Calls**: Cache prevents redundant requests
  - Same blog info request within 10 minutes uses cache
  - Same posts request within 2 minutes uses cache
  - 90%+ reduction in duplicate API calls

### Changed

- **VersionBadge Component**: Enhanced with API counter
  - Now shows both version number and API call count
  - Collapsible interface (click to expand/collapse)
  - Moved to RootLayout for global display across all pages
  - Professional dark theme with backdrop blur
- **Version Number**: Updated from 0.94.0 to 1.1.0
  - Major feature additions warrant minor version bump
  - Reflects significant improvements to API management

### Technical

- **New Utility**: `src/utils/rateLimiter.ts`
  - Client-side rate limit tracking and enforcement
  - Per-endpoint state management
  - Exponential backoff calculations
  - Debug tools for active limits
- **Enhanced Error Handling**: 
  - All API calls check rate limits before execution
  - Clear user-facing messages for rate limit errors
  - Fallback to mock data when appropriate
- **Cache Implementation**:
  - Simple Map-based cache with TTL
  - Configurable expiration times
  - Automatic background cleanup
  - Admin monitoring tools

## [0.94.0] - 2025-11-11

### Added

- **Tumblr Likes Gallery**: Comprehensive component for viewing liked posts
  - Full pagination support (offset-based for first 1000 posts, timestamp-based beyond)
  - Image extraction from multiple post types
  - Responsive grid layout with lazy loading
  - Pagination controls (Previous/Next, Jump to Page)
  - Error handling with retry logic
  - Loading states and empty states
- **Image Metadata Embedding**: EXIF/IPTC metadata embedded in downloaded images
  - Server-side metadata embedding using sharp library
  - EXIF tags: ImageDescription, UserComment, Artist, Copyright
  - IPTC tags: Caption/Abstract, Keywords, Copyright Notice
  - Falls back to original image if embedding fails
  - Creates sidecar `.txt` files with metadata
- **Image Text Display**: Toggle text overlay in ImageViewer
  - Press `T` key to toggle text overlay
  - Displays image caption/description with HTML sanitization
  - Scrollable container overlapping image at bottom
- **Metadata Panel Component**: Full metadata display panel
  - Shows basic information (blog name, timestamp, notes, dimensions)
  - Displays tags, description, and image text
  - EXIF data support (when available)
  - Responsive design with dark mode support

### Changed

- **Content Extraction Priority**: Fixed text truncation issues
  - Photo posts: Prioritize `caption` over `summary` (caption has full text)
  - Text posts: Use `body` over `summary`
  - Other posts: Try `caption` first, then `body`, then `summary`
- **Image Download Metadata**: Enhanced metadata in downloaded images
  - Includes `imageText` field in metadata
  - Better preservation of image captions and descriptions

### Fixed

- Text truncation in photo posts (now uses full caption instead of truncated summary)
- Liked posts content extraction (properly extracts images and text)

### Technical Improvements

- Created `TumblrLikesGallery.tsx` component with full pagination support
- Created `MetadataPanel.tsx` component for metadata display
- Enhanced `ImageViewer.tsx` with text overlay toggle
- Updated `server/index.ts` with metadata embedding endpoint
- Updated `imageDownload.ts` to include imageText in metadata
- Created hooks: `useTumblrLikesPagination.ts`, `useTumblrLikesImages.ts`
- Created types: `tumblrLikes.ts`, `tumblrLikesImages.ts`
- Created UI components: `LikesImageGrid.tsx`, `LikesImagesPagination.tsx`, `LikesPaginationControls.tsx`

### Documentation

- Created `docs/TUMBLR_LIKES_API.md` - API documentation for likes endpoint
- Created `docs/TUMBLR_LIKES_GALLERY.md` - Component usage guide
- Updated `REBOOT_CHECKPOINT.md` with system state documentation

---

## [0.93.0] - 2025-11-03

### Added

- **Batched Download System**: Download large image sets (1000+) reliably
  - Process 20 images at a time with 800ms rate limiting
  - Automatic retry logic (3 attempts per image)
  - Graceful error handling with detailed reporting
  - Progress tracking with ETA calculation
- **Download Status Panel**: Floating UI component showing real-time progress
  - Current batch and overall progress bars
  - Success/failed/total statistics
  - Error list (expandable, shows which images failed)
  - Time remaining estimate
  - **Stop Download** button (graceful cancellation)
  - **Close** button (clears state after completion)
  - Minimizable to save screen space
- **Panic Button**: Emergency stop for all operations
  - Double-click confirmation to prevent accidents
  - Cancels all active downloads immediately
  - Calls server emergency stop endpoint
  - Reloads page to ensure clean state
  - Always visible (bottom-right corner, high z-index)
- **Centralized Logging**: Unified logging system across app
  - Console output with color-coding by level
  - IndexedDB persistence (survives page reloads)
  - Log levels: debug, info, warn, error, userAction
  - Filterable by level, category, date
  - Export logs functionality
- **Download State Persistence**: Resume downloads after page reload
  - Stores operation details in localStorage
  - Tracks progress (current, total, failed)
  - Preserves folder name and error list
  - Auto-displays status panel on reload

### Changed

- **StoredImages Download All**: Now actually downloads ALL images, not just first 50
  - Auto-loads remaining images before download
  - Shows "Loading images..." state during load phase
  - Properly tracks total image count
  - Fixed premature exit bug (isDownloading flag conflict)
- **Directory Picker**: Fixed "Must be handling a user gesture" error
  - Moved `showDirectoryPicker()` call before any async operations
  - Synchronous browser capability check
  - Confirmation dialog moved after picker (not before)
  - More reliable folder selection on all browsers
- **Folder Naming**: Fixed stale folder name bug
  - Clears download state at start of each operation
  - Properly captures current blog name
  - Added logging to track folder name explicitly
- **Close Button**: Now properly clears download state
  - Calls `clearDownloadAtom` to remove from localStorage
  - No longer requires page reload
  - Download panel doesn't reappear after closing

### Fixed

- **Large Batch Downloads**: Downloads >1000 images no longer hang or fail
- **Directory Picker Error**: No more "user gesture" errors on folder selection
- **Partial Downloads**: "Download All" button now downloads complete set
- **Stale State**: Folder names and operation details no longer persisted incorrectly
- **Download Panel Persistence**: Close button now actually closes (not reopens on reload)

### Technical Improvements

- Created `store/downloads.ts` for download state management (with persistence)
- Created `utils/batchedDownload.ts` for batched download logic
- Created `utils/logger.ts` for centralized logging
- Added `DownloadStatus.tsx` component (floating progress panel)
- Added `PanicButton.tsx` component (emergency stop)
- Added `/api/emergency-stop` endpoint to server
- Improved error handling with per-image retry logic
- Added rate limiting to prevent browser/server overload

### Documentation

- Created `docs/DOWNLOAD_SYSTEM_FIX_PLAN.md` (v0.92.2 plan)
- Created `docs/V0.93.0_IMPLEMENTATION_SUMMARY.md` (implementation summary)
- Updated `VERSION.md` with comprehensive v0.93.0 changelog
- Updated `PANMD.md` with new features and fixes

---

## [0.92.2] - 2025-11-02

### Fixed

- ESLint errors in multiple files to enable clean commits
- Corrupted import statement in `ForgotPassword.tsx`

### Documentation

- Created comprehensive download system fix plan
- Updated VERSION.md with known issues and fix plan

---

## [0.92.1] - 2025-11-01

### Added

- Basic download functionality for stored images
- Single image download support

### Known Issues

- Large batch downloads (>1000 images) can hang
- No progress tracking for long downloads
- No way to cancel downloads in progress

---

## [0.92.0] - 2025-10-30

### Added

- StoredImages page with database integration
- Image storage to PostgreSQL via Prisma
- Basic filtering and sorting

### Changed

- Improved image grid layout
- Enhanced selection UX

---

## [0.91.0] - 2025-10-28

### Added

- BlogImages page with Tumblr API integration
- Infinite scroll for image browsing
- Image selection (individual + range)
- Basic download functionality

---

## [0.90.0] - 2025-10-25

### Added

- Initial project setup with React + TypeScript + Vite
- Express.js backend with PostgreSQL
- User authentication (login/register)
- Basic routing with TanStack Router
- Tailwind CSS styling

---

## Version Schema

- **Major** (X.0.0): Breaking changes, architecture overhauls
- **Minor** (0.X.0): New features, non-breaking changes
- **Patch** (0.0.X): Bug fixes, documentation updates

---

## Links

- [GitHub Repository](https://github.com/yourusername/NewTumblrT3)
- [Issue Tracker](https://github.com/yourusername/NewTumblrT3/issues)
- [Documentation](./PANMD.md)

---

_Last Updated: 2025-11-03_
