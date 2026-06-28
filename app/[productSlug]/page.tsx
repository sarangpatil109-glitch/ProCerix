import { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { ProductRegistry } from "@/engines/registry/product-registry";
import { createClient } from "@/lib/supabase/server";
import { CourseStickyCard } from "@/components/course/course-sticky-card";

export async function generateMetadata(props: { params: Promise<{ productSlug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const product = ProductRegistry.getProductBySlug(params.productSlug);
  if (!product) return { title: "Not Found" };
  
  return {
    title: `${product.name} | ProCerix`,
    description: `Discover ${product.name} with ${product.features.join(", ")}`,
  };
}

export default async function ProductLandingPage(props: { params: Promise<{ productSlug: string }> }) {
  const params = await props.params;
  const product = ProductRegistry.getProductBySlug(params.productSlug);
  if (!product) notFound();

  // If this product belongs to an actual route that exists (like certificates/internships handled natively), 
  // maybe we shouldn't catch it here. But for now, we render a generic landing page!
  
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Mock a course object for the CourseStickyCard
  const mockCourse = {
    title: product.name,
    slug: product.slug,
    description: `Access ${product.name} and enhance your career with ${product.features.join(" and ")}.`,
    price: product.defaultPrice,
    isVirtualProduct: true,
    course_type: product.id
  };

  const Icon = product.icon;

  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-black selection:bg-blue-500/30">
      {/* Hero Section */}
      <div className="bg-white dark:bg-gray-900/30 border-b border-gray-100 dark:border-gray-900 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-900/10 dark:to-transparent pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center justify-center p-3 bg-blue-100 dark:bg-blue-900/30 rounded-2xl text-blue-600 dark:text-blue-400">
              <Icon className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {product.name}
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 leading-relaxed">
              Unlock the power of our premium {product.name}. Built to accelerate your career growth with industry-leading features.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-12">
            <section className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">What's included</h2>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {product.features.map((feature, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 mt-0.5">
                      ✓
                    </div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{feature}</span>
                  </li>
                ))}
              </ul>
            </section>
            
            <section className="bg-white dark:bg-gray-900/40 border border-gray-200 dark:border-gray-800 rounded-3xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About this product</h2>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                This product is part of the ProCerix suite of tools designed to help you succeed in your professional journey.
                With a focus on quality and outcomes, our {product.name} is the perfect addition to your career toolkit.
              </p>
            </section>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <CourseStickyCard course={mockCourse as any} userId={user?.id} email={user?.email} />
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
