import React, { useState, useEffect } from 'react';
import { db } from '../services/db';
import { 
  X, 
  User, 
  Phone, 
  Mail,
  Lock, 
  Store, 
  LogIn, 
  UserPlus, 
  ShieldCheck, 
  ShieldAlert, 
  MessageCircle,
  HelpCircle,
  Eye,
  EyeOff,
  KeyRound,
  Send,
  ArrowRight,
  Clock
} from 'lucide-react';

export default function AuthModal({ isOpen, onClose, onSuccess, initialMode = 'login', intendedPackage = null, maintenanceMode = false }) {
  const [mode, setMode] = useState(initialMode); // 'login' | 'register' | 'forgot' | 'verify_2fa'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [storeType, setStoreType] = useState('ملابس وأزياء');
  const [customStoreType, setCustomStoreType] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);

  // 2FA Security Code Verification States
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [generatedSecurityCode, setGeneratedSecurityCode] = useState('');
  const [pendingUser, setPendingUser] = useState(null);

  // Security: Clean and reset all inputs whenever modal opens or closes or mode changes
  useEffect(() => {
    if (isOpen) {
      setMode(maintenanceMode && initialMode === 'register' ? 'login' : initialMode);
      setPhone('');
      setEmail('');
      setPassword('');
      setName('');
      setStoreName('');
      setStoreType('ملابس وأزياء');
      setCustomStoreType('');
      setTwoFactorCode('');
      setPendingUser(null);
      setError('');
      setSuccessMessage('');
      setShowPassword(false);
    } else {
      setPhone('');
      setEmail('');
      setPassword('');
      setName('');
      setStoreName('');
      setCustomStoreType('');
      setTwoFactorCode('');
      setPendingUser(null);
      setError('');
      setSuccessMessage('');
      setShowPassword(false);
    }
  }, [isOpen, initialMode, maintenanceMode]);

  // Countdown timer for 5-minute brute-force lockout
  useEffect(() => {
    let interval = null;
    if (lockoutTimer > 0) {
      interval = setInterval(() => {
        setLockoutTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setError('');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lockoutTimer]);

  // Check lockout on email change
  useEffect(() => {
    if (email.trim() && mode === 'login') {
      const status = db.checkLockoutStatus(email.trim());
      if (status.locked) {
        setLockoutTimer(status.remainingSeconds);
      } else {
        setLockoutTimer(0);
      }
    }
  }, [email, mode]);

  if (!isOpen) return null;

  const settings = db.getSettings();
  const cleanWhatsapp = (settings.whatsappNumber || '966558840806').replace(/[^0-9]/g, '');
  const isPasswordStrong = password.length >= 8;

  const formatCountdown = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // Step 1: Submit Credentials
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (lockoutTimer > 0) {
      setError(`الحساب مقفل مؤقتاً لحمايته من هجمات التكرار (متبقي: ${formatCountdown(lockoutTimer)})`);
      return;
    }

    if (!email.trim() || !password.trim()) {
      setError('يرجى إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setLoading(true);
    let result;
    try {
      result = await db.loginVerifyCredentials(email.trim().toLowerCase(), password.trim());
    } catch (loginError) {
      result = { success: false, message: loginError?.message || 'تعذر تسجيل الدخول. حاول مرة أخرى.' };
    } finally {
      setLoading(false);
    }

    if (result.isLocked || result.isLockedNow) {
      const remaining = result.remainingSeconds || 300;
      setLockoutTimer(remaining);
      setError(result.message || 'تم قفل تسجيل الدخول لمدة 5 دقائق لحماية الحساب من هجمات التكرار');
      return;
    }

    if (result.success && result.requires2FA === false) {
      // موظف بدون 2FA - دخول مباشر
      setPassword('');
      setEmail('');
      setPhone('');
      if (maintenanceMode && result.user.role === 'customer') {
        db.logout();
        setError('الموقع تحت الصيانة حالياً، تسجيل دخول العملاء متوقف مؤقتاً.');
        return;
      }
      onSuccess(result.user, intendedPackage);
      onClose();
    } else if (result.success && result.requires2FA) {
      setPendingUser(result.user);
      setGeneratedSecurityCode(result.securityCode);
      setTwoFactorCode('');
      setError('');
      setMode('verify_2fa'); // Move to 2FA verification step
    } else {
      setError(result.message || 'بيانات الدخول غير صحيحة، يرجى التأكد من اسم المستخدم وكلمة المرور');
    }
  };

  // Step 2: Verify 4-Digit Code
  const handleVerify2FASubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!twoFactorCode.trim()) {
      setError('يرجى إدخال كود التحقق الرباعي المكون من 4 أرقام');
      return;
    }

    setLoading(true);
    const result = db.verifyLogin2FA(twoFactorCode.trim());
    setLoading(false);

    if (result.success) {
      // Clear all fields for security
      setPassword('');
      setEmail('');
      setPhone('');
      setTwoFactorCode('');
      setPendingUser(null);
      onSuccess(result.user, intendedPackage);
      onClose();
    } else {
      setError(result.message);
    }
  };

  // Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (maintenanceMode || db.getMaintenanceMode().enabled) {
      setError('إنشاء حسابات العملاء متوقف أثناء الصيانة. يرجى المحاولة بعد إعادة فتح الموقع.');
      return;
    }

    if (!name.trim() || !email.trim() || !phone.trim() || !password.trim() || !storeName.trim()) {
      setError('يرجى ملء الاسم والبريد الإلكتروني ورقم الجوال واسم المحل وكلمة المرور');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('يرجى إدخال بريد إلكتروني صحيح لتسجيل الدخول والتحقق من الحساب');
      return;
    }

    if (storeType === 'أخرى' && !customStoreType.trim()) {
      setError('يرجى كتابة نوع نشاط محلك التجاري');
      return;
    }

    const cleanDigits = phone.trim().replace(/[^0-9]/g, '');
    if (cleanDigits.length < 9) {
      setError('يرجى إدخال رقم جوال صحيح مكون من 9 إلى 10 أرقام (مثال: 0558840806)');
      return;
    }

    // معايير الأمان الصارمة: 8 خانات كحد أدنى
    if (password.length < 8) {
      setError('معايير الأمان: كلمة المرور يجب أن لا تقل عن 8 خانات كحد أدنى لحماية الحساب');
      return;
    }

    const finalStoreType = storeType === 'أخرى' ? customStoreType.trim() : storeType;

    setLoading(true);
    let result;
    try {
      result = await db.registerCustomer({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: cleanDigits,
        password: password.trim(),
        storeName: storeName.trim(),
        storeType: finalStoreType
      });
    } catch {
      result = { success: false, message: 'تعذر حفظ الحساب أو إرسال إشعار التسجيل. يرجى المحاولة مرة أخرى.' };
    } finally {
      setLoading(false);
    }

    if (result.success && result.pendingEmailConfirmation) {
      setPassword('');
      setSuccessMessage(result.message || 'تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده ثم سجّل الدخول.');
      setMode('login');
    } else if (result.success) {
      // Clear credentials
      setPassword('');
      setPhone('');
      setEmail('');
      setCustomStoreType('');
      setSuccessMessage(result.notificationWarning || 'مرحباً بك! تم حفظ حسابك وتسجيل الدخول بنجاح.');
      window.setTimeout(() => {
        onSuccess(result.user, intendedPackage);
        onClose();
      }, 900);
    } else {
      setError(result.message);
    }
  };

  // WhatsApp reset password
  const handleContactStaffForReset = () => {
    const text = `مرحباً فريق الدعم في وصلني 👋
أنا عميل مسجل بالمنصة ونسيت كلمة المرور الخاصة بحسابي.
📱 رقم الجوال المسجل: ${phone || 'المسجل لديكم'}
🏪 اسم المحل: ${storeName || 'محلي التجاري'}

أرجو من الموظف المسؤول إعادة تعيين كلمة مرور جديدة آمنة لحسابي، شكراً لكم!`;

    window.open(`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className="relative w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[#0e1322] border border-slate-800 shadow-2xl overflow-hidden flex flex-col"
        style={{ maxHeight: 'calc(100dvh - env(safe-area-inset-top, 0px))' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white font-black text-xl shadow-md">
              و
            </div>
            <div>
              <h3 className="text-base font-black text-white">
                {mode === 'login' && 'تسجيل الدخول الآمن'}
                {mode === 'verify_2fa' && 'التحقق الثنائي (كود الأمان الرباعي)'}
                {mode === 'register' && 'إنشاء حساب زبون جديد (معايير الأمان)'}
                {mode === 'forgot' && 'استعادة الرمز السري'}
              </h3>
              <p className="text-xs text-slate-400">
                {mode === 'verify_2fa' 
                  ? 'تم إرسال كود الأمان الرباعي لحماية حسابك' 
                  : 'منظومة حماية متقدمة ومطابقة لمعايير الأمان'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Switcher Tabs (Only shown during normal flow) */}
        {(mode === 'login' || mode === 'register') && !maintenanceMode && (
          <div className="flex border-b border-slate-800 bg-slate-950/70 p-1.5 text-xs font-bold">
            <button
              type="button"
              onClick={() => { 
                setMode('login'); 
                setError(''); 
                setPhone(''); 
                setPassword(''); 
                setName(''); 
                setStoreName(''); 
                setCustomStoreType('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'login' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              تسجيل الدخول (مدير / موظف / زبون)
            </button>
            <button
              type="button"
              onClick={() => { 
                setMode('register'); 
                setError(''); 
                setPhone(''); 
                setPassword(''); 
                setName(''); 
                setStoreName(''); 
                setCustomStoreType('');
              }}
              className={`flex-1 py-2 rounded-xl transition-all cursor-pointer ${
                mode === 'register' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              إنشاء حساب جديد
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Active 5-Minute Lockout Alert with Live Countdown */}
          {lockoutTimer > 0 && (
            <div className="p-4 rounded-2xl bg-rose-950/50 border border-rose-500/50 text-rose-300 space-y-2 text-center animate-pulse">
              <div className="flex items-center justify-center gap-2 text-rose-400 font-black text-sm">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                <span>حظر أمني مؤقت لمدة 5 دقائق (Brute-force Lockout)</span>
              </div>
              <p className="text-xs text-rose-200 leading-relaxed">
                تم تجاوز الحد المسموح للمحاولات الخاطئة (مرتين). لحماية حسابك من هجمات التخمين والتكرار تم قفل الدخول مؤقتاً.
              </p>
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-black/60 border border-rose-500/40 text-rose-400 font-mono font-black text-lg">
                <Clock className="w-4 h-4 text-rose-400" />
                <span>الوقت المتبقي: {formatCountdown(lockoutTimer)}</span>
              </div>
            </div>
          )}

          {error && lockoutTimer <= 0 && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-medium flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div role="status" className={`p-3 rounded-xl border text-sm font-bold text-center ${successMessage.includes('تعذر إرسال') ? 'bg-amber-500/10 border-amber-500/30 text-amber-200' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'}`}>
              {successMessage}
            </div>
          )}

          {/* ============================================================ */}
          {/* STEP 2: 2FA VERIFICATION CODE PROMPT (كود التحقق الرباعي) */}
          {/* ============================================================ */}
          {mode === 'verify_2fa' && (
            <form onSubmit={handleVerify2FASubmit} className="space-y-4 text-center py-2">
              <div className="w-16 h-16 rounded-2xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-400 mx-auto flex items-center justify-center shadow-lg">
                <KeyRound className="w-8 h-8 animate-pulse" />
              </div>

              <div>
                <h4 className="text-base font-black text-white">أدخل كود التحقق الرباعي</h4>
                <p className="text-xs text-slate-300 mt-1">
                  المستخدم: <strong className="text-white">{pendingUser?.name}</strong> ({pendingUser?.role === 'manager' ? '👑 المدير' : pendingUser?.role === 'employee' ? '💼 الموظف' : '👤 زبون'})
                </p>
                <div className="mt-3 p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
                  <div className="flex items-center justify-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>تم إرسال كود التحقق لتأكيد تسجيل الدخول (تيليجرام)</span>
                  </div>
                  {generatedSecurityCode && (
                    <div className="p-2 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">رمز الدخول الأمني:</span>
                      <button
                        type="button"
                        onClick={() => setTwoFactorCode(generatedSecurityCode)}
                        className="font-mono font-black text-emerald-400 text-sm tracking-widest hover:underline cursor-pointer"
                        title="انقر للتعبئة التلقائية"
                      >
                        {generatedSecurityCode} (تعبئة سريعة)
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4-Digit Input Field */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1.5 text-right">
                  أدخل الكود الرباعي (4 أرقام):
                </label>
                <input
                  type="text"
                  maxLength="4"
                  autoFocus
                  required
                  placeholder="• • • •"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full py-3 px-4 rounded-xl bg-slate-950 border border-slate-700 text-center text-2xl font-black font-mono tracking-widest text-emerald-400 focus:outline-none focus:border-indigo-500"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <ShieldCheck className="w-5 h-5" />
                  <span>تأكيد كود الأمان والدخول</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>العودة لإدخال اسم المستخدم وكلمة المرور</span>
                </button>
              </div>
            </form>
          )}

          {/* ============================================================ */}
          {/* STEP 1: LOGIN FORM (NO BYPASSES - STRICT INPUT REQUIRED) */}
          {/* ============================================================ */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  البريد الإلكتروني:
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={lockoutTimer > 0}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-left font-mono disabled:opacity-50"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    كلمة المرور السرية:
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setError(''); }}
                    className="text-[11px] text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
                  >
                    نسيت كلمة المرور؟
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="أدخل كلمة المرور الخاصة بك"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={lockoutTimer > 0}
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 disabled:opacity-50"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Security Policy Badge */}
              <div className="p-3 rounded-xl bg-indigo-950/30 border border-indigo-900/40 text-[11px] text-slate-400 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>بعد التحقق من كلمة المرور، سيتم إرسال كود تحقق رباعي لتأكيد الدخول. عند الخطأ مرتين يتم القفل 5 دقائق.</span>
              </div>

              <button
                type="submit"
                disabled={loading || lockoutTimer > 0}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2 ${
                  lockoutTimer > 0 
                    ? 'bg-rose-950/80 text-rose-300 border border-rose-700/50 cursor-not-allowed opacity-80' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-indigo-600/30 cursor-pointer'
                } mt-2`}
              >
                {lockoutTimer > 0 ? (
                  <>
                    <Clock className="w-4 h-4 animate-spin text-rose-400" />
                    <span>الحساب مقفل مؤقتاً ({formatCountdown(lockoutTimer)})</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>التحقق ومتابعة تسجيل الدخول</span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* REGISTRATION FORM (STRICT 8+ CHARACTERS MINIMUM) */}
          {/* ============================================================ */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسمك الكامل (صاحب المحل / المسوق):
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: عبدالله السبيعي"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم المحل أو علامتك التجارية:
                </label>
                <div className="relative">
                  <Store className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="مثال: بوتيك شيفون، كافيه رشفة، عطور السلطان..."
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  نوع النشاط:
                </label>
                <select
                  value={storeType}
                  onChange={(e) => setStoreType(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                >
                  <option value="ملابس وأزياء">ملابس وأزياء</option>
                  <option value="ورود وهدايا">ورود وهدايا</option>
                  <option value="عطور وبخور">عطور وبخور</option>
                  <option value="مطاعم وكافيهات">مطاعم وكافيهات</option>
                  <option value="إلكترونيات وجوالات">إلكترونيات وجوالات</option>
                  <option value="أخرى">أخرى (تحديد نشاط مخصص)</option>
                </select>

                {storeType === 'أخرى' && (
                  <div className="mt-2 animate-fadeIn">
                    <label className="block text-xs font-semibold text-amber-300 mb-1 flex items-center gap-1">
                      <span>اكتب نشاط محلك التجاري بالتفصيل:</span>
                      <span className="text-rose-400 font-bold">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: مغسلة سيارات، صالون حلاقة، عيادة، أثاث..."
                      value={customStoreType}
                      onChange={(e) => setCustomStoreType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-amber-500/50 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                    />
                  </div>
                )}
              </div>

               <div>
                 <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                   البريد الإلكتروني المستخدم لتسجيل الدخول والتحقق:
                 </label>
                 <div className="relative">
                   <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                   <input
                     type="email"
                     required
                     autoComplete="email"
                     placeholder="name@example.com"
                     value={email}
                     onChange={(e) => setEmail(e.target.value)}
                     className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-left"
                     dir="ltr"
                   />
                 </div>
               </div>

               <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الجوال:
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type="text"
                    required
                    placeholder="05XXXXXXXX"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pr-10 pl-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 text-left font-mono"
                    dir="ltr"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    كلمة المرور <span className="text-amber-400 font-bold">(8 خانات على الأقل لمعايير الأمان)</span>:
                  </label>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-3.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="8 خانات على الأقل (أحرف وأرقام)"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-3 text-slate-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password Strength Meter */}
                {password.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className={isPasswordStrong ? 'text-emerald-400 font-bold flex items-center gap-1' : 'text-amber-400 flex items-center gap-1'}>
                        {isPasswordStrong ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>تتوافق مع معايير الأمان (8+ خانات) ✓</span>
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>متبقي {8 - password.length} خانات لتصل للحد الأدنى</span>
                          </>
                        )}
                      </span>
                      <span className="font-mono text-slate-400">{password.length}/8</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${isPasswordStrong ? 'bg-emerald-500 w-full' : 'bg-amber-500'}`}
                        style={{ width: `${Math.min(100, (password.length / 8) * 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
              >
                <UserPlus className="w-4 h-4" />
                <span>إنشاء الحساب وتفعيل الأمان</span>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* FORGOT PASSWORD SCREEN */}
          {/* ============================================================ */}
          {mode === 'forgot' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 mx-auto flex items-center justify-center">
                <HelpCircle className="w-8 h-8" />
              </div>
              
              <div>
                <h4 className="text-sm font-bold text-white">إعادة تعيين الرمز بواسطة الموظف أو المدير</h4>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  لحماية حسابك وبيانات محلك، يقوم الموظف أو المدير بالتحقق من هويتك وإعادة تعيين كلمة مرور جديدة وتزويدك بها فوراً.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 text-right mb-1">
                  رقم جوالك المسجل بالمنصة:
                </label>
                <input
                  type="text"
                  placeholder="05XXXXXXXX"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-sm text-white font-mono text-left"
                  dir="ltr"
                />
              </div>

              <div className="pt-2 space-y-2">
                <button
                  type="button"
                  onClick={handleContactStaffForReset}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950/40"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>مراسلة الموظف بالواتساب لإعادة تعيين الرمز</span>
                </button>

                <button
                  type="button"
                  onClick={() => { setMode('login'); setError(''); }}
                  className="w-full py-2 text-xs text-slate-400 hover:text-white"
                >
                  العودة لتسجيل الدخول
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
