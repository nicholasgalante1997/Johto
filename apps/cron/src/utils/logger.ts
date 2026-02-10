import { createLogger as createBaseLogger } from '@pokemon/logger';
import type { JobLogger } from '../scheduler/types';

/**
 * Create a logger instance for the cron service.
 * Wraps @pokemon/logger with cron-specific defaults.
 */
export function createLogger(namespace: string): JobLogger {
  const baseLogger = createBaseLogger(namespace);

  return {
    debug: (message: string, ...args: unknown[]) => {
      baseLogger.debug(formatMessage(message, args));
    },
    info: (message: string, ...args: unknown[]) => {
      baseLogger.info(formatMessage(message, args));
    },
    warn: (message: string, ...args: unknown[]) => {
      baseLogger.warn(formatMessage(message, args));
    },
    error: (message: string, ...args: unknown[]) => {
      baseLogger.error(formatMessage(message, args));
    }
  };
}

/**
 * Format a message with printf-style arguments.
 */
function formatMessage(message: string, args: unknown[]): string {
  if (args.length === 0) {
    return message;
  }

  let argIndex = 0;
  return message.replace(/%[sdjoO]/g, (match) => {
    if (argIndex >= args.length) {
      return match;
    }

    const arg = args[argIndex++];

    switch (match) {
      case '%s':
        return String(arg);
      case '%d':
        return String(Number(arg));
      case '%j':
      case '%o':
      case '%O':
        try {
          return JSON.stringify(arg);
        } catch {
          return String(arg);
        }
      default:
        return match;
    }
  });
}

/**
 * Create a logger that also collects logs into an array.
 * Useful for capturing job execution logs in the result.
 */
export function createCollectingLogger(
  namespace: string,
  logs: string[]
): JobLogger {
  const baseLogger = createLogger(namespace);

  const addLog = (level: string, message: string, args: unknown[]) => {
    const timestamp = new Date().toISOString();
    const formattedMessage = formatMessage(message, args);
    logs.push(`[${timestamp}] [${level.toUpperCase()}] ${formattedMessage}`);
  };

  return {
    debug: (message: string, ...args: unknown[]) => {
      addLog('debug', message, args);
      baseLogger.debug(message, ...args);
    },
    info: (message: string, ...args: unknown[]) => {
      addLog('info', message, args);
      baseLogger.info(message, ...args);
    },
    warn: (message: string, ...args: unknown[]) => {
      addLog('warn', message, args);
      baseLogger.warn(message, ...args);
    },
    error: (message: string, ...args: unknown[]) => {
      addLog('error', message, args);
      baseLogger.error(message, ...args);
    }
  };
}
