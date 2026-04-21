/**
 * Simple centralized logger for consistent error tracking.
 * In a real production environment, this could integrate with services like Sentry, Datadog, or LogRocket.
 */

const LogLevel = {
  INFO: "INFO",
  WARN: "WARN",
  ERROR: "ERROR",
  DEBUG: "DEBUG",
};

export const logger = {
  info: (message, context = {}) => {
    console.log(`[${LogLevel.INFO}] ${message}`, context);
  },
  warn: (message, context = {}) => {
    console.warn(`[${LogLevel.WARN}] ${message}`, context);
  },
  error: (message, error = null, context = {}) => {
    console.error(`[${LogLevel.ERROR}] ${message}`, {
      error: error?.message || error,
      stack: error?.stack,
      ...context,
    });
    // Here you would typically send this error to an external monitoring service
  },
  debug: (message, context = {}) => {
    if (process.env.NODE_ENV === "development") {
      console.log(`[${LogLevel.DEBUG}] ${message}`, context);
    }
  },
};
