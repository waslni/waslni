import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { 
  X, 
  Package, 
  MessageCircle, 
  LogOut, 
  Store, 
  User, 
  Phone,
  FileCheck,
  Printer,
  Clock,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Ban
} from 'lucide-react';

export default function CustomerDashboardModal({ isOpen, onClose, currentUser, onLogout }) {
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [orders, setOrders] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = () => {
    if (!currentUser) return;
    // ⚠️ IDOR Protection: يُرجع فقط طلبات هذا العميل بناءً على ID وليس رقم الطلب
    const allOrders = db.getOrders(currentUser);
    const filtered = allOrders.filter(o => 
      (o.customerId && currentUser.id && o.customerId === currentUser.id) ||
      (o.customerPhone && currentUser.phone && o.customerPhone === currentUser.phone)
    );
    // ترتيب دقيق: الأحدث أولاً
    filtered.sort((a, b) => {
      const timeA = Number(a.timestamp) || (a.createdAt ? new Date(a.createdAt).getTime() : 0) || 0;
      const timeB = Number(b.timestamp) || (b.createdAt ? new Date(b.createdAt).getTime() : 0) || 0;
      return timeB - timeA;
    });
    setOrders(filtered);
  };

  useEffect(() => {
    if (!currentUser || !isOpen) return;
    fetchOrders();
    const handleDataChange = (event) => {
      if (!event.detail?.key || event.detail.key === 'waslni_orders') fetchOrders();
    };
    window.addEventListener('waslni_data_changed', handleDataChange);
    // تحديث تلقائي كل 15 ثانية
    const interval = setInterval(fetchOrders, 15000);
    return () => {
      window.removeEventListener('waslni_data_changed', handleDataChange);
      clearInterval(interval);
    };
  }, [isOpen, currentUser]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
    setTimeout(() => setRefreshing(false), 800);
  };

  if (!isOpen || !currentUser) return null;

  const settings = db.getSettings();

  // حساب الخطوة الحالية للطلب (Stepper)
  const getStepIndex = (status) => {
    switch (status) {
      case 'pending_payment': return 0;
      case 'transferred': return 1;
      case 'approved_by_manager':
      case 'in_progress': return 2;
      case 'completed': return 3;
      case 'cancelled': return -1; // ملغى
      default: return 0;
    }
  };

  const getStatusInfo = (status) => {
    switch (status) {
      case 'completed':
        return { 
          label: 'مكتمل وتم التسليم ✓', 
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'approved_by_manager':
        return { 
          label: 'معتمد من الإدارة ⚙️', 
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <CheckCircle className="w-3.5 h-3.5" />
        };
      case 'in_progress':
        return { 
          label: 'قيد التنفيذ 🔧', 
          color: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: <RefreshCw className="w-3.5 h-3.5" />
        };
      case 'transferred':
        return { 
          label: 'تم التحويل — بانتظار اعتماد الإدارة ⏳', 
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: <Clock className="w-3.5 h-3.5" />
        };
      case 'cancelled':
        return { 
          label: 'تم إلغاء الطلب ✕', 
          color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
          icon: <Ban className="w-3.5 h-3.5" />
        };
      default:
        return { 
          label: 'بانتظار التحويل البنكي 💳', 
          color: 'bg-slate-800 text-slate-300 border-slate-700',
          icon: <Clock className="w-3.5 h-3.5" />
        };
    }
  };

  const steps = [
    { label: 'إنشاء الطلب', icon: '📋' },
    { label: 'رفع الإيصال', icon: '🏦' },
    { label: 'اعتماد الإدارة', icon: '👑' },
    { label: 'تسليم العمل', icon: '🎁' },
  ];

  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const cancelledOrders = orders.filter(o => o.status === 'cancelled');

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl bg-[#0e1322] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-900/60 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">حسابي وطلباتي</h3>
              <p className="text-xs text-slate-400">مرحباً بك، <strong className="text-indigo-300">{currentUser.name}</strong></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* زر تحديث */}
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-xl text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-all cursor-pointer ${refreshing ? 'animate-spin text-indigo-400' : ''}`}
              title="تحديث الطلبات"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => { onLogout(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-bold border border-slate-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Profile Bar ── */}
        <div className="px-4 sm:px-5 py-3 bg-slate-950/80 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Store className="w-3.5 h-3.5 text-indigo-400" />
              <span>المحل: <strong className="text-white">{currentUser.storeName || 'لم يحدد'}</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span dir="ltr" className="font-mono text-slate-300">{currentUser.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-slate-400">
            <span>الطلبات النشطة: <strong className="text-indigo-400">{activeOrders.length}</strong></span>
            {cancelledOrders.length > 0 && (
              <span>الملغاة: <strong className="text-rose-400">{cancelledOrders.length}</strong></span>
            )}
          </div>
        </div>

        {/* ── Orders List ── */}
        <div className="overflow-y-auto flex-1 p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              سجل باقاتك وطلباتك
            </h4>
            <span className="text-[10px] text-slate-600">يتجدد تلقائياً كل 15 ثانية</span>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-14 space-y-3 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Package className="w-12 h-12 text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">لم تقم بشراء أي باقة بعد</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">اختر باقة من الصفحة الرئيسية لتبدأ أول طلب لمحلك.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => {
                const stepIdx = getStepIndex(ord.status);
                const statusInfo = getStatusInfo(ord.status);
                const isCancelled = ord.status === 'cancelled';

                return (
                  <div
                    key={ord.id}
                    className={`rounded-2xl border overflow-hidden transition-all ${
                      isCancelled
                        ? 'border-rose-800/40 bg-rose-950/10 opacity-80'
                        : ord.status === 'completed'
                        ? 'border-emerald-500/30 bg-emerald-950/10'
                        : ord.status === 'approved_by_manager' || ord.status === 'in_progress'
                        ? 'border-blue-500/25 bg-blue-950/10'
                        : ord.status === 'transferred'
                        ? 'border-amber-500/25 bg-amber-950/10'
                        : 'border-slate-800 bg-slate-900/50'
                    }`}
                  >
                    {/* Card Header */}
                    <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/60">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-[11px] px-2 py-1 rounded-lg bg-indigo-600/15 text-indigo-300 border border-indigo-500/25">
                            {ord.orderNumber}
                          </span>
                          <span className="text-[10px] text-slate-500">{ord.createdAt}</span>
                        </div>
                        <h5 className="text-sm font-bold text-white mt-1 truncate">{ord.packageName}</h5>
                      </div>
                      <span className={`flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full font-bold border ${statusInfo.color}`}>
                        {statusInfo.icon}
                        <span>{statusInfo.label}</span>
                      </span>
                    </div>

                    {/* Cancelled Notice */}
                    {isCancelled && (
                      <div className="px-4 py-2.5 bg-rose-950/30 border-b border-rose-800/30 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                        <div className="text-[11px]">
                          <p className="text-rose-300 font-bold">تم إلغاء هذا الطلب من قِبل الإدارة</p>
                          {ord.cancelledAt && <p className="text-rose-500/80 mt-0.5">بتاريخ: {ord.cancelledAt}</p>}
                          <p className="text-slate-400 mt-1">للاستفسار، تواصل معنا عبر واتساب.</p>
                        </div>
                      </div>
                    )}

                    {/* 4-Step Stepper (hidden for cancelled) */}
                    {!isCancelled && (
                      <div className="px-4 py-3 border-b border-slate-800/50">
                        <div className="flex items-center gap-0">
                          {steps.map((step, i) => (
                            <div key={i} className="flex items-center flex-1">
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                                  i < stepIdx
                                    ? 'bg-indigo-600 border-indigo-400 text-white'
                                    : i === stepIdx
                                    ? 'bg-indigo-600 border-indigo-300 text-white shadow-lg shadow-indigo-900/50 scale-110'
                                    : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}>
                                  {i < stepIdx ? '✓' : step.icon}
                                </div>
                                <span className={`text-[9px] font-bold text-center leading-tight ${
                                  i <= stepIdx ? 'text-indigo-300' : 'text-slate-600'
                                }`}>{step.label}</span>
                              </div>
                              {i < 3 && (
                                <div className={`h-0.5 flex-1 mx-0.5 rounded transition-all ${
                                  i < stepIdx ? 'bg-indigo-500' : 'bg-slate-800'
                                }`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Details Grid */}
                    <div className="px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-0.5">💰 المبلغ المطلوب:</span>
                        <strong className="text-white font-mono text-sm">{ord.amount} ر.س</strong>
                        {ord.discountAmount > 0 && (
                          <span className="text-[10px] text-amber-400 block">وفّرت {ord.discountAmount} ر.س</span>
                        )}
                      </div>
                      <div>
                        <span className="text-slate-500 block text-[10px] mb-0.5">⏱️ وقت التسليم:</span>
                        <span className="text-slate-300">{ord.deliveryTimeline || 'خلال 48 ساعة'}</span>
                      </div>
                      {ord.transferredBy && (
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-slate-500 block text-[10px] mb-0.5">✅ تأكيد التحويل:</span>
                          <span className="text-emerald-400 font-medium text-[11px]">تم استلام الدفعة ✓</span>
                        </div>
                      )}
                    </div>

                    {/* Actions Footer */}
                    <div className="px-4 py-2.5 border-t border-slate-800/50 flex items-center justify-end gap-2">
                      {ord.paymentStatus === 'paid_verified' && !isCancelled && (
                        <button
                          type="button"
                          onClick={() => setSelectedReceiptOrder(ord)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 border border-indigo-500/25 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <FileCheck className="w-3.5 h-3.5 text-indigo-400" />
                          <span>سند الاستلام</span>
                        </button>
                      )}
                      <a
                        href={`https://wa.me/${(settings.whatsappNumber || '966558840806').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                          isCancelled
                            ? `مرحباً فريق وصلني، أستفسر عن سبب إلغاء طلبي رقم: ${ord.orderNumber} (${ord.packageName})`
                            : `مرحباً فريق وصلني، أستفسر عن حالة طلبي رقم: ${ord.orderNumber} (${ord.packageName})`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>{isCancelled ? 'الاستفسار عن الإلغاء' : 'متابعة بالواتساب'}</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* ── Digital Receipt / Invoice Modal ── */}
      {selectedReceiptOrder && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-slate-900 border border-indigo-500/40 p-6 shadow-2xl space-y-5 text-right">
            
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black">و</span>
                <div>
                  <h4 className="text-sm font-black text-white">سند استلام وتأكيد طلب</h4>
                  <span className="text-[10px] text-slate-400">منصة وصلني للخدمات الرقمية</span>
                </div>
              </div>
              <button onClick={() => setSelectedReceiptOrder(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">رقم السند / الطلب:</span>
                <span className="font-mono font-bold text-indigo-400">{selectedReceiptOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">اسم العميل:</span>
                <strong className="text-white">{selectedReceiptOrder.customerName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">النشاط التجاري:</span>
                <span className="text-slate-200">{selectedReceiptOrder.storeName} ({selectedReceiptOrder.storeType})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">الباقة المختارة:</span>
                <strong className="text-white">{selectedReceiptOrder.packageName}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">تاريخ الطلب:</span>
                <span className="text-slate-300">{selectedReceiptOrder.createdAt}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 flex justify-between items-baseline">
                <span className="text-slate-300 font-bold">المبلغ المستلم بالكامل:</span>
                <span className="text-xl font-black text-emerald-400 font-mono">{selectedReceiptOrder.amount} ر.س</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
              <span className="text-xs font-bold text-emerald-400 block">✓ تم التحقق من الحوالة وتأكيد السداد</span>
              <span className="text-[10px] text-slate-400">الموظف المسؤول: {selectedReceiptOrder.transferredBy || 'إدارة العمليات'}</span>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة السند</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedReceiptOrder(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold cursor-pointer"
              >
                إغلاق
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
