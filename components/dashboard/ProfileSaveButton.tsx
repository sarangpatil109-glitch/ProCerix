"use client";

import { Save } from "lucide-react";
import { trackEvent } from "@/lib/clarity";

export function ProfileSaveButton() {
  return (
    <button
      type="submit"
      onClick={() => trackEvent("profile_updated")}
      className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold transition-colors"
    >
      <Save className="w-4 h-4" /> Save Profile
    </button>
  );
}
