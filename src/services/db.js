// ============================================================================
// وصلني | Waslni - Secure Database & Storage Layer (مع التشفير ومعايير الأمان 2026)
// ============================================================================

import { 
  generate4DigitCode, 
  notifyNewOrderCreated, 
  notifyTransferConfirmed, 
  notifyLockoutTriggered,
  notifyFailedLoginAttempt,
} from './telegramService';
import { isSupabaseConfigured, supabaseClient } from './supabaseClient';

const STORAGE_KEYS = {
  SETTINGS: 'waslni_settings',
  PACKAGES: 'waslni_packages',
  PORTFOLIO: 'waslni_portfolio',
  USERS: 'waslni_users',
  CURRENT_USER: 'waslni_current_user',
  ORDERS: 'waslni_orders',
  DISCOUNT_CODES: 'waslni_discount_codes',
  CATEGORY_VISIBILITY: 'waslni_category_visibility',
  FAILED_ATTEMPTS: 'waslni_failed_attempts',
  LOCKOUT_STATUS: 'waslni_lockout_status',
  MAINTENANCE: 'waslni_maintenance_mode'
};

// الإعدادات العامة الافتراضية
const INITIAL_SETTINGS = {
  whatsappNumber: '966558840806',
  storeName: 'وصلني | Waslni',
  slogan: 'خدماتك الرقمية في مكان واحد',
  bankName: 'مصرف الراجحي / البنك الأهلي',
  ibanNumber: 'SA0000000000000000000000',
  accountHolder: 'مؤسسة وصلني للخدمات الرقمية'
};

// وضع الصيانة الافتراضي (معطل بالبداية)
const INITIAL_MAINTENANCE = {
  enabled: false,
  message: 'الموقع حالياً تحت الصيانة الدورية وتطوير الخوادم، سنعود إليكم قريباً جداً ⏳',
  estimatedReturn: 'خلال وقت قصير'
};

// رؤية الأقسام الافتراضية
const INITIAL_CATEGORY_VISIBILITY = {
  fashion: true,
  flowers: true,
  perfumes: true,
  cafes: true,
  home_projects: true,
  others: true
};

// أكواد الخصم الأولية
const INITIAL_DISCOUNT_CODES = [
  {
    code: 'WASLNI20',
    type: 'percentage',
    value: 20,
    description: 'خصم 20% خاص للمحلات الناشئة',
    active: true,
    usesCount: 14
  },
  {
    code: 'SAVE50',
    type: 'fixed',
    value: 50,
    description: 'خصم 50 ريال على باقة المتجر أو الباقات الشهرية',
    active: true,
    usesCount: 8
  }
];

// الباقات الأولية
const INITIAL_PACKAGES = [
  {
    id: 'pkg_launch',
    name: 'باقة المحتوى الإعلاني الماسي (Super Deal)',
    subtitle: 'الباقة الأكثر طلباً للمحلات لتجديد حضورهم التسويقي فوراً',
    price: 99,
    originalPrice: 199,
    period: 'عرض تجريبي خاص',
    badge: 'الأعلى طلباً وتوفيراً 🔥',
    popular: true,
    features: [
      '5 تصاميم إعلانية احترافية لمنتجاتك وعروضك',
      'مونتاج فيديو ترويجي ريلز/تيك توك من تصوير جوالك',
      'كتابة نصوص تسويقية وكابشن جاهز للنشر',
      'تعديل واحد لكل تصميم وفيديو لضمان رضاك',
      'تسليم مرتب خلال 48 - 72 ساعة'
    ],
    terms: 'الصور ومقاطع الفيديو يتم توفيرها من العميل'
  },
  {
    id: 'pkg_single',
    name: 'باقة التصاميم المنفردة',
    subtitle: 'مرونة تامة للمحلات التي تحتاج تصاميم عند الحاجة فقط',
    price: 69,
    originalPrice: 99,
    period: 'لكل 5 تصاميم',
    badge: 'اقتصادي ومباشر',
    popular: false,
    features: [
      '5 تصاميم إعلانية بجودة عالية للنشر الفوري',
      'مقاسات ملائمة للإنستقرام وتويتر وسناب شات',
      'كتابة عبارات تسويقية قصيرة داخل التصميم',
      'تعديل واحد متاح لكل تصميم لضمان الدقة',
      'تسليم في غضون 24 - 48 ساعة فقط'
    ],
    terms: 'الصور والشعار يتم تزويدها من العميل'
  },
  {
    id: 'pkg_monthly',
    name: 'باقة النمو الشهري المستمر',
    subtitle: 'شريكك الرقمي لحضور مستمر ومبيعات متزايدة طوال الشهر',
    price: 349,
    originalPrice: 500,
    period: 'اشتراك شهري',
    badge: 'للمحلات النشطة',
    popular: false,
    features: [
      '15 تصميم إعلاني متنوع شهرياً (بوستات وستوريات)',
      '4 مقاطع فيديو قصيرة Reels/TikTok مقصوصة باحتراف',
      'تغطية إعلانية لعروض المناسبات والويكند والأعياد',
      'كتابة نصوص وكابشن تفاعلي لجميع المنشورات',
      'جدول زمني منظم للتسليم أسبوعياً خطوة بخطوة'
    ],
    terms: 'عدد مقاعد محدود شهرياً للحفاظ على أعلى جودة'
  },
  {
    id: 'pkg_store',
    name: 'باقة المتجر أو الموقع المتكامل',
    subtitle: 'تأسيس حضورك الرقمي الرسمي لتبيع وتستقبل زبائنك أونلاين',
    price: 399,
    originalPrice: 650,
    period: 'تدفع لمرة واحدة',
    badge: 'تأسيس احترافي',
    popular: false,
    features: [
      'إنشاء وتنسيق واجهة متجر (سلة / زد) أو صفحة هبوط',
      'تنسيق ألوان وشعار النشاط وبانرات الترحيب',
      'إدخال حتى 12 منتجاً بالصور والأسعار والمواصفات',
      'ربط خيارات الدفع الإلكتروني وشركات الشحن',
      'جلسة شرح وتدريب مبسّطة لصاحب المحل'
    ],
    terms: 'اشتراك المنصة ورسوم النطاق إن وجدت يدفعها العميل'
  }
];

