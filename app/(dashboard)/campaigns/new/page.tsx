"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
const GAMES=[{id:"RASCA_Y_GANA",label:"Rasca y Gana",emoji:"🎫",desc:"Tarjeta táctil"},{id:"SLOTS",label:"Tragamonedas",emoji:"🎰",desc:"Tres rodillos"},{id:"SORTEO",label:"Sorteo",emoji:"🎲",desc:"Sorteo con fecha de cierre"}];
export default function NewCampaignPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [form, setForm] = useState<any>({ name:"", gameType:"RASCA_Y_GANA", attemptsPerSession:3, participationLimit:"once_email", logoUrl:"", primaryColor:"#7C3AED", secondaryColor:"#A78BFA", backgroundColor:"#1a1a2e", language:"es", ageGate:false, prizes:[{title:"",stock:10,priority:5,frequency:50,validDays:30}], consolePrize:{title:"",couponCode:""},
    gameTerms:"", startDate:"", endDate:"", emailWinner:{subject:"🎉 ¡Ganaste un premio!",bodyHtml:"Felicitaciones {{name}}! Ganaste: {{prize}}. Tu código es: {{redemptionCode}}. Válido hasta: {{expiresAt}}"}, emailConsole:{subject:"Tu regalo te espera 🎁",bodyHtml:"Gracias por participar! Tu código de descuento es: {{couponCode}}"}, upsellEnabled:false, upsellTitle:"", upsellPrice:0, upsellCurrency:"ARS", upsellLink:"", upsellImageUrl:"", closedBehavior:"LEAD_MAGNET",
    // Sorteo
    rafflePrizes:[{title:"",description:"",imageUrl:"",stock:1}], raffleDrawDate:"", raffleClaimDays:7, raffleTerms:"", raffleTermsUrl:"",
    emailRaffleWinner:{subject:"🎲 ¡Ganaste en el sorteo!",bodyHtml:"¡Felicitaciones {{name}}! Ganaste: {{prize}}. Tu código de canje es: {{redemptionCode}}. Tenés hasta {{expiresAt}} para reclamarlo."},
  });
  const upd=(d:any)=>setForm((p:any)=>({...p,...d}));
  const isSorteo = form.gameType === "SORTEO";
  const STEPS = isSorteo ? ["Mecánica","Branding","Premios Sorteo","Términos","Upseller"] : ["Mecánica","Branding","Premios","Email","Upseller"];
  const totalSteps = STEPS.length;
  const canGo=()=>{
    if(step===1)return form.name.trim().length>=3;
    if(step===3&&!isSorteo)return form.prizes.some((p:any)=>p.title.trim());
    if(step===3&&isSorteo)return form.rafflePrizes.some((p:any)=>p.title.trim()) && form.endDate && form.raffleDrawDate && new Date(form.raffleDrawDate)>new Date(form.endDate);
    return true;
  };
  async function submit() {
    setSaving(true);
    try {
      setSaveError("");
      if (isSorteo) {
        const r=await fetch("/api/campaigns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({
          name:form.name, gameType:"SORTEO", attemptsPerSession:1, participationLimit:"once_email",
          logoUrl:form.logoUrl||null, primaryColor:form.primaryColor, secondaryColor:form.secondaryColor, backgroundColor:form.backgroundColor,
          language:form.language, ageGate:false, startDate:null, endDate:form.endDate||null,
          formFields:[{id:"nombre",label:"Nombre y apellido",type:"text",required:true}], closedRedirectUrl:null,
          raffleDrawDate:form.raffleDrawDate||null, raffleClaimDays:form.raffleClaimDays||7, raffleTerms:form.raffleTerms||null, raffleTermsUrl:form.raffleTermsUrl||null, raffleLocked:false, upsellEnabled:form.upsellEnabled, upsellTitle:form.upsellTitle||null, upsellPrice:form.upsellPrice||null, upsellCurrency:form.upsellCurrency||"ARS", upsellLink:form.upsellLink||null, upsellImageUrl:form.upsellImageUrl||null, closedRedirectUrl:form.closedRedirectUrl||null, closedBehavior:"LEAD_MAGNET",
        })});
        if(!r.ok){const err=await r.json();setSaveError(err.error||"Error al crear la campaña");setSaving(false);return;}
        const c=await r.json();
        for(const p of form.rafflePrizes.filter((p:any)=>p.title.trim()))
          await fetch(`/api/campaigns/${c.id}/raffle-prizes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
        await fetch(`/api/campaigns/${c.id}/email-templates`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify([{type:"RAFFLE_WINNER",...form.emailRaffleWinner}])});
        const autoTermsUrl = `${window.location.origin}/terminos/${c.qrSlug}`;
        await fetch(`/api/campaigns/${c.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"ACTIVE",raffleTermsUrl:autoTermsUrl})});
      } else {
        const r=await fetch("/api/campaigns",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({...form,startDate:form.startDate||null,endDate:form.endDate||null,upsellTitle:form.upsellTitle||null,upsellPrice:form.upsellPrice||null,upsellLink:form.upsellLink||null,formFields:[{id:"nombre",label:"Nombre y apellido",type:"text",required:true}],closedRedirectUrl:null})});
        if(!r.ok){const err=await r.json();setSaveError(err.error||"Error al crear la campaña");setSaving(false);return;}
        const c=await r.json();
        for(const p of form.prizes.filter((p:any)=>p.title.trim()))await fetch(`/api/campaigns/${c.id}/prizes`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(p)});
        if(form.consolePrize.title)await fetch(`/api/campaigns/${c.id}/console-prize`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(form.consolePrize)});
        await fetch(`/api/campaigns/${c.id}/email-templates`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify([{type:"WINNER",...form.emailWinner},{type:"CONSOLE",...form.emailConsole}])});
        const autoTermsUrl = `${window.location.origin}/terminos/${c.qrSlug}`;
        await fetch(`/api/campaigns/${c.id}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify({status:"ACTIVE",raffleTerms:form.gameTerms||null,raffleTermsUrl:autoTermsUrl})});
      }
      router.push("/dashboard");
    } catch(e){console.error(e);setSaveError("Error de conexión. Intentá de nuevo.");setSaving(false);}
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
          {!isSorteo&&<><div><label className="text-white font-medium block mb-3">Intentos por sesión</label><div className="flex gap-3">{[1,3,5].map(n=><button key={n} type="button" onClick={()=>upd({attemptsPerSession:n})} className={`flex-1 py-3 rounded-xl font-bold text-lg border transition-all ${form.attemptsPerSession===n?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/60"}`}>{n}</button>)}</div></div>
          <div><label className="text-white font-medium block mb-3">¿Cuántas veces puede participar cada persona?</label><div className="space-y-2">{[{v:"once_email",l:"Una vez por email",sub:"Cada email participa una sola vez"},{v:"once_daily",l:"Una vez por día",sub:"Mismo email puede volver al día siguiente"},{v:"unlimited",l:"Sin límite",sub:"El mismo email puede participar cuando quiera"}].map(o=><button key={o.v} type="button" onClick={()=>upd({participationLimit:o.v})} className={`w-full text-left p-4 rounded-xl border transition-all ${form.participationLimit===o.v?"bg-violet-600/20 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/70"}`}><span className="font-medium block">{o.l}</span><span className="text-sm opacity-60">{o.sub}</span></button>)}</div></div></>}
          {isSorteo&&<div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4"><p className="text-violet-300 text-sm">🎲 El Sorteo permite una participación por email. Las fechas y premios se configuran en el siguiente paso.</p></div>}
        </div>}
        {step===2&&<div className="space-y-5">
          <div className="rounded-xl p-4 flex items-center justify-between" style={{background:form.backgroundColor}}><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{background:form.primaryColor}}>🎯</div><p className="text-white font-bold text-sm">{form.name||"Preview"}</p></div><div className="px-3 py-1.5 rounded-lg text-white text-sm" style={{background:form.secondaryColor}}>Jugar</div></div>
          <div><label className="text-white font-medium block mb-2">Logo de tu negocio (opcional)</label><p className="text-white/40 text-xs mb-2">Se mostrará en la pantalla del juego</p><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({logoUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{(form as any).logoUrl&&<img src={(form as any).logoUrl} alt="logo preview" className="w-24 h-24 object-contain rounded-xl border border-white/10 mt-2"/>}</div>
          {[{k:"primaryColor",l:"Color primario — botones y elementos destacados"},{k:"secondaryColor",l:"Color secundario — fondos de botones secundarios"},{k:"backgroundColor",l:"Color de fondo — pantalla del juego"}].map(f=><div key={f.k}><label className="text-white font-medium block mb-2">{f.l}</label><div className="flex items-center gap-3"><input type="color" value={(form as any)[f.k]} onChange={e=>upd({[f.k]:e.target.value})} className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent"/><span className="text-white font-mono text-sm">{(form as any)[f.k]}</span></div></div>)}
          <div><label className="text-white font-medium block mb-2">Idioma</label><div className="flex gap-2">{[{id:"es",l:"🇦🇷 Español"},{id:"en",l:"🇺🇸 English"},{id:"pt",l:"🇧🇷 Português"}].map(lang=><button key={lang.id} type="button" onClick={()=>upd({language:lang.id})} className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${form.language===lang.id?"bg-violet-600 border-violet-500 text-white":"bg-white/5 border-white/10 text-white/60"}`}>{lang.l}</button>)}</div></div>
        </div>}
        {step===3&&!isSorteo&&<div className="space-y-4">
          <div className="flex items-center justify-between"><label className="text-white font-medium">Premio</label></div>
          {form.prizes.map((p:any,i:number)=><div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <input value={p.title} onChange={e=>{const ps=[...form.prizes];ps[i].title=e.target.value;upd({prizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Nombre del premio *"/>
            <div className="space-y-2"><label className="text-white/50 text-xs block mb-1">Imagen del premio (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url){const ps=[...form.prizes];ps[i].prizeImage=d.url;upd({prizes:ps});}}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{p.prizeImage&&<img src={p.prizeImage} alt="preview" className="w-full aspect-square object-cover rounded-lg border border-white/10"/>}</div><div className="grid grid-cols-3 gap-2">{[{k:"stock",l:"Stock"},{k:"frequency",l:"Cada X scans"},{k:"validDays",l:"Días para canjear el premio"}].map((f:any)=><div key={f.k}><label className="text-white/50 text-xs block mb-1">{f.l}</label><input type="number" min="1" value={p[f.k]} onChange={e=>{const ps=[...form.prizes];ps[i][f.k]=parseInt(e.target.value)||1;upd({prizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-sm focus:outline-none"/>{f.k==="validDays"&&<p className="text-white/30 text-xs mt-1">Días que tiene el ganador para canjear desde que gana</p>}</div>)}</div>
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
          <div className="space-y-2">
  <label className="text-white font-medium block">📋 Términos y condiciones (opcional)</label>
  <p className="text-white/40 text-xs">Se mostrará en la página de T&C del juego junto a los datos del premio</p>
  <textarea rows={5} value={form.gameTerms||""} onChange={e=>upd({gameTerms:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none" placeholder="Ej: El premio no es transferible ni canjeable por dinero en efectivo..."/>
  <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-3">
    <p className="text-blue-300 text-xs">🔗 Una vez creado el juego, los T&C estarán disponibles en:</p>
    <p className="text-blue-300 font-mono text-xs mt-1">{typeof window !== "undefined" ? window.location.origin : ""}/terminos/[slug-del-juego]</p>
  </div>
</div>
        </div>}
        {step===3&&isSorteo&&<div className="space-y-4">
          <div className="flex items-center justify-between"><label className="text-white font-medium">Premios del Sorteo</label><button type="button" onClick={()=>upd({rafflePrizes:[...form.rafflePrizes,{title:"",description:"",imageUrl:"",stock:1}]})} className="text-violet-400 text-sm">+ Agregar premio</button></div>
          {form.rafflePrizes.map((p:any,i:number)=><div key={i} className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
            <input value={p.title} onChange={e=>{const ps=[...form.rafflePrizes];ps[i].title=e.target.value;upd({rafflePrizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Nombre del premio *"/>
            <input value={p.description||""} onChange={e=>{const ps=[...form.rafflePrizes];ps[i].description=e.target.value;upd({rafflePrizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Descripción (opcional)"/>
            <div className="space-y-2"><label className="text-white/50 text-xs block mb-1">Imagen (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url){const ps=[...form.rafflePrizes];ps[i].imageUrl=d.url;upd({rafflePrizes:ps});}}} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none cursor-pointer"/>{p.imageUrl&&<img src={p.imageUrl} alt="preview" className="w-full aspect-video object-cover rounded-lg border border-white/10 max-h-48"/>}</div>
            <div><label className="text-white/50 text-xs block mb-1">Stock disponible</label><input type="number" min="1" value={p.stock} onChange={e=>{const ps=[...form.rafflePrizes];ps[i].stock=parseInt(e.target.value)||1;upd({rafflePrizes:ps});}} className="w-full bg-white/10 border border-white/20 rounded-lg px-2 py-2 text-white text-sm focus:outline-none"/><p className="text-white/30 text-xs mt-1">Unidades disponibles de este premio</p></div>
            {form.rafflePrizes.length>1&&<button type="button" onClick={()=>upd({rafflePrizes:form.rafflePrizes.filter((_:any,j:number)=>j!==i)})} className="text-red-400 text-xs hover:text-red-300">🗑️ Eliminar</button>}
          </div>)}
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-white/70 text-sm block mb-1">Cierre de inscripción *</label><input type="datetime-local" value={form.endDate} onChange={e=>upd({endDate:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"/></div>
            <div><label className="text-white/70 text-sm block mb-1">Fecha del sorteo *</label><input type="datetime-local" value={form.raffleDrawDate} onChange={e=>upd({raffleDrawDate:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"/></div>
          </div>
          {form.endDate&&form.raffleDrawDate&&new Date(form.raffleDrawDate)<=new Date(form.endDate)&&<p className="text-red-400 text-sm">⚠️ La fecha del sorteo debe ser posterior al cierre de inscripción</p>}
          <div><label className="text-white/70 text-sm block mb-1">Días para reclamar el premio</label><input type="number" min="1" value={form.raffleClaimDays} onChange={e=>upd({raffleClaimDays:parseInt(e.target.value)||7})} className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none"/><p className="text-white/30 text-xs mt-1">Días que tiene el ganador para canjear su premio desde la fecha del sorteo</p></div>
        </div>}
        {step===4&&!isSorteo&&<div className="space-y-6">
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
        {step===4&&isSorteo&&<div className="space-y-4">
          <div className="bg-white/5 border border-white/10 rounded-xl p-4">
            <p className="text-white font-bold mb-1">📝 Términos y Condiciones</p>
            <p className="text-white/40 text-xs mb-3">Importante: mencioná la fecha del sorteo en los T&C</p>
            <div className="space-y-3">
              <div><label className="text-white/70 text-xs block mb-1">Texto de T&C completo</label><textarea rows={6} value={form.raffleTerms} onChange={e=>upd({raffleTerms:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none" placeholder="Bases y condiciones del sorteo..."/></div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-300 text-sm font-medium mb-1">🔗 Página de T&C generada automáticamente</p>
                <p className="text-blue-200/60 text-xs">Una vez creado el sorteo, los términos y condiciones estarán disponibles en:</p>
                <p className="text-blue-300 font-mono text-xs mt-2 break-all">{typeof window !== "undefined" ? window.location.origin : ""}/terminos/[slug-del-sorteo]</p>
                <p className="text-blue-200/50 text-xs mt-2">Este link se incluye automáticamente en el formulario de participación.</p>
              </div>
            </div>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3">
            <p className="text-amber-300 text-xs">⚠️ Asegurate de mencionar la fecha del sorteo (<strong>{form.raffleDrawDate?new Date(form.raffleDrawDate).toLocaleDateString("es-AR"):"—"}</strong>) en los términos y condiciones.</p>
          </div>
        </div>}
        {step===5&&isSorteo&&<div className="space-y-6">
  <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4 space-y-3">
    <p className="text-white font-medium">📧 Email a ganadores del sorteo</p>
    <p className="text-white/40 text-xs">Se envía automáticamente cuando ejecutás el sorteo</p>
    <div><label className="text-white/70 text-xs block mb-1">Asunto</label><input value={form.emailRaffleWinner.subject} onChange={e=>upd({emailRaffleWinner:{...form.emailRaffleWinner,subject:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none"/></div>
    <div><label className="text-white/70 text-xs block mb-1">Mensaje</label><textarea rows={3} value={form.emailRaffleWinner.bodyHtml} onChange={e=>upd({emailRaffleWinner:{...form.emailRaffleWinner,bodyHtml:e.target.value}})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none resize-none"/></div>
  </div>
  <div className="bg-white/5 border border-white/10 rounded-xl p-4">
    <p className="text-white/70 text-xs font-bold mb-2">📋 Variables disponibles:</p>
    <div className="space-y-1">
      <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{name}}"}</code> — Nombre del ganador</p>
      <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{prize}}"}</code> — Nombre del premio ganado</p>
      <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{redemptionCode}}"}</code> — Código único de canje</p>
      <p className="text-white/50 text-xs"><code className="text-violet-400">{"{{expiresAt}}"}</code> — Fecha límite para reclamar</p>
    </div>
  </div>
  <div className="border-t border-white/10 pt-6 space-y-4">
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
      <div><p className="text-white font-medium">Activar Upseller</p><p className="text-white/50 text-xs">Se muestra en la pantalla de confirmación de participación</p></div>
      <button type="button" onClick={()=>upd({upsellEnabled:!form.upsellEnabled})} className={`w-12 h-6 rounded-full transition-all relative ${form.upsellEnabled?"bg-violet-600":"bg-white/20"}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.upsellEnabled?"left-6":"left-0.5"}`}/></button>
    </div>
    {form.upsellEnabled&&<div className="space-y-3">
      <input value={form.upsellTitle} onChange={e=>upd({upsellTitle:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Ej: Hamburguesa 20% OFF"/>
      <div className="grid grid-cols-2 gap-3">
        <input type="text" inputMode="decimal" value={form.upsellPrice||""} onChange={e=>upd({upsellPrice:parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" placeholder="Precio"/>
        <select value={form.upsellCurrency} onChange={e=>upd({upsellCurrency:e.target.value})} className="w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none">{["ARS","USD","EUR","BRL","CLP","COP","MXN","PEN","UYU","PYG","BOB","GTQ","VES","CRC","PAB"].map(c=><option key={c}>{c}</option>)}</select>
      </div>
      <div className="space-y-2">
        <label className="text-white/70 text-xs block mb-1">Imagen del producto (opcional)</label>
        <input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({upsellImageUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none cursor-pointer"/>
        {form.upsellImageUrl&&<img src={form.upsellImageUrl} alt="preview" className="w-full aspect-square object-cover rounded-xl border border-white/10"/>}
      </div>
      <input type="url" value={form.upsellLink} onChange={e=>upd({upsellLink:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://wa.me/..."/>
    </div>}
    <div className="space-y-2">
      <label className="text-white/70 text-xs block mb-1">URL de destino final (opcional)</label>
      <input type="url" value={form.closedRedirectUrl||""} onChange={e=>upd({closedRedirectUrl:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://tusitio.com"/>
      <p className="text-white/30 text-xs">Si está configurada, aparece un botón para ir a tu sitio en la pantalla de confirmación</p>
    </div>
  </div>
</div>}
        {step===5&&!isSorteo&&<div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10"><div><p className="text-white font-medium">Activar Upseller</p><p className="text-white/50 text-xs">Banner fijo en el juego</p></div><button type="button" onClick={()=>upd({upsellEnabled:!form.upsellEnabled})} className={`w-12 h-6 rounded-full transition-all relative ${form.upsellEnabled?"bg-violet-600":"bg-white/20"}`}><div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full transition-all ${form.upsellEnabled?"left-6":"left-0.5"}`}/></button></div>
          <div className="space-y-2 mt-2"><label className="text-white/70 text-xs block mb-1">URL de destino final (opcional)</label><input type="url" value={form.finalUrl} onChange={e=>upd({finalUrl:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://tusitio.com"/><p className="text-white/30 text-xs">Al finalizar el juego, el cliente será redirigido a esta URL</p></div>{form.upsellEnabled&&<div className="space-y-3"><input value={form.upsellTitle} onChange={e=>upd({upsellTitle:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="Ej: Hamburguesa 20% OFF"/><div className="grid grid-cols-2 gap-3"><input type="text" inputMode="decimal" value={form.upsellPrice||""} onChange={e=>upd({upsellPrice:parseFloat(e.target.value.replace(/[^0-9.]/g,""))||0})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none" placeholder="Precio"/><select value={form.upsellCurrency} onChange={e=>upd({upsellCurrency:e.target.value})} className="w-full bg-gray-800 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none">{["ARS","USD","EUR","BRL","CLP","COP","MXN","PEN","UYU","PYG","BOB","GTQ","VES","CRC","PAB"].map(c=><option key={c}>{c}</option>)}</select></div><div className="space-y-2"><label className="text-white/70 text-xs block mb-1">Imagen del producto (opcional)</label><input type="file" accept="image/*" onChange={async(e)=>{const f=e.target.files?.[0];if(!f)return;if(f.size>2000000){alert("La imagen no puede superar 2MB");return;}const fd=new FormData();fd.append("file",f);const r=await fetch("/api/upload",{method:"POST",body:fd});const d=await r.json();if(d.url)upd({upsellImageUrl:d.url});}} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white text-sm focus:outline-none cursor-pointer"/>{(form as any).upsellImageUrl&&<img src={(form as any).upsellImageUrl} alt="preview" className="w-full aspect-square object-cover rounded-xl border border-white/10"/>}</div><input type="url" value={form.upsellLink} onChange={e=>upd({upsellLink:e.target.value})} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 text-sm focus:outline-none" placeholder="https://wa.me/..."/></div>}
        </div>}
      </div>
      <div className="flex justify-between mt-6">
        <button onClick={()=>setStep(p=>p-1)} disabled={step===1} className="px-5 py-3 rounded-xl text-white/60 hover:text-white bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-colors">← Anterior</button>
        {saveError && <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3"><span>⚠️</span><p className="text-red-400 text-sm">{saveError}</p></div>}
        {step<totalSteps?<button onClick={()=>setStep(p=>p+1)} disabled={!canGo()} className="px-5 py-3 rounded-xl text-white font-medium bg-violet-600 hover:bg-violet-500 disabled:opacity-30 transition-colors">Siguiente →</button>:<button onClick={submit} disabled={saving} className="px-6 py-3 rounded-xl text-white font-bold bg-green-600 hover:bg-green-500 disabled:opacity-50 transition-colors">{saving?"Creando...":"✅ Crear y Activar"}</button>}
      </div>
    </div>
  );
}
