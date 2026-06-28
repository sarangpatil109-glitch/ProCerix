import { AIProvider, AIProviderResponse } from "../interfaces/ai-provider.interface";
import { SettingsService } from "@/services/settings-service";

export class GeminiProvider implements AIProvider {
  private apiKey: string;
  
  constructor() {
    this.apiKey = process.env.GEMINI_API_KEY || "";
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  async generateStructuredContent<T>(prompt: string | Promise<string>, schema: any): Promise<AIProviderResponse<T>> {
    const modelName = await SettingsService.getSetting("ai_model_name", "gemini-2.5-flash");
    const resolvedPrompt = await prompt;
    
    // Strict system instruction focusing purely on JSON execution
    const systemInstruction = `You are a highly constrained educational curriculum generator.
You MUST return the requested content in STRICT JSON format matching the schema exactly.
Do NOT wrap the output in markdown blocks (e.g., no \`\`\`json).
Do NOT include any explanations, greetings, or trailing text.
OUTPUT VALID JSON ONLY.`;

    const fullPrompt = `${resolvedPrompt}\n\nStrictly adhere to this JSON structure:\n${JSON.stringify(schema, null, 2)}`;

    let retries = 0;
    const maxRetries = 3;
    let lastError = null;

    while (retries < maxRetries) {
      const startTime = Date.now();
      try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${this.apiKey}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: systemInstruction }] },
            contents: [{ parts: [{ text: fullPrompt }] }],
            generationConfig: {
              temperature: 0.2, // Low temperature for deterministic structures
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API Error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        
        if (!data.candidates || data.candidates.length === 0) {
          throw new Error("No candidates returned from Gemini");
        }

        let contentText = data.candidates[0].content.parts[0].text;
        
        // Defensive cleanup for JSON payloads
        contentText = contentText.trim().replace(/^```json\s*/i, "").replace(/\s*```$/i, "");
        
        const parsedJson = JSON.parse(contentText);

        const promptTokens = data.usageMetadata?.promptTokenCount || 0;
        const completionTokens = data.usageMetadata?.candidatesTokenCount || 0;

        return {
          data: parsedJson as T,
          meta: {
            providerName: "gemini",
            tokenUsage: {
              prompt: promptTokens,
              completion: completionTokens,
              total: promptTokens + completionTokens
            },
            generationTimeMs: Date.now() - startTime
          }
        };

      } catch (error: any) {
        lastError = error;
        retries++;
        console.error(`Gemini Generation Attempt ${retries} failed:`, error.message);
        // Exponential backoff
        if (retries < maxRetries) {
           await new Promise(res => setTimeout(res, 1000 * Math.pow(2, retries)));
        }
      }
    }

    throw new Error(`Gemini Generation Failed after ${maxRetries} attempts. Last error: ${lastError?.message}`);
  }
}
