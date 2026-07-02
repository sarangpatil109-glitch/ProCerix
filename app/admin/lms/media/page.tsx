import { createAdminClient } from "@/lib/supabase/admin";
import { MediaLibrary } from "@/components/admin/lms/media-library";

export default async function LmsMediaPage() {
  const db = createAdminClient();
  const { data: media } = await db
    .from("media_library")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6 h-full">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Media Library</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Images, PDFs, icons, banners and thumbnails</p>
      </div>
      <MediaLibrary initialMedia={media || []} />
    </div>
  );
}
