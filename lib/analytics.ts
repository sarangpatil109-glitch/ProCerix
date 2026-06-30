declare global {
  interface Window {
    dataLayer: Record<string, unknown>[];
  }
}

function push(obj: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push(obj);
}

export function pageView(pathname: string): void {
  push({
    event: "page_view",
    page_path: pathname,
    page_location: typeof window !== "undefined" ? window.location.href : pathname,
  });
}

export function analyticsSearch(searchTerm: string): void {
  push({ event: "search", search_term: searchTerm });
}

export function analyticsViewItem(params: {
  item_name: string;
  item_category?: string;
  item_type?: string;
  price?: number;
}): void {
  push({
    event: "view_item",
    ecommerce: {
      items: [
        {
          item_name: params.item_name,
          item_category: params.item_category,
          item_variant: params.item_type,
          price: params.price,
          quantity: 1,
        },
      ],
    },
  });
}

export function analyticsLogin(): void {
  push({ event: "login", method: "Email" });
}

export function analyticsSignUp(): void {
  push({ event: "sign_up", method: "Email" });
}

export function analyticsGenerateCourse(courseName: string): void {
  push({ event: "generate_course", course_name: courseName });
}

export function analyticsGenerateInternship(internshipName: string): void {
  push({ event: "generate_internship", internship_name: internshipName });
}

export function analyticsBeginCheckout(params: {
  value: number;
  currency: string;
  item_name?: string;
}): void {
  push({
    event: "begin_checkout",
    ecommerce: {
      currency: params.currency,
      value: params.value,
      items: params.item_name
        ? [{ item_name: params.item_name, price: params.value, quantity: 1 }]
        : [],
    },
  });
}

export function analyticsPurchase(params: {
  transaction_id?: string;
  value: number;
  currency: string;
  item_name?: string;
  item_ids?: string[];
}): void {
  push({
    event: "purchase",
    ecommerce: {
      transaction_id: params.transaction_id ?? `txn_${Date.now()}`,
      value: params.value,
      currency: params.currency,
      items: params.item_name
        ? [
            {
              item_name: params.item_name,
              item_id: params.item_ids?.[0],
              price: params.value,
              quantity: 1,
            },
          ]
        : [],
    },
  });
}

export function analyticsDownloadCertificate(courseName?: string): void {
  push({ event: "download_certificate", item_name: courseName });
}

export function analyticsGenerateLead(method = "WhatsApp"): void {
  push({ event: "generate_lead", method });
}

export function analyticsPageNotFound(path: string): void {
  push({ event: "page_not_found", page_path: path });
}

export function analyticsServerError(statusCode: number, message?: string): void {
  push({ event: "server_error", error_code: statusCode, error_message: message });
}

export function analyticsOutboundLink(url: string): void {
  push({ event: "outbound_link_click", link_url: url });
}
