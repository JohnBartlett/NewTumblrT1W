# Migration Guide: v0.93.0 → v1.0.0

**Refactoring Status:** 🔄 Planning Phase  
**Target Completion:** TBD  
**Last Updated:** 2025-11-03

This document tracks the migration progress from the current state (v0.93.0) to the refactored architecture (v1.0.0).

---

## 📊 Overall Progress

```
Phase 1: Foundation          [░░░░░░░░░░] 0%   ⏸️ Not Started
Phase 2: Service Layer       [░░░░░░░░░░] 0%   ⏸️ Not Started
Phase 3: Business Logic      [░░░░░░░░░░] 0%   ⏸️ Not Started
Phase 4: UI Refactoring      [░░░░░░░░░░] 0%   ⏸️ Not Started
Phase 5: Migration & Cleanup [░░░░░░░░░░] 0%   ⏸️ Not Started
Phase 6: Deployment          [░░░░░░░░░░] 0%   ⏸️ Not Started

Overall Progress:            [░░░░░░░░░░] 0/6 Phases Complete
```

---

## 🏗️ Phase 1: Foundation Setup

**Status:** ⏸️ Not Started  
**Estimated Time:** 1-2 days  
**Assigned To:** TBD

### Checklist

#### Directory Structure

- [ ] Create `/src/services/` directory
  - [ ] `/src/services/download/`
  - [ ] `/src/services/storage/`
  - [ ] `/src/services/share/`
- [ ] Create `/src/hooks/` subdirectories (if needed)
- [ ] Create `/src/components/primitives/`
- [ ] Create `/src/components/molecules/`
- [ ] Create `/src/components/organisms/`
- [ ] Create `/src/components/pages/`
- [ ] Create `/src/utils/download/`
- [ ] Create `/src/utils/file/`
- [ ] Create `/src/types/` subdirectories

#### Type Definitions

- [ ] Create `types/download.ts` (comprehensive download types)
- [ ] Create `types/storage.ts` (comprehensive storage types)
- [ ] Create `types/operation.ts` (unified operation types)
- [ ] Create `types/ui.ts` (UI component prop types)
- [ ] Create branded types for IDs (e.g., `OperationId`, `ImageId`)

#### State Store Setup

- [ ] Analyze `store/operations.ts` and `store/downloads.ts`
- [ ] Design unified `operations.ts` interface
- [ ] Create derived atoms for specific UI needs
- [ ] Add localStorage persistence logic
- [ ] Write migration script (v0.93.0 → v1.0.0 data format)

#### Testing Infrastructure

- [ ] Configure Vitest for unit tests
- [ ] Configure React Testing Library for integration tests
- [ ] Configure Playwright for E2E tests
- [ ] Set up test utilities and mocks
- [ ] Create test data factories
- [ ] Set up coverage reporting

#### Migration Utilities

- [ ] Create localStorage data migration script
- [ ] Create IndexedDB schema migration (if needed)
- [ ] Write rollback utilities
- [ ] Test migration with real v0.93.0 data

### Deliverables

- [ ] Complete directory structure
- [ ] All TypeScript types defined
- [ ] Unified state store designed (not implemented yet)
- [ ] Test infrastructure ready
- [ ] Migration utilities tested

### Blockers

- None (can start immediately)

---

## 🛠️ Phase 2: Service Layer Implementation

**Status:** ⏸️ Not Started  
**Estimated Time:** 2-3 days  
**Assigned To:** TBD  
**Blocked By:** Phase 1

### Checklist

#### DownloadService

- [ ] Create `services/download/DownloadService.ts` (interface)
- [ ] Implement `BatchDownloadStrategy.ts`
  - [ ] Port logic from `utils/batchedDownload.ts`
  - [ ] Add unit tests (80%+ coverage)
- [ ] Implement `SingleDownloadStrategy.ts`
  - [ ] Handle single file downloads
  - [ ] Add unit tests
- [ ] Implement `BrowserDownloadStrategy.ts`
  - [ ] Browser native download (anchor tag method)
  - [ ] Add unit tests
- [ ] Create `DownloadQueue.ts`
  - [ ] Queue management
  - [ ] Priority handling
  - [ ] Add unit tests

#### StorageService

- [ ] Create `services/storage/StorageService.ts` (interface)
- [ ] Implement `DatabaseStorageStrategy.ts`
  - [ ] PostgreSQL via Prisma
  - [ ] Add unit tests (mock Prisma)
