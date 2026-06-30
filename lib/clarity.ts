declare global {
  interface Window {
    clarity: (command: string, ...args: unknown[]) => void;
  }
}

function clr(command: string, ...args: unknown[]): void {
  if (typeof window === "undefined" || typeof window.clarity !== "function") return;
  try {
    window.clarity(command, ...args);
  } catch { /* never crash the app */ }
}

export function identifyUser(
  userId: string,
  friendlyName?: string,
  tags?: Record<string, string>
): void {
  clr("identify", userId, undefined, undefined, friendlyName);
  if (tags) {
    for (const [key, value] of Object.entries(tags)) {
      clr("set", key, value);
    }
  }
}

export function setTag(key: string, value: string | string[]): void {
  clr("set", key, value);
}

export function trackEvent(event: string): void {
  clr("event", event);
}

export function upgradeSession(reason: string): void {
  clr("upgrade", reason);
}

export function trackApiError(endpoint: string, statusCode: number): void {
  clr("event", "api_error");
  clr("set", "api_error_endpoint", endpoint);
  clr("set", "api_error_code", String(statusCode));
}

export function initWebVitals(): void {
  if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;

  try {
    new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (!entries.length) return;
      const lcp = entries[entries.length - 1];
      clr("set", "lcp_ms", String(Math.round(lcp.startTime)));
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch { /* unsupported */ }

  try {
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          clr("set", "fcp_ms", String(Math.round(entry.startTime)));
        }
      }
    }).observe({ type: "paint", buffered: true });
  } catch { /* unsupported */ }

  try {
    let lastLongTaskEnd = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const end = entry.startTime + entry.duration;
        if (end > lastLongTaskEnd) lastLongTaskEnd = end;
      }
    }).observe({ type: "longtask", buffered: true });

    const reportTTI = () => {
      const tti = lastLongTaskEnd > 0 ? lastLongTaskEnd : performance.now();
      clr("set", "tti_ms", String(Math.round(tti)));
    };

    const w = window as Window & { requestIdleCallback?: (cb: () => void) => void };
    if (typeof w.requestIdleCallback === "function") {
      w.requestIdleCallback(reportTTI);
    } else {
      setTimeout(reportTTI, 1000);
    }
  } catch { /* unsupported */ }
}
