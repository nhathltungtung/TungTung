import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const { pathname, searchParams } = request.nextUrl;
  // Trong môi trường dev hoặc khi có tham số demo, tự động mở quyền truy cập mượt mà
  const isDemo =
    searchParams.get("demo") === "true" ||
    request.cookies.get("demo_session")?.value === "true" ||
    process.env.NODE_ENV === "development";

  // Nếu là phiên Demo / Dev, cho phép truy cập ngay lập tức và tự động lưu cookie để không bị redirect
  if (isDemo) {
    if (!request.cookies.get("demo_session")) {
      supabaseResponse.cookies.set("demo_session", "true", {
        path: "/",
        maxAge: 86400 * 7,
      });
    }
    return supabaseResponse;
  }

  // Kiểm tra nhanh xem trình duyệt có cookie phiên đăng nhập của Supabase không
  const allCookies = request.cookies.getAll();
  const hasAuthCookie = allCookies.some(
    (c) => c.name.startsWith("sb-") && c.name.endsWith("-auth-token")
  );

  // Nếu không có cookie xác thực, người dùng chắc chắn chưa đăng nhập -> Không gọi network để tránh lag
  if (!hasAuthCookie) {
    if (pathname.startsWith("/admin")) {
      const redirectUrl = new URL("/auth/signin", request.url);
      redirectUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(redirectUrl);
    }
    return supabaseResponse;
  }

  let user = null;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "dummy-key";

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

    // Thêm timeout 1 giây tối đa để tránh trường hợp mạng treo
    const timeoutPromise = new Promise<{ data: { user: null } }>((resolve) =>
      setTimeout(() => resolve({ data: { user: null } }), 1000)
    );

    const { data } = await Promise.race([
      supabase.auth.getUser(),
      timeoutPromise,
    ]);
    user = data.user;
  } catch {
    // Khi Supabase chưa bật Docker hoặc mất mạng
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