- [ ] Implement `FileSystemStorageStrategy.ts`
  - [ ] File System Access API wrapper
  - [ ] Add unit tests (mock FS API)
- [ ] Implement `LocalStorageStrategy.ts`
  - [ ] localStorage wrapper with versioning
  - [ ] Add unit tests
- [ ] Create `StorageSync.ts`
  - [ ] Sync between database and filesystem
  - [ ] Conflict resolution
  - [ ] Add unit tests

#### ShareService

- [ ] Create `services/share/ShareService.ts`
  - [ ] Web Share API wrapper
  - [ ] Fallback for unsupported browsers
  - [ ] Add unit tests

#### File Utilities

- [ ] Create `utils/file/filesystem.ts`
  - [ ] File System Access API helpers
  - [ ] Directory creation
  - [ ] File writing
  - [ ] Error handling
  - [ ] Add unit tests
- [ ] Create `utils/file/blob.ts`
  - [ ] Blob validation
  - [ ] Blob type checking
  - [ ] Blob size helpers
  - [ ] Add unit tests
- [ ] Create `utils/file/naming.ts`
  - [ ] Filename sanitization
  - [ ] Collision detection/handling
  - [ ] Extension validation
  - [ ] Add unit tests

#### Download Utilities

- [ ] Create `utils/download/retry.ts`
  - [ ] Exponential backoff logic
  - [ ] Retry with jitter
  - [ ] Add unit tests
- [ ] Create `utils/download/validation.ts`
  - [ ] URL validation
  - [ ] Blob validation
  - [ ] MIME type checking
  - [ ] Add unit tests
- [ ] Create `utils/download/progress.ts`
  - [ ] Progress calculation
  - [ ] ETA estimation
  - [ ] Statistics tracking
  - [ ] Add unit tests

### Deliverables

- [ ] All service interfaces defined
- [ ] All service strategies implemented
- [ ] 80%+ unit test coverage
- [ ] Service API documentation (JSDoc)

### Blockers

- Waiting for Phase 1 (type definitions, test infrastructure)

---

## 🧩 Phase 3: Business Logic Layer

**Status:** ⏸️ Not Started  
**Estimated Time:** 2-3 days  
**Assigned To:** TBD  
**Blocked By:** Phase 2

### Checklist

#### Custom Hooks

- [ ] Create `hooks/useDownload.ts`
  - [ ] Unified download logic (uses DownloadService)
  - [ ] State management (uses unified operations.ts)
  - [ ] Progress tracking
  - [ ] Error handling
  - [ ] Cancellation support
  - [ ] Add integration tests
- [ ] Create `hooks/useStorageOperations.ts`
  - [ ] Storage logic (uses StorageService)
  - [ ] State management
  - [ ] Error handling
  - [ ] Add integration tests
- [ ] Create `hooks/useImageGallery.ts`
  - [ ] Gallery state (loading, filtering, sorting)
  - [ ] Pagination/infinite scroll logic
  - [ ] Virtual scroll setup
  - [ ] Add integration tests
- [ ] Create `hooks/useImageSelection.ts`
  - [ ] Selection state (individual, range, all)
  - [ ] Selection actions
  - [ ] Add integration tests
- [ ] Create `hooks/useProcessManager.ts`
  - [ ] Process lifecycle (start, pause, resume, cancel)
  - [ ] Multi-process coordination
  - [ ] Emergency stop logic
  - [ ] Add integration tests

#### Unified State Store

- [ ] Implement new `store/operations.ts`
  - [ ] Merge logic from old operations.ts + downloads.ts
  - [ ] Add derived atoms for specific UI needs
  - [ ] localStorage persistence
  - [ ] Add unit tests
- [ ] Create `store/preferences.ts`
  - [ ] User preferences (theme, sort order, filter defaults)
  - [ ] localStorage persistence
  - [ ] Add unit tests
- [ ] Create `store/ui.ts`
  - [ ] Modal state
  - [ ] Panel state (open/closed, minimized)
  - [ ] Toast notifications
  - [ ] Add unit tests

### Deliverables

- [ ] All custom hooks implemented
- [ ] Unified state store operational
- [ ] Integration tests passing
- [ ] Hook API documentation (JSDoc)

### Blockers

- Waiting for Phase 2 (services must exist)

---

## 🎨 Phase 4: UI Component Refactoring

**Status:** ⏸️ Not Started  
**Estimated Time:** 3-4 days  
**Assigned To:** TBD  
**Blocked By:** Phase 3

