"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import confetti from "canvas-confetti";
import TrackingPixels, { trackLead, trackWin } from "@/components/TrackingPixels";

type Prize = { title: string; stock: number; validDays: number; deliveredCount: number; prizeImage?: string };
type RafflePrize = { id: string; title: string; description?: string; imageUrl?: string; stock: number };
type Campaign = {
  id: string; name: string; gameType: string; primaryColor: string;
  secondaryColor: string; backgroundColor: string; language: string;
  attemptsPerSession: number; formFields: any[]; upsellEnabled: boolean;
  upsellTitle?: string; upsellPrice?: number; upsellCurrency?: string;
  upsellLink?: string; upsellImage?: string; upsellImageUrl?: string;
  endDate?: string; prizes?: Prize[]; closedRedirectUrl?: string; logoUrl?: string; consolePrize?: { id: string } | null;
  metaPixelId?: string | null; googleAnalyticsId?: string | null; tiktokPixelId?: string | null;
  // Sorteo
  raffleDrawDate?: string; raffleTerms?: string; raffleTermsUrl?: string;
  raffleClaimDays?: number; raffleExecutedAt?: string | null; rafflePrizes?: RafflePrize[];
};
type PrizeResult = {
  isWinner: boolean; prizeTitle?: string; redemptionCode?: string;
  expiresAt?: string; consolePrizeTitle?: string; consolePrizeCoupon?: string;
};

function UpsellBar({ campaign }: { campaign: Campaign }) {
  if (!campaign.upsellEnabled || !campaign.upsellTitle) return null;
  const img = campaign.upsellImageUrl || campaign.upsellImage;
  const link = campaign.upsellLink
    ? (campaign.upsellLink.startsWith('http') ? campaign.upsellLink : 'https://' + campaign.upsellLink)
    : '#';
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      className="block w-full rounded-2xl overflow-hidden shadow-xl mt-6"
      style={{background: 'linear-gradient(135deg, #f59e0b, #d97706)'}}>
      {img && (
        <div className="w-full aspect-square overflow-hidden">
          <img src={img} alt={campaign.upsellTitle} className="w-full h-full object-cover"/>
        </div>
      )}
      <div className="p-4">
        <p className="text-black/70 text-xs font-bold uppercase tracking-widest mb-2">🛍️ Oferta exclusiva para participantes</p>
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-black font-black text-lg truncate">{campaign.upsellTitle}</p>
            {campaign.upsellPrice && (
              <p className="text-black/80 text-sm font-bold mt-0.5">
                {campaign.upsellCurrency} {campaign.upsellPrice.toLocaleString()}
              </p>
            )}
          </div>
          <div className="shrink-0 bg-black text-white font-black text-sm px-6 py-3 rounded-xl">VER →</div>
        </div>
      </div>
    </a>
  );
}

