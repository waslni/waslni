# دليل رفع ونشر منصة "وصلني | Waslni" على الاستضافة

تم تجهيز هذا المشروع وتنسيقه ليكون جاهزاً للنشر المباشر على كافة أنواع الاستضافات (cPanel, VPS, Vercel, Netlify, Cloudflare).

---

## 1. محتويات ملفات الوسائط المضافة (الورود والملابس)
تم حفظ وتنظيم ملفات الوسائط داخل مجلد `public/media/`:
- **مقاطع ريلز الملابس والأزياء:**
  - `fashion-reel-1.mp4` (عرض فستان وتنسيق راقي)
  - `fashion-reel-2.mp4` (استعراض كولكشن عبايات وألوان)
  - `fashion-reel-3.mp4` (تفاصيل خامات الملابس الصيفية والشتوية)
  - `fashion-reel-4.mp4` (ريلز إطلاق الكولكشن الأسبوعي)
- **صور باقات الورود المنسقة:**
  - `flower-bouquet-1.jpg` (بوكيه أحمر بشريط "طالبين القرب منكم")
  - `flower-bouquet-2.jpg` (باقة ورود باستيل هادئة وأوركيد)
  - `flower-bouquet-3.jpg` (باقة جوري أحمر مع زنابق الليليوم)
  - `flower-bouquet-4.jpg` (بوكيه ورود بنفسجية في سيارة)

---

## 2. بناء ملفات الإنتاج الجاهزة للرفع (Production Build)
لبناء ملفات الموقع النهائية:
```bash
npm run build
```
سيتم إنشاء مجلد `dist/` يحتوي على كامل ملفات الموقع المجهزة والمضغوطة:
- `dist/index.html`
- `dist/assets/`
- `dist/media/`

---

## 3. خيارات الرفع على الاستضافة

### إعداد Telegram للإيصالات والتنبيهات
- يجب تشغيل واجهة `/api/telegram/*` على خادم يدعم PHP مع cURL أو على خادم Vite للتطوير.
- عرّف `TELEGRAM_BOT_TOKEN` و`TELEGRAM_CHAT_ID` كمتغيرات بيئة سرية على الخادم. لا تضفهما إلى ملفات الواجهة أو متغيرات `VITE_*`.
- عند رفع الإيصال، يمر عبر API إلى Telegram ولا يُحفظ ضمن سجل الطلب. يجب ألا تنشر نسخة الواجهة وحدها (مثل استضافة ملفات ثابتة على Vercel أو Netlify) إذا لم توفّر API خلفية لهذه المسارات.

### الخيار أ: الرفع على استضافة عادية (cPanel / Hostinger / GoDaddy)
1. قم بضغط محتويات مجلد `dist/` بالكامل إلى ملف `dist.zip`.
2. ادخل إلى لوحة التحكم cPanel -> **File Manager** -> مجلد `public_html`.
3. ارفع ملف `dist.zip` وفك ضغطه داخل `public_html`.
4. أنشئ ملفاً باسم `.htaccess` داخل `public_html` وضع بداخله الكود التالي لدعم التوجيه السلس:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^api/(.*)$ api.php?endpoint=$1 [QSA,L]
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

### الخيار ب: الرفع السريع المجاني على Vercel أو Netlify
1. ارفع الكود إلى مستودع GitHub.
2. اربط المستودع في منصة **Vercel** أو **Netlify**.
3. الإعدادات التلقائية:
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. اضغط **Deploy** وسيعمل الموقع فوراً برابط HTTPS سريع جداً.

---

## 4. قاعدة البيانات (Database Setup)
- تم إرفاق ملف SQL جاهز باسم: [`DATABASE_SCHEMA.sql`](./DATABASE_SCHEMA.sql).
- لربط قاعدة البيانات في الاستضافة:
  1. ادخل إلى cPanel -> **phpMyAdmin** أو **MySQL Databases**.
  2. أنشئ قاعدة بيانات جديدة باسم `waslni_db`.
  3. اختر تبويب **Import** واستورد ملف `DATABASE_SCHEMA.sql`.
- حالياً يعمل الموقع بطبقة بيانات ذكية متزامنة `src/services/db.js` تحفظ البيانات محلياً وتتزامن تلقائياً وفورياً، وهي مهيأة للربط بأي REST API.

---

## 5. بيانات الدخول الافتراضية للاختبار:
- **دخول المدير:** 
  - المعرف/الجوال: `admin`
  - كلمة المرور: `admin`
- **دخول الموظف:** 
  - المعرف/الجوال: `emp`
  - كلمة المرور: `emp`
- **حساب زبون تجريبي:** 
  - الجوال: `0558840806`
  - كلمة المرور: `123`
