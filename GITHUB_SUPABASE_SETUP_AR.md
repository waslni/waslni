# تشغيل وصلني على GitHub Pages وSupabase

## حالة الإعداد

الواجهة منشورة على `https://sad0day.github.io/waslni/`، ومتغيرا `VITE_SUPABASE_URL` و`VITE_SUPABASE_PUBLISHABLE_KEY` موجودان في GitHub Actions. يلزم إكمال قاعدة البيانات والدوال على Supabase قبل استخدام تسجيل الحسابات والطلبات والرفع.

## 1. إنشاء قاعدة البيانات

من مشروع Supabase افتح **SQL Editor → New query**. شغّل الملفات التالية بهذا الترتيب، ملفًا واحدًا كل مرة:

1. `supabase/migrations/20261021_initial_schema.sql`
2. `supabase/migrations/20261025_storage_and_integrity.sql`
3. `supabase/seed.sql`

الملف الأول ينشئ الحسابات والطلبات والباقات والإعدادات وسياسات RLS وحد الطلبات. الثاني ينشئ التخزين العام لوسائط المعرض وجدول التحقق الخادمي لرموز حذف الطلبات. الثالث يضيف الباقات وكوبونات الخصم وأمثلة المعرض.

## 2. ضبط تسجيل الدخول وإنشاء المدير

1. من **Authentication → URL Configuration** ضع `https://sad0day.github.io/waslni/` في **Site URL** وأضفه أيضًا إلى **Redirect URLs**.
2. فعّل **Email provider**. تسجيل الدخول بالبريد وكلمة المرور لا يحتاج رسائل SMS.
3. افتح الموقع وأنشئ حساب المدير الأول ببريده الإلكتروني، ثم أكّد البريد إذا كان تأكيد البريد مفعّلًا، وسجّل الدخول مرة واحدة.
4. من **Authentication → Users** انسخ UUID لذلك الحساب.
5. في SQL Editor نفّذ الأمر التالي بعد وضع UUID مكان النص:

```sql
update public.profiles set role = 'manager' where id = 'UUID-المدير';
```

سجّل الخروج ثم ادخل من جديد لتحديث الدور في الجلسة. لا تضع UUID في مستودع GitHub.

## 3. نشر Edge Functions وإعداد Telegram

توجد ثلاث دوال في `supabase/functions/`: `manage-staff` و`manage-order-deletion` و`telegram-notifications`. يمكن نشرها من مجلد المشروع بعد تثبيت Supabase CLI:

```bash
npx supabase login
npx supabase link --project-ref yxbgohzradjhcxzxtjtw
npx supabase functions deploy manage-staff
npx supabase functions deploy manage-order-deletion
npx supabase functions deploy telegram-notifications
```

Supabase يوفّر عنوان المشروع ومفاتيح API للدوال. أضف فقط أسرار البوت إلى **Edge Functions → Secrets**:

- `TELEGRAM_BOT_TOKEN`: رمز البوت الجديد بعد تدويره.
- `TELEGRAM_CHAT_ID`: رقم المحادثة التي تستقبل التنبيهات.

لا تضف `SUPABASE_SECRET_KEY` إلى GitHub Actions Variables أو إلى ملفات `VITE_*`. ولا تضع رمز Telegram في مستودع GitHub.

## 4. رفع وسائط المعرض والإيصالات

- صور وفيديوهات معرض الأعمال تُحفظ في Supabase Storage داخل `waslni-portfolio`. حد الملف 50 ميجابايت، والأنواع المدعومة JPG/PNG/WebP/GIF وMP4/WebM. سياسات التخزين تسمح بالقراءة العامة، والرفع والحذف للمدير والموظف الذي يملك صلاحية المعرض.
- إيصال التحويل يُرسل مباشرةً من جلسة المستخدم إلى Edge Function ثم Telegram. لا تُحفظ صورته في سجل الطلب أو في Storage. يقتصر الرفع على صور JPG/PNG/WebP بحجم 5 ميجابايت. يحتفظ الطلب بحالة الإرسال فقط.

## 5. إعادة النشر بعد أي تعديل

رفع التعديلات إلى الفرع `main` يشغّل GitHub Actions وينشر النسخة الجديدة. تابع **Actions → Build and deploy Waslni**؛ الأخضر يعني اكتمال البناء والنشر، والأحمر يعني وجود فشل يجب فتح سجله لإصلاحه.

## حدود مهمة قبل التشغيل الفعلي

GitHub Pages يستضيف الواجهة فقط؛ لا يشغّل PHP أو API الخادم المحلي في `vite.config.js`. صلاحيات الحسابات والطلبات مفروضة على قاعدة البيانات والدوال، وليس على إخفاء عناصر الواجهة. بيانات `data/store.json` محلية ومستبعدة من Git ولا تنتقل تلقائيًا إلى Supabase. لم تُطبّق هذه الخطوات تلقائيًا على مشروع Supabase؛ يجب تشغيل SQL ونشر الدوال من حساب مالك المشروع.
