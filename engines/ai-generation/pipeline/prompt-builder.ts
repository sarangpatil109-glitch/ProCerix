import { PromptManager } from "./prompt-manager";

export class PromptBuilder {
  static async buildCoursePrompt(skillName: string, courseType: "certificate" | "internship") {
    const isInternship = courseType === "internship";
    
    // Fetch dynamic template from database
    const rawPrompt = await PromptManager.getActivePrompt(courseType);
    
    // Inject variables
    const prompt = PromptManager.injectVariables(rawPrompt, {
      skill: skillName,
      course_type: courseType,
      module_count: isInternship ? "2 to 5" : "2 to 3",
      lesson_count: isInternship ? "10 to 15" : "5 to 8",
      mcq_count: 10,
      task_count: isInternship ? 3 : 0,
      difficulty: "adaptive" // Optional placeholder for future adaptive generation
    });

    return prompt;
  }
}
