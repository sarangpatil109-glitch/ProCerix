declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Window { fbq: (...args: any[]) => void; }
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function cookie(name: string): string | undefined {
  if (typeof document === "undefined") return undefined;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : undefined;
}

function capi(
  event_name: string,
  event_id: string,
  params?: Record<string, unknown>,
  user_data?: { em?: string; ph?: string }
): void {
  const fbc =
    cookie("_fbc") ??
    (typeof window !== "undefined"
      ? (new URLSearchParams(window.location.search).get("fbclid") ?? undefined)
      : undefined);

  fetch("/api/meta-capi", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event_name,
      event_id,
      event_time: Math.floor(Date.now() / 1000),
      params,
      user_data: { fbp: cookie("_fbp"), fbc, ...user_data },
    }),
  }).catch(() => {});
}

function track(
  event_name: string,
  params?: Record<string, unknown>,
  user_data?: { em?: string; ph?: string }
): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  const id = genId();
  window.fbq("track", event_name, params ?? {}, { eventID: id });
  capi(event_name, id, params, user_data);
}

export function pageView(): void {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  const id = genId();
  window.fbq("track", "PageView", {}, { eventID: id });
  capi("PageView", id);
}

export function search(searchString: string): void {
  track("Search", { search_string: searchString });
}

export function viewContent(params: {
  content_name: string;
  content_category?: string;
  content_type?: string;
}): void {
  track("ViewContent", params);
}

export function lead(params: { content_name: string }): void {
  track("Lead", params);
}

export function completeRegistration(userData?: { em?: string; ph?: string }): void {
  track("CompleteRegistration", {}, userData);
}

export function initiateCheckout(params: { value: number; currency: string }): void {
  track("InitiateCheckout", params);
}

export function purchase(params: {
  value: number;
  currency: string;
  content_name?: string;
  content_ids?: string[];
  content_type?: string;
}): void {
  track("Purchase", { content_type: "product", ...params });
}
