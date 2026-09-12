import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname, searchParams } = request.nextUrl;
  const isDemo = searchParams.get("demo") === "true" || request.cookies.get("demo_session")?.value === "true";

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return supabaseResponse;
  }

  let user = null;

  try {
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // IMPORTANT: Do not run code between createServerClient and supabase.auth.getUser()
    const { data } = await supabase.auth.getUser();
    user = data.user;
  } catch {
    // In case Supabase local docker is not running or network connection fails
    user = null;
  }

  // Route Guard: Protect /admin routes
  if (pathname.startsWith("/admin")) {
    if (!user && !isDemo) {
      const redirectUrl = new URL("/auth/signin", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }

  // Route Guard: Redirect authenticated users away from auth pages
  if (pathname.startsWith("/auth/signin") || pathname.startsWith("/auth/signup")) {
    if (user) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }
  }

  return supabaseResponse;
}
