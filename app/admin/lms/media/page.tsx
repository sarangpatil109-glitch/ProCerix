import { createAdminClient } from "@/lib/supabase/admin";
import { MediaLibrary } from "@/components/admin/lms/media-library";

export default async function LmsMediaPage() {
  const sdb = createAdminClient();
  const db = sdb as any;

  const { data: media } = await db
    .from("media_library")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Media Library</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Upload, search, replace and manage images, PDFs, icons and banners</p>
      </div>
      <MediaLibrary initialMedia={media || []} />
    </div>
  );
}
