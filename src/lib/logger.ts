import { supabase } from "@/integrations/supabase/client";
import { isDevelopment } from "@/lib/env";

export enum LogLevel {
  DEBUG = "DEBUG",
  INFO = "INFO",
  WARN = "WARN",
  ERROR = "ERROR",
}

interface LogEntry {
  level: LogLevel;
  message: string;
  context?: any;
  timestamp: string;
  userId?: string;
  sessionId: string;
}

// Generate a session ID for this browser session
const SESSION_ID =
  typeof window !== "undefined"
    ? `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    : "server_session";

async function log(level: LogLevel, message: string, context?: any) {
  const timestamp = new Date().toISOString();

  // Get current user ID if available
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const userId = user?.id;

  const logEntry: LogEntry = {
    level,
    message,
    context,
    timestamp,
    userId,
    sessionId: SESSION_ID,
  };

  // In development, always log to console
  if (isDevelopment) {
    const consoleMethod =
      level === LogLevel.ERROR
        ? console.error
        : level === LogLevel.WARN
          ? console.warn
          : console.log;

    consoleMethod(
      `[${level}] ${timestamp}`,
      message,
      context ? context : ""
    );
  }

  // In production, only log ERROR level to database
  if (!isDevelopment && level === LogLevel.ERROR) {
    try {
      await supabase.from("application_logs").insert({
        level: logEntry.level,
        message: logEntry.message,
        context: logEntry.context || null,
        user_id: logEntry.userId || null,
        session_id: logEntry.sessionId,
      });
    } catch (error) {
      // Fallback to console if database logging fails
      console.error("Failed to log to database:", error);
      console.error("Original log entry:", logEntry);
    }
  }
}

export const logger = {
  debug: (message: string, context?: any) =>
    log(LogLevel.DEBUG, message, context),
  info: (message: string, context?: any) => log(LogLevel.INFO, message, context),
  warn: (message: string, context?: any) => log(LogLevel.WARN, message, context),
  error: (message: string, context?: any) =>
    log(LogLevel.ERROR, message, context),
};
