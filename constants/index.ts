export const APP_CONFIG = {
  name: "ProCerix",
  description: "ProCerix is an AI-powered certification and virtual internship platform. Search any skill, get certified instantly, and verify credentials for life.",
  url: "https://procerix.com",
} as const;

export const ROUTES = {
  HOME: "/",
} as const;

// WhatsApp support number — override with NEXT_PUBLIC_WHATSAPP_NUMBER env var
// Format: country code + number, no +, no spaces  e.g. "919876543210"
export const WHATSAPP_NUMBER =
  process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "919999999999";
