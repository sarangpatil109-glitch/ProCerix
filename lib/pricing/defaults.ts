/**
 * Canonical default pricing for every course/internship type.
 *
 * This is the SINGLE SOURCE OF TRUTH.  All creation paths (admin CRUD,
 * AI generation, seed scripts, payment webhooks) must call `getDefaultPricing`
 * and spread the result into their insert/upsert payload so that pricing
 * is ALWAYS correct, regardless of what the AI or caller supplied.
 *
 * Rules:
 *   certificate / certificates → price: 99,  original_price: 999
 *   internship                 → price: 249, original_price: 2499
 */

export const PRICING = {
  certificate: { price: 99,  original_price: 999  },
  internship:  { price: 249, original_price: 2499 },
} as const;

export type CoursePricing = { price: number; original_price: number };

/**
 * Returns the canonical pricing for a given course_type string.
 * Handles "certificate", "certificates", "internship" and unknown values
 * (defaults to certificate pricing).
 */
export function getDefaultPricing(courseType?: string | null): CoursePricing {
  if ((courseType ?? "").toLowerCase().includes("internship")) {
    return PRICING.internship;
  }
  return PRICING.certificate;
}

/**
 * Merges canonical pricing into an insert/upsert payload.
 * Any price / original_price already in the payload is OVERRIDDEN.
 *
 * Usage:
 *   supabase.from("courses").insert(withDefaultPricing({ title, slug, ... }, courseType))
 */
export function withDefaultPricing<T extends Record<string, unknown>>(
  payload: T,
  courseType?: string | null,
): T & CoursePricing {
  const type = courseType ?? (payload.course_type as string | undefined);
  return { ...payload, ...getDefaultPricing(type) };
}
