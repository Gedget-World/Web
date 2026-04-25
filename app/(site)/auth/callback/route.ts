import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const error = requestUrl.searchParams.get("error");
  const errorDescription = requestUrl.searchParams.get("error_description");
  const redirect = requestUrl.searchParams.get("redirect") || "/";

  // If this callback was meant for a password reset flow, send any errors
  // back to the forgot-password page so the user can request a new link.
  const isPasswordResetFlow = redirect.startsWith("/auth/reset-password");
  const errorRedirectTarget = isPasswordResetFlow
    ? "/auth/forgot-password"
    : "/auth/login";

  // Handle OAuth errors from provider
  if (error) {
    console.error("OAuth error:", error, errorDescription);
    return NextResponse.redirect(
      new URL(
        `${errorRedirectTarget}?error=${encodeURIComponent(errorDescription || error)}`,
        requestUrl.origin,
      ),
    );
  }

  if (code) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          },
        },
      },
    );

    const { data, error: exchangeError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError) {
      console.error("Code exchange error:", exchangeError);
      return NextResponse.redirect(
        new URL(
          `${errorRedirectTarget}?error=${encodeURIComponent(exchangeError.message)}`,
          requestUrl.origin,
        ),
      );
    }

    // Successfully authenticated
    console.log("OAuth successful, user:", data.user?.email);
  }

  return NextResponse.redirect(new URL(redirect, requestUrl.origin));
}
