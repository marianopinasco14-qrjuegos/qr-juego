"use client";
import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";

type Prize = { title: string; stock: number; validDays: number; deliveredCount: number; prizeImage?: string };
type Campaign = {
  id: string; name: string; gameType: string; primaryColor: string;
  secondaryColor: string; backgroundColor: string; language: string;
  attemptsPerSession: number; formFields: any[]; upsellEnabled: boolean;
  upsellTitle?: string; upsellPrice?: number; upsellCurrency?: string;
  upsellLink?: string; upsellImage?: string; upsellImageUrl?: string;
  endDate?: string; prizes?: Prize[]; closedRedirectUrl?: string;
};
type PrizeResult = {
  isWinner: boolean; prizeTitle?: string; redemptionCode?: string;
  expiresAt?: string; consolePrizeTitle?: string; consolePrizeCoupon?: string;
};

function UpsellBar({ campaign }: { campaign: Campaign }) {
  if (!campaign.upsellEnabled || !campaign.upsellTitle) return null;
  const img = campaign.upsellImage || campaign.upsellImageUrl;
  const link = campaign.upsellLink
    ? (campaign.upsellLink.startsWith('http') ? campaign.upsellLink : 'https://' + campaign.upsellLink)
    : '#';
  return (
    <a href={link} target="_blank" rel="noopener noreferrer"
      className="block w-full rounded-2xl overflow-hidden border border-yellow-400/30 shadow-xl mt-6"
      style={{background: 'linear-gradient(135deg, #1a1a2e, #16213e)'}}>
      {img && (
        <div className="w-full aspect-square overflow-hidden">
          <img src={img} alt={campaign.upsellTitle} className="w-full h-full object-cover"/>
        </div>
      )}
      <div className="p-4 flex items-center justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-yellow-300 font-black text-base truncate">🔥 {campaign.upsellTitle}</p>
          {campaign.upsellPrice && (
            <p className="text-yellow-400 text-sm font-bold mt-0.5">
              {campaign.upsellCurrency} {campaign.upsellPrice.toLocaleString()}
              <span className="text-yellow-400/60 font-normal"> · Oferta exclusiva</span>
            </p>
          )}
        </div>
        <div className="shrink-0 bg-yellow-400 text-gray-900 font-black text-sm px-4 py-2 rounded-xl">VER →</div>
      </div>
    </a>
  );
}

