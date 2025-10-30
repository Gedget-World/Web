import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr"

export function createClient() {
  return createSupabaseBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return document.cookie.split("; ").map((cookie) => {
            const [name, ...rest] = cookie.split("=")
            return { name, value: rest.join("=") }
          })
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            const cookieOptions = {
              ...options,
              path: options?.path || "/",
              sameSite: options?.sameSite || "lax",
              secure: options?.secure !== false,
            }

            let cookie = `${name}=${value}`
            if (cookieOptions.maxAge) cookie += `; Max-Age=${cookieOptions.maxAge}`
            if (cookieOptions.path) cookie += `; Path=${cookieOptions.path}`
            if (cookieOptions.domain) cookie += `; Domain=${cookieOptions.domain}`
            if (cookieOptions.sameSite) cookie += `; SameSite=${cookieOptions.sameSite}`
            if (cookieOptions.secure) cookie += "; Secure"

            document.cookie = cookie
          })
        },
      },
    },
  )
}

export function createBrowserClient() {
  return createClient()
}
