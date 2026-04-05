"use client";
import { useState, useEffect } from "react";

export default function LeadsPage() {
  const [leads, setLeads] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard/stats").then(r=>r.json()).then(d => {
      setCampaigns(d.campaigns || []);
    });
  }, []);

  useEffect(() => {
    setLoading(true);
    const url = selectedCampaignId
      ? `/api/leads/list?campaignId=${selectedCampaignId}`
      : "/api/leads/list";
    fetch(url).then(r=>r.json()).then(d => {
      setLeads(d.leads || []);
      setLoading(false);
    });
  }, [selectedCampaignId]);

  const exportUrl = selectedCampaignId
    ? `/api/leads/export?campaignId=${selectedCampaignId}`
    : "/api/leads/export";

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-white text-2xl font-bold">Leads</h1>
          <p className="text-white/50 text-sm mt-1">{leads.length} registros</p>
        </div>
        <a href={exportUrl} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors">⬇️ Exportar CSV</a>
      </div>

      <div className="mb-4">
        <select
          value={selectedCampaignId}
          onChange={e => setSelectedCampaignId(e.target.value)}
          className="bg-white/10 border border-white/10 text-white rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-violet-500"
        >
          <option value="">Todas las campañas</option>
          {campaigns.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16"><p className="text-white/40">Cargando leads...</p></div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-white/10">{["Email","WhatsApp","Campaña","Fecha","Ganó","Premio","Canjeó"].map(c => <th key={c} className="text-left text-white/50 font-medium py-3 px-4">{c}</th>)}</tr></thead>
            <tbody>
              {leads.map((lead: any) => (
                <tr key={lead.id} className="border-b border-white/5">
                  <td className="py-3 px-4 text-white/80">{lead.email}</td>
                  <td className="py-3 px-4 text-white/60">{lead.whatsapp}</td>
                  <td className="py-3 px-4"><span className="text-xs text-violet-300">{lead.campaign?.name}</span></td>
                  <td className="py-3 px-4 text-white/40 text-xs">{new Date(lead.createdAt).toLocaleDateString("es-AR")}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${lead.winner?"bg-green-500/20 text-green-400":"bg-white/5 text-white/40"}`}>{lead.winner?"Sí":"No"}</span></td>
                  <td className="py-3 px-4 text-white/60 text-xs">{lead.winner?.prize?.title??"-"}</td>
                  <td className="py-3 px-4"><span className={`text-xs px-2 py-0.5 rounded-full ${lead.winner?.isRedeemed?"bg-blue-500/20 text-blue-400":"bg-white/5 text-white/40"}`}>{lead.winner?.isRedeemed?"Sí":"No"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {leads.length === 0 && <div className="text-center py-16"><p className="text-white/40">No hay leads todavía</p></div>}
        </div>
      )}
    </div>
  );
}