function ScratchCard({ onComplete, primaryColor, secondaryColor, attemptsPerSession }: { onComplete: (won: boolean) => void; primaryColor: string; secondaryColor: string; attemptsPerSession: number }) {
  const SYMBOLS = ['🍒','🌟','💎','🎯','🍀'];
  const [attempt, setAttempt] = useState(0);
  const [currentCard, setCurrentCard] = useState(() => Array.from({length: 3}, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
  const [revealed, setRevealed] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const isMatch = currentCard[0] === currentCard[1] && currentCard[1] === currentCard[2];

  const handleReveal = () => { setRevealed(true); setShowResult(true); };

  const handleNext = async () => {
    if (isMatch || attempt >= attemptsPerSession - 1) {
      await onComplete(isMatch);
    } else {
      setAttempt(a => a + 1);
      setCurrentCard(Array.from({length: 3}, () => SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]));
      setRevealed(false);
      setShowResult(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex gap-3 justify-center">
        {currentCard.map((symbol, i) => (
          <div key={i} className="w-24 h-24 rounded-2xl border-2 flex items-center justify-center"
            style={{borderColor: primaryColor + '60', background: revealed ? primaryColor + '20' : 'rgba(255,255,255,0.05)'}}>
            <span className="text-5xl">{revealed ? symbol : '🎴'}</span>
          </div>
        ))}
      </div>
      {showResult && (
        <div className={"text-center p-4 rounded-2xl " + (isMatch ? "bg-green-500/20 border border-green-500/30" : "bg-white/5 border border-white/10")}>
          {isMatch
            ? <p className="text-green-400 font-bold text-lg">🎉 ¡Ganaste! Los 3 símbolos coinciden</p>
            : <p className="text-white/60 text-sm">{attempt < attemptsPerSession - 1 ? '¡No coinciden! Tenés otro intento' : 'No coinciden, pero tenés un regalo'}</p>
          }
        </div>
      )}
      <div className="flex flex-col gap-3">
        {!revealed ? (
          <button onClick={handleReveal}
            className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95"
            style={{background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}}>
            ✨ ¡Descubrir!
          </button>
        ) : (
          <button onClick={handleNext}
            className="w-full py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95"
            style={{background: isMatch ? 'linear-gradient(135deg, #16a34a, #15803d)' : `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`}}>
            {isMatch || attempt >= attemptsPerSession - 1 ? '🎁 Ver mi premio' : '🎰 Siguiente intento'}
          </button>
        )}
        <p className="text-white/30 text-xs text-center">Intento {attempt + 1} de {attemptsPerSession}</p>
      </div>
    </div>
  );
}

function SlotsGame({ onComplete, primaryColor, secondaryColor }: { onComplete: (won: boolean) => void; primaryColor: string; secondaryColor: string }) {
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

  const spin = () => {
    if (spinning || done) return;
    setSpinning(true);
    setStopped([false,false,false]);
    setShowResult(false);
    const isWin = Math.random() < 0.3;
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
      setTimeout(() => { setSpinning(false); setDone(true); setWon(isWin); setShowResult(true); }, 400);
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
                : <p className="text-white/60 text-sm">No coinciden... ¡Mejor suerte la próxima!</p>}
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
          {won ? '🎁 Ver mi premio' : '🎟️ Ver mi regalo'}
        </button>
      )}
    </div>
  );
}

const ROULETTE_NUMBERS = [0,32,15,19,4,21,2,25,17,34,6,27,13,36,11,30,8,23,10,5,24,16,33,1,20,14,31,9,22,18,29,7,28,12,35,3,26];
const RED_NUMBERS = new Set([1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36]);

