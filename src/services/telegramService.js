// ============================================================================
// خدمة تنبيهات تيليجرام المباشرة | Telegram Bot Alert Service
// بوت التنبيهات: @spookySYSteamLogin_bot
// ============================================================================

import { isSupabaseConfigured, supabaseClient } from './supabaseClient';

const TELEGRAM_ENDPOINT = '/api/telegram';

/**
 * توليد كود رباعي الأرقام عشوائي للتحقق أو الأمان
 */
export function generate4DigitCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

/**
 * إرسال رسالة مباشرة إلى تيليجرام
 */
export async function sendTelegramNotification(messageText, customChatId = null) {
  try {
    if (isSupabaseConfigured) {
      const result = await supabaseClient.invoke('telegram-notifications', {
        action: 'message', text: messageText
      });
      return { success: Boolean(result?.success), data: result };
    }
    const res = await fetch(`${TELEGRAM_ENDPOINT}/message`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chatId: customChatId, text: messageText }),
    });

    const data = await res.json();
    return { success: res.ok && data.success, data };
  } catch (error) {
    console.warn('Telegram Notification error:', error);
    return { success: false, error };
  }
}

export async function sendReceiptToTelegram({ image, orderNumber, customerName, chatId }) {
  if (isSupabaseConfigured) {
    const result = await supabaseClient.invoke('telegram-notifications', {
      action: 'receipt', image, orderNumber, customerName
    });
    if (!result?.success) throw new Error(result?.message || 'تعذر إرسال الإيصال إلى تيليجرام');
    return result;
  }
  const response = await fetch(`${TELEGRAM_ENDPOINT}/receipt`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image, orderNumber, customerName, chatId })
  });
  const result = await response.json();
  if (!response.ok || !result.success) throw new Error(result.message || 'تعذر إرسال الإيصال إلى تيليجرام');
  return result;
}

// 1. تنبيه كود التحقق الأمني لتسجيل الدخول (2FA OTP)
export async function notifyLoginSecurityCode({ userName, role, phone, securityCode }) {
  const roleName = role === 'manager' ? 'المدير العام' : role === 'employee' ? 'الموظف' : 'زبون';
  const text = `
<b>🔐 رمز التحقق لتسجيل الدخول (كود رباعي)</b>
━━━━━━━━━━━━━━━━━
🔢 <b>كود التحقق الأمني:</b> <code>${securityCode}</code>
👤 <b>المستخدم:</b> ${userName}
🏷️ <b>الرتبة:</b> ${roleName}
📞 <b>المعرف / الجوال:</b> <code>${phone}</code>
⏰ <b>التاريخ والوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
⚠️ لا تشارك هذا الرمز مع أي شخص لحماية حسابك.
`.trim();

  return sendTelegramNotification(text);
}

// 2. تنبيه محاولة دخول فاشلة أو مشبوهة
export async function notifyFailedLoginAttempt({ phone, attemptsCount }) {
  const text = `
<b>⚠️ تنبيه أمني: محاولة دخول فاشلة!</b>
━━━━━━━━━━━━━━━━━
📞 <b>المعرف المدخل:</b> <code>${phone}</code>
❌ <b>عدد المحاولات الفاشلة:</b> ${attemptsCount}
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
تم تسجيل المحاولة في سجلات الأمان.
`.trim();

  return sendTelegramNotification(text);
}

// 2.1 تنبيه قفل الحساب لمدة 5 دقائق لحمايته من هجمات التكرار (Brute Force Lockout)
export async function notifyLockoutTriggered({ username, attempts, lockMinutes = 5 }) {
  const text = `
<b>🚨 تحذير أمني حرج: قفل تسجيل الدخول مؤقتاً!</b>
━━━━━━━━━━━━━━━━━
👤 <b>الحساب المستهدف:</b> <code>${username}</code>
🛑 <b>السبب:</b> إدخال كلمة المرور بشكل خاطئ مرتين متتاليتين (${attempts} محاولات).
⏳ <b>مدة القفل:</b> ${lockMinutes} دقائق لحماية الحساب من هجمات التخمين والتكرار (Brute Force Protection).
⏰ <b>توقيت القفل:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
🔐 تم تفعيل الحماية الأمنية ومنع أي محاولات دخول حتى انتهاء المدة.
`.trim();

  return sendTelegramNotification(text);
}

// 3. تنبيه تسجيل عميل جديد
export async function notifyNewCustomerRegistration({ name, phone, storeName, storeType, securityCode }) {
  const code = securityCode || generate4DigitCode();
  const text = `
<b>🔔 تسجيل عميل جديد في منصة وصلني</b>
━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> ${name}
📞 <b>رقم الجوال:</b> <code>${phone}</code>
🏪 <b>المحل / المتجر:</b> ${storeName || 'غير محدد'}
🏷️ <b>نوع النشاط:</b> ${storeType || 'عام'}
🔐 <b>كود الأمان الرباعي:</b> <code>${code}</code>
⏰ <b>التاريخ والوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
منصة وصلني للخدمات الرقمية 🇸🇦
`.trim();

  return sendTelegramNotification(text);
}

