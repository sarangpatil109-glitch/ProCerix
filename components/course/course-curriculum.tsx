"use client";

import { useState } from "react";
import { ChevronDown, PlayCircle, FileText } from "lucide-react";

export function CourseCurriculum({ modules }: { modules: any[] }) {
  const [openModule, setOpenModule] = useState<string | null>(modules[0]?.id || null);

  if (!modules || modules.length === 0) return null;

  return (
    <div className="space-y-4">
      {modules.map((module, index) => (
        <div key={module.id} className="border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden bg-white dark:bg-gray-900/50">
          <button
            onClick={() => setOpenModule(openModule === module.id ? null : module.id)}
            className="w-full flex items-center justify-between p-6 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
          >
            <div>
              <div className="text-sm font-semibold text-blue-600 dark:text-blue-400 mb-1">
                Module {index + 1}
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {module.title}
              </h3>
            </div>
            <ChevronDown 
              className={`w-6 h-6 text-gray-400 transition-transform duration-300 ${openModule === module.id ? 'rotate-180' : ''}`} 
            />
          </button>
          
          <div className={`overflow-hidden transition-all duration-300 ${openModule === module.id ? 'max-h-96' : 'max-h-0'}`}>
            <div className="p-6 pt-0 border-t border-gray-100 dark:border-gray-800">
              <p className="text-gray-600 dark:text-gray-400 mb-4 text-sm">
                {module.description}
              </p>
              
              <div className="space-y-3">
                {module.lessons?.map((lesson: any, lIndex: number) => (
                  <div key={lesson.id} className="flex items-center gap-4 text-gray-700 dark:text-gray-300 py-2">
                    {lesson.video_url || index === 0 ? (
                      <PlayCircle className="w-5 h-5 text-blue-500/70 flex-shrink-0" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                    <span className="text-sm font-medium">{lesson.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
