import { createClient } from "@/lib/supabase/server";
import { GenericCRUDEngine, CRUDConfig } from "@/components/admin/crud-engine";
import { ProductRegistry } from "@/engines/registry/product-registry";
import { notFound } from "next/navigation";

export default async function AdminProductsPage({ searchParams }: { searchParams: { type?: string } }) {
  const type = searchParams.type;
  if (!type) return notFound();

  const product = ProductRegistry.getProduct(type as any);
  if (!product) return notFound();

  const supabase = await createClient();
  // Filter courses by the specific product type
  const { data: items } = await supabase
    .from("courses")
    .select("*")
    .eq("course_type", type)
    .order("created_at", { ascending: false });

  const config: CRUDConfig = {
    entityName: product.name,
    tableName: "courses",
    columns: [
      { key: "title", title: "Title", type: "text" },
      { key: "slug", title: "Slug", type: "text" },
      { key: "price", title: "Price", type: "number" },
      { key: "is_published", title: "Published", type: "boolean" }
    ],
    actions: { create: true, edit: true, delete: true },
    customEditRoute: (id) => `/admin/courses/${id}` // Reusing existing course editor for all products!
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Manage {product.name}</h2>
      <GenericCRUDEngine config={config} data={items || []} />
    </div>
  );
}
