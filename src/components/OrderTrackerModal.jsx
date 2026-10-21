import React, { useState } from 'react';
import { DEMO_TRACKING_ORDERS, BRAND_INFO } from '../data/waslniData';
import { db } from '../services/db';
import { 
  X, 
  Search, 
  Clock, 
  CheckCircle, 
  MessageCircle,
  AlertCircle
} from 'lucide-react';

export default function OrderTrackerModal({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchedOrder, setSearchedOrder] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [notFound, setNotFound] = useState(false);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e.preventDefault();
    const cleanQuery = searchQuery.trim().toUpperCase();
    if (!cleanQuery) return;

    setNotFound(false);
    setHasSearched(true);

    // 1. Search in live database first
    const allDbOrders = db.getOrders();
    const liveFound = allDbOrders.find(o => 
      (o.orderNumber && o.orderNumber.toUpperCase() === cleanQuery) ||
      (o.id && o.id.toUpperCase() === cleanQuery) ||
      (o.securityCode && o.securityCode === cleanQuery)
    );

    if (liveFound) {
      setSearchedOrder({
        code: liveFound.orderNumber,
        clientName: liveFound.customerName,
        service: liveFound.packageName,
        status: liveFound.status === 'approved_by_manager' ? 'معتمد وجاري التنفيذ النهائي' :
                liveFound.status === 'transferred' ? 'تم استلام الحوالة وجاري التجهيز' :
                liveFound.status === 'completed' ? 'مكتمل وتم التسليم' : 'بانتظار التحويل والدفع',
        statusColor: liveFound.status === 'approved_by_manager' || liveFound.status === 'completed' 
          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' 
          : 'bg-amber-500/20 text-amber-300 border-amber-500/30',
        date: liveFound.createdAt,
        expectedDelivery: liveFound.deliveryTimeline || 'خلال 24-48 ساعة',
        progress: liveFound.status === 'completed' ? 100 : liveFound.status === 'approved_by_manager' ? 75 : liveFound.status === 'transferred' ? 50 : 25,
        notes: liveFound.notes || 'الطلب مسجل في النظام وجاري التنسيق والمتابعة من فريق العمل.'
      });
      return;
    }

    // 2. Search in demo tracking orders
    const found = DEMO_TRACKING_ORDERS.find(o => o.code === cleanQuery);
    if (found) {
      setSearchedOrder(found);
    } else {
      setSearchedOrder(null);
      setNotFound(true);
    }
  };

  const stepsList = [
    { label: 'استلام الطلب والمواد', completed: searchedOrder ? searchedOrder.progress >= 20 : false },
    { label: 'قيد التنفيذ والمونتاج', completed: searchedOrder ? searchedOrder.progress >= 50 : false },
    { label: 'إرسال المسودة للمراجعة', completed: searchedOrder ? searchedOrder.progress >= 80 : false },
    { label: 'اعتماد العمل والتسليم النهائي', completed: searchedOrder ? searchedOrder.progress === 100 : false },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full max-w-xl rounded-3xl bg-[#0e1322] border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
              <Search className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white">تتبع حالة طلبك في وصلني</h3>
              <p className="text-xs text-slate-400">متابعة مراحل التنفيذ والتسليم بالشفافية الكاملة</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6">
          
          {/* Search Form */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="أدخل رمز طلبك (مثال: WS-8021)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500"
              />
            </div>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition-colors cursor-pointer"
            >
              بحث
            </button>
          </form>

          {/* Initial State before search */}
          {!hasSearched && !searchedOrder && (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
              <Search className="w-8 h-8 text-slate-500 mx-auto" />
              <p className="text-sm font-semibold text-slate-300">أدخل رقم الطلب الخاص بك للمتابعة</p>
              <p className="text-xs text-slate-500">
                يمكنك كتابة رقم تتبع الطلب (مثال: WS-1024) أو كود الأمان للتحقق من مرحلة الإنجاز والتسليم.
              </p>
            </div>
          )}

          {/* Order Not Found State */}
          {notFound && (
            <div className="p-5 rounded-2xl bg-rose-950/30 border border-rose-500/40 text-center space-y-2">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
                <AlertCircle className="w-5 h-5" />
              </div>
              <h5 className="text-sm font-bold text-white">لم يتم العثور على طلب بهذا الرمز ({searchQuery})</h5>
              <p className="text-xs text-slate-400">
                يرجى التأكد من كتابة رقم الطلب بشكل صحيح (مثال: WS-8021) أو التواصل مع خدمة العملاء عبر الواتساب.
              </p>
            </div>
          )}

          {/* Order Details Card */}
          {searchedOrder && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-5">
              
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-medium">اسم العميل أو المحل:</span>
                  <h4 className="text-sm font-bold text-white">{searchedOrder.clientName}</h4>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold border ${searchedOrder.statusColor}`}>
                  {searchedOrder.status}
                </div>
              </div>

              {/* Service Info */}
              <div className="space-y-1 text-xs">
                <span className="text-slate-400">الخدمة المطلوبة:</span>
                <p className="text-sm font-medium text-slate-200">{searchedOrder.service}</p>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-medium">نسبة الإنجاز:</span>
                  <span className="font-mono font-bold text-indigo-400">{searchedOrder.progress}%</span>
                </div>
                <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${searchedOrder.progress}%` }}
                  />
                </div>
              </div>

              {/* Step Flow List */}
              <div className="space-y-2 pt-2">
                {stepsList.map((st, i) => (
                  <div key={i} className="flex items-center gap-2.5 text-xs">
                    <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${st.completed ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500'}`}>
                      {st.completed ? <CheckCircle className="w-3 h-3" /> : <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />}
                    </div>
                    <span className={st.completed ? 'text-slate-200 font-medium' : 'text-slate-500'}>
                      {st.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                <span className="text-slate-500 font-medium block">آخر تحديث من فريق التنفيذ:</span>
                <p className="text-slate-300 font-light">{searchedOrder.notes}</p>
              </div>

              {/* Expected Delivery */}
              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-sky-400" />
                  الموعد المتوقع للتسليم:
                </span>
                <span className="font-bold text-white">{searchedOrder.expectedDelivery}</span>
              </div>

            </div>
          )}

          {/* Quick Contact Button */}
          <a
            href={`https://wa.me/${(db.getSettings().whatsappNumber || '966558840806').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`مرحباً فريق وصلني، أستفسر عن حالة طلبي رقم: ${searchQuery}`)}`}
            target="_blank"
            rel="noreferrer"
            className="w-full py-3 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-2 transition-colors"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>طلب تحديث أو تعديل على هذا الطلب بالواتساب</span>
          </a>

        </div>

      </div>
    </div>
  );
}
