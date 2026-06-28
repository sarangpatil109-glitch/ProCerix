import { createClient } from "@/lib/supabase/server";

export class SettingsService {
  private static cache: Record<string, { value: any, expiresAt: number }> = {};
  private static TTL = 1000 * 60 * 5; // 5 minutes cache

  static async getSetting<T>(key: string, defaultValue: T): Promise<T> {
    const now = Date.now();
    if (this.cache[key] && this.cache[key].expiresAt > now) {
      return this.cache[key].value;
    }

    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("system_settings").select("value").eq("key", key).single();
      
      if (!error && data) {
         this.cache[key] = { value: data.value, expiresAt: now + this.TTL };
         return data.value as T;
      }
    } catch (e) {
      console.error(`Failed to fetch setting ${key}`, e);
    }

    return defaultValue;
  }

  static async getAllSettings(): Promise<Record<string, any>> {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase.from("system_settings").select("*");
      if (!error && data) {
        const result: Record<string, any> = {};
        data.forEach(row => { result[row.key] = row.value; });
        return result;
      }
    } catch (e) {
      console.error(`Failed to fetch all settings`, e);
    }
    return {};
  }

  static async invalidate(key: string) {
    delete this.cache[key];
  }

  static async invalidateAll() {
    this.cache = {};
  }
}
