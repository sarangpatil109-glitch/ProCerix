"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, useEffect, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Link from "next/link";

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [isPending, startTransition] = useTransition();
  const [suggestions, setSuggestions] = useState<{courses: any[], internships: any[]}>({courses: [], internships: []});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (formRef.current && !formRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchSuggestions = async (q: string) => {
    if (!q || q.length < 2) {
      setSuggestions({courses: [], internships: []});
      setShowSuggestions(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setSuggestions(data);
        setShowSuggestions(true);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const onQueryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    if (val.trim().length >= 2) {
      setIsLoading(true);
      debounceRef.current = setTimeout(() => {
        fetchSuggestions(val);
      }, 300);
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    const params = new URLSearchParams(searchParams.toString());
    if (query) {
      params.set("q", query);
    } else {
      params.delete("q");
    }
    params.set("page", "1");

    startTransition(() => {
      router.push(`/search?${params.toString()}`);
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSearch} className="relative w-full max-w-2xl mx-auto group z-50">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        <Search className={`h-5 w-5 ${isPending || isLoading ? 'text-blue-500 animate-pulse' : 'text-gray-400 group-focus-within:text-blue-500 transition-colors'}`} />
      </div>
      <input
        type="text"
        value={query}
        onChange={onQueryChange}
        onFocus={() => { if (query.length >= 2) fetchSuggestions(query); }}
        className="block w-full pl-12 pr-12 py-4 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/50 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm hover:shadow-md focus:shadow-lg text-lg backdrop-blur-md"
        placeholder="What do you want to learn today?"
        autoComplete="off"
      />
      {isLoading && (
        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
          <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
        </div>
      )}
      <button type="submit" className="sr-only">Search</button>

      {showSuggestions && (suggestions.courses.length > 0 || suggestions.internships.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xl overflow-hidden z-50">
          <div className="p-2">
            {suggestions.courses.length > 0 && (
              <div className="mb-2">
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Courses</div>
                {suggestions.courses.map(course => (
                  <Link 
                    key={course.id} 
                    href={course.marketing_route || `/course/${course.slug}`}
                    className="block px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate">{course.title}</div>
                    <div className="text-sm text-gray-500 truncate">{course.category}</div>
                  </Link>
                ))}
              </div>
            )}
            {suggestions.internships.length > 0 && (
              <div>
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Internships</div>
                {suggestions.internships.map(internship => (
                  <Link 
                    key={internship.id} 
                    href={`/internships/${internship.slug}`}
                    className="block px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    onClick={() => setShowSuggestions(false)}
                  >
                    <div className="font-medium text-gray-900 dark:text-white truncate">{internship.title}</div>
                    <div className="text-sm text-gray-500 truncate">{internship.category}</div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </form>
  );
}
