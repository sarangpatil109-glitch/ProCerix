"use client";

import { useEffect } from "react";
import { viewContent } from "@/lib/meta-pixel";
import { analyticsViewItem } from "@/lib/analytics";
import { trackEvent } from "@/lib/clarity";

export function PixelFireViewContent({
  content_name,
  content_category,
  content_type,
}: {
  content_name: string;
  content_category?: string;
  content_type?: string;
}) {
  useEffect(() => {
    viewContent({ content_name, content_category, content_type });
    analyticsViewItem({ item_name: content_name, item_category: content_category, item_type: content_type });
    trackEvent(content_type === "internship" ? "internship_view" : "course_view");
  }, [content_name, content_category, content_type]);

  return null;
}
