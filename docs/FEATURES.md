# Features Documentation

Complete list of features implemented in the Tumblr T3 application.

## Table of Contents
- [Authentication & User Management](#authentication--user-management)
- [User Interface](#user-interface)
- [Content Viewing](#content-viewing)
- [Image Viewer](#image-viewer)
- [Social Features](#social-features)
- [Tag System](#tag-system)
- [Blog Viewing](#blog-viewing)
- [Preferences & Settings](#preferences--settings)

---

## Authentication & User Management

### Registration
- **Email validation**: Unique email required
- **Username validation**: Unique username required
- **Password security**: Bcrypt hashing (10 salt rounds)
- **Default preferences**: Automatically created on signup
- **Avatar generation**: Unique avatar based on username
- **Location**: `/auth?mode=register`

### Login
- **Flexible login**: Email OR username accepted
- **Session persistence**: LocalStorage-based sessions
- **Auto-login**: Automatic session restoration on page load
- **Location**: `/auth?mode=login`

### Logout
- **Top navigation**: Logout button in navigation bar
- **Session cleanup**: Clears localStorage
- **Redirect**: Returns to home page

---

## User Interface

### Theme System
- **Light mode**: Clean, bright interface
- **Dark mode**: Eye-friendly dark theme
- **System mode**: Follows OS preference
- **Toggle button**: Top navigation bar
- **Persistence**: Saved per user in database

### Responsive Design
- **Mobile**: Optimized for small screens
- **Tablet**: Adaptive layout
- **Desktop**: Full-featured experience
- **Grid system**: Responsive columns (2-4 columns)

### Navigation
- **Sticky header**: Always accessible
- **Quick links**: Dashboard, Search, Profile, Settings
- **User menu**: Profile, Settings, Logout (when logged in)
- **Auth buttons**: Login, Sign up (when logged out)

---

## Content Viewing

### Dashboard (v0.70.0 - Redesigned)
- **Recently Viewed Blogs**: Top 20 most recent blogs displayed as prominent cards
- **Blog Visit Tracking**: Automatic tracking of every blog visit with timestamps
- **Visit Statistics**: See how many times you've visited each blog
- **Infinite Scroll**: Remaining blogs (up to 100) load automatically as you scroll
- **Blog History**: Stores up to 100 most recently visited blogs in localStorage
- **Empty State**: Helpful prompt to search for blogs when history is empty
- **Clear History**: Button to clear all blog browsing history
- **Cross-tab Sync**: History updates when window gains focus
- **Beautiful UI**: 
  - Large card layout for recent blogs (2-5 columns responsive)
  - Compact list for older blogs (1-3 columns responsive)
  - Blog avatars with gradient fallbacks
  - Relative timestamps ("2h ago", "3d ago", etc.)
  - Hover animations and smooth transitions

### Blog History Tracking (v0.70.0)
- **Automatic**: Tracks every blog visit with no user action required
- **Persistent**: Stored in localStorage (survives browser restarts)
- **Smart**: Most recent 100 blogs kept, oldest removed automatically
- **Rich Data**: Stores blog name, display name, avatar URL, timestamp, visit count
- **Quick Access**: Click any blog card to instantly revisit

---

## Image Viewer

### Basic Features
- **Full-screen view**: Click any image to open
- **Zoom functionality**: Click image to zoom to full window size
- **Keyboard navigation**: Arrow keys (← →) to navigate between images
- **Close viewer**: ESC key (first press unzooms, second closes)
- **Navigation buttons**: Visual prev/next buttons

### Advanced Features
- **Persistent zoom**: Zoom state maintained while navigating
- **Blog info bar**: Shows blog name and avatar (bottom left when zoomed)
- **Engagement metrics**: Like button and notes count (bottom right when zoomed)
- **Notes panel**: Click notes count to view details
- **Smooth transitions**: Animated entry/exit

### Notes Panel
- **Side panel**: Slides in from right
- **Tabbed interface**: All, Comments, Likes, Reblogs
- **User information**: Avatar, username, timestamp
- **Note content**: Comments and reblog messages
- **Clickable usernames**: Opens user's blog in new tab

---

## Social Features

### Likes
- **Like posts**: Heart button on posts
- **Visual feedback**: Filled heart when liked
- **Toggle**: Click again to unlike
- **Persistence**: Saved per session

### Comments
- **View comments**: Click comment button or notes count
- **Notes panel**: Shows all comments with user info
- **Timestamps**: Relative time display

### Reblogs
- **Reblog button**: Visible on all posts
- **View reblogs**: Filter in notes panel
- **Reblog comments**: Shows additional commentary

---

## Tag System

### Tag Navigation
- **Clickable tags**: All tags are interactive
- **Two-level search**:
  1. **User-scoped**: Click tag on blog → See user's posts with that tag
  2. **Global search**: Click "Search All Blogs" → See all users' posts

### Tag View Page (`/tag/:tagName`)
- **Current tag highlighted**: Blue/primary color
- **Post statistics**: Shows number of posts and blogs
- **Filter preservation**: Maintains scope (user/global) when clicking other tags
- **Full post interaction**: Like, comment, reblog, view images

### Tag Features
- **Search scope toggle**: "Search All Blogs" button
- **Context display**: Shows if viewing user's tags or global
- **Tag variety**: 40+ realistic tags (photography, aesthetic, nature, etc.)
- **Multi-tag posts**: Posts can have 2-5 tags

---

## Blog Viewing

### Blog Page (`/blog/:username`)
- **User profile**: Avatar, bio, follower/following counts
- **Post count**: Total posts by user
- **Follow button**: Follow/unfollow functionality
- **View toggle**: Switch between "All Posts" and "Images Only"

### Images Only Mode
- **Terse grid**: 2-4 column responsive grid
- **Photo posts only**: Filters out text posts
- **Hover effects**: Shows notes count on hover
- **Quick access**: Click any image for full viewer

### Blog Navigation
- **From notes panel**: Click username in notes
- **New tab**: Opens in separate browser tab
- **Tag exploration**: Click tags to filter user's posts
- **Image viewing**: Full image viewer integration

### Pagination & Bulk Operations (v0.60.2)
- **Load More**: Fetch next 50 posts from blog
- **Load All**: Automatically load all remaining posts (batches of 50)
- **Progress indicators**: Real-time loading feedback
- **Smart state tracking**: Offset, hasMore, total post count

### Bulk Download Operations (v0.60.2)
- **Download Loaded**: Download currently loaded images (50-300)
- **Download ALL**: Auto-loads all posts then downloads every image
- **Progress tracking**: Shows "Downloading... (X/Y)" during operation
- **Confirmation dialogs**: Prevents accidental bulk operations
- **Metadata included**: Tags, notes, descriptions in sidecar files
- **Filename patterns**: 6 customizable naming patterns

### Bulk Store Operations (v0.60.2)
- **Store Loaded**: Save currently loaded images to database
- **Store ALL**: Auto-loads all posts then stores every image
- **Batch API calls**: Efficient database storage
- **Deduplication**: Skips already-stored images
- **Result summary**: Shows stored/skipped/failed counts
- **Authentication required**: Only available when logged in

### Real Tumblr Notes (v0.60.2)
- **`notes_info=true`**: Fetch up to 50 notes per post from Tumblr API
- **Real usernames**: Display actual Tumblr users who liked/reblogged
- **Note metadata**: Blog name, avatar URL, timestamp, comment text
- **Fallback system**: Uses mock data when notes unavailable
- **Dual display**: Real notes in both ImageViewer and post feed

---

## Preferences & Settings

### User Preferences (Settings Page)
- **Theme selection**: Light, Dark, System
- **Font size**: Adjustable text size
- **View mode**: Full or Images Only (dashboard default)
- **Accessibility**:
  - Reduced motion toggle
  - Haptics enable/disable
  - Gestures enable/disable

### Preference Persistence
- **Database storage**: Saved per user in SQLite
- **Automatic sync**: Loads on login
- **Real-time updates**: Changes apply immediately
- **Cross-session**: Preserved across browser sessions

---

## Search System

### Enhanced Search Interface
- **Improved filter layout**: Less crowded, organized layout
- **Content type filter**: Dedicated row (All, Text, Photos, Videos, Audio)
- **Sort and time filters**: Side-by-side responsive layout
- **Real-time results**: Instant feedback as you type
- **Search suggestions**: Auto-complete for common terms

### Blog Search
- **6 Mock Blogs**: Pre-loaded test blogs with rich content
  - **Photo Archive** 📸: 8,547 posts, 45k+ followers (300 test images)
  - **Aesthetic Vibes**: Aesthetic photos and inspiration
  - **Tech Insights**: Technology and programming content
  - **Art & Creativity**: Amazing artwork showcase
  - **Through the Lens**: Photography blog
  - **Words & Stories**: Creative writing and poetry
- **Blog cards**: Beautiful cards with header images, avatars, stats
- **Subscribe from search**: Subscribe directly from search results
- **Open in new tab**: View blog button opens blog in new tab

### Search Features
- **Search page**: `/search`
- **Search history**: Stored per user
- **Tag search**: Global tag exploration
- **Cached results**: Instant repeat searches (10-minute cache)
- **Image preloading**: Blog images preload automatically

---

## Subscription System

### Subscribe to Blogs
- **Blog page subscribe**: Large button in blog header
- **Search results subscribe**: Subscribe from search cards
- **Visual feedback**: 
  - Primary blue "Subscribe" button when not subscribed
  - Outlined with checkmark "Subscribed" when subscribed
- **State management**: Persists while browsing (session-based)
- **Toggle subscription**: Click again to unsubscribe
- **Icons**: Plus icon (+) for subscribe, checkmark (✓) when subscribed

---

## Interactive Dashboard

### Clickable Elements
- **Blog names**: Click to open blog in new tab (blue on hover)
- **Notes count**: Click "X notes" to open blog in new tab
- **Like posts**: Heart button with filled/unfilled states
- **Visual feedback**: Red heart when liked, gray when not
- **State persistence**: Likes persist during session

---

## Advanced Image Viewer

### New Features
- **Image counter**: Shows "X / Y" (e.g., "5 / 300") in top-left
- **Jump to end**: Down arrow button to jump to last image instantly
- **Select images**: Toggle selection with dedicated button
  - Blue highlighted when selected
  - Checkmark icon indicates selection
  - Multi-select capability across viewing session
- **Persistent features**: Counter, selection, navigation all work together

### Enhanced Navigation
- **Keyboard shortcuts**: Arrow keys for navigation
- **Visual navigation**: Prev/Next buttons
- **Jump to end**: Single click to last image
- **Smart positioning**: Counter and controls don't interfere with image

---

## Advanced Grid Selection System (v0.9.0)

### Grid Selection Features
- **Direct selection**: Click checkbox overlay on grid images
- **Multi-select modes**:
  - **Single select**: Click checkbox to toggle
  - **Range select**: Shift + Click to select range
  - **Multi-toggle**: Ctrl/Cmd + Click for individual toggles
  - **Normal click**: Opens image viewer (no Ctrl/Cmd)
- **Selection toolbar**:
  - **Count display**: "X of Y selected"
  - **Select All**: Select all visible filtered images
  - **Deselect All**: Clear all selections
  - **Invert Selection**: Toggle all selections
  - **Download button**: Download selected images (UI ready)
  - **Delete button**: Delete selected images (UI ready)
- **Visual feedback**:
  - Checkbox overlay on hover (top-left corner)
  - Blue selection overlay on selected images
  - Blue checkmark in checkbox when selected
  - Scale-down effect on selected images
  - Hover effects disabled for selected items

### Advanced Image Filtering
- **Size filter**:
  - **Small**: < 600,000 pixels
  - **Medium**: 600,000 - 1,000,000 pixels
  - **Large**: > 1,000,000 pixels
- **Date filter**:
  - **Today**: Last 24 hours
  - **This Week**: Last 7 days
  - **This Month**: Last 30 days
- **Sort options**:
  - **Recent**: Newest first (default)
  - **Oldest**: Oldest first
  - **Popular**: Most notes first
- **Filter UI**:
  - Sidebar panel (hidden on mobile/tablet, visible on desktop)
  - Active filter count badge
  - "Clear All" quick action
  - Real-time filtering (no page reload)

### Keyboard Navigation
- **Home**: Jump to first image in grid
- **End**: Jump to last image in grid
- **Page Up**: Move up 3 rows in grid
- **Page Down**: Move down 3 rows in grid
- **Arrow Up**: Move focus up one row
- **Arrow Down**: Move focus down one row
- **Arrow Left**: Move focus left one image
- **Arrow Right**: Move focus right one image
- **Enter**: Open focused image in full viewer
- **Space**: Toggle selection on focused image
- **Visual indicators**:
  - Focus ring (blue/primary color) on focused image
  - Ring offset for clear visibility
  - Focus state persists during keyboard navigation

### Selection Workflow
1. **Switch to Images Only mode** in blog view
2. **Hover over images** to see checkbox overlay
3. **Click checkbox** or use Ctrl/Cmd+Click to select
4. **Use toolbar** to select all, invert, or clear
5. **Filter images** by size, date, or popularity
6. **Navigate with keyboard** for efficient selection
7. **Download or delete** selected images (via toolbar)

### Empty State
- **No results message**: "No images match your filters"
- **Clear filters button**: One-click reset to see all images
- **Icon indicator**: Visual feedback for empty state

---

## Comprehensive Caching System

### Multi-Layer Caching
- **Service Worker**: Browser-level caching for offline support
- **React Query**: In-memory + localStorage persistence (7 days)
- **Image Cache**: Aggressive image preloading and caching (90 days)
- **API Cache**: Smart API response caching (24 hours)

### Image Caching
- **500+ images**: Local images cached for 90 days
- **300+ external**: External CDN images cached for 60 days
- **Automatic preload**: Blog images preload when search results arrive
- **Smart cleanup**: Expired entries removed automatically
- **Quota management**: Purges on quota exceeded

### Cache Features
- **Instant loading**: Cached images load immediately
- **Offline support**: Works without internet connection
- **Reduced bandwidth**: Saves data on repeat visits
- **Performance boost**: 10x faster repeat searches
- **Documentation**: Full caching guide in `CACHING.md`

### Storage Usage
- Service Worker: ~50-100 MB (images + assets)
- localStorage (React Query): ~5-10 MB (JSON data)
- localStorage (Image metadata): ~100 KB
- Total: ~50-115 MB (well within browser limits)

---

## Additional Features

### Performance
- **Lazy loading**: Images load on demand
- **Infinite scroll**: Efficient post loading
- **Optimized animations**: Framer Motion with reduced motion support
- **Code splitting**: TanStack Router-based routing

### PWA Features
- **Service worker**: Offline capability ready
- **Manifest**: Web app installation
- **Cache strategy**: Stale-while-revalidate

### Developer Features
- **TypeScript**: Full type safety
- **Prisma ORM**: Type-safe database queries
- **React Query**: Smart data fetching and caching
- **Jotai**: Atomic state management
- **Tailwind CSS**: Utility-first styling

---

## Mobile Optimizations (v0.10.1)

### 📱 Mobile-First Design
- **Responsive navigation**: Mobile bottom nav bar with Home, Search, Stored, Profile, Settings
- **Hamburger menu**: Collapsible navigation on mobile devices
- **Touch-optimized**: All buttons have proper touch targets (44px minimum)
- **Touch manipulation**: CSS touch-manipulation for better responsiveness
- **Viewport fixes**: Prevents unwanted zooming, proper scaling on all devices
- **Safe area support**: iPhone notch and home indicator spacing

### Mobile Range Selection
- **Two-tap mode**: Mobile-friendly range selection without Shift key
- **Range button**: Dedicated "Range" button in toolbar (mobile only)
- **Visual feedback**: 
  - Yellow ring around range start image
  - "START" badge on first selected image
  - Button changes to "End" after first tap
- **Workflow**:
  1. Tap "Range" button
  2. Tap first image (marked with "START")
  3. Tap last image (all between selected automatically)

### Mobile UI Improvements
- **Compact layouts**: Reduced padding, spacing, and text sizes on mobile
- **Sticky positioning**: Selection toolbar and filters stick properly below nav
- **Two-row toolbar layout**:
  - Row 1: Counter + Range + Select All/Deselect
  - Row 2: Action buttons (Share, Download, Store, Delete)
- **Icon-only buttons**: Labels hidden on smallest screens to save space
- **Responsive text**: Scales from xs to sm/base based on screen size
- **Line clamping**: Long text truncates with ellipsis on mobile
- **Flexible grids**: Stack vertically on mobile, wrap on larger screens

### Touch Enhancements
- **Active states**: Scale-down effect on button press (active:scale-95)
- **Prevent conflicts**: Proper event handling (preventDefault, stopPropagation)
- **No double-tap zoom**: Disabled to prevent iOS zoom on buttons
- **Smooth scrolling**: Touch-friendly scrolling for keyboard navigation

---

## Image Management (v0.10.0)

### Download & Share System
- **Web Share API**: Share to Photos app on iOS/Android
- **Direct download**: Save images to device on desktop
- **Batch operations**: Download/share multiple images at once
- **Progress tracking**: Shows "X/Y" progress during operations
- **Metadata sidecar files**: `.txt` files with complete Tumblr metadata
- **Filename patterns**: Customizable naming (see Settings)

### Filename Patterns
User can choose from 6 patterns in Settings:
1. **Blog + Tags + Date**: `photoarchive_nature-landscape_2025-10-15.jpg`
2. **Date + Blog + Tags**: `2025-10-15_photoarchive_nature-landscape.jpg`
3. **Blog + Description**: `photoarchive_beautiful-sunset.jpg`
4. **Tags Only**: `nature-landscape-photography.jpg`
5. **Timestamp**: `photoarchive_1760549272501.jpg`
6. **Simple**: `photoarchive_image_1.jpg`
- **Include index**: Optional sequential numbering for batch downloads
- **Include metadata files**: Optional `.txt` sidecar files (default: off)

### Metadata Sidecar Files (Optional)
When enabled in Settings, each downloaded image includes a companion `.txt` file with:
- Blog name and URL
- Post URL and timestamp
- Description/caption
- Tags (space-separated and macOS Spotlight format)
- Notes count
- Engagement statistics
- Download timestamp
- **Note**: Disabled by default; enable in Settings > Downloads > Include Metadata Files (.txt)

### Store to Database
- **Permanent storage**: Save images to PostgreSQL database
- **Smart deduplication (v0.60.5)**: Prevents duplicate images across ALL blogs
  - Detects same post from same blog (by postId)
  - Detects same image from different blogs (by URL)
  - Prevents storing reblogs and cross-posts
- **User-controlled deduplication (v0.60.6)**: Choose your deduplication mode in Settings
  - **Strict mode (default)**: No duplicate URLs (saves space, prevents reblogs)
  - **Allow duplicates mode**: Same image from different blogs OK (tracks different contexts)
  - Always prevents same post from same blog, regardless of setting
- **Batch storage**: Store multiple images at once
- **Success feedback**: Shows "Stored: X / Skipped: Y" count
- **Cost tracking**: Optional monetary value field for each image
- **View stored images**: Dedicated "Stored" page with full grid features

### Stored Images Page (`/stored`) - Enhanced (v0.80.0)
- **Pagination system**: Load 50 images at a time, expandable to ALL
- **Load More button**: Fetch next 50 images
- **Load All button**: Load ALL remaining images in batches
- **Progress tracking**: Shows "X of Y images" with remaining count
- **Real Notes Display**: Shows actual Tumblr notes (likes, reblogs, comments)
- **Filter by blog**: View images from specific blogs (limit customizable 5-100)
- **Blog filter indicator**: "+X more blogs" when limit exceeded
- **Statistics**: Total images, breakdown by blog, total cost tracking
- **Cost management**: View and update monetary value of stored images
- **Delete from storage**: Remove stored images
- **All grid controls**: Columns, size, resolution, date, sort
- **Full grid features**: Selection, filtering, keyboard nav, download
- **Same UX**: Identical to blog Images Only view

### Cost Tracking (v0.10.4)
- **Per-image cost**: Track monetary value of each stored image
- **Total cost stats**: See total investment across all stored images
- **Per-blog breakdown**: View cost totals by blog source
- **Update costs**: Modify image costs via API or UI
- **Optional field**: Cost is not required when storing images
- **Use cases**: Digital collectibles, art purchases, NFTs, investment tracking

---

## Grid Customization

### Display Settings
- **Grid columns**: 2-6 columns (adjustable in filter bar)
- **Image size**: 
  - Compact: 0.25rem gap
  - Comfortable: 0.5rem gap (default)
  - Spacious: 1rem gap
- **Real-time updates**: Changes apply immediately
- **Persistent preferences**: Saved to user settings

### Filter Controls
- **Multi-select filters**: Size and date filters work as toggles
- **Resolution filter**: Small/Medium/Large (by pixel count)
- **Date filter**: Today/This Week/This Month
- **Sort options**: Recent/Oldest/Popular
- **Sticky toggle**: Lock/unlock filter bar to top of page
- **Active count badge**: Shows number of active filters
- **Clear all**: One-click reset

### Sticky Positioning
- **Navigation bar**: Always at top (z-50, top-0)
- **Selection toolbar**: Sticks below nav (z-20, top-16)
- **Filter bar**: Sticks below toolbar when locked (z-10, top-32)
- **Proper layering**: No overlap between sticky elements
- **Mobile-friendly**: Works perfectly on iPhone/Android

---

## Recent Additions (v0.10.4)

### ✅ New in v0.10.4
- [x] **Cost tracking** for stored images
- [x] **Cost field** in StoredImage database table (Float, optional)
- [x] **Update cost API** endpoint (`PATCH /api/stored-images/:id`)
- [x] **Enhanced stats endpoint** with total cost and per-blog cost breakdown
- [x] **Investment tracking** for digital collectibles and art

### ✅ New in v0.10.2
- [x] **Optional metadata files**: Setting to enable/disable .txt sidecar file downloads
- [x] **User control**: Metadata files now off by default, can be enabled in Settings
- [x] **Cleaner downloads**: Users can choose image-only downloads or include full metadata

### ✅ New in v0.10.1
- [x] **Mobile range selection** with two-tap mode
- [x] **Mobile bottom navigation** bar for quick access
- [x] **Sticky positioning fixes** for selection toolbar and filters
- [x] **Touch handling improvements** (proper preventDefault, scale feedback)
- [x] **Compact mobile layouts** throughout the app
- [x] **Responsive selection toolbar** (two-row layout)
- [x] **iPhone viewport fixes** (no unwanted zoom, proper scaling)
- [x] **Touch-optimized buttons** with proper target sizes
- [x] **Mobile-friendly card view** in blog posts

### ✅ New in v0.10.0
- [x] **Download functionality** with Web Share API
- [x] **Share to Photos** app on mobile devices
- [x] **Metadata sidecar files** for all downloads
- [x] **6 filename patterns** in Settings
- [x] **Store to database** feature
- [x] **Stored images page** with full grid features
- [x] **Grid customization** (2-6 columns, 3 sizes)
- [x] **Multi-select filters** (size, date work as toggles)
- [x] **Sticky filter bar** with lock/unlock toggle
- [x] **PostgreSQL migration** from SQLite
- [x] **Admin system** with role-based access
- [x] **Advanced authentication** (email verification, password reset)
- [x] **Database seeding** with test data

### ✅ Implemented in v0.9.0
- [x] **Grid selection system** with checkboxes and multi-select
- [x] **Selection toolbar** with bulk actions
- [x] **Advanced filtering** (size, date, popularity)
- [x] **Keyboard navigation** (Home, End, Page Up/Down, arrows, Space, Enter)
- [x] **Visual focus indicators** for keyboard navigation
- [x] **Range selection** with Shift+Click (desktop)
- [x] **Individual toggle** with Ctrl/Cmd+Click
- [x] **Version badge** on all pages

### ✅ Implemented in v0.8.0
- [x] Enhanced search UI with improved filter layout
- [x] Blog search with 6 pre-loaded blogs
- [x] Multi-layer caching system
- [x] Image preloading for instant loading
- [x] Like functionality with visual feedback
- [x] Image counter in viewer
- [x] Jump to start/end buttons in image viewer
- [x] Select images capability in modal viewer
- [x] Follow/unfollow blogs
- [x] Clickable blog names and notes

---

## Tumblr OAuth Integration (v0.82.0+)

### OAuth 1.0a Authentication
- **Full OAuth flow** - Complete Tumblr OAuth 1.0a implementation
- **Popup authorization** - Opens Tumblr auth in popup window
- **Token management** - Secure token storage in database
- **Connection status** - Real-time connection status checking
- **Disconnect capability** - Easy account disconnection

### OAuth Features
- ✅ **Access private blogs** - View blogs you follow
- ✅ **Full notes data** - Get all notes (not limited to 50)
- ✅ **Higher rate limits** - Per-user quota tracking
- ✅ **Authenticated requests** - Access user-specific content
- 🔜 **Like/unlike posts** - Interaction with posts (ready to implement)
- 🔜 **Reblog posts** - Reblog to your blog (ready to implement)
- 🔜 **Create posts** - Post new content (ready to implement)

### User Interface
- **Settings integration** - OAuth card in Settings page
- **Connection card** - Shows connection status and username
- **One-click connect** - Simple connection flow
- **Visual feedback** - Clear connected/disconnected states
- **Security indicators** - Connection timestamp displayed

### Security
- ✅ **HMAC-SHA1 signing** - Industry-standard request signing
- ✅ **Token encryption** - Secure token storage
- ✅ **Backend-only secrets** - Consumer secret never exposed
- ✅ **Automatic cleanup** - Old request tokens purged hourly
- ✅ **HTTPS required** - Secure communication in production

**See `OAUTH_GUIDE.md` for complete setup and usage instructions.**

---

## Progressive Web App (PWA)

### Service Worker
- **Workbox-powered** - Enterprise-grade service worker
- **Automatic caching** - Smart caching strategies
- **Offline support** - Works without internet connection
- **Update notifications** - Notifies when new version available
- **Background updates** - Updates cache in background

### Caching Strategies

**Images:**
- Local images: 500 entries, 90 days, cache-first
- External images: 300 entries, 60 days, cache-first
- Automatic quota management with purging

**API Responses:**
- Network-first strategy for fresh data
- 100 entries, 24-hour cache
- Graceful offline fallback

**Static Assets:**
- Stale-while-revalidate for instant loading
- CSS, JavaScript, fonts cached indefinitely
- Background updates for latest versions

**Fonts:**
- 30 font files, 1-year cache
- Cache-first for instant rendering

### Offline Capabilities
- ✅ **Offline fallback page** - Custom offline experience
- ✅ **Cached navigation** - Navigate offline to cached pages
- ✅ **Cached images** - View previously loaded images
- ✅ **Cached API data** - Access recent data offline
- 🔜 **Background sync** - Sync changes when back online (ready)
- 🔜 **Push notifications** - Real-time notifications (ready)

### Update System
- **Hourly checks** - Checks for updates every hour
- **Instant updates** - Option to update immediately
- **Skip waiting** - Activates new version without delay
- **Automatic reload** - Reloads page with new version

### Performance
- **33x faster** - Repeat visits load 33x faster
- **~85ms load time** - Cached pages load in <100ms
- **~75-120 MB cache** - Reasonable storage usage
- **Automatic cleanup** - LRU eviction when quota exceeded

**See `SERVICE_WORKER.md` for complete technical documentation.**

---

## Admin Dashboard Enhancements (v0.82.0+)

### Database Statistics
- **Comprehensive stats** - Complete database size and breakdown
- **Per-table analysis** - Row counts and sizes for each table
- **Storage categories** - Grouped by feature (Auth, Content, etc.)
- **Safe error handling** - Graceful fallback for missing tables
- **Real-time data** - Live queries to PostgreSQL system tables

### API Quota Tracking
- **Database-backed** - Persistent API call tracking
- **Historical data** - Retain daily usage history
- **Visual dashboard** - Real-time quota monitoring
- **Color-coded warnings** - Green/yellow/red status indicators
- **Capacity calculator** - Shows what you can do with remaining quota

### Display Features
```
Database Statistics:
  - Total database size
  - Per-table breakdown
  - Row counts
  - Storage by category
  
API Usage:
  - Daily calls (X / 5,000)
  - Hourly limit (1,000/hour)
  - Usage percentage
  - Remaining capacity
  - Reset time
```

---

## Advanced Download System

### File System Access API
- **Directory picker** - Choose download location
- **Subdirectory creation** - Auto-creates blog-named folders
- **Batch operations** - Download hundreds of images efficiently
- **Progress tracking** - Real-time download progress
- **Fallback support** - Works in all browsers

### Directory Structure
```
Downloads/
  └── blogname/
      ├── image001.jpg
      ├── image002.jpg
      └── image003.jpg
```

### User Gesture Preservation
- **Proper flow** - Request directory FIRST (preserves gesture)
- **Then fetch** - Download images after directory selected
- **Security compliant** - Follows browser security requirements
- **Diagnostic logging** - Comprehensive console feedback

### Browser Support
- ✅ Chrome 86+ - Full support
- ✅ Edge 86+ - Full support
- ✅ Opera 72+ - Full support
- ⚠️ Firefox - Fallback (filename prefixes)
- ⚠️ Safari - Fallback (filename prefixes)

**See version history (v0.84.2+) for complete implementation details.**

---

## Upcoming Features

- [ ] Post creation and editing
- [ ] Draft management
- [ ] Full follow/unfollow system with backend persistence
- [ ] Notifications system
- [ ] Direct messaging
- [ ] Reblog functionality
- [ ] Comment system
- [ ] Content moderation tools
- [ ] Export/import data
- [ ] Persist follow state to database
- [ ] Persist likes to database
- [ ] Drag-and-drop selection
- [ ] Image cropping and editing
- [ ] Bulk tag editing
- [ ] Advanced search filters

