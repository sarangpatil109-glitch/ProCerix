import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase";
import { CourseFilter } from "./types";

export function buildCourseQuery(client: SupabaseClient<Database>, filter?: CourseFilter) {
  // Courses table holds certificates only; exclude any legacy internship rows
  let query = client.from("courses").select("*").neq("course_type", "internship");

  if (filter?.status) {
    if (filter.status === "published") {
      query = query.eq("is_published", true).is("deleted_at", null);
    } else if (filter.status === "draft") {
      query = query.eq("is_published", false).is("deleted_at", null);
    } else if (filter.status === "archived") {
      query = query.not("deleted_at", "is", null);
    }
  } else {
    // Default to active courses
    query = query.is("deleted_at", null);
  }

  if (filter?.difficulty) {
    query = query.eq("difficulty", filter.difficulty);
  }

  if (filter?.category) {
    query = query.eq("category", filter.category);
  }

  if (filter?.courseType) {
    query = query.eq("course_type", filter.courseType);
  }

  if (filter?.isFree !== undefined) {
    if (filter.isFree) {
      query = query.eq("price", 0);
    } else {
      query = query.gt("price", 0);
    }
  }

  if (filter?.minDuration !== undefined) {
    query = query.gte("duration_minutes", filter.minDuration);
  }

  if (filter?.maxDuration !== undefined) {
    query = query.lte("duration_minutes", filter.maxDuration);
  }

  if (filter?.search) {
    // Use Postgres Full-Text Search
    query = query.textSearch("fts", filter.search, { type: "websearch" });
  }

  if (filter?.sort) {
    if (filter.sort === "newest") {
      query = query.order("created_at", { ascending: false });
    } else if (filter.sort === "alphabetical") {
      query = query.order("title", { ascending: true });
    }
    // Note: popular sorting would require joining with enrollments, we default to newest for now
  } else {
    query = query.order("created_at", { ascending: false });
  }

  if (filter?.limit) {
    query = query.limit(filter.limit);
  }

  if (filter?.offset) {
    query = query.range(filter.offset, filter.offset + (filter.limit || 10) - 1);
  }

  return query;
}
