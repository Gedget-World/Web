import { NextResponse, type NextRequest } from "next/server";
import { writeLog, type LogLevel } from "@/lib/logger";
import { createClient } from "@/lib/supabase/server";

// Ingest endpoint for customer-facing (browser) logs sent by lib/client-logger.ts.
// Writes are performed server-side via lib/logger.ts (service-role client),
// so the customer_logs_prod/dev tables never need to be exposed to anon/authenticated keys.

const VALID_LEVELS: LogLevel[] = ["debug", "info", "warn", "error", "fatal"];
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SOURCE_LENGTH = 255;
const MAX_URL_LENGTH = 500;
const MAX_CONTEXT_JSON_LENGTH = 10_000;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Invalid request body." },
        { status: 400 },
      );
    }

    const { level, message, context, source, url } = body as Record<
      string,
      unknown
    >;

    if (
      typeof level !== "string" ||
      !VALID_LEVELS.includes(level as LogLevel)
    ) {
      return NextResponse.json(
        {
          error: `Invalid or missing 'level'. Must be one of: ${VALID_LEVELS.join(", ")}.`,
        },
        { status: 400 },
      );
    }

    if (typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Missing 'message'." },
        { status: 400 },
      );
    }

    let safeContext: Record<string, unknown> | undefined;
    if (context && typeof context === "object") {
      const serialized = JSON.stringify(context);
      safeContext =
        serialized.length > MAX_CONTEXT_JSON_LENGTH
          ? { truncated: true }
          : (context as Record<string, unknown>);
    }

    // Best-effort: attach the logged-in customer's auth id, if any cookie session exists.
    let userId: string | undefined;
    try {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      userId = user?.id;
    } catch {
      // Auth lookup failures must never block logging.
    }

    const ipAddress =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      request.headers.get("x-real-ip") ||
      undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    await writeLog({
      level: level as LogLevel,
      message: message.slice(0, MAX_MESSAGE_LENGTH),
      context: safeContext,
      source:
        typeof source === "string"
          ? source.slice(0, MAX_SOURCE_LENGTH)
          : undefined,
      url: typeof url === "string" ? url.slice(0, MAX_URL_LENGTH) : undefined,
      userId,
      userAgent,
      ipAddress,
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("[Logs API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Failed to record log." },
      { status: 500 },
    );
  }
}
