import { createClient } from "@/lib/supabase/server";

export class PromptManager {
  static async getActivePrompt(templateType: string): Promise<string> {
    const supabase = await createClient();
    
    // Get the template by type
    const { data: template } = await supabase
      .from("prompt_templates")
      .select("id")
      .eq("type", templateType)
      .single();

    if (!template) {
      throw new Error(`Prompt template for type '${templateType}' not found.`);
    }

    // Get the active version
    const { data: version } = await supabase
      .from("prompt_versions")
      .select("content")
      .eq("template_id", template.id)
      .eq("is_active", true)
      .single();

    if (!version) {
      throw new Error(`No active prompt version found for template type '${templateType}'.`);
    }

    return version.content;
  }

  static injectVariables(prompt: string, variables: Record<string, string | number>): string {
    let injectedPrompt = prompt;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, "g");
      injectedPrompt = injectedPrompt.replace(regex, String(value));
    }
    return injectedPrompt;
  }
}
