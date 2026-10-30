import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, CloudUpload, ExternalLink, FileImage, FileVideo, LogOut, Package, Save, ShieldCheck, Store, Trash2 } from 'lucide-react';
import initialContent from '../data/siteContent.json';
import { githubAdminSession, getRepositoryJson, listRepositoryMedia, saveRepositoryJson, uploadRepositoryMedia, verifyGithubAdminToken } from '../services/githubContentService';

const CONTENT_PATH = 'src/data/siteContent.json';
const MAX_UPLOAD_SIZE = 50 * 1024 * 1024;

function Field({ label, value, onChange, type = 'text', ...props }) {
  return <label className="block text-sm font-bold text-slate-200">{label}<input {...props} type={type} value={value ?? ''} onChange={event => onChange(event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3.5 py-3 text-sm font-normal text-white outline-none transition focus:border-indigo-400"/></label>;
}

export default function AdminPortal({ onBack }) {
  const [token, setToken] = useState(() => githubAdminSession.read());
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
  const [draftWork, setDraftWork] = useState({ title: '', category: 'تصميم إعلاني', type: 'تصميم إعلاني', filePath: '', poster: '' });

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
    if (!token) return;
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

  const login = async (event) => {
    event.preventDefault();
    setError(''); setStatus(''); setLoading(true);
    const enteredToken = token.trim();
    try {
      await loadDashboard(enteredToken);
      githubAdminSession.write(enteredToken);
      setToken(enteredToken);
      setStatus('تم التحقق من صلاحية حسابك.');
    } catch (loginError) {
      setAdmin(null);
      setError(loginError.message || 'تعذر تسجيل الدخول إلى GitHub.');
    } finally { setLoading(false); }
  };

  const logout = () => {
    githubAdminSession.clear(); setToken(''); setAdmin(null); setContent(initialContent); setContentSha(''); setMedia([]); setStatus('تم تسجيل الخروج.'); setError('');
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
    setError(''); setStatus(''); setUploading(true);
    try {
      const path = await uploadRepositoryMedia(file, token);
      const repoMedia = await listRepositoryMedia(token);
      setMedia(repoMedia);
      setDraftWork(current => ({ ...current, filePath: path, type: file.type.startsWith('video/') ? 'فيديو قصير' : current.type }));
      setStatus('رُفع الملف إلى GitHub. أضف عنوانه ثم اضغط «إضافة إلى المعرض» ليظهر بعد النشر.');
    } catch (uploadError) { setError(uploadError.message || 'تعذر رفع الملف إلى GitHub.'); }
    finally { setUploading(false); }
  };

  const addWork = () => {
    if (!draftWork.title.trim() || !draftWork.filePath) { setError('أدخل عنوان العمل وارفع ملفه أولًا.'); return; }
    const video = /\.(mp4|webm|mov)$/i.test(draftWork.filePath);
    const work = {
      id: `work_${Date.now()}`,
      category: draftWork.category,
      title: draftWork.title.trim(),
      type: draftWork.type.trim() || (video ? 'فيديو قصير' : 'تصميم إعلاني'),
      ...(video ? { mediaType: 'video', video: draftWork.filePath, image: '', ...(draftWork.poster ? { poster: draftWork.poster } : {}) } : { image: draftWork.filePath })
    };
    setContent(current => ({ ...current, portfolio: [work, ...current.portfolio] }));
    setDraftWork({ title: '', category: 'تصميم إعلاني', type: 'تصميم إعلاني', filePath: '', poster: '' });
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
      {!admin ? <div className="mx-auto max-w-xl overflow-hidden rounded-3xl border border-white/10 bg-slate-900/70 shadow-2xl shadow-black/20"><div className="bg-gradient-to-l from-indigo-600/20 to-violet-600/5 p-6 sm:p-8"><span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl border border-indigo-300/20 bg-indigo-400/10 text-indigo-200"><ShieldCheck size={28}/></span><h1 className="text-2xl font-black">دخول المدير عبر GitHub</h1><p className="mt-2 leading-7 text-slate-300">استخدم رمز وصول محدودًا لهذا المستودع. لا تدخل كلمة مرور GitHub هنا.</p></div>
        {(error || status) && <div role="status" className={`mx-6 mt-6 rounded-xl border p-4 text-sm leading-6 sm:mx-8 ${error ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>{error || status}</div>}
        <form onSubmit={login} className="space-y-4 p-6 sm:p-8"><label className="block text-sm font-bold">Fine-grained personal access token<input required type="password" autoComplete="off" value={token} onChange={event => setToken(event.target.value)} placeholder="github_pat_…" dir="ltr" className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-left font-mono text-sm text-white outline-none focus:border-indigo-400"/></label>
          <button disabled={loading} className="w-full rounded-xl bg-indigo-500 px-4 py-3.5 font-black hover:bg-indigo-400 disabled:opacity-60">{loading ? 'جارٍ التحقق…' : 'دخول لوحة الإدارة'}</button>
          <div className="rounded-xl border border-white/5 bg-black/20 p-4 text-sm leading-6 text-slate-400"><b className="text-slate-200">إعداد الرمز لأول مرة:</b><ol className="mr-5 mt-2 list-decimal space-y-1"><li>GitHub → Settings → Developer settings → Fine-grained tokens.</li><li>Generate new token، واختر المستودع <span dir="ltr">waslni/waslni</span> فقط.</li><li>اجعل Contents على Read and write، ولا تختر صلاحيات أخرى.</li><li>انسخ الرمز والصقه هنا. يحفظه المتصفح مؤقتًا حتى تسجل الخروج أو تغلق الجلسة.</li></ol></div>
          <a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-sm font-bold text-indigo-300 hover:text-indigo-200">إنشاء رمز GitHub المحدود <ExternalLink size={14}/></a>
        </form>
      </div> : <>
        <div className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-emerald-300/10 bg-gradient-to-l from-emerald-400/10 via-slate-900/80 to-indigo-500/10 p-5 sm:flex-row sm:items-center sm:p-7"><div><span className="inline-flex items-center gap-2 text-sm font-bold text-emerald-200"><Check size={16}/> تم التحقق من وصول الكتابة للمستودع</span><h1 className="mt-2 text-2xl font-black sm:text-3xl">مرحبًا {admin.login}</h1><p className="mt-2 text-sm text-slate-400">تعديلاتك تُحفظ كـ commit على GitHub ثم ينشرها Actions إلى الموقع.</p></div><button onClick={saveAll} disabled={loading || uploading} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3 font-black text-slate-950 hover:bg-emerald-300 disabled:opacity-60"><Save size={18}/>{loading ? 'جارٍ الحفظ…' : 'حفظ ونشر التعديلات'}</button></div>

        {(error || status) && <div role="status" className={`mb-6 rounded-xl border p-4 text-sm leading-6 ${error ? 'border-rose-400/20 bg-rose-400/10 text-rose-200' : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100'}`}>{error || status}</div>}
        <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-slate-900/70 p-2">{[['packages','الباقات',Package],['works','معرض الأعمال',FileImage],['settings','بيانات الموقع',Store]].map(([id,label,Icon])=><button key={id} onClick={()=>setActiveTab(id)} className={`flex items-center justify-center gap-2 rounded-xl px-2 py-3 text-xs font-bold sm:text-sm ${activeTab===id?'bg-indigo-500 text-white':'text-slate-400 hover:bg-white/5 hover:text-white'}`}><Icon size={16}/>{label}</button>)}</div>

        {activeTab === 'settings' && <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><h2 className="mb-2 text-xl font-black">بيانات الموقع</h2><p className="mb-6 text-sm text-slate-400">عدّل التعريف الذي يظهر للزائر في الصفحة الرئيسية.</p><div className="grid gap-5 sm:grid-cols-2"><Field label="اسم المنصة" value={content.brand.name} onChange={value=>updateBrand('name',value)}/><Field label="الشعار المختصر" value={content.brand.slogan} onChange={value=>updateBrand('slogan',value)}/><Field label="رقم واتساب الموظف بصيغة دولية" dir="ltr" value={content.brand.whatsappNumber} onChange={value=>updateBrand('whatsappNumber',value.replace(/\D/g,''))}/><Field label="اسم جهة التواصل" value={content.brand.employeeNumberLabel} onChange={value=>updateBrand('employeeNumberLabel',value)}/><label className="block text-sm font-bold sm:col-span-2">وصف الموقع<textarea rows={3} value={content.brand.description} onChange={event=>updateBrand('description',event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"/></label>{[['creativeServices','صناعة المحتوى والهوية'],['accountManagement','إدارة حسابات التواصل'],['goal','هدف وصلني'],['flexibleServices','الباقات والخدمات'],['closing','العبارة الختامية']].map(([key,label])=><label key={key} className="block text-sm font-bold sm:col-span-2">{label}<textarea rows={key==='creativeServices'||key==='accountManagement'?4:2} value={content.about?.[key] || ''} onChange={event=>updateAbout(key,event.target.value)} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"/></label>)}</div></section>}

        {activeTab === 'packages' && <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><div><h2 className="text-xl font-black">تعديل الباقات</h2><p className="mt-1 text-sm text-slate-400">غيّر السعر والوصف والمزايا، ثم اضغط حفظ ونشر.</p></div><select value={selectedPackageId} onChange={event=>setSelectedPackageId(event.target.value)} className="rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white">{content.packages.map(item=><option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
          {selectedPackage && <div className="grid gap-5 sm:grid-cols-2"><Field label="اسم الباقة" value={selectedPackage.name} onChange={value=>updatePackage('name',value)}/><Field label="السعر بالريال" type="number" min="0" value={selectedPackage.price} onChange={value=>updatePackage('price',value)}/><Field label="وصف مختصر" value={selectedPackage.subtitle} onChange={value=>updatePackage('subtitle',value)}/><Field label="فترة/وحدة السعر" value={selectedPackage.period} onChange={value=>updatePackage('period',value)}/><Field label="الشارة" value={selectedPackage.badge} onChange={value=>updatePackage('badge',value)}/><label className="block text-sm font-bold sm:col-span-2">المزايا (ميزة واحدة في كل سطر)<textarea rows={6} value={selectedPackage.features.join('\n')} onChange={event=>updatePackage('features',event.target.value.split('\n'))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-sm font-normal text-white outline-none focus:border-indigo-400"/></label><Field label="تنويه أو شروط" value={selectedPackage.terms} onChange={value=>updatePackage('terms',value)}/></div>}</section>}

        {activeTab === 'works' && <div className="space-y-6"><section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><h2 className="text-xl font-black">رفع صورة أو مقطع وإضافته للمعرض</h2><p className="mt-2 text-sm leading-6 text-slate-400">يُرفع الملف إلى مستودع GitHub ويظهر في الموقع بعد حفظ المحتوى وانتهاء البناء. الحد الأقصى 50 ميجابايت للملف.</p><label className="mt-5 flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-indigo-300/30 bg-indigo-400/5 p-5 text-center hover:bg-indigo-400/10"><input type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" onChange={uploadMedia} disabled={uploading} className="sr-only"/>{uploading?<span className="animate-pulse text-indigo-200">جارٍ رفع الملف إلى GitHub…</span>:<><CloudUpload size={28} className="text-indigo-300"/><b>{draftWork.filePath ? `تم اختيار: ${draftWork.filePath}` : 'اضغط لاختيار صورة أو فيديو من جهازك'}</b><small className="text-slate-500">JPG · PNG · WebP · MP4 · WebM</small></>}</label>
          <div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="عنوان العمل" value={draftWork.title} onChange={value=>setDraftWork(current=>({...current,title:value}))}/><Field label="نوع العمل" value={draftWork.type} onChange={value=>setDraftWork(current=>({...current,type:value}))}/><Field label="التصنيف" value={draftWork.category} onChange={value=>setDraftWork(current=>({...current,category:value}))}/>{draftWork.filePath && /\.(mp4|webm|mov)$/i.test(draftWork.filePath) && <Field label="مسار صورة الغلاف (اختياري)" value={draftWork.poster} onChange={value=>setDraftWork(current=>({...current,poster:value}))}/>}</div>
          {media.length>0 && <div className="mt-5"><label className="text-sm font-bold">أو اختر ملفًا رفعته سابقًا<select value={draftWork.filePath} onChange={event=>setDraftWork(current=>({...current,filePath:event.target.value}))} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-3 text-sm text-white"><option value="">اختر من الملفات</option>{media.map(item=><option key={item.path} value={item.path}>{item.name}</option>)}</select></label></div>}
          <button onClick={addWork} className="mt-5 w-full rounded-xl bg-indigo-500 px-4 py-3 font-black hover:bg-indigo-400">إضافة إلى المعرض</button></section>
          <section className="rounded-3xl border border-white/10 bg-slate-900/60 p-5 sm:p-7"><h2 className="mb-4 text-xl font-black">الأعمال المعروضة ({content.portfolio.length})</h2><div className="grid gap-3 sm:grid-cols-2">{content.portfolio.map(item=><article key={item.id} className="flex items-center gap-3 rounded-2xl border border-white/5 bg-slate-950/50 p-3"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-slate-800 text-indigo-300">{item.mediaType==='video'?<FileVideo size={19}/>:<FileImage size={19}/>}</span><div className="min-w-0 flex-1"><b className="block truncate text-sm">{item.title}</b><small className="text-slate-500">{item.category} · {item.type}</small></div><button onClick={()=>removeWork(item.id)} className="rounded-lg p-2 text-rose-300 hover:bg-rose-400/10" title="إزالة من المعرض"><Trash2 size={17}/></button></article>)}</div></section></div>}
      </>}
    </main>
  </div>;
}
