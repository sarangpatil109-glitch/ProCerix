import { NewProductForm } from "@/components/admin/lms/new-product-form";

export default function NewProductPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Create New Product</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Start with the basics — you can fill in modules and content after creation.
        </p>
      </div>
      <NewProductForm />
    </div>
  );
}
