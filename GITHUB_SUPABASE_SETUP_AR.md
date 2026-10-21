# تجهيز Waslni للنشر المجاني

جهزنا المشروع للنشر كواجهة GitHub Pages مع Supabase للحسابات والبيانات. يلزم تنفيذ الخطوات التالية من حساباتك؛ لا ترسل مفاتيح سرية داخل المحادثة أو GitHub.

## 1. قاعدة البيانات وحساب المدير

1. افتح مشروع Supabase ثم **SQL Editor**.
2. افتح الملف `supabase/migrations/20261021_initial_schema.sql` من المشروع وانسخ محتواه إلى محرر SQL ثم اضغط **Run**.
3. افتح `supabase/seed.sql` وشغّله بالطريقة نفسها لإضافة الباقات الأولية.
4. من **Authentication > Providers > Email** فعّل البريد وكلمة المرور، واضبط رابط الموقع بعد نشره ضمن **URL Configuration**. لا تستخدم SMS؛ تسجيل الدخول بالبريد لا يتطلب شراء رسائل.
5. سجّل حساب المدير الأول من واجهة الموقع بعد تشغيل الإعدادات، ثم افتح **Authentication > Users** وانسخ UUID الخاص بالحساب.
6. في SQL Editor نفّذ التالي بعد استبدال القيمة بنفس UUID لحساب المدير:

```sql
update public.profiles set role = 'manager' where id = 'ضع-UUID-المدير-هنا';
```

لا ترفع هذا الأمر وفيه UUID إلى مستودع عام.

## 2. إعداد تنبيهات Telegram على الخادم

انشر الدالتين `manage-staff` و`telegram-notifications` كـ Supabase Edge Functions، ثم أضف في **Edge Functions > Secrets** القيم التالية من إعداداتك الخاصة:

- `SUPABASE_SECRET_KEYS` أو مفتاح service role في إعدادات المشروع حسب الاسم الذي تعرضه Supabase.
- `SUPABASE_PUBLISHABLE_KEYS` أو مفتاح anon/publishable.
- `TELEGRAM_BOT_TOKEN` رمز البوت الجديد بعد تدويره.
- `TELEGRAM_CHAT_ID` رقم المحادثة المستلمة.

لا تضع مفاتيح `sb_secret_...` أو رمز Telegram في `VITE_*` أو ملفات الواجهة أو GitHub Pages. يمكن نشر الدوال من CLI بعد ربط المشروع بـ `supabase link` ثم `supabase functions deploy manage-staff` و`supabase functions deploy telegram-notifications`.

## 3. نشر الواجهة على GitHub Pages

1. أنشئ مستودع GitHub جديدًا، ثم ارفع ملفات المشروع إلى الفرع `main` دون `.env.local` أو أي أسرار.
2. في المستودع افتح **Settings > Secrets and variables > Actions > Variables** وأضف:
   - `VITE_SUPABASE_URL` = عنوان مشروع Supabase.
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = مفتاح publishable فقط.
3. افتح **Settings > Pages** واختر **GitHub Actions** كمصدر النشر.
4. بعد ذلك يبدأ البناء تلقائيًا عند كل push إلى `main`، ويظهر رابط الموقع في صفحة Pages.
5. أضف رابط GitHub Pages إلى قائمة **Redirect URLs** في إعدادات Supabase Auth.

## حدود الإعداد الحالي

هذا المشروع لا يُنشر للعامة قبل تطبيق مخطط SQL، تعيين حساب مدير، ونشر الدوال وضبط إعداداتها. واجهة GitHub Pages ثابتة؛ لا تشغّل PHP أو إضافة Vite API على الاستضافة. الإيصال يُرسل إلى Telegram عبر الدالة ولا يُرفع إلى تخزين ملفات بالموقع. راجع صلاحيات RLS والدوال قبل تشغيل بيانات حقيقية.
