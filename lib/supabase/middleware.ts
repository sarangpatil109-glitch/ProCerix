import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/validators/env";
import type { Database } from "@/types/supabase";

export const updateSession = async (request: NextRequest) => {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
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
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  const url = request.nextUrl.clone();

  const protectedRoutes = ["/dashboard", "/account", "/settings"];
  const isProtectedRoute = protectedRoutes.some((route) => url.pathname.startsWith(route));

  if (isProtectedRoute && !user) {
    console.log(`[proxy] ${url.pathname} → /login | reason: no session`);
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // ── Admin route protection ────────────────────────────────────────────────
  if (url.pathname.startsWith("/admin")) {
    const adminEmail = process.env.ADMIN_EMAIL;

    if (!user) {
      console.log(`[proxy] /admin → /login | reason: unauthenticated`);
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    console.log(`[proxy] /admin check | loggedInEmail=${user.email} | adminEmail=${adminEmail ?? "(not set)"}`);

    if (!adminEmail || user.email !== adminEmail) {
      console.warn(`[proxy] /admin → /dashboard | reason: ${user.email} is not the admin email`);
      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    console.log(`[proxy] /admin → ALLOWED | email=${user.email}`);
  }
  // ─────────────────────────────────────────────────────────────────────────

  const authRoutes = ["/login", "/signup", "/forgot-password", "/reset-password"];
  const isAuthRoute = authRoutes.some((route) => url.pathname.startsWith(route));

  if (isAuthRoute && user) {
    console.log(`[proxy] ${url.pathname} → /dashboard | reason: already authenticated`);
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
};
