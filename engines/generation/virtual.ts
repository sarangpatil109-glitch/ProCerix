import { generateCourseSlug } from "@/engines/course/utils";

export function generateVirtualCourse(query: string, existingSlug?: string) {
  // Deterministic formatting
  const normalizedQuery = query.trim().split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
  
  return {
    id: `virtual-${Date.now()}`,
    title: `${normalizedQuery} Masterclass`,
    slug: existingSlug || generateCourseSlug(normalizedQuery),
    description: `Master ${normalizedQuery} with our comprehensive, industry-aligned course. Learn the latest techniques, build real-world projects, and accelerate your career.`,
    difficulty: "beginner",
    price: 49.99,
    is_published: true,
    course_type: "certificate",
    category: normalizedQuery,
    duration_minutes: 120, // 2 hours estimated baseline
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    deleted_at: null,
    is_virtual: true // Internal flag, UI handles it identically
  };
}

export function generateVirtualCourseFromSlug(slug: string) {
  // Extract readable query from slug (ignoring generated suffixes)
  const baseSlug = slug.replace(/-[a-z0-9]{6}$/, "");
  const query = baseSlug.split('-').join(' ');
  return generateVirtualCourse(query, slug);
}

export function generateVirtualCurriculum(courseTitle: string) {
  const baseTitle = courseTitle.replace(" Masterclass", "");
  return [
    {
      id: "mod-1",
      title: `Introduction to ${baseTitle}`,
      description: `Core concepts and fundamentals of ${baseTitle}.`,
      sequence_order: 1,
      lessons: [
        { id: "les-1", title: "Getting Started", sequence_order: 1, video_url: "mock" },
        { id: "les-2", title: "Key Principles", sequence_order: 2, video_url: null }
      ]
    },
    {
      id: "mod-2",
      title: `Advanced ${baseTitle} Techniques`,
      description: `Deep dive into complex scenarios and best practices.`,
      sequence_order: 2,
      lessons: [
        { id: "les-3", title: "Real-world Applications", sequence_order: 1, video_url: "mock" },
        { id: "les-4", title: "Optimization & Best Practices", sequence_order: 2, video_url: null }
      ]
    },
    {
      id: "mod-3",
      title: "Final Project & Certification",
      description: "Apply your knowledge and earn your certificate.",
      sequence_order: 3,
      lessons: [
        { id: "les-5", title: "Project Brief", sequence_order: 1, video_url: null },
        { id: "les-6", title: "Certification Assessment", sequence_order: 2, video_url: null }
      ]
    }
  ];
}