// عناصر المعرض الأولية
const INITIAL_PORTFOLIO = [
  {
    id: 'port_fashion_1',
    category: 'fashion',
    categoryName: 'ملابس وأزياء',
    title: 'ريلز عرض فستان وتنسيق راقي',
    clientType: 'بوتيك أزياء نسائية',
    type: 'مونتاج فيديو ريلز وتيك توك',
    mediaType: 'video',
    mediaUrl: '/media/fashion-reel-1.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600&auto=format&fit=crop&q=80',
    highlight: 'مونتاج ديناميكي مع إيقاع وإبراز لتفاصيل القماش والقصة',
    copySample: 'فخامة تلفت الأنظار وتفاصيل تليق بذوقك الرفيع... التشكيلة الجديدة متوفرة للطلب الآن.'
  },
  {
    id: 'port_fashion_2',
    category: 'fashion',
    categoryName: 'ملابس وأزياء',
    title: 'ريلز استعراض تشكيلة العبايات والألوان',
    clientType: 'دار عبايات ومصممة أزياء',
    type: 'مونتاج فيديو ريلز وتيك توك',
    mediaType: 'video',
    mediaUrl: '/media/fashion-reel-2.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=600&auto=format&fit=crop&q=80',
    highlight: 'حركة كاميرا سلسة ونصوص متحركة تشد انتباه المشاهدين',
    copySample: 'اللمسة اللي تصنع الفرق في يومك... تألقي بأجمل الموديلات مع شحن وتوصيل فوري لباب بيتك.'
  },
  {
    id: 'port_fashion_3',
    category: 'fashion',
    categoryName: 'ملابس وأزياء',
    title: 'ريلز تفاصيل الخامات والأناقة الشتوية/الصيفية',
    clientType: 'براند ملابس عصري',
    type: 'مونتاج فيديو ريلز وتيك توك',
    mediaType: 'video',
    mediaUrl: '/media/fashion-reel-3.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600&auto=format&fit=crop&q=80',
    highlight: 'تسليط الضوء على جودة الخياطة مع مقاسات ملائمة للإنستقرام',
    copySample: 'قطعتك المفضلة للموسم صارت هنا! كميات حصرية جاهزة للشحن الآن.'
  },
  {
    id: 'port_fashion_4',
    category: 'fashion',
    categoryName: 'ملابس وأزياء',
    title: 'ريلز إطلاق الكولكشن الأسبوعي',
    clientType: 'متجر ملابس شبابي ونسائي',
    type: 'مونتاج فيديو ريلز وتيك توك',
    mediaType: 'video',
    mediaUrl: '/media/fashion-reel-4.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&auto=format&fit=crop&q=80',
    highlight: 'ريلز سريع وحيوي يشجع على التفاعل والطلب الفوري بالواتساب',
    copySample: 'الأناقة تبدأ باختيارك... لا يفوتك العرض الخاص لأول 20 طلب هذا الأسبوع.'
  },
  {
    id: 'port_flowers_1',
    category: 'flowers',
    categoryName: 'ورود وهدايا',
    title: 'بوكيه ورود ملكية بشريط "طالبين القرب منكم"',
    clientType: 'محل ورود ومناسبات خاصة',
    type: 'تصميم بوست إعلاني + تنسيق محتوى',
    mediaType: 'image',
    mediaUrl: '/media/flower-bouquet-1.jpg',
    thumbnail: '/media/flower-bouquet-1.jpg',
    highlight: 'بوكيه أحمر فاخر للمناسبات والخطوبة مع بطاقة إهداء خاصة',
    copySample: 'لأن بعض المشاعر تحتاج ورد يترجمها... بوكيه ورود فاخرة بشريط مخصص يعبر عن قلبك بأجمل صورة.'
  },
  {
    id: 'port_flowers_2',
    category: 'flowers',
    categoryName: 'ورود وهدايا',
    title: 'تنسيق باقة زهور الباستيل والأوركيد',
    clientType: 'متجر ورود وتوصيل سريع',
    type: 'تصميم ستوري وترويج منتج',
    mediaType: 'image',
    mediaUrl: '/media/flower-bouquet-2.jpg',
    thumbnail: '/media/flower-bouquet-2.jpg',
    highlight: 'ألوان هادئة تجمع بين الورد الأبيض والوردي والزهور العطرية',
    copySample: 'صباح يليق بأحبابك... باقة صُممت لتدخل البهجة مع كرت إهداء مجاني وتوصيل مبرد وسريع.'
  },
  {
    id: 'port_flowers_3',
    category: 'flowers',
    categoryName: 'ورود وهدايا',
    title: 'باقة جوري أحمر مع زنابق الليليوم النقية',
    clientType: 'بوتيك هدايا فاخرة',
    type: 'تصميم عروض الأعياد والتخرج',
    mediaType: 'image',
    mediaUrl: '/media/flower-bouquet-3.jpg',
    thumbnail: '/media/flower-bouquet-3.jpg',
    highlight: 'كثافة زهور استثنائية مع تغليف أنيق بدرجات الأبيض',
    copySample: 'لحظات النجاح تستحق أن تخلد بأروع باقة ورد جوري طبيعي... اطلبها الآن وتصلك في موعد مناسبتك بالضبط.'
  },
  {
    id: 'port_flowers_4',
    category: 'flowers',
    categoryName: 'ورود وهدايا',
    title: 'بوكيه الورد البنفسجي العصري في السيارة',
    clientType: 'تنسيق هدايا سريعة ومفاجآت',
    type: 'محتوى سوشيال ميديا ومفاجآت',
    mediaType: 'image',
    mediaUrl: '/media/flower-bouquet-4.jpg',
    thumbnail: '/media/flower-bouquet-4.jpg',
    highlight: 'تنسيق مخصص للمفاجآت والإهداء الشخصي مع لمسات عصرية',
    copySample: 'فاجئ من تحب بدون مناسبة... الورود البنفسجية دايماً لها سحر لا يُنسى 🌸💜'
  },
  {
    id: 'port_perfumes_1',
    category: 'perfumes',
    categoryName: 'عطور وبخور',
    title: 'إعلان تدشين عطر "سلطان العود"',
    clientType: 'محل عطور شرقية',
    type: 'تصميم إعلاني + نص تسويقي',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=700&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=700&auto=format&fit=crop&q=80',
    highlight: 'رفع نسبة الاستفسارات عبر واتساب المحل',
    copySample: 'نفحات من الفخامة تأسر حواسك... عطر "سلطان العود" متوفر الآن بخصم 25% مع توصيل مجاني لباب بيتك.'
  },
  {
    id: 'port_cafes_1',
    category: 'cafes',
    categoryName: 'مطاعم وكافيهات',
    title: 'منيو رقمي تفاعلي QR للمطاعم والكافيهات',
    clientType: 'كافيه ومطعم سحابي',
    type: 'منيو رقمي خفيف وسريع للجوال',
    mediaType: 'image',
    mediaUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80',
    thumbnail: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=700&auto=format&fit=crop&q=80',
    highlight: 'تصفح سهل بضغطة واحدة وبدون الحاجة لتحميل أي تطبيق',
    copySample: 'امسح الباركود، تصفح وجباتك ومشروباتك المفضلة بالأسعار والصور اللذيذة واطلب فوراً.'
  }
];

const INITIAL_USERS = [];

const INITIAL_ORDERS = [];

// ============================================================
// توقيت المملكة العربية السعودية (UTC+3)
// ============================================================
function getSaudiDateTime() {
  const now = new Date();
  return now.toLocaleString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });
}

function getSaudiDate() {
  const now = new Date();
  return now.toLocaleDateString('ar-SA', {
    timeZone: 'Asia/Riyadh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

// Helper functions for LocalStorage persistence
function loadData(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key } }));
  } catch (err) {
    console.error('Error saving data to localStorage:', err);
  }
}

// ============================================================================
// API Sync Layer - مزامنة حية وفورية مع الخادم عبر الشبكة (جوال / كمبيوتر)
// ============================================================================

const API_BASE = typeof window !== 'undefined' ? window.location.origin : '';

function toDatabaseOrder(order = {}) {
  return {
    order_number: order.orderNumber || order.id,
    customer_id: order.customerId,
    security_code: order.securityCode || null,
    customer_name: order.customerName || '',
    customer_phone: order.customerPhone || '',
    store_name: order.storeName || '',
    store_type: order.storeType || '',
    package_id: order.packageId,
    package_name: order.packageName || '',
    original_amount: Number(order.originalAmount ?? order.amount ?? 0),
    amount: Number(order.amount || 0),
    discount_code: order.discountCode || null,
    discount_amount: Number(order.discountAmount || 0),
    notes: order.notes || '',
    details: order.details || {},
    status: order.status || 'pending_payment',
    payment_status: order.paymentStatus || 'unpaid',
    receipt_sent_to_telegram: Boolean(order.receiptSentToTelegram),
    receipt_submitted_at: order.receiptSubmittedAt || null,
    transferred_by: order.transferredBy || null,
    transferred_at: order.transferredAt || null,
    manager_approved_at: order.managerApprovedAt || null,
    cancelled_at: order.cancelledAt || null,
    cancelled_by: order.cancelledBy || null,
    delivery_timeline: order.deliveryTimeline || 'خلال 24-48 ساعة'
  };
}

function toDatabaseOrderPatch(order = {}) {
  const mapping = {
    orderNumber: 'order_number', customerId: 'customer_id', customerName: 'customer_name',
    securityCode: 'security_code',
    customerPhone: 'customer_phone', storeName: 'store_name', storeType: 'store_type',
    packageId: 'package_id', packageName: 'package_name', discountCode: 'discount_code',
    discountAmount: 'discount_amount', paymentStatus: 'payment_status',
    receiptSentToTelegram: 'receipt_sent_to_telegram', receiptSubmittedAt: 'receipt_submitted_at',
    transferredBy: 'transferred_by', transferredAt: 'transferred_at',
    managerApprovedAt: 'manager_approved_at', cancelledAt: 'cancelled_at',
    cancelledBy: 'cancelled_by', deliveryTimeline: 'delivery_timeline'
  };
  const patch = {};
  Object.entries(mapping).forEach(([camel, snake]) => {
    if (Object.hasOwn(order, camel)) patch[snake] = order[camel];
  });
  ['amount', 'notes', 'details', 'status'].forEach(key => {
    if (Object.hasOwn(order, key)) patch[key] = order[key];
  });
  return patch;
}

function fromDatabaseOrder(order = {}) {
  return {
    ...order,
    id: order.order_number,
    orderNumber: order.order_number,
    timestamp: Date.parse(order.created_at || '') || Date.now(),
    createdAt: order.created_at,
    customerId: order.customer_id,
    securityCode: order.security_code,
    customerName: order.customer_name,
    customerPhone: order.customer_phone,
    storeName: order.store_name,
    storeType: order.store_type,
    packageId: order.package_id,
    packageName: order.package_name,
    originalAmount: Number(order.original_amount || order.amount || 0),
    discountCode: order.discount_code,
    discountAmount: Number(order.discount_amount || 0),
    paymentStatus: order.payment_status,
    receiptSentToTelegram: order.receipt_sent_to_telegram,
    receiptSubmittedAt: order.receipt_submitted_at,
    transferredBy: order.transferred_by,
    transferredAt: order.transferred_at,
    managerApprovedAt: order.manager_approved_at,
    cancelledAt: order.cancelled_at,
    cancelledBy: order.cancelled_by,
    deliveryTimeline: order.delivery_timeline
  };
}

function fromDatabasePackage(item = {}) {
  return {
    ...item,
    originalPrice: item.original_price,
    popular: item.popular,
    features: Array.isArray(item.features) ? item.features : [],
    active: item.active !== false
  };
}

function fromDatabaseDiscount(item = {}) {
  return { ...item, usesCount: Number(item.uses_count || 0), createdAt: item.created_at };
}

function fromDatabasePortfolio(item = {}) {
  return {
    ...item,
    categoryName: item.category_name,
    clientType: item.client_type,
    type: item.deliverable_type,
    mediaType: item.media_type,
    mediaUrl: item.media_url,
    thumbnail: item.thumbnail_url,
    copySample: item.copy_sample,
    isVisible: item.is_visible !== false
  };
}

