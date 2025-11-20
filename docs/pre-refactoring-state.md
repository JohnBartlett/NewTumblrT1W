# Pre-Refactoring State Snapshot

**Version:** v0.93.0  
**Snapshot Date:** 2025-11-03  
**Purpose:** Document current state before v1.0.0 refactoring begins

---

## 📋 Current Feature List

### 1. BlogImages Page (`/images/:blogName`)

**Status:** ✅ Fully Functional

#### Features:

- ✅ Fetch images from Tumblr API (with pagination)
- ✅ Display images in grid layout
- ✅ Infinite scroll / "Load More" button
- ✅ Individual image selection (click checkbox)
- ✅ Range selection (Shift+Click)
- ✅ Select/Deselect all
- ✅ Filter by:
  - Media type (photo/video/all)
  - Tags
  - Date range
- ✅ Sort by:
  - Date (newest/oldest)
  - Size
  - Filename
- ✅ **Store to Database** (cache selected images)
- ✅ **Download images** (browser native download)
- ✅ **Download All to Folder** (File System Access API)
  - Creates folder with blog name
  - Batched processing (20 images/batch)
  - Progress tracking
  - Cancellation support
- ✅ **Share images** (Web Share API)
- ✅ **Download with metadata** (.json sidecar files)
- ✅ View full-size image (modal)

#### Known Issues:

- ⚠️ File is 1200+ lines (needs refactoring)
- ⚠️ Mixed concerns (UI + logic + API calls)
- ⚠️ Complex state management (many useState calls)

---

### 2. StoredImages Page (`/stored`)

**Status:** ✅ Fully Functional

#### Features:

- ✅ Display images stored in PostgreSQL database
- ✅ Filter by:
  - Blog name
  - Media type
  - Tags
  - Date added
- ✅ Sort by various criteria
- ✅ Select/deselect images (individual + range + all)
- ✅ **Download selected images**
  - Batched download (20 images/batch)
  - Rate limiting (800ms delay)
  - Retry logic (3 attempts)
  - Progress tracking
- ✅ **Download All to Folder**
  - Auto-loads all images first (if >50)
  - Creates folder with blog name
  - Batched processing
  - Real-time progress panel
  - **Stop Download** button (graceful cancellation)
  - Error tracking and reporting
- ✅ **Delete from storage**
  - Individual delete
  - Bulk delete
  - Confirmation dialogs
- ✅ **Share images** (Web Share API)
- ✅ View full-size image

#### Recent Fixes (v0.93.0):

- ✅ Fixed: Download All now actually downloads ALL images, not just first 50
- ✅ Fixed: Directory picker "Must be handling a user gesture" error
- ✅ Fixed: Folder naming uses correct blog name (not stale state)
- ✅ Fixed: Close button properly clears download state

---

### 3. Download System

**Status:** ✅ Production Ready (v0.93.0)

#### Components:

- **DownloadStatus Panel** (Floating UI)
  - Real-time progress bars
  - Current/total counts
  - Percentage complete
  - Time remaining estimate
  - Success/failed statistics
  - Error list (expandable)
  - **Stop Download** button
  - **Close** button
  - Minimizable

- **Panic Button** (Emergency Stop)
  - Double-click confirmation
  - Cancels all active downloads
  - Calls `/api/emergency-stop` endpoint
  - Reloads page
  - Always visible (bottom-right corner)

#### Features:

- ✅ Batched processing (20 images at a time)
- ✅ Rate limiting (800ms delay between batches)
- ✅ Retry logic (3 attempts per image)
- ✅ Graceful cancellation
- ✅ Progress persistence (localStorage)
- ✅ Error tracking per image
- ✅ Centralized logging (console + IndexedDB)
- ✅ Folder creation (File System Access API)
- ✅ Filename sanitization
- ✅ Blob validation

---

### 4. State Management

**Current Architecture:** Jotai (atomic state)

#### State Atoms:

**`store/operations.ts`** (Used by BlogImages)

- `currentOperationAtom` - Current download/storage operation
- `operationProgressAtom` - Progress tracking
- `cancelOperationAtom` - Cancellation flag
- Actions: `startOperation`, `updateProgress`, `completeOperation`, `cancelOperation`

**`store/downloads.ts`** (Used by StoredImages)

