import React, { useState, useEffect } from 'react';
import { BRAND_INFO } from '../data/waslniData';
import { db } from '../services/db';
import { 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Flame, 
  Clock, 
  ShieldCheck, 
  TrendingUp,
  Percent
} from 'lucide-react';

export default function HeroSection({ onOpenOrderModal, onOpenCalculator }) {
  const [visibility, setVisibility] = useState(() => db.getCategoryVisibility());

  useEffect(() => {
    const handleDataChange = () => {
      setVisibility(db.getCategoryVisibility());
    };
    window.addEventListener('waslni_data_changed', handleDataChange);
    return () => window.removeEventListener('waslni_data_changed', handleDataChange);
  }, []);

  const demoExamples = {
    perfumes: {
      id: 'perfumes',
      tabLabel: 'عطور',
      tag: 'محل عطور وبخور',
      title: 'إعلان تدشين عطر "ليلة العود"',
      headline: 'ثبات يدوم وفوحان يخطف الأنفاس ✨',
      discount: 'خصم 35% لفترة محدودة',
      delivery: 'تسليم التصميم خلال 24 ساعة',
      image: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80',
      price: '19 ر.س فقط'
    },
    fashion: {
      id: 'fashion',
      tabLabel: 'ملابس',
      tag: 'بوتيك ملابس وعبايات',
      title: 'بوستر كولكشن الموسم الجديد',
      headline: 'إطلالة عصرية بأجود الخامات 👗',
      discount: 'توصيل مجاني لجميع مدن المملكة',
      delivery: 'مقاسات جاهزة للإنستقرام والسناب',
      image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
      price: '25 ر.س فقط'
    },
    cafes: {
      id: 'cafes',
      tabLabel: 'كافيهات',
      tag: 'كافيه ومطعم',
      title: 'فيديو ريلز استعراض مشروبات الصيف',
      headline: 'انتعاش يبدأ مع أول رشفة ☕🧊',
      discount: 'منيو باركود QR + فيديو ترويجي',
      delivery: 'مونتاج سريع مع موسيقى مناسبة',
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=600&auto=format&fit=crop&q=80',
      price: '49 ر.س للمقطع'
    }
  };

  const visibleDemoKeys = Object.keys(demoExamples).filter(k => visibility[k] !== false);
  const [activeDemoTab, setActiveDemoTab] = useState(visibleDemoKeys[0] || 'perfumes');

  const currentTab = visibleDemoKeys.includes(activeDemoTab) ? activeDemoTab : (visibleDemoKeys[0] || 'perfumes');
  const activeDemo = demoExamples[currentTab] || demoExamples.perfumes;

  return (
    <section className="relative overflow-hidden pt-8 pb-16 lg:py-20 bg-grid-pattern">
      {/* Background glowing orbs */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] sm:w-[600px] h-[250px] sm:h-[350px] bg-indigo-600/15 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-1/3 right-4 sm:right-10 w-[250px] sm:w-[350px] h-[250px] sm:h-[350px] bg-purple-600/10 rounded-full blur-[90px] sm:blur-[120px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left / Main Text Column */}
          <div className="lg:col-span-7 text-right space-y-6">
            
            {/* Super Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs sm:text-sm font-medium">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span>الحل التسويقي الشامل للمحلات والمشاريع الصغيرة</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white leading-snug tracking-tight">
              وصلني — <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-purple-400">
                خدماتك الرقمية في مكان واحد
              </span>
              <br />
              وبأسعار تناسب محلك.
            </h1>

            {/* Value Proposition Description */}
            <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl font-light">
              نساعد أصحاب المحلات والأنشطة التجارية على دخول العالم الرقمي وعرض منتجاتهم بصورة جذابة ترفع المبيعات: 
              <span className="text-white font-medium"> تصميم إعلانات، مونتاج ريلز، كتابة محتوى، ومواقع ومتاجر إلكترونية</span> بدون تكاليف شركات التسويق الباهظة وبدون تشتت.
            </p>

            {/* Quick Feature Pillars */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 pt-2">
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-200">تعديلات مضمونة</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-sky-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-200">تسليم 24 - 48 ساعة</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2 p-2 sm:p-2.5 rounded-xl bg-slate-900/60 border border-slate-800 col-span-2 sm:col-span-1">
                <Percent className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-slate-200">تبدأ من 15 ر.س</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 pt-3 sm:pt-4">
              <button
                onClick={() => onOpenOrderModal({ packageId: 'pkg_launch' })}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-3 sm:py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs sm:text-sm md:text-base shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
              >
                <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-amber-300" />
                <span>اطلب باقة التجربة بـ 99 ر.س</span>
                <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
              </button>

              <button
                onClick={onOpenCalculator}
                className="flex items-center justify-center gap-2 px-4 sm:px-5 py-3 sm:py-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700 hover:border-slate-600 text-slate-200 font-semibold text-xs sm:text-sm md:text-base transition-all duration-200 cursor-pointer"
              >
                <span>حاسبة الباقات المخصصة</span>
              </button>
            </div>

            {/* Trust statement */}
            <p className="text-xs text-slate-400 flex items-center gap-2 pt-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>لا يتطلب اشتراكات طويلة الأجل — ادفع مقابل ما تحتاجه فقط.</span>
            </p>

          </div>

          {/* Right Column: Live Interactive Demo Mockup */}
          <div className="lg:col-span-5 relative">
            
            {/* Outer Glow frame */}
            <div className="relative mx-auto max-w-md rounded-3xl p-1 bg-gradient-to-b from-indigo-500/40 via-purple-500/20 to-slate-800/60 shadow-2xl shadow-indigo-950">
              
              <div className="bg-[#0e1322] rounded-[22px] p-5 sm:p-6 border border-slate-800">
                
                {/* Header of Demo Card */}
                <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-rose-500" />
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-xs text-slate-400 font-mono mr-2">نموذج فوري لمحلك</span>
                  </div>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    جاهز للنشر
                  </span>
                </div>

                {/* Switcher Tabs (Respects Category Visibility) */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 rounded-xl my-4 border border-slate-800 text-xs">
                  {visibleDemoKeys.map((key) => {
                    const item = demoExamples[key];
                    const isSelected = currentTab === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveDemoTab(key)}
                        className={`flex-1 py-1.5 px-2 rounded-lg font-medium transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {item.tabLabel}
                      </button>
                    );
                  })}
                </div>

                {/* Simulated Social Ad Poster */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/5] group bg-slate-900 border border-slate-700/60 shadow-inner">
                  <img
                    src={activeDemo.image}
                    alt={activeDemo.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d18] via-black/40 to-black/20" />

                  {/* Top Badge on image */}
                  <div className="absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-white text-[11px] font-medium">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span>{activeDemo.tag}</span>
                  </div>

                  {/* Price Tag badge */}
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-xl bg-indigo-600/90 backdrop-blur-md text-white text-xs font-bold shadow-md">
                    {activeDemo.price}
                  </div>

                  {/* Ad Copy Overlay Content */}
                  <div className="absolute bottom-3 inset-x-3 p-4 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-700/80 space-y-2 text-right">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-md border border-amber-400/20">
                        {activeDemo.discount}
                      </span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-sky-400" />
                        {activeDemo.delivery}
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-white">
                      {activeDemo.headline}
                    </h4>

                    <div className="pt-2 flex items-center justify-between border-t border-slate-800 text-[11px]">
                      <span className="text-slate-400">تصميم وتنفيذ وصلني</span>
                      <button
                        onClick={() => onOpenOrderModal({ note: `أعجبني نموذج ${activeDemo.tag} وأرغب في تصميم مثله لمحلي` })}
                        className="text-indigo-300 font-bold hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        <span>طلب تصميم مماثل</span>
                        <ArrowLeft className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Mini Metric footer */}
                <div className="mt-4 pt-3 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <TrendingUp className="w-4 h-4" />
                    <span>يضاعف وصول منشوراتك</span>
                  </div>
                  <span className="text-slate-500">جاهز للتسليم في ساعات</span>
                </div>

              </div>
            </div>

            {/* Floating Mini Ribbon */}
            <div className="absolute -bottom-5 -right-3 sm:-right-6 bg-slate-900 border border-indigo-500/40 rounded-2xl p-3 shadow-xl backdrop-blur-md flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-rose-500 flex items-center justify-center text-white font-bold text-lg">
                🎯
              </div>
              <div>
                <p className="text-xs font-bold text-white">بدون مصاريف خفية</p>
                <p className="text-[11px] text-slate-400">سعر محدد وتعديل مضمون</p>
              </div>
            </div>

          </div>

        </div>

        {/* Hero 4 Big Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-4 sm:p-6 rounded-2xl bg-slate-900/70 border border-slate-800/80 backdrop-blur-md">
          {BRAND_INFO.heroStats.map((stat, i) => (
            <div key={i} className="text-center p-3 border-r last:border-r-0 border-slate-800/80">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-indigo-200 to-indigo-400">
                {stat.value}
              </div>
              <div className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
