import React, { useState } from 'react';
import { 
  Sparkles, 
  Search, 
  Menu, 
  X,
  User,
  Briefcase,
  LogIn,
  FileText,
  Eye,
  Download,
  Package
} from 'lucide-react';

export default function Navbar({ 
  currentUser, 
  onOpenAuthModal, 
  onOpenCustomerDashboard, 
  onOpenStaffPortal, 
  onOpenOrderModal, 
  onOpenTrackerModal 
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'الخدمات', href: '#services' },
    { label: 'الفئات المستهدفة', href: '#niches' },
    { label: 'معرض الأعمال', href: '#portfolio' },
    { label: 'الباقات والأسعار', href: '#pricing' },
    { label: 'حاسبة التكلفة', href: '#calculator' },
    { label: 'كيف نعمل', href: '#how-it-works' },
    { label: 'الأسئلة الشائعة', href: '#faqs' },
  ];

  const isStaff = currentUser && (currentUser.role === 'employee' || currentUser.role === 'manager');

  return (
    <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0b0f19]/90 border-b border-slate-800/80 transition-all duration-300">
      
      {/* Top micro-announcement banner with smooth animated marquee */}
      <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border-b border-indigo-800/40 py-1.5 text-[11px] sm:text-xs text-indigo-200 overflow-hidden relative shadow-inner select-none">
        <div className="marquee-container">
          <div className="marquee-content">
            {[1, 2, 3].map((itemIndex) => (
              <div key={itemIndex} className="inline-flex items-center gap-2.5 shrink-0">
                <span className="flex h-2 w-2 relative shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="font-black text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30 text-[10px]">
                  🔥 عرض المحلات
                </span>
                <span className="font-semibold text-white">
                  باقة المحتوى الإعلاني الماسي (5 تصاميم + ريلز + نصوص) بـ <strong className="text-amber-300 font-black font-mono text-xs">99 ر.س</strong> فقط!
                </span>
                <button 
                  onClick={() => onOpenOrderModal({ packageId: 'pkg_launch' })}
                  className="px-2.5 py-0.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-sm hover:scale-105"
                >
                  اطلب الآن ⚡
                </button>
                <span className="text-indigo-400/50 mx-3">•</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-18 sm:h-20">
          
          {/* Logo & Brand Identity */}
          <div className="flex items-center gap-2 sm:gap-3">
            <a href="#" className="flex items-center gap-2 sm:gap-3 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-600/25 group-hover:scale-105 transition-transform duration-300 border border-indigo-400/30 shrink-0">
                <span className="text-xl sm:text-2xl font-black text-white tracking-tighter">و</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-white group-hover:text-indigo-300 transition-colors">
                    وصلني
                  </span>
                  <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 hidden xs:inline">
                    Waslni
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-medium hidden md:inline">
                  خدماتك الرقمية في مكان واحد
                </span>
              </div>
            </a>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden xl:flex items-center gap-1">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs sm:text-sm font-medium text-slate-300 hover:text-indigo-400 px-2.5 py-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Action CTA Buttons & User State */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            
            {/* User Account / Staff Button */}
            {currentUser ? (
              <div className="flex items-center gap-1.5">
                {isStaff ? (
                  <button
                    onClick={onOpenStaffPortal}
                    className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition-all cursor-pointer ${
                      currentUser.role === 'manager'
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border-amber-500/40 shadow-sm'
                        : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border-indigo-500/40'
                    }`}
                  >
                    <Briefcase className="w-3.5 h-3.5" />
                    <span>{currentUser.role === 'manager' ? '👑 لوحة المدير العام' : '💼 لوحة الموظف'}</span>
                  </button>
                ) : (
                  <button
                    onClick={onOpenCustomerDashboard}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 text-indigo-300 border border-indigo-500/30 transition-all cursor-pointer"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span className="max-w-[100px] truncate">{currentUser.name} (طلباتي)</span>
                  </button>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuthModal('login')}
                className="flex items-center gap-1 text-xs font-semibold px-2.5 sm:px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700/80 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                <span>دخول / تسجيل</span>
              </button>
            )}

            {/* Customer Dashboard / Orders Button */}
            <button
              onClick={() => currentUser ? onOpenCustomerDashboard() : onOpenAuthModal('login')}
              className="hidden sm:flex items-center gap-1.5 text-xs font-bold text-slate-300 hover:text-white px-3 py-2 rounded-xl bg-slate-900 border border-slate-700/80 hover:border-slate-600 transition-all cursor-pointer"
              title="عرض حسابي ومتابعة طلباتي"
            >
              <Package className="w-3.5 h-3.5 text-indigo-400" />
              <span>طلباتي</span>
            </button>

            {/* User Guide Button - Staff (Manager & Employee) */}
            {isStaff && (
              <a
                href="/WASLNI_USER_GUIDE.html"
                target="_blank"
                rel="noreferrer"
                className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-amber-300 hover:text-white px-3 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all shadow-sm"
                title="عرض دليل المنصة التعريفي"
              >
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                <span>دليل المنصة</span>
              </a>
            )}

            {/* Direct Order Button */}
            <button
              onClick={() => onOpenOrderModal()}
              className="relative inline-flex items-center justify-center gap-1.5 px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-bold text-white rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>اطلب الآن</span>
            </button>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="القائمة"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile & Tablet Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#0e1424] border-b border-slate-800 px-4 pt-3 pb-6 space-y-2.5 shadow-2xl animate-fadeIn">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-slate-200 hover:text-indigo-400 px-3 py-2 rounded-lg hover:bg-slate-800/80 transition-colors"
            >
              {link.label}
            </a>
          ))}

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-2">
            {currentUser ? (
              isStaff ? (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenStaffPortal(); }}
                  className={`w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold rounded-xl border ${
                    currentUser.role === 'manager'
                      ? 'text-amber-300 bg-amber-500/20 border-amber-500/30'
                      : 'text-indigo-300 bg-indigo-500/20 border-indigo-500/30'
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>{currentUser.role === 'manager' ? '👑 فتح لوحة المدير العام' : '💼 فتح لوحة تحكم الموظف'}</span>
                </button>
              ) : (
                <button
                  onClick={() => { setMobileMenuOpen(false); onOpenCustomerDashboard(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-500/30 rounded-xl"
                >
                  <User className="w-4 h-4" />
                  حسابي وطلباتي السابقة ({currentUser.name})
                </button>
              )
            ) : (
              <button
                onClick={() => { setMobileMenuOpen(false); onOpenAuthModal('login'); }}
                className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-200 bg-slate-900 border border-slate-700 rounded-xl"
              >
                <LogIn className="w-4 h-4 text-indigo-400" />
                تسجيل الدخول / إنشاء حساب زبون
              </button>
            )}

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                if (currentUser) {
                  onOpenCustomerDashboard();
                } else {
                  onOpenAuthModal('login');
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 text-xs font-bold text-slate-300 bg-slate-900 border border-slate-700 rounded-xl"
            >
              <Package className="w-4 h-4 text-indigo-400" />
              حسابي وطلباتي 📦
            </button>

            {isStaff && (
              <div className="flex gap-2">
                <a
                  href="/WASLNI_USER_GUIDE.html"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 rounded-xl transition-colors hover:bg-amber-500/25"
                >
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>عرض دليل المنصة</span>
                </a>
                <a
                  href="/WASLNI_USER_GUIDE.pdf"
                  download="WASLNI_USER_GUIDE.pdf"
                  target="_blank"
                  rel="noreferrer"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 rounded-xl transition-colors hover:bg-emerald-500/25"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  <span>تحميل PDF</span>
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
