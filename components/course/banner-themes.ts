export type BannerTheme = {
  id: string;
  name: string;
  gradient: string;
  accent: string;
  blobColor: string;
};

export const BANNER_THEMES: Record<string, BannerTheme> = {
  programming: {
    id: "programming",
    name: "Programming",
    gradient: "from-blue-900 via-blue-800 to-indigo-900",
    accent: "text-blue-300",
    blobColor: "bg-blue-500",
  },
  ai: {
    id: "ai",
    name: "Artificial Intelligence",
    gradient: "from-purple-900 via-purple-800 to-fuchsia-900",
    accent: "text-purple-300",
    blobColor: "bg-purple-500",
  },
  sql: {
    id: "sql",
    name: "Data & SQL",
    gradient: "from-cyan-900 via-cyan-800 to-teal-900",
    accent: "text-cyan-300",
    blobColor: "bg-cyan-500",
  },
  powerbi: {
    id: "powerbi",
    name: "Power BI",
    gradient: "from-yellow-900 via-amber-800 to-orange-900",
    accent: "text-yellow-300",
    blobColor: "bg-yellow-500",
  },
  excel: {
    id: "excel",
    name: "Excel",
    gradient: "from-emerald-900 via-green-800 to-teal-900",
    accent: "text-emerald-300",
    blobColor: "bg-emerald-500",
  },
  marketing: {
    id: "marketing",
    name: "Marketing",
    gradient: "from-orange-900 via-red-800 to-rose-900",
    accent: "text-orange-300",
    blobColor: "bg-orange-500",
  },
  cybersecurity: {
    id: "cybersecurity",
    name: "Cyber Security",
    gradient: "from-slate-900 via-gray-800 to-zinc-900",
    accent: "text-slate-300",
    blobColor: "bg-slate-500",
  },
  finance: {
    id: "finance",
    name: "Finance",
    gradient: "from-emerald-900 via-teal-800 to-cyan-900",
    accent: "text-teal-300",
    blobColor: "bg-teal-500",
  },
  resume: {
    id: "resume",
    name: "Resume Building",
    gradient: "from-indigo-900 via-blue-800 to-sky-900",
    accent: "text-indigo-300",
    blobColor: "bg-indigo-500",
  },
  linkedin: {
    id: "linkedin",
    name: "LinkedIn Optimization",
    gradient: "from-blue-800 via-blue-700 to-indigo-800",
    accent: "text-blue-200",
    blobColor: "bg-blue-400",
  },
  hr: {
    id: "hr",
    name: "HR Directory",
    gradient: "from-rose-900 via-pink-800 to-fuchsia-900",
    accent: "text-rose-300",
    blobColor: "bg-rose-500",
  },
  general: {
    id: "general",
    name: "General",
    gradient: "from-gray-900 via-slate-800 to-zinc-900",
    accent: "text-gray-300",
    blobColor: "bg-gray-500",
  }
};

export function getThemeForCourse(category: string, title: string): BannerTheme {
  const query = `${category} ${title}`.toLowerCase();
  
  if (query.includes("python") || query.includes("code") || query.includes("program") || query.includes("web") || query.includes("react")) return BANNER_THEMES.programming;
  if (query.includes("ai") || query.includes("machine learning") || query.includes("neural") || query.includes("gpt")) return BANNER_THEMES.ai;
  if (query.includes("sql") || query.includes("database") || query.includes("data analyst") || query.includes("mysql")) return BANNER_THEMES.sql;
  if (query.includes("power bi") || query.includes("powerbi") || query.includes("dashboard")) return BANNER_THEMES.powerbi;
  if (query.includes("excel") || query.includes("spreadsheet") || query.includes("vba")) return BANNER_THEMES.excel;
  if (query.includes("market") || query.includes("seo") || query.includes("ads") || query.includes("digital")) return BANNER_THEMES.marketing;
  if (query.includes("cyber") || query.includes("secur") || query.includes("hack")) return BANNER_THEMES.cybersecurity;
  if (query.includes("financ") || query.includes("invest") || query.includes("trading") || query.includes("bank")) return BANNER_THEMES.finance;
  if (query.includes("resume") || query.includes("cv")) return BANNER_THEMES.resume;
  if (query.includes("linkedin")) return BANNER_THEMES.linkedin;
  if (query.includes("hr") || query.includes("human resources") || query.includes("recruit")) return BANNER_THEMES.hr;

  return BANNER_THEMES.general;
}
