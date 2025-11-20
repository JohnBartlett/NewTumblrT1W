# Download System Fix Plan

**Status**: ✅ IMPLEMENTED in v0.93.0  
**Version**: v0.93.0  
**Created**: November 2, 2025  
**Completed**: November 2, 2025

---

## Problem Diagnosis

### What Happened
When attempting to download 2,291 images from blog @gerundio18 using "Download All to Folder" in the Stored Images view:

1. User clicked "Store" on Blog page → Images saved to database ✅
2. User navigated to Stored Images page → Filtered by @gerundio18 ✅  
3. User clicked "Download All to Folder" → Selected download location ✅
4. System attempted to fetch **all 2,291 images simultaneously** ❌
5. Created ~2,360 parallel HTTP requests at once ❌
6. Browser/network hit connection limits → ERR_CONNECTION_CLOSED ❌
7. Some images succeeded (296 MB), most failed ❌
8. No way to cancel operation → Had to kill entire server ❌

### Root Causes

1. **No Request Batching**: Code fetches all images in single loop without rate limiting
2. **No Cancellation**: No mechanism to stop operation mid-process
3. **No State Persistence**: Operation state lost if user navigates away
4. **Poor Status Visibility**: Only shows basic counter, no batch/error info
5. **Insufficient Logging**: Minimal diagnostic information for debugging
6. **No Confirmation**: Doesn't warn about large batch size
7. **Poor Error Handling**: Continues even when most requests fail

### Technical Details

**Problem Code Location**: `src/features/stored/StoredImages.tsx`, function `handleDownloadAllToFolder()` (lines 777-911)

```typescript
// Current implementation - BAD
for (let i = 0; i < filteredAndSortedImages.length; i++) {
  const response = await fetch(img.url); // ALL AT ONCE!
  // ... process image
}
```

**Issues**:
- All fetch calls queued immediately
- No delay between requests
- No batching or rate limiting
- Browser opens thousands of connections
- Network stack overwhelmed
- Tumblr CDN may rate limit

---

## Solution: Batched Download System

### Overview

Implement a robust download system with:
- **Batching**: Process 20 images at a time
- **Rate Limiting**: 500ms delay between batches
- **Cancellation**: Stop button that works mid-operation
- **Progress Tracking**: Show batch progress, success/fail counts
- **State Persistence**: Can navigate away and return
- **Comprehensive Logging**: Track every step for debugging
- **Error Handling**: Retry failed images, don't stop on errors

---

## Implementation Plan

### 1. Create Logging Infrastructure

**New File**: `src/utils/logger.ts`

Centralized logging utility with:
- Console output with timestamps and context
- IndexedDB persistence (last 1000 entries)
- User action tracking (clicks, navigation)
- Export function for debugging

**Key Functions**:
```typescript
log.info('Download started', { blogName, imageCount });
log.userAction('clicked', 'Download All to Folder', { blogName });
log.error('Download failed', { error, batch });
log.debug('Batch processing', { batchIndex, totalBatches });
```

**Features**:
- Log levels: debug, info, warn, error
- Structured data (not just strings)
- Automatic timestamp and context
- Stored in IndexedDB for persistence
- Export as JSON for debugging

---

### 2. Implement Batch Processing

**File**: `src/features/stored/StoredImages.tsx`  
**Function**: `handleDownloadAllToFolder()` (lines 777-911)

**New Implementation**:

```typescript
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 500;

// Split images into batches
const batches = [];
for (let i = 0; i < filteredAndSortedImages.length; i += BATCH_SIZE) {
  batches.push(filteredAndSortedImages.slice(i, i + BATCH_SIZE));
}

log.info('Starting batched download', {
  totalImages: filteredAndSortedImages.length,
  batchSize: BATCH_SIZE,
  totalBatches: batches.length
});

// Process each batch
for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
  // Check if user cancelled
  if (cancelOperationRef.current) {
    log.info('Download cancelled by user', { 
      processedBatches: batchIndex,
      totalBatches: batches.length 
    });
    break;
  }
  
  const batch = batches[batchIndex];
  log.debug('Processing batch', { 
    batch: batchIndex + 1, 
    total: batches.length,
    images: batch.length 
  });
  
  // Fetch all images in current batch (parallel within batch)
  const batchResults = await Promise.allSettled(
    batch.map(async (img) => {
      try {
        const response = await fetch(img.url);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.blob();
      } catch (error) {
        log.error('Image fetch failed', { url: img.url, error });
        throw error;
      }
    })
  );
  
  // Process results and save files
  for (let i = 0; i < batchResults.length; i++) {
    const result = batchResults[i];
    const img = batch[i];
    
    if (result.status === 'fulfilled') {
      // Save file
      // ... file saving logic
      successCount++;
    } else {
      failedImages.push({ img, error: result.reason });
      failedCount++;
    }
  }
  
  // Update progress
  setDownloadProgress({
    current: (batchIndex + 1) * BATCH_SIZE,
    total: filteredAndSortedImages.length,
    batch: batchIndex + 1,
    totalBatches: batches.length,
    succeeded: successCount,
    failed: failedCount
  });
  
  // Rate limiting delay (except for last batch)
  if (batchIndex < batches.length - 1) {
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
  }
}
```

