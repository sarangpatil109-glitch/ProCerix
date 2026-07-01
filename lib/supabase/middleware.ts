import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/types/supabase";

export const updateSession = async (request: NextRequest) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error(
      "[Supabase] NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set. " +
        "Middleware session refresh is disabled until these environment variables are configured."
    );
    return NextResponse.next({ request: { headers: request.headers } });
  }

  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // Refresh session
  const { data: { user } } = await supabase.auth.getUser();

  const reqUrl = request.nextUrl.clone();

  const protectedRoutes = ["/dashboard", "/account", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) => reqUrl.pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    console.log(`[proxy] ${reqUrl.pathname} → /login | reason: no session`);
    reqUrl.pathname = "/login";
    return NextResponse.redirect(reqUrl);
  }

  // ── Admin route protection ─────────────────────────────────────────────────
  if (reqUrl.pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!user) {
      reqUrl.pathname = "/login";
      return NextResponse.redirect(reqUrl);
    }
    if (!adminEmail || user.email !== adminEmail) {
      reqUrl.pathname = "/dashboard";
      return NextResponse.redirect(reqUrl);
    }
  }

  // ── Affiliate dashboard protection ────────────────────────────────────────
  if (reqUrl.pathname.startsWith("/affiliate/dashboard") || reqUrl.pathname.startsWith("/api/affiliate/")) {
    if (!user) {
      reqUrl.pathname = "/login";
      reqUrl.searchParams.set("next", request.nextUrl.pathname);
      return NextResponse.redirect(reqUrl);
    }
    // Full affiliate status check happens in the page/API itself for flexibility
    // Middleware just ensures user is logged in
  }
  // ──────────────────────────────────────────────────────────────────────────

  const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.some((route) => reqUrl.pathname.startsWith(route));

  if (isAuthRoute && user) {
    reqUrl.pathname = "/dashboard";
    return NextResponse.redirect(reqUrl);
  }

  return supabaseResponse;
};
