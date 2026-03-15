"use client";
import { useState } from "react";
export default function StaffPage() {
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [orgId, setOrgId] = useState("");
  const [result, setResult] = useState<{valid:boolean;message:string;prizeName?:string}|null>(null);
  const [loading, setLoading] = useState(false);
  async function handleRedeem(e: React.FormEvent) {
    e.preventDefault(); setLoading(true); setResult(null);
    try {
      const res = await fetch("/api/staff/redeem", { method: "POST", headers: {"Content-Type":"application/json"}, body: JSON.stringify({redemptionCode:code.toUpperCase(),staffPin:pin,organizationId:orgId}) });
      setResult(await res.json());
    } catch { setResult({valid:false,message:"Error de conexión"}); }
    setLoading(false);
  }
  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8"><div className="text-5xl mb-3">🏷️</div><h1 className="text-white text-2xl font-bold">Panel de Canje</h1><p className="text-white/50 text-sm">Staff QR Juego</p></div>
        {!result ? (
          <form onSubmit={handleRedeem} className="space-y-4">
            <div><label className="text-white/70 text-sm block mb-2">Código del cliente</label><input type="text" required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white font-mono tracking-widest placeholder-white/30 focus:outline-none focus:border-white/50" placeholder="QRJ-XXXXXXXXXX" /></div>
            <div><label className="text-white/70 text-sm block mb-2">Tu PIN de staff</label><input type="password" required maxLength={6} value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,""))} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-4 text-white text-2xl tracking-widest placeholder-white/30 focus:outline-none focus:border-white/50" placeholder="● ● ● ● ● ●" /></div>
            <div><label className="text-white/70 text-sm block mb-2">ID de organización</label><input type="text" required value={orgId} onChange={e=>setOrgId(e.target.value)} className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-white/50 text-sm" placeholder="ID de tu organización" /></div>
            <button type="submit" disabled={loading} className="w-full py-4 rounded-xl font-bold text-white text-lg bg-violet-600 hover:bg-violet-500 transition-colors disabled:opacity-50">{loading?"Validando...":"Verificar y Canjear"}</button>
          </form>
        ) : (
          <div className="text-center">
            <div className={`rounded-2xl p-8 mb-6 ${result.valid?"bg-green-500/20 border-2 border-green-500/60":"bg-red-500/20 border-2 border-red-500/60"}`}>
              <div className="text-6xl mb-4">{result.valid?"✅":"❌"}</div>
              <p className={`font-bold text-xl ${result.valid?"text-green-400":"text-red-400"}`}>{result.message}</p>
              {result.prizeName && <p className="text-white/70 mt-2 text-sm">Premio: {result.prizeName}</p>}
            </div>
            <button onClick={()=>{setResult(null);setCode("");setPin("");}} className="w-full py-4 rounded-xl font-bold text-white bg-white/10 hover:bg-white/20 transition-colors">Nuevo canje</button>
          </div>
        )}
      </div>
    </div>
  );
}
