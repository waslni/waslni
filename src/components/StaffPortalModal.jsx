import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../services/db';
import { sendReceiptToTelegram } from '../services/telegramService';
import { 
  X, 
  Upload, 
  Package, 
  Image as ImageIcon, 
  Phone, 
  Save, 
  Trash2, 
  Plus, 
  ShieldCheck, 
  FileText,
  Eye,
  EyeOff,
  LogOut,
  Video,
  CheckCircle,
  Check,
  Download,
  Tag,
  Calculator,
  Users,
  Key,
  Layers,
  UserPlus,
  UserCheck,
  Wrench,
  Power,
  AlertTriangle,
  Lock,
  ShieldAlert,
  Search,
  Copy
} from 'lucide-react';

export default function StaffPortalModal({ isOpen, onClose, currentUser, onLogout }) {
  const isManager = currentUser?.role === 'manager';
  const canAccessOrders = isManager || currentUser?.permissions?.canManageOrders === true;
  const canAccessVisibility = isManager || currentUser?.permissions?.canToggleVisibility === true;
  const canAccessDiscounts = isManager || currentUser?.permissions?.canManageDiscounts === true;
  const canAccessCustomers = isManager || currentUser?.permissions?.canManageCustomers === true;
  const canAccessPackages = isManager || currentUser?.permissions?.canManagePackages === true;
  const canAccessPortfolio = isManager || currentUser?.permissions?.canManagePortfolio === true;
  const canAccessContact = isManager;
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' | 'packages' | 'discounts' | 'visibility' | 'customers' | 'portfolio' | 'contact' | 'employees' | 'maintenance'
  
  // Local states
  const [orders, setOrders] = useState(() => canAccessOrders ? db.getOrders(currentUser) : []);
  const [packages, setPackages] = useState(() => canAccessPackages ? db.getPackages() : []);
  const [settings, setSettings] = useState(() => canAccessContact ? db.getSettings() : {});
  const [portfolio, setPortfolio] = useState(() => canAccessPortfolio ? db.getPortfolio(true) : []);
  const [discountCodes, setDiscountCodes] = useState(() => canAccessDiscounts ? db.getDiscountCodes() : []);
  const [categoryVisibility, setCategoryVisibility] = useState(() => canAccessVisibility ? db.getCategoryVisibility() : {});
  const [customers, setCustomers] = useState(() => canAccessCustomers ? db.getCustomersList(currentUser) : []);
  const [employees, setEmployees] = useState(() => isManager ? db.getEmployeesList(currentUser) : []);
  const [maintenanceMode, setMaintenanceMode] = useState(() => isManager ? db.getMaintenanceMode() : { enabled: false });
  const [maintenanceMessage, setMaintenanceMessage] = useState(() => isManager ? db.getMaintenanceMode().message : '');
  const [maintenanceReturn, setMaintenanceReturn] = useState(() => isManager ? db.getMaintenanceMode().estimatedReturn || 'خلال وقت قصير' : '');

  // Employee creation by manager state
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpPassword, setNewEmpPassword] = useState('');
  const [newEmpRequire2FA, setNewEmpRequire2FA] = useState(false);
  const [newEmpPermissions, setNewEmpPermissions] = useState({
    canManageOrders: true,
    canManagePackages: false,
    canManageDiscounts: false,
    canManagePortfolio: false,
    canManageCustomers: false,
    canToggleVisibility: false
  });

  // Edit employee permissions modal state
  const [selectedEmpForPerms, setSelectedEmpForPerms] = useState(null);
  const [editPermsState, setEditPermsState] = useState({});

  // Order Deletion with Security Code State (صلاحية المدير العام)
  const [orderToDelete, setOrderToDelete] = useState(null);
  const [orderToDeleteAction, setOrderToDeleteAction] = useState('cancel');
  const [deletionCodeInput, setDeletionCodeInput] = useState('');
  const [deletionError, setDeletionError] = useState('');
  const [isDeletingOrder, setIsDeletingOrder] = useState(false);
  
  const [notification, setNotification] = useState('');

  // Transfer Receipt Action Modal State
  const [selectedOrderForTransfer, setSelectedOrderForTransfer] = useState(null);
  const [receiptImage, setReceiptImage] = useState('');
  const [transferNotes, setTransferNotes] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  
  // Preview Receipt Modal State
  const [previewReceiptUrl, setPreviewReceiptUrl] = useState(null);

  // New Media Form State
  const [newMediaTitle, setNewMediaTitle] = useState('');
  const [newMediaCategory, setNewMediaCategory] = useState('fashion');
  const [newMediaType, setNewMediaType] = useState('image');
  const [newMediaUrl, setNewMediaUrl] = useState('');
  const [newMediaClient, setNewMediaClient] = useState('');
  const [newMediaHighlight, setNewMediaHighlight] = useState('');

  // Editing Package State
  const [editingPackageId, setEditingPackageId] = useState(null);
  const [pkgEditPrice, setPkgEditPrice] = useState(0);
  const [pkgEditOrigPrice, setPkgEditOrigPrice] = useState(0);
  const [pkgEditName, setPkgEditName] = useState('');
  const [pkgEditBadge, setPkgEditBadge] = useState('');
  const [pkgEditSubtitle, setPkgEditSubtitle] = useState('');
  const [pkgEditPeriod, setPkgEditPeriod] = useState('');
  const [pkgEditTerms, setPkgEditTerms] = useState('');
  const [pkgEditFeaturesText, setPkgEditFeaturesText] = useState('');

  // Discount Calculator State (Employee tool)
  const [calcBasePrice, setCalcBasePrice] = useState(99);
  const [calcDiscountType, setCalcDiscountType] = useState('percentage'); // 'percentage' | 'fixed'
  const [calcDiscountValue, setCalcDiscountValue] = useState(20);

  // New Promo Code Form State
  const [newCodeName, setNewCodeName] = useState('');
  const [newCodeType, setNewCodeType] = useState('percentage');
  const [newCodeValue, setNewCodeValue] = useState(15);
  const [newCodeDesc, setNewCodeDesc] = useState('');

  // Reset Customer Password Modal State
  const [selectedCustomerForReset, setSelectedCustomerForReset] = useState(null);
  const [newCustomerPasswordInput, setNewCustomerPasswordInput] = useState('');
  const [showCustomerPasswordsMap, setShowCustomerPasswordsMap] = useState({});

  // Order Search & Filter State
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all');

  // Manual Order Registration State (Import from WhatsApp / Telegram)
  const [isManualOrderModalOpen, setIsManualOrderModalOpen] = useState(false);
  const [manualOrderNumber, setManualOrderNumber] = useState('');
  const [manualSecurityCode, setManualSecurityCode] = useState('');
  const [manualCustomerName, setManualCustomerName] = useState('');
  const [manualCustomerPhone, setManualCustomerPhone] = useState('');
  const [manualStoreName, setManualStoreName] = useState('');
  const [manualStoreType, setManualStoreType] = useState('ورود وهدايا');
  const [manualPackageName, setManualPackageName] = useState('باقة المحتوى الإعلاني الماسي (Super Deal)');
  const [manualAmount, setManualAmount] = useState(99);
  const [manualStatus, setManualStatus] = useState('pending_payment');
  const [manualNotes, setManualNotes] = useState('');

  // Show Employee Passwords toggle map
  const [showEmpPasswordsMap, setShowEmpPasswordsMap] = useState({});

  const showToast = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 3500);
  };

  const reloadData = () => {
    setOrders(canAccessOrders ? db.getOrders(currentUser) : []);
    setPackages(canAccessPackages ? db.getPackages() : []);
    setSettings(canAccessContact ? db.getSettings() : {});
    setPortfolio(canAccessPortfolio ? db.getPortfolio(true) : []);
    setDiscountCodes(canAccessDiscounts ? db.getDiscountCodes() : []);
    setCategoryVisibility(canAccessVisibility ? db.getCategoryVisibility() : {});
    setCustomers(canAccessCustomers ? db.getCustomersList(currentUser) : []);
    setEmployees(isManager ? db.getEmployeesList(currentUser) : []);
    const maintenance = isManager ? db.getMaintenanceMode() : { enabled: false };
    setMaintenanceMode(maintenance);
    setMaintenanceMessage(maintenance.message || '');
    setMaintenanceReturn(maintenance.estimatedReturn || '');
  };

  const handleSaveManualOrder = (e) => {
    e.preventDefault();
    if (!manualCustomerName.trim() || !manualCustomerPhone.trim()) {
      alert('يرجى إدخال اسم العميل ورقم جوال الواتساب');
      return;
    }

    db.createManualOrder({
      orderNumber: manualOrderNumber,
      securityCode: manualSecurityCode,
      customerName: manualCustomerName,
      customerPhone: manualCustomerPhone,
      storeName: manualStoreName,
      storeType: manualStoreType,
      packageName: manualPackageName,
      amount: manualAmount,
      status: manualStatus,
      notes: manualNotes
    });

    setOrders(db.getOrders(currentUser));
    setIsManualOrderModalOpen(false);
    showToast(`تم تسجيل واستيراد الطلب (${manualOrderNumber || 'الجديد'}) بنجاح وإدراجه في قائمة الطلبات! ✓`);
  };

  const handleCopyEmpCredentials = (emp) => {
    const pwd = emp.plainHint || emp.password || 'Emp@2026';
    const code = emp.securityCode || '2026';
    const text = `بيانات دخول الموظف لمنصة وصلني:
👤 الاسم: ${emp.name}
🔑 اسم المستخدم / اليوزر: ${emp.phone}
🔒 كلمة المرور: ${pwd}
🔐 كود التحقق الأمني (2FA): ${code}
🌐 رابط المنصة: ${window.location.origin}`;
    navigator.clipboard.writeText(text);
    showToast(`تم نسخ بيانات دخول الموظف (${emp.name}) بنجاح!`);
  };

  const togglePasswordVisibilityForEmp = (empId) => {
    setShowEmpPasswordsMap(prev => ({
      ...prev,
      [empId]: !prev[empId]
    }));
  };

  // Sync state whenever modal opens or currentUser updates
  useEffect(() => {
    if (isOpen) {
      reloadData();
    }
  }, [isOpen, currentUser]);

  useEffect(() => {
    if (!isOpen || !currentUser) return;
    const allowedTabs = [
      ...(canAccessOrders ? ['orders'] : []),
      ...(isManager ? ['employees', 'maintenance', 'contact'] : []),
      ...(canAccessVisibility ? ['visibility'] : []),
      ...(canAccessDiscounts ? ['discounts'] : []),
      ...(canAccessCustomers ? ['customers'] : []),
      ...(canAccessPackages ? ['packages'] : []),
      ...(canAccessPortfolio ? ['portfolio'] : []),
      'guide'
    ];
    if (!allowedTabs.includes(activeTab)) setActiveTab(allowedTabs[0] || 'guide');
  }, [isOpen, currentUser, activeTab]);

  // Real-time synchronization when orders, employees, or settings change
  useEffect(() => {
    const handleDataChange = (event) => {
      const key = event.detail?.key;
      if (!key) {
        reloadData();
        return;
      }

      // Refresh only the data shown in the affected section; keep the active
      // tab, filters, and open dialogs in place when another device updates it.
      if (key === 'waslni_orders' && canAccessOrders) setOrders(db.getOrders(currentUser));
      if (key === 'waslni_packages' && canAccessPackages) setPackages(db.getPackages());
      if (key === 'waslni_settings' && canAccessContact) setSettings(db.getSettings());
      if (key === 'waslni_portfolio' && canAccessPortfolio) setPortfolio(db.getPortfolio(true));
      if (key === 'waslni_discount_codes' && canAccessDiscounts) setDiscountCodes(db.getDiscountCodes());
      if (key === 'waslni_category_visibility' && canAccessVisibility) setCategoryVisibility(db.getCategoryVisibility());
      if (key === 'waslni_users') {
        if (canAccessCustomers) setCustomers(db.getCustomersList(currentUser));
        if (isManager) setEmployees(db.getEmployeesList(currentUser));
      }
      if (key === 'waslni_maintenance_mode' && isManager) {
        const maintenance = db.getMaintenanceMode();
        setMaintenanceMode(maintenance);
        setMaintenanceMessage(maintenance.message || '');
        setMaintenanceReturn(maintenance.estimatedReturn || '');
      }
    };
    window.addEventListener('waslni_data_changed', handleDataChange);
    return () => window.removeEventListener('waslni_data_changed', handleDataChange);
  }, [currentUser]);

  // Live Filtered Orders computation for search and status tabs
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // الفلتر الافتراضي "all" يستثني الملغاة (تظهر فقط عند اختيار فلتر "cancelled")
    if (orderStatusFilter === 'all') {
      result = result.filter(o => o.status !== 'cancelled');
    } else {
      result = result.filter(o => o.status === orderStatusFilter);
    }

    // فلتر البحث النصي (رقم الطلب، العميل، الهاتف، المحل، كود الأمان، الباقة، الملاحظات)
    if (orderSearchQuery.trim()) {
      const q = orderSearchQuery.trim().toLowerCase();
      result = result.filter(o =>
        (o.orderNumber && o.orderNumber.toLowerCase().includes(q)) ||
        (o.customerName && o.customerName.toLowerCase().includes(q)) ||
        (o.customerPhone && o.customerPhone.includes(q)) ||
        (o.storeName && o.storeName.toLowerCase().includes(q)) ||
        (o.securityCode && o.securityCode.includes(q)) ||
        (o.packageName && o.packageName.toLowerCase().includes(q)) ||
        (o.notes && o.notes.toLowerCase().includes(q))
      );
    }

    // ترتيب زمني صارم: الأحدث إنشاءً في القمة دائماً (بناءً على التوقيت الرقمي الدقيق)
    result.sort((a, b) => {
      const timeA = Number(a.timestamp) || (a.createdAt ? new Date(a.createdAt).getTime() : 0) || 0;
      const timeB = Number(b.timestamp) || (b.createdAt ? new Date(b.createdAt).getTime() : 0) || 0;
      return timeB - timeA;
    });

    return result;
  }, [orders, orderSearchQuery, orderStatusFilter]);

  if (!isOpen || !currentUser || (currentUser.role !== 'employee' && currentUser.role !== 'manager')) {
    return null;
  }

  // Manager: Create Employee Account with Selected Permissions
  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    if (!newEmpName.trim() || !newEmpUsername.trim() || !newEmpPassword.trim()) {
      alert('يرجى ملء جميع الحقول المطلوبة للموظف');
      return;
    }

    if (newEmpPassword.trim().length < 8) {
      alert('معايير الأمان الصارمة: كلمة مرور الموظف يجب أن لا تقل عن 8 خانات كحد أدنى');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmpUsername.trim())) {
      alert('أدخل البريد الإلكتروني للموظف؛ سيستخدمه لتسجيل الدخول.');
      return;
    }

    const res = await db.createEmployeeAccountByManager({
      name: newEmpName.trim(), username: newEmpUsername.trim(), password: newEmpPassword.trim(),
      creatorName: currentUser.name, permissions: newEmpPermissions, require2FA: newEmpRequire2FA
    });

    if (res.success) {
      setNewEmpName('');
      setNewEmpUsername('');
      setNewEmpPassword('');
      setNewEmpPermissions({
        canManageOrders: true,
        canManagePackages: false,
        canManageDiscounts: false,
        canManagePortfolio: false,
        canManageCustomers: false,
        canToggleVisibility: false
      });
      reloadData();
      showToast('تم إنشاء حساب الموظف وتعيين صلاحياته بنجاح! ✓');
    } else {
      alert(res.message);
    }
  };

  // Manager: Edit Existing Employee Permissions
  const handleOpenEditPerms = (emp) => {
    setSelectedEmpForPerms(emp);
    setEditPermsState(emp.permissions || {
      canManageOrders: true,
      canManagePackages: false,
      canManageDiscounts: false,
      canManagePortfolio: false,
      canManageCustomers: false,
      canToggleVisibility: false
    });
  };

  const handleSaveEditPerms = async () => {
    if (!selectedEmpForPerms) return;
    const res = await db.updateEmployeePermissionsByManager(selectedEmpForPerms.id, editPermsState);
    if (res.success) {
      setSelectedEmpForPerms(null);
      reloadData();
      showToast('تم تحديث صلاحيات الموظف بنجاح! ✓');
    } else {
      alert(res.message);
    }
  };

  // Manager: Delete Employee Account
  const handleDeleteEmployee = async (empId, empName) => {
    if (confirm(`هل أنت متأكد من رغبتك في حذف حساب الموظف (${empName}) نهائياً؟`)) {
      const res = await db.deleteEmployeeAccountByManager(empId);
      if (res.success) {
        reloadData();
        showToast('تم حذف حساب الموظف بنجاح');
      } else {
        alert(res.message);
      }
    }
  };

  // Manager: Order Deletion with Verification Security Code
  const handleStartDeleteOrder = async (order, action = 'cancel') => {
    setDeletionCodeInput('');
    setDeletionError('');
    const actionKey = action === 'hard_delete' ? 'hard_delete' : 'cancel';
    try {
      const res = await db.requestOrderDeletionCode(order.id, currentUser, actionKey);
      if (res.success) {
        setOrderToDeleteAction(actionKey);
        setOrderToDelete(order);
        showToast(res.message);
      } else {
        showToast(res.message);
      }
    } catch {
      showToast('تعذر طلب رمز التحقق من Telegram. لم يتم حذف الطلب.');
    }
  };

  const handleConfirmDeleteOrder = async () => {
    if (!orderToDelete || !deletionCodeInput.trim()) {
      setDeletionError('يرجى إدخال كود التحقق الأمني الرباعي');
      return;
    }

    setIsDeletingOrder(true);
    const res = await db.deleteOrderByManager(orderToDelete.id, deletionCodeInput.trim(), currentUser, orderToDeleteAction);
    setIsDeletingOrder(false);

    if (res.success) {
      setOrderToDelete(null);
      setDeletionCodeInput('');
      setDeletionError('');
      setOrders(db.getOrders(currentUser));
      showToast(res.message);
    } else {
      setDeletionError(res.message);
    }
  };

  // Manager: Toggle Maintenance Mode
  const handleToggleMaintenance = (enabledState) => {
    const updated = db.toggleMaintenanceMode(enabledState, maintenanceMessage);
    setMaintenanceMode(updated);
    reloadData();
    showToast(enabledState ? '⚠️ تم تفعيل وضع الصيانة وإغلاق الموقع عن الزوار والعملاء!' : '✅ تم تعطيل وضع الصيانة وإتاحة الموقع للزوار!');
  };

  const handleGrantCustomerAttempts = async (customer) => {
    const result = await db.grantCustomerOrderAttempts(customer.id, 3, currentUser);
    if (result.success) {
      reloadData();
      showToast(`تم منح ${customer.name} ثلاثة طلبات إضافية خلال الـ 24 ساعة القادمة.`);
    } else {
      showToast(result.message);
    }
  };

  // 1. Employee Action: Upload Bank Receipt & Confirm Transfer
  const handleOpenTransferModal = (order) => {
    setSelectedOrderForTransfer(order);
    setSelectedPackageId(order.packageId);
    setReceiptImage(order.receiptImage || '');
    setTransferNotes('');
  };

  const handleFileUploadReceipt = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        alert('يرجى اختيار صورة لا يتجاوز حجمها 10 ميجابايت');
        e.target.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setReceiptImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUploadPortfolio = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMediaUrl(reader.result);
        setNewMediaType('image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmTransferAndReceived = async () => {
    if (!selectedOrderForTransfer) return;
    if (!receiptImage) {
      alert('يرجى إرفاق صورة إيصال التحويل البنكي للمدير أولاً');
      return;
    }

    try {
      await sendReceiptToTelegram({
        image: receiptImage,
        orderNumber: selectedOrderForTransfer.orderNumber,
        customerName: selectedOrderForTransfer.customerName
      });
    } catch (error) {
      alert(error.message || 'تعذر إرسال الإيصال. لم يتم تحديث حالة الطلب.');
      return;
    }

    db.markOrderTransferredByEmployee(selectedOrderForTransfer.id, {
      employeeName: currentUser.name,
      notes: transferNotes || 'تم استلام المبلغ والتحويل البنكي بالكامل',
      packageId: selectedPackageId
    });

    setOrders(db.getOrders(currentUser));
    setSelectedOrderForTransfer(null);
    showToast('تم إرسال الإيصال إلى تيليجرام وتحديث الطلب إلى «تم التحويل» ✓');
  };

  // 2. Manager Action: Final Financial Approval
  const handleManagerApprove = (orderId) => {
    db.approveOrderByManager(orderId);
    setOrders(db.getOrders(currentUser));
    showToast('تم الاعتماد المالي للطلب من المدير ✓');
  };

  // 3. Update Order Status
  const handleStatusChange = (orderId, newStatus) => {
    db.updateOrderStatus(orderId, newStatus);
    setOrders(db.getOrders(currentUser));
    showToast('تم تحديث حالة الطلب بنجاح');
  };

  // 4. Export Orders to CSV
  const handleExportOrdersCSV = () => {
    const headers = ['رقم الطلب', 'اسم العميل', 'رقم الجوال', 'اسم المحل', 'النشاط', 'الباقة', 'المبلغ المستحق', 'كوبون الخصم', 'المبلغ المخصوم', 'الحالة', 'حالة الدفع', 'الموظف المسؤول', 'تاريخ الطلب'];
    const rows = orders.map(o => [
      o.orderNumber,
      o.customerName,
      o.customerPhone,
      o.storeName,
      o.storeType,
      o.packageName,
      o.amount,
      o.discountCode || 'لا يوجد',
      o.discountAmount || 0,
      o.status,
      o.paymentStatus === 'paid_verified' ? 'مدفوع ومطابق' : 'غير مدفوع',
      o.transferredBy || 'لم يحدد',
      o.createdAt
    ]);
    const csvContent = '\uFEFF' + [headers, ...rows].map(e => e.map(val => `"${val || ''}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `waslni_orders_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('تم تصدير ملف الطلبات بنجاح!');
  };

  // 5. Visibility Controls (إخفاء وإظهار الأقسام)
  const handleToggleCategory = (catId) => {
    const currentVal = categoryVisibility[catId] !== false;
    db.toggleCategoryVisibility(catId, !currentVal);
    reloadData();
    showToast(`تم ${!currentVal ? 'إظهار' : 'إخفاء'} القسم بنجاح في الموقع والخطط`);
  };

  // 6. Discount Codes Management
  const handleCreateDiscountCode = (e) => {
    e.preventDefault();
    if (!newCodeName.trim() || !newCodeValue || Number(newCodeValue) <= 0) {
      alert('يرجى إدخال رمز الكود وقيمة خصم صحيحة أكبر من صفر');
      return;
    }

    db.addDiscountCode({
      code: newCodeName,
      type: newCodeType,
      value: newCodeValue,
      description: newCodeDesc
    });

    setNewCodeName('');
    setNewCodeDesc('');
    reloadData();
    showToast('تم إنشاء كود الخصم الجديد بنجاح!');
  };

  const handleDeleteDiscountCode = (code) => {
    if (confirm(`هل أنت متأكد من حذف كود الخصم (${code})؟`)) {
      db.deleteDiscountCode(code);
      reloadData();
      showToast('تم حذف كود الخصم');
    }
  };

  // Calculated discount in Staff Calculator
  const calculatedSavings = calcDiscountType === 'percentage'
    ? Math.round((calcBasePrice * calcDiscountValue) / 100)
    : Number(calcDiscountValue);
  const calculatedFinal = Math.max(0, calcBasePrice - calculatedSavings);

  // 7. Reset Customer Password by Staff/Manager
  const handleSaveCustomerPassword = async () => {
    if (!selectedCustomerForReset) return;
    if (newCustomerPasswordInput.length < 8) {
      alert('معايير الأمان: كلمة المرور الجديدة يجب أن تكون 8 خانات على الأقل');
      return;
    }

    const res = await db.resetCustomerPasswordByStaff(
      selectedCustomerForReset.id, 
      newCustomerPasswordInput, 
      currentUser
    );

    if (res.success) {
      reloadData();
      setSelectedCustomerForReset(null);
      setNewCustomerPasswordInput('');
      showToast('تم تحديث كلمة المرور من الخادم بنجاح.');
    } else {
      alert(res.message);
    }
  };

  const togglePasswordVisibilityForUser = (userId) => {
    setShowCustomerPasswordsMap(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  // Categories list for visibility control
  const visibilityList = [
    { id: 'cafes', name: 'المطاعم والمقاهي (كافيهات)', desc: 'قوائم الطعام الرقمية QR وفيديوهات ريلز المشروبات' },
    { id: 'fashion', name: 'محلات الملابس والأزياء', desc: 'إعلانات الملابس والعبايات ومقاطع الفيديو' },
    { id: 'flowers', name: 'محلات الورود والهدايا', desc: 'بوكيهات المناسبات وبطاقات الإهداء وتوصيل الورد' },
    { id: 'perfumes', name: 'محلات العطور والبخور', desc: 'إعلانات زجاجات العطور والفوحان وبكجات الأعياد' },
    { id: 'home_projects', name: 'الأسر المنتجة والمشاريع المنزلية', desc: 'باقات ميسرة وبدايات التجارة' },
    { id: 'others', name: 'الأنشطة الأخرى (جوالات، أثاث، صالونات)', desc: 'إلكترونيات وصيانة وخدمات' }
  ];

  const tabButtonClass = (active, tone = 'indigo') => {
    const desktopLayout = isManager ? 'lg:w-full lg:justify-start lg:py-3' : 'lg:shrink-0';
    const activeStyle = tone === 'emerald'
      ? 'bg-emerald-500/15 text-emerald-200 border border-emerald-500/30'
      : tone === 'amber'
        ? 'bg-amber-500/15 text-amber-200 border border-amber-500/30'
        : isManager
          ? 'bg-indigo-500/15 text-indigo-200 border border-indigo-500/30'
          : 'bg-teal-500/15 text-teal-200 border border-teal-500/30';
    return `flex min-w-0 items-center gap-2 py-2.5 px-3 rounded-xl text-start transition-colors shrink-0 cursor-pointer lg:whitespace-normal lg:leading-snug ${desktopLayout} ${active ? activeStyle : 'text-slate-400 hover:text-white hover:bg-slate-800/70 border border-transparent'}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div 
        className={`relative w-full ${isManager ? 'max-w-7xl border-indigo-500/30' : 'max-w-5xl border-emerald-500/25'} h-[96dvh] sm:h-[94dvh] max-h-[96dvh] sm:max-h-[94dvh] min-h-0 rounded-2xl sm:rounded-3xl bg-[#0e1322] border shadow-2xl overflow-hidden flex flex-col`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Toast Notification */}
        {notification && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold shadow-xl animate-bounce">
            {notification}
          </div>
        )}

        {/* Header */}
        <div className={`flex shrink-0 items-center justify-between p-3 sm:p-5 border-b border-slate-800 ${isManager ? 'bg-gradient-to-l from-indigo-950/80 via-slate-900 to-slate-900' : 'bg-gradient-to-l from-emerald-950/70 via-slate-900 to-slate-900'}`}>
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${isManager ? 'bg-indigo-600' : 'bg-amber-600'}`}>
              {isManager ? '👑' : '💼'}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <h3 className="text-sm sm:text-lg font-black text-white">
                  {isManager ? 'لوحة المدير العام' : 'لوحة الموظف'}
                </h3>
                <span className={`text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full ${isManager ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'}`}>
                  {isManager ? 'المدير' : 'موظف'}
                </span>
                <span className="hidden xs:inline-flex text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  <span>بوت مفعّل</span>
                </span>
              </div>
              <p className="text-xs text-slate-400">
                المسؤول: <strong className="text-white">{currentUser.name}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isManager && (
              <button
                type="button"
                onClick={() => setActiveTab('employees')}
                className={`hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shadow-lg transition-all cursor-pointer ${
                  activeTab === 'employees'
                    ? 'bg-emerald-600 text-white shadow-emerald-950/40 ring-2 ring-emerald-400'
                    : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40'
                }`}
                title="إنشاء حساب لموظف وتحديد صلاحياته"
              >
                <UserPlus className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden xs:inline">👑 إنشاء حساب موظف جديد</span>
                <span className="xs:hidden">موظف جديد</span>
              </button>
            )}

            <button
              onClick={() => { onLogout(); onClose(); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 text-xs font-bold border border-slate-800 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">تسجيل الخروج</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className={`shrink-0 px-4 sm:px-6 py-3 border-b ${isManager ? 'border-indigo-500/20 bg-indigo-950/20' : 'border-emerald-500/20 bg-emerald-950/15'}`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3">
            <div>
              <p className={`text-xs sm:text-sm font-black ${isManager ? 'text-indigo-200' : 'text-emerald-200'}`}>
                {isManager ? 'مركز إدارة المنصة' : 'مساحة تنفيذ الطلبات'}
              </p>
              <p className="text-[10px] sm:text-xs text-slate-400 mt-0.5">
                {isManager
                  ? 'إدارة الفريق والصلاحيات والطلبات وإعدادات الموقع من لوحة واحدة.'
                  : 'تظهر هنا الأقسام والمهام التي منحك المدير صلاحية الوصول إليها.'}
              </p>
            </div>
            <span className={`self-start sm:self-auto shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${isManager ? 'text-indigo-200 bg-indigo-500/10 border-indigo-500/30' : 'text-emerald-200 bg-emerald-500/10 border-emerald-500/30'}`}>
              {isManager ? `${employees.length} موظف` : `${orders.filter(order => order.status === 'pending_payment').length} طلب بانتظار الدفع`}
            </span>
          </div>
        </div>

        <div className={`flex flex-col min-h-0 flex-1 ${isManager ? 'lg:flex-row' : ''}`}>
        {/* Manager gets a sidebar on desktop; staff use a compact tab strip. */}
        <div className={`border-b border-slate-800 ${isManager ? 'grid grid-cols-2 sm:grid-cols-3 bg-indigo-950/20 lg:flex lg:flex-col lg:w-64 lg:border-b-0 lg:border-e lg:py-4 lg:px-3 lg:overflow-y-auto lg:overflow-x-hidden' : 'flex flex-wrap sm:flex-nowrap sm:overflow-x-auto bg-emerald-950/15'} px-3 pt-2 gap-1 text-xs font-bold scrollbar-thin scrollbar-thumb-slate-700 pb-2 shrink-0`}>
          {canAccessOrders && (
            <button
              onClick={() => setActiveTab('orders')}
              className={tabButtonClass(activeTab === 'orders')}
            >
              <FileText className="w-4 h-4 text-indigo-400" />
              <span>الطلبات والتحويلات ({orders.length})</span>
            </button>
          )}

          {/* MANAGER TAB 1: EMPLOYEES (Placed right next to orders so it's impossible to miss!) */}
          {isManager && (
            <button
              onClick={() => setActiveTab('employees')}
              className={tabButtonClass(activeTab === 'employees', 'emerald')}
            >
              <UserPlus className="w-4 h-4 text-emerald-400" />
              <span>👑 إنشاء وإدارة الموظفين ({employees.length})</span>
            </button>
          )}

          {/* MANAGER TAB 2: MAINTENANCE */}
          {isManager && (
            <button
              onClick={() => setActiveTab('maintenance')}
              className={tabButtonClass(activeTab === 'maintenance', 'amber')}
            >
              <Wrench className="w-4 h-4 text-amber-400" />
              <span>وضع الصيانة {maintenanceMode.enabled ? '(مفعّل ⚠️)' : ''}</span>
            </button>
          )}

          {canAccessVisibility && (
            <button
              onClick={() => setActiveTab('visibility')}
              className={tabButtonClass(activeTab === 'visibility')}
            >
              <Layers className="w-4 h-4 text-sky-400" />
              <span>إخفاء وإظهار الأقسام</span>
            </button>
          )}

          {canAccessDiscounts && (
            <button
              onClick={() => setActiveTab('discounts')}
              className={tabButtonClass(activeTab === 'discounts')}
            >
              <Tag className="w-4 h-4 text-amber-400" />
              <span>أكواد الخصم والحاسبة</span>
            </button>
          )}

          {canAccessCustomers && (
            <button
              onClick={() => setActiveTab('customers')}
              className={tabButtonClass(activeTab === 'customers')}
            >
              <Users className="w-4 h-4 text-emerald-400" />
              <span>إدارة العملاء وكلمات المرور</span>
            </button>
          )}

          {canAccessPackages && (
            <button
              onClick={() => setActiveTab('packages')}
              className={tabButtonClass(activeTab === 'packages')}
            >
              <Package className="w-4 h-4 text-purple-400" />
              <span>أسعار الباقات</span>
            </button>
          )}

          {canAccessPortfolio && (
            <button
              onClick={() => setActiveTab('portfolio')}
              className={tabButtonClass(activeTab === 'portfolio')}
            >
              <ImageIcon className="w-4 h-4 text-rose-400" />
              <span>المعرض والوسائط</span>
            </button>
          )}

          {canAccessContact && (
            <button
              onClick={() => setActiveTab('contact')}
                className={tabButtonClass(activeTab === 'contact')}
            >
              <Phone className="w-4 h-4 text-teal-400" />
              <span>رقم الواتساب والبنك</span>
            </button>
          )}

          {/* GUIDE TAB (STAFF & MANAGER ONLY) */}
          <button
            onClick={() => setActiveTab('guide')}
            className={tabButtonClass(activeTab === 'guide', 'amber')}
          >
            <FileText className="w-4 h-4 text-amber-400" />
            <span>📄 دليل المنصة (PDF)</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="min-w-0 min-h-0 p-3 sm:p-5 lg:p-6 overflow-y-auto overflow-x-hidden space-y-5 flex-1">
          
          {/* ============================================================ */}
          {/* TAB 1: ORDERS & BANK TRANSFERS */}
          {/* ============================================================ */}
          {activeTab === 'orders' && (
            <div className="space-y-4">
              
              {/* Manager Quick Employee Action Banner */}
              {isManager && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-950/50 via-slate-900 to-indigo-950/40 border border-emerald-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold shrink-0">
                      👑
                    </div>
                    <div>
                      <h5 className="text-xs sm:text-sm font-black text-white">إدارة فريق الموظفين وتعيين الصلاحيات</h5>
                      <p className="text-[11px] text-slate-300">
                        المدير العام يملك الصلاحية الكاملة لإنشاء حسابات الموظفين وتخصيص الأقسام التي يديرونها.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('employees')}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer shrink-0 transition-all hover:scale-105"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>إنشاء حساب موظف جديد الآن</span>
                  </button>
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
                <div>
                  <h4 className="text-sm font-bold text-white">إدارة طلبات المحلات ومطابقة الحوالات البنكية</h4>
                  <p className="text-xs text-slate-400">
                    يرفع الموظف إيصال الحوالة، ويضغط "تم التحويل واستلام المبلغ كامل" لتوثيقها فوراً للمدير.
                  </p>
                </div>
                <div className="grid grid-cols-2 xl:grid-cols-4 gap-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setManualOrderNumber('WS-' + Math.floor(1000 + Math.random() * 9000));
                      setManualSecurityCode(Math.floor(1000 + Math.random() * 9000).toString());
                      setManualCustomerName('');
                      setManualCustomerPhone('');
                      setManualStoreName('');
                      setManualNotes('طلب تم استلامه وتوثيقه عبر الواتساب/التيلجرام');
                      setIsManualOrderModalOpen(true);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-md shadow-emerald-950/40 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>تسجيل واستيراد طلب يدوي 📥</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleExportOrdersCSV}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-indigo-400" />
                    <span>تصدير الطلبات (Excel / CSV)</span>
                  </button>
                  <span className="px-2.5 py-2 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">
                    معلّق بانتظار التحويل: {orders.filter(o => o.status === 'pending_payment').length} طلب · {orders.filter(o => o.status === 'pending_payment').reduce((sum, o) => sum + (Number(o.amount) || 0), 0)} ر.س
                  </span>
                  <span className="px-2.5 py-2 rounded-xl bg-orange-500/10 text-orange-300 border border-orange-500/20 font-bold">
                    إيصالات بانتظار الاعتماد: {orders.filter(o => o.status === 'transferred').length}
                  </span>
                  <span className="px-2.5 py-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    مبالغ موثقة: {orders.filter(o => o.paymentStatus === 'paid_verified').reduce((sum, o) => sum + (Number(o.amount) || 0), 0)} ر.س
                  </span>
                </div>
              </div>

              {/* Live Order Search & Status Filter Bar */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 text-slate-400 absolute right-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="ابحث برقم الطلب (مثال: WS-8260)، اسم العميل، الجوال، أو اسم المحل..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pr-10 pl-10 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-medium"
                    />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery('')}
                        className="absolute left-3 top-2.5 text-xs text-slate-400 hover:text-white p-0.5"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={reloadData}
                    className="px-4 py-2.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                    title="تحديث قائمة الطلبات الآن"
                  >
                    <span>تحديث الطلبات 🔄</span>
                  </button>
                </div>

                {/* Status Filter Buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 scrollbar-none font-bold">
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      orderStatusFilter === 'all'
                        ? 'bg-indigo-600 text-white shadow-sm'
                        : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    الكل ({orders.filter(o => o.status !== 'cancelled').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('pending_payment')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      orderStatusFilter === 'pending_payment'
                        ? 'bg-amber-600 text-white shadow-sm'
                        : 'bg-slate-950 text-amber-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ⏳ بانتظار التحويل ({orders.filter(o => o.status === 'pending_payment').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('transferred')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      orderStatusFilter === 'transferred'
                        ? 'bg-orange-500 text-white shadow-sm'
                        : 'bg-slate-950 text-orange-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    📤 رفع الإيصال ({orders.filter(o => o.status === 'transferred').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('approved_by_manager')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      orderStatusFilter === 'approved_by_manager'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-slate-950 text-emerald-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    👑 معتمد ({orders.filter(o => o.status === 'approved_by_manager').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('in_progress')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      orderStatusFilter === 'in_progress'
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-950 text-blue-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    🔧 قيد التنفيذ ({orders.filter(o => o.status === 'in_progress').length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrderStatusFilter('completed')}
                    className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                      orderStatusFilter === 'completed'
                        ? 'bg-teal-600 text-white shadow-sm'
                        : 'bg-slate-950 text-teal-400 hover:text-white border border-slate-800'
                    }`}
                  >
                    ✅ مكتمل ({orders.filter(o => o.status === 'completed').length})
                  </button>
                  {orders.some(o => o.status === 'cancelled') && (
                    <button
                      type="button"
                      onClick={() => setOrderStatusFilter('cancelled')}
                      className={`px-3 py-1.5 rounded-xl shrink-0 transition-all cursor-pointer ${
                        orderStatusFilter === 'cancelled'
                          ? 'bg-rose-700 text-white shadow-sm'
                          : 'bg-slate-950 text-rose-400 hover:text-white border border-slate-800'
                      }`}
                    >
                      ✕ ملغاة ({orders.filter(o => o.status === 'cancelled').length})
                    </button>
                  )}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                  <Search className="w-8 h-8 text-slate-600 mx-auto" />
                  <p className="text-sm font-semibold text-slate-300">
                    {orderSearchQuery ? `لم يتم العثور على أي طلب يطابق "${orderSearchQuery}" في قاعدة البيانات المحلية` : 'لا توجد طلبات في هذا التصنيف حالياً'}
                  </p>
                  {orderSearchQuery ? (
                    <div className="pt-2 flex flex-col items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const cleanQ = orderSearchQuery.toUpperCase().startsWith('WS-') ? orderSearchQuery.toUpperCase() : `WS-${orderSearchQuery.toUpperCase()}`;
                          setManualOrderNumber(cleanQ);
                          setManualSecurityCode(Math.floor(1000 + Math.random() * 9000).toString());
                          setManualCustomerName('');
                          setManualCustomerPhone('');
                          setManualStoreName('');
                          setManualNotes(`تم تسجيل الطلب واستيراده برقم ${cleanQ}`);
                          setIsManualOrderModalOpen(true);
                        }}
                        className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-lg shadow-emerald-950/50 cursor-pointer inline-flex items-center gap-1.5 transition-all hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        <span>تسجيل وإضافة الطلب ({orderSearchQuery}) الآن في النظام</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setOrderSearchQuery(''); setOrderStatusFilter('all'); }}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer mt-1"
                      >
                        إلغاء البحث وعرض جميع الطلبات ({orders.length})
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => { setOrderSearchQuery(''); setOrderStatusFilter('all'); }}
                      className="text-xs text-indigo-400 hover:underline font-bold cursor-pointer"
                    >
                      إعادة ضبط الفلتر وعرض جميع الطلبات ({orders.length})
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOrders.map((ord) => {
                    // حساب درجة الخطوة الحالية
                    const stepIdx = ord.status === 'pending_payment' ? 0
                      : ord.status === 'transferred' ? 1
                      : ord.status === 'approved_by_manager' ? 2
                      : ord.status === 'in_progress' ? 2
                      : ord.status === 'completed' ? 3 : 0;

                    const isCancelled = ord.status === 'cancelled';

                    // تحديد إذا كان الطلب "جديداً" (أقل من 24 ساعة)
                    const isNew = (() => {
                      try {
                        // نحاول قراءة التاريخ — إذا فشل نعتبره ليس جديداً
                        const created = new Date(ord.createdAt);
                        if (isNaN(created.getTime())) return false;
                        const diff = Date.now() - created.getTime();
                        return diff < 24 * 60 * 60 * 1000;
                      } catch { return false; }
                    })();

                    const waPhone = (ord.customerPhone || '').replace(/\D/g, '');
                    const waLink = `https://wa.me/966${waPhone.replace(/^0/, '')}?text=${encodeURIComponent(`مرحباً ${ord.customerName} 👋\nبخصوص طلبك رقم: ${ord.orderNumber}\nكود التأكيد: 🔐 ${ord.securityCode}\nيسعدنا خدمتك — فريق وصلني`)}`;

                    return (
                    <div
                      key={ord.id}
                      className={`rounded-2xl border transition-all overflow-hidden ${
                        isCancelled
                          ? 'border-rose-800/40 bg-rose-950/10 opacity-75'
                          : ord.status === 'approved_by_manager' || ord.status === 'completed'
                          ? 'border-emerald-500/30 bg-emerald-950/10'
                          : ord.status === 'transferred'
                          ? 'border-amber-500/30 bg-amber-950/10'
                          : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                      }`}
                    >
                      {/* ── Card Header ── */}
                      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/70">
                        <div className="flex items-center gap-3 min-w-0">
                          {/* Order Number Badge + NEW Badge */}
                          <div className="flex flex-col items-start gap-1 shrink-0">
                            <span className="font-mono font-black text-[11px] px-2 py-1 rounded-lg bg-indigo-600/20 text-indigo-300 border border-indigo-500/30">
                              {ord.orderNumber}
                            </span>
                            {isNew && !isCancelled && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-300 border border-green-500/40 font-black animate-pulse">
                                🔔 جديد
                              </span>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-sm font-black text-white truncate">{ord.customerName}</h5>
                              {isCancelled && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold shrink-0">ملغى</span>
                              )}
                            </div>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400">{ord.storeName}</span>
                              {ord.storeType && (
                                <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-slate-800 text-slate-400 border border-slate-700">{ord.storeType}</span>
                              )}
                              {ord.securityCode && (
                                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800/80 text-amber-400 border border-amber-500/20">
                                  🔐 {ord.securityCode}
                                </span>
                              )}
                              {ord.createdAt && (
                                <span className="text-[9px] text-slate-600">📅 {ord.createdAt}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {/* WhatsApp Direct Button */}
                          {!isCancelled && (
                            <a
                              href={waLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold transition-colors"
                              title={`مراسلة ${ord.customerName} على واتساب`}
                            >
                              <Phone className="w-3 h-3" />
                              <span className="hidden sm:inline">واتساب</span>
                            </a>
                          )}

                          {/* Status Badge */}
                          <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold border ${
                            isCancelled
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : ord.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                              : ord.status === 'approved_by_manager'
                              ? 'bg-teal-500/15 text-teal-300 border-teal-500/30'
                              : ord.status === 'in_progress'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : ord.status === 'transferred'
                              ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                              : 'bg-slate-800 text-slate-300 border-slate-700'
                          }`}>
                            {isCancelled && '✕ تم الإلغاء'}
                            {!isCancelled && ord.status === 'approved_by_manager' && '✓ معتمد من المدير'}
                            {!isCancelled && ord.status === 'transferred' && '📤 تم رفع الإيصال'}
                            {!isCancelled && ord.status === 'pending_payment' && '⏳ بانتظار التحويل'}
                            {!isCancelled && ord.status === 'in_progress' && '🔧 قيد التنفيذ'}
                            {!isCancelled && ord.status === 'completed' && '✅ مكتمل'}
                          </span>
                        </div>
                      </div>

                      {/* ── Cancelled Notice for Staff ── */}
                      {isCancelled && (
                        <div className="px-4 py-2.5 bg-rose-950/30 border-b border-rose-800/30 flex items-start gap-2">
                          <span className="text-rose-400 text-sm shrink-0">✕</span>
                          <div className="text-[11px]">
                            <p className="text-rose-300 font-bold">تم إلغاء هذا الطلب من قِبل المدير</p>
                            {ord.cancelledBy && <p className="text-rose-500/80 mt-0.5">بواسطة: {ord.cancelledBy}</p>}
                            {ord.cancelledAt && <p className="text-rose-500/70">بتاريخ: {ord.cancelledAt}</p>}
                          </div>
                        </div>
                      )}
                      {/* ── 4-Step Progress Stepper (hidden for cancelled) ── */}
                      {!isCancelled && (
                      <div className="px-4 py-3 border-b border-slate-800/70">
                        <div className="flex items-center gap-0">
                          {[
                            { label: 'إنشاء الطلب', icon: '📋' },
                            { label: 'رفع الإيصال', icon: '🏦' },
                            { label: 'اعتماد المدير', icon: '👑' },
                            { label: 'تسليم العمل', icon: '🎁' },
                          ].map((step, i) => (
                            <div key={i} className="flex items-center flex-1">
                              <div className="flex flex-col items-center gap-1 flex-1">
                                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-black border-2 transition-all ${
                                  i <= stepIdx
                                    ? 'bg-indigo-600 border-indigo-400 text-white shadow-md shadow-indigo-900/50'
                                    : 'bg-slate-800 border-slate-700 text-slate-500'
                                }`}>
                                  {i < stepIdx ? '✓' : step.icon}
                                </div>
                                <span className={`text-[9px] font-bold text-center leading-tight ${
                                  i <= stepIdx ? 'text-indigo-300' : 'text-slate-600'
                                }`}>{step.label}</span>
                              </div>
                              {i < 3 && (
                                <div className={`h-0.5 flex-1 mx-1 rounded transition-all ${
                                  i < stepIdx ? 'bg-indigo-500' : 'bg-slate-800'
                                }`} />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                      )}

                      {/* ── Details Grid ── */}
                      <div className="px-4 py-3 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 text-xs border-b border-slate-800/50">
                        <div className="min-w-0">
                          <span className="text-slate-500 block text-[10px] mb-0.5">📞 جوال العميل:</span>
                          <a href={`tel:${ord.customerPhone || ''}`} className="text-indigo-300 hover:text-indigo-200 text-[11px] font-mono break-all" dir="ltr">
                            {ord.customerPhone || 'غير مسجل'}
                          </a>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-0.5">📦 الباقة:</span>
                          <strong className="text-white text-[11px]">{ord.packageName}</strong>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-0.5">💰 المبلغ:</span>
                          <div className="flex items-baseline gap-1 flex-wrap">
                            <strong className="text-emerald-400 font-mono text-sm">{ord.amount} ر.س</strong>
                            {ord.discountAmount > 0 && (
                              <span className="text-[10px] text-amber-400">خصم {ord.discountAmount}</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-0.5">📅 التاريخ:</span>
                          <span className="text-slate-300 text-[11px]">{ord.createdAt}</span>
                        </div>
                        <div>
                          <span className="text-slate-500 block text-[10px] mb-0.5">📎 الإيصال:</span>
                          {ord.receiptImage ? (
                            <button
                              type="button"
                              onClick={() => setPreviewReceiptUrl(ord.receiptImage)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold flex items-center gap-1 cursor-pointer text-[11px]"
                            >
                              <Eye className="w-3 h-3" />
                              <span>عرض الإيصال</span>
                            </button>
                          ) : ord.receiptSentToTelegram ? (
                            <span className="text-emerald-400 text-[11px]">✓ أُرسل إلى Telegram</span>
                          ) : (
                            <span className="text-amber-400 text-[11px]">⚠️ لم يُرفع بعد</span>
                          )}
                        </div>
                      </div>

                      {/* ── Transfer Info (if available) ── */}
                      {(ord.transferConfirmation || ord.transferDate || ord.transferBank) && (
                        <div className="px-4 py-2.5 bg-amber-950/20 border-b border-amber-800/30 text-[11px] text-amber-200 flex flex-wrap gap-x-4 gap-y-1">
                          {ord.transferBank && <span>🏦 {ord.transferBank}</span>}
                          {ord.transferDate && <span>📅 {ord.transferDate}</span>}
                          {ord.transferConfirmation && <span>🔢 {ord.transferConfirmation}</span>}
                        </div>
                      )}

                      {/* ── Notes ── */}
                      {ord.notes && (
                        <div className="px-4 py-2.5 bg-slate-950/60 border-b border-slate-800/50 text-[11px] text-slate-400">
                          <strong className="text-slate-300">💬 ملاحظات: </strong>{ord.notes}
                        </div>
                      )}

                      {/* ── Actions Toolbar ── */}
                      <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                        {isCancelled ? (
                          /* للطلبات الملغاة: يرى المدير فقط زر الحذف النهائي */
                          <div className="flex items-center justify-between w-full gap-2">
                            <span className="text-[11px] text-rose-400/70 font-bold">⚠️ هذا الطلب ملغى — لا يمكن تعديله</span>
                            {isManager && (
                              <button
                                type="button"
                                onClick={() => {
                                    handleStartDeleteOrder(ord, 'hard_delete');
                                }}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-700/20 hover:bg-rose-700 text-rose-300 hover:text-white border border-rose-600/30 text-[11px] font-bold transition-all cursor-pointer"
                                title="حذف نهائي من قاعدة البيانات (لا يمكن التراجع)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>حذف نهائي من النظام</span>
                              </button>
                            )}
                          </div>
                        ) : (
                          <>
                          {/* Status Dropdown */}
                          <div className="flex items-center gap-2">
                            <label className="text-[10px] text-slate-500 font-bold">الحالة:</label>
                            <select
                              value={ord.status}
                              onChange={(e) => handleStatusChange(ord.id, e.target.value)}
                              className="bg-slate-950 border border-slate-700 text-[11px] text-white rounded-lg px-2 py-1 focus:outline-none focus:border-indigo-500 cursor-pointer"
                            >
                              <option value="pending_payment">⏳ بانتظار التحويل</option>
                              <option value="transferred">📤 تم التحويل</option>
                              <option value="approved_by_manager">👑 معتمد من المدير</option>
                              <option value="in_progress">🔧 قيد التنفيذ</option>
                              <option value="completed">✅ مكتمل وتم التسليم</option>
                            </select>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {/* Upload Receipt Button */}
                            <button
                              type="button"
                              onClick={() => handleOpenTransferModal(ord)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-[11px] transition-all cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{ord.receiptImage ? 'تعديل الإيصال' : '📎 إرفاق الإيصال'}</span>
                            </button>

                            {/* Manager Approve Button */}
                            {isManager && ord.status !== 'approved_by_manager' && ord.status !== 'completed' && (
                              <button
                                type="button"
                                onClick={() => handleManagerApprove(ord.id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-[11px] transition-all cursor-pointer shadow-lg shadow-emerald-900/30"
                              >
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span>👑 اعتماد مالي رسمي من المدير</span>
                              </button>
                            )}

                            {/* Manager Cancel/Delete Button */}
                            {isManager && (
                              <button
                                type="button"
                                onClick={() => handleStartDeleteOrder(ord)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 text-[11px] font-bold transition-all cursor-pointer"
                                title="إلغاء الطلب (يظهر كملغى للعميل والموظفين)"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">إلغاء</span>
                              </button>
                            )}
                          </div>
                          </>
                        )}
                      </div>

                    </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: CATEGORY & SECTION VISIBILITY (إخفاء وإظهار الأقسام) */}
          {/* ============================================================ */}
          {activeTab === 'visibility' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">التحكم في ظهور الأقسام والأنشطة التجارية في الموقع</h4>
                <p className="text-xs text-slate-400">
                  إذا قمت بإخفاء أي قسم (مثل: المطاعم والكافيهات)، سيتم حجبه فوراً وتلقائياً عن الزبائن ولن يظهر في الواجهة الرئيسية ولا في المعرض ولا في نماذج الطلبات.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {visibilityList.map((cat) => {
                  const isVisible = categoryVisibility[cat.id] !== false;

                  return (
                    <div
                      key={cat.id}
                      className={`p-4 rounded-2xl border transition-all flex items-center justify-between gap-4 ${
                        isVisible 
                          ? 'bg-slate-900/60 border-slate-800' 
                          : 'bg-rose-950/20 border-rose-500/30 opacity-75'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h5 className="text-sm font-bold text-white">{cat.name}</h5>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isVisible ? 'bg-emerald-500/20 text-emerald-300' : 'bg-rose-500/20 text-rose-300'}`}>
                            {isVisible ? 'ظاهر للعملاء ✓' : 'مخفي تماماً ✕'}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 font-light">{cat.desc}</p>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleToggleCategory(cat.id)}
                        className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                          isVisible
                            ? 'bg-rose-600/20 hover:bg-rose-600 text-rose-200 hover:text-white border border-rose-500/30'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'
                        }`}
                      >
                        {isVisible ? 'إخفاء القسم' : 'إظهار القسم'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 3: DISCOUNT PROMO CODES & CALCULATOR */}
          {/* ============================================================ */}
          {activeTab === 'discounts' && (
            <div className="space-y-6">
              
              {/* Employee Live Discount Calculator */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-amber-400" />
                  <h4 className="text-sm font-bold text-white">حاسبة الخصم الفورية للموظف (قبل وبعد الخصم)</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-300 mb-1">السعر الأصلي (قبل الخصم):</label>
                    <input
                      type="number"
                      value={calcBasePrice}
                      onChange={(e) => setCalcBasePrice(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">نوع الخصم:</label>
                    <select
                      value={calcDiscountType}
                      onChange={(e) => setCalcDiscountType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white text-xs"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ر.س)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-300 mb-1">قيمة الخصم ({calcDiscountType === 'percentage' ? '%' : 'ر.س'}):</label>
                    <input
                      type="number"
                      value={calcDiscountValue}
                      onChange={(e) => setCalcDiscountValue(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-sm"
                    />
                  </div>
                </div>

                {/* Live Output Banner */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-2 text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px]">السعر قبل الخصم:</span>
                    <strong className="text-slate-300 font-mono text-base">{calcBasePrice} ر.س</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">قيمة التوفير / الخصم:</span>
                    <strong className="text-amber-400 font-mono text-base">-{calculatedSavings} ر.س</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">السعر بعد الخصم (المطلوب):</span>
                    <strong className="text-emerald-400 font-mono text-base">{calculatedFinal} ر.س</strong>
                  </div>
                </div>
              </div>

              {/* Create New Promo Code Form */}
              <form onSubmit={handleCreateDiscountCode} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>إنشاء كود خصم جديد لتقديمه للمحلات</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">رمز الكود (مثال: WASLNI20):</label>
                    <input
                      type="text"
                      required
                      placeholder="NEW20"
                      value={newCodeName}
                      onChange={(e) => setNewCodeName(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white uppercase font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">النوع:</label>
                    <select
                      value={newCodeType}
                      onChange={(e) => setNewCodeType(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="percentage">نسبة مئوية (%)</option>
                      <option value="fixed">مبلغ ثابت (ر.س)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">القيمة:</label>
                    <input
                      type="number"
                      required
                      value={newCodeValue}
                      onChange={(e) => setNewCodeValue(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">وصف الكود:</label>
                    <input
                      type="text"
                      placeholder="خصم افتتاح..."
                      value={newCodeDesc}
                      onChange={(e) => setNewCodeDesc(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>إضافة الكود وتفعيله فوراً</span>
                </button>
              </form>

              {/* Promo Codes Table */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  أكواد الخصم المفعلة حالياً:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {discountCodes.map((code) => (
                    <div
                      key={code.code}
                      className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-black text-indigo-400 text-sm">{code.code}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                          {code.type === 'percentage' ? `${code.value}% خصم` : `${code.value} ر.س خصم`}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">{code.description || 'خصم للعملاء'}</p>
                      <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px]">
                        <span className="text-slate-500">استُخدم {code.usesCount || 0} مرة</span>
                        <button
                          type="button"
                          onClick={() => handleDeleteDiscountCode(code.code)}
                          className="text-rose-400 hover:text-rose-300 font-bold"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 4: CUSTOMERS & PASSWORD MANAGEMENT (معايير الأمان 8+) */}
          {/* ============================================================ */}
          {activeTab === 'customers' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-bold text-white">إدارة حسابات العملاء وكلمات المرور (معايير الأمان)</h4>
                <p className="text-xs text-slate-400">
                  يمكن للمدير والموظف رؤية رمز العميل وإعادة تعيين كلمة مرور جديدة له عند نسيانها (8 خانات على الأقل).
                </p>
              </div>

              {customers.length === 0 ? (
                <div className="text-center py-10 text-slate-500 text-xs">
                  لا يوجد عملاء مسجلين حالياً
                </div>
              ) : (
                <div className="space-y-3">
                  {customers.map((cust) => {
                    const orderQuota = db.getCustomerOrderQuota(cust);

                    return (
                      <div
                        key={cust.id}
                        className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                          <div>
                            <h5 className="text-sm font-bold text-white">{cust.name}</h5>
                            <span className="text-xs text-slate-400">{cust.storeName} ({cust.storeType || 'عام'})</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                              جوال: {cust.phone}
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800">
                          <span className="text-xs text-slate-300">
                            طلبات آخر 24 ساعة: <strong className="text-amber-300">{orderQuota.used} / {orderQuota.limit}</strong>
                            {orderQuota.extraCredits > 0 && <span className="text-emerald-300"> · رصيد إضافي متبقٍ: {orderQuota.extraCredits}</span>}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleGrantCustomerAttempts(cust)}
                            className="px-3 py-2 rounded-lg bg-indigo-600/20 hover:bg-indigo-600 text-indigo-200 hover:text-white border border-indigo-500/30 text-[11px] font-bold transition-colors"
                          >
                            منح 3 طلبات إضافية
                          </button>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-300 items-center">
                          <div className="text-slate-400">
                            كلمة المرور محفوظة كتجزئة ولا يمكن عرضها؛ يمكن إعادة تعيينها عند الحاجة.
                          </div>

                          {/* Security Code */}
                          <div>
                            <span className="text-slate-500">كود الأمان الرباعي: </span>
                            <strong className="text-amber-400 font-mono">{cust.securityCode || '3184'}</strong>
                          </div>

                          {/* Reset Button */}
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedCustomerForReset(cust);
                                setNewCustomerPasswordInput('');
                              }}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Key className="w-3.5 h-3.5" />
                              <span>عمل رمز جديد للعميل</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 5: PACKAGES PRICING & DETAILS EDITOR */}
          {/* ============================================================ */}
          {activeTab === 'packages' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-800">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Package className="w-4 h-4 text-purple-400" />
                    <span>إدارة وتعديل تفاصيل وأسعار الباقات</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    يمكن للموظف والمدير تعديل جميع التفاصيل، الأسعار، المميزات والشروط — أي تعديل ينعكس فوراً للزبائن وفي معالج الطلبات.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {packages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-4 hover:border-slate-700 transition-all"
                  >
                    {editingPackageId === pkg.id ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                          <span className="text-xs font-bold text-purple-400">تعديل الباقة: {pkg.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">ID: {pkg.id}</span>
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">اسم الباقة:</label>
                          <input
                            type="text"
                            value={pkgEditName}
                            onChange={(e) => setPkgEditName(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
                            placeholder="مثال: باقة التصاميم المنفردة"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">الوصف المختصر للباقة:</label>
                          <input
                            type="text"
                            value={pkgEditSubtitle}
                            onChange={(e) => setPkgEditSubtitle(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
                            placeholder="مثال: مرونة تامة للمحلات التي تحتاج تصاميم عند الحاجة فقط"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">السعر الفعلي (ر.س):</label>
                            <input
                              type="number"
                              value={pkgEditPrice}
                              onChange={(e) => setPkgEditPrice(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-emerald-400 font-mono font-bold focus:border-indigo-500 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">السعر قبل الخصم (ر.س):</label>
                            <input
                              type="number"
                              value={pkgEditOrigPrice}
                              onChange={(e) => setPkgEditOrigPrice(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-400 font-mono focus:border-indigo-500 outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">شارة الباقة (Badge):</label>
                            <input
                              type="text"
                              value={pkgEditBadge}
                              onChange={(e) => setPkgEditBadge(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
                              placeholder="مثال: اقتصادي ومباشر أو الأكثر طلباً 🔥"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-bold text-slate-300 mb-1">المدة أو دورة الدفع:</label>
                            <input
                              type="text"
                              value={pkgEditPeriod}
                              onChange={(e) => setPkgEditPeriod(e.target.value)}
                              className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
                              placeholder="مثال: لكل 5 تصاميم أو اشتراك شهري"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <label className="block text-[11px] font-bold text-slate-300">
                              قائمة المميزات والتفاصيل (ميزة في كل سطر):
                            </label>
                            <span className="text-[10px] text-indigo-400">سطر جديد = ميزة جديدة ✓</span>
                          </div>
                          <textarea
                            rows={5}
                            value={pkgEditFeaturesText}
                            onChange={(e) => setPkgEditFeaturesText(e.target.value)}
                            className="w-full p-2.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none leading-relaxed font-sans"
                            placeholder="5 تصاميم إعلانية بجودة عالية للنشر الفوري&#10;مقاسات ملائمة للإنستقرام وتويتر وسناب شات&#10;تسليم في غضون 24 - 48 ساعة فقط"
                          />
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-300 mb-1">الشروط وملاحظات التسليم:</label>
                          <input
                            type="text"
                            value={pkgEditTerms}
                            onChange={(e) => setPkgEditTerms(e.target.value)}
                            className="w-full px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:border-indigo-500 outline-none"
                            placeholder="مثال: الصور والشعار يتم تزويدها من العميل"
                          />
                        </div>

                        <div className="flex gap-2 pt-2 border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              const featuresArray = pkgEditFeaturesText
                                .split('\n')
                                .map(f => f.trim())
                                .filter(Boolean);

                              db.updatePackage(pkg.id, {
                                name: pkgEditName,
                                subtitle: pkgEditSubtitle,
                                price: Number(pkgEditPrice),
                                originalPrice: Number(pkgEditOrigPrice),
                                badge: pkgEditBadge,
                                period: pkgEditPeriod,
                                terms: pkgEditTerms,
                                features: featuresArray
                              });
                              setEditingPackageId(null);
                              reloadData();
                              showToast(`تم حفظ وتحديث تفاصيل (${pkgEditName}) بنجاح!`);
                            }}
                            className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-md shadow-emerald-900/30"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>حفظ التعديلات وتطبيقها فوراً</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingPackageId(null)}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                          >
                            إلغاء
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-start justify-between pb-3 border-b border-slate-800 gap-2">
                          <div>
                            <h5 className="text-sm font-bold text-white">{pkg.name}</h5>
                            <span className="text-xs text-slate-400 block mt-0.5">{pkg.subtitle}</span>
                          </div>
                          {pkg.badge && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 whitespace-nowrap shrink-0">
                              {pkg.badge}
                            </span>
                          )}
                        </div>

                        <div className="flex items-baseline justify-between">
                          <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-emerald-400 font-mono">{pkg.price} ر.س</span>
                            {pkg.originalPrice && pkg.originalPrice > pkg.price && (
                              <span className="text-xs text-slate-500 line-through font-mono">{pkg.originalPrice} ر.س</span>
                            )}
                          </div>
                          {pkg.period && (
                            <span className="text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-md">
                              {pkg.period}
                            </span>
                          )}
                        </div>

                        {/* Features Preview List */}
                        {Array.isArray(pkg.features) && pkg.features.length > 0 && (
                          <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                            <span className="text-[11px] font-bold text-slate-400 block mb-1">المميزات والتفاصيل المدرجة:</span>
                            <div className="space-y-1 max-h-36 overflow-y-auto pr-1">
                              {pkg.features.map((feat, idx) => (
                                <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-300">
                                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                  <span className="leading-tight">{feat}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Terms Preview */}
                        {pkg.terms && (
                          <div className="text-[11px] text-amber-300/90 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 rounded-lg flex items-start gap-1.5">
                            <span className="font-bold shrink-0">الشروط:</span>
                            <span>{pkg.terms}</span>
                          </div>
                        )}

                        <div className="pt-2 flex justify-end border-t border-slate-800">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPackageId(pkg.id);
                              setPkgEditName(pkg.name || '');
                              setPkgEditSubtitle(pkg.subtitle || '');
                              setPkgEditPrice(pkg.price || 0);
                              setPkgEditOrigPrice(pkg.originalPrice || 0);
                              setPkgEditBadge(pkg.badge || '');
                              setPkgEditPeriod(pkg.period || '');
                              setPkgEditTerms(pkg.terms || '');
                              setPkgEditFeaturesText(Array.isArray(pkg.features) ? pkg.features.join('\n') : '');
                            }}
                            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-indigo-600 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
                          >
                            <Wrench className="w-3.5 h-3.5" />
                            <span>تعديل تفاصيل وأسعار الباقة</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 6: PORTFOLIO & MEDIA MANAGER */}
          {/* ============================================================ */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              
              {/* Add New Media Form with Local File Upload */}
              <form onSubmit={(e) => {
                e.preventDefault();
                if (!newMediaTitle.trim() || !newMediaUrl.trim()) {
                  alert('يرجى إدخال عنوان ورابط المادة أو رفعها');
                  return;
                }
                const catNameMap = {
                  fashion: 'ملابس وأزياء',
                  flowers: 'ورود وهدايا',
                  perfumes: 'عطور وبخور',
                  cafes: 'مطاعم وكافيهات'
                };
                db.addPortfolioItem({
                  title: newMediaTitle.trim(),
                  category: newMediaCategory,
                  categoryName: catNameMap[newMediaCategory] || 'عام',
                  mediaType: newMediaType,
                  mediaUrl: newMediaUrl,
                  thumbnail: newMediaUrl,
                  clientType: newMediaClient.trim() || 'متجر تجاري',
                  type: newMediaType === 'video' ? 'مونتاج ريلز فيديو' : 'تصميم إعلاني للمنتج',
                  highlight: newMediaHighlight.trim() || 'تصميم مميز يعزز التفاعل والمبيعات',
                  copySample: 'محتوى مخصص تم تنفيذه بأعلى جودة واحترافية.'
                });
                setNewMediaTitle('');
                setNewMediaUrl('');
                setNewMediaClient('');
                setNewMediaHighlight('');
                reloadData();
                showToast('تمت إضافة المادة لمعرض الأعمال بنجاح!');
              }} className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>إضافة صورة أو فيديو ريلز جديد لمعرض الأعمال</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">نوع المادة:</label>
                    <select
                      value={newMediaType}
                      onChange={(e) => setNewMediaType(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="image">صورة تصميم إعلاني</option>
                      <option value="video">مقطع فيديو ريلز / تيك توك</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">النشاط / الفئة:</label>
                    <select
                      value={newMediaCategory}
                      onChange={(e) => setNewMediaCategory(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    >
                      <option value="fashion">ملابس وأزياء 👗</option>
                      <option value="flowers">ورود وهدايا 🌸</option>
                      <option value="perfumes">عطور وبخور 🧴</option>
                      <option value="cafes">مطاعم وكافيهات ☕</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">اسم العميل أو المتجر:</label>
                    <input
                      type="text"
                      placeholder="مثال: بوتيك الأناقة"
                      value={newMediaClient}
                      onChange={(e) => setNewMediaClient(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">عنوان المادة أو الإعلان:</label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: ريلز استعراض تفاصيل الفستان"
                      value={newMediaTitle}
                      onChange={(e) => setNewMediaTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs text-slate-400">رابط المادة أو رفع ملف صورة:</label>
                      <label className="text-[11px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer underline flex items-center gap-1">
                        <Upload className="w-3 h-3" />
                        <span>اختر صورة من جهازك</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileUploadPortfolio}
                          className="hidden"
                        />
                      </label>
                    </div>
                    <input
                      type="text"
                      required
                      placeholder="مثال: /media/fashion-reel-1.mp4 أو اختر صورة من جهازك"
                      value={newMediaUrl}
                      onChange={(e) => setNewMediaUrl(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                      dir="ltr"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="py-2.5 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>إضافة المادة للمعرض</span>
                </button>
              </form>

              {/* Existing Items Grid */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  العناصر الحالية في المعرض ({portfolio.length}):
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {portfolio.map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2 relative group"
                    >
                      <div className="aspect-[4/3] rounded-lg bg-slate-950 overflow-hidden relative">
                        {item.mediaType === 'video' ? (
                          <div className="w-full h-full flex flex-col items-center justify-center bg-indigo-950/40 text-indigo-300">
                            <Video className="w-8 h-8" />
                            <span className="text-[10px] font-bold mt-1">مقطع فيديو ريلز</span>
                          </div>
                        ) : (
                          <img
                            src={item.mediaUrl}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        )}
                        <span className="absolute top-1.5 right-1.5 px-2 py-0.5 rounded-full bg-black/70 text-[10px] font-bold text-white">
                          {item.categoryName}
                        </span>
                      </div>

                      <h5 className="text-xs font-bold text-white truncate" title={item.title}>
                        {item.title}
                      </h5>

                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500 truncate">{item.clientType}</span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm('هل أنت متأكد من حذف هذا العنصر؟')) {
                              db.deletePortfolioItem(item.id);
                              reloadData();
                              showToast('تم حذف العنصر من المعرض');
                            }
                          }}
                          className="p-1 rounded-md text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="حذف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 7: CONTACT & WHATSAPP NUMBER SETTINGS */}
          {/* ============================================================ */}
          {activeTab === 'contact' && canAccessContact && (
            <form onSubmit={(e) => {
              e.preventDefault();
              db.updateSettings(settings);
              reloadData();
              showToast('تم حفظ رقم الواتساب وبيانات التحويل بنجاح! ستنعكس على كافة تحويلات الزبائن فوراً.');
            }} className="max-w-xl mx-auto space-y-5 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
              <div>
                <h4 className="text-sm font-bold text-white">إعدادات رقم الواتساب وبيانات الحساب البنكي</h4>
                <p className="text-xs text-slate-400">
                  هذا هو الرقم الذي يتم تحويل الزبون إليه تلقائياً عند طلب الدفع عبر الواتساب.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الواتساب الرسمي (مع رمز الدولة بدون + أو أصفار):
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثال: 966558840806"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                  dir="ltr"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  سيتم توجيه كافة رسائل الطلبات والتحويل البنكي لهذا الرقم مباشرة.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  اسم البنك المعتمد للتحويل:
                </label>
                <input
                  type="text"
                  placeholder="مثال: مصرف الراجحي"
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  رقم الآيبان (IBAN) للتحويل:
                </label>
                <input
                  type="text"
                  placeholder="SA0000000000000000000000"
                  value={settings.ibanNumber}
                  onChange={(e) => setSettings({ ...settings, ibanNumber: e.target.value })}
                  className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white font-mono"
                  dir="ltr"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>حفظ بيانات التواصل والتحويل</span>
              </button>
            </form>
          )}

          {/* ============================================================ */}
          {/* TAB 8: EMPLOYEE MANAGEMENT (المدير ينشئ حسابات الموظفين) */}
          {/* ============================================================ */}
          {activeTab === 'employees' && isManager && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <UserPlus className="w-4 h-4 text-emerald-400" />
                  <span>إنشاء وإدارة حسابات الموظفين (صلاحيات المدير العام)</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  المدير فقط هو المخول بإنشاء حسابات فريق العمل، وتشفير كلمات المرور والبيانات في قاعدة البيانات.
                </p>
              </div>

              {/* Form: Add New Employee */}
              <form onSubmit={handleCreateEmployee} className="p-4 sm:p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
                  <UserPlus className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">إضافة موظف جديد إلى المنصة</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      اسم الموظف الكامل:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="مثال: أحمد المطيري"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      البريد الإلكتروني الذي سيستخدمه الموظف للدخول:
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="employee@example.com"
                      value={newEmpUsername}
                      onChange={(e) => setNewEmpUsername(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                      dir="ltr"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      كلمة المرور (8 خانات على الأقل):
                    </label>
                    <input
                      type="password"
                      autoComplete="new-password"
                      required
                      placeholder="كلمة مرور قوية 8+ خانات"
                      value={newEmpPassword}
                      onChange={(e) => setNewEmpPassword(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                {/* Permissions Selector Checkboxes */}
                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <label className="text-xs font-bold text-indigo-300 flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      <span>تحديد وتخصيص صلاحيات هذا الموظف في النظام:</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setNewEmpPermissions({ canManageOrders: true, canManagePackages: true, canManageDiscounts: true, canManagePortfolio: true, canManageCustomers: true, canToggleVisibility: true })}
                        className="px-2.5 py-1.5 rounded-lg border border-indigo-500/40 bg-indigo-500/10 text-indigo-200 text-[11px] font-bold hover:bg-indigo-500/20"
                      >تحديد الكل</button>
                      <button
                        type="button"
                        onClick={() => setNewEmpPermissions({ canManageOrders: false, canManagePackages: false, canManageDiscounts: false, canManagePortfolio: false, canManageCustomers: false, canToggleVisibility: false })}
                        className="px-2.5 py-1.5 rounded-lg border border-slate-700 bg-slate-950 text-slate-300 text-[11px] font-bold hover:bg-slate-800"
                      >إلغاء التحديد</button>
                      <span className="text-[10px] text-slate-400">يمكنك تعديلها في أي وقت</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    <label className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-indigo-500/60">
                      <input
                        type="checkbox"
                        checked={newEmpPermissions.canManageOrders}
                        onChange={(e) => setNewEmpPermissions((current) => ({ ...current, canManageOrders: e.target.checked }))}
                        className="w-5 h-5 shrink-0 accent-indigo-500 cursor-pointer"
                      />
                      <span>📦 الطلبات والتحويلات</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-indigo-500/60">
                      <input
                        type="checkbox"
                        checked={newEmpPermissions.canManagePackages}
                        onChange={(e) => setNewEmpPermissions((current) => ({ ...current, canManagePackages: e.target.checked }))}
                        className="w-5 h-5 shrink-0 accent-indigo-500 cursor-pointer"
                      />
                      <span>🏷️ أسعار الباقات</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-indigo-500/60">
                      <input
                        type="checkbox"
                        checked={newEmpPermissions.canManageDiscounts}
                        onChange={(e) => setNewEmpPermissions((current) => ({ ...current, canManageDiscounts: e.target.checked }))}
                        className="w-5 h-5 shrink-0 accent-indigo-500 cursor-pointer"
                      />
                      <span>🎟️ أكواد الخصم والحاسبة</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-indigo-500/60">
                      <input
                        type="checkbox"
                        checked={newEmpPermissions.canManagePortfolio}
                        onChange={(e) => setNewEmpPermissions((current) => ({ ...current, canManagePortfolio: e.target.checked }))}
                        className="w-5 h-5 shrink-0 accent-indigo-500 cursor-pointer"
                      />
                      <span>🖼️ المعرض والوسائط</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-indigo-500/60">
                      <input
                        type="checkbox"
                        checked={newEmpPermissions.canManageCustomers}
                        onChange={(e) => setNewEmpPermissions((current) => ({ ...current, canManageCustomers: e.target.checked }))}
                        className="w-5 h-5 shrink-0 accent-indigo-500 cursor-pointer"
                      />
                      <span>👥 إدارة العملاء والرمز</span>
                    </label>

                    <label className="flex items-center gap-2 p-3 min-h-12 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 cursor-pointer select-none hover:border-indigo-500/60">
                      <input
                        type="checkbox"
                        checked={newEmpPermissions.canToggleVisibility}
                        onChange={(e) => setNewEmpPermissions((current) => ({ ...current, canToggleVisibility: e.target.checked }))}
                        className="w-5 h-5 shrink-0 accent-indigo-500 cursor-pointer"
                      />
                      <span>👁️ إخفاء وإظهار الأقسام</span>
                    </label>
                  </div>
                </div>

                {/* 2FA Option for new employee */}
                <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={newEmpRequire2FA}
                      onChange={(e) => setNewEmpRequire2FA(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-0"
                    />
                    <span className="font-bold">تفعيل التحقق بخطوتين (2FA) لهذا الموظف</span>
                  </label>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${newEmpRequire2FA ? 'bg-indigo-500/20 text-indigo-300' : 'bg-emerald-500/20 text-emerald-300'}`}>
                    {newEmpRequire2FA ? '🔐 يتطلب كود أمان للدخول' : '⚡ تسجيل دخول مباشر وفوري'}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    🔒 تشفير كامل لكلمة المرور وحفظ الصلاحيات المحددة فوراً.
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-950/40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>إنشاء حساب الموظف بالصلاحيات</span>
                  </button>
                </div>
              </form>

              {/* List of Employees */}
              <div className="space-y-3">
                <h5 className="text-xs font-bold text-slate-300">
                  الموظفون المسجلون حالياً في النظام ({employees.length}):
                </h5>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold">
                            💼
                          </div>
                          <div>
                            <h6 className="text-xs font-bold text-white">{emp.name}</h6>
                            <span className="text-[10px] text-slate-400">
                              اليوزر: <code className="text-emerald-400 font-mono font-bold">{emp.phone}</code>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleCopyEmpCredentials(emp)}
                            className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-colors"
                            title="نسخ بيانات الدخول للموظف"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>نسخ الدخول</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              const newVal = emp.require2FA !== false ? false : true;
                              const res = db.toggleEmployee2FA(emp.id, newVal);
                              if (res.success) {
                                reloadData();
                                showToast(newVal ? `✅ تم تفعيل 2FA للموظف ${emp.name}` : `🔓 تم إلغاء 2FA للموظف ${emp.name} (دخول مباشر)`);
                              }
                            }}
                            className={`p-1.5 rounded-lg text-[11px] flex items-center gap-1 font-bold cursor-pointer transition-colors ${
                              emp.require2FA === false
                                ? 'bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30'
                                : 'bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30'
                            }`}
                            title={emp.require2FA === false ? 'تفعيل التحقق بخطوتين' : 'إلغاء التحقق بخطوتين'}
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>{emp.require2FA === false ? '2FA معطّل' : '2FA مفعّل'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEditPerms(emp)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-300 hover:bg-slate-800 transition-colors text-[11px] flex items-center gap-1 font-bold"
                            title="تعديل صلاحيات الموظف"
                          >
                            <Key className="w-3.5 h-3.5" />
                            <span>الصلاحيات</span>
                          </button>

                          {emp.phone !== 'emp' ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteEmployee(emp.id, emp.name)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                              title="حذف حساب الموظف"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          ) : (
                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800 text-slate-400">
                              أساسي
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Credentials Display Card */}
                      <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">كلمة المرور:</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-white text-[11px]">
                              {showEmpPasswordsMap[emp.id] ? (emp.plainHint || emp.password || 'Emp@2026') : '••••••••'}
                            </span>
                            <button
                              type="button"
                              onClick={() => togglePasswordVisibilityForEmp(emp.id)}
                              className="text-slate-400 hover:text-white p-0.5"
                              title="إظهار/إخفاء كلمة المرور"
                            >
                              {showEmpPasswordsMap[emp.id] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        </div>

                        <div>
                          <span className="text-[10px] text-slate-500 block">كود الأمان (2FA):</span>
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-amber-300 text-[11px] tracking-wider">
                              {emp.securityCode || '2026'}
                            </span>
                            <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold ${
                              emp.require2FA === false
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            }`}>
                              {emp.require2FA === false ? '🔓 معطّل' : '🔐 مفعّل'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Permissions Badges */}
                      <div className="flex flex-wrap gap-1 text-[10px]">
                        {emp.permissions?.canManageOrders !== false && (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            📦 الطلبات
                          </span>
                        )}
                        {emp.permissions?.canManagePackages && (
                          <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-300 border border-purple-500/20">
                            🏷️ الباقات
                          </span>
                        )}
                        {emp.permissions?.canManageDiscounts && (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20">
                            🎟️ الخصومات
                          </span>
                        )}
                        {emp.permissions?.canManagePortfolio && (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/10 text-rose-300 border border-rose-500/20">
                            🖼️ المعرض
                          </span>
                        )}
                        {emp.permissions?.canManageCustomers && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                            👥 العملاء
                          </span>
                        )}
                        {emp.permissions?.canToggleVisibility && (
                          <span className="px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-300 border border-sky-500/20">
                            👁️ الأقسام
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-800/80">
                        <div>
                          <span className="text-slate-400 block text-[10px]">كلمة المرور:</span>
                          <span className="font-mono text-indigo-300 font-bold">
                            {emp.plainHint || 'مشفرة في قاعدة البيانات'}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">المنشئ والتاريخ:</span>
                          <span className="text-slate-300">
                            {emp.createdBy || 'المدير'} ({emp.createdAt || '2026-10-20'})
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 9: MAINTENANCE MODE (وضع الصيانة وإغلاق الموقع للزبائن) */}
          {/* ============================================================ */}
          {activeTab === 'maintenance' && isManager && (
            <div className="space-y-6">
              <div>
                <h4 className="text-sm sm:text-base font-black text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-amber-400" />
                  <span>إدارة وضع الصيانة وإغلاق الموقع للزوار</span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  عند تفعيل هذا الوضع، يظهر لجميع الزوار والعملاء شاشة الصيانة وتطوير الخوادم، ويبقى بإمكانك كمدير تسجيل الدخول وإدارته.
                </p>
              </div>

              {/* Status Alert Banner */}
              <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                maintenanceMode.enabled
                  ? 'bg-rose-950/40 border-rose-500/50 text-rose-300'
                  : 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${
                    maintenanceMode.enabled ? 'bg-rose-600/30 border border-rose-500/40' : 'bg-emerald-600/30 border border-emerald-500/40'
                  }`}>
                    {maintenanceMode.enabled ? '⚠️' : '✅'}
                  </div>
                  <div>
                    <h5 className="text-sm font-black text-white">
                      {maintenanceMode.enabled 
                        ? 'الموقع حالياً في وضع الصيانة (مغلق أمام الزوار والعملاء)' 
                        : 'الموقع نشط ومتاح لجميع الزوار والعملاء'}
                    </h5>
                    <p className="text-xs text-slate-300 mt-0.5">
                      {maintenanceMode.enabled 
                        ? 'الزوار يرون صفحة الصيانة مع زر التواصل عبر الواتساب واختصار دخول الإدارة.' 
                        : 'المتجر والتصاميم والصفحات تعمل بكفاءة تامة دون حجب.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleMaintenance(!maintenanceMode.enabled)}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer shrink-0 ${
                    maintenanceMode.enabled
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/40'
                      : 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-950/40'
                  }`}
                >
                  <Power className="w-4 h-4" />
                  <span>
                    {maintenanceMode.enabled ? 'إلغاء وضع الصيانة وإعادة فتح الموقع' : 'إغلاق الموقع وتفعيل وضع الصيانة فوراً'}
                  </span>
                </button>
              </div>

              {/* Settings Form */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
                <h5 className="text-xs font-bold text-white flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-indigo-400" />
                  <span>تخصيص رسالة الصيانة المعروضة للزبائن</span>
                </h5>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    رسالة شاشة الصيانة:
                  </label>
                  <textarea
                    rows="3"
                    value={maintenanceMessage}
                    onChange={(e) => setMaintenanceMessage(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white resize-none"
                    placeholder="مثال: الموقع حالياً تحت الصيانة الدورية وتطوير الخوادم، سنعود إليكم قريباً جداً ⏳"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    الوقت التقديري للعودة:
                  </label>
                  <input
                    type="text"
                    value={maintenanceReturn}
                    onChange={(e) => setMaintenanceReturn(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white"
                    placeholder="مثال: خلال ساعتين / اليوم الساعة 8 مساءً"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => {
                    db.toggleMaintenanceMode(maintenanceMode.enabled, maintenanceMessage);
                    reloadData();
                    showToast('تم حفظ إعدادات ورسالة وضع الصيانة بنجاح ✓');
                  }}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ رسالة الصيانة</span>
                </button>
              </div>
            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 9: PLATFORM USER GUIDE (PDF) - STAFF & MANAGER ONLY */}
          {/* ============================================================ */}
          {activeTab === 'guide' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-indigo-950/80 via-slate-900 to-amber-950/40 border border-amber-500/30 space-y-4 shadow-xl">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-2xl shadow-lg">
                      📄
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-base sm:text-lg font-black text-white">دليل منصة وصلني التعريفي والتشغيلي (PDF)</h4>
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          خاص بالإدارة وفريق العمل 🔒
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">
                        دليل مصمم بعناية فائقة (4 صفحات تعريفية) لشرح المنصة وآلية تسجيل الدخول وطلب الخدمات لجذب العملاء.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <a
                      href="/WASLNI_USER_GUIDE.html"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-1.5 shadow-md shadow-indigo-950/50 transition-all hover:scale-105"
                    >
                      <Eye className="w-4 h-4" />
                      <span>عرض الدليل التفاعلي كاملاً</span>
                    </a>

                    <a
                      href="/WASLNI_USER_GUIDE.pdf"
                      download="WASLNI_USER_GUIDE.pdf"
                      target="_blank"
                      rel="noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md shadow-amber-950/50 transition-all hover:scale-105"
                    >
                      <Download className="w-4 h-4" />
                      <span>تحميل ملف PDF مباشرة</span>
                    </a>
                  </div>
                </div>

                {/* 4 Core Sections Overview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-indigo-400">الصفحة 1</span>
                      <span className="text-xs">✨</span>
                    </div>
                    <h5 className="text-xs font-black text-white">التعريف بالمنصة ومزاياها</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      شرح هوية وصلني كشريك رقمي للمحلات والأنشطة الصغيرة بدون تكاليف أو اشتراكات طويلة الأجل.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-emerald-400">الصفحة 2</span>
                      <span className="text-xs">🏷️</span>
                    </div>
                    <h5 className="text-xs font-black text-white">الباقات والأسعار التنافسية</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      تفاصيل باقة 99 ر.س الماسية، باقة النمو 189 ر.س، وباقة المتجر الإلكتروني 349 ر.س مع حاسبة التكلفة.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-amber-400">الصفحة 3</span>
                      <span className="text-xs">🔐</span>
                    </div>
                    <h5 className="text-xs font-black text-white">الأمان وتسجيل الدخول (2FA)</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      كلمات مرور صارمة 8+ خانات، كود التحقق الرباعي، ونظام الحماية من هجمات التكرار (قفل 5 دقائق).
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-sky-400">الصفحة 4</span>
                      <span className="text-xs">📦</span>
                    </div>
                    <h5 className="text-xs font-black text-white">آلية الطلب وتتبع الإنجاز</h5>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">
                      خطوات الطلب، كود التحقق الأمني، مطابقة الحوالات البنكية، وتتبع مراحل العمل حتى التسليم النهائي.
                    </p>
                  </div>
                </div>

                {/* Quick Client Sharing Helper */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-white block">رسالة جاهزة لإرسال الدليل للعميل عبر الواتساب:</span>
                    <p className="text-slate-400 text-[11px]">
                      انسخ النص التالي وأرسله مع ملف الـ PDF لأي عميل مهتم لتعريفه بخدمات المنصة.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const text = `مرحباً بك عزيزي صاحب النشاط التجاري 🌸
يسعدنا إرفاق الدليل التعريفي الشامل لمنصة "وصلني" للخدمات الرقمية والتسويقية للمحلات:
📄 يوضح الدليل:
1. باقات المحتوى ومقاطع الريلز ابتداءً من 99 ر.س فقط
2. آلية إنشاء الحساب والأمان الرقمي للطلبات
3. خطوات الدفع وتتبع تنفيذ طلبك أولاً بأول

نسعد بخدمتكم وتجهيز أول إعلان لمحلك فوراً!`;
                      navigator.clipboard.writeText(text);
                      showToast('تم نسخ نص رسالة إرسال الدليل للعملاء بنجاح!');
                    }}
                    className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center gap-1.5 cursor-pointer shrink-0 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>نسخ رسالة الواتساب للعملاء</span>
                  </button>
                </div>
              </div>

              {/* Direct Embed Preview of the Guide */}
              <div className="rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl">
                <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-indigo-400" />
                    <span className="text-xs font-bold text-white">معاينة مباشرة للدليل التعريفي من داخل المنصة</span>
                  </div>
                  <span className="text-[11px] text-slate-400">يمكنك التمرير أو فتح الصفحة بنافذة مستقلة</span>
                </div>
                <iframe
                  src="/WASLNI_USER_GUIDE.html"
                  title="دليل منصة وصلني"
                  className="w-full h-[420px] sm:h-[650px] border-none bg-[#0b0f19]"
                />
              </div>
            </div>
          )}

        </div>

        </div>
      </div>

      {/* ============================================================ */}
      {/* MODAL: RESET CUSTOMER PASSWORD (8+ chars) */}
      {/* ============================================================ */}
      {selectedCustomerForReset && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e1322] border border-indigo-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-bold text-white">إعادة تعيين كلمة مرور لـ {selectedCustomerForReset.name}</h4>
              </div>
              <button onClick={() => setSelectedCustomerForReset(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">رقم جوال العميل:</span>
                  <span className="font-mono text-white" dir="ltr">{selectedCustomerForReset.phone}</span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-slate-400">المحل / المتجر:</span>
                  <span className="text-indigo-300 font-bold">{selectedCustomerForReset.storeName}</span>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">
                  كلمة المرور الجديدة (8 خانات على الأقل):
                </label>
                <input
                  type="text"
                  placeholder="أدخل كلمة مرور قوية (8+ خانات)"
                  value={newCustomerPasswordInput}
                  onChange={(e) => setNewCustomerPasswordInput(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                />
                <span className="text-[10px] text-amber-400 mt-1 block">
                  سيتم توليد كود أمان رباعي جديد وإرسال تنبيه بالتيليجرام فور الحفظ.
                </span>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSaveCustomerPassword}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs"
              >
                حفظ الرمز الجديد
              </button>
              <button
                type="button"
                onClick={() => setSelectedCustomerForReset(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EMPLOYEE ATTACH BANK RECEIPT & CONFIRM */}
      {/* ============================================================ */}
      {selectedOrderForTransfer && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0e1322] border border-amber-500/40 p-5 sm:p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xl">💳</span>
                <h4 className="text-sm sm:text-base font-black text-white">
                  إرفاق إيصال التحويل للطلب ({selectedOrderForTransfer.orderNumber})
                </h4>
              </div>
              <button
                onClick={() => setSelectedOrderForTransfer(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">الزبون:</span>
                  <strong className="text-white">{selectedOrderForTransfer.customerName}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">المبلغ المطلوب:</span>
                  <strong className="text-emerald-400 font-mono text-sm">{selectedOrderForTransfer.amount} ر.س</strong>
                </div>
              </div>

              {/* Confirm or change package */}
              <div>
                <label className="block text-slate-300 font-bold mb-1">تحديد الباقة:</label>
                <select
                  value={selectedPackageId}
                  onChange={(e) => setSelectedPackageId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white"
                >
                  {packages.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.price} ر.س)</option>
                  ))}
                </select>
              </div>

              {/* Upload Receipt */}
              <div className="space-y-2">
                <label className="block text-slate-300 font-bold">صورة إيصال التحويل البنكي:</label>
                <div className="flex items-center gap-3">
                  <label className="flex-1 flex flex-col items-center justify-center p-4 border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl cursor-pointer bg-slate-950/60 transition-colors">
                    <Upload className="w-6 h-6 text-indigo-400 mb-1" />
                    <span className="text-xs text-slate-300 font-medium">اختر ملف صورة الإيصال</span>
                    <span className="text-[10px] text-slate-500">PNG, JPG, أو لقطة شاشة</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileUploadReceipt}
                      className="hidden"
                    />
                  </label>
                </div>

                {receiptImage && (
                  <div className="mt-2 p-2 rounded-xl bg-slate-900 border border-slate-700 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img src={receiptImage} alt="إيصال" className="w-12 h-12 object-cover rounded-lg border border-slate-600" />
                      <span className="text-emerald-400 font-bold text-xs">تم إرفاق صورة الإيصال بنجاح ✓</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReceiptImage('')}
                      className="text-rose-400 hover:text-rose-300 text-xs px-2"
                    >
                      إزالة
                    </button>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات التحويل للمدير (اختياري):</label>
                <textarea
                  rows="2"
                  placeholder="مثال: تم التأكد من وصول الحوالة على بنك الراجحي بالمبلغ كاملاً..."
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white resize-none"
                />
              </div>
            </div>

            {/* The exact requested button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleConfirmTransferAndReceived}
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer"
              >
                <CheckCircle className="w-5 h-5 text-white" />
                <span>تم التحويل واستلام المبلغ كامل</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: PREVIEW BANK RECEIPT IMAGE */}
      {/* ============================================================ */}
      {previewReceiptUrl && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
          <div className="relative max-w-lg w-full bg-slate-900 rounded-3xl border border-slate-800 p-4 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-800">
              <span className="text-sm font-bold text-white">معاينة صورة التحويل البنكي</span>
              <button onClick={() => setPreviewReceiptUrl(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-auto rounded-xl border border-slate-800 bg-black flex items-center justify-center">
              <img src={previewReceiptUrl} alt="إيصال التحويل" className="max-w-full h-auto object-contain" />
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: ORDER DELETION CONFIRMATION WITH 4-DIGIT SECURITY CODE */}
      {/* ============================================================ */}
      {orderToDelete && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e1322] border border-rose-500/50 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2 text-rose-400">
                <ShieldAlert className="w-5 h-5" />
                <h4 className="text-sm font-black text-white">{orderToDeleteAction === 'hard_delete' ? 'تأكيد الحذف النهائي' : 'تأكيد إلغاء الطلب'} ({orderToDelete.orderNumber})</h4>
              </div>
              <button 
                onClick={() => { setOrderToDelete(null); setDeletionError(''); setDeletionCodeInput(''); }} 
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-rose-950/30 border border-rose-500/30 text-rose-300 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{orderToDeleteAction === 'hard_delete' ? 'تحذير: الحذف النهائي لا يمكن التراجع عنه!' : 'سيتم إلغاء الطلب وإخفاؤه من الطلبات النشطة.'}</span>
                </p>
                <p className="text-[11px] text-rose-200">
                  {orderToDeleteAction === 'hard_delete' ? 'سيُحذف الطلب نهائياً بعد مطابقة رمز Telegram.' : 'لا يُلغى الطلب إلا بعد مطابقة رمز Telegram.'}
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">العميل:</span>
                  <span className="font-bold text-white">{orderToDelete.customerName} ({orderToDelete.customerPhone})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">الباقة والمبلغ:</span>
                  <span className="font-mono text-emerald-400 font-bold">{orderToDelete.packageName} ({orderToDelete.amount} ر.س)</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-center space-y-1">
                <p className="text-xs text-indigo-300 font-bold flex items-center justify-center gap-1.5">
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>أرسلنا رمز تأكيد العملية إلى تيليجرام</span>
                </p>
                <p className="text-[10px] text-slate-400">
                  يرجى فتح البوت وإدخال الرمز المكون من 4 أرقام للمتابعة
                </p>
              </div>

              {deletionError && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{deletionError}</span>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-bold mb-1.5">
                  أدخل كود التحقق الأمني الرباعي:
                </label>
                <input
                  type="text"
                  maxLength="4"
                  autoFocus
                  required
                  placeholder="• • • •"
                  value={deletionCodeInput}
                  onChange={(e) => setDeletionCodeInput(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-950 border border-slate-700 text-center text-xl font-mono font-black text-rose-400 tracking-widest focus:outline-none focus:border-rose-500"
                  dir="ltr"
                />
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                disabled={isDeletingOrder}
                onClick={handleConfirmDeleteOrder}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-black text-xs shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeletingOrder ? 'جارٍ التحقق...' : orderToDeleteAction === 'hard_delete' ? 'تأكيد الحذف النهائي' : 'تأكيد إلغاء الطلب'}</span>
              </button>
              <button
                type="button"
                onClick={() => { setOrderToDelete(null); setDeletionError(''); setDeletionCodeInput(''); }}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white text-xs font-bold transition-colors cursor-pointer"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: EDIT EMPLOYEE PERMISSIONS */}
      {/* ============================================================ */}
      {selectedEmpForPerms && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-[#0e1322] border border-indigo-500/40 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-400" />
                <h4 className="text-sm font-black text-white">تعديل صلاحيات الموظف ({selectedEmpForPerms.name})</h4>
              </div>
              <button onClick={() => setSelectedEmpForPerms(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300">
                حدد الأقسام والعمليات المسموح لهذا الموظف إدارتها:
              </p>

              <div className="space-y-2">
                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>📦</span>
                    <span>إدارة الطلبات والتحويلات</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={editPermsState.canManageOrders !== false}
                    onChange={(e) => setEditPermsState({ ...editPermsState, canManageOrders: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>🏷️</span>
                    <span>تعديل أسعار الباقات</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(editPermsState.canManagePackages)}
                    onChange={(e) => setEditPermsState({ ...editPermsState, canManagePackages: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>🎟️</span>
                    <span>أكواد الخصم والحاسبة</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(editPermsState.canManageDiscounts)}
                    onChange={(e) => setEditPermsState({ ...editPermsState, canManageDiscounts: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>🖼️</span>
                    <span>المعرض ورفع الوسائط</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(editPermsState.canManagePortfolio)}
                    onChange={(e) => setEditPermsState({ ...editPermsState, canManagePortfolio: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>👥</span>
                    <span>إدارة العملاء وكلمات المرور</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(editPermsState.canManageCustomers)}
                    onChange={(e) => setEditPermsState({ ...editPermsState, canManageCustomers: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </label>

                <label className="flex items-center justify-between p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer hover:border-slate-700">
                  <span className="font-bold text-white flex items-center gap-2">
                    <span>👁️</span>
                    <span>إخفاء وإظهار الأقسام في الموقع</span>
                  </span>
                  <input
                    type="checkbox"
                    checked={Boolean(editPermsState.canToggleVisibility)}
                    onChange={(e) => setEditPermsState({ ...editPermsState, canToggleVisibility: e.target.checked })}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-0"
                  />
                </label>
              </div>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleSaveEditPerms}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md shadow-indigo-950/40"
              >
                حفظ الصلاحيات
              </button>
              <button
                type="button"
                onClick={() => setSelectedEmpForPerms(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-300 text-xs"
              >
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: MANUAL ORDER REGISTRATION / IMPORT FROM WHATSAPP & TELEGRAM */}
      {/* ============================================================ */}
      {isManualOrderModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/90 backdrop-blur-md animate-fadeIn">
          <div className="relative w-full max-w-lg rounded-3xl bg-[#0e1322] border border-emerald-500/40 p-5 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                  📥
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">تسجيل واستيراد طلب يدوي في النظام</h4>
                  <p className="text-[11px] text-slate-400">إدراج طلب وارد عبر الواتساب أو التيليجرام فوراً</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManualOrderModalOpen(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveManualOrder} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم الطلب:</label>
                  <input
                    type="text"
                    required
                    value={manualOrderNumber}
                    onChange={(e) => setManualOrderNumber(e.target.value)}
                    placeholder="مثال: WS-8260"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">كود التحقق الأمني (4 أرقام):</label>
                  <input
                    type="text"
                    required
                    maxLength="4"
                    value={manualSecurityCode}
                    onChange={(e) => setManualSecurityCode(e.target.value.replace(/[^0-9]/g, ''))}
                    placeholder="مثال: 5308"
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold text-center tracking-widest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم العميل:</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد العتيبي"
                    value={manualCustomerName}
                    onChange={(e) => setManualCustomerName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">رقم جوال الواتساب:</label>
                  <input
                    type="tel"
                    required
                    placeholder="0502799466"
                    value={manualCustomerPhone}
                    onChange={(e) => setManualCustomerPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono text-left"
                    dir="ltr"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">اسم المتجر / المحل:</label>
                  <input
                    type="text"
                    placeholder="مثال: بوتيك ورد"
                    value={manualStoreName}
                    onChange={(e) => setManualStoreName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">نوع النشاط:</label>
                  <input
                    type="text"
                    placeholder="مثال: ورود وهدايا"
                    value={manualStoreType}
                    onChange={(e) => setManualStoreType(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">الباقة أو الخدمة:</label>
                  <input
                    type="text"
                    required
                    value={manualPackageName}
                    onChange={(e) => setManualPackageName(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-bold mb-1">المبلغ المستحق (ر.س):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualAmount}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-emerald-400 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">حالة الطلب الأولية:</label>
                <select
                  value={manualStatus}
                  onChange={(e) => setManualStatus(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white"
                >
                  <option value="pending_payment">بانتظار التحويل البنكي</option>
                  <option value="transferred">تم التحويل واستلام المبلغ (مرفوع للمدير)</option>
                  <option value="approved_by_manager">معتمد من المدير وقيد التنفيذ</option>
                  <option value="completed">مكتمل وتم التسليم للعميل</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1">ملاحظات الطلب:</label>
                <textarea
                  rows="2"
                  value={manualNotes}
                  onChange={(e) => setManualNotes(e.target.value)}
                  placeholder="أي تفاصيل خاصة بالطلب أو محادثة الواتساب..."
                  className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white resize-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-black text-xs shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>حفظ وإدراج الطلب فوراً في النظام</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsManualOrderModalOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
