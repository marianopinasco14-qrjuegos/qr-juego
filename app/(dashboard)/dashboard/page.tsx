import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
export default async function DashboardPage() {
  const session = await auth();
  const organizationId = (session!.user as any).organizationId;
  const [campaigns, totalLeads, totalScans, totalWinners, totalRedeemed] = await Promise.all([
    prisma.campaign.findMany({ where: { organizationId }, include: { prizes: { select: { stock: true, deliveredCount: true, title: true } }, _count: { select: { leads: true, scans: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.lead.count({ where: { campaign: { organizationId } } }),
    prisma.scan.count({ where: { campaign: { organizationId } } }),
    prisma.winner.count({ where: { prize: { campaign: { organizationId } } } }),
    prisma.winner.count({ where: { isRedeemed: true, prize: { campaign: { organizationId } } } }),
  ]);
  const convRate = totalScans > 0 ? Math.round((totalLeads / totalScans) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div><h1 className="text-white text-2xl font-bold">Dashboard</h1><p className="text-white/50 text-sm mt-1">Resumen de todas tus campañas</p></div>
        <Link href="/campaigns/new" className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl font-medium text-sm transition-colors">+ Nuevo QR Juego</Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[{label:"Escaneos",value:totalScans,emoji:"📱"},{label:"Leads",value:totalLeads,emoji:"👥"},{label:"Ganadores",value:totalWinners,emoji:"🏆"},{label:"Canjes",value:totalRedeemed,emoji:"✅"}].map((m) => (
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
          {[{label:"Escaneos",value:totalScans,pct:100},{label:"Leads",value:totalLeads,pct:convRate},{label:"Ganadores",value:totalWinners,pct:totalLeads>0?Math.round((totalWinners/totalLeads)*100):0},{label:"Canjes",value:totalRedeemed,pct:totalWinners>0?Math.round((totalRedeemed/totalWinners)*100):0}].map((s,i,arr) => (
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
      <h2 className="text-white font-bold mb-4">Campañas</h2>
      {campaigns.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-white/20 rounded-2xl">
          <div className="text-5xl mb-4">🎯</div>
          <p className="text-white/60 mb-4">Todavía no creaste ningún QR Juego</p>
          <Link href="/campaigns/new" className="bg-violet-600 text-white px-6 py-3 rounded-xl font-medium hover:bg-violet-500 transition-colors">Crear mi primer QR Juego</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {campaigns.map((c: any) => (
            <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 text-2xl bg-violet-600/20">{c.gameType==="RULETA"?"🎡":c.gameType==="SLOTS"?"🎰":"🎫"}</div>
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
                <Link href={`/play/${c.qrSlug}`} target="_blank" className="text-xs text-violet-400 hover:text-violet-300 bg-violet-500/10 px-3 py-1.5 rounded-lg transition-colors">Ver juego</Link>
                <Link href={`/campaigns/${c.id}`} className="text-xs text-white/60 hover:text-white bg-white/5 px-3 py-1.5 rounded-lg transition-colors">Editar</Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
