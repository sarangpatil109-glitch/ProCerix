"use client";

import Script from "next/script";
import { Suspense, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { identifyUser, setTag, initWebVitals } from "@/lib/clarity";
import { createClient } from "@/lib/supabase/client";

const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_PROJECT_ID ?? "";

const CLARITY_SCRIPT = `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${CLARITY_ID}");`;

function RouteChangeTracker() {
  const pathname = usePathname();
  const isFirst = useRef(true);

  useEffect(() => {
    initWebVitals();
  }, []);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    if (typeof window !== "undefined" && typeof window.clarity === "function") {
      window.clarity("set", "page_path", pathname);
    }
  }, [pathname]);

  return null;
}

function UserIdentifier() {
  useEffect(() => {
    const supabase = createClient();

    const identify = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { user } = session;
      identifyUser(user.id, user.email ?? undefined);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        const p = profile as Record<string, unknown>;
        if (p.role) setTag("user_role", String(p.role));
        if (p.membership) setTag("user_membership", String(p.membership));
      }
    };

    identify();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        identifyUser(session.user.id, session.user.email ?? undefined);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  return null;
}

export function ClarityInit() {
  if (!CLARITY_ID) return null;

  return (
    <>
      <Script
        id="clarity-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{ __html: CLARITY_SCRIPT }}
      />
      <Suspense fallback={null}>
        <RouteChangeTracker />
        <UserIdentifier />
      </Suspense>
    </>
  );
}
