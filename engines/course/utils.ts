export function generateCourseSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "")
    + "-" + Math.random().toString(36).substring(2, 8);
}
