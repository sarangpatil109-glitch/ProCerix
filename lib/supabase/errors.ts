import { AuthError, PostgrestError } from "@supabase/supabase-js";
import { AppError } from "@/utils/errors";

export function handleSupabaseError(error: unknown): AppError {
  if (error instanceof AuthError) {
    return new AppError(`Authentication Error: ${error.message}`, error.status || 401);
  }
  
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    const pgError = error as PostgrestError;
    return new AppError(`Database Error: ${pgError.message}`, 500);
  }
  
  if (error instanceof Error) {
    return new AppError(error.message, 500);
  }

  return new AppError("An unknown Supabase error occurred", 500);
}
