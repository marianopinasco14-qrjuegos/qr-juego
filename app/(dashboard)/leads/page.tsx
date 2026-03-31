
import { prisma } from "@/lib/prisma";
import Link from "next/link";
export default async function LeadsPage() {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  const organizationId = (session!.user as any).organizationId;
  const leads = await prisma.lead.findMany({ where: { campaign: { organizationId } }, include: { campaign: { select: { name: true } }, winner: { include: { prize: { select: { title: true } } } } }, orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div><h1 className="text-white text-2xl font-bold">Leads</h1><p className="text-white/50 text-sm mt-1">{leads.length} registros</p></div>
        <Link href="/api/leads/export" className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">⬇️ Exportar CSV</Link>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-white/10">{["Email","WhatsApp","Campaña","Fecha","Ganó","Premio","Canjeó"].map(c => <th key={c} className="text-left text-white/50 font-medium py-3 px-4">{c}</th>)}</tr></thead>
          <tbody>
            {leads.map(lead => (
              <tr key={lead.id} className="border-b border-white/5">
                <td className="py-3 px-4 text-white/80">{lead.email}</td>
                <td className="py-3 px-4 text-white/60">{lead.whatsapp}</td>
                <td className="py-3 px-4"><span className="text-xs text-violet-300">{lead.campaign.name}</span></td>
                <td className="py-3 px-4 text-white/40 text-xs">{lead.createdAt.toLocaleDateString("es-AR")}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${lead.winner?"bg-green-500/20 text-green-400":"bg-white/5 text-white/40"}`}>{lead.winner?"Sí":"No"}</span></td>
                <td className="py-3 px-4 text-white/60 text-xs">{lead.winner?.prize?.title??"-"}</td>
                <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${lead.winner?.isRedeemed?"bg-blue-500/20 text-blue-400":"bg-white/5 text-white/40"}`}>{lead.winner?.isRedeemed?"Sí":"No"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {leads.length === 0 && <div className="text-center py-16"><p className="text-white/40">No hay leads todavía</p></div>}
      </div>
    </div>
  );
}
