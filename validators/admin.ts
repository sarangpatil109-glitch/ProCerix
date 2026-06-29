import { z } from "zod";

export const siteSettingsSchema = z.object({
  site_name: z.string().min(1, "Site name is required"),
  logo: z.string().optional(),
  favicon: z.string().optional(),
  primary_color: z.string().optional(),
  secondary_color: z.string().optional(),
  contact_email: z.string().email("Invalid email").optional().or(z.literal("")),
  contact_phone: z.string().optional(),
  footer_text: z.string().optional(),
  facebook: z.string().url("Invalid URL").optional().or(z.literal("")),
  instagram: z.string().url("Invalid URL").optional().or(z.literal("")),
  linkedin: z.string().url("Invalid URL").optional().or(z.literal("")),
  youtube: z.string().url("Invalid URL").optional().or(z.literal("")),
});

export const homepageSectionsSchema = z.object({
  hero_title: z.string().optional(),
  hero_subtitle: z.string().optional(),
  hero_image: z.string().optional(),
  hero_cta: z.string().optional(),
  stats: z.any().optional(),
  features: z.any().optional(),
  testimonials: z.any().optional(),
  faq: z.any().optional(),
});

export const bannerSchema = z.object({
  title: z.string().min(1, "Title is required"),
  subtitle: z.string().optional(),
  button_text: z.string().optional(),
  image_url: z.string().optional(),
  link_url: z.string().url("Invalid URL").optional().or(z.literal("")),
  priority: z.coerce.number().int().default(0),
  is_published: z.boolean().default(false),
});

export const adminCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  course_type: z.string().min(1, "Course type is required"),
  description: z.string().optional(),
  difficulty: z.string().optional(),
  category: z.string().optional(),
  price: z.coerce.number().min(0).optional(),
  original_price: z.coerce.number().min(0).optional(),
  discount: z.coerce.number().min(0).max(100).optional(),
  thumbnail: z.string().optional(),
  duration: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
  tags: z.string().optional(), // We can parse this into an array on the server
});

export const couponSchema = z.object({
  code: z.string().min(1, "Code is required").toUpperCase(),
  discount_amount: z.coerce.number().min(0, "Must be positive"),
  is_percentage: z.boolean().default(false),
  expiry_date: z.string().optional().nullable(), // ISO Date string
  usage_limit: z.coerce.number().int().min(0).optional().nullable(),
  min_amount: z.coerce.number().min(0).default(0),
  is_active: z.boolean().default(true),
});

export const certificateSettingsSchema = z.object({
  prefix: z.string().optional(),
  logo_url: z.string().optional(),
  signature_url: z.string().optional(),
  background_url: z.string().optional(),
  qr_enabled: z.boolean().optional(),
});

export const postSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().optional(),
  excerpt: z.string().optional(),
  thumbnail: z.string().optional(),
  is_published: z.boolean().default(false),
});
