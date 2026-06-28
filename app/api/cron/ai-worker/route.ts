import { NextResponse } from "next/server";
import { AIPipelineService } from "@/services/ai-pipeline-service";

/**
 * Endpoint for cron jobs to trigger AI generation processing.
 * Protected by a secret key in production.
 */
export async function GET(request: Request) {
  // In production, verify authorization header or API key
  const authHeader = request.headers.get("authorization");
  if (process.env.NODE_ENV === "production" && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await AIPipelineService.processQueue();
    return NextResponse.json({ success: true, processed: result.processed });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