- `activeDownloadAtom` - Current download operation (with localStorage persistence)
- `downloadProgressAtom` - Download progress tracking
- `cancelRequestedAtom` - Cancellation flag
- Actions: `startDownloadAtom`, `updateDownloadProgressAtom`, `completeDownloadAtom`, `cancelDownloadAtom`, `clearDownloadAtom`

#### Issue:

- ⚠️ **Two separate state stores for similar functionality**
- ⚠️ `operations.ts` and `downloads.ts` have overlapping responsibilities
- ⚠️ Inconsistent persistence (operations.ts doesn't persist, downloads.ts does)

---

### 5. Logging & Diagnostics

**Status:** ✅ Implemented (v0.93.0)

#### Logger Utility (`utils/logger.ts`)

- Centralized logging with categories
- Log levels: debug, info, warn, error, userAction
- Console output (color-coded)
- IndexedDB persistence (survives page reloads)
- Export logs functionality
- Filter by level/category/date

#### Usage Throughout App:

- Download operations
- Storage operations
- API calls
- User actions
- Error tracking

---

### 6. API Endpoints

#### Server (`server/index.ts`)

- `POST /api/auth/login` - User authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/forgot-password` - Password reset
- `GET /api/images/:blogName` - Fetch blog images from Tumblr
- `GET /api/stored-images` - Get stored images from DB
- `POST /api/store-images` - Store images to DB
- `DELETE /api/stored-images/:id` - Delete image from DB
- `POST /api/emergency-stop` - Emergency stop endpoint (v0.93.0)

---

## 🐛 Known Issues

### High Priority

1. **Code Duplication** ⚠️
   - `BlogImages.tsx` and `StoredImages.tsx` have similar download logic
   - Two separate state management systems (`operations.ts` vs `downloads.ts`)
   - Scattered file system operations

2. **Component Size** ⚠️
   - `BlogImages.tsx` is 1200+ lines (too large)
   - Mixed concerns (UI rendering + business logic + API calls)
   - Difficult to test and maintain

3. **State Management Fragmentation** ⚠️
   - No single source of truth for download operations
   - Inconsistent persistence patterns
   - Difficult to track overall application state

### Medium Priority

4. **No Virtual Scrolling** ⚠️
   - Performance issues with 1000+ images
   - All images rendered at once

5. **Limited Test Coverage** ⚠️
   - No unit tests for download logic
   - No integration tests for download flows
   - No E2E tests for critical user journeys

6. **Inconsistent Error Handling** ⚠️
   - Different error patterns in different components
   - No centralized error boundary
   - Some errors not logged

### Low Priority

7. **No Component Library** ℹ️
   - Components lack clear hierarchy
   - No design system
   - Inconsistent styling patterns

8. **Limited TypeScript Coverage** ℹ️
   - Some `any` types remain
   - Not all functions have explicit return types
   - Some interfaces could be more specific

---

## 👤 User Workflows to Preserve

### Workflow 1: Browse & Store Images

**User Journey:**

1. Navigate to `/images/:blogName`
2. Browse images (infinite scroll)
3. Select desired images (click checkboxes)
4. Click "Store Selected to Database"
5. See success message
6. Navigate to `/stored` to verify

**Expected Result:** Selected images appear in StoredImages page

---

### Workflow 2: Download Images to Folder

**User Journey:**

1. Navigate to `/stored`
2. Filter by blog name
3. Click "Download All @blogname to Folder"
4. (If >50 images) Confirm "Load all remaining images?"
5. Wait for loading (button shows "Loading images...")
6. Directory picker opens
7. Select destination folder
8. Confirm download
9. Watch progress in DownloadStatus panel
10. Close panel when complete

**Expected Result:** All images downloaded to folder named after blog

---

### Workflow 3: Emergency Stop

**User Journey:**

1. Start large download operation
2. Realize error or need to stop
3. Double-click Panic Button (bottom-right)
4. Confirm emergency stop
5. Page reloads
6. All operations cancelled

**Expected Result:** Download stopped, no partial files, clean state

---

### Workflow 4: Filter & Select Range

**User Journey:**

1. Navigate to `/stored`
2. Apply filters (blog name + date range)
3. Click first image checkbox
4. Shift+Click last image checkbox
5. All images in range selected
6. Click "Download Selected"

**Expected Result:** Only selected images downloaded

---

### Workflow 5: View Full-Size Image

**User Journey:**

1. Browse images in either page
2. Click on image thumbnail
3. Modal opens with full-size image
4. Click outside or press Escape to close

**Expected Result:** Full-size image displayed, modal closes cleanly

---

## 📁 File Structure Snapshot

```
NewTumblrT3/
├── docs/
│   ├── DOWNLOAD_SYSTEM_FIX_PLAN.md (v0.92.2 plan, implemented in v0.93.0)
│   └── V0.93.0_IMPLEMENTATION_SUMMARY.md (v0.93.0 summary)
├── server/
│   └── index.ts (Express server with API routes)
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   ├── DownloadStatus.tsx (Download progress panel)
│   │   │   ├── PanicButton.tsx (Emergency stop)
│   │   │   ├── Button.tsx (Base button component)
│   │   │   ├── Input.tsx (Base input component)
│   │   │   ├── Checkbox.tsx (Base checkbox)
│   │   │   └── ... (other UI primitives)
│   │   └── layout/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── LayoutProvider.tsx
│   ├── features/
│   │   ├── blog-images/
│   │   │   └── BlogImages.tsx (1200+ lines - NEEDS REFACTORING)
│   │   ├── stored/
│   │   │   └── StoredImages.tsx (NEEDS REFACTORING)
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   ├── Register.tsx
│   │   │   └── ForgotPassword.tsx
│   │   └── settings/
│   │       └── Settings.tsx
│   ├── hooks/
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useScrollToTop.ts
│   ├── store/
│   │   ├── operations.ts (BlogImages state - TO MERGE)
│   │   ├── downloads.ts (StoredImages state - TO MERGE)
│   │   ├── auth.ts
│   │   └── theme.ts
│   ├── utils/
│   │   ├── batchedDownload.ts (Batch download logic - TO REFACTOR)
│   │   ├── logger.ts (Centralized logging - KEEP, ENHANCE)
│   │   ├── format.ts (Date/size formatting)
│   │   └── api.ts (API client wrapper)
│   ├── types/
│   │   ├── image.ts
│   │   ├── operation.ts
│   │   └── user.ts
│   ├── App.tsx (Root component)
│   └── main.tsx (Entry point)
├── .eslintrc.json (Linting config)
├── .prettierrc (Formatting config)
├── package.json (v0.93.0)
├── tsconfig.json (TypeScript config)
├── vite.config.ts (Vite bundler config)
├── PANMD.md (Master documentation)
├── VERSION.md (Version history)
└── README.md

TO BE CREATED IN REFACTORING:
├── src/services/ (NEW - Service layer)
│   ├── download/ (Download service + strategies)
│   ├── storage/ (Storage service + strategies)
│   └── share/ (Share service)
├── src/components/
│   ├── primitives/ (NEW - Atomic design primitives)
│   ├── molecules/ (NEW - Atomic design molecules)
│   ├── organisms/ (NEW - Atomic design organisms)
│   └── pages/ (NEW - Page-level components)
├── CHANGELOG.md (NEW - Version changelog)
├── MIGRATION.md (NEW - Migration tracking)
└── .github/
    └── pull_request_template.md (NEW - PR template)
```

---

## 🔧 Technology Stack (Current)

### Frontend

- **Framework:** React 18.3.1
- **State Management:** Jotai 2.10.3
- **Routing:** TanStack Router 1.80.3
- **Query:** TanStack Query 5.62.7
- **Styling:** Tailwind CSS 3.4.17
- **Animation:** Framer Motion 11.15.0
- **Form Validation:** Zod 3.24.1
- **Build Tool:** Vite 6.0.7
- **TypeScript:** 5.7.3

### Backend

- **Server:** Express.js 4.21.2
- **Database:** PostgreSQL (via Prisma)
- **ORM:** Prisma 6.2.1
- **Auth:** Custom JWT implementation
- **CORS:** cors 2.8.5

### APIs Used

- **Tumblr API v2** (via `tumblr.js`)
- **File System Access API** (browser native)
- **Web Share API** (browser native)
- **IndexedDB API** (browser native - for logs)

### Testing (To Be Enhanced)

- **Unit:** Vitest (planned)
- **Integration:** React Testing Library (planned)
- **E2E:** Playwright (planned)

### Development Tools

- **Linting:** ESLint 9.18.0
- **Formatting:** Prettier 3.4.2
- **Git Hooks:** Husky + lint-staged
- **Package Manager:** npm

---

## 📊 Current Metrics

### Code Statistics

- **Total Files:** ~150 (excluding node_modules)
- **Total Lines of Code:** ~15,000
- **Largest Component:** `BlogImages.tsx` (1200+ lines)
- **Average Component Size:** ~300 lines
- **TypeScript Coverage:** ~85% (some `any` types remain)

### Performance (Current)

- **Initial Load Time:** ~2-3 seconds (local dev)
- **Time to Interactive:** ~4 seconds
- **Load 1000 Images:** ~15-20 seconds (no virtual scroll)
- **Memory Usage (Idle):** ~80MB
- **Memory Usage (1000 images):** ~300MB

### Test Coverage

- **Unit Tests:** 0% (none written yet)
- **Integration Tests:** 0%
- **E2E Tests:** 0%
- **Manual Testing:** Extensive ✅

---

## 🎯 Refactoring Targets

### Must Fix

1. ✅ Unify `operations.ts` + `downloads.ts` into single source of truth
2. ✅ Break down `BlogImages.tsx` (1200+ lines → <200 lines per file)
3. ✅ Implement service layer (download, storage, share)
4. ✅ Create custom hooks (useDownload, useStorageOperations, etc.)
5. ✅ Establish Atomic Design component hierarchy

### Should Fix

6. ✅ Add virtual scrolling for large image lists
7. ✅ Implement comprehensive test suite
8. ✅ Improve TypeScript coverage (eliminate `any` types)
9. ✅ Add error boundaries
10. ✅ Optimize bundle size (code splitting, lazy loading)

### Nice to Have

11. ✅ Storybook for component documentation
12. ✅ Visual regression testing
13. ✅ Accessibility audit (WCAG 2.1 AA)
14. ✅ Performance monitoring (Lighthouse CI)
15. ✅ End-user documentation

---

## 💾 Data to Preserve

### localStorage Keys (v0.93.0)

```typescript
{
  "activeDownload": {
    id: string,
    type: "download" | "storage" | "delete",
    status: "running" | "paused" | "completed" | "cancelled" | "error",
    folderName: string,
    totalItems: number,
    completedItems: number,
    failedItems: number,
    startedAt: timestamp,
    // ... more fields
  },
  "theme": "light" | "dark",
  "authToken": string,
  "user": { id, email, username },
  // ... other keys
}
```

### IndexedDB Stores

- **logs** (created by logger.ts)
  - id: string (timestamp-based)
  - timestamp: number
  - level: "debug" | "info" | "warn" | "error"
  - category: string
  - message: string
  - data: unknown

### PostgreSQL Tables (Prisma Schema)

- **User** (id, email, username, passwordHash, createdAt, updatedAt)
- **StoredImage** (id, url, blogName, postId, filename, filetype, width, height, tags, metadata, userId, createdAt)
- **Session** (id, userId, token, expiresAt, createdAt)

---

## ✅ Success Criteria for Refactoring

### Functional

- ✅ All user workflows work identically
- ✅ Zero data loss
- ✅ All API endpoints respond correctly
- ✅ All existing features preserved

### Code Quality

- ✅ No file >300 lines
- ✅ No function >50 lines
- ✅ Clear separation of concerns
- ✅ Single source of truth for state
- ✅ Consistent naming conventions

### Performance

- ✅ Initial load time improved (or equal)
- ✅ Memory usage reduced by 30%+
- ✅ Smooth 60fps scrolling (virtual scroll)
- ✅ Faster time to interactive

### Testing

- ✅ 80%+ code coverage
- ✅ All critical paths have E2E tests
- ✅ No regressions detected

### Documentation

- ✅ All public APIs documented (JSDoc)
- ✅ Architecture diagram created
- ✅ Migration guide complete
- ✅ README updated

---

_Snapshot Version: 1.0_  
_Created: 2025-11-03_  
_For Refactoring: v1.0.0_  
_From Version: v0.93.0_
