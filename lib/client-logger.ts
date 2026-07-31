export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface ClientLogInput {
  message: string;
  context?: Record<string, unknown>;
  // Identifies which component/page/action the log came from, e.g. "checkout-form".
  source?: string;
}

// Browser-safe logger for customer-facing pages/components. POSTs to
// /api/logs, which writes to customer_logs_prod or customer_logs_dev
// depending on NODE_ENV. Never throws — logging must not break the UI.
function send(level: LogLevel, { message, context, source }: ClientLogInput) {
  if (typeof window === "undefined") return;

  try {
    const payload = JSON.stringify({
      level,
      message,
      context,
      source,
      url: window.location.href,
    });

    // sendBeacon survives page unloads/navigations, so prefer it when available.
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: "application/json" });
      if (navigator.sendBeacon("/api/logs", blob)) return;
    }

    fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    }).catch(() => {
      // Swallow network errors — logging must never break the app.
    });
  } catch {
    // Swallow serialization/runtime errors for the same reason.
  }
}

export const clientLogger = {
  debug: (message: string, options?: Omit<ClientLogInput, "message">) =>
    send("debug", { message, ...options }),
  info: (message: string, options?: Omit<ClientLogInput, "message">) =>
    send("info", { message, ...options }),
  warn: (message: string, options?: Omit<ClientLogInput, "message">) =>
    send("warn", { message, ...options }),
  error: (message: string, options?: Omit<ClientLogInput, "message">) =>
    send("error", { message, ...options }),
};
