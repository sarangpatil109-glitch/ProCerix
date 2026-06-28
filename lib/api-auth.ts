import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

export async function validateApiKey(request: NextRequest) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Missing or invalid Authorization header", status: 401 };
  }

  const token = authHeader.split(" ")[1];
  const hash = crypto.createHash("sha256").update(token).digest("hex");

  const supabase = await createClient();
  const { data: apiKey, error } = await supabase
    .from("api_keys")
    .select("id, user_id, scopes, is_active")
    .eq("key_hash", hash)
    .single();

  if (error || !apiKey) {
    return { error: "Invalid API Key", status: 401 };
  }

  if (!apiKey.is_active) {
    return { error: "API Key is inactive", status: 403 };
  }

  // Update last used asynchronously
  supabase.from("api_keys").update({ last_used_at: new Date().toISOString() as any }).eq("id", apiKey.id).then();

  return { apiKey };
}

export async function logApiAudit(
  apiKeyId: string | null, 
  userId: string | null, 
  request: NextRequest, 
  statusCode: number
) {
  const supabase = await createClient();
  await supabase.from("api_audit_logs").insert({
    api_key_id: apiKeyId,
    user_id: userId,
    endpoint: request.nextUrl.pathname,
    method: request.method,
    status_code: statusCode,
    ip_address: request.headers.get("x-forwarded-for") || request.ip || "unknown"
  } as any);
}

// Simple in-memory rate limiter for demo purposes
// In production, this would use Redis
const rateLimits = new Map<string, { count: number; resetAt: number }>();

export function checkRateLimit(ip: string, limit: number = 100, windowMs: number = 60000) {
  const now = Date.now();
  const record = rateLimits.get(ip);
  
  if (!record || record.resetAt < now) {
    rateLimits.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetAt: now + windowMs };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: record.resetAt };
  }

  record.count++;
  rateLimits.set(ip, record);
  return { allowed: true, remaining: limit - record.count, resetAt: record.resetAt };
}

export function withApiAuth(handler: (req: NextRequest, ctx: any, auth: any) => Promise<NextResponse>) {
  return async (req: NextRequest, ctx: any) => {
    // 1. Rate Limiting
    const ip = req.headers.get("x-forwarded-for") || req.ip || "unknown";
    const rl = checkRateLimit(ip, 100, 60000); // 100 reqs per minute
    
    if (!rl.allowed) {
      return NextResponse.json(
        { error: "Too Many Requests", resetAt: rl.resetAt },
        { status: 429, headers: { 'X-RateLimit-Reset': rl.resetAt.toString() } }
      );
    }

    // 2. Authentication
    const authResult = await validateApiKey(req);
    if (authResult.error) {
      await logApiAudit(null, null, req, authResult.status);
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    // 3. Execution & Logging
    try {
      const response = await handler(req, ctx, authResult.apiKey);
      await logApiAudit(authResult.apiKey.id, authResult.apiKey.user_id, req, response.status);
      return response;
    } catch (error: any) {
      await logApiAudit(authResult.apiKey.id, authResult.apiKey.user_id, req, 500);
      return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
    }
  };
}
