import { createClient } from "@/lib/supabase/server";
import { BannerBuilder } from "@/components/admin/banner-builder";

export default async function AdminBanners() {
  const supabase = await createClient();
  const { data: banners } = await supabase.from("banners").select("*").order("priority", { ascending: true });

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <BannerBuilder initialBanners={banners || []} />
    </div>
  );
}
