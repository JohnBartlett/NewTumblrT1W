/**
 * ⚠️ LEGACY FILE - SCHEDULED FOR REFACTORING IN v1.0.0
 *
 * This file will be MERGED with store/downloads.ts into unified:
 * → src/store/operations.ts (NEW VERSION - single source of truth)
 *
 * Global Operation Status Store
 * Tracks ongoing download and store operations across the app
 * Used to display status in the navigation bar
 *
 * Current Issues:
 * - Separate from downloads.ts (should be unified)
 * - No persistence (downloads.ts has it, this doesn't)
 * - Inconsistent with downloads.ts patterns
 *
 * Migration Target: v1.0.0 Phase 1 (Foundation)
 * See: docs/refactoring-plan.md
 *
 * DO NOT ADD NEW FEATURES HERE - Add to new unified store instead
 * Bug fixes only until migration is complete
 *
 * Created: 2025-10-28
 * Deprecated: 2025-11-03 (v0.93.0-pre-refactor checkpoint)
 * Removal Target: After v1.0.0 deployment (7-14 days of monitoring)
 */

import { atom } from 'jotai';

export interface OperationProgress {
  type: 'download' | 'store' | 'download-folder';
  current: number;
  total: number;
  source?: string; // e.g., blog name or "Stored"
}

/**
 * Current ongoing operation (null if no operation)
 */
export const currentOperationAtom = atom<OperationProgress | null>(null);

/**
 * Helper to start an operation
 */
export const startOperationAtom = atom(
  null,
  (get, set, operation: OperationProgress) => {
    set(currentOperationAtom, operation);
  }
);

/**
 * Helper to update operation progress
 */
export const updateOperationProgressAtom = atom(
  null,
  (get, set, progress: { current: number; total: number }) => {
    const current = get(currentOperationAtom);
    if (current) {
      set(currentOperationAtom, {
        ...current,
        current: progress.current,
        total: progress.total,
      });
    }
  }
);

/**
 * Helper to end operation
 */
export const endOperationAtom = atom(null, (get, set) => {
  set(currentOperationAtom, null);
});
