import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "admin_session_token";

function getSupabaseOrigins() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    return { httpsOrigin: "", wssOrigin: "" };
  }

  try {
    const url = new URL(supabaseUrl);
    return {
      httpsOrigin: url.origin,
      wssOrigin: `wss://${url.host}`,
    };
  } catch {
    return { httpsOrigin: "", wssOrigin: "" };
  }
}

function buildCsp(nonce: string) {
  const { httpsOrigin: supabaseOrigin, wssOrigin: supabaseWssOrigin } =
    getSupabaseOrigins();
  const connectSources = [
    "'self'",
    supabaseOrigin,
    supabaseWssOrigin,
    "https://api.cashfree.com",
    "https://sandbox.cashfree.com",
  ].filter(Boolean);

  const imgSources = [
    "'self'",
    "data:",
    "blob:",
    "https://images.unsplash.com",
    supabaseOrigin,
  ].filter(Boolean);

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' https://sdk.cashfree.com`,
    "style-src 'self' 'unsafe-inline'",
    `img-src ${imgSources.join(" ")}`,
    "font-src 'self' data:",
    `connect-src ${connectSources.join(" ")}`,
    "frame-src 'self' https://www.youtube.com https://youtube.com https://www.instagram.com https://instagram.com https://*.cashfree.com https://cashfree.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self'",
    "upgrade-insecure-requests",
  ].join("; ");
}

function applySecurityHeaders(response: NextResponse, nonce: string) {
  response.headers.set("Content-Security-Policy", buildCsp(nonce));
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  );
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
}

export async function updateSession(request: NextRequest) {
  const nonce = crypto.randomUUID().replace(/-/g, "");
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);

  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  applySecurityHeaders(supabaseResponse, nonce);

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request: {
              headers: requestHeaders,
            },
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );

          applySecurityHeaders(supabaseResponse, nonce);
        },
      },
    },
  );

  await supabase.auth.getUser();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // Admin dashboard protection
  if (pathname.startsWith("/admin/dashboard")) {
    const adminSessionToken = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (!adminSessionToken) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin";
      url.searchParams.set("error", "unauthorized");
      const response = NextResponse.redirect(url);
      applySecurityHeaders(response, nonce);
      return response;
    }
  }

  // User protected routes
  const protectedRoutes = ["/checkout", "/profile", "/orders"];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  if (isProtectedRoute && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(url);
    applySecurityHeaders(response, nonce);
    return response;
  }

  return supabaseResponse;
}