async function supabaseApiPost(endpoint, data) {
  const prefer = 'return=representation';
  if (endpoint === 'orders') {
    const result = await supabaseClient.rest('orders', { method: 'POST', body: toDatabaseOrder(data), headers: { Prefer: prefer } });
    return { ok: true, status: 201, body: Array.isArray(result) ? fromDatabaseOrder(result[0]) : result };
  }
  if (endpoint === 'orders/update') {
    const { id, updates = {} } = data || {};
    const filter = `order_number=eq.${encodeURIComponent(id)}`;
    const result = await supabaseClient.rest(`orders?${filter}`, { method: 'PATCH', body: toDatabaseOrderPatch(updates), headers: { Prefer: prefer } });
    return { ok: Array.isArray(result) && result.length > 0, status: 200, body: result?.[0] ? fromDatabaseOrder(result[0]) : null };
  }
  if (endpoint === 'orders/delete') {
    const id = data?.id;
    const result = await supabaseClient.rest(`orders?order_number=eq.${encodeURIComponent(id)}`, { method: 'DELETE', headers: { Prefer: prefer } });
    return { ok: true, status: 200, body: result };
  }
  if (endpoint === 'packages') {
    const packages = (Array.isArray(data) ? data : [data]).map(item => ({
      id: item.id, name: item.name, subtitle: item.subtitle || '', price: Number(item.price || 0),
      original_price: item.originalPrice ?? null, period: item.period || 'لكل باقة', badge: item.badge || '',
      popular: Boolean(item.popular), features: item.features || [], terms: item.terms || '', active: item.active !== false
    }));
    const result = await supabaseClient.rest('packages?on_conflict=id', { method: 'POST', body: packages, headers: { Prefer: 'resolution=merge-duplicates,return=representation' } });
    return { ok: true, status: 200, body: result };
  }
  if (endpoint === 'discount_codes') {
    const codes = (Array.isArray(data) ? data : [data]).map(item => ({
      code: String(item.code || '').trim().toUpperCase(), type: item.type || 'percentage',
      value: Number(item.value || 0), description: item.description || '', active: item.active !== false,
      uses_count: Number(item.usesCount || item.uses_count || 0)
    }));
    const result = await supabaseClient.rest('discount_codes?on_conflict=code', {
      method: 'POST', body: codes,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
    });
    return { ok: true, status: 200, body: result };
  }
  if (endpoint === 'discount_codes/delete') {
    await supabaseClient.rest(`discount_codes?code=eq.${encodeURIComponent(data.code)}`, { method: 'DELETE' });
    return { ok: true, status: 200, body: null };
  }
  if (endpoint === 'category_visibility') {
    const rows = Object.entries(data || {}).map(([category_id, is_visible]) => ({ category_id, is_visible: Boolean(is_visible) }));
    if (!rows.length) return { ok: true, status: 200, body: [] };
    const result = await supabaseClient.rest('category_visibility?on_conflict=category_id', {
      method: 'POST', body: rows,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
    });
    return { ok: true, status: 200, body: result };
  }
  if (endpoint === 'portfolio') {
    const items = (Array.isArray(data) ? data : [data]).map(item => ({
      id: item.id, category: item.category, category_name: item.categoryName || '', title: item.title || '',
      client_type: item.clientType || '', deliverable_type: item.type || '', media_type: item.mediaType || 'image',
      media_url: item.mediaUrl || '', thumbnail_url: item.thumbnail || item.mediaUrl || '',
      highlight: item.highlight || '', copy_sample: item.copySample || '', is_visible: item.isVisible !== false
    }));
    const result = await supabaseClient.rest('portfolio?on_conflict=id', {
      method: 'POST', body: items,
      headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
    });
    return { ok: true, status: 200, body: (result || []).map(fromDatabasePortfolio) };
  }
  if (endpoint === 'portfolio/delete') {
    await supabaseClient.rest(`portfolio?id=eq.${encodeURIComponent(data.id)}`, { method: 'DELETE' });
    return { ok: true, status: 200, body: null };
  }
  if (endpoint === 'maintenance' || endpoint === 'settings') {
    const key = endpoint === 'maintenance' ? 'maintenance' : 'public';
    const value = endpoint === 'maintenance' ? data : data;
    const result = await supabaseClient.rest('platform_settings?on_conflict=key', {
      method: 'POST', body: { key, value }, headers: { Prefer: 'resolution=merge-duplicates,return=representation' }
    });
    return { ok: true, status: 200, body: result };
  }
  if (endpoint === 'users') {
    const profile = data || {};
    const update = {
      full_name: profile.name,
      phone: profile.phone,
      store_name: profile.storeName,
      store_type: profile.storeType,
      permissions: profile.permissions
    };
    const result = await supabaseClient.rest(`profiles?id=eq.${encodeURIComponent(profile.id)}`, { method: 'PATCH', body: update, headers: { Prefer: prefer } });
    return { ok: Array.isArray(result) && result.length > 0, status: 200, body: result?.[0] || null };
  }
  return { ok: false, status: 404, body: { message: 'العملية غير مدعومة على Supabase.' } };
}

async function apiPostDetailed(endpoint, data) {
  if (isSupabaseConfigured) {
    try {
      return await supabaseApiPost(endpoint, data);
    } catch (error) {
      console.warn('Supabase request failed:', endpoint, error);
      return { ok: false, status: error.status || 0, body: { message: error.message } };
    }
  }
  try {
    const res = await fetch(`${API_BASE}/api/${endpoint}`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      },
      body: JSON.stringify(data)
    });
    let body = null;
    try { body = await res.json(); } catch { body = null; }
    return { ok: res.ok, status: res.status, body };
  } catch (e) {
    console.warn('apiPost error:', endpoint, e);
    return { ok: false, status: 0, body: null };
  }
}

async function apiPost(endpoint, data) {
  return (await apiPostDetailed(endpoint, data)).ok;
}

async function apiGet() {
  if (isSupabaseConfigured) {
    const safeRead = async (table, query = 'select=*') => {
      try { return await supabaseClient.rest(`${table}?${query}`); }
      catch (error) {
        if (error.status !== 401 && error.status !== 403) console.warn('Supabase read failed:', table, error);
        return null;
      }
    };
    try {
      const [orders, profileRows, packages, settingsRows, discounts, categories, portfolio, quotaGrants] = await Promise.all([
        safeRead('orders', 'select=*&order=created_at.desc'),
        safeRead('profiles', 'select=*'),
        safeRead('packages', 'select=*&order=price.asc'),
        safeRead('platform_settings', 'select=key,value'),
        safeRead('discount_codes', 'select=*'),
        safeRead('category_visibility', 'select=*'),
        safeRead('portfolio', 'select=*'),
        safeRead('order_quota_grants', 'select=*')
      ]);
      const users = (profileRows || []).map(profile => ({
        ...mapSupabaseProfile(profile),
        orderQuotaGrants: (quotaGrants || []).filter(grant => grant.customer_id === profile.id).map(grant => ({
          amount: grant.amount,
          grantedAt: Date.parse(grant.created_at) || 0,
          expiresAt: Date.parse(grant.expires_at) || 0
        }))
      }));
      const settings = Object.fromEntries((settingsRows || []).map(row => [row.key, row.value]));
      const publicSettings = settings.public || {};
      const maintenance = settingsRows === null ? null : (settings.maintenance || INITIAL_MAINTENANCE);
      const categoryVisibility = categories === null ? null : Object.fromEntries((categories || []).map(row => [row.category_id, row.is_visible]));
      return {
        orders: orders === null ? null : (orders || []).map(fromDatabaseOrder),
        users,
        packages: packages === null ? null : (packages || []).map(fromDatabasePackage),
        settings: settingsRows === null ? null : publicSettings,
        maintenance,
        discountCodes: discounts === null ? null : (discounts || []).map(fromDatabaseDiscount),
        categoryVisibility,
        portfolio: portfolio === null ? null : (portfolio || []).map(fromDatabasePortfolio)
      };
    } catch (error) {
      console.warn('Supabase data sync failed:', error);
      return null;
    }
  }
  try {
    const res = await fetch(`${API_BASE}/api/data?_t=${Date.now()}`, {
      cache: 'no-store',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn('apiGet error:', e);
  }
  return null;
}

// Background sync runs at a low frequency while the page is visible.
let _syncInterval = null;
let _syncInFlight = false;
async function triggerServerSync() {
  if (_syncInFlight || document.visibilityState === 'hidden') return;
  _syncInFlight = true;
  try {
  const data = await apiGet();
  if (!data) return;

  // 1. Sync orders — الخادم هو المرجع النهائي والصحيح لجميع الأجهزة
  if (Array.isArray(data.orders)) {
    const sortedOrders = data.orders.map(o => ({
      ...o,
      timestamp: Number(o.timestamp) || (o.createdAt ? new Date(o.createdAt).getTime() : 0) || Date.now()
    }));
    sortedOrders.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

    const currentOrdersRaw = localStorage.getItem(STORAGE_KEYS.ORDERS);
    const newOrdersRaw = JSON.stringify(sortedOrders);
    if (currentOrdersRaw !== newOrdersRaw) {
      localStorage.setItem(STORAGE_KEYS.ORDERS, newOrdersRaw);
      window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key: STORAGE_KEYS.ORDERS } }));
    }
  }

  // 2. Sync maintenance
  if (data.maintenance && typeof data.maintenance.enabled !== 'undefined') {
    const currentMaintRaw = localStorage.getItem(STORAGE_KEYS.MAINTENANCE);
    const newMaintRaw = JSON.stringify(data.maintenance);
    if (currentMaintRaw !== newMaintRaw) {
      localStorage.setItem(STORAGE_KEYS.MAINTENANCE, newMaintRaw);
      window.dispatchEvent(new Event('waslni_maintenance_changed'));
    }
  }

  // 3. Sync users (حسابات الموظفين والعملاء المضافة من المدير)
  if (Array.isArray(data.users) && data.users.length > 0) {
    const currentUsers = loadData(STORAGE_KEYS.USERS, []);
    const mergedUsersMap = {};
    data.users.forEach(u => { if (u.id) mergedUsersMap[u.id] = u; });
    currentUsers.forEach(u => {
      if (!mergedUsersMap[u.id]) mergedUsersMap[u.id] = u;
    });
    const finalUsers = Object.values(mergedUsersMap);
    const currentUsersRaw = localStorage.getItem(STORAGE_KEYS.USERS);
    const newUsersRaw = JSON.stringify(finalUsers);
    if (currentUsersRaw !== newUsersRaw) {
      localStorage.setItem(STORAGE_KEYS.USERS, newUsersRaw);
    }
    const signedInUser = loadData(STORAGE_KEYS.CURRENT_USER, null);
    const latestSignedInUser = signedInUser && data.users.find(user => user.id === signedInUser.id);
    if (latestSignedInUser && JSON.stringify(signedInUser) !== JSON.stringify(latestSignedInUser)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(latestSignedInUser));
      window.dispatchEvent(new Event('waslni_auth_changed'));
    }
  }

  // 4. Sync settings
  if (data.settings && Object.keys(data.settings).length > 0) {
    const currentSettingsRaw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    const newSettingsRaw = JSON.stringify(data.settings);
    if (currentSettingsRaw !== newSettingsRaw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, newSettingsRaw);
    }
  }

  // 5. Sync packages (تعديلات الباقات والأسعار للمدير والموظف)
  if (Array.isArray(data.packages) && data.packages.length > 0) {
    const currentPackagesRaw = localStorage.getItem(STORAGE_KEYS.PACKAGES);
    const newPackagesRaw = JSON.stringify(data.packages);
    if (currentPackagesRaw !== newPackagesRaw) {
      localStorage.setItem(STORAGE_KEYS.PACKAGES, newPackagesRaw);
      window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key: STORAGE_KEYS.PACKAGES } }));
    }
  }

  if (data.categoryVisibility && typeof data.categoryVisibility === 'object') {
    const value = JSON.stringify(data.categoryVisibility);
    if (localStorage.getItem(STORAGE_KEYS.CATEGORY_VISIBILITY) !== value) {
      localStorage.setItem(STORAGE_KEYS.CATEGORY_VISIBILITY, value);
      window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key: STORAGE_KEYS.CATEGORY_VISIBILITY } }));
    }
  }
  if (Array.isArray(data.discountCodes)) {
    const value = JSON.stringify(data.discountCodes);
    if (localStorage.getItem(STORAGE_KEYS.DISCOUNT_CODES) !== value) {
      localStorage.setItem(STORAGE_KEYS.DISCOUNT_CODES, value);
      window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key: STORAGE_KEYS.DISCOUNT_CODES } }));
    }
  }
  if (Array.isArray(data.portfolio)) {
    const value = JSON.stringify(data.portfolio);
    if (localStorage.getItem(STORAGE_KEYS.PORTFOLIO) !== value) {
      localStorage.setItem(STORAGE_KEYS.PORTFOLIO, value);
      window.dispatchEvent(new CustomEvent('waslni_data_changed', { detail: { key: STORAGE_KEYS.PORTFOLIO } }));
    }
  }
  } finally {
    _syncInFlight = false;
  }
}

