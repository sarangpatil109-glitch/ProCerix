"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { siteSettingsSchema } from "@/validators/admin";
import { z } from "zod";
import { updateSiteSettings } from "@/actions/admin/settings";
import { toast } from "sonner";
import { Image as ImageIcon, Link as LinkIcon, Mail, Phone, Palette, Type } from "lucide-react";

type FormData = z.infer<typeof siteSettingsSchema>;

export function SiteSettingsForm({ initialData }: { initialData: Partial<FormData> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(siteSettingsSchema),
    defaultValues: {
      site_name: initialData?.site_name || "ProCerix",
      logo: initialData?.logo || "",
      favicon: initialData?.favicon || "",
      primary_color: initialData?.primary_color || "#0f172a",
      secondary_color: initialData?.secondary_color || "#3b82f6",
      contact_email: initialData?.contact_email || "",
      contact_phone: initialData?.contact_phone || "",
      footer_text: initialData?.footer_text || "",
      facebook: initialData?.facebook || "",
      instagram: initialData?.instagram || "",
      linkedin: initialData?.linkedin || "",
      youtube: initialData?.youtube || "",
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const toastId = toast.loading("Saving site settings...");
    
    const res = await updateSiteSettings(data);
    
    setIsSubmitting(false);
    
    if (res.error) {
      toast.error(res.error, { id: toastId });
    } else {
      toast.success("Settings updated successfully", { id: toastId });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 font-sans">
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-8">
          
          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <Type className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Brand Identity</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Site Name</label>
                <input
                  {...register("site_name")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="ProCerix"
                />
                {errors.site_name && <p className="text-red-500 text-xs mt-1">{errors.site_name.message}</p>}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Footer Text</label>
                <input
                  {...register("footer_text")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="© 2026 ProCerix..."
                />
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <Palette className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Colors</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Primary Color</label>
                <div className="flex gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shrink-0">
                    <input
                      {...register("primary_color")}
                      type="color"
                      className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                    />
                  </div>
                  <input
                    {...register("primary_color")}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Secondary Color</label>
                <div className="flex gap-3">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 shrink-0">
                    <input
                      {...register("secondary_color")}
                      type="color"
                      className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                    />
                  </div>
                  <input
                    {...register("secondary_color")}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <ImageIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Media Assets</h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Logo URL</label>
                <input
                  {...register("logo")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="https://..."
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Favicon URL</label>
                <input
                  {...register("favicon")}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

        </div>

        <div className="space-y-8">
          <div className="bg-white dark:bg-[#161616] border border-gray-200 dark:border-gray-800/60 rounded-2xl p-6 shadow-sm sticky top-8">
            <div className="flex items-center gap-2 mb-6 border-b border-gray-100 dark:border-gray-800/60 pb-4">
              <LinkIcon className="w-5 h-5 text-gray-400" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">Contact & Socials</h3>
            </div>
            <div className="space-y-5">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("contact_email")}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="Email Address"
                />
              </div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  {...register("contact_phone")}
                  className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                  placeholder="Phone Number"
                />
              </div>
              
              <div className="pt-4 space-y-4">
                <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Social Links</h4>
                {["facebook", "instagram", "linkedin", "youtube"].map(platform => (
                  <input
                    key={platform}
                    {...register(platform as keyof FormData)}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1C1C1C] text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                    placeholder={`${platform.charAt(0).toUpperCase() + platform.slice(1)} URL`}
                  />
                ))}
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800/60">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 font-semibold py-2.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-50"
              >
                {isSubmitting ? "Saving..." : "Save Settings"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
