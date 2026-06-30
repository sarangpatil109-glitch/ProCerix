"use client";

import { useEffect } from "react";
import { search } from "@/lib/meta-pixel";
import { analyticsSearch } from "@/lib/analytics";
import { trackEvent } from "@/lib/clarity";

export function PixelFireSearch({ query }: { query: string }) {
  useEffect(() => {
    if (query) {
      search(query);
      analyticsSearch(query);
      trackEvent("search");
    }
  }, [query]);

  return null;
}
