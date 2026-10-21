import React, { useState, useEffect } from 'react';
import { TARGET_NICHES } from '../data/waslniData';
import { db } from '../services/db';
import { 
  Shirt, 
  Droplets, 
  Gift, 
  Coffee, 
  Home, 
  Smartphone, 
  CheckCircle, 
  ArrowLeft,
  Sparkles
} from 'lucide-react';

const NICHE_ICONS = {
  Shirt,
  Droplets,
  Gift,
  Coffee,
  Home,
  Smartphone
};

export default function TargetNichesSection({ onOpenOrderModal }) {
  const [visibility, setVisibility] = useState(() => db.getCategoryVisibility());

  useEffect(() => {
    const handleDataChange = () => {
      setVisibility(db.getCategoryVisibility());
    };
    window.addEventListener('waslni_data_changed', handleDataChange);
    return () => window.removeEventListener('waslni_data_changed', handleDataChange);
  }, []);

  // Filter only visible niches
  const visibleNiches = TARGET_NICHES.filter(n => visibility[n.id] !== false);

  const [selectedNicheId, setSelectedNicheId] = useState('fashion');
  
  // Keep selection valid among visible items
  const activeNiche = visibleNiches.find(n => n.id === selectedNicheId) || visibleNiches[0];

  if (visibleNiches.length === 0) return null;

  return (
    <section id="niches" className="py-12 sm:py-20 relative bg-[#090d16] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>حلول مفصّلة حسب مجالك</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            حلول مصممة لطبيعة نشاطك التجاري
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            لا نستخدم قوالب عامة مكررة؛ بل نفهم خصوصية منتجك وطريقة تفكير زبائنك لتقديم تصاميم ومحتوى يترجم مباشرة إلى طلبات ومبيعات.
          </p>
        </div>

        {/* Niche Selection Pills (Visible Only) */}
        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-10">
          {visibleNiches.map((niche) => {
            const Icon = NICHE_ICONS[niche.icon] || Sparkles;
            const isSelected = activeNiche && niche.id === activeNiche.id;

            return (
              <button
                key={niche.id}
                onClick={() => setSelectedNicheId(niche.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-semibold transition-all duration-200 cursor-pointer ${
                  isSelected
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-600/30 sm:scale-105 border border-indigo-400/30'
                    : 'bg-slate-900/80 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                <span>{niche.title}</span>
              </button>
            );
          })}
        </div>

        {/* Selected Niche Showcase Card */}
        {activeNiche && (
          <div className="relative rounded-3xl bg-slate-900/70 border border-slate-800/90 overflow-hidden p-6 sm:p-8 lg:p-10 shadow-2xl backdrop-blur-md">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Visual Image Side */}
              <div className="lg:col-span-5 relative rounded-2xl overflow-hidden aspect-[4/3] sm:aspect-[16/10] lg:aspect-square group border border-slate-700/50">
                <img
                  src={activeNiche.bgImage}
                  alt={activeNiche.title}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                
                <div className="absolute bottom-4 right-4 left-4 p-3 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/60">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                    <span>حلول فورية مجهزة لـ {activeNiche.title}</span>
                  </div>
                </div>
              </div>

              {/* Description and Examples Side */}
              <div className="lg:col-span-7 space-y-6 text-right">
                <div>
                  <span className="text-xs font-bold text-indigo-400 tracking-wide uppercase">
                    تخصص دقيق
                  </span>
                  <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white mt-1">
                    كيف يخدم "وصلني" {activeNiche.title}؟
                  </h3>
                  <p className="text-sm sm:text-base text-slate-300 mt-2 font-light leading-relaxed">
                    {activeNiche.description}
                  </p>
                </div>

                {/* Concrete Deliverable Examples */}
                <div className="space-y-3">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-400">
                    نماذج ما يمكننا تجهيزه لمحلك فوراً:
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {activeNiche.examples.map((item, idx) => (
                      <div 
                        key={idx}
                        className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs sm:text-sm text-slate-200"
                      >
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action */}
                <div className="pt-2 flex flex-wrap items-center gap-4">
                  <button
                    onClick={() => onOpenOrderModal({ nicheId: activeNiche.id, note: `أنا صاحب نشاط في مجال ${activeNiche.title}` })}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
                  >
                    <span>طلب خطة أو تصميم لـ {activeNiche.title}</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>

                  <span className="text-xs text-slate-400">
                    ⚡ نسلمك أول نموذج للتجربة خلال 24 ساعة
                  </span>
                </div>

              </div>

            </div>
          </div>
        )}

      </div>
    </section>
  );
}

