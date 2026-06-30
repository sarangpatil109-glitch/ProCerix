# Microsoft Clarity Integration

## Setup

Set the environment variable in `.env.local`:

```
NEXT_PUBLIC_CLARITY_PROJECT_ID=your_project_id_here
```

If this variable is not set, Clarity will not load and no events will be sent.
The rest of the app continues to work normally — Clarity is fully optional.

---

## How to change the Project ID

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com) → your project → Settings → Overview.
2. Copy the Project ID (alphanumeric string, e.g. `abc123xyz`).
3. Update `NEXT_PUBLIC_CLARITY_PROJECT_ID` in your Vercel environment variables.
4. Redeploy.

No code changes required — the Project ID is read entirely from the environment variable.

---

## Custom Events

Custom events are pushed via `window.clarity("event", eventName)`. The helper in `lib/clarity.ts` wraps this safely.

### Events fired automatically

| Event | Where triggered |
|---|---|
| `search` | User searches on the Search page |
| `course_view` | Course detail page viewed |
| `internship_view` | Internship detail page viewed |
| `generate_course_ai` | User clicks "Generate Course with AI" button |
| `generate_internship_ai` | User clicks "Generate Internship with AI" button |
| `ai_course_generated` | AI course generation completes successfully |
| `ai_internship_generated` | AI internship generation completes successfully |
| `certificate_download` | User downloads a certificate from dashboard |
| `whatsapp_click` | User clicks the floating WhatsApp button |
| `login` | User successfully logs in |
| `signup` | User successfully creates an account |
| `checkout` | User initiates checkout (course or internship) |
| `purchase` | Payment succeeds (checkout/success page) |
| `payment_failed` | Payment error page reached |
| `profile_updated` | User clicks Save on the profile form |
| `certificate_verified` | A certificate verification page is viewed |
| `api_error` | A payment API call returns a non-2xx status |

### Firing a custom event manually

```typescript
import { trackEvent } from "@/lib/clarity";

trackEvent("your_event_name");
```

### Setting a custom tag (segment / attribute)

```typescript
import { setTag } from "@/lib/clarity";

setTag("plan", "pro");
setTag("country", "IN");
```

### Identifying a user

```typescript
import { identifyUser } from "@/lib/clarity";

// userId: string (required)
// friendlyName: string (optional — shown in Clarity dashboard)
// tags: Record<string, string> (optional — extra attributes)
identifyUser("user-uuid-here", "user@example.com", { role: "admin" });
```

User identification happens automatically on page load when the user is logged in.
Clarity receives: User ID, email (as friendly name), role, and membership — never passwords or tokens.

### Upgrading a session

Session upgrade increases recording priority in Clarity (useful for high-value moments):

```typescript
import { upgradeSession } from "@/lib/clarity";

upgradeSession("Purchased Course");
```

Session upgrade fires automatically on successful purchase.

### Tracking API errors

```typescript
import { trackApiError } from "@/lib/clarity";

trackApiError("/api/payments/create-order", 500);
```

This fires `api_error` event and sets `api_error_endpoint` + `api_error_code` tags.

---

## Web Vitals

Clarity automatically receives:

| Tag | Metric |
|---|---|
| `lcp_ms` | Largest Contentful Paint (ms) |
| `fcp_ms` | First Contentful Paint (ms) |
| `tti_ms` | Time To Interactive proxy (ms, via Long Tasks API) |

These are set once on initial page load via PerformanceObserver. They appear as custom tags in Clarity's session filter and segment views.

---

## Route Tracking

Clarity tracks the initial page load automatically. For client-side navigation (Next.js App Router), each route change updates the `page_path` custom tag so Clarity records know which page the session was on.

---

## How to Disable Clarity

**Per-environment**: Remove or leave blank `NEXT_PUBLIC_CLARITY_PROJECT_ID`. Clarity will not load.

**Per-user (GDPR / consent)**: Before loading Clarity, check for consent. The `ClarityInit` component returns `null` when the Project ID is empty, so you can conditionally set the env var or modify `ClarityInit` to gate on a consent cookie.

Example consent gate in `ClarityInit.tsx`:

```tsx
// Add this check inside ClarityInit before rendering the Script tag:
if (!hasUserConsented()) return null;
```

---

## Files

| File | Purpose |
|---|---|
| `lib/clarity.ts` | Core helpers: `identifyUser`, `setTag`, `trackEvent`, `upgradeSession`, `trackApiError`, `initWebVitals` |
| `components/clarity/ClarityInit.tsx` | Script loader + route tracker + user identifier |
| `components/clarity/ClarityFire.tsx` | Drop-in client component for firing events from server pages |
| `components/dashboard/ProfileSaveButton.tsx` | Profile save button with `profile_updated` event |
