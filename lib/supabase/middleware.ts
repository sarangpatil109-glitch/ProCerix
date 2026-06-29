import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
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
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
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
    // 1. Must be authenticated
    if (!user) {
      console.log(`[proxy] ${url.pathname} → /login | reason: unauthenticated`);
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 2. Validate env before touching the DB
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey) {
      console.error(
        `[proxy] FATAL: SUPABASE_SERVICE_ROLE_KEY is not set. ` +
        `Cannot verify admin status for userId=${user.id}. ` +
        `Add it to .env.local and restart the dev server.`
      );
      // Fail open toward login, not dashboard — admin panel stays protected
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // 3. Query admin_users with the service role key (bypasses RLS)
    const serviceDb = createSupabaseClient<Database>(
      env.NEXT_PUBLIC_SUPABASE_URL,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: adminUser, error: adminError } = await serviceDb
      .from("admin_users")
      .select("id, role")
      .eq("id", user.id)
      .single();

    console.log(
      `[proxy] /admin check | ` +
      `url=${url.pathname} | ` +
      `userId=${user.id} | ` +
      `email=${user.email ?? "unknown"} | ` +
      `adminRow=${JSON.stringify(adminUser)} | ` +
      `dbError=${adminError?.code ?? "none"} (${adminError?.message ?? ""})`
    );

    if (!adminUser) {
      // User is authenticated but not in admin_users
      const reason = adminError
        ? `db error: ${adminError.code} – ${adminError.message}`
        : `userId ${user.id} not found in admin_users table`;

      console.warn(
        `[proxy] ${url.pathname} → /dashboard | ` +
        `reason: ${reason} | ` +
        `fix: INSERT INTO admin_users (id, role) VALUES ('${user.id}', 'admin');`
      );

      url.pathname = "/dashboard";
      return NextResponse.redirect(url);
    }

    // 4. Admin confirmed — let the request through
    console.log(`[proxy] ${url.pathname} → ALLOWED | userId=${user.id} | role=${(adminUser as any).role}`);
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