### Checklist

#### Primitives (Design System)

- [ ] Create `components/primitives/Button.tsx`
  - [ ] Variants (primary, secondary, danger, ghost)
  - [ ] Sizes (sm, md, lg)
  - [ ] Loading state
  - [ ] Icon support
  - [ ] Add Storybook story
- [ ] Create `components/primitives/Input.tsx`
  - [ ] Types (text, email, password, search)
  - [ ] Error state
  - [ ] Icon support
  - [ ] Add Storybook story
- [ ] Create `components/primitives/Checkbox.tsx`
  - [ ] Indeterminate state
  - [ ] Label support
  - [ ] Add Storybook story
- [ ] Create `components/primitives/Select.tsx`
  - [ ] Options rendering
  - [ ] Multi-select support
  - [ ] Add Storybook story
- [ ] Create `components/primitives/Icon.tsx`
  - [ ] Icon library integration
  - [ ] Size variants
  - [ ] Add Storybook story

#### Molecules (Simple Combinations)

- [ ] Create `components/molecules/ImageCard.tsx`
  - [ ] Image + checkbox + action menu
  - [ ] Loading skeleton
  - [ ] Error state
  - [ ] Add Storybook story
- [ ] Create `components/molecules/ProgressBar.tsx`
  - [ ] Progress visualization
  - [ ] Statistics display
  - [ ] Status variants
  - [ ] Add Storybook story
- [ ] Create `components/molecules/FilterBar.tsx`
  - [ ] Filter controls
  - [ ] Active filter display
  - [ ] Clear all button
  - [ ] Add Storybook story
- [ ] Create `components/molecules/ActionMenu.tsx`
  - [ ] Dropdown menu
  - [ ] Action items
  - [ ] Keyboard navigation
  - [ ] Add Storybook story
- [ ] Create `components/molecules/SearchInput.tsx`
  - [ ] Search input + icon
  - [ ] Clear button
  - [ ] Debounced input
  - [ ] Add Storybook story

#### Organisms (Complex Components)

- [ ] Create `components/organisms/ImageGallery/ImageGallery.tsx`
  - [ ] Orchestrates ImageGrid + ImageFilters
  - [ ] Virtual scroll integration
  - [ ] Loading states
  - [ ] Add Storybook story
- [ ] Create `components/organisms/ImageGallery/ImageGrid.tsx`
  - [ ] Virtual scroll implementation
  - [ ] Responsive grid layout
  - [ ] Selection handling
  - [ ] Add Storybook story
- [ ] Create `components/organisms/ImageGallery/ImageFilters.tsx`
  - [ ] Filter UI
  - [ ] Sort UI
  - [ ] Search UI
  - [ ] Add Storybook story
- [ ] Create `components/organisms/DownloadManager/DownloadPanel.tsx`
  - [ ] Refactor from `ui/DownloadStatus.tsx`
  - [ ] Use new primitives/molecules
  - [ ] Add Storybook story
- [ ] Create `components/organisms/DownloadManager/DownloadControls.tsx`
  - [ ] Start/stop/pause/resume buttons
  - [ ] Add Storybook story
- [ ] Create `components/organisms/ProcessManager/ProcessStatusPanel.tsx`
  - [ ] Unified status for all operations
  - [ ] Multi-operation display
  - [ ] Add Storybook story
- [ ] Create `components/organisms/ProcessManager/PanicButton.tsx`
  - [ ] Refactor from `ui/PanicButton.tsx`
  - [ ] Add Storybook story

#### Pages (Route-Level Components)

- [ ] Create `components/pages/BlogImagesPage.tsx`
  - [ ] Refactor from `features/blog-images/BlogImages.tsx`
  - [ ] Use new hooks and organisms
  - [ ] Orchestration only (minimal logic)
  - [ ] Add E2E tests
- [ ] Create `components/pages/StoredImagesPage.tsx`
  - [ ] Refactor from `features/stored/StoredImages.tsx`
  - [ ] Use new hooks and organisms
  - [ ] Orchestration only
  - [ ] Add E2E tests
- [ ] Create `components/pages/SettingsPage.tsx`
  - [ ] Refactor from `features/settings/Settings.tsx`
  - [ ] Use new preferences store
  - [ ] Add E2E tests

#### Routing Updates

- [ ] Update `App.tsx` to use new page components
- [ ] Update route definitions
- [ ] Test all routes

### Deliverables

- [ ] Complete Atomic Design component library
- [ ] All pages using new components
- [ ] Storybook stories for all components
- [ ] E2E tests passing

