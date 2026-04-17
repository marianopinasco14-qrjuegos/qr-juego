"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState<{name:string,url:string}|null>(null);

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r=>r.json()).then(d => {
      setCampaigns(d.campaigns || []);
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-white text-2xl font-bold">QR Juegos</h1><p className="text-white/50 text-sm mt-1">Todas tus campañas</p></div>
        <Link href="/campaigns/new" className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors">+ Nuevo QR Juego</Link>
      </div>

      {loading ? (
        <div className="text-center py-16"><p className="text-white/40">Cargando campañas...</p></div>
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/20 rounded-2xl">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-white/60 mb-2 font-medium">Todavía no creaste ningún QR Juego</p>
          <p className="text-white/40 text-sm mb-6">Creá tu primera campaña y empezá a capturar leads</p>
          <Link href="/campaigns/new" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-500 transition-colors">Crear mi primer QR Juego</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-violet-600/20">{c.gameType==="SLOTS"?"🎰":"🎫"}</div>
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{c.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status==="ACTIVE"?"bg-green-500/20 text-green-400":"bg-yellow-500/20 text-yellow-400"}`}>{c.status}</span>
                    <span className="text-white/40 text-xs">{c._count.leads} leads</span>
                    <span className="text-white/40 text-xs">{c._count.scans} scans</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button onClick={()=>setQrModal({name:c.name,url:`${window.location.origin}/play/${c.qrSlug}`})} className="text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Ver QR</button>
                <Link href={`/play/${c.qrSlug}`} target="_blank" className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors">Ver juego</Link>
                <Link href={`/campaigns/${c.id}`} className="text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Editar</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={()=>setQrModal(null)}>
          <div className="bg-gray-900 border border-white/10 rounded-3xl p-8 flex flex-col items-center gap-4 max-w-sm w-full" onClick={e=>e.stopPropagation()}>
            <h2 className="text-white font-bold text-lg text-center">{qrModal.name}</h2>
            <div className="bg-white p-4 rounded-2xl" id="qr-code-container-campaigns">
              <QRCodeSVG value={qrModal.url} size={200} bgColor="white" fgColor="#111"/>
            </div>
            <p className="text-white/40 text-xs text-center break-all">{qrModal.url}</p>
            <button onClick={()=>{
              const svg = document.querySelector("#qr-code-container-campaigns svg");
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