// 4. تنبيه طلب باقة جديد
export async function notifyNewOrderCreated({ orderNumber, customerName, customerPhone, packageName, amount, storeName, storeType, notes, securityCode, discountCode, discountAmount }) {
  const code = securityCode || generate4DigitCode();
  const text = `
<b>📦 طلب جديد بانتظار الدفع والتحويل</b>
━━━━━━━━━━━━━━━━━
🔢 <b>رقم الطلب:</b> <code>${orderNumber}</code>
🔐 <b>كود التحقق الرباعي:</b> <code>${code}</code>
👤 <b>العميل:</b> ${customerName} (<code>${customerPhone}</code>)
🏪 <b>المتجر:</b> ${storeName || 'غير محدد'}
🏷️ <b>النشاط:</b> ${storeType || 'عام'}
📦 <b>الباقة:</b> ${packageName}
💰 <b>المبلغ المستحق:</b> <b>${amount} ر.س</b>
📝 <b>التفاصيل:</b> ${notes || 'لا توجد ملاحظات'}
${discountCode ? `🏷️ <b>كوبون الخصم:</b> ${discountCode} (تم توفير ${discountAmount} ر.س)\n` : ''}⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
👉 تم تحويل العميل للواتساب لإرسال الإيصال.
`.trim();

  return sendTelegramNotification(text);
}

// 5. تنبيه تأكيد التحويل البنكي للمدير
export async function notifyTransferConfirmed({ orderNumber, customerName, packageName, amount, transferredBy, notes, securityCode }) {
  const code = securityCode || generate4DigitCode();
  const text = `
<b>💳 تأكيد تحويل بنكي جديد للمدير</b>
━━━━━━━━━━━━━━━━━
🔢 <b>رقم الطلب:</b> <code>${orderNumber}</code>
🔐 <b>كود العملية:</b> <code>${code}</code>
👤 <b>العميل:</b> ${customerName}
📦 <b>الباقة:</b> ${packageName}
💵 <b>المبلغ المستلم بالكامل:</b> <b>${amount} ر.س</b>
👨‍💼 <b>الموظف المسؤول:</b> ${transferredBy}
📝 <b>الملاحظات:</b> ${notes || 'تم استلام المبلغ ورفع الإيصال'}
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
✅ الإيصال مرفوع وفي انتظار الاعتماد النهائي من الإدارة.
`.trim();

  return sendTelegramNotification(text);
}

// 6. تنبيه إعادة تعيين كلمة المرور
export async function notifyPasswordResetAlert({ customerName, customerPhone, newPassword, resetBy, securityCode }) {
  const code = securityCode || generate4DigitCode();
  const text = `
<b>🔑 تم إعادة تعيين كلمة مرور لعميل</b>
━━━━━━━━━━━━━━━━━
👤 <b>اسم العميل:</b> ${customerName}
📞 <b>رقم الجوال:</b> <code>${customerPhone}</code>
🔐 <b>كلمة المرور الجديدة:</b> <code>${newPassword}</code>
🛡️ <b>كود الأمان:</b> <code>${code}</code>
👨‍💼 <b>بواسطة:</b> ${resetBy}
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
تم التحديث في النظام بنجاح.
`.trim();

  return sendTelegramNotification(text);
}

// 7. إرسال كود تأكيد أمني لحذف طلب للمدير
export async function notifyOrderDeletionSecurityCode({ orderNumber, securityCode, managerName, action = 'إلغاء الطلب' }) {
  const text = `
<b>⚠️ رمز الأمان لتأكيد حذف طلب من المنصة</b>
━━━━━━━━━━━━━━━━━
🔢 <b>رقم الطلب:</b> <code>${orderNumber}</code>
🗑️ <b>الإجراء المطلوب:</b> ${action}
🔐 <b>كود تأكيد الحذف الأمني:</b> <code>${securityCode}</code>
👑 <b>طلب الحذف بواسطة:</b> ${managerName || 'المدير العام'}
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
🚨 أدخل هذا الرمز في لوحة الإدارة لتأكيد الإجراء.
`.trim();

  return sendTelegramNotification(text);
}

// 8. تنبيه بحذف طلب نهائياً من النظام
export async function notifyOrderDeleted({ orderNumber, customerName, amount, managerName, action = 'حذف' }) {
  const text = `
<b>🗑️ تم ${action === 'إلغاء' ? 'إلغاء' : 'حذف'} طلب من المنصة</b>
━━━━━━━━━━━━━━━━━
🔢 <b>رقم الطلب المحذوف:</b> <code>${orderNumber}</code>
👤 <b>العميل:</b> ${customerName}
💰 <b>المبلغ:</b> ${amount} ر.س
👑 <b>تم الحذف بواسطة:</b> ${managerName || 'المدير العام'}
⏰ <b>الوقت:</b> ${new Date().toLocaleString('ar-SA')}
━━━━━━━━━━━━━━━━━
تم توثيق العملية في سجلات المنصة.
`.trim();

  return sendTelegramNotification(text);
}
