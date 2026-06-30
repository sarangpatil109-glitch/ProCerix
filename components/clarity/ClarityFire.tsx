"use client";

import { useEffect } from "react";
import { trackEvent } from "@/lib/clarity";

export function ClarityFire({ event }: { event: string }) {
  useEffect(() => {
    trackEvent(event);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}
