import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function BlogCMSPage() {
  const supabase = await createClient();
  const { data: posts } = await supabase.from("posts").select("*").order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Post",
    tableName: "posts",
    columns: [
      { key: "title", title: "Title", type: "text" },
      { key: "slug", title: "Slug", type: "text" },
      { key: "excerpt", title: "Excerpt", type: "text" },
      { key: "content", title: "Content", type: "richtext" },
      { key: "thumbnail", title: "Thumbnail URL", type: "text" },
      { key: "is_published", title: "Published", type: "boolean" }
    ],
    actions: { create: true, edit: true, delete: true },
    primaryKey: "id"
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Blog CMS</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage blog posts and articles.</p>
      </div>
      <GenericCRUDEngine config={config} data={posts || []} />
    </div>
  );
}