**Benefits**:
- Only 20 concurrent requests at a time
- 500ms breathing room between batches
- Can cancel between batches
- Track batch-level progress
- Collect failed images for retry

---

### 3. Add Download State Management

**New File**: `src/store/downloads.ts`

```typescript
import { atom } from 'jotai';
import { atomWithStorage } from 'jotai/utils';

export interface DownloadOperation {
  id: string;
  type: 'download' | 'share' | 'store';
  blogName?: string;
  totalImages: number;
  processedImages: number;
  succeededImages: number;
  failedImages: number;
  currentBatch: number;
  totalBatches: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'error';
  startedAt: number;
  errors: Array<{ url: string; error: string }>;
}

// Persist to localStorage so state survives navigation
export const activeDownloadAtom = atomWithStorage<DownloadOperation | null>(
  'active-download',
  null
);

export const cancelDownloadAtom = atom(
  (get) => get(activeDownloadAtom)?.status === 'cancelled',
  (get, set) => {
    const current = get(activeDownloadAtom);
    if (current) {
      set(activeDownloadAtom, { ...current, status: 'cancelled' });
    }
  }
);
```

---

### 4. Create Status Display Component

**New File**: `src/components/ui/DownloadStatus.tsx`

Floating panel showing:
- Operation name (e.g., "Downloading @gerundio18")
- Current batch: "Batch 23 of 115"
- Image progress: "451/2,291 images (19.7%)"
- Success/fail counts: "448 succeeded, 3 failed"
- Estimated time remaining
- **"Stop Download" button** (prominent, red)
- Collapsible error list
- Minimize button (but persists across pages)

**Features**:
- Fixed position (bottom-right corner)
- Persists across page navigation
- Shows even if user navigates away
- Can expand/collapse
- Shows in all relevant pages

---

### 5. Add Stop Download Button

**Updates**:
- Add `cancelOperationRef` to StoredImages component
- Check ref before each batch
- When cancelled: save partial results, show summary
- Button in:
  - SelectionToolbar (when download active)
  - DownloadStatus panel
  - Confirmation dialog

**Behavior**:
- Stops after current batch completes
- Saves all successfully downloaded files
- Shows summary: "Downloaded 451/2,291 images (3 failed) before cancellation"
- Clears operation state

---

### 6. Add Panic Button (Emergency Stop Server)

**New File**: `src/components/ui/PanicButton.tsx`

Emergency button for development:
- Red button with ⚠️ icon
- Hidden by default (Settings → Developer Tools)
- Requires double-click OR 2-second hold
- Calls `/api/emergency/stop`
- Shows confirmation: "Server will stop. Continue?"

**Backend**:  
**File**: `server/index.ts`

```typescript
app.post('/api/emergency/stop', (req, res) => {
  console.log('⚠️ PANIC BUTTON PRESSED - Server stopping');
  log.warn('PANIC BUTTON - Stopping server', { 
    timestamp: new Date().toISOString() 
  });
  
  res.json({ message: 'Server stopping in 500ms' });
  
  // Give time for response to send
  setTimeout(() => {
    process.exit(0);
  }, 500);
});
```

**Placement**:
- Settings page under "Developer Tools" section
- Small, unobtrusive
- Requires explicit intent to activate

---

### 7. Add Confirmation Dialog

**Before `handleDownloadAllToFolder()` starts**:

```typescript
const estimatedMinutes = Math.ceil(count * 0.5 / 60); // ~0.5s per image

const confirmed = window.confirm(
  `Download ${count} images from @${blogName}?\n\n` +
  `• Destination: Folder named "${blogName}"\n` +
  `• Estimated time: ~${estimatedMinutes} minutes\n` +
  `• You'll be prompted to select download location\n` +
  `• You can cancel anytime during download\n\n` +
  `Continue?`
);

if (!confirmed) {
  log.userAction('cancelled', 'Download confirmation', { blogName, count });
  return;
}

