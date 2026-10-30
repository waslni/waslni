import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, CloudUpload, ExternalLink, FileImage, FileVideo, LogOut, Package, Save, ShieldCheck, Store, Trash2 } from 'lucide-react';
import initialContent from '../data/siteContent.json';
import { githubAdminSession, getRepositoryJson, listRepositoryMedia, saveRepositoryJson, uploadRepositoryMedia, verifyGithubAdminToken } from '../services/githubContentService';
import { adminTelegramLogin } from '../services/adminTelegramLogin';

const CONTENT_PATH = 'src/data/siteContent.json';
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

function Field({ label, value, onChange, type = 'text', ...props }) {
  return <label className="block text-sm font-bold text-slate-200">{label}<input {...props} type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-3 text-sm font-normal text-white outline-none transition focus:border-indigo-400"/></label>;
}

export default function AdminPortal({ onBack }) {
  const [token, setToken] = useState(() => githubAdminSession.read());
  const [telegramVerified, setTelegramVerified] = useState(() => sessionStorage.getItem('waslni_admin_telegram_verified') === '1');
  const [challengeId, setChallengeId] = useState('');
  const [telegramCode, setTelegramCode] = useState('');
  const [admin, setAdmin] = useState(null);
  const [content, setContent] = useState(initialContent);
  const [contentSha, setContentSha] = useState('');
  const [media, setMedia] = useState([]);
  const [activeTab, setActiveTab] = useState('packages');
  const [selectedPackageId, setSelectedPackageId] = useState(initialContent.packages[0]?.id || '');
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPreview, setLocalPreview] = useState('');
  const [localPreviewType, setLocalPreviewType] = useState('');
  const [localFileName, setLocalFileName] = useState('');
  const [draftWork, setDraftWork] = useState({ title: '', category: initialContent.portfolio[0]?.category || '', type: 'تصميم إعلاني', filePath: '', poster: '' });
  const [isNewCategory, setIsNewCategory] = useState(false);

  const loadDashboard = async (accessToken) => {
    const [profile, repoContent, repoMedia] = await Promise.all([
      verifyGithubAdminToken(accessToken),
      getRepositoryJson(CONTENT_PATH, accessToken),
      listRepositoryMedia(accessToken)
    ]);
    setAdmin(profile);
    setContent(repoContent.value);
    setContentSha(repoContent.sha);
    setMedia(repoMedia);
    setSelectedPackageId(current => repoContent.value.packages.some(item => item.id === current) ? current : repoContent.value.packages[0]?.id || '');
  };

  useEffect(() => {
    if (!token || !telegramVerified) return;
    let cancelled = false;
    setLoading(true);
    loadDashboard(token).catch(loadError => {
      if (cancelled) return;
      githubAdminSession.clear();
      setToken('');
      setAdmin(null);
      setError(loadError.message || 'تعذر التحقق من صلاحية GitHub.');
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => () => {
    if (localPreview) URL.revokeObjectURL(localPreview);
  }, [localPreview]);

  const sendTelegramCode = async (event) => {
    event.preventDefault();
    setError(''); setStatus(''); setLoading(true);
    const enteredToken = token.trim();
    try {
      const result = await adminTelegramLogin({ action: 'send', githubToken: enteredToken });
      setChallengeId(result.challengeId);
      setStatus(result.message);
    } catch (loginError) {
      setError(loginError.message || 'تعذر تسجيل الدخول إلى GitHub.');
    } finally { setLoading(false); }
  };

  const verifyTelegramCode = async (event) => {
    event.preventDefault();
    setError(''); setStatus(''); setLoading(true);
    const enteredToken = token.trim();
    try {
      await adminTelegramLogin({ action: 'verify', githubToken: enteredToken, challengeId, code: telegramCode.trim() });
      await loadDashboard(enteredToken);
      githubAdminSession.write(enteredToken);
      sessionStorage.setItem('waslni_admin_telegram_verified', '1');
      setTelegramVerified(true);
      setStatus('تم التحقق من الرمز والدخول إلى لوحة المدير.');
    } catch (loginError) {
      setError(loginError.message || 'تعذر التحقق من الرمز.');
    } finally { setLoading(false); }
  };

  const logout = () => {
    githubAdminSession.clear(); sessionStorage.removeItem('waslni_admin_telegram_verified'); setTelegramVerified(false); setChallengeId(''); setTelegramCode(''); setToken(''); setAdmin(null); setContent(initialContent); setContentSha(''); setMedia([]); setStatus('تم تسجيل الخروج.'); setError('');
  };

  const commitContent = async (nextContent, message) => {
    setError(''); setStatus(''); setLoading(true);
    try {
      const result = await saveRepositoryJson(CONTENT_PATH, nextContent, token, contentSha, message);
      setContent(nextContent); setContentSha(result.content.sha); setStatus('حُفظ التعديل في GitHub. بدأ نشر الموقع تلقائيًا، وقد يستغرق ظهوره دقيقة أو دقيقتين.');
    } catch (saveError) { setError(saveError.message || 'تعذر حفظ المحتوى.'); }
    finally { setLoading(false); }
  };

  const updateBrand = (key, value) => setContent(current => ({ ...current, brand: { ...current.brand, [key]: value } }));
  const updateAbout = (key, value) => setContent(current => ({ ...current, about: { ...current.about, [key]: value } }));
  const selectedPackage = content.packages.find(item => item.id === selectedPackageId) || content.packages[0];
  const portfolioCategories = [...new Set(content.portfolio.map(item => item.category?.trim()).filter(Boolean))];
  const selectedRepositoryMedia = media.find(item => item.path === draftWork.filePath);
  const previewSource = localPreview || selectedRepositoryMedia?.downloadUrl || '';
  const previewIsVideo = localPreview ? localPreviewType === 'video' : /\.(mp4|webm|mov)$/i.test(selectedRepositoryMedia?.name || '');
  const updatePackage = (key, value) => {
    if (!selectedPackage) return;
    const nextPackage = { ...selectedPackage, [key]: key === 'price' ? (value === '' ? '' : Number(value)) : value };
    setContent(current => ({ ...current, packages: current.packages.map(item => item.id === selectedPackage.id ? nextPackage : item) }));
  };

  const uploadMedia = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) { setError('اختر صورة أو مقطع فيديو.'); return; }
    if (file.size > MAX_UPLOAD_SIZE) { setError('حجم الملف أكبر من 50 ميجابايت. ضغط الفيديو أو الصورة ثم أعد المحاولة.'); return; }
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(URL.createObjectURL(file));
    setLocalPreviewType(file.type.startsWith('video/') ? 'video' : 'image');
    setLocalFileName(file.name);
    setDraftWork(current => ({ ...current, filePath: '' }));
    setError(''); setStatus(`تم اختيار «${file.name}». جارٍ رفعه إلى GitHub…`); setUploading(true);
    try {
      const path = await uploadRepositoryMedia(file, token);
      setDraftWork(current => ({ ...current, filePath: path, type: file.type.startsWith('video/') ? 'فيديو قصير' : 'تصميم إعلاني' }));
      setStatus('رُفع الملف إلى GitHub. أضف عنوانه ثم اضغط «إضافة إلى المعرض» ليظهر بعد النشر.');
      try { setMedia(await listRepositoryMedia(token)); }
      catch { setStatus('رُفع الملف بنجاح وأصبح جاهزًا للإضافة. تعذر تحديث قائمة الملفات السابقة؛ حدّث اللوحة لاحقًا.'); }
    } catch (uploadError) { setError(uploadError.message || 'تعذر رفع الملف إلى GitHub.'); }
    finally { setUploading(false); }
  };

  const addWork = () => {
    if (!draftWork.title.trim() || !draftWork.category.trim() || !draftWork.filePath) { setError('اختر قسم العمل أو أضف قسمًا جديدًا، ثم أدخل العنوان وارفع الملف.'); return; }
    const video = /\.(mp4|webm|mov)$/i.test(draftWork.filePath);
    const work = {
      id: `work_${Date.now()}`,
      category: draftWork.category.trim(),
      title: draftWork.title.trim(),
      type: draftWork.type.trim() || (video ? 'فيديو قصير' : 'تصميم إعلاني'),
      ...(video ? { mediaType: 'video', video: draftWork.filePath, image: '', ...(draftWork.poster ? { poster: draftWork.poster } : {}) } : { image: draftWork.filePath })
    };
    setContent(current => ({ ...current, portfolio: [work, ...current.portfolio] }));
    setDraftWork({ title: '', category: portfolioCategories[0] || '', type: 'تصميم إعلاني', filePath: '', poster: '' });
    setIsNewCategory(false);
    if (localPreview) URL.revokeObjectURL(localPreview);
    setLocalPreview(''); setLocalPreviewType(''); setLocalFileName('');
    setStatus('أضيف العمل إلى التغييرات غير المحفوظة؛ اضغط «حفظ ونشر التعديلات».');
  };

  const removeWork = id => setContent(current => ({ ...current, portfolio: current.portfolio.filter(item => item.id !== id) }));

  const saveAll = () => commitContent(content, 'Update Waslni site content');

  return <div dir="rtl" className="min-h-screen bg-[#080d18] text-slate-100">
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080d18]/90 backdrop-blur-xl"><div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
      <div className="flex items-center gap-3"><button onClick={onBack} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5" aria-label="العودة للموقع"><ArrowRight size={18}/></button><div className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-500 font-black">و</div><div><b className="block">إدارة وصلني</b><small className="text-xs text-slate-500">يحفظ التعديلات في GitHub وينشرها</small></div></div>
      <div className="flex items-center gap-2">{admin && <span className="hidden text-sm text-slate-400 sm:inline">{admin.login}</span>}<a href="https://github.com/waslni/waslni/actions/workflows/deploy.yml" target="_blank" rel="noreferrer" className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5" title="حالة النشر"><ExternalLink size={17}/></a>{admin && <button onClick={logout} className="rounded-xl border border-white/10 p-2 text-slate-300 hover:bg-white/5" title="تسجيل الخروج"><LogOut size={17}/></button>}</div>
    </div></header>

    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-12">
      {!admin ? <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20"><div className="bg-gradient-to-l from-indigo-600/20 to-violet-600/5 p-6 sm:p-8"><span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200"><ShieldCheck size={28}/></span><h1 className="text-2xl font-black">دخول المدير مع تحقق Telegram</h1><p className="mt-2 leading-7 text-slate-300">تحقق أولًا برمز GitHub المحدود، ثم أدخل الرمز الذي نرسله إلى Telegram. لكل رمز محاولتان وصلاحيته خمس دقائق.</p></div>
        {(error || status) && <div role="status" className={`mx-6 mt-6 rounded-xl border p-4 text-sm leading-6 sm:mx-8 ${error ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>{error || status}</div>}
        {!challengeId ? <form onSubmit={sendTelegramCode} className="space-y-4 p-6 sm:p-8"><label className="block text-sm font-bold">رمز وصول GitHub المحدود<input required type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="github_pat_…" dir="ltr" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-left font-mono text-sm text-white outline-none focus:border-indigo-400"/></label>
          <button disabled={loading} className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 font-black hover:bg-indigo-400 disabled:opacity-60">{loading ? 'جارٍ التحقق والإرسال…' : 'تحقق وأرسل الرمز إلى Telegram'}</button>
        </form> : <form onSubmit={verifyTelegramCode} className="space-y-4 p-6 sm:p-8"><label className="block text-sm font-bold">رمز Telegram المكوّن من 6 أرقام<input required inputMode="numeric" pattern="[0-9]{6}" maxLength={6} autoComplete="one-time-code" value={telegramCode} onChange={event => setTelegramCode(event.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" dir="ltr" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-center font-mono text-2xl tracking-[0.4em] text-white outline-none focus:border-indigo-400"/></label><button disabled={loading || telegramCode.length !== 6} className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 font-black hover:bg-indigo-400 disabled:opacity-60">{loading ? 'جارٍ التحقق…' : 'تحقق وادخل لوحة المدير'}</button><button type="button" onClick={()=>{setChallengeId('');setTelegramCode('');setError('');setStatus('');}} className="w-full py-2 text-sm text-slate-400 hover:text-white">العودة وإرسال رمز جديد</button></form>}
      </div> : <>
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-emerald-300/10 bg-gradient-to-l from-emerald-400/10 via-slate-900/80 to-indigo-500/10 p-5 sm:flex-row sm:items-center sm:p-7"><div><span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-200"><Check size={16}/> تم التحقق من وصول الكتابة للمستودع</span><h1 className="mt-2 text-2xl font-black sm:text-3xl">مرحبًا {admin.login}</h1><p className="mt-2 text-sm text-slate-400">تعديلاتك تُحفظ كـ commit على GitHub ثم ينشرها Actions إلى الموقع.</p></div><button onClick={saveAll} disabled={loading || uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-60"><Save size={18}/>{loading ? 'جارٍ الحفظ…' : 'حفظ ونشر التعديلات'}</button></div>

        {(error || status) && <div role="status" className={`mb-6 rounded-xl border p-4 text-sm leading-6 ${error ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>{error || status}</div>}
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2">{[['packages','الباقات',Package],['works','معرض الأعمال',FileImage],['settings','بيانات الموقع',Store]].map(([id,label,Icon])=><button key={id} onClick={()=>setActiveTab(id)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold sm:text-sm ${activeTab===id?'bg-indigo-500 text-white':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={16}/>{label}</button>)}</div>

        {activeTab === 'settings' && <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><h2 className="mb-2 text-xl font-black">بيانات الموقع</h2><p className="mb-6 text-sm text-slate-400">عدّل التعريف الذي يظهر للزائر في الصفحة الرئيسية.</p><div className="grid gap-5 sm:grid-cols-2"><Field label="اسم المنصة" value={content.brand.name} onChange={value=>updateBrand('name',value)}/><Field label="الشعار المختصر" value={content.brand.slogan} onChange={value=>updateBrand('slogan',value)}/><Field label="رقم واتساب الموظف بصيغة دولية" dir="ltr" value={content.brand.whatsappNumber} onChange={value=>updateBrand('whatsappNumber',value.replace(/\D/g,''))}/><Field label="اسم جهة التواصل" value={content.brand.employeeNumberLabel} onChange={value=>updateBrand('employeeNumberLabel',value)}/><label className="block text-sm font-bold sm:col-span-2">وصف الموقع<textarea rows={3} value={content.brand.description} onChange={event=>updateBrand('description',event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"/></label>{[['creativeServices','صناعة المحتوى والهوية'],['accountManagement','إدارة حسابات التواصل'],['goal','هدف وصلني'],['flexibleServices','الباقات والخدمات'],['closing','العبارة الختامية']].map(([key,label])=><label key={key} className="block text-sm font-bold sm:col-span-2">{label}<textarea rows={key==='creativeServices'||key==='accountManagement'?4:2} value={content.about?.[key] || ''} onChange={event=>updateAbout(key,event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"/></label>)}</div></section>}

        {activeTab === 'packages' && <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">تعديل الباقات</h2><p className="mt-1 text-sm text-slate-400">غيّر السعر والوصف والمزايا، ثم اضغط حفظ ونشر.</p></div><select value={selectedPackageId} onChange={event=>setSelectedPackageId(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">{content.packages.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          {selectedPackage && <div className="grid gap-5 sm:grid-cols-2"><Field label="اسم الباقة" value={selectedPackage.name} onChange={value=>updatePackage('name',value)}/><Field label="السعر بالريال" type="number" min="0" value={selectedPackage.price} onChange={value=>updatePackage('price',value)}/><Field label="وصف مختصر" value={selectedPackage.subtitle} onChange={value=>updatePackage('subtitle',value)}/><Field label="فترة/وحدة السعر" value={selectedPackage.period} onChange={value=>updatePackage('period',value)}/><Field label="الشارة" value={selectedPackage.badge} onChange={value=>updatePackage('badge',value)}/><label className="block text-sm font-bold sm:col-span-2">المزايا (ميزة واحدة في كل سطر)<textarea rows={6} value={selectedPackage.features.join('\n')} onChange={event=>updatePackage('features',event.target.value.split('\n'))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"/></label><Field label="تنويه أو شروط" value={selectedPackage.terms} onChange={value=>updatePackage('terms',value)}/></div>}</section>}

        {activeTab === 'works' && <div className="space-y-6"><section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><h2 className="text-xl font-black">رفع صورة أو مقطع وإضافته للمعرض</h2><p className="mt-2 text-sm leading-6 text-slate-400">يُرفع الملف إلى مستودع GitHub ويظهر في الموقع بعد حفظ المحتوى وانتهاء البناء. الحد الأقصى 50 ميجابايت للملف.</p><p className="mt-2 rounded-xl bg-amber-400/5 p-3 text-xs leading-6 text-amber-100/80">يتطلب الرفع رمز GitHub بصلاحية Contents: Read and write لمستودع waslni/waslni. عند تغيير الرمز، سجّل الخروج ثم ادخل بالرمز الجديد.</p><label className="relative mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-300/30 bg-indigo-400/5 p-5 text-center hover:bg-indigo-400/10"><input aria-label="اختر صورة أو مقطعًا من جهازك" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={uploadMedia} disabled={uploading} className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"/>{uploading?<span className="animate-pulse text-indigo-200">جارٍ رفع الملف إلى GitHub…</span>:<><CloudUpload size={28} className="text-indigo-300"/><b>{draftWork.filePath ? `تم اختيار: ${draftWork.filePath}` : 'اضغط لاختيار صورة أو فيديو من جهازك'}</b><small className="text-slate-500">JPG · PNG · WebP · MP4 · WebM</small></>}</label>
          {previewSource && <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/60"><div className="flex items-center justify-between gap-3 p-3"><b className="truncate text-sm">{localPreview ? localFileName : selectedRepositoryMedia?.name}</b><span className={`shrink-0 text-xs ${uploading?'text-amber-200':'text-emerald-300'}`}>{uploading?'جارٍ الرفع…':draftWork.filePath?'محدد من الملفات المرفوعة':'الملف محدد على جهازك'}</span></div>{previewIsVideo?<video src={previewSource} controls playsInline preload="metadata" className="max-h-72 w-full bg-black object-contain"/>:<img src={previewSource} alt="معاينة الملف المحدد" className="max-h-72 w-full object-contain"/>}</div>}
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="عنوان العمل" value={draftWork.title} onChange={value=>setDraftWork(current=>({...current,title:value}))}/><Field label="نوع العمل" value={draftWork.type} onChange={value=>setDraftWork(current=>({...current,type:value}))}/><label className="block text-sm font-bold text-slate-200">قسم المعرض<select value={isNewCategory?'__new__':draftWork.category} onChange={event=>{const value=event.target.value;setIsNewCategory(value==='__new__');setDraftWork(current=>({...current,category:value==='__new__'?'':value}));}} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"><option value="" disabled>اختر القسم الذي سيظهر فيه العمل</option>{portfolioCategories.map(category=><option key={category} value={category}>{category}</option>)}<option value="__new__">＋ إضافة قسم جديد</option></select></label>{isNewCategory&&<Field label="اسم القسم الجديد" value={draftWork.category} onChange={value=>setDraftWork(current=>({...current,category:value}))}/>}{draftWork.filePath && /\.(mp4|webm|mov)$/i.test(draftWork.filePath) && <Field label="مسار صورة الغلاف (اختياري)" value={draftWork.poster} onChange={value=>setDraftWork(current=>({...current,poster:value}))}/>}</div>
          {media.length===0 && <p className="mt-5 rounded-xl border border-white/5 bg-black/20 p-4 text-sm text-slate-500">لا توجد ملفات سابقة بعد. ارفع صورة أو مقطعًا وسيظهر هنا لاختياره لاحقًا.</p>}
          {media.length>0 && <div className="mt-5"><h3 className="mb-3 text-sm font-bold">الملفات المرفوعة إلى المعرض — اضغط لاختيار ملف</h3><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">{media.map(item=>{const isVideo=/\.(mp4|webm|mov)$/i.test(item.name);const isSelected=draftWork.filePath===item.path;return <button type="button" key={item.path} onClick={()=>{setDraftWork(current=>({...current,filePath:item.path,type:isVideo?'فيديو قصير':'تصميم إعلاني'}));if(localPreview)URL.revokeObjectURL(localPreview);setLocalPreview('');setLocalPreviewType('');setLocalFileName('');}} className={`overflow-hidden rounded-2xl border text-right transition ${isSelected?'border-indigo-300 bg-indigo-400/10 ring-2 ring-indigo-400/30':'border-white/10 bg-slate-950/50 hover:border-indigo-300/50'}`}><span className="grid aspect-video place-items-center overflow-hidden bg-slate-900">{isVideo?<span className="flex items-center gap-2 text-indigo-200"><FileVideo size={22}/>مقطع فيديو</span>:<img loading="lazy" src={item.downloadUrl} alt={item.name} className="h-full w-full object-cover"/>}</span><span className="block truncate px-3 py-2 text-xs">{item.name}</span><span className={`block px-3 pb-2 text-[11px] ${isSelected?'text-indigo-200':'text-slate-500'}`}>{isSelected?'محدد للاستخدام':'اختيار الملف'}</span></button>})}</div></div>}
          <button onClick={addWork} className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-black hover:bg-indigo-400">إضافة إلى المعرض</button></section>
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><h2 className="mb-4 text-xl font-black">الأعمال المعروضة ({content.portfolio.length})</h2><div className="grid gap-3 sm:grid-cols-2">{content.portfolio.map(item=><article key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/50 p-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-800 text-indigo-300">{item.mediaType==='video'?<FileVideo size={19}/>:<FileImage size={19}/>}</span><div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.title}</b><small className="text-slate-500">{item.category} · {item.type}</small></div><button onClick={()=>removeWork(item.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10" title="إزالة من المعرض"><Trash2 size={17}/></button></article>)}</div></section></div>}
      </>}
    </main>
  </div>;
}
