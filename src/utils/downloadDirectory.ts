/**
 * Download Directory Manager
 * 
 * Manages user-selected download directory using File System Access API
 * Provides fallback for unsupported browsers
 */

import { get, set, del } from 'idb-keyval';

const DIRECTORY_HANDLE_KEY = 'download-directory-handle';

/**
 * Check if File System Access API is supported
 */
export function isFileSystemAccessSupported(): boolean {
  return 'showDirectoryPicker' in window;
}

/**
 * Request user to select a download directory
 * Returns the directory handle or null if cancelled/unsupported
 */
export async function requestDownloadDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    console.warn('[Download Dir] File System Access API not supported in this browser');
    return null;
  }

  try {
    const dirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads',
    });

    // Save the handle to IndexedDB
    await set(DIRECTORY_HANDLE_KEY, dirHandle);
    console.log('[Download Dir] ✅ Directory selected and saved:', dirHandle.name);
    
    return dirHandle;
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[Download Dir] User cancelled directory selection');
    } else {
      console.error('[Download Dir] ❌ Error selecting directory:', error);
    }
    return null;
  }
}

/**
 * Get the saved download directory handle
 * Returns null if not set or if permission denied
 */
export async function getDownloadDirectory(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemAccessSupported()) {
    return null;
  }

  try {
    const dirHandle = await get<FileSystemDirectoryHandle>(DIRECTORY_HANDLE_KEY);
    
    if (!dirHandle) {
      console.log('[Download Dir] No directory saved');
      return null;
    }

    // Check if we still have permission
    const permission = await dirHandle.queryPermission({ mode: 'readwrite' });
    
    if (permission === 'granted') {
      console.log('[Download Dir] ✅ Using saved directory:', dirHandle.name);
      return dirHandle;
    }

    // Try to request permission again
    console.log('[Download Dir] Permission not granted, requesting...');
    const newPermission = await dirHandle.requestPermission({ mode: 'readwrite' });
    
    if (newPermission === 'granted') {
      console.log('[Download Dir] ✅ Permission granted for:', dirHandle.name);
      return dirHandle;
    }

    console.warn('[Download Dir] ⚠️ Permission denied for saved directory');
    return null;
  } catch (error) {
    console.error('[Download Dir] ❌ Error getting directory:', error);
    return null;
  }
}

/**
 * Get the name of the current download directory
 */
export async function getDownloadDirectoryName(): Promise<string | null> {
  const dirHandle = await getDownloadDirectory();
  return dirHandle ? dirHandle.name : null;
}

/**
 * Clear the saved download directory
 */
export async function clearDownloadDirectory(): Promise<void> {
  try {
    await del(DIRECTORY_HANDLE_KEY);
    console.log('[Download Dir] ✅ Cleared saved directory');
  } catch (error) {
    console.error('[Download Dir] ❌ Error clearing directory:', error);
  }
}

/**
 * Check if a download directory is currently set and accessible
 */
export async function hasDownloadDirectory(): Promise<boolean> {
  const dirHandle = await getDownloadDirectory();
  return dirHandle !== null;
}

/**
 * Download a file to the selected directory (or fallback to default)
 * 
 * @param blob - The file content as a Blob
 * @param filename - The desired filename
 * @returns Success status and method used
 */
export async function downloadToDirectory(
  blob: Blob,
  filename: string
): Promise<{ success: boolean; method: 'filesystem' | 'fallback'; error?: string }> {
  // Try File System Access API first
  const dirHandle = await getDownloadDirectory();
  
  if (dirHandle) {
    try {
      // Create the file in the directory
      const fileHandle = await dirHandle.getFileHandle(filename, { create: true });
      const writable = await fileHandle.createWritable();
      
      // Write the blob content
      await writable.write(blob);
      await writable.close();
      
      console.log(`[Download Dir] ✅ Saved to directory: ${filename}`);
      return { success: true, method: 'filesystem' };
    } catch (error: any) {
      console.error('[Download Dir] ❌ Error writing to directory:', error);
      // Fall through to fallback
    }
  }

  // Fallback to traditional download
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log(`[Download Dir] ✅ Downloaded using fallback: ${filename}`);
    return { success: true, method: 'fallback' };
  } catch (error: any) {
    console.error('[Download Dir] ❌ Download failed:', error);
    return { success: false, method: 'fallback', error: error.message };
  }
}

/**
 * Download a file to a subdirectory within a parent directory
 * 
 * @param parentDirHandle - Parent directory handle
 * @param subdirName - Name of subdirectory to create
 * @param blob - The file content as a Blob
 * @param filename - The desired filename
 * @returns Success status
 */
