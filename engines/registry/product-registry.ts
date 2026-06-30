import { BookOpen, Briefcase, FileText, UserCircle, Users } from "lucide-react";

export type ProductType = "certificate" | "internship" | "resume" | "linkedin" | "hr";

export interface ProductRegistryEntry {
  id: ProductType;
  name: string;
  slug: string;
  icon: any;
  iconName: string;
  defaultPrice: number;
  originalPrice: number;
  useAI: boolean;
  routes: {
    dashboard: string;
    marketing: string;
    admin: string;
  };
  features: string[];
}

export class ProductRegistry {
  private static products: ProductRegistryEntry[] = [
    {
      id: "certificate",
      name: "AI Skill Certificates",
      slug: "certificates",
      icon: BookOpen,
      iconName: "BookOpen",
      defaultPrice: 99,
      originalPrice: 999,
      useAI: true,
      routes: {
        dashboard: "/dashboard/certificates",
        marketing: "/certificates",
        admin: "/admin/courses"
      },
      features: ["10-15 Modules", "10 MCQs", "Verifiable Certificate", "AI Generated Content"]
    },
    {
      id: "internship",
      name: "Virtual Internships",
      slug: "internships",
      icon: Briefcase,
      iconName: "Briefcase",
      defaultPrice: 249,
      originalPrice: 2499,
      useAI: true,
      routes: {
        dashboard: "/dashboard/internships",
        marketing: "/internships",
        admin: "/admin/internships"
      },
      features: ["Practical Tasks", "Industry Scenarios", "Completion Certificate", "AI Generated Content"]
    },
    {
      id: "resume",
      name: "ATS Resume Builder",
      slug: "resume-builder",
      icon: FileText,
      iconName: "FileText",
      defaultPrice: 49,
      originalPrice: 199,
      useAI: true,
      routes: {
        dashboard: "/dashboard/product/resume",
        marketing: "/resume-builder",
        admin: "/admin/products?type=resume"
      },
      features: ["ATS Optimization", "Keyword Matching", "AI Tailoring", "PDF Export"]
    },
    {
      id: "linkedin",
      name: "LinkedIn Optimizer",
      slug: "linkedin-optimizer",
      icon: UserCircle,
      iconName: "UserCircle",
      defaultPrice: 49,
      originalPrice: 199,
      useAI: true,
      routes: {
        dashboard: "/dashboard/product/linkedin",
        marketing: "/linkedin-optimizer",
        admin: "/admin/products?type=linkedin"
      },
      features: ["Profile Headline Gen", "Summary Optimization", "Skills Mapping"]
    },
    {
      id: "hr",
      name: "HR Directory",
      slug: "hr-directory",
      icon: Users,
      iconName: "Users",
      defaultPrice: 999,
      originalPrice: 2499,
      useAI: false, // Must NEVER use AI
      routes: {
        dashboard: "/dashboard/product/hr",
        marketing: "/hr-directory",
        admin: "/admin/products?type=hr"
      },
      features: ["Verified Companies", "Direct Contacts", "Recruiter Emails", "No AI Generation"]
    }
  ];

  static getAllProducts(): ProductRegistryEntry[] {
    return this.products;
  }

  static getProduct(id: ProductType): ProductRegistryEntry | undefined {
    return this.products.find(p => p.id === id);
  }

  static getProductBySlug(slug: string): ProductRegistryEntry | undefined {
    return this.products.find(p => p.slug === slug);
  }
}