function ScratchCard({ onSpin, onComplete, primaryColor, secondaryColor, attemptsPerSession, winnerSymbol, hasConsolePrize }: { onSpin: () => Promise<boolean>; onComplete: (won: boolean) => void; primaryColor: string; secondaryColor: string; attemptsPerSession: number; winnerSymbol: string; hasConsolePrize: boolean }) {
  const SYMBOLS = ['🍒','🌟','💎','🎯','🍀','🔔','🍋'];
  const [attempt, setAttempt] = useState(0);
  const [currentCard, setCurrentCard] = useState(() => Array.from({length: 3}, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
  const [backendWon, setBackendWon] = useState<boolean|null>(null);
  const [revealedCount, setRevealedCount] = useState(0);
  const [revealing, setRevealing] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [glowing, setGlowing] = useState(false);
  const isMatch = currentCard[0] === currentCard[1] && currentCard[1] === currentCard[2];

  const handleReveal = () => {
    setRevealing(true);
    setTimeout(() => setRevealedCount(1), 400);
    setTimeout(() => setRevealedCount(2), 1400);
    setTimeout(() => {
      setRevealedCount(3);
      setRevealing(false);
      setTimeout(() => {
        setShowResult(true);
        if (currentCard[0] === currentCard[1] && currentCard[1] === currentCard[2]) {
          setGlowing(true);
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 }, colors: [primaryColor, secondaryColor, '#ffffff', '#ffd700'] });
          setTimeout(() => confetti({ particleCount: 80, spread: 60, origin: { y: 0.4 }, colors: [primaryColor, secondaryColor, '#ffffff'] }), 400);
        }
      }, 300);
    }, 2600);
  };

  const handleNext = async () => {
    if (attempt >= attemptsPerSession - 1) {
      const won = await onSpin();
      setBackendWon(won);
      if (won && !isMatch) {
        const winSymbol = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)];
        setCurrentCard([winSymbol, winSymbol, winSymbol]);
        setGlowing(true);
      } else if (!won && isMatch) {
        setCurrentCard([SYMBOLS[0], SYMBOLS[1], SYMBOLS[2]]);
        setGlowing(false);
      }
      setTimeout(() => onComplete(won), won ? 1500 : 0);
    } else {
      setAttempt(a => a + 1);
      setCurrentCard(Array.from({length: 3}, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
      setRevealedCount(0);
      setRevealing(false);
      setShowResult(false);
      setGlowing(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="text-center rounded-2xl p-4 mb-2" style={{background:`linear-gradient(135deg, ${primaryColor}22, ${primaryColor}11)`, border:`1px solid ${primaryColor}40`}}>
        <p className="text-white font-black text-2xl mb-1">🍀 🍀 🍀</p>
        <p className="text-white font-black text-base">¡3 iguales = GANASTE!</p>
        <p className="text-white/50 text-xs mt-1">Destapá las 3 casillas y descubrí si ganaste</p>
      </div>
      <div className="flex gap-4 justify-center">
        {currentCard.map((symbol, i) => (
          <div key={i}
            className="w-28 h-28 rounded-2xl border-2 flex items-center justify-center transition-all duration-500"
            style={{
              borderColor: revealedCount > i ? (glowing ? '#ffd700' : primaryColor) : 'rgba(255,255,255,0.15)',
              background: revealedCount > i ? `linear-gradient(135deg, ${primaryColor}30, ${primaryColor}10)` : 'rgba(255,255,255,0.04)',
              boxShadow: revealedCount > i && glowing ? `0 0 25px ${primaryColor}80, 0 0 50px ${primaryColor}40` : revealedCount > i ? `0 0 15px ${primaryColor}40` : 'none',
              transform: revealedCount > i ? 'scale(1.05)' : 'scale(1)',
            }}>
            <span className={`text-6xl transition-all duration-500 ${revealedCount > i ? 'opacity-100 scale-110' : 'opacity-0 scale-50'}`}>
              {revealedCount > i ? symbol : ''}
            </span>
            {revealedCount <= i && (
              <span className="text-5xl opacity-30">🎴</span>
            )}
          </div>
        ))}
      </div>
      {revealing && revealedCount < 3 && (
        <div className="text-center">
          <p className="text-white/50 text-sm animate-pulse">{'• '.repeat(revealedCount + 1).trim()}</p>
        </div>
      )}
      {showResult && (
        <div className={"text-center p-5 rounded-2xl " + (isMatch ? "bg-green-500/20 border-2 border-green-400/50" : attempt < attemptsPerSession - 1 ? "bg-yellow-500/10 border border-yellow-500/30" : "bg-red-500/10 border border-red-500/20")}>
          {isMatch
            ? <><p className="text-green-400 font-black text-2xl">🎉 ¡GANASTE!</p><p className="text-green-300/70 text-sm mt-1">¡Los 3 símbolos coinciden!</p></>
            : attempt < attemptsPerSession - 1
              ? <><p className="text-yellow-400 font-bold text-lg">😅 No coinciden</p><p className="text-white/50 text-xs mt-1">¡Te queda otro intento!</p></>
              : hasConsolePrize
                ? <><p className="text-white font-bold text-lg">😔 No fue esta vez</p><p className="text-white/50 text-xs mt-1">Pero no te vayas — ¡tenés un regalo esperándote!</p></>
                : <><p className="text-white font-bold text-lg">😔 No fue esta vez</p><p className="text-white/50 text-xs mt-1">¡Mejor suerte la próxima!</p></>
          }
        </div>
      )}
      <div className="flex flex-col gap-3">
        {revealedCount < 3 ? (
          <button onClick={handleReveal} disabled={revealing}
            className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-40"
            style={{background: revealing ? 'rgba(255,255,255,0.1)' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}}>
            {revealing ? <span className="animate-pulse">✨ Destapando...</span> : '✨ ¡Destapar!'}
          </button>
        ) : (
          <button onClick={handleNext}
            className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95"
            style={{background: isMatch ? 'linear-gradient(135deg, #16a34a, #15803d)' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}}>
            {isMatch ? '🎁 Ver mi premio' : attempt >= attemptsPerSession - 1 ? hasConsolePrize ? '🎁 Ver mi regalo' : '➡️ Finalizar' : '🎴 Siguiente tarjeta'}
          </button>
        )}
        <p className="text-white/30 text-xs text-center">Intento {attempt + 1} de {attemptsPerSession}</p>
      </div>
    </div>
  );
}

function SlotsGame({ onSpin, onComplete, primaryColor, secondaryColor }: { onSpin: () => Promise<boolean>; onComplete: (won: boolean) => void; primaryColor: string; secondaryColor: string }) {
  const SYMBOLS = ['🍒','⭐','💎','🎯','🍀','🔔','🍋'];
  const WINNER = '🍀';
  const [reels, setReels] = useState(['🎰','🎰','🎰']);
  const [spinning, setSpinning] = useState(false);
  const [stopped, setStopped] = useState([false,false,false]);
  const [done, setDone] = useState(false);
  const [won, setWon] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const interval0 = useRef<any>(null);
  const interval1 = useRef<any>(null);
  const interval2 = useRef<any>(null);
  const finalReelsRef = useRef<string[]>([]);

  const spin = async () => {
    if (spinning || done) return;
    setSpinning(true);
    setStopped([false,false,false]);
    setShowResult(false);
    const isWin = await onSpin();
    const final = isWin ? [WINNER,WINNER,WINNER] : (() => {
      const r = Array.from({length:3}, () => SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]);
      if (r[0]===r[1] && r[1]===r[2]) r[2] = '🍒';
      return r;
    })();
    finalReelsRef.current = final;
    const cur = ['🎰','🎰','🎰'];
    interval0.current = setInterval(() => { cur[0]=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]; setReels([...cur]); }, 80);
    interval1.current = setInterval(() => { cur[1]=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]; setReels([...cur]); }, 100);
    interval2.current = setInterval(() => { cur[2]=SYMBOLS[Math.floor(Math.random()*SYMBOLS.length)]; setReels([...cur]); }, 120);
    setTimeout(() => { clearInterval(interval0.current); cur[0]=finalReelsRef.current[0]; setReels([...cur]); setStopped([true,false,false]); }, 2500);
    setTimeout(() => { clearInterval(interval1.current); cur[1]=finalReelsRef.current[1]; setReels([...cur]); setStopped([true,true,false]); }, 4500);
    setTimeout(() => {
      clearInterval(interval2.current); cur[2]=finalReelsRef.current[2]; setReels([...cur]); setStopped([true,true,true]);
      setTimeout(() => {
        setSpinning(false); setDone(true); setWon(isWin); setShowResult(true);
        if (isWin) {
          setTimeout(() => confetti({ particleCount: 200, spread: 100, origin: { y: 0.5 }, colors: [primaryColor, secondaryColor, '#ffffff', '#ffd700'] }), 200);
          setTimeout(() => confetti({ particleCount: 100, spread: 70, origin: { y: 0.3 }, colors: [primaryColor, '#ffd700', '#ffffff'] }), 700);
        }
      }, 400);
    }, 6500);
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex gap-3 justify-center">
        {reels.map((symbol, i) => (
          <div key={i} className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center"
            style={{borderColor: stopped[i] ? primaryColor : 'rgba(255,255,255,0.2)', background: stopped[i] ? primaryColor+'20' : 'rgba(255,255,255,0.05)', boxShadow: stopped[i] ? `0 0 15px ${primaryColor}60` : 'none', transition: 'all 0.3s'}}>
            <span className="text-5xl">{symbol}</span>
          </div>
        ))}
      </div>
      {showResult && (
        <div className={`text-center p-4 rounded-2xl ${won ? 'bg-green-500/20 border border-green-500/30' : 'bg-white/5 border border-white/10'}`}>
          {won ? <p className="text-green-400 font-bold text-lg">🎉 ¡Tres tréboles! ¡Ganaste!</p>
                : <p className="text-white/60 text-sm">No coinciden... ¡pero tenés un regalo esperándote!</p>}
        </div>
      )}
      {!done ? (
        <button onClick={spin} disabled={spinning}
          className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-60"
          style={{background: spinning ? '#333' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}}>
          {spinning ? <span className="flex items-center justify-center gap-2"><span className="animate-spin">🌀</span> Girando...</span> : '🎰 ¡Tirar!'}
        </button>
      ) : (
        <button onClick={() => onComplete(won)}
          className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95"
          style={{background: won ? 'linear-gradient(135deg, #16a34a, #15803d)' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}}>
          {won ? '🎁 Ver mi premio' : '🎁 Ver mi regalo'}
        </button>
      )}
    </div>
  );
}