log.userAction('confirmed', 'Download start', { blogName, count });
```

**Features**:
- Shows image count
- Shows estimated time
- Explains destination
- Mentions cancellation option
- Logs user choice

---

### 8. Improve Error Handling

**Enhancements**:

1. **Retry Logic**: Retry failed images once with exponential backoff
2. **Detailed Errors**: Collect error reason for each failed image
3. **Error Summary**: Show at end: "3 images failed: [list]"
4. **Don't Stop**: Single failure doesn't stop entire operation
5. **User Choice**: At end, offer to retry failed images

**Implementation**:

```typescript
// Retry failed images
if (failedImages.length > 0 && failedImages.length < 10) {
  const retry = window.confirm(
    `${failedImages.length} images failed.\n\nRetry failed images?`
  );
  
  if (retry) {
    log.info('Retrying failed images', { count: failedImages.length });
    // Retry logic here
  }
}
```

---

### 9. Add Comprehensive Logging

**Log Points**:

1. User clicks "Download All to Folder"
2. Confirmation dialog result
3. Directory picker opened/result
4. Download started with details
5. Each batch start/complete
6. Each image success/failure
7. Operation cancelled
8. Operation completed
9. All errors with full context

**Example Logs**:

```typescript
log.userAction('clicked', 'Download All to Folder', { 
  blogName, 
  imageCount,
  timestamp: Date.now()
});

log.info('Directory selected', { 
  dirName: parentDirHandle.name,
  folderName: blogName 
});

log.info('Batch completed', { 
  batch: batchIndex + 1,
  total: batches.length,
  succeeded: batchSuccessCount,
  failed: batchFailedCount,
  duration: batchEndTime - batchStartTime
});

log.info('Download completed', {
  totalImages: filteredAndSortedImages.length,
  succeeded: successCount,
  failed: failedCount,
  cancelled: cancelOperationRef.current,
  duration: Date.now() - startTime
});
```

---

### 10. Update Button Labels

**Current**: "Download All to Folder (2291)"  
**Better**: "Download @gerundio18 to Folder (2,291 images)"

**Changes**:
- Show blog name explicitly
- Format numbers with commas
- Say "images" for clarity
- Makes destination obvious

---

## Files to Create/Modify

### New Files
1. `src/utils/logger.ts` - Centralized logging
2. `src/store/downloads.ts` - Download state management
3. `src/components/ui/DownloadStatus.tsx` - Status panel
4. `src/components/ui/PanicButton.tsx` - Emergency stop

### Modified Files
1. `src/features/stored/StoredImages.tsx` - Batching, cancel, logging
2. `server/index.ts` - Panic endpoint
3. `src/features/settings/Settings.tsx` - Add panic button to dev section
4. `src/features/blog/Blog.tsx` - Apply same fixes to blog downloads

---

## Testing Strategy

### Phase 1: Small Batch (10 images)
- Verify batching works correctly
- Check batch delays are honored
- Verify all files saved
- Check logs are comprehensive

### Phase 2: Medium Batch (100 images)
- Test cancel button mid-operation
- Verify partial results saved
- Check state persists across navigation
- Verify error handling

### Phase 3: Large Batch (2,291 images)
- Full stress test
- Verify no connection errors
- Check memory usage stays reasonable
- Verify operation can run in background

### Phase 4: Error Conditions
- Test with invalid URLs
- Test with network disconnection
- Test browser closing/reopening
- Test server restart during download

---

## Success Criteria

✅ Downloads complete without connection errors (Batched at 20/batch with 1000ms delay)  
✅ Can cancel mid-operation and keep partial results (Cancel button + cancelRequested atom)  
✅ Clear status visibility at all times (DownloadStatus floating panel)  
✅ Can navigate away and return to see progress (localStorage persistence)  
✅ Comprehensive logs capture entire workflow (logger.ts with IndexedDB)  
✅ Blog name used correctly for folder (Derived from filterBlog state)  
✅ User prompted for download location (Directory picker)  
✅ Error summary shows failed images with reasons (Error list in DownloadStatus)  
✅ Retry option for failed images (3 automatic retries per image)  
✅ No memory leaks or performance issues (Batched processing prevents memory spikes)

---

## Rollout Plan

1. ✅ **v0.92.2**: Document issue, create plan
2. ✅ **v0.93.0**: Implement fixes (COMPLETED November 2, 2025)
   - ✅ Logging infrastructure (logger.ts with IndexedDB)
   - ✅ Batching system (batchedDownload.ts with retry logic)
   - ✅ State management (downloads.ts atoms with localStorage)
   - ✅ UI components (DownloadStatus.tsx, PanicButton.tsx)
   - ✅ Integration (StoredImages.tsx refactored)
   - ✅ Server endpoint (emergency-stop API)
   - ✅ Documentation (VERSION.md, PANMD.md updated)

---

## Notes for Implementation

### Performance Considerations
- Batch size of 20 is a balance between speed and reliability
- 500ms delay prevents rate limiting while staying reasonably fast
- Promise.allSettled allows partial batch success
- IndexedDB logs shouldn't impact performance

### User Experience
- Progress is always visible
- User can navigate away safely
- Clear feedback on what's happening
- Easy to cancel if needed
- Failed images don't ruin entire operation

### Debugging
- Comprehensive logs make issues easy to diagnose
- Can export logs for bug reports
- User actions tracked for workflow analysis
- Error context includes URLs and reasons

---

**End of Plan**

