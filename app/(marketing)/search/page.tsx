import { Suspense } from "react";
import { Metadata } from "next";
import { SearchBar } from "@/components/search/search-bar";
import { SearchFilters } from "@/components/search/search-filters";
import { CourseCard } from "@/components/search/course-card";
import { SearchResultsSkeleton } from "@/components/search/search-results-skeleton";
import { SearchService } from "@/services/search-service";
import { AIGenerateButton } from "@/components/search/ai-generate-button";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Explore Courses | ProCerix",
  description: "Discover top-tier courses, internships, and skill certificates on ProCerix.",
};

import { AutoGenerateCourse } from "@/components/search/auto-generate-course";
import { redirect } from "next/navigation";

async function SearchResults({ searchParams }: { searchParams: any }) {
  const result = await SearchService.searchCourses(searchParams);
  
  if (searchParams.q && result.courses && result.courses.length > 0) {
    // Exact or partial match exists -> immediately redirect to the top result!
    redirect(`/course/${result.courses[0].slug}`);
  }

  if (!result.courses || result.courses.length === 0) {
    if (searchParams.q) {
      // Course does not exist -> show auto generation screen
      return <AutoGenerateCourse query={searchParams.q} />;
    }
    
    // Empty state without query
    return (
      <div className="text-center py-24 bg-white/50 dark:bg-gray-900/30 rounded-3xl border border-gray-100 dark:border-gray-800 backdrop-blur-sm">
        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">Start exploring courses</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-10 max-w-lg mx-auto">
          Use the search bar above to find exactly what you're looking for.
        </p>
      </div>
    );
  }

  const buildPaginationUrl = (pageOffset: number) => {
    const urlParams = new URLSearchParams();
    Object.entries(searchParams).forEach(([key, value]) => {
      if (typeof key === "string" && typeof value === "string") {
        urlParams.set(key, value);
      }
    });
    urlParams.set("page", String(parseInt(searchParams.page || "1") + pageOffset));
    return `/search?${urlParams.toString()}`;
  };

  return (
    <div className="space-y-12">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
        {result.courses.map((course: any) => (
          <CourseCard key={course.id} course={course} searchQuery={searchParams.q} />
        ))}
      </div>
      
      <div className="flex justify-center">
        <div className="flex gap-4">
          {parseInt(searchParams.page || "1") > 1 && (
            <Link 
              href={buildPaginationUrl(-1)}
              className="px-6 py-3 rounded-full border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-gray-900 dark:text-white"
            >
              Previous
            </Link>
          )}
          {result.pagination.hasMore && (
            <Link 
              href={buildPaginationUrl(1)}
              className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors font-medium shadow-sm hover:shadow-md"
            >
              Next Page
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function SearchPage(props: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30 pb-20">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-900 py-16 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto space-y-10 relative z-10">
          <div className="text-center space-y-4">
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 dark:text-white">
              Explore Our Library
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Discover industry-leading courses and virtual internships to accelerate your career.
            </p>
          </div>
          
          <Suspense fallback={<div className="h-16 max-w-2xl mx-auto bg-gray-100 dark:bg-gray-900 animate-pulse rounded-full" />}>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 flex-shrink-0">
            <Suspense fallback={<div className="h-96 bg-gray-100 dark:bg-gray-900 animate-pulse rounded-2xl" />}>
              <SearchFilters />
            </Suspense>
          </aside>

          {/* Results Area */}
          <main className="flex-1 min-w-0">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {searchParams.q ? `Results for "${searchParams.q}"` : "All Courses"}
              </h2>
            </div>
            
            <Suspense fallback={<SearchResultsSkeleton />}>
              <SearchResults searchParams={searchParams} />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
