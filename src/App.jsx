import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ArrowUpRight, Check, Image, MessageCircle, Package, ShieldCheck, Sparkles, Video, X } from 'lucide-react';
import siteContent from './data/siteContent.json';
import AdminPortal from './components/AdminPortal';

const basePath = import.meta.env.BASE_URL;
const whatsappNumber = String(siteContent.brand.whatsappNumber || '').replace(/\D/g, '');
const currentYear = new Date().getFullYear();

function mediaUrl(path) {
  if (!path) return '';
  return /^https?:\/\//i.test(path) ? path : `${basePath}${path.replace(/^\//, '')}`;
}

function PortfolioVideo({ item }) {
  const videoRef = useRef(null);
  const [generatedPoster, setGeneratedPoster] = useState('');
  const src = mediaUrl(item.video || (item.image?.endsWith('.mp4') ? item.image : ''));

  useEffect(() => {
    const video = videoRef.current;
    if (!video || item.poster || !src) return undefined;
    let active = true;
    const createPreview = () => {
      if (!active || !video.videoWidth || !video.videoHeight) return;
      const canvas = document.createElement('canvas');
      const width = Math.min(video.videoWidth, 720);
      const height = Math.round(video.videoHeight * width / video.videoWidth);
      canvas.width = width;
      canvas.height = height;
      try {
        canvas.getContext('2d')?.drawImage(video, 0, 0, width, height);
        const preview = canvas.toDataURL('image/jpeg', 0.78);
        if (active) setGeneratedPoster(preview);
      } catch {
        // Cross-origin media may not allow a canvas preview; playback remains available.
      }
    };
    const seekToPreview = () => {
      if (!active || !Number.isFinite(video.duration) || video.duration <= 0 || !video.paused) return;
      video.currentTime = Math.min(0.15, video.duration / 2);
    };
    video.addEventListener('loadedmetadata', seekToPreview, { once: true });
    video.addEventListener('seeked', createPreview, { once: true });
    video.addEventListener('loadeddata', createPreview, { once: true });
    if (video.readyState >= 1) seekToPreview();
    return () => {
      active = false;
      video.removeEventListener('loadedmetadata', seekToPreview);
      video.removeEventListener('seeked', createPreview);
      video.removeEventListener('loadeddata', createPreview);
    };
  }, [item.poster, src]);

  return <video ref={videoRef} controls playsInline preload="metadata" poster={item.poster ? mediaUrl(item.poster) : generatedPoster || undefined} className="h-full w-full object-cover" src={src}/>;
}

function makeOrderNumber() {
  const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Riyadh', year: '2-digit', month: '2-digit', day: '2-digit' }).format(new Date()).replaceAll('-', '');
  return `WS-${date}-${Math.floor(1000 + Math.random() * 9000)}`;
}

