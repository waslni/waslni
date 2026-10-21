import React from 'react';
import { HOW_IT_WORKS_STEPS } from '../data/waslniData';
import { 
  Search, 
  Handshake, 
  UploadCloud, 
  Wand2, 
  CheckCircle2, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';

const STEP_ICONS = {
  Search,
  Handshake,
  UploadCloud,
  Wand2,
  CheckCircle2
};

export default function HowItWorksSection({ onOpenOrderModal }) {
  return (
    <section id="how-it-works" className="py-12 sm:py-20 relative bg-slate-950/70 border-t border-slate-900 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>آلية عمل بسيطة وسلسة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            كيف نعمل معك خطوة بخطوة؟
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            بدون تعقيد ولا إجراءات مطوّلة. خمس خطوات واضحة تضمن لك الحصول على محتوى تسويقي جاهز للنشر في وقت قياسي.
          </p>
        </div>

        {/* 5 Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 relative">
          {HOW_IT_WORKS_STEPS.map((step, idx) => {
            const Icon = STEP_ICONS[step.icon] || Sparkles;

            return (
              <div
                key={idx}
                className="relative rounded-3xl p-6 bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/40 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1.5 group"
              >
                <div>
                  
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-md">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span className="text-2xl font-black text-slate-700 font-mono group-hover:text-indigo-400/50 transition-colors">
                      {step.step}
                    </span>
                  </div>

                  {/* Title & Desc */}
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-indigo-300 transition-colors">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    {step.desc}
                  </p>

                </div>

                <div className="mt-5 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>المرحلة {idx + 1}</span>
                  <span className="text-emerald-400 font-medium">سلس وسريع</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Bottom Fast Action */}
        <div className="mt-14 text-center">
          <button
            onClick={() => onOpenOrderModal()}
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/25 transition-all cursor-pointer"
          >
            <span>ابدأ طلبك الأول الآن</span>
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>

      </div>
    </section>
  );
}
