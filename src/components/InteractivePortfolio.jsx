import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { BEFORE_AFTER_SHOWCASE } from '../data/waslniData';
import { 
  Sparkles, 
  ArrowLeft, 
  MessageSquareQuote,
  Flame,
  ArrowRightLeft,
  Play,
  Video,
  X
} from 'lucide-react';

export default function InteractivePortfolio({ onOpenOrderModal }) {
  const [items, setItems] = useState(() => db.getPortfolio());
  const [activeCategory, setActiveCategory] = useState('all');
  const [showBeforeAfterComparison, setShowBeforeAfterComparison] = useState(false);
  const [activeVideoModal, setActiveVideoModal] = useState(null);

  useEffect(() => {
    const handleDataChange = () => {
      setItems(db.getPortfolio());
    };
    window.addEventListener('waslni_data_changed', handleDataChange);
    return () => window.removeEventListener('waslni_data_changed', handleDataChange);
  }, []);

  const allCategories = [
    { id: 'all', label: 'جميع الأعمال' },
    { id: 'fashion', label: 'ملابس وأزياء 👗' },
    { id: 'flowers', label: 'ورود وهدايا 🌸' },
    { id: 'perfumes', label: 'عطور وبخور 🧴' },
    { id: 'cafes', label: 'مطاعم وكافيهات ☕' }
  ];

  const categories = allCategories.filter(cat => cat.id === 'all' || db.isCategoryVisible(cat.id));

  const filteredItems = (activeCategory === 'all' 
    ? items.filter(item => !item.category || db.isCategoryVisible(item.category))
    : items.filter(item => item.category === activeCategory)
  ).filter(item => !item.category || db.isCategoryVisible(item.category));

  return (
    <section id="portfolio" className="py-12 sm:py-20 relative bg-slate-950/80 border-t border-slate-900 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3 sm:space-y-4 mb-10 sm:mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>معرض الأعمال الحية والتصاميم</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            نماذج حية لمحتوى محلات الملابس، الورود، والعطور
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-slate-400 font-light leading-relaxed">
            شاهد مقاطع الريلز وتصاميم البوستات والستوريات الجاهزة التي ننفذها لأصحاب الأنشطة التجارية لتضاعف تفاعل الزبائن ومبيعاتهم.
          </p>
        </div>

        {/* Before & After Interactive Comparison */}
        <div className="mb-12 rounded-3xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 p-5 sm:p-8 border border-indigo-500/30 shadow-xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <div>
              <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5 mb-1">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>مقارنة عملية سريعة لمحلات الورود والعطور</span>
              </span>
              <h3 className="text-lg sm:text-2xl font-black text-white">
                {BEFORE_AFTER_SHOWCASE.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 font-light">
                {BEFORE_AFTER_SHOWCASE.subtitle}
              </p>
            </div>

            <button
              onClick={() => setShowBeforeAfterComparison(!showBeforeAfterComparison)}
              className="flex items-center gap-2 px-4 sm:px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-all shadow-md shadow-indigo-600/30 cursor-pointer self-stretch sm:self-auto justify-center"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{showBeforeAfterComparison ? 'إخفاء المقارنة' : 'معاينة الفرق (قبل وبعد)'}</span>
            </button>
          </div>

          {showBeforeAfterComparison && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 pt-4 border-t border-indigo-900/50">
              
              {/* Before Card */}
              <div className="rounded-2xl p-4 sm:p-5 bg-slate-900/90 border border-rose-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    ❌ قبل (تصوير الجوال العادي في المحل)
                  </span>
                  <span className="text-xs text-slate-500">بدون تسويق</span>
                </div>
                <div className="aspect-[4/3] rounded-xl bg-slate-800/80 overflow-hidden relative border border-slate-700/60">
                  <img 
                    src="/media/flower-bouquet-2.jpg" 
                    alt="قبل" 
                    className="w-full h-full object-cover filter grayscale opacity-45"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-black/60 text-center">
                    <p className="text-xs font-bold text-rose-200">صورة بوكيه بدون هوية أو أسعار</p>
                    <p className="text-[11px] text-slate-400 mt-1">تمر في خلاصة السوشيال ميديا دون أن تلفت انتباه المشتري</p>
                  </div>
                </div>
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  النتيجة: استفسارات معدومة لعدم وضوح العرض وصعوبة التواصل الفوري.
                </p>
              </div>

              {/* After Card */}
              <div className="rounded-2xl p-4 sm:p-5 bg-indigo-950/40 border border-emerald-500/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    ✅ بعد لمسات وتنسيق "وصلني" الاحترافي
                  </span>
                  <span className="text-xs text-emerald-400 font-semibold">جاهز للإعلانات والبيع</span>
                </div>
                <div className="aspect-[4/3] rounded-xl bg-slate-900 overflow-hidden relative border border-indigo-500/40 shadow-lg">
                  <img 
                    src="/media/flower-bouquet-1.jpg" 
                    alt="بعد" 
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-transparent flex flex-col justify-end p-4">
                    <span className="text-[10px] text-amber-300 font-bold bg-amber-400/20 px-2 py-0.5 rounded w-max border border-amber-400/30 mb-1">
                      باقة طلب القرب للمناسبات • توصيل سريع
                    </span>
                    <p className="text-xs font-bold text-white">تصميم إعلاني بهوية راقية + كرت إهداء مجاني وزر واتساب</p>
                  </div>
                </div>
                <p className="text-xs text-emerald-300 font-light leading-relaxed">
                  النتيجة: إبراز فخامة الورود والشريط المخصص، ورفع نسبة النقر والطلب بنقرة زر واحدة.
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-10 overflow-x-auto pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30 scale-105'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Portfolio Media Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 sm:gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="group rounded-3xl bg-slate-900/60 border border-slate-800/90 hover:border-indigo-500/50 overflow-hidden flex flex-col justify-between transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-950/40 hover:-translate-y-1"
            >
              <div>
                
                {/* Media Container (Video Reel or Image) */}
                <div className="relative aspect-[4/5] sm:aspect-[3/4] overflow-hidden bg-slate-950">
                  {item.mediaType === 'video' ? (
                    <div 
                      onClick={() => setActiveVideoModal(item)}
                      className="w-full h-full relative cursor-pointer group"
                    >
                      <video
                        src={item.mediaUrl}
                        className="w-full h-full object-cover"
                        muted
                        loop
                        playsInline
                        onMouseEnter={(e) => e.target.play().catch(() => {})}
                        onMouseLeave={(e) => e.target.pause()}
                      />
                      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                        <div className="w-14 h-14 rounded-full bg-indigo-600/90 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-7 h-7 fill-white mr-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/70 backdrop-blur-md text-[10px] text-amber-300 font-bold flex items-center gap-1">
                        <Video className="w-3 h-3" />
                        <span>مقطع ريلز</span>
                      </div>
                    </div>
                  ) : (
                    <img
                      src={item.mediaUrl}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      loading="lazy"
                    />
                  )}

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/20 pointer-events-none" />

                  {/* Top Category Badge */}
                  <div className="absolute top-3 right-3 flex items-center gap-2 pointer-events-none">
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-slate-950/85 backdrop-blur-md text-white border border-slate-700">
                      {item.categoryName}
                    </span>
                  </div>

                  {/* Bottom Deliverable Type */}
                  <div className="absolute bottom-3 right-3 left-3 pointer-events-none">
                    <span className="text-xs font-bold text-indigo-300 bg-indigo-950/90 backdrop-blur-md px-2.5 py-1 rounded-lg border border-indigo-500/30 truncate block text-right">
                      {item.type}
                    </span>
                  </div>
                </div>

                {/* Content body */}
                <div className="p-4 sm:p-5 space-y-2.5">
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="truncate">{item.clientType}</span>
                    <span className="text-emerald-400 font-medium shrink-0">جاهز للنشر</span>
                  </div>

                  <h3 className="text-sm sm:text-base font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">
                    {item.title}
                  </h3>

                  {/* Highlight pill */}
                  <div className="flex items-center gap-1.5 text-xs text-amber-300 bg-amber-400/10 p-2 rounded-xl border border-amber-400/20">
                    <Sparkles className="w-3.5 h-3.5 shrink-0" />
                    <span className="line-clamp-1">{item.highlight}</span>
                  </div>

                  {/* Copywriting sample */}
                  <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-[11px] text-slate-300 leading-relaxed space-y-1">
                    <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold">
                      <MessageSquareQuote className="w-3 h-3 text-indigo-400" />
                      <span>النص الإعلاني المقترح:</span>
                    </div>
                    <p className="italic font-light line-clamp-2">"{item.copySample}"</p>
                  </div>
                </div>

              </div>

              {/* Action */}
              <div className="p-4 sm:p-5 pt-0">
                <button
                  onClick={() => onOpenOrderModal({ note: `أرغب في نموذج ومونتاج مثل: ${item.title}` })}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  <span>طلب تصميم ومونتاج مماثل</span>
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* ============================================================ */}
      {/* VIDEO REEL VIEWER MODAL */}
      {/* ============================================================ */}
      {activeVideoModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-lg animate-fadeIn">
          <div 
            className="relative w-full max-w-sm rounded-3xl bg-[#0e1322] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[95vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between p-3.5 border-b border-slate-800 bg-slate-900/80">
              <div className="flex items-center gap-2 text-xs font-bold text-white truncate">
                <Video className="w-4 h-4 text-indigo-400" />
                <span className="truncate">{activeVideoModal.title}</span>
              </div>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Video Player */}
            <div className="relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">
              <video
                src={activeVideoModal.mediaUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>

            {/* Video Footer Actions */}
            <div className="p-4 bg-slate-900/90 border-t border-slate-800 space-y-3">
              <div className="text-xs text-slate-300">
                <span className="text-slate-500 block text-[10px]">النشاط: {activeVideoModal.clientType}</span>
                <p className="font-light mt-0.5">{activeVideoModal.highlight}</p>
              </div>

              <button
                onClick={() => {
                  const modalItem = activeVideoModal;
                  setActiveVideoModal(null);
                  onOpenOrderModal({ note: `أرغب في مونتاج فيديو ريلز مثل: ${modalItem.title}` });
                }}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>طلب مونتاج فيديو ريلز لمحلك</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
