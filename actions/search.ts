"use server";

import { SearchService } from "@/services/search-service";

export async function getSearchResults(searchParams: any) {
  try {
    const results = await SearchService.searchCourses(searchParams);
    return { success: true, data: results };
  } catch (error: any) {
    return { error: error.message };
  }
}
