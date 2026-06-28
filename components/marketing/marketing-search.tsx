"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles } from "lucide-react";

export function MarketingHeroSearch() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <form onSubmit={handleSearch} className="w-full max-w-3xl mx-auto relative group mt-10">
      <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-400 rounded-full blur opacity-25 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
      <div className="relative flex items-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-full p-2 shadow-2xl overflow-hidden">
        <Search className="w-6 h-6 text-gray-400 ml-4 shrink-0" />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What skill do you want to master today?"
          className="w-full bg-transparent px-4 py-4 focus:outline-none text-gray-900 dark:text-white font-medium text-lg placeholder:text-gray-400"
        />
        <button 
          type="submit" 
          className="shrink-0 flex items-center gap-2 bg-gray-900 dark:bg-white hover:bg-gray-800 dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold px-8 py-4 rounded-full transition-all"
        >
          <Sparkles className="w-5 h-5" />
          Generate
        </button>
      </div>
    </form>
  );
}
