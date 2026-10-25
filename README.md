# وصلني | Waslni

منصة عربية لإدارة محتوى المتاجر والأنشطة التجارية، مع باقات وطلبات ولوحات للمدير والموظفين والعملاء.

## التقنيات

- React 19 وVite 8.
- Supabase Auth وPostgres مع سياسات RLS.
- Supabase Storage لملفات معرض الأعمال.
- Supabase Edge Functions لإدارة الموظفين، رموز حذف الطلبات، وتنبيهات Telegram.
- GitHub Pages لاستضافة الواجهة الثابتة.

## التطوير المحلي

1. ثبّت Node.js 22.
2. انسخ `.env.example` إلى `.env.local` وأضف رابط Supabase ومفتاح Publishable فقط.
3. شغّل `npm install` ثم `npm run dev`.

لا تضع مفتاح Supabase السري أو رمز Telegram في متغيرات `VITE_*` أو ملفات الواجهة.

## إعداد Supabase والنشر

اتبع الخطوات بالترتيب في [دليل إعداد Supabase وGitHub Pages](GITHUB_SUPABASE_SETUP_AR.md). يتضمن الدليل تشغيل migrations وseed وإنشاء المدير الأول ونشر Edge Functions وضبط أسرار Telegram.

مركز معرض الأعمال يرفع الوسائط إلى bucket باسم `waslni-portfolio`. إيصالات التحويل لا تُحفظ في التخزين أو قاعدة البيانات؛ تُرسل إلى Telegram، وتُحفظ في الطلب علامة الإرسال فقط.

## الأوامر

- `npm run dev` تشغيل خادم التطوير.
- `npm run build` بناء نسخة النشر.
- `npm run lint` فحص lint.
- `npm run preview` معاينة نسخة البناء محليًا.
