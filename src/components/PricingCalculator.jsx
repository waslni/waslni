import React, { useState, useMemo, useEffect } from 'react';
import { db } from '../services/db';
import { 
  Sparkles, 
  Check, 
  Calculator, 
  ArrowLeft, 
  Clock, 
  Flame
} from 'lucide-react';

export default function PricingCalculator({ onSelectPackage, onCustomOrderSubmit }) {
  const [packages, setPackages] = useState(db.getPackages());

  useEffect(() => {
    const handleDataChange = () => {
      setPackages(db.getPackages());
    };
    window.addEventListener('waslni_data_changed', handleDataChange);
    return () => window.removeEventListener('waslni_data_changed', handleDataChange);
  }, []);

  // Custom Calculator States
  const [designsCount, setDesignsCount] = useState(5);
  const [videosCount, setVideosCount] = useState(1);
  const [includeCopywriting, setIncludeCopywriting] = useState(true);
  const [websiteType, setWebsiteType] = useState('none'); // 'none' | 'landing' | 'store'

  // Dynamic price computation based on Waslni's realistic rates
  const calculatedResult = useMemo(() => {
    let basePrice = 0;

    // Designs pricing tiered
    if (designsCount > 0) {
      if (designsCount <= 3) {
        basePrice += designsCount * 20;
      } else if (designsCount <= 7) {
        basePrice += 65 + (designsCount - 5) * 14;
      } else {
        basePrice += 100 + (designsCount - 10) * 12;
      }
    }

    // Videos pricing tiered
    if (videosCount > 0) {
      basePrice += videosCount * 45;
    }

    // Copywriting fee (discounted or included if bundle is selected)
    if (includeCopywriting && designsCount > 0) {
      basePrice += designsCount > 4 ? 20 : 30;
    }

    // Website or Store addition
    if (websiteType === 'landing') {
      basePrice += 199;
    } else if (websiteType === 'store') {
      basePrice += 349;
    }

    // Delivery time estimate
    let deliveryEstimate = 'خلال 24 إلى 48 ساعة';
    if (websiteType !== 'none') {
      deliveryEstimate = 'خلال 3 إلى 5 أيام عمل';
    } else if (designsCount > 10 || videosCount > 3) {
      deliveryEstimate = 'خلال 3 إلى 4 أيام عمل';
    }

    return {
      price: Math.max(basePrice, 49),
      deliveryEstimate
    };
  }, [designsCount, videosCount, includeCopywriting, websiteType]);

  const handleCustomOrderClick = () => {
    onCustomOrderSubmit({
      isCustom: true,
      designsCount,
      videosCount,
      includeCopywriting,
      websiteType,
      estimatedPrice: calculatedResult.price,
      deliveryEstimate: calculatedResult.deliveryEstimate
    });
  };

  return (
    <section id="pricing" className="py-12 sm:py-20 relative bg-[#0b0f19] overflow-hidden">
      
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[340px] sm:w-[600px] h-[250px] sm:h-[300px] bg-indigo-600/10 rounded-full blur-[100px] sm:blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4 mb-14">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>باقات اقتصادية وشفافة</span>
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight">
            باقات مدروسة لتناسب ميزانية المحلات
          </h2>
          <p className="text-sm sm:text-base text-slate-400 font-light leading-relaxed">
            أسعار تجريبية واضحة وميسرة لبدء أول خطوة بدون عقود مكلفة، مع إمكانية تفصيل باقتك الخاصة فوراً بالأسفل.
          </p>
        </div>

        {/* 4 Ready-made Packages Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 border ${
                pkg.popular 
                  ? 'border-indigo-500 bg-indigo-950/40 shadow-xl shadow-indigo-500/10 scale-100 sm:scale-105 z-10' 
                  : 'border-slate-800 bg-slate-900/60 hover:-translate-y-1'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3.5 inset-x-0 mx-auto w-max px-3.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-rose-500 text-white text-[11px] font-black shadow-lg shadow-amber-500/30 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  <span>{pkg.badge}</span>
                </div>
              )}

              <div>
                
                {/* Header */}
                <div className="space-y-1 mb-4">
                  <h3 className="text-lg font-black text-white">
                    {pkg.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-light leading-relaxed">
                    {pkg.subtitle}
                  </p>
                </div>

                {/* Price Display */}
                <div className="my-5 pb-5 border-b border-slate-800">
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl sm:text-4xl font-black text-white">
                      {pkg.price}
                    </span>
                    <span className="text-sm font-semibold text-slate-400">ريال</span>
                    {pkg.originalPrice && (
                      <span className="text-xs text-slate-500 line-through mr-1">
                        {pkg.originalPrice} ر.س
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">
                    {pkg.period}
                  </span>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-6">
                  {pkg.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-light">
                      <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>

              </div>

              {/* Card Footer Button */}
              <div className="space-y-2 pt-2 border-t border-slate-800/80">
                <button
                  onClick={() => onSelectPackage(pkg)}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
                    pkg.popular
                      ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30'
                      : 'bg-slate-800 hover:bg-slate-700 text-white'
                  }`}
                >
                  <span>{pkg.buttonText}</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <p className="text-[10px] text-slate-500 text-center font-light">
                  {pkg.terms}
                </p>
              </div>

            </div>
          ))}
        </div>

        {/* ---------------------------------------------------- */}
        {/* Custom Price Calculator Widget */}
        {/* ---------------------------------------------------- */}
        <div id="calculator" className="relative rounded-3xl bg-slate-900/80 border border-indigo-500/30 p-6 sm:p-10 shadow-2xl backdrop-blur-xl">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Controls Column */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 text-indigo-400 text-xs font-bold">
                  <Calculator className="w-4 h-4" />
                  <span>حاسبة الباقات التفاعلية</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-white">
                  فصّل باقتك الخاصة حسب احتياج محلك بالضبط
                </h3>
                <p className="text-xs sm:text-sm text-slate-400 font-light">
                  حدد عدد التصاميم والفيديوهات التي تريدها، واحصل على السعر التقديري فوريّاً بدون انتظار.
                </p>
              </div>

              {/* Slider 1: Designs */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-200">عدد التصاميم الإعلانية المطلوبة:</span>
                  <span className="text-indigo-400 font-black text-base px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/20">
                    {designsCount} تصاميم
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={designsCount}
                  onChange={(e) => setDesignsCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 (بدون تصاميم)</span>
                  <span>10 تصاميم</span>
                  <span>20 تصميم</span>
                </div>
              </div>

              {/* Slider 2: Videos */}
              <div className="space-y-2 p-4 rounded-2xl bg-slate-950/70 border border-slate-800">
                <div className="flex items-center justify-between text-xs sm:text-sm font-semibold">
                  <span className="text-slate-200">عدد مقاطع المونتاج القصيرة (Reels/TikTok):</span>
                  <span className="text-purple-400 font-black text-base px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                    {videosCount} مقاطع
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8"
                  step="1"
                  value={videosCount}
                  onChange={(e) => setVideosCount(Number(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 (بدون مونتاج)</span>
                  <span>4 مقاطع</span>
                  <span>8 مقاطع</span>
                </div>
              </div>

              {/* Toggles for Copywriting & Web */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                
                {/* Copywriting Toggle */}
                <button
                  type="button"
                  onClick={() => setIncludeCopywriting(!includeCopywriting)}
                  className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                    includeCopywriting
                      ? 'bg-indigo-950/50 border-indigo-500 text-white'
                      : 'bg-slate-950/50 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold">كتابة نصوص تسويقية</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${includeCopywriting ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                      {includeCopywriting ? 'مشمول ✓' : 'غير مشمول'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-light">
                    صياغة نصوص إعلانية وكابشن احترافي
                  </p>
                </button>

                {/* Website Option Selector */}
                <div className="p-3 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1.5">
                  <span className="text-xs font-bold text-slate-200 block">هل تحتاج موقع أو متجر؟</span>
                  <select
                    value={websiteType}
                    onChange={(e) => setWebsiteType(e.target.value)}
                    className="w-full py-1.5 px-2 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="none">لا، خدمات محتوى فقط</option>
                    <option value="landing">صفحة هبوط / موقع تعريفي (+199 ر.س)</option>
                    <option value="store">تجهيز متجر سلة/زد متكامل (+349 ر.س)</option>
                  </select>
                </div>

              </div>

            </div>

            {/* Right Summary Card Column */}
            <div className="lg:col-span-5">
              <div className="p-6 sm:p-7 rounded-2xl bg-gradient-to-b from-indigo-950/80 via-slate-900 to-slate-950 border border-indigo-500/40 shadow-xl space-y-6">
                
                <div className="flex items-center justify-between pb-4 border-b border-indigo-900/60">
                  <span className="text-xs font-bold text-indigo-300">ملخص باقتك المحسوبة</span>
                  <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                    تسعير تقديري فوري
                  </span>
                </div>

                {/* Selected Items Breakdown */}
                <div className="space-y-2 text-xs text-slate-300">
                  {designsCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">تصاميم صور وإعلانات:</span>
                      <span className="font-bold text-white">{designsCount} تصاميم</span>
                    </div>
                  )}
                  {videosCount > 0 && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">مونتاج مقاطع ريلز/تيك توك:</span>
                      <span className="font-bold text-white">{videosCount} مقاطع</span>
                    </div>
                  )}
                  {includeCopywriting && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">كتابة المحتوى التسويقي:</span>
                      <span className="font-bold text-indigo-300">مشمولة بالكامل</span>
                    </div>
                  )}
                  {websiteType !== 'none' && (
                    <div className="flex justify-between">
                      <span className="text-slate-400">الواجهة الرقمية:</span>
                      <span className="font-bold text-emerald-400">
                        {websiteType === 'landing' ? 'صفحة هبوط تسويقية' : 'تجهيز متجر سلة/زد'}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-slate-800 text-slate-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      موعد التسليم المتوقع:
                    </span>
                    <span className="font-medium text-white">{calculatedResult.deliveryEstimate}</span>
                  </div>
                </div>

                {/* Big Price Tag */}
                <div className="p-4 rounded-xl bg-slate-950/90 border border-indigo-500/30 text-center space-y-1">
                  <span className="text-xs text-slate-400">إجمالي التكلفة التقديرية</span>
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-indigo-200 to-white">
                      {calculatedResult.price}
                    </span>
                    <span className="text-sm font-bold text-slate-300">ريال سعودي</span>
                  </div>
                  <span className="text-[11px] text-emerald-400 font-medium block">
                    يشمل تعديلاً مضموناً لجميع المواد
                  </span>
                </div>

                {/* Submit button */}
                <button
                  type="button"
                  onClick={handleCustomOrderClick}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>طلب هذه الباقة بالواتساب</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>

              </div>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
