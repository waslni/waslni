import React, { useState } from 'react';
import { FAQS } from '../data/waslniData';
import { ChevronDown, HelpCircle, MessageCircle } from 'lucide-react';

export default function FAQSection({ onOpenOrderModal }) {
  const [openIndex, setOpenIndex] = useState(0);

  const toggleAccordion = (idx) => {
    setOpenIndex(openIndex === idx ? -1 : idx);
  };

  return (
    <section id="faqs" className="py-12 sm:py-20 relative bg-[#090d16] border-t border-slate-900 overflow-hidden">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>شفافية ووضوح تام</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            الأسئلة الأكثر شيوعاً
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            كل ما تحتاج لمعرفته حول طريقة عملنا، سياسة التعديلات، وشروط التسليم قبل أن تبدأ معنا.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-3">
          {FAQS.map((faq, idx) => {
            const isOpen = openIndex === idx;

            return (
              <div
                key={idx}
                className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden transition-all duration-200"
              >
                <button
                  type="button"
                  onClick={() => toggleAccordion(idx)}
                  className="w-full p-5 text-right flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="text-sm sm:text-base font-bold text-white">
                    {faq.q}
                  </span>
                  <div className={`w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-slate-400 transition-transform duration-300 shrink-0 ${isOpen ? 'rotate-180 bg-indigo-600/30 text-indigo-300' : ''}`}>
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 font-light leading-relaxed border-t border-slate-800/50">
                    <p>{faq.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact direct link */}
        <div className="mt-12 p-6 rounded-2xl bg-indigo-950/20 border border-indigo-900/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-right">
          <div>
            <h4 className="text-sm font-bold text-white">لديك استفسار خاص بنشاطك التجاري؟</h4>
            <p className="text-xs text-slate-400 mt-1">فريق وصلني جاهز لمساعدتك واقتراح الباقة الأنسب لمحلك فوراً.</p>
          </div>
          <button
            onClick={() => onOpenOrderModal({ note: 'أرغب في استشارة تسويقية سريعة بخصوص محلي' })}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shrink-0 cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>تواصل معنا عبر الواتساب</span>
          </button>
        </div>

      </div>
    </section>
  );
}
