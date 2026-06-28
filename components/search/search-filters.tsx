"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import { Filter } from "lucide-react";

export function SearchFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleFilterChange = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  };

  const currentType = searchParams.get("type") || "";
  const currentDiff = searchParams.get("difficulty") || "";
  const currentFree = searchParams.get("free") || "";
  const currentSort = searchParams.get("sort") || "newest";

  return (
    <div className={`w-full flex-shrink-0 space-y-8 ${isPending ? 'opacity-70' : 'opacity-100'} transition-opacity`}>
      <div className="flex items-center space-x-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
        <Filter className="h-5 w-5" />
        <span>Filters</span>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Course Type</h3>
        <div className="space-y-2">
          {["", "certificate", "internship"].map((type) => (
            <label key={type} className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="type" 
                checked={currentType === type}
                onChange={() => handleFilterChange("type", type)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 bg-transparent"
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {type === "" ? "All Types" : type.charAt(0).toUpperCase() + type.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Difficulty</h3>
        <div className="space-y-2">
          {["", "beginner", "intermediate", "advanced"].map((diff) => (
            <label key={diff} className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="difficulty" 
                checked={currentDiff === diff}
                onChange={() => handleFilterChange("difficulty", diff)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 bg-transparent"
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {diff === "" ? "Any Difficulty" : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Price</h3>
        <div className="space-y-2">
          {[
            { value: "", label: "All Prices" },
            { value: "true", label: "Free Only" },
            { value: "false", label: "Paid Only" }
          ].map((price) => (
            <label key={price.value} className="flex items-center space-x-3 cursor-pointer group">
              <input 
                type="radio" 
                name="free" 
                checked={currentFree === price.value}
                onChange={() => handleFilterChange("free", price.value)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-700 bg-transparent"
              />
              <span className="text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
                {price.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Sort By</h3>
        <select 
          value={currentSort}
          onChange={(e) => handleFilterChange("sort", e.target.value)}
          className="mt-1 block w-full pl-3 pr-10 py-2.5 text-base border-gray-200 dark:border-gray-800 dark:bg-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm rounded-lg transition-colors"
        >
          <option value="newest">Newest First</option>
          <option value="popular">Most Popular</option>
          <option value="alphabetical">Alphabetical (A-Z)</option>
        </select>
      </div>
    </div>
  );
}
