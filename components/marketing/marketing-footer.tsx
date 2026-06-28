import Link from "next/link";

export function MarketingFooter() {
  return (
    <footer className="bg-white dark:bg-black border-t border-gray-200 dark:border-gray-800 pt-20 pb-10">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="text-2xl font-black text-blue-600 dark:text-blue-500 tracking-tighter block mb-4">
              ProCerix
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm max-w-sm mb-6 leading-relaxed">
              Learn. Complete. Get Certified. ProCerix is the world's most advanced platform for agentic skill certification and virtual internships.
            </p>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Products</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/certificates" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Skill Certificates</Link></li>
              <li><Link href="/internships" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Virtual Internships</Link></li>
              <li><Link href="/resume-builder" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">ATS Resume Builder</Link></li>
              <li><Link href="/linkedin-optimizer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">LinkedIn Optimizer</Link></li>
              <li><Link href="/pricing" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Pricing</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Company</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">About Us</Link></li>
              <li><Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Contact</Link></li>
              <li><Link href="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">FAQ</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-500 dark:text-gray-400">
              <li><Link href="/privacy" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/refund" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Refund Policy</Link></li>
              <li><Link href="/disclaimer" className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">Disclaimer</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-100 dark:border-gray-900 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-gray-400 text-sm">
            © {new Date().getFullYear()} ProCerix Inc. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-gray-400">
            <span className="text-sm font-medium">Powered by Agentic AI</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
