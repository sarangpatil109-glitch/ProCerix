import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";

export default async function CouponsCMSPage() {
  const supabase = await createClient();
  const { data: coupons } = await supabase.from("coupons").select("*").order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: "Coupon",
    tableName: "coupons",
    columns: [
      { key: "code", title: "Code", type: "text" },
      { key: "discount_amount", title: "Discount", type: "number" },
      { key: "is_percentage", title: "Is Percentage", type: "boolean" },
      { key: "min_amount", title: "Min Amount", type: "number" },
      { key: "usage_count", title: "Uses", type: "number" },
      { key: "usage_limit", title: "Limit", type: "number" },
      { key: "expiry_date", title: "Expiry", type: "text" },
      { key: "is_active", title: "Active", type: "boolean" }
    ],
    actions: { create: true, edit: true, delete: true },
    primaryKey: "id"
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      <div className="space-y-2">
        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">Coupon Manager</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-lg">Manage discount codes for ProCerix products.</p>
      </div>
      <GenericCRUDEngine config={config} data={coupons || []} />
    </div>
  );
}
