export function SearchResultsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="flex flex-col h-full bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden animate-pulse">
          <div className="h-48 w-full bg-gray-200 dark:bg-gray-800/80" />
          <div className="p-6 flex flex-col flex-grow">
            <div className="h-6 w-3/4 bg-gray-200 dark:bg-gray-800/80 rounded mb-4" />
            <div className="h-4 w-full bg-gray-200 dark:bg-gray-800/80 rounded mb-2" />
            <div className="h-4 w-5/6 bg-gray-200 dark:bg-gray-800/80 rounded mb-6" />
            <div className="mt-auto pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-between">
              <div className="h-4 w-20 bg-gray-200 dark:bg-gray-800/80 rounded" />
              <div className="h-6 w-16 bg-gray-200 dark:bg-gray-800/80 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
