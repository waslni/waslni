import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { BRAND_INFO, SERVICES, TARGET_NICHES } from '../data/waslniData';
import { db } from '../services/db';
import { 
  X, 
  Sparkles, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  MessageCircle, 
  Copy, 
  Check,
  ShieldAlert,
  User,
  Store,
  Phone,
  FileText,
  Package
} from 'lucide-react';

export default function OrderWizardModal({ isOpen, onClose, initialData = {}, onOrderCreated, currentUser: propCurrentUser }) {
  const [step, setStep] = useState(1);
  const [packages, setPackages] = useState(() => db.getPackages());
  const [selectedService, setSelectedService] = useState('pkg_launch');
  const [storeType, setStoreType] = useState('perfumes');
  const [customStoreType, setCustomStoreType] = useState('');
  const [clientName, setClientName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [formError, setFormError] = useState('');
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  // Sync with live packages when database updates
  useEffect(() => {
    const handleSync = (event) => {
      if (!event.detail?.key || event.detail.key === 'waslni_packages') setPackages(db.getPackages());
    };
    window.addEventListener('waslni_data_changed', handleSync);
    return () => window.removeEventListener('waslni_data_changed', handleSync);
  }, []);

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only reset form state when transitioning from CLOSED to OPEN!
    if (isOpen && !prevIsOpenRef.current) {
      setCopied(false);
      setFormError('');
      setPackages(db.getPackages());

      let savedConfirmation = null;
      try {
        savedConfirmation = JSON.parse(sessionStorage.getItem('waslni_order_confirmation') || 'null');
      } catch { /* Ignore damaged or unavailable session storage. */ }

      if (savedConfirmation?.orderNumber) {
        setCreatedOrder(savedConfirmation);
        setStep(3);
        setClientName(savedConfirmation.customerName || '');
        setClientPhone(savedConfirmation.customerPhone || '');
        setStoreName(savedConfirmation.storeName || '');
        setNotes(savedConfirmation.notes || '');
        return;
      }

      setStep(1);
      setCreatedOrder(null);

      // Pre-fill from current user if logged in
      const currentUser = db.getCurrentUser();
      if (currentUser) {
        if (currentUser.name) setClientName(currentUser.name);
        if (currentUser.phone) setClientPhone(currentUser.phone);
        if (currentUser.storeName) setStoreName(currentUser.storeName);
        if (currentUser.storeType) setStoreType(currentUser.storeType);
      }

      if (initialData?.packageId) {
        setSelectedService(initialData.packageId);
      } else if (initialData?.serviceId) {
        setSelectedService(initialData.serviceId);
      }
      if (initialData?.nicheId) {
        setStoreType(initialData.nicheId);
      }
      if (initialData?.note) {
        setNotes(initialData.note);
      }
    }
    prevIsOpenRef.current = Boolean(isOpen);
  }, [isOpen]);

  if (!isOpen) return null;

  const settings = db.getSettings();
  const cleanWhatsapp = (settings.whatsappNumber || '966558840806').replace(/[^0-9]/g, '');

  // Selected Service Name formatting
  const getSelectedServiceLabel = () => {
    const pkg = packages.find(p => p.id === selectedService);
    if (pkg) return `${pkg.name} (${pkg.price} ر.س)`;
    const srv = SERVICES.find(s => s.id === selectedService);
    if (srv) return `${srv.title} (${srv.priceEstimate})`;
    if (initialData.isCustom) {
      return `باقة مخصصة: ${initialData.designsCount} تصاميم + ${initialData.videosCount} فيديوهات (${initialData.estimatedPrice} ر.س)`;
    }
    return 'طلب خدمة مخصصة';
  };

  const getStoreTypeLabel = () => {
    if (storeType === 'other') {
      return customStoreType.trim() || 'نشاط تجاري مخصص';
    }
    const niche = TARGET_NICHES.find(n => n.id === storeType);
    return niche ? niche.title : storeType;
  };

  // Pre-formatted WhatsApp Message string - Exactly matches order number and details
  const generateWhatsAppMessage = (order = createdOrder) => {
    const ordNum = order?.orderNumber || 'WS-PENDING';
    const ordAmount = order?.amount ?? 99;
    const pkgName = order?.packageName || getSelectedServiceLabel();

    const text = `فاتورة طلب خدمة — منصة وصلني
العميل: ${order?.customerName || clientName}
رقم الجوال: ${order?.customerPhone || clientPhone}
رقم الطلب: ${ordNum}
حالة الطلب: معلّق بانتظار الدفع

الباقة: ${pkgName}
المبلغ المستحق: ${ordAmount} ر.س
المتجر: ${order?.storeName || storeName}
نوع النشاط: ${order?.storeType || getStoreTypeLabel()}
تفاصيل الطلب: ${order?.notes || notes}

يرجى تزويدي ببيانات التحويل. سأرسل إيصال الدفع بعد إتمام التحويل. شكراً لكم.`;
    return encodeURIComponent(text);
  };

  // Strict Validation: Cannot submit order with empty fields
  const handleFinish = async () => {
    if (isCreatingOrder) return;
    setFormError('');

    if (storeType === 'other' && !customStoreType.trim()) {
      setFormError('يرجى كتابة وتحديد نشاط محلك التجاري أولاً للمتابعة');
      setStep(1);
      return;
    }

    if (!clientName.trim()) {
      setFormError('يرجى إدخال اسمك الكامل أو اسم المسؤول عن الطلب');
      return;
    }

    if (!storeName.trim()) {
      setFormError('يرجى إدخال اسم المحل أو علامتك التجارية');
      return;
    }

    const cleanDigits = clientPhone.trim().replace(/[^0-9]/g, '');
    if (!cleanDigits || cleanDigits.length < 9) {
      setFormError('يرجى إدخال رقم جوال واتساب صحيح مكون من 9 إلى 10 أرقام على الأقل');
      return;
    }

    if (!notes.trim() || notes.trim().length < 5) {
      setFormError('يرجى كتابة تفاصيل أو ملاحظات حول الخدمة والمطلوب تنفيذه (5 أحرف على الأقل)');
      return;
    }

    // Determine package details
    const pkg = packages.find(p => p.id === selectedService);
    const amount = pkg ? pkg.price : (initialData.estimatedPrice ?? 99);
    const packageName = pkg ? pkg.name : getSelectedServiceLabel();
    const currentUser = db.getCurrentUser();

    // Create the order in the database with matching order number & security code
    setIsCreatingOrder(true);
    let newOrder;
    try {
      newOrder = await db.createOrder({
        customer: {
          id: currentUser ? currentUser.id : `usr_${cleanDigits}`,
          role: currentUser?.role || 'customer',
          name: clientName.trim(),
          phone: cleanDigits,
          storeName: storeName.trim(),
          storeType: getStoreTypeLabel()
        },
        packageItem: {
          id: selectedService || 'custom',
          name: packageName,
          price: amount
        },
        amount,
        storeName: storeName.trim(),
        storeType: getStoreTypeLabel(),
        notes: notes.trim()
      });
    } catch {
      setFormError('تعذر حفظ الطلب. تحقق من اتصال الموقع وحاول مرة أخرى.');
      return;
    } finally {
      setIsCreatingOrder(false);
    }

    if (newOrder?.success === false) {
      setFormError(newOrder.message);
      return;
    }

    try {
      sessionStorage.setItem('waslni_order_confirmation', JSON.stringify(newOrder));
    } catch { /* The on-screen confirmation still works if session storage is unavailable. */ }
    setCreatedOrder(newOrder);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
    setStep(3);
  };

  const handleCopy = () => {
    const decodedMessage = decodeURIComponent(generateWhatsAppMessage());
    navigator.clipboard.writeText(decodedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsAppDirect = () => {
    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${generateWhatsAppMessage()}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl bg-[#0e1322] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))', height: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-slate-800 bg-slate-900/50 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shrink-0 text-sm sm:text-base">
              و
            </div>
            <div className="min-w-0">
              <h3 className="text-sm sm:text-lg font-black text-white truncate">
                {step === 3 ? 'تم تجهيز طلبك بنجاح 🎉' : 'طلب خدمة من وصلني'}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-400 truncate">
                {step === 1 && 'الخطوة 1 من 2: اختيار الخدمة ونوع النشاط'}
                {step === 2 && 'الخطوة 2 من 2: بيانات المحل والملاحظات'}
                {step === 3 && `رقم التتبع: ${createdOrder?.orderNumber || 'WS-PENDING'}`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="px-4 py-4 sm:p-6 overflow-y-auto flex-1 space-y-5 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
          
          {/* STEP 1: Select Service & Store Type */}
          {step === 1 && (
            <div className="space-y-5">
              
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-bounce">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              
              {/* Select Service/Package */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  اختر الباقة أو الخدمة المراد طلبها:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {packages.map((pkg) => {
                    const isSelected = selectedService === pkg.id;
                    return (
                      <button
                        type="button"
                        key={pkg.id}
                        onClick={() => {
                          setSelectedService(pkg.id);
                          setFormError('');
                        }}
                        className={`p-3.5 rounded-2xl border text-right transition-all flex flex-col justify-between cursor-pointer relative overflow-hidden ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 border-2 border-indigo-400 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-600/30 scale-[1.01]'
                            : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/90'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className={`text-xs sm:text-sm font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                            {pkg.name}
                          </span>
                          {isSelected ? (
                            <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-2 py-0.5 rounded-full shrink-0">
                              <Check className="w-3 h-3" /> تم الاختيار
                            </span>
                          ) : pkg.badge ? (
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 px-1.5 py-0.5 rounded font-bold border border-amber-400/30 shrink-0">
                              {pkg.badge}
                            </span>
                          ) : null}
                        </div>

                        {pkg.subtitle && (
                          <p className="text-[11px] text-slate-400 line-clamp-1 mb-2">
                            {pkg.subtitle}
                          </p>
                        )}

                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-800/60">
                          <div className="flex items-baseline gap-1.5">
                            <span className={`text-sm font-black font-mono ${isSelected ? 'text-emerald-400' : 'text-indigo-400'}`}>
                              {pkg.price} ر.س
                            </span>
                            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                              <span className="text-[10px] text-slate-500 line-through font-mono">
                                {pkg.originalPrice} ر.س
                              </span>
                            )}
                          </div>
                          {pkg.period && (
                            <span className="text-[10px] text-slate-400">
                              {pkg.period}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Prominent Selected Package Full Details Box */}
                {(() => {
                  const selectedPkg = packages.find(p => p.id === selectedService);
                  if (!selectedPkg) return null;
                  return (
                    <div className="mt-3 p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-purple-950/50 border border-indigo-500/50 shadow-lg shadow-indigo-950/40 space-y-2.5 animate-fadeIn">
                      {/* Compact Header with Price */}
                      <div className="flex items-center justify-between gap-2 pb-2 border-b border-indigo-500/20">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <Package className="w-4 h-4 text-indigo-400 shrink-0" />
                            <h4 className="text-xs sm:text-sm font-black text-white truncate">{selectedPkg.name}</h4>
                          </div>
                          {selectedPkg.subtitle && (
                            <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{selectedPkg.subtitle}</p>
                          )}
                        </div>
                        <div className="text-left shrink-0">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-base sm:text-xl font-black text-emerald-400 font-mono">
                              {selectedPkg.price} <span className="text-[10px] text-emerald-300">ر.س</span>
                            </span>
                            {selectedPkg.originalPrice && selectedPkg.originalPrice > selectedPkg.price && (
                              <span className="text-[10px] text-slate-500 line-through font-mono">
                                {selectedPkg.originalPrice}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1 justify-start">
                            {selectedPkg.originalPrice && selectedPkg.originalPrice > selectedPkg.price && (
                              <span className="text-[9px] font-bold text-amber-300 bg-amber-500/20 px-1 py-0.5 rounded">
                                وفّر {selectedPkg.originalPrice - selectedPkg.price} ر.س
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Features Checklist - compact */}
                      {Array.isArray(selectedPkg.features) && selectedPkg.features.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-bold text-indigo-300 flex items-center gap-1">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>تشمل الباقة:</span>
                            {selectedPkg.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/20 mr-auto">
                                {selectedPkg.badge}
                              </span>
                            )}
                          </span>
                          <div className="grid grid-cols-1 gap-1 bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/80 max-h-28 sm:max-h-40 overflow-y-auto overscroll-contain">
                            {selectedPkg.features.map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-1.5 text-[11px] sm:text-xs text-slate-200">
                                <span className="text-emerald-400 font-black shrink-0 mt-px">✓</span>
                                <span className="leading-snug">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Terms - single compact line */}
                      {selectedPkg.terms && (
                        <div className="p-2 rounded-lg bg-amber-950/20 border border-amber-500/20 text-[10px] sm:text-[11px] text-amber-200 flex items-start gap-1.5">
                          <span className="text-amber-400 shrink-0">⚠️</span>
                          <span><b className="text-amber-300">ملاحظة:</b> {selectedPkg.terms}</span>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Select Business Type */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-2">
                  ما هو نشاط محلك التجاري؟
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {TARGET_NICHES.filter(niche => db.isCategoryVisible(niche.id)).map((niche) => (
                    <button
                      type="button"
                      key={niche.id}
                      onClick={() => { setStoreType(niche.id); setFormError(''); }}
                      className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                        storeType === niche.id
                          ? 'bg-purple-950/60 border-purple-500 text-white font-bold'
                          : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {niche.title}
                    </button>
                  ))}

                  {/* Option for Other / Custom Activity */}
                  <button
                    type="button"
                    onClick={() => { setStoreType('other'); setFormError(''); }}
                    className={`p-2.5 rounded-xl border text-xs font-medium text-center transition-all cursor-pointer ${
                      storeType === 'other'
                        ? 'bg-amber-950/60 border-amber-500 text-amber-200 font-bold ring-2 ring-amber-500/30'
                        : 'bg-slate-900/50 border-slate-800 text-amber-400 hover:text-white'
                    }`}
                  >
                    ✨ نشاط آخر (غير مدرج)
                  </button>
                </div>

                {/* Custom Activity Text Input when "other" is selected */}
                {storeType === 'other' && (
                  <div className="mt-3 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 animate-fadeIn space-y-1.5">
                    <label className="block text-xs font-bold text-amber-300 flex items-center justify-between">
                      <span>اكتب نشاط محلك التجاري بالتفصيل:</span>
                      <span className="text-rose-400 text-[11px]">* إلزامي</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مغسلة سيارات، صالون تجميل، عيادة أسنان، عقارات، إلكترونيات، صيانة..."
                      value={customStoreType}
                      onChange={(e) => { setCustomStoreType(e.target.value); setFormError(''); }}
                      className="w-full p-2.5 rounded-xl bg-slate-900 border border-amber-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 2: Store Info & Notes (Strict Validation Required) */}
          {step === 2 && (
            <div className="space-y-4">
              
              {formError && (
                <div className="p-3.5 rounded-2xl bg-rose-950/60 border border-rose-500/50 text-rose-300 text-xs font-bold flex items-center gap-2.5 animate-bounce">
                  <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-400" />
                  <span>اسمك الكامل (صاحب المحل / المسوق):</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: عبدالله السبيعي"
                  value={clientName}
                  onChange={(e) => { setClientName(e.target.value); setFormError(''); }}
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                    formError && !clientName.trim()
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-indigo-400" />
                  <span>اسم المحل أو علامتك التجارية:</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: بوتيك الأناقة، كافيه رشفة، عطور السلطان..."
                  value={storeName}
                  onChange={(e) => { setStoreName(e.target.value); setFormError(''); }}
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none transition-all ${
                    formError && !storeName.trim()
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5 text-indigo-400" />
                  <span>رقم جوال الواتساب للتواصل ومتابعة التسليم:</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="مثال: 0558840806"
                  value={clientPhone}
                  onChange={(e) => { setClientPhone(e.target.value); setFormError(''); }}
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none text-left font-mono transition-all ${
                    formError && (!clientPhone.trim() || clientPhone.replace(/[^0-9]/g, '').length < 9)
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                  dir="ltr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-200 mb-1.5 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-indigo-400" />
                  <span>تفاصيل ومواصفات الخدمة أو العرض المطلوب:</span>
                  <span className="text-rose-400 font-bold">*</span>
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="مثلاً: نرغب بإعلان خصم 30% لنهاية الأسبوع لمنتجات العطور الجديدة، ولدينا صور المنتجات على الجوال..."
                  value={notes}
                  onChange={(e) => { setNotes(e.target.value); setFormError(''); }}
                  className={`w-full p-3 rounded-xl bg-slate-900 border text-sm text-white placeholder-slate-500 focus:outline-none resize-none leading-relaxed transition-all ${
                    formError && (!notes.trim() || notes.trim().length < 5)
                      ? 'border-rose-500 ring-2 ring-rose-500/20'
                      : 'border-slate-700 focus:border-indigo-500'
                  }`}
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-slate-300 space-y-1">
                <span className="font-bold text-white block">ملاحظة بشأن إرسال الصور:</span>
                <p className="font-light text-slate-400">
                  يمكنك إرسال صور وفيديوهات منتجاتك مباشرة بعد فتح محادثة الواتساب. لا يلزم رفعها الآن.
                </p>
              </div>

            </div>
          )}

          {/* STEP 3: Order Generated & WhatsApp Ready */}
          {step === 3 && (
            <div className="space-y-5 text-center">
              
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-9 h-9" />
              </div>

              <div>
                <h4 role="status" className="text-lg font-black text-white">تم تجهيز طلبك بنجاح، وطلبك جاهز للإرسال الفوري</h4>
                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                  حالة الطلب الآن: معلّق بانتظار الدفع. أرسل الفاتورة للموظف عبر واتساب، وستظهر أي حالة جديدة في حسابك بعد تحديثها من الموظف أو المدير.
                </p>
              </div>
              {createdOrder?.notificationWarning && (
                <p role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                  {createdOrder.notificationWarning}
                </p>
              )}

              {/* Order Ticket Card */}
              <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-right space-y-2.5 text-xs">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                  <span className="text-slate-400">رقم تتبع الطلب:</span>
                  <span className="font-mono font-black text-indigo-400 text-sm">{createdOrder?.orderNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">العميل ورقم التواصل:</span>
                  <span className="font-semibold text-white">{createdOrder?.customerName} · {createdOrder?.customerPhone}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">النشاط التجاري:</span>
                  <span className="font-semibold text-white">{createdOrder?.storeName} ({createdOrder?.storeType})</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">الخدمة:</span>
                  <span className="font-semibold text-emerald-400">{createdOrder?.packageName}</span>
                </div>
                <div className="flex justify-between items-start gap-4">
                  <span className="text-slate-400 shrink-0">تفاصيل الطلب:</span>
                  <span className="font-semibold text-white text-left">{createdOrder?.notes}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400">المبلغ المستحق:</span>
                  <span className="font-mono font-bold text-amber-300 text-sm">{createdOrder?.amount ?? 99} ر.س</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">حالة الدفع:</span>
                  <span className="font-bold text-amber-300">{createdOrder?.status === 'pending_payment' ? 'معلّق — بانتظار التحويل' : createdOrder?.status}</span>
                </div>
              </div>

              {/* Action Buttons for WhatsApp & Tracking */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  onClick={openWhatsAppDirect}
                  className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-900/30 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>التواصل مع الموظف لاستكمال الدفع عبر واتساب</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopy}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors cursor-pointer active:scale-95 touch-manipulation"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'تم نسخ نص الطلب بنجاح!' : 'نسخ نص الرسالة يدوياً'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onOrderCreated) {
                      onOrderCreated(createdOrder);
                    } else {
                      onClose();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/25 transition-all cursor-pointer active:scale-95 touch-manipulation"
                >
                  <Package className="w-4 h-4" />
                  <span>متابعة حالة الطلب في حسابي 📦</span>
                </button>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer Controls - Sticky at bottom with iOS safe-area support */}
        {step < 3 && (
          <div className="shrink-0 flex items-center justify-between p-3.5 sm:p-5 border-t border-slate-800 bg-[#0e1322]/95 backdrop-blur-md pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            {step === 2 ? (
              <button
                type="button"
                onClick={() => setStep(1)}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-colors cursor-pointer active:scale-95 touch-manipulation"
              >
                <ArrowRight className="w-4 h-4" />
                <span>السابق</span>
              </button>
            ) : (
              <div />
            )}

            {step === 1 ? (
              <button
                type="button"
                onClick={() => {
                  if (storeType === 'other' && !customStoreType.trim()) {
                    setFormError('يرجى كتابة وتحديد نشاط محلك التجاري أولاً للمتابعة');
                    return;
                  }
                  setFormError('');
                  setStep(2);
                }}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-indigo-600/30 transition-all cursor-pointer active:scale-95 touch-manipulation"
              >
                <span>التالي: بيانات المحل</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleFinish}
                disabled={isCreatingOrder}
                className="flex items-center gap-2 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-lg shadow-emerald-600/30 transition-all cursor-pointer active:scale-95 touch-manipulation"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isCreatingOrder ? 'جارٍ حفظ الطلب وإرسال إشعار Telegram…' : 'تأكيد وإنشاء الطلب'}</span>
              </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
