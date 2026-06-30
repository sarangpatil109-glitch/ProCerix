import { createHash } from "crypto";

const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? "1043828034994970";
const ACCESS_TOKEN = process.env.META_PIXEL_ACCESS_TOKEN ?? "";
const TEST_EVENT_CODE = process.env.META_TEST_EVENT_CODE;
const IS_DEV = process.env.NODE_ENV === "development";
const API_URL = `https://graph.facebook.com/v21.0/${PIXEL_ID}/events`;

function hash(value: string | undefined): string | undefined {
  if (!value) return undefined;
  return createHash("sha256").update(value.trim().toLowerCase()).digest("hex");
}

export interface CapiUserData {
  em?: string;
  ph?: string;
  client_ip_address?: string;
  client_user_agent?: string;
  fbp?: string;
  fbc?: string;
}

export interface CapiEventInput {
  event_name: string;
  event_id: string;
  event_time?: number;
  params?: Record<string, unknown>;
  user_data?: CapiUserData;
}

export async function sendCapiEvent(input: CapiEventInput): Promise<void> {
  if (!ACCESS_TOKEN) {
    if (IS_DEV) console.warn("[CAPI] META_PIXEL_ACCESS_TOKEN not set — skipping.");
    return;
  }

  const { event_name, event_id, event_time, params, user_data } = input;

  const rawUserData: Record<string, string | undefined> = {
    em: hash(user_data?.em),
    ph: hash(user_data?.ph),
    client_ip_address: user_data?.client_ip_address,
    client_user_agent: user_data?.client_user_agent,
    fbp: user_data?.fbp,
    fbc: user_data?.fbc,
  };

  const cleanUserData = Object.fromEntries(
    Object.entries(rawUserData).filter(([, v]) => v !== undefined && v !== "")
  );

  const event = {
    event_name,
    event_id,
    event_time: event_time ?? Math.floor(Date.now() / 1000),
    action_source: "website",
    user_data: cleanUserData,
    custom_data: params ?? {},
  };

  const body: Record<string, unknown> = { data: [event] };
  if (TEST_EVENT_CODE) body.test_event_code = TEST_EVENT_CODE;

  try {
    const res = await fetch(`${API_URL}?access_token=${ACCESS_TOKEN}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (IS_DEV) {
      const json = await res.json();
      console.log(`[CAPI] ${event_name} (id=${event_id}):`, json);
    }
  } catch (err) {
    console.error("[CAPI] Failed to send:", event_name, err);
  }
}