export default function App() {
  const [adminRoute, setAdminRoute] = useState(() => window.location.hash === '#admin');
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [form, setForm] = useState({ name: '', store: '', phone: '' });
  const categories = useMemo(() => ['الكل', ...new Set(siteContent.portfolio.map(item => item.category))], []);
  const [category, setCategory] = useState('الكل');
  const works = category === 'الكل' ? siteContent.portfolio : siteContent.portfolio.filter(item => item.category === category);

  useEffect(() => {
    const syncRoute = () => setAdminRoute(window.location.hash === '#admin');
    window.addEventListener('hashchange', syncRoute);
    return () => window.removeEventListener('hashchange', syncRoute);
  }, []);

  if (adminRoute) return <AdminPortal onBack={() => { window.location.hash = 'top'; setAdminRoute(false); }}/>

  const sendOrderToWhatsApp = (event) => {
    event.preventDefault();
    if (!selectedPackage || !form.name.trim() || !form.store.trim() || !form.phone.trim()) return;
    const request = { ...form, number: makeOrderNumber(), package: selectedPackage };
    window.location.assign(whatsappLink(request));
  };

  const whatsappLink = (request) => {
    const packageDetails = [
      `الباقة: ${request.package.name}`,
      `السعر: ${request.package.price} ر.س (${request.package.period})`,
      `وصف الباقة: ${request.package.subtitle}`,
      'محتوى الباقة:',
      ...request.package.features.map(feature => `• ${feature}`),
      ...(request.package.terms ? [`ملاحظة: ${request.package.terms}`] : [])
    ].join('\n');
    const message = `السلام عليكم، أرغب بطلب باقة من ${siteContent.brand.name}.\n\nرقم الطلب: ${request.number}\nالاسم: ${request.name}\nاسم النشاط: ${request.store}\nرقم الجوال: ${request.phone}\n\n${packageDetails}\n\nأرجو التواصل معي لاستكمال الطلب.`;
    return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#080d18] text-slate-100">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#080d18]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <a href="#top" className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-xl font-black shadow-lg shadow-indigo-950">و</span>
            <span className="min-w-0"><b className="block truncate text-base sm:text-lg">{siteContent.brand.name}</b><small className="hidden max-w-[260px] truncate text-xs text-slate-400 sm:block">{siteContent.brand.slogan}</small></span>
          </a>
          <nav className="hidden items-center gap-6 text-sm text-slate-300 md:flex">
            <a className="hover:text-white" href="#about">عن وصلني</a><a className="hover:text-white" href="#packages">الباقات</a><a className="hover:text-white" href="#works">معرض الأعمال</a><a className="hover:text-white" href="#steps">طريقة الطلب</a>
          </nav>
          <a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-3 py-2 text-sm font-bold text-slate-950 hover:bg-emerald-400"><MessageCircle size={17}/> تواصل</a>
        </div>
      </header>

      <main id="top">
        <section className="relative overflow-hidden border-b border-white/5">
          <div className="pointer-events-none absolute -right-24 top-0 h-80 w-80 rounded-full bg-indigo-600/20 blur-[100px]"/><div className="pointer-events-none absolute -left-20 bottom-0 h-72 w-72 rounded-full bg-fuchsia-600/10 blur-[100px]"/>
          <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 md:grid-cols-[1.2fr_.8fr] md:py-28">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-400/20 bg-indigo-400/10 px-3 py-1.5 text-xs font-semibold text-indigo-200"><Sparkles size={14}/> محتوى وإعلانات لمشروعك</span>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl md:text-6xl">نرتقي بهويتك الإعلانية، <span className="bg-gradient-to-l from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text text-transparent">ونصنع لمتجرك حضورًا يليق به.</span></h1>
              <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300 sm:text-lg">{siteContent.brand.description} اختر الخدمة المناسبة، أرسل طلبك للموظف عبر واتساب، واتفق معه على التفاصيل.</p>
              <div className="mt-8 flex flex-wrap gap-3"><a href="#packages" className="inline-flex items-center gap-2 rounded-2xl bg-indigo-500 px-6 py-3.5 font-bold text-white shadow-xl shadow-indigo-950 hover:bg-indigo-400">استعرض الباقات <ArrowDown size={18}/></a><a href="#works" className="rounded-2xl border border-white/15 px-6 py-3.5 font-bold text-slate-200 hover:bg-white/5">شاهد أعمالنا</a></div>
              <div className="mt-9 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400"><span>✓ أسعار واضحة</span><span>✓ تواصل مباشر</span><span>✓ بدون إنشاء حساب</span></div>
            </div>
            <div className="relative mx-auto w-full max-w-md">
              <div className="absolute -inset-5 rounded-[2.5rem] bg-gradient-to-br from-indigo-500/20 to-fuchsia-500/10 blur-2xl"/>
              <div className="relative rounded-[2rem] border border-white/10 bg-slate-900/80 p-5 shadow-2xl backdrop-blur">
                <div className="flex items-center justify-between border-b border-white/10 pb-4"><div><small className="text-slate-400">رحلتك مع وصلني</small><h2 className="mt-1 font-black">من الاختيار إلى التنفيذ</h2></div><span className="rounded-xl bg-emerald-400/10 p-3 text-emerald-300"><MessageCircle/></span></div>
                {[['01','اختر الباقة','استعرض الخدمة والسعر'],['02','أرسل التفاصيل','املأ بيانات مشروعك باختصار'],['03','تواصل واتفق','أرسلها للموظف عبر واتساب']].map(([n,title,desc])=><div key={n} className="flex gap-4 border-b border-white/5 py-4 last:border-0"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-indigo-500/15 font-mono text-sm font-black text-indigo-300">{n}</span><div><b>{title}</b><p className="mt-1 text-sm text-slate-400">{desc}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="relative overflow-hidden border-b border-white/5 bg-slate-900/25 py-16 sm:py-20">
          <div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[100px]"/>
          <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
            <div className="mx-auto mb-10 max-w-3xl text-center"><span className="inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/5 px-3 py-1.5 text-xs font-bold text-cyan-200"><Sparkles size={14}/> وصلني الرقمي | Waslni</span><h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">حلول متكاملة لحضور رقمي أقوى</h2><p className="mt-4 text-base leading-8 text-slate-300 sm:text-lg">{siteContent.brand.description}</p></div>
            <div className="grid gap-5 lg:grid-cols-2">
              <article className="rounded-3xl border border-indigo-300/15 bg-gradient-to-br from-indigo-950/45 to-slate-900/80 p-6 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-indigo-400/10 text-indigo-200"><Image size={23}/></span><h3 className="mt-5 text-xl font-black">صناعة المحتوى والهوية</h3><p className="mt-3 leading-8 text-slate-300">{siteContent.about.creativeServices}</p></article>
              <article className="rounded-3xl border border-cyan-300/15 bg-gradient-to-br from-cyan-950/35 to-slate-900/80 p-6 sm:p-8"><span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400/10 text-cyan-200"><MessageCircle size={23}/></span><h3 className="mt-5 text-xl font-black">إدارة حسابات التواصل</h3><p className="mt-3 leading-8 text-slate-300">{siteContent.about.accountManagement}</p></article>
            </div>
            <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/70 p-6 sm:p-8"><p className="text-lg font-bold leading-8 text-white">{siteContent.about.goal}</p><p className="mt-2 leading-7 text-slate-400">{siteContent.about.flexibleServices}</p><div className="mt-6 border-t border-white/10 pt-5 text-center text-xl font-black text-transparent bg-gradient-to-l from-cyan-300 via-indigo-300 to-fuchsia-300 bg-clip-text sm:text-2xl">{siteContent.about.closing}</div></div>
          </div>
        </section>

        <section id="packages" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto mb-10 max-w-2xl text-center"><span className="text-sm font-bold text-indigo-300">باقات وصلني</span><h2 className="mt-2 text-3xl font-black sm:text-4xl">اختر الأنسب لمشروعك</h2><p className="mt-3 text-slate-400">تفاصيل واضحة وسعر معروف قبل التواصل.</p></div>
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {siteContent.packages.map((pkg) => <article key={pkg.id} className={`relative flex flex-col rounded-3xl border p-5 transition hover:-translate-y-1 hover:border-indigo-400/50 ${pkg.popular ? 'border-indigo-400/50 bg-gradient-to-b from-indigo-950/80 to-slate-900/80 shadow-xl shadow-indigo-950/30' : 'border-white/10 bg-slate-900/60'}`}>
              {pkg.badge && <span className="absolute left-4 top-4 rounded-full bg-indigo-400/10 px-2.5 py-1 text-[11px] font-bold text-indigo-200">{pkg.badge}</span>}
              <Package className="mb-4 text-indigo-300"/><h3 className="min-h-14 max-w-[80%] text-lg font-black">{pkg.name}</h3><p className="mt-2 min-h-12 text-sm leading-6 text-slate-400">{pkg.subtitle}</p>
              <div className="my-5 border-y border-white/10 py-4"><b className="text-3xl font-black text-white">{pkg.price}</b><span className="mr-2 text-sm text-slate-400">ر.س · {pkg.period}</span></div>
              <ul className="mb-5 flex-1 space-y-3">{pkg.features.map((feature) => <li key={feature} className="flex gap-2 text-sm text-slate-300"><Check size={17} className="shrink-0 text-emerald-400"/>{feature}</li>)}</ul>
              {pkg.terms && <p className="mb-5 rounded-xl bg-amber-400/5 p-3 text-xs leading-5 text-amber-100/80">تنويه: {pkg.terms}</p>}
              <button onClick={() => setSelectedPackage(pkg)} className="w-full rounded-xl bg-white px-4 py-3 font-black text-slate-950 transition hover:bg-indigo-100">اختر هذه الباقة <ArrowUpRight className="mr-1 inline" size={17}/></button>
            </article>)}
          </div>
        </section>

        <section id="works" className="border-y border-white/5 bg-slate-900/30 py-16 sm:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6"><div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><span className="text-sm font-bold text-cyan-300">معرض الأعمال</span><h2 className="mt-2 text-3xl font-black">نماذج من تنفيذنا</h2><p className="mt-2 text-sm text-slate-400">تصاميم ومقاطع تسويقية صنعت لتبرز العلامات التجارية.</p></div></div>
            <div className="mb-6 flex gap-2 overflow-x-auto pb-2">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`shrink-0 rounded-full border px-4 py-2 text-sm ${category === item ? 'border-indigo-400 bg-indigo-500 text-white' : 'border-white/10 bg-slate-900 text-slate-300'}`}>{item}</button>)}</div>
            <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">{works.map(item => <article key={item.id} className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-lg shadow-black/10"><div className={`relative bg-slate-800 ${item.mediaType === 'video' ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>{item.mediaType === 'video' ? <PortfolioVideo item={item}/>:<img loading="lazy" src={mediaUrl(item.image)} alt={item.title} className="h-full w-full object-cover"/>}{item.mediaType === 'video' && <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-white"><Video size={14}/></span>}</div><div className="p-3 sm:p-4"><span className="block truncate text-[10px] font-bold text-indigo-300 sm:text-xs">{item.category} · {item.type}</span><h3 className="mt-1 line-clamp-2 text-sm font-bold leading-6 sm:text-base">{item.title}</h3></div></article>)}</div>
          </div>
        </section>

        <section id="steps" className="mx-auto max-w-7xl px-4 py-16 sm:px-6"><div className="rounded-[2rem] border border-white/10 bg-gradient-to-l from-indigo-950/60 via-slate-900 to-slate-900 p-6 sm:p-10"><div className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center"><div><span className="text-sm font-bold text-indigo-300">طريقة الطلب</span><h2 className="mt-2 text-3xl font-black">طلبك يبدأ برسالة</h2><p className="mt-3 max-w-2xl leading-7 text-slate-300">اختر الباقة، أدخل اسمك واسم نشاطك ورقم جوالك، ثم راجع رسالة واتساب التي تتضمن تفاصيل الباقة كاملة وأرسلها لنا مباشرة.</p></div><a href={`https://wa.me/${whatsappNumber}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 font-black text-slate-950 hover:bg-emerald-400"><MessageCircle/> واتساب الموظف</a></div><div className="mt-5 flex items-start gap-3 rounded-xl bg-black/20 p-4 text-sm text-slate-400"><ShieldCheck size={18} className="mt-0.5 shrink-0 text-emerald-300"/>لا يتطلب الموقع حسابًا. راجع بياناتك ومحتوى الباقة في واتساب، ثم اضغط إرسال.</div></div></section>
      </main>

      <footer className="border-t border-white/10 bg-[#060a12]">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-4 py-8 sm:px-6 md:flex-row md:items-center md:justify-between"><div><b className="text-lg">{siteContent.brand.name} | Waslni</b><p className="mt-1 text-sm text-slate-500">{siteContent.brand.slogan}</p></div><a href="#admin" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"><Image size={16}/> دخول المدير <ArrowUpRight size={14}/></a><span className="text-xs text-slate-600">© {currentYear} وصلني</span></div>
      </footer>

      {selectedPackage && <div className="fixed inset-0 z-50 grid place-items-end bg-black/75 p-0 backdrop-blur-sm sm:place-items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedPackage(null); }}>
        <section className="max-h-[94dvh] w-full max-w-xl overflow-y-auto rounded-t-3xl border border-white/10 bg-[#101827] p-5 shadow-2xl sm:rounded-3xl sm:p-7">
          <div className="mb-5 flex items-start justify-between"><div><span className="text-xs font-bold text-indigo-300">طلبك عبر واتساب</span><h2 className="mt-1 text-xl font-black">{selectedPackage.name}</h2></div><button onClick={() => setSelectedPackage(null)} aria-label="إغلاق" className="rounded-lg p-2 text-slate-400 hover:bg-white/5 hover:text-white"><X/></button></div>
          <form onSubmit={sendOrderToWhatsApp} className="space-y-4"><div className="rounded-xl bg-indigo-500/10 p-4"><div className="flex items-center justify-between"><span className="text-sm text-slate-300">قيمة الباقة</span><b className="text-2xl">{selectedPackage.price} ر.س</b></div><p className="mt-1 text-xs text-slate-400">{selectedPackage.period}</p><p className="mt-2 text-sm leading-6 text-slate-300">{selectedPackage.subtitle}</p></div>
            {[['name','اسمك الكامل','text','مثال: محمد أحمد'],['store','اسم المحل أو المشروع','text','اسم النشاط التجاري'],['phone','رقم جوالك للتواصل','tel','05xxxxxxxx']].map(([key,label,type,placeholder])=><label key={key} className="block text-sm font-bold text-slate-200">{label}<input required type={type} autoComplete={key === 'phone' ? 'tel' : 'name'} value={form[key]} onChange={event=>setForm({...form,[key]:event.target.value})} placeholder={placeholder} className="mt-2 w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-base font-normal text-white outline-none focus:border-indigo-400"/></label>)}
            <div className="rounded-xl border border-white/5 bg-black/20 p-4"><b className="text-sm text-slate-200">محتوى الباقة</b><ul className="mt-3 space-y-2">{selectedPackage.features.map(feature=><li key={feature} className="flex gap-2 text-sm leading-6 text-slate-300"><Check size={16} className="mt-1 shrink-0 text-emerald-400"/>{feature}</li>)}</ul></div>
            <button className="w-full rounded-xl bg-emerald-500 px-4 py-3.5 font-black text-slate-950 hover:bg-emerald-400"><MessageCircle className="ml-2 inline"/>إرسال تفاصيل الباقة إلى واتساب</button><p className="text-center text-xs text-slate-500">ستفتح محادثة واتساب مع رقم وصلني برسالة جاهزة. اضغط إرسال داخل واتساب لإتمام الطلب.</p>
          </form>
        </section>
      </div>}
    </div>
  );
}
