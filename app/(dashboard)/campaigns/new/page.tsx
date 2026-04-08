"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const STEPS=["Mecánica","Branding","Premios","Email","Upseller"];
const GAMES=[{id:"RASCA_Y_GANA",label:"Rasca y Gana",emoji:"🎫",desc:"Tarjeta táctil"},{id:"SLOTS",label:"Tragamonedas",emoji:"🎰",desc:"Tres rodillos"}];
export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name:"", gameType:"RASCA_Y_GANA", attemptsPerSession:3, participationLimit:"once_email", logoUrl:"", primaryColor:"#7C3AED", secondaryColor:"#A78BFA", backgroundColor:"#1a1a2e", language:"es", ageGate:false, prizes:[{title:"",stock:10,priority:5,frequency:50,validDays:30}], consolePrize:{title:"",couponCode:""}, startDate:"", endDate:"", emailWinner:{subject:"🎉 ¡Ganaste un premio!",bodyHtml:"Felicitaciones {{name}}! Ganaste: {{prize}}. Tu código es: {{redemptionCode}}. Válido hasta: {{expiresAt}}"}, emailConsole:{subject:"Tu regalo te espera 🎁",bodyHtml:"Gracias por participar! Tu código de descuento es: {{couponCode}}"}, upsellEnabled:false, upsellTitle:"", upsellPrice:0, upsellCurrency:"ARS", upsellLink:"", upsellImageUrl:"", closedBehavior:"LEAD_MAGNET" });
  const upd=(d:any)=>setForm(p=>({...p,...d}));
  const canGo=()=>{if(step===1)return form.name.trim().length>=3;if(step===3)return form.prizes.some(p=>p.title.trim());return true;};
  async function submit() {
    setSaving(true);
    try {
      const r=await fetch("/api/campaigns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,startDate:form.startDate||null,endDate:form.endDate||null,upsellTitle:form.upsellTitle||null,upsellPrice:form.upsellPrice||null,upsellLink:form.upsellLink||null,formFields:[{id:"nombre",label:"Nombre",type:"text",required:true}],closedRedirectUrl:null})});
      if(!r.ok)throw new Error();
      const c=await r.json();
      for(const p of form.prizes.filter(p=>p.title.trim()))await fetch(`/api/campaigns/${c.id}/prizes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
      if(form.consolePrize.title)await fetch(`/api/campaigns/${c.id}/console-prize`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form.consolePrize)});
      await fetch(`/api/campaigns/${c.id}/email-templates`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify([{type:"WINNER",...form.emailWinner},{type:"CONSOLE",...form.emailConsole}])});
      await fetch(`/api/campaigns/${c.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"ACTIVE"})});
      router.push("/dashboard");
    } catch(e){console.error(e);setSaving(false);}
  }
  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-white text-2xl font-bold mb-6">Crear nuevo QR Juego</h1>
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s,i)=>(
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${i+1<step?"bg-violet-600 text-white":i+1===step?"bg-violet-600 text-white ring-2 ring-violet-400 ring-offset-2 ring-offset-gray-950":"bg-white/10 text-white/40"}`}>{i+1<step?"✓":i+1}</div>
            <span className={`text-xs hidden sm:block ${i+1===step?"text-white font-medium":"text-white/40"}`}>{s}</span>
            {i<STEPS.length-1&&<div className={`flex-1 h-0.5 ${i+1<step?"bg-violet-600":"bg-white/10"}`}/>}
          </div>
        ))}
      </div>
      <div className="bg-gray-900 border border-white/10 rounded-2xl p-6 min-h-64">
        {step===1&&<div className="space-y-5">
          <div><label className="text-white font-medium block mb-2">Nombre *</label><input value={form.name} onChange={e=>upd({name:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-violet-500" placeholder="Ej: Ruleta de Verano 2025"/></div>
          <div><label className="text-white font-medium block mb-3">Tipo de juego</label><div className="space-y-2">{GAMES.map(g=><button key={g.id} type="button" onClick={()=>upd({gameType:g.id})} className={`w-full text-left p-4 rounded-xl border transition-all ${form.gameType===g.id?"bg-violet-600/20 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/70"}`}><span className="text-xl mr-3">{g.emoji}</span><span className="font-medium">{g.label}</span><span className="text-sm opacity-60 ml-2">{g.desc}</span></button>)}</div></div>
          <div><label className="text-white font-medium block mb-3">Intentos por sesión</label><div className="flex gap-3">{[1,3,5].map(n=><button key={n} type="button" onClick={()=>upd({attemptsPerSession:n})} className={`flex-1 py-3 rounded-xl font-bold text-lg border transition-all ${form.attemptsPerSession===n?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/60"}`}>{n}</button>)}</div></div>
          <div><label className="text-white font-medium block mb-3">¿Cuántas veces puede participar cada persona?</label><div className="space-y-2">{[{v:"once_email",l:"Una vez por email",sub:"Cada email participa una sola vez"},{v:"once_daily",l:"Una vez por día",sub:"Mismo email puede volver al día siguiente"},{v:"unlimited",l:"Sin límite",sub:"El mismo email puede participar cuando quiera"}].map(o=><button key={o.v} type="button" onClick={()=>upd({participationLimit:o.v})} className={`w-full text-left p-4 rounded-xl border transition-all ${(form as any).participationLimit===o.v?"bg-violet-600/20 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/70"}`}><span className="font-medium block">{o.l}</span><span className="text-sm opacity-60">{o.sub}</span></button>)}</div></div>
        </div>}
        {step===2&&<div className="space-y-5">
          <div className="rounded-xl p-4 flex items-center justify-between" style={{background:form.backgroundColor}}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{background:form.primaryColor}}>🎯</div><p className="text-white font-bold text-sm">{form.name||"Preview"}</p></div><div className="px-3 py-1.5 rounded-lg text-white text-sm" style={{background:form.secondaryColor}}>Jugar</div></div>
          <div><label className="text-white font-medium block mb-2">Logo de tu negocio (opcional)</label><p className="text-white/40 text-xs mb-2">Se mostrará en la pantalla del juego</p><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({logoUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{(form as any).logoUrl&&<img src={(form as any).logoUrl} alt="logo preview" className="w-24 h-24 object-contain rounded-xl border border-white/10 mt-2"/>}</div>
          {[{k:"primaryColor",l:"Color primario — botones y elementos destacados"},{k:"secondaryColor",l:"Color secundario — fondos de botones secundarios"},{k:"backgroundColor",l:"Color de fondo — pantalla del juego"}].map(f=><div key={f.k}><label className="text-white font-medium block mb-2">{f.l}</label><div className="flex items-center gap-3"><input type="color" value={(form as any)[f.k]} onChange={e=>upd({[f.k]:e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"/><span className="text-white font-mono text-sm">{(form as any)[f.k]}</span></div></div>)}
          <div><label className="text-white font-medium block mb-2">Idioma</label><div className="flex gap-2">{[{id:"es",l:"🇦🇷 Español"},{id:"en",l:"🇺🇸 English"},{id:"pt",l:"🇧🇷 Português"}].map(lang=><button key={lang.id} type="button" onClick={()=>upd({language:lang.id})} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.language===lang.id?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/60"}`}>{lang.l}</button>)}</div></div>
        </div>}
        {step===3&&<div className="space-y-4">
          <div className="flex items-center justify-between"><label className="text-white font-medium">Premios</label><button type="button" onClick={()=>upd({prizes:[...form.prizes,{title:"",stock:10,priority:5,frequency:50,validDays:30}]})} className="text-violet-400 text-sm">+ Agregar</button></div>
          {form.prizes.map((p,i)=><div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <input value={p.title} onChange={e=>{const ps=[...form.prizes];ps[i].title=e.target.value;upd({prizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Nombre del premio *"/>
            <div className="space-y-2"><label className="text-white/50 text-xs block mb-1">Imagen del premio (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url){const ps=[...form.prizes];ps[i].prizeImage=d.url;upd({prizes:ps});}}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{p.prizeImage&&<img src={p.prizeImage} alt="preview" className="w-full aspect-square object-cover rounded-lg border border-white/10"/>}</div><div className="grid grid-cols-3 gap-2">{[{k:"stock",l:"Stock"},{k:"frequency",l:"Cada X scans"},{k:"validDays",l:"Días para canjear el premio"}].map(f=><div key={f.k}><label className="text-white/50 text-xs block mb-1">{f.l}</label><input type="number" min="1" value={(p as any)[f.k]} onChange={e=>{const ps=[...form.prizes];(ps[i] as any)[f.k]=parseInt(e.target.value)||1;upd({prizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-sm focus:outline-none"/>{f.k==="validDays"&&<p className="text-white/30 text-xs mt-1">Días que tiene el ganador para canjear desde que gana</p>}</div>)}</div>
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
        {step===4&&<div className="space-y-6">
          <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
            <p className="text-white font-medium mb-1">📧 Email al ganador</p>
            <p className="text-white/50 text-xs mb-3">Se envía cuando alguien gana un premio</p>
              <div><label className="text-white/70 text-xs block mb-1">Asunto del email</label><input value={form.emailWinner.subject} onChange={e=>upd({emailWinner:{...form.emailWinner,subject:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" placeholder="Ej: Ganaste un premio"/></div>
            <div className="space-y-3">
              <div><label className="text-white/70 text-xs block mb-1">Mensaje</label><textarea rows={4} value={form.emailWinner.bodyHtml} onChange={e=>upd({emailWinner:{...form.emailWinner,bodyHtml:e.target.value.replace(/<[^>]+>/g,'')}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none" placeholder="Ej: Hola! Ganaste: [premio]. Tu código es: [código]. Válido hasta: [fecha]."/></div>
            </div>
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
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-white font-medium mb-1">🎁 Email de consuelo</p>
            <p className="text-white/50 text-xs mb-3">Se envía cuando no se gana un premio mayor</p>
            <div className="space-y-3">
              <div><label className="text-white/70 text-xs block mb-1">Asunto del email</label><input value={form.emailConsole.subject} onChange={e=>upd({emailConsole:{...form.emailConsole,subject:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" placeholder="Ej: Tu regalo te espera"/></div>
              <div><label className="text-white/70 text-xs block mb-1">Mensaje</label><textarea rows={4} value={form.emailConsole.bodyHtml} onChange={e=>upd({emailConsole:{...form.emailConsole,bodyHtml:e.target.value.replace(/<[^>]+>/g,'')}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none" placeholder="Ej: Gracias por participar. Tu código de descuento es: [código]."/></div>
            </div>
          </div>
        </div>}
        {step===5&&<div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"><div><p className="text-white font-medium">Activar Upseller</p><p className="text-white/50 text-xs">Banner fijo en el juego</p></div><button type="button" onClick={()=>upd({upsellEnabled:!form.upsellEnabled})} className={`w-12 h-6 rounded-full transition-all relative ${form.upsellEnabled?"bg-violet-600":"bg-white/20"}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.upsellEnabled?"left-6":"left-0.5"}`}/></button></div>
          <div className="space-y-2 mt-2"><label className="text-white/70 text-xs block mb-1">URL de destino final (opcional)</label><input type="url" value={form.finalUrl} onChange={e=>upd({finalUrl:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://tusitio.com"/><p className="text-white/30 text-xs">Al finalizar el juego, el cliente será redirigido a esta URL</p></div>{form.upsellEnabled&&<div className="space-y-3"><input value={form.upsellTitle} onChange={e=>upd({upsellTitle:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Ej: Hamburguesa 20% OFF"/><div className="grid grid-cols-2 gap-3"><input type="number" value={form.upsellPrice} onChange={e=>upd({upsellPrice:parseFloat(e.target.value)||0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" placeholder="Precio"/><select value={form.upsellCurrency} onChange={e=>upd({upsellCurrency:e.target.value})} className="w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none">{["ARS","USD","EUR","BRL","CLP","COP","MXN"].map(c=><option key={c}>{c}</option>)}</select></div><div className="space-y-2"><label className="text-white/70 text-xs block mb-1">Imagen del producto (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({upsellImageUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none cursor-pointer"/>{(form as any).upsellImageUrl&&<img src={(form as any).upsellImageUrl} alt="preview" className="w-full aspect-square object-cover rounded-xl border border-white/10"/>}</div><input type="url" value={form.upsellLink} onChange={e=>upd({upsellLink:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://wa.me/..."/></div>}
        </div>}
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={()=>setStep(p=>p-1)} disabled={step===1} className="px-5 py-3 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">← Anterior</button>
        {step<5?<button onClick={()=>setStep(p=>p+1)} disabled={!canGo()} className="px-5 py-3 rounded-xl text-white font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-colors">Siguiente →</button>:<button onClick={submit} disabled={saving} className="px-6 py-3 rounded-xl text-white font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors">{saving?"Creando...":"✅ Crear y Activar"}</button>}
      </div>
    </div>
  );
}
