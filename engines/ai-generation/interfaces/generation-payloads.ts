export interface GeneratedLesson {
  title: string;
  content: string;
  sequence_order: number;
}

export interface GeneratedModule {
  title: string;
  description: string;
  sequence_order: number;
  lessons: GeneratedLesson[];
}

export interface GeneratedMCQ {
  question: string;
  options: { content: string; is_correct: boolean }[];
  points: number;
}

export interface GeneratedTask {
  title: string;
  description: string;
  sequence_order: number;
}

export interface GeneratedCoursePayload {
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  course_type: "certificate" | "internship";
  modules: GeneratedModule[];
  mcqs: GeneratedMCQ[];
  tasks?: GeneratedTask[];
}
