"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";

const GAMES=[{id:"RASCA_Y_GANA",label:"Rasca y Gana",emoji:"🎫",desc:"Tarjeta táctil"},{id:"SLOTS",label:"Tragamonedas",emoji:"🎰",desc:"Tres rodillos"}];
const STEPS=["Mecánica","Branding","Premios","Email","Upseller"];

export default function EditCampaignPage() {
  const router = useRouter();
  const { id } = useParams();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [form, setForm] = useState<any>(null);

  useEffect(() => {
    fetch(`/api/campaigns/${id}`)
      .then(r => r.json())
      .then(data => {
        setForm({
          name: data.name || "",
          gameType: data.gameType || "RASCA_Y_GANA",
          attemptsPerSession: data.attemptsPerSession || 1,
          participationLimit: data.participationLimit || "once_email",
          logoUrl: data.logoUrl || "",
          primaryColor: data.primaryColor || "#7C3AED",
          secondaryColor: data.secondaryColor || "#A78BFA",
          backgroundColor: data.backgroundColor || "#1a1a2e",
          language: data.language || "es",
          ageGate: data.ageGate || false,
          startDate: data.startDate ? data.startDate.split("T")[0] : "",
          endDate: data.endDate ? data.endDate.split("T")[0] : "",
          upsellEnabled: data.upsellEnabled || false,
          upsellTitle: data.upsellTitle || "",
          upsellPrice: data.upsellPrice || 0,
          upsellCurrency: data.upsellCurrency || "ARS",
          upsellLink: data.upsellLink || "",
          upsellImageUrl: data.upsellImageUrl || "",
          closedBehavior: data.closedBehavior || "LEAD_MAGNET",
          status: data.status || "ACTIVE",
          prizes: data.prizes?.length > 0 ? data.prizes.map((p: any) => ({
            id: p.id,
            title: p.title || "",
            stock: p.stock || 10,
            priority: p.priority || 5,
            frequency: p.frequency || 50,
            validDays: p.validDays || 30,
            prizeImage: p.prizeImage || "",
          })) : [{title:"",stock:10,priority:5,frequency:50,validDays:30}],
          consolePrize: {
            title: data.consolePrize?.title || "",
            couponCode: data.consolePrize?.couponCode || "",
          },
          emailWinner: {
            subject: data.emailTemplates?.find((t:any)=>t.type==="WINNER")?.subject || "🎉 ¡Ganaste un premio!",
            bodyHtml: data.emailTemplates?.find((t:any)=>t.type==="WINNER")?.bodyHtml || "",
          },
          emailConsole: {
            subject: data.emailTemplates?.find((t:any)=>t.type==="CONSOLE")?.subject || "Tu regalo te espera 🎁",
            bodyHtml: data.emailTemplates?.find((t:any)=>t.type==="CONSOLE")?.bodyHtml || "",
          },
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [id]);

  const upd = (d: any) => setForm((p: any) => ({ ...p, ...d }));

  async function handleSave() {
    setSaving(true);
    try {
      await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          gameType: form.gameType,
          attemptsPerSession: form.attemptsPerSession,
          participationLimit: form.participationLimit,
          logoUrl: form.logoUrl || null,
          primaryColor: form.primaryColor,
          secondaryColor: form.secondaryColor,
          backgroundColor: form.backgroundColor,
          language: form.language,
          ageGate: form.ageGate,
          startDate: form.startDate ? new Date(form.startDate) : null,
          endDate: form.endDate ? new Date(form.endDate) : null,
          upsellEnabled: form.upsellEnabled,
          upsellTitle: form.upsellTitle || null,
          upsellPrice: form.upsellPrice || null,
          upsellCurrency: form.upsellCurrency,
          upsellLink: form.upsellLink || null,
          upsellImageUrl: form.upsellImageUrl || null,
          closedBehavior: form.closedBehavior,
          closedRedirectUrl: form.closedRedirectUrl || null,
          status: form.status,
        }),
      });
      for (const p of form.prizes.filter((p: any) => p.title.trim())) {
        if (p.id) {
          await fetch(`/api/campaigns/${id}/prizes/${p.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: p.title, stock: p.stock, priority: p.priority, frequency: p.frequency, validDays: p.validDays, prizeImage: p.prizeImage || null }),
          });
        } else {
          await fetch(`/api/campaigns/${id}/prizes`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title: p.title, stock: p.stock, priority: p.priority, frequency: p.frequency, validDays: p.validDays }),
          });
        }
      }
      if (form.consolePrize.title) {
        await fetch(`/api/campaigns/${id}/console-prize`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form.consolePrize),
        });
      }
      await fetch(`/api/campaigns/${id}/email-templates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify([
          { type: "WINNER", ...form.emailWinner },
          { type: "CONSOLE", ...form.emailConsole },
        ]),
      });
      router.push("/campaigns");
    } catch (e) {
      console.error(e);
    }
    setSaving(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await fetch(`/api/campaigns/${id}`, { method: "DELETE" });
      router.push("/campaigns");
    } catch (e) {
      console.error(e);
      setDeleting(false);
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-white/40">Cargando campaña...</p>
    </div>
  );

  if (!form) return (
    <div className="flex items-center justify-center py-32">
      <p className="text-white/40">Campaña no encontrada</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/campaigns" className="text-white/40 hover:text-white transition-colors">← Volver</Link>
          <h1 className="text-white text-2xl font-bold">Editar campaña</h1>
        </div>
        <div className="flex items-center gap-2">
          <select value={form.status} onChange={e=>upd({status:e.target.value})} className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none">
            <option value="ACTIVE">🟢 Activa</option>
            <option value="PAUSED">🟡 Pausada</option>
            <option value="FINISHED">🔴 Finalizada</option>
          </select>
          <button onClick={()=>setShowDeleteConfirm(true)} className="text-xs text-red-400 hover:text-red-300 bg-red-500/10 px-3 py-2 rounded-xl transition-colors">🗑️ Eliminar</button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s,i)=>(
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold cursor-pointer ${i+1<step?"bg-violet-600 text-white":i+1===step?"bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-2 ring-offset-gray-950":"bg-white/10 text-white/40"}`} onClick={()=>setStep(i+1)}>{i+1<step?"✓":i+1}</div>
            <span className={`text-xs hidden sm:block cursor-pointer ${i+1===step?"text-white font-medium":"text-white/40"}`} onClick={()=>setStep(i+1)}>{s}</span>
            {i<STEPS.length-1&&<div className={`flex-1 h-0.5 ${i+1<step?"bg-violet-600":"bg-white/10"}`}/>}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 min-h-64">
        {step===1&&<div className="space-y-5">
          <div><label className="text-white font-medium block mb-2">Nombre *</label><input value={form.name} onChange={e=>upd({name:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500" placeholder="Nombre de la campaña"/></div>
          <div><label className="text-white font-medium block mb-3">Tipo de juego</label><div className="space-y-2">{GAMES.map(g=><button key={g.id} type="button" onClick={()=>upd({gameType:g.id})} className={`w-full text-left p-4 rounded-xl border transition-all ${form.gameType===g.id?"bg-violet-600/20 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/70"}`}><span className="text-xl mr-3">{g.emoji}</span><span className="font-medium">{g.label}</span><span className="text-sm opacity-60 ml-2">{g.desc}</span></button>)}</div></div>
          <div><label className="text-white font-medium block mb-3">Intentos por sesión</label><div className="flex gap-3">{[1,3,5].map(n=><button key={n} type="button" onClick={()=>upd({attemptsPerSession:n})} className={`flex-1 py-3 rounded-xl font-bold text-lg border transition-all ${form.attemptsPerSession===n?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/60"}`}>{n}</button>)}</div></div>
          <div><label className="text-white font-medium block mb-3">¿Cuántas veces puede participar cada persona?</label><div className="space-y-2">{[{v:"once_email",l:"Una vez por email",sub:"Cada email participa una sola vez"},{v:"once_daily",l:"Una vez por día",sub:"Mismo email puede volver al día siguiente"},{v:"unlimited",l:"Sin límite",sub:"El mismo email puede participar cuando quiera"}].map(o=><button key={o.v} type="button" onClick={()=>upd({participationLimit:o.v})} className={`w-full text-left p-4 rounded-xl border transition-all ${form.participationLimit===o.v?"bg-violet-600/20 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/70"}`}><span className="font-medium block">{o.l}</span><span className="text-sm opacity-60">{o.sub}</span></button>)}</div></div>
        </div>}

        {step===2&&<div className="space-y-5">
          <div className="rounded-xl p-4 flex items-center justify-between" style={{background:form.backgroundColor}}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{background:form.primaryColor}}>🎯</div><p className="text-white font-bold text-sm">{form.name||"Preview"}</p></div><div className="px-3 py-1.5 rounded-lg text-white text-sm" style={{background:form.secondaryColor}}>Jugar</div></div>
          <div><label className="text-white font-medium block mb-2">Logo de tu negocio (opcional)</label><p className="text-white/40 text-xs mb-2">Se mostrará en la pantalla del juego</p><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({logoUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{form.logoUrl&&<div className="mt-2 flex items-center gap-3"><img src={form.logoUrl} alt="logo" className="w-24 h-24 object-contain rounded-xl border border-white/10"/><button type="button" onClick={()=>upd({logoUrl:""})} className="text-red-400 text-xs hover:text-red-300">🗑️ Quitar logo</button></div>}</div>
          {[{k:"primaryColor",l:"Color primario"},{k:"secondaryColor",l:"Color secundario"},{k:"backgroundColor",l:"Color de fondo"}].map(f=><div key={f.k}><label className="text-white font-medium block mb-2">{f.l}</label><div className="flex items-center gap-3"><input type="color" value={form[f.k]} onChange={e=>upd({[f.k]:e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"/><span className="text-white font-mono text-sm">{form[f.k]}</span></div></div>)}
          <div><label className="text-white font-medium block mb-2">Idioma</label><div className="flex gap-2">{[{id:"es",l:"🇦🇷 Español"},{id:"en",l:"🇺🇸 English"},{id:"pt",l:"🇧🇷 Português"}].map(lang=><button key={lang.id} type="button" onClick={()=>upd({language:lang.id})} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.language===lang.id?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/60"}`}>{lang.l}</button>)}</div></div>
        </div>}

        {step===3&&<div className="space-y-4">
          <div className="flex items-center justify-between"><label className="text-white font-medium">Premios</label><button type="button" onClick={()=>upd({prizes:[...form.prizes,{title:"",stock:10,priority:5,frequency:50,validDays:30}]})} className="text-violet-400 text-sm">+ Agregar</button></div>
          {form.prizes.map((p: any,i: number)=><div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <input value={p.title} onChange={e=>{const ps=[...form.prizes];ps[i].title=e.target.value;upd({prizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Nombre del premio *"/>
            <div className="space-y-2"><label className="text-white/50 text-xs block mb-1">Imagen del premio (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url){const ps=[...form.prizes];ps[i].prizeImage=d.url;upd({prizes:ps});}}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{p.prizeImage&&<img src={p.prizeImage} alt="preview" className="w-full aspect-square object-cover rounded-lg border border-white/10"/>}</div>
            <div className="grid grid-cols-3 gap-2">{[{k:"stock",l:"Stock"},{k:"frequency",l:"Cada X scans"},{k:"validDays",l:"Días para canjear el premio"}].map(f=><div key={f.k}><label className="text-white/50 text-xs block mb-1">{f.l}</label><input type="number" min="1" value={p[f.k]} onChange={e=>{const ps=[...form.prizes];ps[i][f.k]=parseInt(e.target.value)||1;upd({prizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-sm focus:outline-none"/>{f.k==="validDays"&&<p className="text-white/30 text-xs mt-1">Días que tiene el ganador para canjear desde que gana</p>}</div>)}</div>
            <button onClick={()=>upd({prizes:form.prizes.filter((_:any,j:number)=>j!==i)})} className="text-red-400 text-xs hover:text-red-300">🗑️ Eliminar premio</button>
          </div>)}
          <div className="border border-amber-500/30 bg-amber-500/10 rounded-xl p-4 space-y-2">
            <label className="text-white font-medium block">⭐ Premio consuelo (opcional)</label>
            <input value={form.consolePrize.title} onChange={e=>upd({consolePrize:{...form.consolePrize,title:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Ej: 10% de descuento"/>
            <input value={form.consolePrize.couponCode} onChange={e=>upd({consolePrize:{...form.consolePrize,couponCode:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm font-mono focus:outline-none" placeholder="Código: DESCUENTO10"/>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-white/70 text-sm block mb-1">Fecha inicio</label><input type="date" value={form.startDate} onChange={e=>upd({startDate:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"/></div>
            <div><label className="text-white/70 text-sm block mb-1">Fecha fin</label><input type="date" value={form.endDate} onChange={e=>upd({endDate:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"/></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 rounded-xl"><input type="checkbox" id="finishOnStock" checked={form.finishOnStock||false} onChange={e=>upd({finishOnStock:e.target.checked})} className="w-5 h-5 rounded accent-violet-600 cursor-pointer"/><label htmlFor="finishOnStock" className="text-white/80 text-sm cursor-pointer">Finalizar cuando se agoten todos los premios</label></div>
        </div>}

        {step===4&&<div className="space-y-4">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 space-y-3">
            <p className="text-white font-medium">📧 Email al ganador</p>
            <div><label className="text-white/70 text-xs block mb-1">Asunto</label><input value={form.emailWinner.subject} onChange={e=>upd({emailWinner:{...form.emailWinner,subject:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"/></div>
            <div><label className="text-white/70 text-xs block mb-1">Mensaje</label><textarea rows={3} value={form.emailWinner.bodyHtml} onChange={e=>upd({emailWinner:{...form.emailWinner,bodyHtml:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none"/></div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white/70 text-xs font-bold mb-2">📋 Códigos disponibles para personalizar el mensaje:</p>
            <div className="space-y-1">
              <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{name}}"}</code> — Nombre del participante</p>
              <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{prize}}"}</code> — Nombre del premio ganado</p>
              <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{redemptionCode}}"}</code> — Código único de canje</p>
              <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{expiresAt}}"}</code> — Fecha límite para canjear el premio</p>
              <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{couponCode}}"}</code> — Código de descuento (solo email consuelo)</p>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 space-y-3">
            <p className="text-white font-medium">🎁 Email de consuelo</p>
            <div><label className="text-white/70 text-xs block mb-1">Asunto</label><input value={form.emailConsole.subject} onChange={e=>upd({emailConsole:{...form.emailConsole,subject:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"/></div>
            <div><label className="text-white/70 text-xs block mb-1">Mensaje</label><textarea rows={3} value={form.emailConsole.bodyHtml} onChange={e=>upd({emailConsole:{...form.emailConsole,bodyHtml:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none"/></div>
          </div>
        </div>}

        {step===5&&<div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"><div><p className="text-white font-medium">Activar Upseller</p><p className="text-white/50 text-xs">Banner fijo en el juego</p></div><button type="button" onClick={()=>upd({upsellEnabled:!form.upsellEnabled})} className={`w-12 h-6 rounded-full transition-all relative ${form.upsellEnabled?"bg-violet-600":"bg-white/20"}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.upsellEnabled?"left-6":"left-0.5"}`}/></button></div>
          <div className="space-y-2 mt-2"><label className="text-white/70 text-xs block mb-1">URL de destino final (opcional)</label><input type="url" value={form.closedRedirectUrl||""} onChange={e=>upd({closedRedirectUrl:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://tusitio.com"/><p className="text-white/30 text-xs">Al finalizar el juego, el cliente será redirigido a esta URL</p></div>
          {form.upsellEnabled&&<div className="space-y-3">
            <input value={form.upsellTitle} onChange={e=>upd({upsellTitle:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Ej: Hamburguesa 20% OFF"/>
            <div className="grid grid-cols-2 gap-3"><input type="number" value={form.upsellPrice} onChange={e=>upd({upsellPrice:parseFloat(e.target.value)||0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" placeholder="Precio"/><select value={form.upsellCurrency} onChange={e=>upd({upsellCurrency:e.target.value})} className="w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none">{["ARS","USD","EUR","BRL","CLP","COP","MXN"].map(c=><option key={c}>{c}</option>)}</select></div>
            <div className="space-y-2"><label className="text-white/70 text-xs block mb-1">Imagen del producto (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({upsellImageUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none cursor-pointer"/>{form.upsellImageUrl&&<img src={form.upsellImageUrl} alt="preview" className="w-full aspect-square object-cover rounded-xl border border-white/10"/>}</div>
            <input type="url" value={form.upsellLink} onChange={e=>upd({upsellLink:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://wa.me/..."/>
          </div>}
        </div>}
      </div>

      <div className="flex justify-between mt-6">
        <button onClick={()=>setStep(p=>p-1)} disabled={step===1} className="px-5 py-3 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">← Anterior</button>
        {step<5
          ? <button onClick={()=>setStep(p=>p+1)} className="px-5 py-3 rounded-xl text-white font-medium bg-violet-600 hover:bg-violet-500 transition-colors">Siguiente →</button>
          : <button onClick={handleSave} disabled={saving} className="px-6 py-3 rounded-xl text-white font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors">{saving?"Guardando...":"💾 Guardar cambios"}</button>
        }
      </div>

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full space-y-4">
            <h3 className="text-white font-bold text-lg">¿Eliminar campaña?</h3>
            <p className="text-white/60 text-sm">Esta acción no se puede deshacer. Se eliminarán todos los leads, scans y premios asociados.</p>
            <div className="flex gap-3">
              <button onClick={()=>setShowDeleteConfirm(false)} className="flex-1 py-3 rounded-xl text-white/60 bg-white/5 hover:bg-white/10 transition-colors">Cancelar</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-3 rounded-xl text-white font-bold bg-red-600 hover:bg-red-500 disabled:opacity-50 transition-colors">{deleting?"Eliminando...":"Eliminar"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
