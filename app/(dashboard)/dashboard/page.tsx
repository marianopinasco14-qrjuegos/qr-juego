"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalLeads:0, totalScans:0, totalWinners:0, totalRedeemed:0 });
  const [qrModal, setQrModal] = useState<{name:string,url:string}|null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r=>r.json()).then(d => {
      setCampaigns(d.campaigns || []);
      setStats(d.stats || {});
    });
  }, []);

  const convRate = stats.totalScans > 0 ? Math.round((stats.totalLeads / stats.totalScans) * 100) : 0;
  const recentCampaigns = campaigns.slice(0, 3);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-white text-2xl font-bold">Dashboard</h1><p className="text-white/50 text-sm mt-1">Resumen de todas tus campañas</p></div>
        <Link href="/campaigns/new" className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors">+ Nuevo QR Juego</Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{label:"Escaneos",value:stats.totalScans,emoji:"📱"},{label:"Leads",value:stats.totalLeads,emoji:"👥"},{label:"Ganadores",value:stats.totalWinners,emoji:"🏆"},{label:"Canjes",value:stats.totalRedeemed,emoji:"✅"}].map((m) => (
          <div key={m.label} className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-2xl mb-2">{m.emoji}</div>
            <p className="text-3xl font-black text-white">{m.value.toLocaleString()}</p>
            <p className="text-white/50 text-sm mt-1">{m.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-8">
        <p className="text-white font-medium mb-4">📈 Embudo de conversión</p>
        <div className="flex items-center gap-3 flex-wrap">
          {[{label:"Escaneos",value:stats.totalScans,pct:100},{label:"Leads",value:stats.totalLeads,pct:convRate},{label:"Ganadores",value:stats.totalWinners,pct:stats.totalLeads>0?Math.round((stats.totalWinners/stats.totalLeads)*100):0},{label:"Canjes",value:stats.totalRedeemed,pct:stats.totalWinners>0?Math.round((stats.totalRedeemed/stats.totalWinners)*100):0}].map((s,i,arr) => (
            <div key={s.label} className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-white font-bold text-xl">{s.value}</p>
                <p className="text-white/50 text-xs">{s.label}</p>
                <div className="mt-1 bg-white/10 rounded-full h-1.5 w-16"><div className="h-1.5 rounded-full bg-violet-500" style={{width:`${s.pct}%`}} /></div>
              </div>
              {i < arr.length - 1 && <span className="text-white/20 text-xl">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-white font-bold">Campañas recientes</h2>
        <Link href="/campaigns" className="text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors">Ver todas →</Link>
      </div>

      {recentCampaigns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/20 rounded-2xl">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-white/60 mb-4">Todavía no creaste ningún QR Juego</p>
          <Link href="/campaigns/new" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-500 transition-colors">Crear mi primer QR Juego</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {recentCampaigns.map((c: any) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-violet-600/20">{c.gameType==="RULETA"?"🎡":c.gameType==="SLOTS"?"🎰":"🎫"}</div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status==="ACTIVE"?"bg-green-500/20 text-green-400":"bg-yellow-500/20 text-yellow-400"}`}>{c.status}</span>
                    <span className="text-white/40 text-xs">{c._count.leads} leads</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
          {campaigns.length > 3 && (
            <Link href="/campaigns" className="block text-center py-3 text-violet-400 hover:text-violet-300 text-sm font-medium transition-colors border border-dashed border-white/10 rounded-2xl">Ver todas las campañas ({campaigns.length})</Link>
          )}
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={()=>setQrModal(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg text-center">{qrModal.name}</h2>
            <div className="bg-white p-4 rounded-2xl" id="qr-code-container">
              <QRCodeSVG value={qrModal.url} size={200} bgColor="white" fgColor="#111"/>
            </div>
            <p className="text-white/40 text-xs text-center break-all">{qrModal.url}</p>
            <button onClick={()=>{
              const svg = document.querySelector("#qr-code-container svg");
              if(!svg) return;
              const blob = new Blob([svg.outerHTML], {type:"image/svg+xml"});
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = `qr-${qrModal.name}.svg`;
              a.click();
            }} className="w-full py-3 rounded-xl font-bold text-white bg-violet-600 hover:bg-violet-500 transition-colors">⬇️ Descargar QR</button>
            <button onClick={()=>setQrModal(null)} className="text-white/40 text-sm">Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}