function RouletteWheel({ spinning, onSpinEnd, primaryColor }: { spinning: boolean; onSpinEnd: () => void; primaryColor: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);
  const animFrameRef = useRef<number>(0);
  const hasEndedRef = useRef(false);

  const drawWheel = (angle: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    const cx = canvas.width/2, cy = canvas.height/2;
    const outerR = cx-4, innerR = cx-36, numberR = cx-22;
    const total = ROULETTE_NUMBERS.length;
    const sliceAngle = (2*Math.PI)/total;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    ctx.beginPath(); ctx.arc(cx,cy,outerR+6,0,2*Math.PI); ctx.fillStyle="#b8860b"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,outerR,0,2*Math.PI); ctx.fillStyle="#1a1a1a"; ctx.fill();
    for (let i=0; i<total; i++) {
      const startA = angle+i*sliceAngle-Math.PI/2;
      const endA = startA+sliceAngle;
      const num = ROULETTE_NUMBERS[i];
      ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,outerR,startA,endA); ctx.closePath();
      ctx.fillStyle = num===0?"#16a34a":RED_NUMBERS.has(num)?"#dc2626":"#1c1c1c";
      ctx.fill(); ctx.strokeStyle="rgba(255,215,0,0.4)"; ctx.lineWidth=0.8; ctx.stroke();
      const textAngle = startA+sliceAngle/2;
      const tx=cx+numberR*Math.cos(textAngle), ty=cy+numberR*Math.sin(textAngle);
      ctx.save(); ctx.translate(tx,ty); ctx.rotate(textAngle+Math.PI/2);
      ctx.fillStyle="white"; ctx.font="bold 9px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
      ctx.fillText(String(num),0,0); ctx.restore();
    }
    ctx.beginPath(); ctx.arc(cx,cy,innerR,0,2*Math.PI);
    const grad=ctx.createRadialGradient(cx,cy,0,cx,cy,innerR);
    grad.addColorStop(0,"#2d2d2d"); grad.addColorStop(1,"#0d0d0d");
    ctx.fillStyle=grad; ctx.fill(); ctx.strokeStyle="#b8860b"; ctx.lineWidth=3; ctx.stroke();
    ctx.beginPath(); ctx.arc(cx,cy,20,0,2*Math.PI); ctx.fillStyle="#b8860b"; ctx.fill();
    ctx.beginPath(); ctx.arc(cx,cy,14,0,2*Math.PI); ctx.fillStyle="#111"; ctx.fill();
    ctx.fillStyle="#ffd700"; ctx.font="bold 14px Arial"; ctx.textAlign="center"; ctx.textBaseline="middle";
    ctx.fillText("★",cx,cy);
  };

  useEffect(()=>{drawWheel(angleRef.current);},[]);
  useEffect(()=>{
    if (!spinning) return;
    hasEndedRef.current=false;
    velocityRef.current=0.4+Math.random()*0.2;
    const animate=()=>{
      velocityRef.current*=0.992;
      angleRef.current+=velocityRef.current;
      drawWheel(angleRef.current);
      if (velocityRef.current>0.003) { animFrameRef.current=requestAnimationFrame(animate); }
      else { if (!hasEndedRef.current) { hasEndedRef.current=true; onSpinEnd(); } }
    };
    animFrameRef.current=requestAnimationFrame(animate);
    return ()=>cancelAnimationFrame(animFrameRef.current);
  },[spinning]);

  return (
    <div className="relative flex items-center justify-center">
      <div className="absolute inset-0 rounded-full blur-3xl opacity-30" style={{background:`radial-gradient(circle, ${primaryColor}, transparent)`}}/>
      <canvas ref={canvasRef} width={320} height={320} className="relative drop-shadow-2xl rounded-full"/>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
        <div className="flex flex-col items-center">
          <div className="w-4 h-4 rounded-full bg-white shadow-lg border-2 border-yellow-400"/>
          <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[12px] border-l-transparent border-r-transparent border-t-white"/>
        </div>
      </div>
    </div>
  );
}