function startServerSync() {
  if (_syncInterval) return;
  triggerServerSync();
  _syncInterval = setInterval(triggerServerSync, 15000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') triggerServerSync();
  });
  window.addEventListener('focus', triggerServerSync);
}

// Start sync when module loads
if (typeof window !== 'undefined') {
  startServerSync();
}

// الترحيل التلقائي لضمان تطبيق حسابات المدير والموظف والزبون المشفرة فوراً
function getRecentCustomerOrders(customer, orders = loadData(STORAGE_KEYS.ORDERS, [])) {
  const phone = String(customer?.phone || '').replace(/\D/g, '');
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return orders.filter(order => {
    const orderPhone = String(order.customerPhone || '').replace(/\D/g, '');
    const sameCustomer = (customer?.id && order.customerId === customer.id) || (phone && orderPhone === phone);
    const timestamp = Number(order.timestamp) || Date.parse(order.createdAt || '');
    return sameCustomer && Number.isFinite(timestamp) && timestamp >= cutoff;
  });
}

function mapSupabaseProfile(profile, email = '') {
  if (!profile) return null;
  const permissions = profile.permissions || {};
  return {
    id: profile.id,
    name: profile.full_name || '',
    email: profile.email || email,
    phone: profile.phone || '',
    username: email,
    role: profile.role || 'customer',
    storeName: profile.store_name || '',
    storeType: profile.store_type || 'عام',
    isActive: profile.is_active !== false,
    permissions: {
      canManageOrders: Boolean(permissions['orders.view'] || permissions['orders.update']),
      canManagePackages: Boolean(permissions['packages.manage']),
      canManageDiscounts: Boolean(permissions['discounts.manage']),
      canManagePortfolio: Boolean(permissions['portfolio.manage']),
      canManageCustomers: Boolean(permissions['customers.view'] || permissions['customers.manage']),
      canToggleVisibility: Boolean(permissions['visibility.manage']),
      ...permissions
    }
  };
}

function sanitizeUser(user) {
  if (!user || typeof user !== 'object') return user;
  const {
    password, passwordHash, plainHint, securityCode, encryptedPhone,
    ...safeUser
  } = user;
  return safeUser;
}

function sanitizeLegacyUserStorage() {
  if (!isSupabaseConfigured || typeof localStorage === 'undefined') return;
  try {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    if (Array.isArray(users)) localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users.map(sanitizeUser)));
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.CURRENT_USER) || 'null');
    if (current) localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sanitizeUser(current)));
  } catch {
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
}

sanitizeLegacyUserStorage();

async function getSupabaseProfile(authUser) {
  if (!authUser?.id) return null;
  const rows = await supabaseClient.rest(`profiles?id=eq.${encodeURIComponent(authUser.id)}&select=*`);
  const profile = Array.isArray(rows) ? rows[0] : null;
  if (!profile) return null;
  return mapSupabaseProfile(profile, authUser.email || '');
}

function getSessionSubject() {
  const token = supabaseClient.getSession()?.access_token;
  if (!token) return null;
  try {
    const encoded = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(encoded.padEnd(Math.ceil(encoded.length / 4) * 4, '='));
    const payload = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, char => char.charCodeAt(0))));
    return payload.sub || null;
  } catch {
    return null;
  }
}

async function prepareManagerMfa() {
  const assurance = await supabaseClient.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel === 'aal2') return null;

  const factors = await supabaseClient.listMfaFactors();
  const totpFactors = Array.isArray(factors?.totp) ? factors.totp : (Array.isArray(factors?.all) ? factors.all.filter(factor => factor.factor_type === 'totp') : []);
  const verifiedFactor = totpFactors.find(factor => factor.status === 'verified');
  if (verifiedFactor) {
    const challenge = await supabaseClient.createMfaChallenge(verifiedFactor.id);
    return { factorId: verifiedFactor.id, challengeId: challenge.id, setup: false };
  }

  // Remove abandoned, unverified enrollments so each retry can show a fresh QR code.
  for (const factor of totpFactors) {
    if (factor.id) await supabaseClient.removeMfaFactor(factor.id);
  }
  const factor = await supabaseClient.enrollTotp();
  const challenge = await supabaseClient.createMfaChallenge(factor.id);
  return {
    factorId: factor.id,
    challengeId: challenge.id,
    setup: true,
    qrCode: factor.totp?.qr_code || '',
    secret: factor.totp?.secret || ''
  };
}

