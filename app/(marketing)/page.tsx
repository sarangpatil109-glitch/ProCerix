import Link from "next/link";
import { MarketingHeroSearch } from "@/components/marketing/marketing-search";
import { CheckCircle, ShieldCheck, Zap, Bot, Star } from "lucide-react";

export default function Home() {
  return (
    <div className="w-full">
      {/* 1. Premium Hero */}
      <section className="relative pt-32 pb-24 lg:pt-48 lg:pb-32 overflow-hidden px-6">
        <div className="absolute inset-0 bg-blue-50/50 dark:bg-blue-950/10 [mask-image:linear-gradient(to_bottom,white,transparent)] -z-10"></div>
        <div className="max-w-4xl mx-auto text-center space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 font-semibold text-sm">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-blue-500"></span>
            </span>
            ProCerix AI Generation Engine Live
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black text-gray-900 dark:text-white tracking-tighter leading-[1.1]">
            Search Any Skill. <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">
              Get Certified.
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto font-medium">
            Can't find a certification? We'll create it for you. Advanced agentic learning powered by AI.
          </p>

          <MarketingHeroSearch />
          
          <div className="pt-4 flex items-center justify-center gap-6 text-sm font-medium text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> Lifetime Verification</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> AI Generated Content</span>
            <span className="flex items-center gap-1.5"><CheckCircle className="w-4 h-4 text-green-500" /> 100% Online</span>
          </div>
        </div>
      </section>

      {/* 2. Products */}
      <section className="py-24 bg-white dark:bg-black px-6 border-y border-gray-100 dark:border-gray-900">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">Choose Your Path</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">We offer two distinct products dynamically generated for any skill.</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* Certificate Product */}
            <div className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 hover:border-blue-500/50 transition-colors">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Skill Certificate</h3>
              <div className="text-4xl font-black mb-6">₹99</div>
              <ul className="space-y-4 mb-8 text-gray-600 dark:text-gray-400 font-medium">
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> 2-3 Comprehensive Modules</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> 5-8 Deep-dive Lessons</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> 10-Question MCQ Assessment</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-blue-500" /> Verifiable PDF Certificate</li>
              </ul>
              <Link href="/certificates" className="block w-full text-center py-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 font-bold rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Explore Certificates
              </Link>
            </div>

            {/* Internship Product */}
            <div className="p-8 rounded-3xl border border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/20 hover:border-cyan-500/50 transition-colors relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-bl-xl">POPULAR</div>
              <div className="w-14 h-14 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Virtual Internship</h3>
              <div className="text-4xl font-black mb-6">₹249</div>
              <ul className="space-y-4 mb-8 text-gray-600 dark:text-gray-400 font-medium">
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> 2-5 Comprehensive Modules</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> 10-15 Deep-dive Lessons</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> 3 Practical Capstone Tasks</li>
                <li className="flex items-center gap-3"><CheckCircle className="w-5 h-5 text-cyan-500" /> Experience Letter + Certificate</li>
              </ul>
              <Link href="/internships" className="block w-full text-center py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold rounded-xl hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors">
                Explore Internships
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How ProCerix Works */}
      <section className="py-24 bg-gray-50 dark:bg-gray-900/50 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">How It Works</h2>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">From discovery to certification in minutes.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Search", desc: "Type any skill you want to learn. If it doesn't exist, our AI pre-builds a curriculum." },
              { step: "02", title: "Enroll", desc: "Secure checkout grants you instant access to the learning player." },
              { step: "03", title: "Learn", desc: "Study the auto-generated, high-quality modules, lessons, and tasks." },
              { step: "04", title: "Certify", desc: "Pass the MCQ assessment to automatically generate your verifiable credential." }
            ].map((item) => (
              <div key={item.step} className="p-6">
                <div className="text-5xl font-black text-gray-200 dark:text-gray-800 mb-4">{item.step}</div>
                <h4 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{item.title}</h4>
                <p className="text-gray-500 dark:text-gray-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. Why Choose ProCerix */}
      <section className="py-24 bg-white dark:bg-black px-6 border-y border-gray-100 dark:border-gray-900">
         <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-6">
                Powered by <br/> Advanced Agentic AI
              </h2>
              <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                We don't rely on static catalogs. Our proprietary generation engines utilize cutting edge LLMs to dynamically construct structurally sound, pedagogically correct courses on-demand.
              </p>
              <ul className="space-y-4">
                {["Affordable high-quality education", "Verified cryptographic certificates", "Instant on-demand generation", "Lifetime public verification page"].map((item, i) => (
                   <li key={i} className="flex items-center gap-3 text-gray-700 dark:text-gray-300 font-medium">
                     <CheckCircle className="w-5 h-5 text-blue-500" /> {item}
                   </li>
                ))}
              </ul>
            </div>
            <div className="relative">
               <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-cyan-400 rounded-3xl blur-3xl opacity-20 dark:opacity-40"></div>
               <div className="relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-3xl shadow-xl">
                 <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                    <div className="w-12 h-12 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                      <Bot className="w-6 h-6 text-gray-600 dark:text-gray-400" />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">Generation Engine</h4>
                      <p className="text-sm text-gray-500">Status: Online</p>
                    </div>
                 </div>
                 <div className="space-y-3 font-mono text-sm">
                   <div className="flex justify-between text-gray-500"><span className="text-blue-500">Payload:</span> <span>PromptBuilder.ts</span></div>
                   <div className="flex justify-between text-gray-500"><span className="text-blue-500">Schema:</span> <span>Strict JSON Validation</span></div>
                   <div className="flex justify-between text-gray-500"><span className="text-blue-500">Storage:</span> <span>Transaction Adapter</span></div>
                   <div className="flex justify-between font-bold text-green-500 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                     <span>Result:</span> <span>Course Created Successfully</span>
                   </div>
                 </div>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}
