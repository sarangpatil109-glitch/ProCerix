import { NextRequest, NextResponse } from "next/server";
import { sendCapiEvent } from "@/lib/meta-capi";

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const { event_name, event_id, event_time, params, user_data } = body as {
      event_name?: string;
      event_id?: string;
      event_time?: number;
      params?: Record<string, unknown>;
      user_data?: { em?: string; ph?: string; fbp?: string; fbc?: string };
    };

    if (!event_name || !event_id) {
      return NextResponse.json({ ok: false, error: "Missing event_name or event_id" }, { status: 400 });
    }

    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      request.headers.get("x-real-ip") ??
      undefined;
    const userAgent = request.headers.get("user-agent") ?? undefined;

    const fbp = request.cookies.get("_fbp")?.value ?? user_data?.fbp ?? undefined;
    const fbc = request.cookies.get("_fbc")?.value ?? user_data?.fbc ?? undefined;

    await sendCapiEvent({
      event_name,
      event_id,
      event_time,
      params,
      user_data: {
        em: user_data?.em,
        ph: user_data?.ph,
        client_ip_address: ip,
        client_user_agent: userAgent,
        fbp,
        fbc,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[CAPI] Route error:", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