function RaffleFlow({ campaign, slug }: { campaign: Campaign; slug: string }) {
  const [raffleStep, setRaffleStep] = useState<"landing"|"form"|"confirm">("landing");
  const [form, setForm] = useState({ email:"", whatsapp:"", countryCode:"+54", nombre:"" });
  const [formError, setFormError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [registered, setRegistered] = useState<{email:string;nombre:string}|null>(null);

  const now = new Date();
  const endDate = campaign.endDate ? new Date(campaign.endDate) : null;
  const drawDate = campaign.raffleDrawDate ? new Date(campaign.raffleDrawDate) : null;
  const isRegistrationClosed = endDate ? now > endDate : false;
  const isExecuted = !!campaign.raffleExecutedAt;

  const maskedEmail = (email: string) => {
    const [user, domain] = email.split("@");
    return user.slice(0,3) + "***@" + domain;
  };

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setRegistering(true);
    if (!termsAccepted) { setFormError("Debés aceptar los términos y condiciones"); setRegistering(false); return; }
    try {
      const res = await fetch("/api/play/register", { method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ campaignId: campaign.id, email: form.email, whatsapp: form.countryCode+form.whatsapp, extraFields: { nombre: form.nombre } }) });
      const data = await res.json();
      if (!res.ok) { setFormError(data.error||"Error al registrarse"); setRegistering(false); return; }
      trackLead();
      setRegistered({ email: form.email, nombre: form.nombre });
      setRaffleStep("confirm");
    } catch { setFormError("Error de conexión"); }
    setRegistering(false);
  }

  // Vista: sorteo ya ejecutado — mostrar ganadores públicos
  if (isExecuted) {
    return (
      <div className="space-y-6">
        <div className="text-center p-6 rounded-2xl" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}22, ${campaign.primaryColor}11)`, border:`1px solid ${campaign.primaryColor}40`}}>
          <p className="text-white font-black text-2xl mb-1">🎉 ¡El sorteo ya se realizó!</p>
          <p className="text-white/60 text-sm">Ejecutado el {new Date(campaign.raffleExecutedAt!).toLocaleDateString("es-AR", {day:"numeric",month:"long",year:"numeric"})}</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3">
          <p className="text-white font-bold">🏆 Ganadores</p>
          <p className="text-white/50 text-sm">Los ganadores fueron notificados por email con su código de canje.</p>
          <p className="text-white/30 text-xs">Si creés que debés haber ganado, contactá al organizador.</p>
        </div>
        <a href={`/terminos/${slug}`} target="_blank" rel="noopener noreferrer" className="block text-center text-violet-400 text-sm underline">Ver términos y condiciones</a>
      </div>
    );
  }

  // Vista: registro cerrado pero sorteo no ejecutado
  if (isRegistrationClosed && !isExecuted) {
    return (
      <div className="space-y-6 text-center">
        <div className="text-6xl">⏳</div>
        <div>
          <p className="text-white font-black text-xl">Registro cerrado</p>
          <p className="text-white/60 text-sm mt-2">El período de inscripción ha finalizado.</p>
          {drawDate && <p className="text-white/50 text-sm mt-1">El sorteo se realizará el {drawDate.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p>}
        </div>
        <a href={`/terminos/${slug}`} target="_blank" rel="noopener noreferrer" className="block text-center text-violet-400 text-sm underline">Ver términos y condiciones</a>
      </div>
    );
  }

  // PASO A — Landing
  if (raffleStep === "landing") {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl p-5 text-center" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}22, ${campaign.primaryColor}11)`, border:`1px solid ${campaign.primaryColor}40`}}>
          <p className="text-white font-black text-xl mb-1">🎲 Gran Sorteo</p>
          <p className="text-white/60 text-sm">Participá gratuitamente y podés ganar</p>
        </div>
        {campaign.rafflePrizes && campaign.rafflePrizes.length > 0 && (
          <div className="space-y-3">
            <p className="text-white/40 text-xs uppercase tracking-widest text-center">Premios a sortear</p>
            {campaign.rafflePrizes.map((prize) => (
              <div key={prize.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                {prize.imageUrl && <div className="w-full aspect-video overflow-hidden max-h-48"><img src={prize.imageUrl} alt={prize.title} className="w-full h-full object-cover"/></div>}
                <div className="p-4">
                  <p className="text-white font-bold">{prize.title}</p>
                  {prize.description && <p className="text-white/50 text-sm mt-1">{prize.description}</p>}
                  {prize.stock > 1 && <p className="text-white/30 text-xs mt-1">{prize.stock} ganadores</p>}
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm">
          {endDate && <div className="flex items-center gap-2"><span className="text-white/40">📅 Cierre de inscripción:</span><span className="text-white font-medium">{endDate.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric"})}</span></div>}
          {drawDate && <div className="flex items-center gap-2"><span className="text-white/40">🎲 Fecha del sorteo:</span><span className="text-white font-medium">{drawDate.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</span></div>}
        </div>
        <button onClick={()=>setRaffleStep("form")}
          className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95"
          style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
          🎯 ¡Quiero participar!
        </button>
        <a href={`/terminos/${slug}`} target="_blank" rel="noopener noreferrer" className="block text-center text-violet-400 text-sm underline">Ver términos y condiciones</a>
      </div>
    );
  }

  // PASO B — Formulario
  if (raffleStep === "form") {
    return (
      <form onSubmit={handleRegister} className="space-y-4">
        <p className="text-white font-bold text-lg">Completá tus datos</p>
        <input required type="text" placeholder="Nombre completo" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
        <input required type="email" placeholder="Email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
          style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
        <div style={{display:"flex",gap:"0.5rem"}}>
          <select value={form.countryCode} onChange={e=>setForm(p=>({...p,countryCode:e.target.value}))} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",outline:"none",flexShrink:0}}>
            <option value="+54">🇦🇷 +54</option><option value="+55">🇧🇷 +55</option><option value="+56">🇨🇱 +56</option>
            <option value="+57">🇨🇴 +57</option><option value="+52">🇲🇽 +52</option><option value="+51">🇵🇪 +51</option>
            <option value="+598">🇺🇾 +598</option><option value="+595">🇵🇾 +595</option><option value="+591">🇧🇴 +591</option>
            <option value="+593">🇪🇨 +593</option><option value="+34">🇪🇸 +34</option><option value="+1">🇺🇸 +1</option>
          </select>
          <input required type="tel" placeholder="WhatsApp" value={form.whatsapp} onChange={e=>setForm(p=>({...p,whatsapp:e.target.value}))}
            style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",outline:"none",flex:1}}/>
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" required checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-violet-500 shrink-0"/>
          <span className="text-white/60 text-sm">
            Al participar acepto los{" "}
            <a href={`/terminos/${slug}`} target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">
              términos y condiciones
            </a>
            {" "}del sorteo
          </span>
        </label>
        {formError && <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3"><span>⚠️</span><p className="text-red-400 text-sm">{formError}</p></div>}
        <button type="submit" disabled={registering || !termsAccepted}
          className="w-full py-5 rounded-2xl font-black text-white text-lg shadow-xl transition-all active:scale-95 disabled:opacity-50"
          style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
          {registering ? "⏳ Un momento..." : "✅ Confirmar participación"}
        </button>
        <button type="button" onClick={()=>setRaffleStep("landing")} className="w-full py-3 rounded-xl text-white/40 text-sm hover:text-white/60 transition-colors">← Volver</button>
      </form>
    );
  }

  // PASO C — Confirmación
  return (
    <div className="space-y-6 text-center">
      <div className="text-7xl animate-bounce">🎉</div>
      <div>
        <p className="text-white font-black text-2xl">¡Ya estás participando!</p>
        <p className="text-white/60 text-sm mt-2">Tu inscripción fue registrada correctamente</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-3 text-left">
        {registered?.nombre && <div><p className="text-white/40 text-xs">Nombre</p><p className="text-white font-medium">{registered.nombre}</p></div>}
        <div><p className="text-white/40 text-xs">Email</p><p className="text-white font-medium">{registered?.email}</p></div>
        {campaign.rafflePrizes && campaign.rafflePrizes.length > 0 && (
          <div>
            <p className="text-white/40 text-xs mb-2">Premios a sortear</p>
            {campaign.rafflePrizes.map(p=><p key={p.id} className="text-white/70 text-sm">🏆 {p.title}</p>)}
          </div>
        )}
        {drawDate && <div><p className="text-white/40 text-xs">Fecha del sorteo</p><p className="text-white font-medium">{drawDate.toLocaleDateString("es-AR",{day:"numeric",month:"long",year:"numeric",hour:"2-digit",minute:"2-digit"})}</p></div>}
      </div>
      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl p-4">
        <p className="text-violet-300 text-sm">📧 Si eres ganador/a, recibirás un email con tu código de canje</p>
      </div>
      {campaign.closedRedirectUrl && (
        <a href={campaign.closedRedirectUrl} target="_blank" rel="noopener noreferrer"
          className="w-full py-4 rounded-2xl font-bold text-white text-center block transition-all active:scale-95"
          style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
          Ir al sitio →
        </a>
      )}
      <UpsellBar campaign={campaign}/>
    </div>
  );
}

export default function PlayPage() {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"form"|"game"|"result">("form");
  const [leadId, setLeadId] = useState("");
  const [prizeResult, setPrizeResult] = useState<PrizeResult | null>(null);
  const [form, setForm] = useState({email:"", whatsapp:"", countryCode:"+54", extra:{} as Record<string,string>});
  const [formError, setFormError] = useState("");
  const [registering, setRegistering] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(()=>{
    fetch(`/api/play/campaign?slug=${slug}`)
      .then(r=>r.json()).then(d=>{setCampaign(d);setLoading(false);}).catch(()=>setLoading(false));
  },[slug]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setRegistering(true);
    if (!termsAccepted) { setFormError("Debés aceptar los términos y condiciones"); setRegistering(false); return; }
    try {
      const res = await fetch("/api/play/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:campaign!.id,email:form.email,whatsapp:form.countryCode+form.whatsapp,extraFields:form.extra})});
      const data = await res.json();
      if (!res.ok) { setFormError(data.error||"Error al registrarse"); setRegistering(false); return; }
      setLeadId(data.leadId); trackLead(); setStep("game");
    } catch { setFormError("Error de conexión"); }
    setRegistering(false);
  }

  async function handleSpin(): Promise<boolean> {
    const res = await fetch("/api/play/scratch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:campaign!.id,leadId})});
    const data = await res.json();
    if (data.prizeResult) {
      setPrizeResult(data.prizeResult);
      return data.prizeResult.isWinner;
    }
    return false;
  }
  function handleScratchComplete(won: boolean) {
    if (won) trackWin();
    setStep("result");
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-full border-4 border-yellow-400 border-t-transparent animate-spin"/>
        <p className="text-white/50 text-sm">Cargando juego...</p>
      </div>
    </div>
  );

  if (!campaign) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center"><div className="text-5xl mb-4">😕</div><p className="text-white text-xl font-bold">Campaña no encontrada</p></div>
    </div>
  );

  // Flujo especial para SORTEO
  if (campaign.gameType === "SORTEO") {
    return (
      <div className="min-h-screen flex flex-col" style={{backgroundColor:campaign.backgroundColor}}>
        <TrackingPixels metaPixelId={campaign.metaPixelId} googleAnalyticsId={campaign.googleAnalyticsId} tiktokPixelId={campaign.tiktokPixelId} />
        <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-10">
          <div className="text-center mb-6">
            {campaign.logoUrl ? (
              <img src={campaign.logoUrl} className="w-16 h-16 object-contain rounded-xl mb-2 mx-auto" alt="logo"/>
            ) : (
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
                style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
                <span className="text-3xl">🎲</span>
              </div>
            )}
            <h1 className="text-white text-2xl font-black tracking-tight">{campaign.name}</h1>
          </div>
          <RaffleFlow campaign={campaign} slug={slug as string}/>
        </div>
        <footer className="text-center py-6 mt-4">
  <a href="https://jugalo.app" target="_blank" rel="noopener noreferrer" className="text-white/20 text-xs hover:text-white/40 transition-colors">
    Powered by jugalo.app
  </a>
</footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:campaign.backgroundColor}}>
      <TrackingPixels metaPixelId={campaign.metaPixelId} googleAnalyticsId={campaign.googleAnalyticsId} tiktokPixelId={campaign.tiktokPixelId} />
      <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-10">

        <div className="text-center mb-6">
          {campaign.logoUrl ? (
            <img src={campaign.logoUrl} className="w-16 h-16 object-contain rounded-xl mb-2 mx-auto" alt="logo"/>
          ) : (
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
              style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
              <span className="text-3xl">{campaign.gameType==="SLOTS"?"🎰":"🎫"}</span>
            </div>
          )}
          <h1 className="text-white text-2xl font-black tracking-tight">{campaign.name}</h1>
          <p className="text-white/40 text-sm mt-1">
            {step==="form"?"¡Completá tus datos y participá!":step==="game"?"¡Descubrí tu premio!":"Resultado de tu participación"}
          </p>
        </div>

        {step==="form" && (
          <div className="space-y-5">
            <div className="rounded-2xl p-5 mb-2 text-center" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}22, ${campaign.secondaryColor}22)`, border:`1px solid ${campaign.primaryColor}40`}}>
              <p className="text-white font-black text-lg mb-1">🎯 ¿Cómo participar?</p>
              <p className="text-white/70 text-sm leading-relaxed">
                Completá tus datos, {campaign.gameType==="SLOTS"?"tirá los rodillos y descubrí si ganaste":"destapá las casillas y descubrí si ganaste"}. ¡Tenés {campaign.attemptsPerSession} {campaign.attemptsPerSession===1?"intento":"intentos"}!
              </p>
            </div>
            <form onSubmit={handleRegister} className="space-y-3">
              <input required type="email" placeholder="Tu email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
              <div style={{display:"flex",gap:"0.5rem"}}>
                <select value={form.countryCode} onChange={e=>setForm(p=>({...p,countryCode:e.target.value}))} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",outline:"none",flexShrink:0}}>
                  <option value="+54">🇦🇷 +54</option>
                  <option value="+55">🇧🇷 +55</option>
                  <option value="+56">🇨🇱 +56</option>
                  <option value="+57">🇨🇴 +57</option>
                  <option value="+52">🇲🇽 +52</option>
                  <option value="+51">🇵🇪 +51</option>
                  <option value="+598">🇺🇾 +598</option>
                  <option value="+595">🇵🇾 +595</option>
                  <option value="+591">🇧🇴 +591</option>
                  <option value="+593">🇪🇨 +593</option>
                  <option value="+34">🇪🇸 +34</option>
                  <option value="+1">🇺🇸 +1</option>
                </select>
                <input required type="tel" placeholder="Número WhatsApp" value={form.whatsapp} onChange={e=>setForm(p=>({...p,whatsapp:e.target.value}))} style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",outline:"none",flex:1}}/>
              </div>
              {campaign.formFields?.map((field:any)=>(
                <input key={field.id} type={field.type||"text"} required={field.required} placeholder={field.label} value={form.extra[field.id]||""}
                  onChange={e=>setForm(p=>({...p,extra:{...p.extra,[field.id]:e.target.value}}))}
                  style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
              ))}
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" required checked={termsAccepted} onChange={e=>setTermsAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-violet-500 shrink-0"/>
                <span className="text-white/60 text-sm">Acepto los <a href={`/terminos/${slug}`} target="_blank" rel="noopener noreferrer" className="text-violet-400 underline hover:text-violet-300">términos y condiciones</a> y recibir comunicaciones al email ingresado</span>
              </label>
              {formError && <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3"><span>⚠️</span><p className="text-red-400 text-sm">{formError}</p></div>}
              <button type="submit" disabled={registering || !termsAccepted}
                className="w-full py-5 rounded-2xl font-black text-white text-lg shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-2"
                style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
                {registering?"⏳ Un momento...":"¡Quiero participar! 🎯"}
              </button>
            </form>
            {campaign.prizes && campaign.prizes.filter((p:any)=>p.stock>p.deliveredCount).length>0 && (
              <div className="space-y-3">
                <p className="text-white/40 text-xs text-center uppercase tracking-widest">Premios disponibles</p>
                {campaign.prizes.filter((p:any)=>p.stock>p.deliveredCount).slice(0,1).map((prize:any,i:number)=>(
                  <div key={i} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    {prize.prizeImage && <div className="w-full aspect-square overflow-hidden max-h-72"><img src={prize.prizeImage} alt={prize.title} className="w-full h-full object-cover"/></div>}
                    <div className="p-4">
                      <p className="text-white font-bold text-base">{prize.title}</p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-white/40 text-xs">Válido por {prize.validDays} días</p>
                        <p className="text-white/30 text-xs">{prize.stock-prize.deliveredCount} restantes</p>
                      </div>
                    </div>
                  </div>
                ))}
                {campaign.endDate && <p className="text-white/30 text-xs text-center">⏰ Válido hasta {new Date(campaign.endDate).toLocaleDateString("es-AR")}</p>}
              </div>
            )}
          </div>
        )}

        {step==="game" && (
          <div className="flex flex-col items-center gap-5">
            {campaign.gameType==="SLOTS" ? (
              <SlotsGame primaryColor={campaign.primaryColor} secondaryColor={campaign.secondaryColor} onSpin={handleSpin} onComplete={handleScratchComplete}/>
            ) : (
              <ScratchCard primaryColor={campaign.primaryColor} secondaryColor={campaign.secondaryColor} attemptsPerSession={campaign.attemptsPerSession} onSpin={handleSpin} onComplete={handleScratchComplete} winnerSymbol="🍀" hasConsolePrize={!!campaign.consolePrize}/>
            )}
            <UpsellBar campaign={campaign}/>
          </div>
        )}

        {step==="result" && prizeResult && (
          <div className="flex flex-col items-center gap-5 text-center">
            {prizeResult.isWinner ? (
              <>
                <div className="relative"><div className="text-8xl animate-bounce">🏆</div></div>
                <div>
                  <p className="text-yellow-400 font-black text-4xl tracking-tight">¡GANASTE!</p>
                  <p className="text-white/50 text-sm mt-2">Tu premio te espera 🎉</p>
                </div>
                <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 space-y-4">
                  <p className="text-white font-black text-xl">{prizeResult.prizeTitle}</p>
                  <div className="flex justify-center p-4 bg-white rounded-2xl">
                    <QRCodeSVG value={`https://jugalo.app/staff`} size={160} bgColor="white" fgColor="#111"/>
                  </div>
                  <div className="bg-black/30 rounded-xl px-4 py-3">
                    <p className="text-white/40 text-xs mb-1">Código de canje</p>
                    <p className="text-white font-mono font-bold tracking-widest text-sm">{prizeResult.redemptionCode}</p>
                  </div>
                  {prizeResult.expiresAt && (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
                      <p className="text-yellow-400 text-sm font-bold">⏰ Válido para canjear hasta:</p>
                      <p className="text-white font-bold text-base mt-1">{new Date(prizeResult.expiresAt).toLocaleDateString("es-AR", {day:"numeric",month:"long",year:"numeric"})}</p>
                    </div>
                  )}
                </div>
                <p className="text-white/40 text-xs">📧 Enviamos el premio a tu email</p>
                {campaign.closedRedirectUrl && <a href={campaign.closedRedirectUrl} className="w-full py-4 rounded-2xl font-bold text-white text-center block" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>Ir al sitio →</a>}
              </>
            ) : (
              <>
                <div className="text-7xl">🙌</div>
                {prizeResult.consolePrizeTitle ? (
                  <>
                    <div>
                      <p className="text-white font-black text-2xl">Esta vez no fue...</p>
                      <p className="text-white/50 text-sm mt-1">Tenés un regalo especial para vos</p>
                    </div>
                    <div className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 space-y-3">
                      <p className="text-white font-bold text-lg">{prizeResult.consolePrizeTitle}</p>
                      {prizeResult.consolePrizeCoupon && (
                        <div className="border-2 border-dashed rounded-2xl px-6 py-5" style={{borderColor:`${campaign.primaryColor}60`}}>
                          <p className="text-white/40 text-xs mb-2">Tu código especial</p>
                          <p className="font-mono font-black text-2xl tracking-widest" style={{color:campaign.secondaryColor}}>{prizeResult.consolePrizeCoupon}</p>
                        </div>
                      )}
                    </div>
                    <p className="text-white/40 text-xs">📧 Enviamos tu código al email</p>
                  </>
                ) : (
                  <div className="text-center">
                    <p className="text-white font-black text-2xl">Esta vez no fue...</p>
                    <p className="text-white/50 text-sm mt-2">Cada intento es una nueva oportunidad. ¡Volvé pronto!</p>
                  </div>
                )}
                {campaign.closedRedirectUrl && <a href={campaign.closedRedirectUrl} className="w-full py-4 rounded-2xl font-bold text-white text-center block" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>Ir al sitio →</a>}
              </>
            )}
            <UpsellBar campaign={campaign}/>
          </div>
        )}
      </div>
      <footer className="text-center py-6 mt-4">
  <a href="https://jugalo.app" target="_blank" rel="noopener noreferrer" className="text-white/20 text-xs hover:text-white/40 transition-colors">
    Powered by jugalo.app
  </a>
</footer>
    </div>
  );
}
