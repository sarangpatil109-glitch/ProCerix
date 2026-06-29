"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { homepageSectionsSchema } from "@/validators/admin";
import { z } from "zod";
import { updateHomepageSections } from "@/actions/admin/settings";
import { SortableJSONList } from "../sortable-list";
import { toast } from "sonner";
import { LayoutTemplate, AlignLeft, ArrowRight, HelpCircle, Star, Target } from "lucide-react";

type FormData = z.infer<typeof homepageSectionsSchema>;

export function HomepageForm({ initialData }: { initialData: Partial<FormData> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, control, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(homepageSectionsSchema),
    defaultValues: {
      hero_title: initialData?.hero_title || "",
      hero_subtitle: initialData?.hero_subtitle || "",
      hero_image: initialData?.hero_image || "",
      hero_cta: initialData?.hero_cta || "",
      stats: initialData?.stats || [],
      features: initialData?.features || [],
      testimonials: initialData?.testimonials || [],
      faq: initialData?.faq || [],
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Saving homepage sections...");
    
    // In our validator, they are marked as 'any' so we can pass the array directly now.
    const res = await updateHomepageSections(data);
    
    setIsSubmitting(false);
    
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Homepage updated successfully", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-sans">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <LayoutTemplate className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Hero Section</h3>
            </div>
            
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hero Title</label>
                  <input
                    {...register("hero_title")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hero CTA Button Text</label>
                  <input
                    {...register("hero_cta")}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hero Subtitle</label>
                <textarea
                  {...register("hero_subtitle")}
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 h-24 resize-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Hero Image URL</label>
                <input
                  {...register("hero_image")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <Target className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Features & Stats</h3>
            </div>
            
            <div className="space-y-12">
              <Controller
                control={control}
                name="stats"
                render={({ field }) => (
                  <SortableJSONList 
                    title="Platform Statistics"
                    value={field.value} 
                    onChange={field.onChange} 
                    schema={[
                      { key: "label", label: "Label (e.g. Active Users)" },
                      { key: "value", label: "Value (e.g. 10k+)" }
                    ]} 
                  />
                )}
              />

              <div className="h-px bg-gray-100 dark:bg-gray-800/60 w-full" />

              <Controller
                control={control}
                name="features"
                render={({ field }) => (
                  <SortableJSONList 
                    title="Key Features"
                    value={field.value} 
                    onChange={field.onChange} 
                    schema={[
                      { key: "title", label: "Feature Title" },
                      { key: "description", label: "Description" },
                      { key: "icon", label: "Icon Name (lucide-react)" }
                    ]} 
                  />
                )}
              />
            </div>
          </div>

        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <Star className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Social Proof</h3>
            </div>
            
            <Controller
              control={control}
              name="testimonials"
              render={({ field }) => (
                <SortableJSONList 
                  title="Testimonials"
                  value={field.value} 
                  onChange={field.onChange} 
                  schema={[
                    { key: "quote", label: "Quote text" },
                    { key: "author", label: "Author Name" },
                    { key: "role", label: "Author Role/Company" }
                  ]} 
                />
              )}
            />
          </div>

          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">FAQ Section</h3>
            </div>
            
            <Controller
              control={control}
              name="faq"
              render={({ field }) => (
                <SortableJSONList 
                  title="Frequently Asked Questions"
                  value={field.value} 
                  onChange={field.onChange} 
                  schema={[
                    { key: "question", label: "Question" },
                    { key: "answer", label: "Answer" }
                  ]} 
                />
              )}
            />
          </div>

          <div className="sticky top-8">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold py-3 px-4 rounded-xl transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? "Saving..." : (
                <>Publish Changes <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
