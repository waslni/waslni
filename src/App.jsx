import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ServicesSection from './components/ServicesSection';
import TargetNichesSection from './components/TargetNichesSection';
import InteractivePortfolio from './components/InteractivePortfolio';
import PricingCalculator from './components/PricingCalculator';
import HowItWorksSection from './components/HowItWorksSection';
import FAQSection from './components/FAQSection';
import Footer from './components/Footer';

// Modals
import PackageDetailsModal from './components/PackageDetailsModal';
import AuthModal from './components/AuthModal';
import CustomerDashboardModal from './components/CustomerDashboardModal';
import StaffPortalModal from './components/StaffPortalModal';
import OrderWizardModal from './components/OrderWizardModal';

import { db } from './services/db';
import { MessageCircle, Briefcase, Wrench, Clock, Lock, AlertTriangle } from 'lucide-react';

export default function App() {
  // Resolve the active Supabase identity and role before showing any account UI.
  const [currentUser, setCurrentUser] = useState(null);
  const [settings, setSettings] = useState(db.getSettings());
  const [maintenanceMode, setMaintenanceMode] = useState(() => db.getMaintenanceMode());

  // Modals state
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(() => {
    try { return Boolean(sessionStorage.getItem('waslni_order_confirmation')); }
    catch { return false; }
  });
  const [orderModalData, setOrderModalData] = useState({});

  // New Required Modals
  const [selectedPackageForDetails, setSelectedPackageForDetails] = useState(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState('login'); // 'login' | 'register'
  const [pendingPackageAfterAuth, setPendingPackageAfterAuth] = useState(null);
  
  const [isCustomerDashboardOpen, setIsCustomerDashboardOpen] = useState(false);
  const [isStaffPortalOpen, setIsStaffPortalOpen] = useState(false);

  useEffect(() => {
    db.refreshCurrentUser().then(setCurrentUser);
    const handleAuthChange = () => {
      setCurrentUser(db.getCurrentUser());
    };
    const handleDataChange = (event) => {
      if (event.detail?.key === 'waslni_settings') setSettings(db.getSettings());
    };
    const handleMaintenanceChange = () => {
      setMaintenanceMode(db.getMaintenanceMode());
    };
    const handleStorageChange = (e) => {
      if (e.key === 'waslni_current_user') setCurrentUser(db.getCurrentUser());
      if (e.key === 'waslni_settings') setSettings(db.getSettings());
      if (e.key === 'waslni_maintenance_mode') setMaintenanceMode(db.getMaintenanceMode());
      window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key: e.key } }));
    };

    window.addEventListener('waslni_auth_changed', handleAuthChange);
    window.addEventListener('waslni_data_changed', handleDataChange);
    window.addEventListener('waslni_maintenance_changed', handleMaintenanceChange);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('waslni_auth_changed', handleAuthChange);
      window.removeEventListener('waslni_data_changed', handleDataChange);
      window.removeEventListener('waslni_maintenance_changed', handleMaintenanceChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // When customer clicks any package in Pricing or Hero:
  // We direct them directly to the OrderWizardModal with the chosen package selected
  const handleSelectPackage = (pkg) => {
    if (!currentUser) {
      setPendingPackageAfterAuth(pkg);
      setAuthMode('register');
      setIsAuthModalOpen(true);
      return;
    }
    handleOpenOrderModal({ packageId: pkg.id });
  };

  const handleRequestAuthFromPackage = (pkg) => {
    setPendingPackageAfterAuth(pkg);
    setAuthMode('register'); // Show registration first for new customer
    setIsAuthModalOpen(true);
  };

  const handleAuthSuccess = (user, intendedPkg) => {
    setCurrentUser(user);
    if (intendedPkg) {
      setPendingPackageAfterAuth(null);
      handleOpenOrderModal(intendedPkg.id ? { packageId: intendedPkg.id } : intendedPkg);
    }
  };

  const handleOpenOrderModal = (data = {}) => {
    if (!currentUser) {
      setPendingPackageAfterAuth(data);
      setAuthMode('register');
      setIsAuthModalOpen(true);
      return;
    }
    setOrderModalData(data);
    setIsOrderModalOpen(true);
  };

  const handleCloseOrderModal = () => {
    try { sessionStorage.removeItem('waslni_order_confirmation'); } catch { /* session storage may be unavailable */ }
    setIsOrderModalOpen(false);
  };

  const handleSelectService = (service) => {
    handleOpenOrderModal({
      serviceId: service.id,
      note: `أرغب في الاستفسار وطلب خدمة: ${service.title}`
    });
  };

  const handleCustomOrder = (customData) => {
    handleOpenOrderModal({
      isCustom: true,
      ...customData,
      note: `طلب باقة مخصصة: ${customData.designsCount} تصاميم + ${customData.videosCount} فيديوهات (السعر التقديري: ${customData.estimatedPrice} ر.س)`
    });
  };

  const isStaff = currentUser && (currentUser.role === 'employee' || currentUser.role === 'manager');
  const cleanWhatsapp = (settings.whatsappNumber || '966558840806').replace(/[^0-9]/g, '');

  // ==========================================================================
  // شاشة وضع الصيانة للزوار والعملاء (Maintenance Mode Screen)
  // تظهر عندما يغلق المدير الموقع للصيانة، مع زر واتساب واختصار دخول الإدارة
  // ==========================================================================
  if (maintenanceMode.enabled && !isStaff) {
    return (
      <div className="min-h-screen bg-[#0b0f19] text-white flex flex-col justify-between items-center p-4 sm:p-8 relative overflow-hidden font-sans">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-indigo-600/15 rounded-full blur-[90px] sm:blur-[140px] pointer-events-none" />
        <div className="absolute bottom-10 right-4 sm:right-10 w-60 sm:w-80 h-60 sm:h-80 bg-purple-600/10 rounded-full blur-[80px] sm:blur-[120px] pointer-events-none" />

        {/* Top Header Logo */}
        <header className="relative z-10 w-full max-w-4xl flex items-center justify-between pt-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-lg shadow-indigo-600/30">
              و
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-white">وصلني | Waslni</h1>
              <p className="text-[11px] text-slate-400">خدماتك الرقمية والتسويقية في مكان واحد</p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5 animate-spin" />
            <span>تحت الصيانة والتطوير</span>
          </span>
        </header>

        {/* Central Content */}
        <div className="relative z-10 max-w-lg w-full text-center my-auto py-8 space-y-6">
          <div className="w-20 h-20 rounded-3xl bg-slate-900/90 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center text-3xl shadow-2xl shadow-amber-950/40">
            ⏳
          </div>

          <div className="space-y-3">
            <h2 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              الموقع في وضع الصيانة الدورية
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed max-w-md mx-auto">
              {maintenanceMode.message || 'الموقع حالياً تحت الصيانة الدورية وتطوير الخوادم، سنعود إليكم قريباً جداً ⏳'}
            </p>
          </div>

          {/* Estimated Return Box */}
          <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 flex items-center justify-center gap-2">
            <Clock className="w-4 h-4 text-indigo-400" />
            <span>الوقت التقديري للعودة: <strong className="text-amber-300">{maintenanceMode.estimatedReturn || 'خلال وقت قصير'}</strong></span>
          </div>

          {/* WhatsApp Direct Action */}
          <div className="pt-2 space-y-3">
            <a
              href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('مرحباً فريق وصلني، أود الاستفسار وطلب خدمة أثناء فترة الصيانة')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-xl shadow-emerald-950/50 flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
            >
              <MessageCircle className="w-5 h-5" />
              <span>تواصل معنا عبر الواتساب للاستفسارات والطلبات العاجلة</span>
            </a>
          </div>
        </div>

        {/* Discreet Staff Login Footer */}
        <footer className="relative z-10 w-full max-w-4xl pt-6 pb-2 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
          <span>جميع الحقوق محفوظة © 2026 وصلني للخدمات الرقمية</span>
          <button
            onClick={() => {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }}
            className="flex items-center gap-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer py-1 px-2.5 rounded-lg hover:bg-slate-800"
          >
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>تسجيل دخول الإدارة وفريق العمل</span>
          </button>
        </footer>

        {/* Staff / Manager Login Modal */}
        <AuthModal 
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onSuccess={handleAuthSuccess}
          initialMode={authMode}
          intendedPackage={null}
          maintenanceMode={maintenanceMode.enabled}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0f19] text-[#e2e8f0] font-sans selection:bg-indigo-600 selection:text-white pb-16 sm:pb-0">
      
      {/* Top Banner when Maintenance Mode is ON for Staff */}
      {maintenanceMode.enabled && isStaff && (
        <div className="bg-gradient-to-r from-amber-600 via-rose-600 to-amber-600 text-white text-xs font-bold py-2.5 px-4 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xl sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 animate-bounce text-amber-200" />
            <span>⚠️ تنبيه: وضع الصيانة مفعّل حالياً - الموقع محجوب بالكامل عن الزوار والعملاء.</span>
          </div>
          <button
            onClick={() => {
              db.toggleMaintenanceMode(false);
              setMaintenanceMode(db.getMaintenanceMode());
            }}
            className="px-3.5 py-1 bg-black/50 hover:bg-black/80 rounded-lg text-white text-[11px] font-bold cursor-pointer transition-colors shadow-sm"
          >
            إلغاء وضع الصيانة وفتح الموقع فوراً
          </button>
        </div>
      )}
      
      {/* Navigation */}
      <Navbar 
        currentUser={currentUser}
        onOpenAuthModal={(mode) => {
          setAuthMode(mode || 'login');
          setPendingPackageAfterAuth(null);
          setIsAuthModalOpen(true);
        }}
        onOpenCustomerDashboard={() => setIsCustomerDashboardOpen(true)}
        onOpenStaffPortal={() => setIsStaffPortalOpen(true)}
        onOpenOrderModal={() => handleOpenOrderModal()}
      />

      {/* Main Content Sections */}
      <main>
        <HeroSection 
          onOpenOrderModal={handleOpenOrderModal}
          onOpenCalculator={() => {
            const el = document.getElementById('calculator');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        <ServicesSection 
          onSelectService={handleSelectService}
        />

        <TargetNichesSection 
          onOpenOrderModal={handleOpenOrderModal}
        />

        <InteractivePortfolio 
          onOpenOrderModal={handleOpenOrderModal}
        />

        <PricingCalculator 
          onSelectPackage={handleSelectPackage}
          onCustomOrderSubmit={handleCustomOrder}
        />

        <HowItWorksSection 
          onOpenOrderModal={() => handleOpenOrderModal()}
        />

        <FAQSection 
          onOpenOrderModal={handleOpenOrderModal}
        />
      </main>

      {/* Footer */}
      <Footer 
        currentUser={currentUser}
        onOpenOrderModal={() => handleOpenOrderModal()}
        onOpenCustomerDashboard={() => setIsCustomerDashboardOpen(true)}
        onOpenAuthModal={(m) => handleOpenAuth(m)}
      />

      {/* ============================================================ */}
      {/* FLOATING ACTION PILLS (Optimized for Mobile & Desktop) */}
      {/* ============================================================ */}
      <aside aria-label="تواصل واختصارات" className="fixed bottom-4 sm:bottom-6 left-4 sm:left-6 z-40 flex items-center gap-2">
        <a
          href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent('مرحباً فريق وصلني، أود الاستفسار عن خدمات التسويق والمحتوى لمحلّي التجاري')}`}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-950/50 hover:scale-105 transition-all duration-300"
          title="تواصل مباشر عبر الواتساب"
        >
          <MessageCircle className="w-4 sm:w-5 h-4 sm:h-5" />
          <span className="hidden xs:inline">واتساب الدعم والتحويل</span>
        </a>

        {/* Quick Staff Portal trigger pill for fast access */}
        <button
          onClick={() => {
            if (isStaff) {
              setIsStaffPortalOpen(true);
            } else {
              setAuthMode('login');
              setIsAuthModalOpen(true);
            }
          }}
          className="p-2.5 sm:p-3 rounded-full bg-slate-900/90 hover:bg-slate-800 text-amber-300 border border-slate-700/80 shadow-lg hover:scale-105 transition-all cursor-pointer"
          title="بوابة الموظف والمدير"
        >
          <Briefcase className="w-4 sm:w-5 h-4 sm:h-5" />
        </button>
      </aside>

      {/* ============================================================ */}
      {/* MODALS */}
      {/* ============================================================ */}
      
      {/* 1. Package Details Modal (shows details first, then redirects to auth or WhatsApp) */}
      <PackageDetailsModal 
        isOpen={Boolean(selectedPackageForDetails)}
        onClose={() => setSelectedPackageForDetails(null)}
        packageItem={selectedPackageForDetails}
        currentUser={currentUser}
        onRequestAuth={(pkg) => handleRequestAuthFromPackage(pkg)}
        onOrderCreated={() => {
          setSelectedPackageForDetails(null);
          setIsCustomerDashboardOpen(true);
        }}
      />

      {/* 2. Customer & Staff Authentication Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        initialMode={authMode}
        intendedPackage={pendingPackageAfterAuth}
        maintenanceMode={maintenanceMode.enabled}
      />

      {/* 3. Customer Dashboard & Previous Purchases */}
      <CustomerDashboardModal 
        isOpen={isCustomerDashboardOpen}
        onClose={() => setIsCustomerDashboardOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          db.logout();
          setCurrentUser(null);
        }}
      />

      {/* 4. Staff Portal (Employee & Manager Dashboard) */}
      <StaffPortalModal 
        isOpen={isStaffPortalOpen}
        onClose={() => setIsStaffPortalOpen(false)}
        currentUser={currentUser}
        onLogout={() => {
          db.logout();
          setCurrentUser(null);
        }}
      />

      {/* 5. General Order Wizard */}
      <OrderWizardModal 
        isOpen={isOrderModalOpen}
        onClose={handleCloseOrderModal}
        initialData={orderModalData}
        currentUser={currentUser}
        onOrderCreated={(createdOrder) => {
          handleCloseOrderModal();
          setIsCustomerDashboardOpen(true);
        }}
      />

    </div>
  );
}
