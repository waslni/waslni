import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { db } from '../services/db';
import { 
  X, 
  Check, 
  Sparkles, 
  Clock, 
  ShieldCheck, 
  MessageCircle,
  Tag,
  CheckCircle2,
  Copy,
  Package,
  CheckCircle
} from 'lucide-react';

export default function PackageDetailsModal({ 
  isOpen, 
  onClose, 
  packageItem, 
  currentUser, 
  onRequestAuth, 
  onOrderCreated 
}) {
  const [discountCodeInput, setDiscountCodeInput] = useState('');
  const [appliedDiscount, setAppliedDiscount] = useState(null);
  const [discountError, setDiscountError] = useState('');
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isCreatingOrder, setIsCreatingOrder] = useState(false);

  const prevIsOpenRef = useRef(false);

  useEffect(() => {
    // Only reset state when modal opens from closed state!
    if (isOpen && !prevIsOpenRef.current) {
      setCreatedOrder(null);
      setCopied(false);
      setDiscountError('');
      setDiscountCodeInput('');
      setAppliedDiscount(null);
    }
    prevIsOpenRef.current = Boolean(isOpen);
  }, [isOpen]);

  if (!isOpen || !packageItem) return null;

  const settings = db.getSettings();

  // Price calculations
  const originalPrice = packageItem.price;
  const currentFinalPrice = appliedDiscount ? appliedDiscount.finalPrice : originalPrice;
  const savings = appliedDiscount ? appliedDiscount.discountAmount : 0;

  const handleApplyDiscount = (e) => {
    e.preventDefault();
    setDiscountError('');
    if (!discountCodeInput.trim()) return;

    const res = db.calculateDiscount(discountCodeInput, originalPrice);
    if (res.valid) {
      setAppliedDiscount(res);
      setDiscountError('');
    } else {
      setAppliedDiscount(null);
      setDiscountError(res.message || 'كوبون الخصم غير صحيح أو منتهي الصلاحية');
    }
  };

  const generateWhatsAppMessage = (order = createdOrder) => {
    const ordNum = order?.orderNumber || 'WS-PENDING';
    const text = `مرحباً، أنا الزبون: ${currentUser?.name}
أود تأكيد الدفع والطلب من منصة وصلني:

📦 الباقة المطلوبة: ${packageItem.name}
🔢 رقم الطلب: ${ordNum}
💰 المبلغ المستحق: ${currentFinalPrice} ر.س ${savings > 0 ? `(تم تطبيق كود الخصم ${appliedDiscount?.code} وتوفير ${savings} ر.س)` : ''}
🏪 اسم المحل / النشاط: ${currentUser?.storeName || 'غير محدد'}
📞 رقم التواصل: ${currentUser?.phone}

يرجى تزويدي ببيانات الحساب البنكي لإتمام التحويل ورفع الإيصال، شكراً لكم!`;
    return encodeURIComponent(text);
  };

  const handleProceedToPayment = async () => {
    // 1. If not logged in, prompt customer to login/register first
    if (!currentUser) {
      onRequestAuth(packageItem);
      return;
    }

    if (!currentUser.name?.trim() || !currentUser.phone?.trim() || !currentUser.storeName?.trim()) {
      alert('يرجى التأكد من استكمال بيانات اسمك واسم محلك ورقم الجوال في حسابك قبل إنشاء الطلب');
      return;
    }

    // 2. Create the order in database with customer account & discount info
    setIsCreatingOrder(true);
    let newOrder;
    try {
      newOrder = await db.createOrder({
        customer: currentUser,
        packageItem,
        amount: currentFinalPrice,
        storeName: currentUser.storeName,
        storeType: currentUser.storeType,
        discountCode: appliedDiscount ? appliedDiscount.code : null,
        discountAmount: savings,
        notes: appliedDiscount
          ? `طلب تم اختياره من تفاصيل الباقة مع تطبيق كوبون الخصم (${appliedDiscount.code}) وتوفير ${savings} ر.س`
          : `طلب تم اختياره من تفاصيل الباقة (${packageItem.name})`
      });
    } catch {
      setDiscountError('تعذر حفظ الطلب أو إرسال إشعاره. تحقق من اتصال الموقع وحاول مرة أخرى.');
      return;
    } finally {
      setIsCreatingOrder(false);
    }

    if (newOrder?.success === false) {
      setDiscountError(newOrder.message);
      return;
    }

    if (newOrder?.success === false) {
      setDiscountError(newOrder.message);
      return;
    }

    setCreatedOrder(newOrder);

    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });
  };

  const handleCopy = () => {
    const decodedMessage = decodeURIComponent(generateWhatsAppMessage());
    navigator.clipboard.writeText(decodedMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsAppDirect = () => {
    const cleanWhatsapp = (settings.whatsappNumber || '966558840806').replace(/[^0-9]/g, '');
    const whatsappUrl = `https://wa.me/${cleanWhatsapp}?text=${generateWhatsAppMessage()}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl bg-[#0e1322] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 sm:p-5 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
              {createdOrder ? <CheckCircle className="w-5 h-5 text-emerald-400" /> : <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] sm:text-[11px] font-bold text-indigo-400 block truncate">
                {createdOrder ? 'حالة الطلب' : 'تفاصيل الباقة والعرض'}
              </span>
              <h3 className="text-sm sm:text-lg font-black text-white truncate">
                {createdOrder ? 'تم تجهيز طلبك بنجاح 🎉' : packageItem.name}
              </h3>
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
        {createdOrder ? (
          <div className="px-4 py-5 sm:p-6 overflow-y-auto space-y-5 flex-1 overscroll-contain text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 mx-auto flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div>
              <h4 className="text-lg font-black text-white">طلبك جاهز للإرسال الفوري!</h4>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                تم توليد رسالة الطلب ورقم التتبع الخاص بك. اضغط أدناه لإرسالها مباشرة لفريق خدمة عملاء وصلني عبر الواتساب.
              </p>
            </div>
            {createdOrder.notificationWarning && (
              <p role="alert" className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs">
                {createdOrder.notificationWarning}
              </p>
            )}

            {/* Order Ticket Card */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-right space-y-2.5 text-xs">
              <div className="flex justify-between items-center pb-2 border-b border-slate-800">
                <span className="text-slate-400">رقم تتبع الطلب:</span>
                <span className="font-mono font-black text-indigo-400 text-sm">{createdOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">اسم العميل:</span>
                <span className="font-semibold text-white">{currentUser?.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">النشاط التجاري:</span>
                <span className="font-semibold text-white">{currentUser?.storeName || 'غير محدد'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">الباقة المطلوبة:</span>
                <span className="font-semibold text-emerald-400">{packageItem.name}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                <span className="text-slate-400">المبلغ المستحق:</span>
                <span className="font-mono font-bold text-amber-300 text-sm">{createdOrder.amount} ر.س</span>
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
                <span>إرسال الطلب عبر الواتساب الآن 🚀</span>
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
        ) : (
          <div className="px-4 py-3.5 sm:p-6 overflow-y-auto space-y-4 flex-1 overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            
            {/* Price Header Card (Shows Before & After Discount) */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 flex items-center justify-between">
              <div>
                <span className="text-xs text-slate-400 block">{packageItem.subtitle || 'العرض المخصص للمحلات'}</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-black text-emerald-400 font-mono">{currentFinalPrice}</span>
                  <span className="text-sm font-bold text-slate-300">ريال سعودي</span>
                  
                  {/* Shows original price if discounted */}
                  {(savings > 0 || packageItem.originalPrice) && (
                    <span className="text-xs text-slate-500 line-through mr-1 font-mono">
                      {savings > 0 ? `${originalPrice} ر.س` : `${packageItem.originalPrice} ر.س`}
                    </span>
                  )}
                </div>
              </div>

              {packageItem.badge && (
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-amber-400/15 text-amber-300 border border-amber-400/30">
                  {packageItem.badge}
                </span>
              )}
            </div>

            {/* Discount Promo Code Input Box */}
            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>هل لديك كود خصم؟</span>
              </span>

              <form onSubmit={handleApplyDiscount} className="flex gap-2">
                <input
                  type="text"
                  placeholder="أدخل كود الخصم (مثال: WASLNI20)"
                  value={discountCodeInput}
                  onChange={(e) => setDiscountCodeInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors cursor-pointer"
                >
                  تطبيق
                </button>
              </form>

              {discountError && (
                <span className="text-[11px] text-rose-400 block font-medium">
                  {discountError}
                </span>
              )}
              {appliedDiscount && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>تم تفعيل الكوبون: {appliedDiscount.description || appliedDiscount.code}</span>
                </span>
              )}
            </div>

            {/* Deliverables List */}
            <div className="space-y-3">
              <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>ماذا تتضمن هذه الباقة بالتفصيل؟</span>
              </h4>
              <div className="space-y-2 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800">
                {packageItem.features && packageItem.features.map((feat, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-slate-200">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Guarantees & Terms */}
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">موعد التسليم:</span>
                  <span className="text-white font-medium">خلال 24 إلى 48 ساعة</span>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">الضمان والتعديل:</span>
                  <span className="text-white font-medium">تعديل مجاني مضمون</span>
                </div>
              </div>
            </div>

            {/* User Status Note */}
            <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {currentUser ? (
                  <span>
                    أنت مسجل حالياً باسم: <strong className="text-white">{currentUser.name}</strong> ({currentUser.storeName})
                  </span>
                ) : (
                  <span className="text-amber-200">
                    سيُطلب منك تسجيل الدخول أو إنشاء حساب (بأمان 8+ خانات) لحفظ طلبك ومتابعته.
                  </span>
                )}
              </div>
            </div>

          </div>
        )}

        {/* Modal Footer - Sticky with safe area padding (shown only before order is created) */}
        {!createdOrder && (
          <div className="p-3.5 sm:p-5 border-t border-slate-800 bg-slate-900/90 shrink-0 pb-[max(0.875rem,env(safe-area-inset-bottom))]">
            <button
              type="button"
              onClick={handleProceedToPayment}
              disabled={isCreatingOrder}
              className="w-full py-3 sm:py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs sm:text-sm shadow-xl shadow-emerald-900/30 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 touch-manipulation"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isCreatingOrder ? 'جارٍ حفظ الطلب وإرسال إشعار Telegram…' : `تأكيد وإنشاء الطلب (${currentFinalPrice} ر.س)`}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
