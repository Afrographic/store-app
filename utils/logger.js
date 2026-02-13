/**
 * Simple logger utility for the pos system
 * Provides structured logging with different log levels
 */

const logLevels = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

class Logger {
  constructor(level = 'INFO') {
    this.level = logLevels[level.toUpperCase()] || logLevels.INFO;
  }

  /**
   * Format log message with timestamp and level
   */
  formatMessage(level, message, metadata = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...metadata
    };
    
    return JSON.stringify(logEntry, null, 2);
  }

  /**
   * Log error messages
   */
  error(message, metadata = {}) {
    if (this.level >= logLevels.ERROR) {
      console.error(this.formatMessage('ERROR', message, metadata));
    }
  }

  /**
   * Log warning messages
   */
  warn(message, metadata = {}) {
    if (this.level >= logLevels.WARN) {
      console.warn(this.formatMessage('WARN', message, metadata));
    }
  }

  /**
   * Log info messages
   */
  info(message, metadata = {}) {
    if (this.level >= logLevels.INFO) {
      console.log(this.formatMessage('INFO', message, metadata));
    }
  }

  /**
   * Log debug messages
   */
  debug(message, metadata = {}) {
    if (this.level >= logLevels.DEBUG) {
      console.log(this.formatMessage('DEBUG', message, metadata));
    }
  }
}

// Create and export a default logger instance
const logger = new Logger(process.env.LOG_LEVEL || 'INFO');

module.exports = logger;
