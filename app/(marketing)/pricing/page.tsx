import Link from "next/link";
import { CheckCircle, ShieldCheck, Zap } from "lucide-react";

export default function PricingPage() {
  return (
    <div className="py-24 px-6 bg-[#FAFAFA] dark:bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">Transparent Pricing. No Subscriptions.</h1>
          <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Pay once for the skill you want to master. We instantly generate a complete curriculum for you.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          <div className="p-10 rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xl hover:-translate-y-2 transition-transform duration-300">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Skill Certificate</h3>
            <div className="text-5xl font-black mb-2 text-gray-900 dark:text-white">₹99</div>
            <p className="text-sm text-gray-500 mb-8">One-time payment per skill.</p>
            <ul className="space-y-4 mb-10 text-gray-600 dark:text-gray-400 font-medium">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> Complete Curriculum</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> 10-Question Assessment</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> Verifiable PDF Certificate</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> Lifetime Verification Page</li>
            </ul>
            <Link href="/search" className="block w-full text-center py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
              Find a Certificate
            </Link>
          </div>

          <div className="p-10 rounded-3xl border-2 border-cyan-500 bg-white dark:bg-gray-900 shadow-xl hover:-translate-y-2 transition-transform duration-300 relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-cyan-500 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">MOST POPULAR</div>
            <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
              <Zap className="w-7 h-7" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Virtual Internship</h3>
            <div className="text-5xl font-black mb-2 text-gray-900 dark:text-white">₹249</div>
            <p className="text-sm text-gray-500 mb-8">One-time payment per internship.</p>
            <ul className="space-y-4 mb-10 text-gray-600 dark:text-gray-400 font-medium">
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> Extended Curriculum</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> 3 Capstone Practical Tasks</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> AI Guided Feedback</li>
              <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> Experience Letter + Certificate</li>
            </ul>
            <Link href="/search" className="block w-full text-center py-4 bg-cyan-600 text-white font-bold rounded-xl hover:bg-cyan-700 transition-colors">
              Find an Internship
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
