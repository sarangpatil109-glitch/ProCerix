"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { certificateSettingsSchema } from "@/validators/admin";
import { z } from "zod";
import { updateCertificateSettings } from "@/actions/admin/settings";

type FormData = z.infer<typeof certificateSettingsSchema>;

export function CertificateSettingsForm({ initialData }: { initialData: Partial<FormData> }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string } | null>(null);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(certificateSettingsSchema),
    defaultValues: {
      prefix: initialData?.prefix || "PROCERIX",
      logo_url: initialData?.logo_url || "",
      signature_url: initialData?.signature_url || "",
      background_url: initialData?.background_url || "",
      qr_enabled: initialData?.qr_enabled ?? true,
    }
  });

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    setMessage(null);
    
    const res = await updateCertificateSettings(data);
    
    setIsSubmitting(false);
    
    if (res.error) {
      setMessage({ type: "error", text: res.error });
    } else {
      setMessage({ type: "success", text: "Certificate settings updated successfully" });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
      {message && (
        <div className={`p-4 rounded-xl text-sm font-medium ${message.type === "error" ? "bg-red-50 text-red-700" : "bg-green-50 text-green-700"}`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Certificate ID Prefix</label>
          <input
            {...register("prefix")}
            className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
            placeholder="PROCERIX"
          />
        </div>

        <div className="space-y-2 flex flex-col justify-center">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input type="checkbox" {...register("qr_enabled")} className="sr-only" />
              <div className="block bg-gray-200 dark:bg-gray-800 w-12 h-6 rounded-full transition-colors peer-checked:bg-blue-600"></div>
              <div className="dot absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform"></div>
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">Enable QR Code Validation</span>
          </label>
          <style jsx>{`
            input:checked ~ .dot {
              transform: translateX(24px);
            }
            input:checked ~ .block {
              background-color: #2563eb;
            }
          `}</style>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Logo Image URL</label>
        <input
          {...register("logo_url")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Signature Image URL</label>
        <input
          {...register("signature_url")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-bold text-gray-700 dark:text-gray-300">Background Image URL</label>
        <input
          {...register("background_url")}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="https://..."
        />
      </div>

      <div className="flex justify-end pt-6 border-t border-gray-200 dark:border-gray-800">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-all disabled:opacity-50"
        >
          {isSubmitting ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}
