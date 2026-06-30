"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SlidersHorizontal, Filter, X, ChevronDown } from "lucide-react";

export function MobileFilterDrawer() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [isOpen, setIsOpen] = useState(false);

  // Local (uncommitted) state inside the drawer
  const [localType, setLocalType] = useState("");
  const [localDiff, setLocalDiff] = useState("");
  const [localFree, setLocalFree] = useState("");

  const currentSort = searchParams.get("sort") || "newest";

  // Count active URL filters (excludes sort)
  const activeFilterCount = [
    searchParams.get("type"),
    searchParams.get("difficulty"),
    searchParams.get("free"),
  ].filter(Boolean).length;

  // Lock body scroll while drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const openDrawer = () => {
    // Sync local state from URL before opening
    setLocalType(searchParams.get("type") || "");
    setLocalDiff(searchParams.get("difficulty") || "");
    setLocalFree(searchParams.get("free") || "");
    setIsOpen(true);
  };

  const closeDrawer = () => setIsOpen(false);

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("sort", value);
    else params.delete("sort");
    params.set("page", "1");
    startTransition(() => router.push(`/search?${params.toString()}`));
  };

  const handleApply = () => {
    const params = new URLSearchParams(searchParams.toString());
    if (localType) params.set("type", localType); else params.delete("type");
    if (localDiff) params.set("difficulty", localDiff); else params.delete("difficulty");
    if (localFree) params.set("free", localFree); else params.delete("free");
    params.set("page", "1");
    closeDrawer();
    startTransition(() => router.push(`/search?${params.toString()}`));
  };

  const handleReset = () => {
    setLocalType("");
    setLocalDiff("");
    setLocalFree("");
  };

  return (
    <>
      {/* Filter + Sort bar */}
      <div className="flex items-center gap-3 mb-5">
        <button
          onClick={openDrawer}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-blue-600 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </button>

        <div className="relative flex-1">
          <select
            value={currentSort}
            onChange={(e) => handleSort(e.target.value)}
            className="w-full appearance-none pl-3 pr-8 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="alphabetical">A–Z</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>
      </div>

      {/* Backdrop */}
      <div
        aria-hidden="true"
        onClick={closeDrawer}
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      {/* Slide-in drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Filters"
        className={`fixed top-0 left-0 h-full w-[85vw] max-w-xs bg-white dark:bg-gray-950 z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <span className="text-base font-semibold text-gray-900 dark:text-white">Filters</span>
          </div>
          <button
            onClick={closeDrawer}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close filters"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Scrollable filter content */}
        <div className="flex-1 overflow-y-auto px-5 py-6 space-y-8">
          {/* Course Type */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Course Type
            </h3>
            <div className="space-y-3">
              {["", "certificate", "internship"].map((type) => (
                <label key={type} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="m-type"
                    checked={localType === type}
                    onChange={() => setLocalType(type)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {type === "" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Difficulty
            </h3>
            <div className="space-y-3">
              {["", "beginner", "intermediate", "advanced"].map((diff) => (
                <label key={diff} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="m-difficulty"
                    checked={localDiff === diff}
                    onChange={() => setLocalDiff(diff)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {diff === "" ? "Any Difficulty" : diff.charAt(0).toUpperCase() + diff.slice(1)}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Price
            </h3>
            <div className="space-y-3">
              {[
                { value: "", label: "All Prices" },
                { value: "true", label: "Free Only" },
                { value: "false", label: "Paid Only" },
              ].map((price) => (
                <label key={price.value} className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="radio"
                    name="m-free"
                    checked={localFree === price.value}
                    onChange={() => setLocalFree(price.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                    {price.label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Sticky bottom actions */}
        <div className="flex-shrink-0 px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950 flex gap-3">
          <button
            onClick={handleReset}
            className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-50 dark:hover:bg-gray-800 active:scale-95 transition-all"
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-semibold text-sm transition-all"
          >
            Apply Filters
          </button>
        </div>
      </div>
    </>
  );
}
