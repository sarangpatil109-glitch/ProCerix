import { Metadata } from "next";
import { FAQAccordion } from "@/components/faq/FAQAccordion";
import { JsonLd } from "@/components/seo/JsonLd";
import { faqSchema } from "@/lib/seo";
import { APP_CONFIG } from "@/constants";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";

const faqs = [
  { q: "How does the AI Generation work?", a: "When you search for a skill we don't have, our AI generation pipeline instantly starts building a structured course just for you. It writes lessons, creates MCQs, and outlines tasks using advanced LLMs with strict pedagogical schemas." },
  { q: "Are the certificates verifiable?", a: "Yes. Every certificate comes with a unique cryptographic credential ID and a QR code linking to a lifetime public verification page on our domain." },
  { q: "What is a Virtual Internship?", a: "Unlike standard courses, Virtual Internships include practical capstone tasks and provide an Experience Letter alongside your skill certificate upon completion." },
  { q: "Do I need a subscription?", a: "No. ProCerix operates on a pay-per-skill model. You only pay a one-time fee for the specific certificate or internship you want to pursue." },
  { q: "How long do I have access to the course?", a: "Once enrolled, you have lifetime access to the learning materials and the learning player for that specific course." },
];

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers to common questions about ProCerix — AI certification, virtual internships, verifiable credentials, and billing.",
  keywords: ["FAQ", "ProCerix", "AI certification questions", "virtual internship", "certificate verification"],
  alternates: { canonical: "/faq" },
  openGraph: {
    title: `FAQ | ${APP_CONFIG.name}`,
    description: "Frequently asked questions about ProCerix AI certifications and virtual internships.",
    url: `${BASE_URL}/faq`,
    siteName: APP_CONFIG.name,
    images: [{ url: "/branding/logo.png", width: 1200, height: 630, alt: APP_CONFIG.name }],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `FAQ | ${APP_CONFIG.name}`,
    description: "Frequently asked questions about ProCerix AI certifications and virtual internships.",
    images: ["/branding/logo.png"],
  },
};

export default function FAQPage() {
  return (
    <div className="py-24 px-6 bg-[#FAFAFA] dark:bg-black min-h-[80vh]">
      <JsonLd data={faqSchema(faqs)} />
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-gray-500 dark:text-gray-400">
            Everything you need to know about the product and billing.
          </p>
        </div>
        <FAQAccordion faqs={faqs} />
      </div>
    </div>
  );
}
