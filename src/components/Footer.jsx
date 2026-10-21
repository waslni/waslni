import React from 'react';
import { Sparkles, Shield, Clock } from 'lucide-react';

export default function Footer({ currentUser, onOpenOrderModal, onOpenCustomerDashboard, onOpenAuthModal }) {
  const isStaff = currentUser && (currentUser.role === 'employee' || currentUser.role === 'manager');
  return (
    <footer className="bg-[#070a12] border-t border-slate-800/80 text-slate-400 text-xs sm:text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
                و
              </div>
              <div>
                <span className="text-xl font-black text-white">وصلني | Waslni</span>
                <p className="text-[11px] text-indigo-400 font-medium">خدماتك الرقمية في مكان واحد</p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-light max-w-sm">
              مشروع سعودي يهدف إلى مساعدة أصحاب المحلات التجارية والأنشطة الصغيرة على تعزيز حضورهم الرقمي وزيادة مبيعاتهم من خلال تصاميم إعلانية ومونتاج ريلز ومواقع إلكترونية بتكلفة مناسبة وبدون تشتت.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={() => onOpenOrderModal()}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>طلب خدمة فورية</span>
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              روابط سريعة
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#services" className="hover:text-indigo-400 transition-colors">الخدمات الرقمية</a></li>
              <li><a href="#niches" className="hover:text-indigo-400 transition-colors">الفئات والأنشطة المستهدفة</a></li>
              <li><a href="#portfolio" className="hover:text-indigo-400 transition-colors">معرض الأعمال</a></li>
              <li><a href="#pricing" className="hover:text-indigo-400 transition-colors">الباقات والأسعار</a></li>
              <li><a href="#calculator" className="hover:text-indigo-400 transition-colors">حاسبة الباقات التفاعلية</a></li>
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              أبرز الخدمات
            </h4>
            <ul className="space-y-2 text-xs">
              <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onOpenOrderModal({ serviceId: 'designs' })}>تصميم الإعلانات والبوستات</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onOpenOrderModal({ serviceId: 'videos' })}>مونتاج مقاطع ريلز وتيك توك</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onOpenOrderModal({ serviceId: 'websites' })}>مواقع وصفحات هبوط للمحلات</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onOpenOrderModal({ serviceId: 'stores' })}>تجهيز متجر سلة وزد</span></li>
              <li><span className="hover:text-white transition-colors cursor-pointer" onClick={() => onOpenOrderModal({ serviceId: 'copywriting' })}>كتابة المحتوى التسويقي</span></li>
            </ul>
          </div>

          {/* Guarantees & Support */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              الضمان والشفافية
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-400" />
                <span>تعديل متفق عليه ومضمون</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-sky-400" />
                <span>تسليم سريع في الموعد</span>
              </div>
              <div className="pt-2">
                <button
                  onClick={() => currentUser ? onOpenCustomerDashboard() : onOpenAuthModal('login')}
                  className="text-xs text-indigo-400 hover:text-indigo-300 underline font-bold block cursor-pointer"
                >
                  حسابي ومتابعة طلباتي 📦
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>
            جميع الحقوق محفوظة © 2026 وصلني — Waslni.
          </p>
          <div className="flex items-center gap-1">
            <span>صُمم خصيصاً لدعم المشاريع والأنشطة التجارية في السعودية</span>
            <span className="text-emerald-400 font-bold">🇸🇦</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
