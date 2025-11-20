/**
 * Centralized Logging Utility
 * 
 * Provides structured logging with console output and IndexedDB persistence
 * for debugging and diagnostics during development.
 */

import { get, set, del } from 'idb-keyval';

const LOG_STORE_KEY = 'app-logs';
const MAX_STORED_LOGS = 1000;

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: number;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  userAction?: {
    action: string;
    target: string;
    context?: unknown;
  };
}

/**
 * Store logs in IndexedDB
 */
async function persistLog(entry: LogEntry): Promise<void> {
  try {
    const logs = await get<LogEntry[]>(LOG_STORE_KEY) || [];
    logs.push(entry);
    
    // Keep only last MAX_STORED_LOGS entries
    if (logs.length > MAX_STORED_LOGS) {
      logs.splice(0, logs.length - MAX_STORED_LOGS);
    }
    
    await set(LOG_STORE_KEY, logs);
  } catch (error) {
    console.error('[Logger] Failed to persist log:', error);
  }
}

/**
 * Format log message for console output
 */
function formatConsoleLog(entry: LogEntry): string {
  const timestamp = new Date(entry.timestamp).toISOString();
  const level = entry.level.toUpperCase().padEnd(5);
  const category = entry.category.padEnd(15);
  
  let message = `[${timestamp}] ${level} [${category}] ${entry.message}`;
  
  if (entry.data) {
    message += `\n  Data: ${JSON.stringify(entry.data, null, 2)}`;
  }
  
  if (entry.userAction) {
    message += `\n  User Action: ${entry.userAction.action} → ${entry.userAction.target}`;
    if (entry.userAction.context) {
      message += `\n  Context: ${JSON.stringify(entry.userAction.context, null, 2)}`;
    }
  }
  
  return message;
}

/**
 * Core logging function
 */
function createLog(level: LogLevel, category: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level,
    category,
    message,
    data,
  };
  
  // Console output with appropriate styling
  const formattedMessage = formatConsoleLog(entry);
  
  switch (level) {
    case 'debug':
      console.debug(formattedMessage);
      break;
    case 'info':
      console.info(formattedMessage);
      break;
    case 'warn':
      console.warn(formattedMessage);
      break;
    case 'error':
      console.error(formattedMessage);
      break;
  }
  
  // Persist to IndexedDB (async, non-blocking)
  persistLog(entry).catch(err => 
    console.error('[Logger] Failed to persist:', err)
  );
}

/**
 * Log user actions for workflow tracking
 */
function logUserAction(action: string, target: string, context?: unknown): void {
  const entry: LogEntry = {
    timestamp: Date.now(),
    level: 'info',
    category: 'USER_ACTION',
    message: `User ${action} ${target}`,
    userAction: {
      action,
      target,
      context,
    },
  };
  
  console.info(formatConsoleLog(entry));
  persistLog(entry).catch(err => 
    console.error('[Logger] Failed to persist user action:', err)
  );
}

/**
 * Public logging API
 */
export const log = {
  /**
   * Debug-level logging (detailed diagnostic information)
   */
  debug: (category: string, message: string, data?: unknown) => {
    createLog('debug', category, message, data);
  },
  
  /**
   * Info-level logging (general information)
   */
  info: (category: string, message: string, data?: unknown) => {
    createLog('info', category, message, data);
  },
  
  /**
   * Warning-level logging (potential issues)
   */
  warn: (category: string, message: string, data?: unknown) => {
    createLog('warn', category, message, data);
  },
  
  /**
   * Error-level logging (errors and exceptions)
   */
  error: (category: string, message: string, data?: unknown) => {
    createLog('error', category, message, data);
  },
  
  /**
   * Log user actions (clicks, navigation, operations)
   */
  userAction: (action: string, target: string, context?: unknown) => {
    logUserAction(action, target, context);
  },
};

/**
 * Get all stored logs
 */
export async function getLogs(): Promise<LogEntry[]> {
  try {
    return await get<LogEntry[]>(LOG_STORE_KEY) || [];
  } catch (error) {
    console.error('[Logger] Failed to retrieve logs:', error);
    return [];
  }
}

/**
 * Get logs filtered by level
 */
export async function getLogsByLevel(level: LogLevel): Promise<LogEntry[]> {
  const logs = await getLogs();
  return logs.filter(log => log.level === level);
}

/**
 * Get logs filtered by category
 */
export async function getLogsByCategory(category: string): Promise<LogEntry[]> {
  const logs = await getLogs();
  return logs.filter(log => log.category === category);
}

/**
 * Get logs within a time range
 */
export async function getLogsByTimeRange(startTime: number, endTime: number): Promise<LogEntry[]> {
  const logs = await getLogs();
  return logs.filter(log => log.timestamp >= startTime && log.timestamp <= endTime);
}

/**
 * Get user action logs
 */
export async function getUserActionLogs(): Promise<LogEntry[]> {
  const logs = await getLogs();
  return logs.filter(log => log.userAction !== undefined);
}

/**
 * Export logs as JSON (for debugging/bug reports)
 */
export async function exportLogs(): Promise<string> {
  const logs = await getLogs();
  return JSON.stringify(logs, null, 2);
}

/**
 * Export logs as formatted text
 */
export async function exportLogsAsText(): Promise<string> {
  const logs = await getLogs();
  return logs.map(entry => formatConsoleLog(entry)).join('\n\n');
}

/**
 * Clear all stored logs
 */
export async function clearLogs(): Promise<void> {
  try {
    await del(LOG_STORE_KEY);
    console.info('[Logger] All logs cleared');
  } catch (error) {
    console.error('[Logger] Failed to clear logs:', error);
  }
}

/**
 * Get log statistics
 */
export async function getLogStats(): Promise<{
  total: number;
  byLevel: Record<LogLevel, number>;
  byCategory: Record<string, number>;
  oldest?: number;
  newest?: number;
}> {
  const logs = await getLogs();
  
  const stats = {
    total: logs.length,
    byLevel: {
      debug: 0,
      info: 0,
      warn: 0,
      error: 0,
    } as Record<LogLevel, number>,
    byCategory: {} as Record<string, number>,
    oldest: logs.length > 0 ? logs[0].timestamp : undefined,
    newest: logs.length > 0 ? logs[logs.length - 1].timestamp : undefined,
  };
  
  logs.forEach(log => {
    stats.byLevel[log.level]++;
    stats.byCategory[log.category] = (stats.byCategory[log.category] || 0) + 1;
  });
  
  return stats;
}

/**
 * Initialize logger (optional - auto-initializes on first use)
 */
export function initLogger(): void {
  log.info('Logger', 'Logger initialized', {
    maxStoredLogs: MAX_STORED_LOGS,
    timestamp: new Date().toISOString(),
  });
}

