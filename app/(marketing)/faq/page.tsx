"use client";
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const faqs = [
  { q: "How does the AI Generation work?", a: "When you search for a skill we don't have, our AI generation pipeline instantly starts building a structured course just for you. It writes lessons, creates MCQs, and outlines tasks using advanced LLMs with strict pedagogical schemas." },
  { q: "Are the certificates verifiable?", a: "Yes. Every certificate comes with a unique cryptographic credential ID and a QR code linking to a lifetime public verification page on our domain." },
  { q: "What is a Virtual Internship?", a: "Unlike standard courses, Virtual Internships include practical capstone tasks and provide an Experience Letter alongside your skill certificate upon completion." },
  { q: "Do I need a subscription?", a: "No. ProCerix operates on a pay-per-skill model. You only pay a one-time fee for the specific certificate or internship you want to pursue." },
  { q: "How long do I have access to the course?", a: "Once enrolled, you have lifetime access to the learning materials and the learning player for that specific course." },
];

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="py-24 px-6 bg-[#FAFAFA] dark:bg-black min-h-[80vh]">
      <div className="max-w-3xl mx-auto space-y-12">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tighter mb-4">Frequently Asked Questions</h1>
          <p className="text-gray-500 dark:text-gray-400">Everything you need to know about the product and billing.</p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div key={index} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-all">
                <button 
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full px-6 py-6 text-left flex justify-between items-center focus:outline-none"
                >
                  <span className="font-bold text-gray-900 dark:text-white text-lg">{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-gray-600 dark:text-gray-400">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
