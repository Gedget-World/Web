import { NextRequest, NextResponse } from "next/server";

// A YouTube video id is always exactly 11 characters of this alphabet.
// Validating strictly here means the id is always embedded into a
// hardcoded youtube.com URL below, so this route can never be used to
// make our server fetch an arbitrary attacker-supplied host (SSRF).
const VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export async function GET(request: NextRequest) {
  const videoId = request.nextUrl.searchParams.get("videoId") || "";

  if (!VIDEO_ID_REGEX.test(videoId)) {
    return NextResponse.json(
      { valid: false, error: "invalid_id" },
      { status: 400 },
    );
  }

  try {
    // Browsers can't reliably call this endpoint directly: YouTube's oEmbed
    // response doesn't include an Access-Control-Allow-Origin header, so it
    // gets blocked by CORS. Fetching it here, server-to-server, avoids that.
    const res = await fetch(
      `https://www.youtube.com/oembed?url=${encodeURIComponent(
        `https://www.youtube.com/watch?v=${videoId}`,
      )}&format=json`,
      { cache: "no-store" },
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({
        valid: true,
        title: typeof data?.title === "string" ? data.title : undefined,
        authorName:
          typeof data?.author_name === "string" ? data.author_name : undefined,
        thumbnailUrl:
          typeof data?.thumbnail_url === "string"
            ? data.thumbnail_url
            : undefined,
      });
    }

    if (res.status === 400 || res.status === 404 || res.status === 401) {
      return NextResponse.json({
        valid: false,
        unavailable: true,
        error: "not_found",
      });
    }

    return NextResponse.json(
      { valid: false, error: "upstream_error", upstreamStatus: res.status },
      { status: 502 },
    );
  } catch (error) {
    console.error("Error verifying YouTube oEmbed:", error);
    return NextResponse.json(
      { valid: false, error: "network_error" },
      { status: 502 },
    );
  }
}