export default function PlayPage() {
  const { slug } = useParams();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"form"|"game"|"result">("form");
  const [leadId, setLeadId] = useState("");
  const [attempt, setAttempt] = useState(0);
  const [prizeResult, setPrizeResult] = useState<PrizeResult | null>(null);
  const [spinning, setSpinning] = useState(false);
  const [showBetweenResult, setShowBetweenResult] = useState(false);
  const [form, setForm] = useState({email:"", whatsapp:"", extra:{} as Record<string,string>});
  const [formError, setFormError] = useState("");
  const [registering, setRegistering] = useState(false);
  const apiResultRef = useRef<any>(null);

  useEffect(()=>{
    fetch(`/api/play/campaign?slug=${slug}`)
      .then(r=>r.json()).then(d=>{setCampaign(d);setLoading(false);}).catch(()=>setLoading(false));
  },[slug]);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault(); setFormError(""); setRegistering(true);
    try {
      const res = await fetch("/api/play/register",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:campaign!.id,email:form.email,whatsapp:form.whatsapp,extraFields:form.extra})});
      const data = await res.json();
      if (!res.ok) { setFormError(data.error||"Error al registrarse"); setRegistering(false); return; }
      setLeadId(data.leadId); setStep("game");
    } catch { setFormError("Error de conexión"); }
    setRegistering(false);
  }

  async function handleSpin() {
    if (spinning||attempt>=campaign!.attemptsPerSession||showBetweenResult) return;
    const nextAttempt=attempt+1; setAttempt(nextAttempt); setSpinning(true); setShowBetweenResult(false); apiResultRef.current=null;
    fetch("/api/play/spin",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:campaign!.id,leadId,attemptNumber:nextAttempt})}).then(r=>r.json()).then(data=>{apiResultRef.current=data;}).catch(()=>{});
  }

  function handleSpinEnd() {
    setSpinning(false);
    const check=()=>{
      if (apiResultRef.current) {
        const data=apiResultRef.current;
        if (data.isLastAttempt) { setPrizeResult(data.prizeResult); setTimeout(()=>setStep("result"),600); }
        else { setShowBetweenResult(true); }
      } else { setTimeout(check,300); }
    };
    setTimeout(check,300);
  }

  async function handleScratchComplete(playerWon: boolean) {
    const res = await fetch("/api/play/scratch",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({campaignId:campaign!.id,leadId,playerWon})});
    const data = await res.json();
    if (data.prizeResult) { setPrizeResult(data.prizeResult); setStep("result"); }
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

  return (
    <div className="min-h-screen flex flex-col" style={{backgroundColor:campaign.backgroundColor}}>
      <div className="flex-1 max-w-md mx-auto w-full px-5 pt-8 pb-10">

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-xl"
            style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
            <span className="text-3xl">{campaign.gameType==="RULETA"?"🎡":campaign.gameType==="SLOTS"?"🎰":"🎫"}</span>
          </div>
          <h1 className="text-white text-2xl font-black tracking-tight">{campaign.name}</h1>
          <p className="text-white/40 text-sm mt-1">
            {step==="form"?"¡Completá tus datos y participá!":step==="game"?"¡Descubrí tu premio!":"Resultado de tu participación"}
          </p>
        </div>

        {step==="form" && (
          <div className="space-y-5">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <p className="text-white/80 text-sm leading-relaxed">
                🎯 <strong className="text-white">¿Cómo participar?</strong><br/>
                Completá tus datos, {campaign.gameType==="RASCA_Y_GANA"?"descubrí las casillas":campaign.gameType==="SLOTS"?"tirá los rodillos":"girá la ruleta"} y descubrí si ganaste. ¡Tenés {campaign.attemptsPerSession} {campaign.attemptsPerSession===1?"intento":"intentos"}!
              </p>
            </div>
            <form onSubmit={handleRegister} className="space-y-3">
              <input required type="email" placeholder="Tu email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))}
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
              <input required type="tel" placeholder="WhatsApp (ej: 1123456789)" value={form.whatsapp} onChange={e=>setForm(p=>({...p,whatsapp:e.target.value}))}
                style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
              {campaign.formFields?.map((field:any)=>(
                <input key={field.id} type={field.type||"text"} required={field.required} placeholder={field.label} value={form.extra[field.id]||""}
                  onChange={e=>setForm(p=>({...p,extra:{...p.extra,[field.id]:e.target.value}}))}
                  style={{background:"rgba(255,255,255,0.08)",border:"1px solid rgba(255,255,255,0.15)",borderRadius:"1rem",padding:"1rem",color:"white",fontSize:"0.875rem",width:"100%",outline:"none"}}/>
              ))}
              {formError && <div className="flex items-center gap-2 bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3"><span>⚠️</span><p className="text-red-400 text-sm">{formError}</p></div>}
              <button type="submit" disabled={registering}
                className="w-full py-5 rounded-2xl font-black text-white text-lg shadow-xl transition-all active:scale-95 disabled:opacity-50 mt-2"
                style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
                {registering?"⏳ Un momento...":"¡Quiero participar! 🎯"}
              </button>
              <p className="text-white/20 text-xs text-center">Al participar aceptás recibir comunicaciones al email ingresado</p>
            </form>
            {campaign.prizes && campaign.prizes.filter((p:any)=>p.stock>p.deliveredCount).length>0 && (
              <div className="space-y-3">
                <p className="text-white/40 text-xs text-center uppercase tracking-widest">Premios disponibles</p>
                {campaign.prizes.filter((p:any)=>p.stock>p.deliveredCount).map((prize:any,i:number)=>(
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
            <UpsellBar campaign={campaign}/>
          </div>
        )}

        {step==="game" && (
          <div className="flex flex-col items-center gap-5">
            {campaign.gameType==="SLOTS" ? (
              <SlotsGame primaryColor={campaign.primaryColor} secondaryColor={campaign.secondaryColor} onComplete={handleScratchComplete}/>
            ) : campaign.gameType==="RASCA_Y_GANA" ? (
              <ScratchCard primaryColor={campaign.primaryColor} secondaryColor={campaign.secondaryColor} attemptsPerSession={campaign.attemptsPerSession} onComplete={handleScratchComplete}/>
            ) : (
              <RouletteWheel spinning={spinning} onSpinEnd={handleSpinEnd} primaryColor={campaign.primaryColor}/>
            )}
            {campaign.gameType==="RULETA" && (
              <>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-2">
                    {Array.from({length:campaign.attemptsPerSession},(_,i)=>(
                      <div key={i} className={`w-4 h-4 rounded-full transition-all duration-500 ${i<attempt?"scale-110":"opacity-20"}`}
                        style={{backgroundColor:i<attempt?campaign.primaryColor:"white",boxShadow:i<attempt?`0 0 8px ${campaign.primaryColor}`:"none"}}/>
                    ))}
                  </div>
                  <p className="text-white/40 text-xs">Intento {attempt} de {campaign.attemptsPerSession}</p>
                </div>
                {showBetweenResult && !spinning && (
                  <div className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center">
                    <p className="text-4xl mb-2">😤</p>
                    <p className="text-white font-bold text-lg">¡Casi, casi!</p>
                    <p className="text-white/50 text-sm mt-1">La suerte está de tu lado... ¡intentalo de nuevo!</p>
                  </div>
                )}
                <button onClick={()=>{setShowBetweenResult(false);handleSpin();}}
                  disabled={spinning||attempt>=campaign.attemptsPerSession}
                  className="w-full max-w-xs py-5 rounded-2xl font-black text-white text-xl shadow-2xl transition-all active:scale-95 disabled:opacity-40"
                  style={{background:spinning?"#333":`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>
                  {spinning?<span className="flex items-center justify-center gap-2"><span className="animate-spin">🌀</span> Girando...</span>:showBetweenResult?"🎰 ¡Volver a girar!":"¡GIRAR LA RULETA! 🎰"}
                </button>
              </>
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
                    <QRCodeSVG value={`https://f7824ea4-c4f5-4005-b701-45221ce721dd-00-39q649e6veny.spock.replit.dev/staff/redeem/${prizeResult.redemptionCode}`} size={160} bgColor="white" fgColor="#111"/>
                  </div>
                  <div className="bg-black/30 rounded-xl px-4 py-3">
                    <p className="text-white/40 text-xs mb-1">Código de canje</p>
                    <p className="text-white font-mono font-bold tracking-widest text-sm">{prizeResult.redemptionCode}</p>
                  </div>
                  {prizeResult.expiresAt && <p className="text-white/30 text-xs">⏰ Válido hasta: {new Date(prizeResult.expiresAt).toLocaleDateString("es-AR")}</p>}
                </div>
                <p className="text-white/40 text-xs">📧 Enviamos el premio a tu email</p>
                {campaign.closedRedirectUrl && <a href={campaign.closedRedirectUrl} className="w-full py-4 rounded-2xl font-bold text-white text-center block" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>Ir al sitio →</a>}
              </>
            ) : (
              <>
                <div className="text-7xl">🎟️</div>
                <div>
                  <p className="text-white font-black text-2xl">¡Gracias por participar!</p>
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
                {campaign.closedRedirectUrl && <a href={campaign.closedRedirectUrl} className="w-full py-4 rounded-2xl font-bold text-white text-center block" style={{background:`linear-gradient(135deg, ${campaign.primaryColor}, ${campaign.secondaryColor})`}}>Ir al sitio →</a>}
              </>
            )}
            <UpsellBar campaign={campaign}/>
          </div>
        )}
      </div>
    </div>
  );
}
