import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { env } from "@/validators/env";
import type { Database } from "@/types/supabase";
import { AppError } from "@/utils/errors";

export const createAdminClient = () => {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new AppError("SUPABASE_SERVICE_ROLE_KEY is not defined. Admin client cannot be initialized.", 500);
  }

  return createSupabaseClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
};