### Blockers

- Waiting for Phase 3 (hooks must exist)

---

## 🧹 Phase 5: Migration & Cleanup

**Status:** ⏸️ Not Started  
**Estimated Time:** 1-2 days  
**Assigned To:** TBD  
**Blocked By:** Phase 4

### Checklist

#### Legacy File Deprecation

- [ ] Add deprecation headers to:
  - [ ] `features/blog-images/BlogImages.tsx`
  - [ ] `features/stored/StoredImages.tsx`
  - [ ] `utils/batchedDownload.ts`
  - [ ] `store/operations.ts` (old version)
  - [ ] `store/downloads.ts`
  - [ ] `components/ui/DownloadStatus.tsx`
  - [ ] `components/ui/PanicButton.tsx`
  - [ ] Any other legacy files

#### Import Updates

- [ ] Search for imports of legacy components
- [ ] Update all imports to new paths
- [ ] Verify no broken imports

#### Remove Legacy Files

- [ ] Verify zero references to legacy files
- [ ] Move legacy files to `/archive/` directory (don't delete yet)
- [ ] Update .gitignore to exclude /archive/

#### Data Migration

- [ ] Run localStorage migration script on dev
- [ ] Test with real v0.93.0 data
- [ ] Verify all user data preserved
- [ ] Test rollback procedure

#### Final Testing

- [ ] Run full unit test suite (all passing)
- [ ] Run full integration test suite (all passing)
- [ ] Run full E2E test suite (all passing)
- [ ] Visual regression tests (all passing)
- [ ] Lighthouse audit (performance >= v0.93.0)
- [ ] Accessibility audit (WCAG 2.1 AA compliance)

#### Documentation

- [ ] Update README.md (new architecture, setup instructions)
- [ ] Update PANMD.md (comprehensive feature list)
- [ ] Create ARCHITECTURE.md (detailed design doc)
- [ ] Create API.md (service/hook API reference)
- [ ] Create TESTING.md (how to run/write tests)
- [ ] Update VERSION.md (v1.0.0 changelog)
- [ ] Create contributor guide

#### Performance Benchmarking

- [ ] Measure initial load time
- [ ] Measure time to interactive
- [ ] Measure memory usage (idle + 1000 images)
- [ ] Measure frame rate (scrolling)
- [ ] Compare with v0.93.0 metrics
- [ ] Document results

### Deliverables

- [ ] Zero legacy file references
- [ ] All tests passing
- [ ] Documentation complete
- [ ] Performance metrics documented
- [ ] Ready for deployment

### Blockers

- Waiting for Phase 4 (UI must be complete)

---

## 🚀 Phase 6: Deployment & Monitoring

**Status:** ⏸️ Not Started  
**Estimated Time:** 1 day  
**Assigned To:** TBD  
**Blocked By:** Phase 5

### Checklist

#### Staging Deployment

- [ ] Deploy to staging environment
- [ ] Run smoke tests (critical paths)
- [ ] Verify data migration works
- [ ] Test rollback procedure

#### Canary Deployment

- [ ] Deploy to 10% of users (feature flag)
- [ ] Monitor for 24 hours:
  - [ ] Error rates (<1%)
  - [ ] Performance metrics (>= v0.93.0)
  - [ ] User feedback (positive)
- [ ] Analyze results

#### Gradual Rollout

- [ ] Increase to 25% of users
- [ ] Monitor for 12 hours
- [ ] Increase to 50% of users
- [ ] Monitor for 12 hours
- [ ] Increase to 100% of users
- [ ] Monitor for 24 hours

#### Monitoring & Alerts

- [ ] Set up error tracking (Sentry or similar)
- [ ] Set up performance monitoring (Lighthouse CI)
- [ ] Set up uptime monitoring
- [ ] Configure Slack alerts

#### Post-Deployment

- [ ] Create git tag `v1.0.0`
- [ ] Create GitHub release (with changelog)
- [ ] Announce in team channels
- [ ] Update project board (close refactoring epic)
- [ ] Schedule retrospective meeting

#### Archive Legacy Code

- [ ] After 1 week with zero issues:
  - [ ] Delete `/archive/` directory
  - [ ] Remove deprecation headers
  - [ ] Clean up migration scripts

### Deliverables

- [ ] v1.0.0 in production
- [ ] Monitoring active
- [ ] Legacy code archived
- [ ] Team informed

### Blockers

- Waiting for Phase 5 (must be production-ready)

---

## 🔄 Data Migration Details

### localStorage Migration (v0.93.0 → v1.0.0)

#### Old Format (v0.93.0)

```json
{
  "activeDownload": {
    "id": "download-1730000000000",
    "type": "download",
    "status": "running",
    "folderName": "blog-name",
    "totalItems": 100,
    "completedItems": 50,
    "failedItems": 2,
    "startedAt": 1730000000000
  }
}
```

#### New Format (v1.0.0)

```json
{
  "v1_operations": {
    "active": [
      {
        "id": "op-1730000000000",
        "type": "download",
        "status": "running",
        "context": {
          "folderName": "blog-name",
          "strategy": "batch"
        },
        "progress": {
          "total": 100,
          "completed": 50,
          "failed": 2,
          "percentage": 50
        },
        "timestamps": {
          "startedAt": 1730000000000,
          "updatedAt": 1730000000500
        }
      }
    ],
    "history": []
  }
}
```

#### Migration Script

```typescript
// Runs automatically on first load of v1.0.0
function migrateLocalStorage() {
  const oldData = localStorage.getItem('activeDownload');
  if (oldData) {
    const parsed = JSON.parse(oldData);
    const newData = {
      active: [
        {
          id: `op-${parsed.id}`,
          type: parsed.type,
          status: parsed.status,
          context: {
            folderName: parsed.folderName,
            strategy: 'batch',
          },
          progress: {
            total: parsed.totalItems,
            completed: parsed.completedItems,
            failed: parsed.failedItems,
            percentage: Math.round(
              (parsed.completedItems / parsed.totalItems) * 100
            ),
          },
          timestamps: {
            startedAt: parsed.startedAt,
            updatedAt: Date.now(),
          },
        },
      ],
      history: [],
    };
    localStorage.setItem('v1_operations', JSON.stringify(newData));
    localStorage.removeItem('activeDownload'); // Clean up old key
  }
}
```

---

## ⚠️ Breaking Changes

### Import Paths Changed

```typescript
// OLD (v0.93.0)
import { DownloadStatus } from '@/components/ui/DownloadStatus';
import { PanicButton } from '@/components/ui/PanicButton';

// NEW (v1.0.0)
import { DownloadPanel } from '@/components/organisms/DownloadManager/DownloadPanel';
import { PanicButton } from '@/components/organisms/ProcessManager/PanicButton';
```

### State Atoms Changed

```typescript
// OLD (v0.93.0)
import { activeDownloadAtom } from '@/store/downloads';
import { currentOperationAtom } from '@/store/operations';

// NEW (v1.0.0)
import { operationsAtom } from '@/store/operations'; // Unified
```

### Service APIs Changed

```typescript
// OLD (v0.93.0)
import { batchedDownload } from '@/utils/batchedDownload';

// NEW (v1.0.0)
import { useDownload } from '@/hooks/useDownload';
const { downloadBatch } = useDownload();
```

---

## 🎯 Success Criteria

### Must Meet Before v1.0.0 Release

- [ ] All user workflows work identically (zero functional regressions)
- [ ] All tests passing (unit + integration + E2E)
- [ ] 80%+ code coverage
- [ ] Performance >= v0.93.0 (or better)
- [ ] Zero data loss during migration
- [ ] Documentation complete

### Nice to Have

- [ ] Storybook deployed (for component documentation)
- [ ] Visual regression tests passing
- [ ] Accessibility audit complete
- [ ] Performance improved by 20%+

---

## 📞 Communication Plan

### Daily Updates

- Post summary in #dev-updates Slack channel
- Include: progress, blockers, next steps

### Weekly Demos

- Every Friday: Show progress to product team
- Live demo of new components/features

### Go/No-Go Decisions

- Before each deployment phase
- Criteria: All phase tasks complete, tests passing, no critical bugs

---

## 🆘 Rollback Plan

### If Migration Fails

1. **Immediate**: Deploy v0.93.0-pre-refactor tag
2. **Data**: Run rollback migration script
3. **Monitoring**: Check for data loss
4. **Communication**: Inform users of rollback
5. **Analysis**: Debug issues before retry

### Rollback Triggers

- **Error rate >5%** (compared to v0.93.0 baseline)
- **Performance degradation >20%**
- **Data loss detected**
- **Critical functionality broken**

---

_Migration Version: 1.0_  
_Created: 2025-11-03_  
_For Refactoring: v0.93.0 → v1.0.0_
