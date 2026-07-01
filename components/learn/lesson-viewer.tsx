import { BookOpen, Clock, FileText } from "lucide-react";

export function LessonViewer({ lesson }: { lesson: any }) {
  const readingTime: number = lesson.estimated_reading_time ?? 5;

  return (
    <div className="max-w-3xl mx-auto w-full space-y-8">

      {/* Article header */}
      <div className="space-y-4">
        <div className="flex items-center gap-4 text-sm text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1.5">
            <BookOpen className="w-4 h-4" />
            Learning Module
          </span>
          <span className="w-1 h-1 rounded-full bg-gray-300 dark:bg-gray-600" />
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {readingTime} min read
          </span>
        </div>

        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
          {lesson.title}
        </h1>
      </div>

      {/* Divider */}
      <hr className="border-gray-200 dark:border-gray-800" />

      {/* Article content */}
      <div className="prose prose-lg dark:prose-invert max-w-none
        prose-headings:font-bold prose-headings:text-gray-900 dark:prose-headings:text-white
        prose-p:text-gray-700 dark:prose-p:text-gray-300 prose-p:leading-relaxed
        prose-a:text-blue-600 dark:prose-a:text-blue-400
        prose-strong:text-gray-900 dark:prose-strong:text-white
        prose-code:bg-gray-100 dark:prose-code:bg-gray-800 prose-code:rounded prose-code:px-1
        prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 dark:prose-blockquote:bg-blue-900/10
        prose-ul:text-gray-700 dark:prose-ul:text-gray-300
        prose-ol:text-gray-700 dark:prose-ol:text-gray-300">
        {lesson.content ? (
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        ) : (
          <div className="flex flex-col items-center gap-4 py-20 text-center">
            <FileText className="w-14 h-14 text-gray-200 dark:text-gray-700" />
            <p className="text-gray-400 font-medium">Article content is being prepared.</p>
            <p className="text-gray-400 text-sm">Check back soon.</p>
          </div>
        )}
      </div>
    </div>
  );
}
