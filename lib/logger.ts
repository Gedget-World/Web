import "server-only";
import { createServiceClient } from "@/lib/supabase/service";

// Server-only: writes go through the service-role client, so this must
// never be imported from a "use client" component. Use lib/client-logger.ts
// (which POSTs to /api/logs) for browser code instead.

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntryInput {
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
  source?: string;
  url?: string;
  userId?: string;
  customerId?: string;
  sessionId?: string;
  userAgent?: string;
  ipAddress?: string;
  stack?: string;
}

// Separate prod/dev tables per requirements -> pick the table based on runtime env.
function getLogTable(): "customer_logs_prod" | "customer_logs_dev" {
  return process.env.NODE_ENV === "production"
    ? "customer_logs_prod"
    : "customer_logs_dev";
}

export async function writeLog(entry: LogEntryInput): Promise<void> {
  try {
    const supabase = createServiceClient();
    const table = getLogTable();

    const { error } = await supabase.from(table).insert({
      level: entry.level,
      message: entry.message,
      context: entry.context ?? null,
      source: entry.source ?? null,
      url: entry.url ?? null,
      user_id: entry.userId ?? null,
      customer_id: entry.customerId ?? null,
      session_id: entry.sessionId ?? null,
      user_agent: entry.userAgent ?? null,
      ip_address: entry.ipAddress ?? null,
      stack: entry.stack ?? null,
    });

    if (error) {
      console.error(`[Logger] Failed to write to ${table}:`, error);
    }
  } catch (err) {
    // Logging must never throw and break the caller's request/render.
    console.error("[Logger] Unexpected error while writing log:", err);
  }
}

type LogOptions = Omit<LogEntryInput, "level" | "message">;

export const logger = {
  debug: (message: string, options?: LogOptions) =>
    writeLog({ level: "debug", message, ...options }),
  info: (message: string, options?: LogOptions) =>
    writeLog({ level: "info", message, ...options }),
  warn: (message: string, options?: LogOptions) =>
    writeLog({ level: "warn", message, ...options }),
  error: (message: string, options?: LogOptions) =>
    writeLog({ level: "error", message, ...options }),
  fatal: (message: string, options?: LogOptions) =>
    writeLog({ level: "fatal", message, ...options }),
};
