import { redirect } from "next/navigation";

// Old route - redirect to canonical content-audit route
export default function LmsAuditRedirectPage() {
  redirect("/admin/lms/content-audit");
}
