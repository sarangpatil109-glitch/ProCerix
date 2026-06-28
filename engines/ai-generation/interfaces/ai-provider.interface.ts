export interface AIProviderResponse<T> {
  data: T;
  meta: {
    providerName: string;
    tokenUsage: { prompt: number; completion: number; total: number };
    generationTimeMs: number;
  };
}

export interface AIProvider {
  generateStructuredContent<T>(prompt: string | Promise<string>, schema: any): Promise<AIProviderResponse<T>>;
  isAvailable(): boolean;
}
