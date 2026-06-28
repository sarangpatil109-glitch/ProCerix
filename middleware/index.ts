import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function handleMiddleware(request: NextRequest) {
  // Common middleware logic can be added here
  return NextResponse.next();
}
