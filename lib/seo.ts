const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || "https://procerix.com";
const SITE_NAME = "ProCerix";
const OG_IMAGE = "/branding/logo.png";

export const SEO_DEFAULTS = {
  siteName: SITE_NAME,
  baseUrl: BASE_URL,
  ogImage: OG_IMAGE,
  locale: "en_US",
};

export function defaultOgImages() {
  return [{ url: OG_IMAGE, width: 1200, height: 630, alt: `${SITE_NAME} — AI Certification Platform` }];
}

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: BASE_URL,
    logo: `${BASE_URL}/branding/logo.png`,
    description:
      "ProCerix is an AI-powered certification and virtual internship platform. Search any skill, get certified instantly, and verify credentials for life.",
    sameAs: [],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${BASE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function courseSchema(params: {
  title: string;
  description?: string | null;
  slug: string;
  price?: number | null;
  category?: string | null;
}) {
  const desc =
    params.description ||
    `Learn ${params.title} with ProCerix AI-powered certification. Earn a verifiable credential.`;
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: params.title,
    description: desc,
    url: `${BASE_URL}/course/${params.slug}`,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: BASE_URL,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: "PT10H",
    },
    ...(params.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: String(params.price),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
            seller: { "@type": "Organization", name: SITE_NAME },
          },
        }
      : {}),
    ...(params.category ? { about: { "@type": "Thing", name: params.category } } : {}),
  };
}

export function internshipSchema(params: {
  title: string;
  description?: string | null;
  slug: string;
  price?: number | null;
  category?: string | null;
}) {
  const desc =
    params.description ||
    `Virtual internship program in ${params.title} by ProCerix. Complete practical tasks and earn a certificate.`;
  return {
    "@context": "https://schema.org",
    "@type": "EducationalOccupationalProgram",
    name: params.title,
    description: desc,
    url: `${BASE_URL}/internship/${params.slug}`,
    provider: {
      "@type": "Organization",
      name: SITE_NAME,
      sameAs: BASE_URL,
    },
    programType: "VirtualInternship",
    occupationalCategory: params.category || "Technology",
    ...(params.price != null
      ? {
          offers: {
            "@type": "Offer",
            price: String(params.price),
            priceCurrency: "INR",
            availability: "https://schema.org/InStock",
          },
        }
      : {}),
  };
}

export function faqSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };
}

export function breadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: item.url.startsWith("http") ? item.url : `${BASE_URL}${item.url}`,
    })),
  };
}
