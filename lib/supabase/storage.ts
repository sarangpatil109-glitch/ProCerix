import { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/utils/errors";

export async function uploadFile(
  client: SupabaseClient,
  bucket: string,
  path: string,
  file: File | Blob
) {
  const { data, error } = await client.storage.from(bucket).upload(path, file, {
    upsert: true,
  });

  if (error) throw new AppError(`Storage upload failed: ${error.message}`, 500);
  return data;
}

export function getPublicUrl(client: SupabaseClient, bucket: string, path: string) {
  const { data } = client.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

export async function removeFile(client: SupabaseClient, bucket: string, paths: string[]) {
  const { data, error } = await client.storage.from(bucket).remove(paths);
  
  if (error) throw new AppError(`Storage deletion failed: ${error.message}`, 500);
  return data;
}
