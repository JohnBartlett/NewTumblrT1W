/**
 * ⚠️ LEGACY FILE - SCHEDULED FOR REFACTORING IN v1.0.0
 *
 * This file will be DEPRECATED and replaced with new architecture:
 * → src/components/organisms/ProcessManager/PanicButton.tsx
 *
 * Panic Button Component
 * Emergency button to stop all operations and server processes.
 * Provides a clear, accessible way for users to halt everything.
 *
 * Current Issues:
 * - Should be an "organism" component in Atomic Design
 * - Uses legacy download store (will be unified)
 * - Should use process manager hook
 *
 * Migration Target: v1.0.0 Phase 4 (UI Refactoring)
 * See: docs/refactoring-plan.md
 *
 * DO NOT ADD NEW FEATURES HERE - Add to new architecture instead
 * Bug fixes only until migration is complete
 *
 * Created: 2025-11-02
 * Deprecated: 2025-11-03 (v0.93.0-pre-refactor checkpoint)
 * Removal Target: After v1.0.0 deployment (7-14 days of monitoring)
 */

import { useState } from 'react';
import { useAtom, useSetAtom } from 'jotai';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { cancelDownloadAtom, activeDownloadAtom } from '@/store/downloads';
import { log } from '@/utils/logger';

// Dynamic API URL based on current host
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3001`;
  }
  return 'http://localhost:3001';
};
const API_URL = getApiUrl();

export function PanicButton() {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const cancelDownload = useSetAtom(cancelDownloadAtom);
  const [activeDownload] = useAtom(activeDownloadAtom);

  const handlePanic = async () => {
    if (!isConfirming) {
      setIsConfirming(true);
      // Reset confirmation after 3 seconds
      setTimeout(() => setIsConfirming(false), 3000);
      return;
    }

    log.userAction('clicked', 'Panic Button - Emergency Stop', {
      activeDownload: activeDownload?.id,
    });

    log.warn('PanicButton', 'Emergency stop initiated', {
      activeDownload: activeDownload?.id,
      timestamp: new Date().toISOString(),
    });

    setIsStopping(true);

    try {
      // 1. Cancel any active downloads
      if (activeDownload) {
        log.info('PanicButton', 'Cancelling active download');
        cancelDownload();
      }

      // 2. Call emergency stop endpoint (if implemented)
      try {
        const response = await fetch(`${API_URL}/api/emergency-stop`, {
          method: 'POST',
        });

        if (response.ok) {
          log.info('PanicButton', 'Server emergency stop successful');
        } else {
          log.warn(
            'PanicButton',
            'Server emergency stop endpoint not available',
            {
              status: response.status,
            }
          );
        }
      } catch (error) {
        log.warn('PanicButton', 'Could not reach emergency stop endpoint', {
          error: (error as Error).message,
        });
      }

      // 3. Show success message
      alert(
        '🛑 Emergency Stop Executed\n\n' +
          '• Active downloads cancelled\n' +
          '• Server notified\n\n' +
          'Page will reload to ensure clean state.'
      );

      // 4. Reload page to clear all state
      window.location.reload();
    } catch (error) {
      log.error('PanicButton', 'Emergency stop failed', {
        error: (error as Error).message,
      });
      alert(`❌ Emergency stop failed: ${(error as Error).message}`);
    } finally {
      setIsStopping(false);
      setIsConfirming(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <AnimatePresence>
        {isConfirming && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mb-2 rounded-lg bg-red-50 p-3 shadow-lg dark:bg-red-900/20"
          >
            <p className="text-sm font-medium text-red-900 dark:text-red-200">
              ⚠️ Click again to confirm emergency stop
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        onClick={handlePanic}
        disabled={isStopping}
        className={`relative flex items-center gap-2 px-4 py-2 font-bold shadow-2xl transition-all ${
          isConfirming
            ? 'bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800 scale-110 animate-pulse'
            : 'bg-red-500 text-white hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700'
        }`}
      >
        {isStopping ? (
          <>
            <svg
              className="h-5 w-5 animate-spin"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            Stopping...
          </>
        ) : (
          <>
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            {isConfirming ? 'CONFIRM STOP' : 'PANIC STOP'}
          </>
        )}
      </Button>
    </div>
  );
}