export async function downloadToSubdirectory(
  parentDirHandle: FileSystemDirectoryHandle,
  subdirName: string,
  blob: Blob,
  filename: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Create or get the subdirectory
    const subdirHandle = await parentDirHandle.getDirectoryHandle(subdirName, { create: true });
    
    // Create the file in the subdirectory
    const fileHandle = await subdirHandle.getFileHandle(filename, { create: true });
    const writable = await fileHandle.createWritable();
    
    // Write the blob content
    await writable.write(blob);
    await writable.close();
    
    console.log(`[Download Dir] ✅ Saved to ${subdirName}/${filename}`);
    return { success: true };
  } catch (error: any) {
    console.error('[Download Dir] ❌ Error writing to subdirectory:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Request directory selection and download all files to a subdirectory
 * This prompts the user to select a parent directory, then creates a subdirectory for the downloads
 * 
 * @param subdirName - Name of subdirectory to create
 * @param files - Array of { blob: Blob, filename: string } to download
 * @param onProgress - Optional callback for progress updates (current, total)
 * @returns Result with success count and any errors
 */
export async function downloadAllToSubdirectory(
  subdirName: string,
  files: Array<{ blob: Blob; filename: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<{ 
  success: boolean; 
  successCount: number; 
  failedCount: number;
  method: 'filesystem' | 'fallback';
  error?: string;
}> {
  if (!isFileSystemAccessSupported()) {
    console.warn('[Download Dir] File System Access API not supported, using fallback');
    return downloadAllToSubdirectoryFallback(subdirName, files, onProgress);
  }

  try {
    // Request user to select parent directory
    const parentDirHandle = await window.showDirectoryPicker({
      mode: 'readwrite',
      startIn: 'downloads',
    });

    console.log(`[Download Dir] Creating subdirectory: ${subdirName}`);
    
    // Create or get the subdirectory
    const subdirHandle = await parentDirHandle.getDirectoryHandle(subdirName, { create: true });
    
    let successCount = 0;
    let failedCount = 0;

    // Download each file
    for (let i = 0; i < files.length; i++) {
      const { blob, filename } = files[i];
      
      try {
        const fileHandle = await subdirHandle.getFileHandle(filename, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(blob);
        await writable.close();
        
        successCount++;
        console.log(`[Download Dir] ✅ (${i + 1}/${files.length}) Saved: ${filename}`);
      } catch (error) {
        failedCount++;
        console.error(`[Download Dir] ❌ Failed to save ${filename}:`, error);
      }

      if (onProgress) {
        onProgress(i + 1, files.length);
      }

      // Small delay to avoid overwhelming the system
      if (i < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    console.log(`[Download Dir] ✅ Batch download complete: ${successCount} succeeded, ${failedCount} failed`);
    
    return {
      success: failedCount === 0,
      successCount,
      failedCount,
      method: 'filesystem',
    };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.log('[Download Dir] User cancelled directory selection');
      return {
        success: false,
        successCount: 0,
        failedCount: files.length,
        method: 'filesystem',
        error: 'User cancelled directory selection',
      };
    }
    
    console.error('[Download Dir] ❌ Error in batch download:', error);
    
    // Fallback to traditional downloads
    return downloadAllToSubdirectoryFallback(subdirName, files, onProgress);
  }
}

/**
 * Fallback: Download all files using traditional browser download (will prompt for each file)
 */
async function downloadAllToSubdirectoryFallback(
  subdirName: string,
  files: Array<{ blob: Blob; filename: string }>,
  onProgress?: (current: number, total: number) => void
): Promise<{ 
  success: boolean; 
  successCount: number; 
  failedCount: number;
  method: 'filesystem' | 'fallback';
  error?: string;
}> {
  console.log(`[Download Dir] Using fallback method for ${files.length} files`);
  
  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < files.length; i++) {
    const { blob, filename } = files[i];
    
    try {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      // Prefix filename with subdirectory name as browsers don't support subdirectories in fallback
      a.download = `${subdirName}_${filename}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      successCount++;
      console.log(`[Download Dir] ✅ (${i + 1}/${files.length}) Downloaded: ${filename}`);
    } catch (error) {
      failedCount++;
      console.error(`[Download Dir] ❌ Failed to download ${filename}:`, error);
    }

    if (onProgress) {
      onProgress(i + 1, files.length);
    }

    // Delay between downloads to avoid browser blocking
    if (i < files.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  console.log(`[Download Dir] ✅ Fallback download complete: ${successCount} succeeded, ${failedCount} failed`);
  
  return {
    success: failedCount === 0,
    successCount,
    failedCount,
    method: 'fallback',
    error: failedCount > 0 ? `${failedCount} files failed to download` : undefined,
  };
}