export const db = {
  // SETTINGS
  getSettings: () => loadData(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS),
  updateSettings: (newSettings) => {
    const current = db.getSettings();
    const updated = { ...current, ...newSettings };
    saveData(STORAGE_KEYS.SETTINGS, updated);
    apiPost('settings', updated);
    return updated;
  },

  // ==========================================================================
  // وضع الصيانة (إغلاق الموقع للزبائن وتفعيله)
  // ==========================================================================
  getMaintenanceMode: () => loadData(STORAGE_KEYS.MAINTENANCE, INITIAL_MAINTENANCE),
  
  toggleMaintenanceMode: (enabled, customMessage = null) => {
    const current = db.getMaintenanceMode();
    const updated = {
      ...current,
      enabled: Boolean(enabled),
      message: customMessage || current.message,
      updatedAt: new Date().toLocaleString('ar-SA')
    };
    saveData(STORAGE_KEYS.MAINTENANCE, updated);
    apiPost('maintenance', updated);
    window.dispatchEvent(new Event('waslni_maintenance_changed'));
    return updated;
  },

  // ==========================================================================
  // نظام الحماية من هجمات التكرار (قفل 5 دقائق عند الخطأ مرتين)
  // ==========================================================================
  
  // فحص هل الحساب مقفل حالياً؟
  checkLockoutStatus: (username) => {
    if (!username) return { locked: false, remainingSeconds: 0 };
    const cleanUser = username.trim().toLowerCase();
    const lockouts = loadData(STORAGE_KEYS.LOCKOUT_STATUS, {});
    const lockExpiry = lockouts[cleanUser];

    if (lockExpiry && Date.now() < lockExpiry) {
      const remainingSeconds = Math.ceil((lockExpiry - Date.now()) / 1000);
      return { 
        locked: true, 
        remainingSeconds, 
        remainingMinutes: Math.ceil(remainingSeconds / 60) 
      };
    }

    // إذا انتهت المدة، إزالة القفل وتصفير المحاولات الفاشلة
    if (lockExpiry && Date.now() >= lockExpiry) {
      delete lockouts[cleanUser];
      saveData(STORAGE_KEYS.LOCKOUT_STATUS, lockouts);
      db.resetFailedAttempts(cleanUser);
    }

    return { locked: false, remainingSeconds: 0 };
  },

  // تسجيل محاولة فاشلة وقفل الحساب 5 دقائق عند الوصول للمرة 2
  recordFailedAttempt: (username) => {
    const cleanUser = username.trim().toLowerCase();
    const attemptsMap = loadData(STORAGE_KEYS.FAILED_ATTEMPTS, {});
    const count = (attemptsMap[cleanUser] || 0) + 1;
    attemptsMap[cleanUser] = count;
    saveData(STORAGE_KEYS.FAILED_ATTEMPTS, attemptsMap);

    // إشعار تيليجرام بمحاولة فاشلة
    notifyFailedLoginAttempt({ phone: cleanUser, attemptsCount: count });

    // إذا وصل للخطأ مرتين (2)، يتم قفل الحساب 5 دقائق فوراً
    if (count >= 2) {
      const lockouts = loadData(STORAGE_KEYS.LOCKOUT_STATUS, {});
      const fiveMinutesInMs = 5 * 60 * 1000;
      lockouts[cleanUser] = Date.now() + fiveMinutesInMs;
      saveData(STORAGE_KEYS.LOCKOUT_STATUS, lockouts);

      // إرسال تنبيه حرج للبوت
      notifyLockoutTriggered({
        username: cleanUser,
        attempts: count,
        lockMinutes: 5
      });

      return { 
        isLocked: true,
        isLockedNow: true, 
        remainingSeconds: 300,
        remainingMinutes: 5, 
        lockMinutes: 5, 
        message: 'تم قفل تسجيل الدخول لمدة 5 دقائق لحماية الحساب من هجمات التكرار والتخمين' 
      };
    }

    return { 
      isLocked: false,
      isLockedNow: false, 
      remainingAttempts: 2 - count,
      message: `كلمة المرور غير صحيحة (المحاولة ${count} من 2). تبقى محاولة واحدة فقط قبل قفل الحساب 5 دقائق!` 
    };
  },

  resetFailedAttempts: (username) => {
    const cleanUser = username.trim().toLowerCase();
    const attemptsMap = loadData(STORAGE_KEYS.FAILED_ATTEMPTS, {});
    delete attemptsMap[cleanUser];
    saveData(STORAGE_KEYS.FAILED_ATTEMPTS, attemptsMap);
  },

  // ==========================================================================
  // إخفاء وإظهار الأقسام
  // ==========================================================================
  getCategoryVisibility: () => loadData(STORAGE_KEYS.CATEGORY_VISIBILITY, INITIAL_CATEGORY_VISIBILITY),
  
  toggleCategoryVisibility: async (categoryId, isVisible) => {
    const visibility = db.getCategoryVisibility();
    const previous = visibility[categoryId];
    visibility[categoryId] = isVisible;
    saveData(STORAGE_KEYS.CATEGORY_VISIBILITY, visibility);
    if (isSupabaseConfigured) {
      const result = await apiPostDetailed('category_visibility', visibility);
      if (!result.ok) {
        visibility[categoryId] = previous;
        saveData(STORAGE_KEYS.CATEGORY_VISIBILITY, visibility);
        return { success: false, message: result.body?.message || 'تعذر حفظ ظهور القسم على الخادم.' };
      }
      triggerServerSync();
    }
    return { success: true, visibility };
  },

  isCategoryVisible: (categoryId) => {
    const visibility = db.getCategoryVisibility();
    return visibility[categoryId] !== false;
  },

  // ==========================================================================
  // أكواد الخصم والحاسبة
  // ==========================================================================
  getDiscountCodes: () => loadData(STORAGE_KEYS.DISCOUNT_CODES, INITIAL_DISCOUNT_CODES),
  
  addDiscountCode: async ({ code, type, value, description }) => {
    const codes = db.getDiscountCodes();
    const cleanCode = code.trim().toUpperCase();
    const existingIndex = codes.findIndex(c => c.code === cleanCode);
    
    const newEntry = {
      code: cleanCode,
      type: type || 'percentage',
      value: Number(value),
      description: description || '',
      active: true,
      usesCount: 0,
      createdAt: getSaudiDate()
    };

    if (existingIndex !== -1) {
      codes[existingIndex] = { ...codes[existingIndex], ...newEntry };
    } else {
      codes.unshift(newEntry);
    }
    const result = await apiPostDetailed('discount_codes', newEntry);
    if (!result.ok) return { success: false, message: result.body?.message || 'تعذر حفظ كود الخصم على الخادم.' };
    saveData(STORAGE_KEYS.DISCOUNT_CODES, codes);
    triggerServerSync();
    return { success: true, code: newEntry };
  },

  deleteDiscountCode: async (code) => {
    const codes = db.getDiscountCodes();
    const filtered = codes.filter(c => c.code !== code.toUpperCase());
    const result = await apiPostDetailed('discount_codes/delete', { code: code.toUpperCase() });
    if (!result.ok) return { success: false, message: result.body?.message || 'تعذر حذف كود الخصم من الخادم.' };
    saveData(STORAGE_KEYS.DISCOUNT_CODES, filtered);
    triggerServerSync();
    return { success: true, codes: filtered };
  },

  calculateDiscount: (codeStr, originalPrice) => {
    if (!codeStr) return { valid: false, discountAmount: 0, finalPrice: originalPrice };
    const codes = db.getDiscountCodes();
    const match = codes.find(c => c.code === codeStr.trim().toUpperCase() && c.active);
    
    if (!match) {
      return { valid: false, message: 'كود الخصم غير صحيح أو غير مفعّل', discountAmount: 0, finalPrice: originalPrice };
    }

    let discountAmount = 0;
    if (match.type === 'percentage') {
      discountAmount = Math.round((originalPrice * match.value) / 100);
    } else {
      discountAmount = match.value;
    }

    discountAmount = Math.min(discountAmount, originalPrice);
    const finalPrice = Math.max(0, originalPrice - discountAmount);

    return {
      valid: true,
      code: match.code,
      type: match.type,
      value: match.value,
      discountAmount,
      finalPrice,
      description: match.description
    };
  },

  // ==========================================================================
  // PACKAGES
  // ==========================================================================
  getPackages: () => loadData(STORAGE_KEYS.PACKAGES, INITIAL_PACKAGES),
  updatePackage: async (packageId, updatedFields) => {
    const packages = db.getPackages();
    const index = packages.findIndex(p => p.id === packageId);
    if (index !== -1) {
      const previous = { ...packages[index] };
      packages[index] = { ...packages[index], ...updatedFields };
      const result = await apiPostDetailed('packages', packages);
      if (!result.ok) {
        packages[index] = previous;
        return { success: false, message: result.body?.message || 'تعذر حفظ تعديلات الباقة على الخادم.' };
      }
      saveData(STORAGE_KEYS.PACKAGES, packages);
      triggerServerSync();
      return { success: true, package: packages[index] };
    }
    return { success: false, message: 'لم يتم العثور على الباقة.' };
  },

  // ==========================================================================
  // PORTFOLIO
  // ==========================================================================
  getPortfolio: (includeHidden = false) => {
    const portfolio = loadData(STORAGE_KEYS.PORTFOLIO, INITIAL_PORTFOLIO);
    if (includeHidden) return portfolio;
    const visibility = db.getCategoryVisibility();
    return portfolio.filter(item => visibility[item.category] !== false);
  },

  uploadPortfolioAsset: async (file) => {
    if (!isSupabaseConfigured) throw new Error('يجب ربط Supabase Storage قبل رفع ملفات المعرض.');
    const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']);
    if (!file || !allowedTypes.has(file.type)) throw new Error('نوع الملف غير مدعوم. استخدم JPG أو PNG أو WebP أو GIF أو MP4 أو WebM.');
    if (file.size > 50 * 1024 * 1024) throw new Error('يجب أن يكون حجم الملف أقل من 50 ميجابايت.');
    const extension = file.type.split('/')[1].replace('jpeg', 'jpg');
    const fileId = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const objectPath = `media/${fileId}.${extension}`;
    return supabaseClient.uploadPublicFile('waslni-portfolio', objectPath, file);
  },

  addPortfolioItem: async (item) => {
    if (/^data:/i.test(String(item?.mediaUrl || ''))) {
      return { success: false, message: 'لا يمكن حفظ الملف كبيانات داخل قاعدة البيانات. ارفعه إلى Supabase Storage أولاً.' };
    }
    const portfolio = loadData(STORAGE_KEYS.PORTFOLIO, INITIAL_PORTFOLIO);
    const newItem = {
      ...item,
      id: `port_${globalThis.crypto?.randomUUID?.() || `${Date.now()}_${Math.random().toString(36).slice(2)}`}`,
      isVisible: true
    };
    const result = await apiPostDetailed('portfolio', newItem);
    if (!result.ok) return { success: false, message: result.body?.message || 'تعذر حفظ مادة المعرض على الخادم.' };
    portfolio.unshift(newItem);
    saveData(STORAGE_KEYS.PORTFOLIO, portfolio);
    triggerServerSync();
    return { success: true, item: newItem };
  },

  deletePortfolioItem: async (id) => {
    const portfolio = loadData(STORAGE_KEYS.PORTFOLIO, INITIAL_PORTFOLIO);
    const item = portfolio.find(entry => entry.id === id);
    const result = await apiPostDetailed('portfolio/delete', { id });
    if (!result.ok) return { success: false, message: result.body?.message || 'تعذر حذف مادة المعرض من الخادم.' };
    const filtered = portfolio.filter(p => p.id !== id);
    saveData(STORAGE_KEYS.PORTFOLIO, filtered);
    if (item?.mediaUrl?.includes('/storage/v1/object/public/waslni-portfolio/')) {
      const objectPath = item.mediaUrl.split('/storage/v1/object/public/waslni-portfolio/')[1];
      try { await supabaseClient.removePublicFile('waslni-portfolio', decodeURIComponent(objectPath)); } catch (error) {
        console.warn('Portfolio file cleanup failed:', error);
      }
    }
    triggerServerSync();
    return { success: true, portfolio: filtered };
  },

  // ==========================================================================
  // USERS & AUTH & ENCRYPTION
  // ==========================================================================
  getUsers: () => {
    return loadData(STORAGE_KEYS.USERS, []).map(sanitizeUser);
  },

  getCurrentUser: () => {
    if (isSupabaseConfigured && !supabaseClient.getSession()?.access_token) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      const user = raw ? JSON.parse(raw) : null;
      if (isSupabaseConfigured && (!user?.id || user.id !== getSessionSubject())) {
        localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
        return null;
      }
      return user;
    } catch {
      return null;
    }
  },

  setCurrentUser: (user) => {
    if (!user) {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    } else {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sanitizeUser(user)));
    }
    window.dispatchEvent(new Event('waslni_auth_changed'));
  },

  refreshCurrentUser: async () => {
    if (!isSupabaseConfigured) return db.getCurrentUser();
    try {
      const authUser = await supabaseClient.getUser();
      const user = await getSupabaseProfile(authUser);
      if (!user?.isActive) {
        db.setCurrentUser(null);
        return null;
      }
      if (user.role === 'manager') {
        const assurance = await supabaseClient.getAuthenticatorAssuranceLevel();
        if (assurance?.currentLevel !== 'aal2') {
          db.setCurrentUser(null);
          return null;
        }
      }
      db.setCurrentUser(user);
      return user;
    } catch {
      db.setCurrentUser(null);
      return null;
    }
  },

  // المدير ينشئ حساب لموظف جديد مشفر بالكامل مع تحديد الصلاحيات
  createEmployeeAccountByManager: async ({ name, username, password, permissions, require2FA }) => {
    if (!isSupabaseConfigured) return { success: false, message: 'الخادم غير مهيأ بعد.' };
    const email = username.trim().toLowerCase();
    if (!name.trim() || !email || !password.trim()) return { success: false, message: 'أدخل اسم الموظف وبريده وكلمة مروره.' };
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { success: false, message: 'اكتب بريد الموظف الإلكتروني في خانة اسم المستخدم.' };
    if (password.length < 8) return { success: false, message: 'يجب ألا تقل كلمة مرور الموظف عن 8 خانات.' };
    if (require2FA) return { success: false, message: 'تسجيل الدخول بخطوتين لم يُربط بمزود المصادقة بعد؛ ألغِ تحديده مؤقتًا.' };

    const permissionsMap = {
      'orders.view': Boolean(permissions?.canManageOrders),
      'orders.update': Boolean(permissions?.canManageOrders),
      'packages.manage': Boolean(permissions?.canManagePackages),
      'discounts.manage': Boolean(permissions?.canManageDiscounts),
      'portfolio.manage': Boolean(permissions?.canManagePortfolio),
      'customers.view': Boolean(permissions?.canManageCustomers),
      'customers.manage': Boolean(permissions?.canManageCustomers),
      'visibility.manage': Boolean(permissions?.canToggleVisibility)
    };
    try {
      const result = await supabaseClient.invoke('manage-staff', {
        action: 'create_employee', name: name.trim(), email, password, permissions: permissionsMap
      });
      const employee = mapSupabaseProfile(result?.profile, email);
      await triggerServerSync();
      return { success: true, employee };
    } catch (error) {
      return { success: false, message: error.message || 'تعذر إنشاء حساب الموظف.' };
    }
  },

  updateEmployeePermissionsByManager: async (empId, updatedPermissions) => {
    const permissionsMap = {
      'orders.view': Boolean(updatedPermissions?.canManageOrders),
      'orders.update': Boolean(updatedPermissions?.canManageOrders),
      'packages.manage': Boolean(updatedPermissions?.canManagePackages),
      'discounts.manage': Boolean(updatedPermissions?.canManageDiscounts),
      'portfolio.manage': Boolean(updatedPermissions?.canManagePortfolio),
      'customers.view': Boolean(updatedPermissions?.canManageCustomers),
      'customers.manage': Boolean(updatedPermissions?.canManageCustomers),
      'visibility.manage': Boolean(updatedPermissions?.canToggleVisibility)
    };
    try {
      await supabaseClient.invoke('manage-staff', { action: 'update_employee_permissions', userId: empId, permissions: permissionsMap });
      await triggerServerSync();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'تعذر تحديث الصلاحيات.' };
    }
  },

  deleteEmployeeAccountByManager: async (empId) => {
    try {
      await supabaseClient.invoke('manage-staff', { action: 'delete_employee', userId: empId });
      await triggerServerSync();
      return { success: true };
    } catch (error) {
      return { success: false, message: error.message || 'تعذر حذف حساب الموظف.' };
    }
  },

  // تسجيل عميل جديد (مشفر آلياً مع كود تحقق وتنبيه تيليجرام)
  registerCustomer: async ({ name, email, phone, password, storeName, storeType }) => {
    if (!isSupabaseConfigured) {
      return { success: false, message: 'الخادم غير مهيأ بعد. أكمل إعداد Supabase قبل إنشاء الحساب.' };
    }
    if (db.getMaintenanceMode().enabled) {
      return { success: false, message: 'إنشاء حسابات العملاء متوقف أثناء الصيانة. يرجى المحاولة بعد إعادة فتح الموقع.' };
    }
    if (!password || password.length < 8) {
      return { success: false, message: 'يجب ألا تقل كلمة المرور عن 8 خانات.' };
    }

    try {
      const authResult = await supabaseClient.signUp({
        email: email.trim().toLowerCase(),
        password,
        metadata: {
          full_name: name.trim(),
          phone: phone.trim(),
          store_name: storeName?.trim() || 'محلي التجاري',
          store_type: storeType || 'عام'
        }
      });
      if (!authResult?.user) return { success: false, message: 'لم يكتمل إنشاء الحساب. تحقق من البيانات وحاول مجددًا.' };
      if (!authResult.access_token) {
        return {
          success: true,
          pendingEmailConfirmation: true,
          message: 'تم إنشاء الحساب. افتح رسالة التحقق في بريدك الإلكتروني، ثم سجّل الدخول.'
        };
      }
      const user = await getSupabaseProfile(authResult.user);
      if (!user) return { success: false, message: 'تم إنشاء الحساب لكن لم يكتمل ملف المستخدم. تواصل مع الدعم.' };
      db.setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.message || 'تعذر إنشاء الحساب في Supabase.' };
    }
  },

  // --------------------------------------------------------------------------
  // التحقق الصارم من الدخول مع الحماية من التكرار (قفل 5 دقائق بعد محاولتين)
  // --------------------------------------------------------------------------
  loginVerifyCredentials: async (email, password) => {
    if (!isSupabaseConfigured) return { success: false, message: 'الخادم غير مهيأ بعد. أكمل إعداد Supabase قبل تسجيل الدخول.' };
    const cleanIdentifier = email?.trim().toLowerCase();
    if (!cleanIdentifier || !password?.trim()) return { success: false, message: 'يرجى إدخال البريد الإلكتروني وكلمة المرور.' };
    try {
      // Clear any previous identity before switching accounts in the same browser.
      await supabaseClient.signOut();
      db.setCurrentUser(null);
      await supabaseClient.signInWithPassword({ email: cleanIdentifier, password });
      const authUser = await supabaseClient.getUser();
      const user = await getSupabaseProfile(authUser);
      if (!user || !user.isActive) {
        await supabaseClient.signOut();
        return { success: false, message: 'الحساب غير مفعل أو لم يُنشأ له ملف مستخدم. تواصل مع المدير.' };
      }
      if (db.getMaintenanceMode().enabled && user.role === 'customer') {
        await supabaseClient.signOut();
        return { success: false, message: 'الموقع تحت الصيانة حالياً، تسجيل دخول العملاء متوقف مؤقتاً.' };
      }
      if (user.role === 'manager') {
        const mfa = await prepareManagerMfa();
        if (mfa) return { success: true, requiresManagerMfa: true, user, ...mfa };
      }
      db.resetFailedAttempts(cleanIdentifier);
      db.setCurrentUser(user);
      return { success: true, requires2FA: false, user };
    } catch (error) {
      const failResult = db.recordFailedAttempt(cleanIdentifier);
      return { success: false, ...failResult, message: error.message || 'بيانات الدخول غير صحيحة.' };
    }
  },

  completeManagerMfa: async ({ factorId, challengeId, code }) => {
    try {
      await supabaseClient.verifyMfaChallenge(factorId, challengeId, String(code || '').trim());
      const [authUser, assurance] = await Promise.all([
        supabaseClient.getUser(),
        supabaseClient.getAuthenticatorAssuranceLevel()
      ]);
      const user = await getSupabaseProfile(authUser);
      if (!user?.isActive || user.role !== 'manager' || assurance?.currentLevel !== 'aal2') {
        await supabaseClient.signOut();
        db.setCurrentUser(null);
        return { success: false, message: 'تعذر اعتماد تحقق المدير. سجّل الدخول من جديد.' };
      }
      db.resetFailedAttempts(user.email);
      db.setCurrentUser(user);
      return { success: true, user };
    } catch (error) {
      return { success: false, message: error.message || 'رمز التحقق غير صحيح أو انتهت صلاحيته.' };
    }
  },

  // التحقق من كود الأمان الرباعي
  verifyLogin2FA: (code) => {
    if (isSupabaseConfigured) {
      return { success: false, message: 'لم يعد التحقق المحلي صالحًا. استخدم رمز تطبيق المصادقة المرتبط بحساب المدير.' };
    }
    const pendingId = sessionStorage.getItem('waslni_2fa_pending_user_id');
    const pendingCode = sessionStorage.getItem('waslni_2fa_pending_code');

    if (!pendingId || !pendingCode) {
      return { success: false, message: 'انتهت صلاحية جلسة التحقق، يرجى إعادة إدخال بيانات الدخول' };
    }

    const users = db.getUsers();
    const user = users.find(u => u.id === pendingId);
    if (!user) {
      return { success: false, message: 'لم يتم العثور على الحساب' };
    }

    const trimmedCode = (code || '').trim();
    const isMatchingOtp = trimmedCode === pendingCode.trim();
    const isMatchingPermanentCode = user.securityCode && trimmedCode === user.securityCode.trim();
    if (!isMatchingOtp && !isMatchingPermanentCode) {
      return { success: false, message: 'كود التحقق الرباعي غير صحيح، يرجى مراجعة الكود وإعادة المحاولة' };
    }

    sessionStorage.removeItem('waslni_2fa_pending_user_id');
    sessionStorage.removeItem('waslni_2fa_pending_code');

    db.setCurrentUser(user);
    return { success: true, user };
  },

  logout: async () => {
    try { await supabaseClient.signOut(); } catch { /* Always clear the local UI session. */ }
    db.setCurrentUser(null);
  },

  // قائمة العملاء والموظفين للمدير
  getCustomersList: (requester = null) => {
    const current = requester || db.getCurrentUser();
    if (!current || (current.role !== 'manager' && current.role !== 'employee')) {
      return [];
    }
    const users = loadData(STORAGE_KEYS.USERS, INITIAL_USERS);
    return users.filter(u => u.role === 'customer');
  },

  getEmployeesList: (requester = null) => {
    const current = requester || db.getCurrentUser();
    if (!current || current.role !== 'manager') {
      return [];
    }
    const users = loadData(STORAGE_KEYS.USERS, INITIAL_USERS);
    return users.filter(u => u.role === 'employee');
  },

  // إعادة تعيين كلمة مرور العميل
  resetCustomerPasswordByStaff: async (customerId, newPassword, resetByRequester) => {
    if (!resetByRequester || (resetByRequester.role !== 'manager' && resetByRequester.role !== 'employee')) {
      return { success: false, message: 'غير مصرح لك بتنفيذ هذه العملية' };
    }
    if (!newPassword || newPassword.length < 8) {
      return { success: false, message: 'معايير الأمان: كلمة المرور الجديدة يجب أن تكون 8 خانات على الأقل' };
    }

    try {
      await supabaseClient.invoke('manage-staff', { action: 'reset_customer_password', userId: customerId, password: newPassword.trim() });
      return { success: true, message: 'تم تحديث كلمة المرور من الخادم.' };
    } catch (error) {
      return { success: false, message: error.message || 'تعذر تحديث كلمة المرور.' };
    }
  },

  // ==========================================================================
  // ORDERS & IDOR PROTECTION
  // ==========================================================================
  getOrders: (requester = null) => {
    const allOrders = loadData(STORAGE_KEYS.ORDERS, []);
    const user = requester || db.getCurrentUser();
    
    // إذا كان الطالب مديراً أو موظفاً، تُعرض كافة الطلبات دائماً بلا استثناء
    if (user && (user.role === 'manager' || user.role === 'employee')) {
      return allOrders;
    }

    // إذا كان زبوناً، تُعرض طلباته فقط المرتبطة بمعرفه أو رقم جواله
    if (user && user.role === 'customer') {
      return allOrders.filter(o => 
        (o.customerId && user.id && o.customerId === user.id) || 
        (o.customerPhone && user.phone && o.customerPhone === user.phone)
      );
    }

    return [];
  },

  getCustomerOrderQuota: (customer) => {
    const orders = getRecentCustomerOrders(customer);
    const users = loadData(STORAGE_KEYS.USERS, INITIAL_USERS);
    const savedCustomer = users.find(user => user.role === 'customer' && ((customer?.id && user.id === customer.id) || (customer?.phone && user.phone === customer.phone)));
    const activeGrants = (savedCustomer?.orderQuotaGrants || []).filter(grant => Number(grant.expiresAt) > Date.now());
    const granted = activeGrants.reduce((sum, grant) => sum + Math.max(0, Number(grant.amount) || 0), 0);
    const limit = 3 + granted;
    const extraCredits = Math.max(0, granted - Math.max(0, orders.length - 3));
    const oldestOrderTime = orders.reduce((oldest, order) => {
      const time = Number(order.timestamp) || Date.parse(order.createdAt || '');
      return Number.isFinite(time) ? Math.min(oldest, time) : oldest;
    }, Number.POSITIVE_INFINITY);
    return {
      used: orders.length,
      limit,
      remaining: Math.max(0, limit - orders.length),
      extraCredits,
      resetsAt: orders.length >= limit && Number.isFinite(oldestOrderTime) ? new Date(oldestOrderTime + 24 * 60 * 60 * 1000).toISOString() : null
    };
  },

  grantCustomerOrderAttempts: async (customerId, count = 3, requester = null) => {
    const actor = requester || db.getCurrentUser();
    if (!actor || (actor.role !== 'manager' && !(actor.role === 'employee' && actor.permissions?.canManageCustomers))) {
      return { success: false, message: 'لا تملك صلاحية منح محاولات طلب إضافية للعميل.' };
    }
    const grantCount = Math.max(1, Math.min(10, Math.floor(Number(count) || 3)));
    try {
      await supabaseClient.invoke('manage-staff', { action: 'grant_order_attempts', userId: customerId, count: grantCount });
      await triggerServerSync();
      return { success: true, message: `تم منح العميل ${grantCount} محاولات طلب إضافية لمدة 24 ساعة.` };
    } catch (error) {
      return { success: false, message: error.message || 'تعذر منح محاولات الطلب.' };
    }
  },

  createOrder: async ({ customer, packageItem, amount, storeName, storeType, notes, discountCode, discountAmount }) => {
    if (isSupabaseConfigured) {
      try {
        const authUser = await supabaseClient.getUser();
        const verifiedCustomer = await getSupabaseProfile(authUser);
        if (!verifiedCustomer?.isActive) {
          return { success: false, message: 'سجّل الدخول بحساب عميل نشط قبل إرسال الطلب. إذا لم يكن لديك حساب، أنشئ حسابًا ثم سجّل الدخول.' };
        }
        if (verifiedCustomer.role !== 'customer') {
          return { success: false, message: 'إنشاء طلب خدمة متاح لحسابات العملاء فقط. سجّل الخروج ثم استخدم حساب العميل، أو أنشئ حسابًا جديدًا.' };
        }
        // Bind the order to the authenticated profile, never to an ID supplied by the UI.
        customer = { ...customer, id: verifiedCustomer.id, role: verifiedCustomer.role };
      } catch {
        return { success: false, message: 'تعذر التحقق من جلسة الدخول. سجّل الدخول مجددًا ثم حاول إرسال الطلب.' };
      }
    }

    const orders = loadData(STORAGE_KEYS.ORDERS, []);
    const timestamp = Date.now();
    if (!customer?.role || customer.role === 'customer') {
      const quota = db.getCustomerOrderQuota(customer);
      if (quota.remaining <= 0) {
        return { success: false, message: 'وصلت إلى الحد المسموح: 3 طلبات خلال آخر 24 ساعة. تواصل مع الموظف لمنحك محاولات إضافية.', quota };
      }
      // Active staff grants extend the same rolling 24-hour order window.
    }
    // رقم طلب فريد: WS-XXXXXX (6 أرقام) + نضمن عدم التكرار
    let orderNumber;
    do {
      orderNumber = 'WS-' + Math.floor(100000 + Math.random() * 900000);
    } while (orders.some(o => o.orderNumber === orderNumber));
    const securityCode = generate4DigitCode();

    const newOrder = {
      id: orderNumber,
      orderNumber,
      timestamp,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      storeName: storeName || customer.storeName || 'متجري',
      storeType: storeType || customer.storeType || 'عام',
      packageId: packageItem.id,
      packageName: packageItem.name,
      amount: amount || packageItem.price,
      originalAmount: packageItem.price,
      discountCode: discountCode || null,
      discountAmount: discountAmount || 0,
      securityCode,
      status: 'pending_payment',
      paymentStatus: 'unpaid',
      createdAt: getSaudiDateTime(),
      receiptImage: null,
      transferredBy: null,
      notes: notes || '',
      deliveryTimeline: 'خلال 24-48 ساعة'
    };

    orders.unshift(newOrder);
    saveData(STORAGE_KEYS.ORDERS, orders);
    const serverResult = await apiPostDetailed('orders', newOrder);
    if (!serverResult.ok) {
      const remainingOrders = loadData(STORAGE_KEYS.ORDERS, []).filter(order => order.id !== newOrder.id);
      saveData(STORAGE_KEYS.ORDERS, remainingOrders);
      const serverMessage = serverResult.body?.message || serverResult.body?.error || '';
      const quotaError = serverMessage.includes('الحد اليومي') || serverMessage.includes('24 ساعة');
      const accessError = serverMessage.toLowerCase().includes('row-level security');
      return {
        success: false,
        message: accessError
          ? 'تعذر اعتماد صلاحية حسابك لإنشاء الطلب. سجّل الخروج، ثم سجّل الدخول بحساب عميل نشط وحاول مجددًا.'
          : serverMessage || (quotaError
          ? 'وصلت إلى الحد المسموح من الطلبات خلال آخر 24 ساعة.'
          : 'تعذر حفظ الطلب في قاعدة البيانات؛ لم يتم إنشاء الطلب. حاول مرة أخرى.'),
        quota: quotaError ? db.getCustomerOrderQuota(customer) : undefined
      };
    }
    if (serverResult.body && typeof serverResult.body === 'object') {
      const savedIndex = orders.findIndex(order => order.id === newOrder.id);
      if (savedIndex !== -1) orders[savedIndex] = { ...newOrder, ...serverResult.body };
      saveData(STORAGE_KEYS.ORDERS, orders);
    }
    triggerServerSync();

    const telegramResult = await notifyNewOrderCreated({
      orderNumber,
      customerName: newOrder.customerName,
      customerPhone: newOrder.customerPhone,
      packageName: newOrder.packageName,
      amount: newOrder.amount,
      storeName: newOrder.storeName,
      storeType: newOrder.storeType,
      notes: newOrder.notes,
      securityCode,
      discountCode,
      discountAmount
    });

    const warnings = [];
    if (!telegramResult?.success) warnings.push('تعذر إرسال إشعار Telegram؛ تحقق من إعدادات الخادم.');
    if (!serverResult.ok) warnings.push('حُفظ الطلب على هذا الجهاز، لكن تعذرت مزامنته مع الخادم.');
    return { ...newOrder, notificationWarning: warnings.length ? warnings.join(' ') : null };
  },

  // تسجيل واستيراد طلب يدوي مباشرة من لوحة الإدارة (عند استلام طلب من الواتساب أو التيليجرام)
  createManualOrder: async ({ orderNumber, securityCode, customerName, customerPhone, storeName, storeType, packageName, amount, status, notes }) => {
    const orders = loadData(STORAGE_KEYS.ORDERS, []);
    const timestamp = Date.now();
    const finalOrderNumber = (orderNumber && orderNumber.trim()) 
      ? orderNumber.trim().toUpperCase() 
      : ('WS-' + Math.floor(100000 + Math.random() * 900000));
    const finalSecurityCode = (securityCode && securityCode.trim()) 
      ? securityCode.trim() 
      : generate4DigitCode();
    
    const existingIndex = orders.findIndex(o => o.orderNumber === finalOrderNumber || o.id === finalOrderNumber);

    const orderData = {
      id: finalOrderNumber,
      orderNumber: finalOrderNumber,
      timestamp,
      customerId: null,
      customerName: (customerName || 'عميل وصلني').trim(),
      customerPhone: (customerPhone || '0500000000').trim(),
      storeName: (storeName || 'نشاط تجاري').trim(),
      storeType: (storeType || 'عام').trim(),
      packageId: null,
      packageName: (packageName || 'باقة محتوى إعلاني وتسويقي').trim(),
      amount: Number(amount) || 99,
      originalAmount: Number(amount) || 99,
      discountCode: null,
      discountAmount: 0,
      securityCode: finalSecurityCode,
      status: status || 'pending_payment',
      paymentStatus: (status === 'transferred' || status === 'approved_by_manager' || status === 'completed') ? 'paid_verified' : 'unpaid',
      createdAt: getSaudiDateTime(),
      receiptImage: null,
      transferredBy: status === 'transferred' ? 'تسجيل يدوي موثق' : null,
      notes: notes ? notes.trim() : 'تم إدراج وتسجيل الطلب يدوياً في لوحة الإدارة',
      deliveryTimeline: 'خلال 24-48 ساعة'
    };

    if (existingIndex !== -1) {
      return { success: false, message: 'رقم الطلب مستخدم بالفعل. أدخل رقمًا مختلفًا.' };
    }
    if (!isSupabaseConfigured) {
      return { success: false, message: 'يلزم الاتصال بقاعدة بيانات Supabase لتسجيل الطلب اليدوي.' };
    }
    const serverResult = await apiPostDetailed('orders', orderData);
    if (!serverResult.ok) {
      return { success: false, message: serverResult.body?.message || 'تعذر حفظ الطلب اليدوي في قاعدة البيانات.' };
    }
    orders.unshift({ ...orderData, ...(serverResult.body || {}) });
    saveData(STORAGE_KEYS.ORDERS, orders);
    triggerServerSync();
    return { success: true, order: orders[0] };
  },
  
  markOrderTransferredByEmployee: async (orderId, { receiptSentToTelegram = false, employeeName, notes, packageId }) => {
    const orders = loadData(STORAGE_KEYS.ORDERS, []);
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (orderIndex !== -1) {
      const previousOrder = { ...orders[orderIndex] };
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: 'transferred',
        paymentStatus: 'paid_verified',
        receiptImage: null,
        receiptSentToTelegram: Boolean(receiptSentToTelegram) || Boolean(orders[orderIndex].receiptSentToTelegram),
        transferredBy: employeeName || 'موظف العمليات',
        transferredAt: getSaudiDateTime(),
        packageId: packageId || orders[orderIndex].packageId,
        notes: notes ? `${orders[orderIndex].notes ? orders[orderIndex].notes + ' | ' : ''}${notes}` : orders[orderIndex].notes
      };
      saveData(STORAGE_KEYS.ORDERS, orders);
      const serverResult = await apiPostDetailed('orders/update', { id: orderId, updates: orders[orderIndex] });
      if (!serverResult.ok) {
        orders[orderIndex] = previousOrder;
        saveData(STORAGE_KEYS.ORDERS, orders);
        return { success: false, message: serverResult.body?.message || 'تعذر حفظ حالة التحويل في قاعدة البيانات.' };
      }
      triggerServerSync();

      notifyTransferConfirmed({
        orderNumber: orders[orderIndex].orderNumber,
        customerName: orders[orderIndex].customerName,
        packageName: orders[orderIndex].packageName,
        amount: orders[orderIndex].amount,
        transferredBy: orders[orderIndex].transferredBy,
        notes: orders[orderIndex].notes,
        securityCode: orders[orderIndex].securityCode
      });

      return { success: true, order: orders[orderIndex] };
    }
    return { success: false, message: 'لم يتم العثور على الطلب.' };
  },

  approveOrderByManager: async (orderId) => {
    const orders = loadData(STORAGE_KEYS.ORDERS, []);
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (orderIndex !== -1) {
      const previousOrder = { ...orders[orderIndex] };
      orders[orderIndex] = {
        ...orders[orderIndex],
        status: 'approved_by_manager',
        managerApprovedAt: getSaudiDateTime()
      };
      saveData(STORAGE_KEYS.ORDERS, orders);
      const serverResult = await apiPostDetailed('orders/update', { id: orderId, updates: orders[orderIndex] });
      if (!serverResult.ok) {
        orders[orderIndex] = previousOrder;
        saveData(STORAGE_KEYS.ORDERS, orders);
        return { success: false, message: serverResult.body?.message || 'تعذر اعتماد الطلب في قاعدة البيانات.' };
      }
      triggerServerSync();
      return { success: true, order: orders[orderIndex] };
    }
    return { success: false, message: 'لم يتم العثور على الطلب.' };
  },

  updateOrderStatus: async (orderId, status) => {
    const orders = loadData(STORAGE_KEYS.ORDERS, []);
    const orderIndex = orders.findIndex(o => o.id === orderId || o.orderNumber === orderId);
    if (orderIndex !== -1) {
      const previousOrder = { ...orders[orderIndex] };
      orders[orderIndex].status = status;
      orders[orderIndex].statusUpdatedAt = getSaudiDateTime();
      saveData(STORAGE_KEYS.ORDERS, orders);
      const serverResult = await apiPostDetailed('orders/update', { id: orderId, updates: { status } });
      if (!serverResult.ok) {
        orders[orderIndex] = previousOrder;
        saveData(STORAGE_KEYS.ORDERS, orders);
        return { success: false, message: serverResult.body?.message || 'تعذر تحديث حالة الطلب في قاعدة البيانات.' };
      }
      triggerServerSync();
      return { success: true, order: orders[orderIndex] };
    }
    return { success: false, message: 'لم يتم العثور على الطلب.' };
  },

  // طلب كود أمان رباعي لحذف طلب (صلاحية المدير العام فقط)
  requestOrderDeletionCode: async (orderId, manager, action = 'cancel') => {
    if (!manager || manager.role !== 'manager') {
      return { success: false, message: 'صلاحية حذف الطلبات محصورة بالمدير العام فقط' };
    }
    const orders = loadData(STORAGE_KEYS.ORDERS, []);
    const order = orders.find(o => o.id === orderId || o.orderNumber === orderId);
    if (!order) {
      return { success: false, message: 'الطلب غير موجود في النظام' };
    }

    if (!isSupabaseConfigured) return { success: false, message: 'يلزم ربط قاعدة البيانات الآمنة قبل حذف الطلبات.' };
    try {
      return await supabaseClient.invoke('manage-order-deletion', {
        action: 'request_code', orderNumber: order.orderNumber, deleteAction: action
      });
    } catch (error) {
      return { success: false, message: error.message || 'تعذر طلب رمز الحذف من الخادم.' };
    }
  },

  // تنفيذ حذف الطلب نهائياً بعد مطابقة كود الأمان الرباعي
  deleteOrderByManager: async (orderId, enteredCode, manager, action = 'cancel') => {
    if (!manager || manager.role !== 'manager') {
      return { success: false, message: 'صلاحية حذف الطلبات محصورة بالمدير العام فقط' };
    }

    if (!isSupabaseConfigured) return { success: false, message: 'يلزم ربط قاعدة البيانات الآمنة قبل حذف الطلبات.' };
    try {
      const result = await supabaseClient.invoke('manage-order-deletion', {
        action: 'confirm_code', orderNumber: orderId, deleteAction: action, code: enteredCode.trim()
      });
      if (result?.success) triggerServerSync();
      return result;
    } catch (error) {
      return { success: false, message: error.message || 'تعذر تأكيد حذف الطلب على الخادم.' };
    }
  },

  // حذف نهائي دائم للطلب (لا يمكن الرجوع عنه) — صلاحية المدير فقط
  hardDeleteOrderByManager: (orderId, enteredCode, manager) => {
    return db.deleteOrderByManager(orderId, enteredCode, manager, 'hard_delete');
  },

};
