"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export function FAQAccordion({ faqs }: { faqs: Array<{ q: string; a: string }> }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="space-y-4">
      {faqs.map((faq, index) => {
        const isOpen = openIndex === index;
        return (
          <div
            key={index}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm transition-all"
          >
            <button
              onClick={() => setOpenIndex(isOpen ? null : index)}
              className="w-full px-6 py-6 text-left flex justify-between items-center focus:outline-none"
            >
              <span className="font-bold text-gray-900 dark:text-white text-lg">{faq.q}</span>
              {isOpen ? (
                <ChevronUp className="w-5 h-5 text-gray-500 shrink-0" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-500 shrink-0" />
              )}
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
  );
}
