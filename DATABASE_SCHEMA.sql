-- ============================================================================
-- قاعدة بيانات منصة وصلني | Waslni Database Schema
-- جاهزة للاستيراد المباشر على MySQL / MariaDB / PostgreSQL في أي استضافة (cPanel / VPS)
-- ============================================================================

CREATE DATABASE IF NOT EXISTS waslni_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE waslni_db;

-- 1. جدول المستخدمين (الزبائن، الموظفين، والمدير)
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- معايير أمان: 8 خانات على الأقل
    role ENUM('customer', 'employee', 'manager') DEFAULT 'customer',
    store_name VARCHAR(150) DEFAULT NULL,
    store_type VARCHAR(100) DEFAULT 'عام',
    security_code VARCHAR(10) DEFAULT NULL, -- كود أمان رباعي
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. جدول الإعدادات العامة (رقم الواتساب، الآيبان، واسم البنك)
CREATE TABLE IF NOT EXISTS settings (
    setting_key VARCHAR(100) PRIMARY KEY,
    setting_value TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول أكواد الخصم والحاسبة
CREATE TABLE IF NOT EXISTS discount_codes (
    code VARCHAR(50) PRIMARY KEY,
    type ENUM('percentage', 'fixed') DEFAULT 'percentage',
    value DECIMAL(10, 2) NOT NULL,
    description VARCHAR(255) DEFAULT NULL,
    active BOOLEAN DEFAULT TRUE,
    uses_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول التحكم في ظهور الأقسام والأنشطة (المطاعم، الورود، الملابس...)
CREATE TABLE IF NOT EXISTS category_visibility (
    category_id VARCHAR(50) PRIMARY KEY,
    is_visible BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. جدول الباقات والأسعار (يعدلها الموظف أو المدير)
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    subtitle VARCHAR(255) DEFAULT NULL,
    price DECIMAL(10, 2) NOT NULL,
    original_price DECIMAL(10, 2) DEFAULT NULL,
    period VARCHAR(50) DEFAULT 'لكل باقة',
    badge VARCHAR(50) DEFAULT NULL,
    popular BOOLEAN DEFAULT FALSE,
    features JSON NOT NULL,
    terms TEXT DEFAULT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. جدول معرض الأعمال (الصور ومقاطع الريلز)
CREATE TABLE IF NOT EXISTS portfolio (
    id VARCHAR(50) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    category_name VARCHAR(100) NOT NULL,
    title VARCHAR(200) NOT NULL,
    client_type VARCHAR(150) DEFAULT NULL,
    deliverable_type VARCHAR(150) DEFAULT NULL,
    media_type ENUM('image', 'video') DEFAULT 'image',
    media_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500) DEFAULT NULL,
    highlight VARCHAR(255) DEFAULT NULL,
    copy_sample TEXT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. جدول الطلبات والتحويلات البنكية (مع إيصالات التحويل وتأكيد الموظف)
CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(50) PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50) NOT NULL,
    package_id VARCHAR(50) NOT NULL,
    package_name VARCHAR(150) NOT NULL,
    amount DECIMAL(10, 2) NOT NULL,
    status ENUM('pending_payment', 'transferred', 'approved_by_manager', 'in_progress', 'completed', 'cancelled') DEFAULT 'pending_payment',
    payment_status ENUM('unpaid', 'paid_verified') DEFAULT 'unpaid',
    receipt_image LONGTEXT DEFAULT NULL, -- رابط أو Base64 لصورة الإيصال
    transferred_by VARCHAR(150) DEFAULT NULL, -- اسم الموظف الذي أكد استلام المبلغ
    transferred_at DATETIME DEFAULT NULL,
    manager_approved_at DATETIME DEFAULT NULL,
    notes TEXT DEFAULT NULL,
    delivery_timeline VARCHAR(100) DEFAULT 'خلال 24-48 ساعة',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- بيانات أولية قياسية (Seed Data)
-- ============================================================================

-- إدخال الإعدادات الافتراضية
INSERT INTO settings (setting_key, setting_value) VALUES
('whatsapp_number', '966558840806'),
('store_name', 'وصلني | Waslni'),
('bank_name', 'مصرف الراجحي / البنك الأهلي'),
('iban_number', 'SA0000000000000000000000'),
('account_holder', 'مؤسسة وصلني للخدمات الرقمية')
ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value);

-- إدخال حسابات الإدارة والموظفين
INSERT INTO users (id, name, phone, password_hash, role, store_name, store_type) VALUES
('usr_admin', 'المدير العام', 'admin', 'admin', 'manager', 'الإدارة العامة', 'إدارة المنصة'),
('usr_emp', 'أحمد الموظف - قسم العمليات', 'emp', 'emp', 'employee', 'فريق التحصيل والتنفيذ', 'عمليات'),
('usr_demo_cust', 'عبدالله السبيعي', '0558840806', '123', 'customer', 'محل ورود النخبة', 'ورود وهدايا')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- إدخال الباقات
INSERT INTO packages (id, name, subtitle, price, original_price, period, badge, popular, features, terms) VALUES
('pkg_launch', 'باقة المحتوى الإعلاني الماسي (Super Deal)', 'الباقة الأكثر طلباً للمحلات لتجديد حضورهم التسويقي فوراً', 99.00, 199.00, 'عرض تجريبي خاص', 'الأعلى طلباً وتوفيراً 🔥', TRUE, 
'["5 تصاميم إعلانية احترافية لمنتجاتك وعروضك", "مونتاج فيديو ترويجي ريلز/تيك توك من تصوير جوالك", "كتابة نصوص تسويقية وكابشن جاهز للنشر", "تعديل واحد لكل تصميم وفيديو لضمان رضاك", "تسليم مرتب خلال 48 - 72 ساعة"]', 
'الصور ومقاطع الفيديو يتم توفيرها من العميل'),

('pkg_single', 'باقة التصاميم المنفردة', 'مرونة تامة للمحلات التي تحتاج تصاميم عند الحاجة فقط', 69.00, 99.00, 'لكل 5 تصاميم', 'اقتصادي ومباشر', FALSE,
'["5 تصاميم إعلانية بجودة عالية للنشر الفوري", "مقاسات ملائمة للإنستقرام وتويتر وسناب شات", "كتابة عبارات تسويقية قصيرة داخل التصميم", "تعديل واحد متاح لكل تصميم لضمان الدقة", "تسليم في غضون 24 - 48 ساعة فقط"]',
'الصور والشعار يتم تزويدها من العميل'),

('pkg_monthly', 'باقة النمو الشهري المستمر', 'شريكك الرقمي لحضور مستمر ومبيعات متزايدة طوال الشهر', 349.00, 500.00, 'اشتراك شهري', 'للمحلات النشطة', FALSE,
'["15 تصميم إعلاني متنوع شهرياً (بوستات وستوريات)", "4 مقاطع فيديو قصيرة Reels/TikTok مقصوصة باحتراف", "تغطية إعلانية لعروض المناسبات والويكند والأعياد", "كتابة نصوص وكابشن تفاعلي لجميع المنشورات", "جدول زمني منظم للتسليم أسبوعياً خطوة بخطوة"]',
'عدد مقاعد محدود شهرياً للحفاظ على أعلى جودة'),

('pkg_store', 'باقة المتجر أو الموقع المتكامل', 'تأسيس حضورك الرقمي الرسمي لتبيع وتستقبل زبائنك أونلاين', 399.00, 650.00, 'تدفع لمرة واحدة', 'تأسيس احترافي', FALSE,
'["إنشاء وتنسيق واجهة متجر (سلة / زد) أو صفحة هبوط", "تنسيق ألوان وشعار النشاط وبانرات الترحيب", "إدخال حتى 12 منتجاً بالصور والأسعار والمواصفات", "ربط خيارات الدفع الإلكتروني وشركات الشحن", "جلسة شرح وتدريب مبسّطة لصاحب المحل"]',
'اشتراك المنصة ورسوم النطاق إن وجدت يدفعها العميل')
ON DUPLICATE KEY UPDATE price = VALUES(price);
