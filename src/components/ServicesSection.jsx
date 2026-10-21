import React from 'react';
import { SERVICES } from '../data/waslniData';
import { 
  Palette, 
  Video, 
  Globe, 
  ShoppingBag, 
  PenTool, 
  Sparkles, 
  Check, 
  ArrowLeft,
  Store
} from 'lucide-react';

const ICON_MAP = {
  Palette,
  Video,
  Globe,
  ShoppingBag,
  PenTool,
  Sparkles
};

export default function ServicesSection({ onSelectService }) {
  return (
    <section id="services" className="py-12 sm:py-20 relative bg-slate-950/60 border-t border-slate-900 overflow-hidden">
      
      {/* Decorative background glow */}
      <div className="absolute top-1/2 right-1/4 w-[350px] sm:w-[500px] h-[350px] sm:h-[500px] bg-indigo-900/10 rounded-full blur-[120px] sm:blur-[160px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>خدماتنا المتكاملة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            كل ما يحتاجه محلك للظهور والبيع أونلاين
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            لا داعي للبحث عن مصمم مستقل، ثم مبرمج، ثم كاتب محتوى في أماكن متفرقة. "وصلني" يقدم لك حلولاً متناسقة وسريعة تحت سقف واحد.
          </p>
        </div>

        {/* 6 Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {SERVICES.map((srv) => {
            const IconComponent = ICON_MAP[srv.icon] || Sparkles;

            return (
              <div 
                key={srv.id}
                className="group relative rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/50 p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/40 hover:-translate-y-1.5"
              >
                <div>
                  
                  {/* Card Header: Icon & Price Badge */}
                  <div className="flex items-center justify-between mb-5">
                    <div className={`w-13 h-13 rounded-2xl bg-gradient-to-tr ${srv.gradient} flex items-center justify-center text-white shadow-lg shadow-indigo-600/10 group-hover:scale-110 transition-transform duration-300`}>
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-800 text-indigo-300 border border-indigo-500/20">
                      {srv.priceEstimate}
                    </span>
                  </div>

                  {/* Title and Tagline */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg sm:text-xl font-black text-white group-hover:text-indigo-300 transition-colors">
                        {srv.title}
                      </h3>
                      {srv.badge && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-400/10 text-amber-300 border border-amber-400/20">
                          {srv.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-400 leading-relaxed font-light">
                      {srv.tagline}
                    </p>
                  </div>

                  <p className="text-xs text-slate-400/90 mb-5 leading-normal pb-4 border-b border-slate-800">
                    {srv.description}
                  </p>

                  {/* Features List */}
                  <ul className="space-y-2.5 mb-6">
                    {srv.features.map((feat, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                        <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>

                </div>

                {/* Card Footer: Recommended & Action Button */}
                <div className="pt-4 border-t border-slate-800/80 space-y-4">
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Store className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span className="truncate">مثالي لـ: {srv.recommendedFor}</span>
                  </div>

                  <button
                    onClick={() => onSelectService(srv)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs sm:text-sm transition-all duration-200 cursor-pointer group-hover:bg-indigo-600"
                  >
                    <span>طلب هذه الخدمة</span>
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>

        {/* Note on Clear Scope */}
        <div className="mt-12 p-4 sm:p-5 rounded-2xl bg-indigo-950/30 border border-indigo-900/40 text-center max-w-2xl mx-auto">
          <p className="text-xs sm:text-sm text-indigo-200">
            💡 <strong className="font-semibold text-white">مبدأ وصلني:</strong> وضوح الخدمة قبل البدء. نحدد معك عدد التعديلات، موعد التسليم، والمواد المطلوبة حتى تضمن جودة عمل تناسب توقعاتك بدون أي مفاجآت.
          </p>
        </div>

      </div>
    </section>
  );
}
