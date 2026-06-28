export function LessonViewer({ lesson }: { lesson: any }) {
  return (
    <div className="max-w-4xl mx-auto w-full space-y-8">
      
      {/* Title Area */}
      <div className="space-y-4">
        <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
          {lesson.title}
        </h1>
      </div>

      {/* Video Player Placeholder */}
      {lesson.video_url && (
        <div className="aspect-video w-full bg-gray-900 rounded-2xl overflow-hidden shadow-2xl relative border border-gray-800 flex items-center justify-center">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 to-black/50" />
           <div className="text-gray-400 font-medium z-10 flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg cursor-pointer hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[14px] border-l-white border-b-[8px] border-b-transparent ml-1" />
              </div>
              <span>Video Player Ready</span>
           </div>
        </div>
      )}

      {/* Content Area */}
      <div className="prose prose-lg dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed">
        {lesson.content ? (
          <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
        ) : (
          <p>This lesson contains video material without additional reading content.</p>
        )}
      </div>

    </div>
  );
}
