import { createClient } from "@/lib/supabase/server";
import { ProductRegistry, ProductType } from "@/engines/registry/product-registry";
import { notFound, redirect } from "next/navigation";
import { EnrollmentService } from "@/services/enrollment-service";

export default async function GenericDashboardProductPage({ params }: { params: { productType: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const product = ProductRegistry.getProduct(params.productType as ProductType);
  if (!product) notFound();

  const enrollments = await EnrollmentService.getUserEnrollments(user.id);
  const userHasAccess = enrollments.some((e: any) => e.courses?.course_type === product.id);

  if (!userHasAccess) {
    return (
      <div className="text-center py-24 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h2>
        <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
          You haven't purchased access to {product.name} yet.
        </p>
        <a href={product.routes.marketing} className="px-6 py-3 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-colors">
          View Product
        </a>
      </div>
    );
  }

  const Icon = product.icon;

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <div className="p-4 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
          <Icon className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{product.name}</h1>
          <p className="text-gray-500 dark:text-gray-400">Welcome to your workspace.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Product Interface Loading...</h2>
        <p className="text-gray-600 dark:text-gray-400">
          This product is dynamically resolved through the ProCerix Multi-Product architecture. 
          The core interface and capabilities for {product.name} will be injected here.
        </p>
      </div>
    </div>
  );
}
