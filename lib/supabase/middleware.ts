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
    request: { headers: request.headers },
  });

  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const reqUrl = request.nextUrl.clone();

  // ── Auth-route guard: redirect already-logged-in users away from /login, /signup ──
  const authRoutes = ["/login", "/signup", "/forgot-password"];
  const isAuthRoute = authRoutes.some((r) => reqUrl.pathname.startsWith(r));

  if (isAuthRoute && user) {
    const returnTo = reqUrl.searchParams.get("returnTo");
    if (returnTo && returnTo.startsWith("/")) {
      return NextResponse.redirect(new URL(returnTo, request.url));
    }
    const dest = new URL("/dashboard", request.url);
    return NextResponse.redirect(dest);
  }

  // ── Protected routes (dashboard / learn) ─────────────────────────────────────
  const protectedPrefixes = ["/dashboard", "/account", "/settings", "/learn"];
  const isProtected = protectedPrefixes.some((p) => reqUrl.pathname.startsWith(p));

  if (isProtected && !user) {
    const destination = request.nextUrl.pathname + request.nextUrl.search;
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("returnTo", destination);
    console.log(`[proxy] ${reqUrl.pathname} → /login?returnTo=${destination}`);
    return NextResponse.redirect(loginUrl);
  }

  // ── Admin route protection ────────────────────────────────────────────────────
  if (reqUrl.pathname.startsWith("/admin")) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", reqUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || user.email !== adminEmail) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  // ── Affiliate dashboard protection ───────────────────────────────────────────
  if (
    reqUrl.pathname.startsWith("/affiliate/dashboard") ||
    reqUrl.pathname.startsWith("/api/affiliate/")
  ) {
    if (!user) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("returnTo", request.nextUrl.pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return supabaseResponse;
};
