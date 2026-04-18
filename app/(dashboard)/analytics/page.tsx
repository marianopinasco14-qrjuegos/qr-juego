"use client";
import { useState, useEffect } from "react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface MetricComparison {
  current: number;
  previous: number;
  change: number;
}

interface PrizeAnalytics {
  id: string;
  title: string;
  stock: number;
  deliveredCount: number;
  stockRemaining: number;
  stockPercentage: number;
  isCritical: boolean;
  winnersExpiringSoon: number;
  winnersExpired: number;
}

interface CampaignAnalytics {
  id: string;
  name: string;
  gameType: string;
  status: string;
  qrSlug: string;
  leads: number;
  scans: number;
  winners: number;
  redeemed: number;
  conversionRate: number;
  prizes: PrizeAnalytics[];
}

interface AnalyticsData {
  period: { dateFrom: string; dateTo: string };
  global: {
    totalScans: number;
    totalLeads: number;
    totalWinners: number;
    totalRedeemed: number;
    totalUpsellClicks: number;
    conversionRate: number;
    redemptionRate: number;
  };
  comparison: {
    scans: MetricComparison;
    leads: MetricComparison;
    winners: MetricComparison;
    redeemed: MetricComparison;
  };
  byHour: Array<{ hour: number; count: number }>;
  byWeekday: Array<{ dow: number; label: string; count: number }>;
  campaigns: CampaignAnalytics[];
  alerts: Array<{
    type: "EXPIRING_SOON" | "STOCK_CRITICAL" | "EXPIRED";
    campaignName: string;
    prizeName: string;
    campaignId: string;
    detail: string;
  }>;
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function today() {
  return new Date().toISOString().split("T")[0];
}

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().split("T")[0];
}

function ChangeBadge({ change }: { change: number }) {
  if (change === 0) return <span className="text-xs text-white/40 bg-white/10 px-2 py-0.5 rounded-full">—</span>;
  const positive = change > 0;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${positive ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400"}`}>
      {positive ? "↑" : "↓"} {Math.abs(change)}%
    </span>
  );
}

function BarChart({ data, maxHeight = 80, labelKey, countKey }: {
  data: Array<Record<string, number | string>>;
  maxHeight?: number;
  labelKey: string;
  countKey: string;
}) {
  const maxCount = Math.max(...data.map((d) => Number(d[countKey])), 1);
  return (
    <div className="flex items-end gap-1 h-24">
      {data.map((d, i) => {
        const count = Number(d[countKey]);
        const height = count === 0 ? 0 : Math.max(4, Math.round((count / maxCount) * maxHeight));
        const label = d[labelKey];
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div
              className="w-full rounded-t bg-violet-500 group-hover:bg-violet-400 transition-colors cursor-default"
              style={{ height: `${height}px`, minHeight: count > 0 ? "4px" : "0px" }}
            />
            {/* Tooltip */}
            <div className="absolute bottom-full mb-1 hidden group-hover:flex bg-gray-800 border border-white/10 rounded-lg px-2 py-1 text-xs text-white whitespace-nowrap z-10 pointer-events-none">
              {label}: {count.toLocaleString()}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SkeletonCards() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-5 h-28" />
      ))}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(daysAgo(7));
  const [dateTo, setDateTo] = useState(today());
  const [pendingFrom, setPendingFrom] = useState(daysAgo(7));
  const [pendingTo, setPendingTo] = useState(today());
  const [campaignId, setCampaignId] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [expandedCampaigns, setExpandedCampaigns] = useState<Set<string>>(new Set());

  const fetchData = async (from: string, to: string, cId: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ dateFrom: from, dateTo: to });
      if (cId) params.set("campaignId", cId);
      const res = await fetch(`/api/analytics?${params}`);
      if (!res.ok) throw new Error("Error al cargar analytics");
      const json = await res.json();
      setData(json);
    } catch (e: any) {
      setError(e.message || "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(dateFrom, dateTo, campaignId);
  }, [campaignId]);

  const handleApply = () => {
    setDateFrom(pendingFrom);
    setDateTo(pendingTo);
    fetchData(pendingFrom, pendingTo, campaignId);
  };

  const toggleCampaign = (id: string) => {
    setExpandedCampaigns((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const GAME_EMOJI: Record<string, string> = { SLOTS: "🎰", RASCA_Y_GANA: "🎫", RULETA: "🎡" };

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-white text-2xl font-bold">Analytics</h1>
          <p className="text-white/50 text-sm mt-1">Métricas y rendimiento de tus campañas</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={pendingFrom}
            max={today()}
            onChange={(e) => setPendingFrom(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          />
          <span className="text-white/40 text-sm">→</span>
          <input
            type="date"
            value={pendingTo}
            max={today()}
            onChange={(e) => setPendingTo(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500"
          />
          <button
            onClick={handleApply}
            className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            Aplicar
          </button>
        </div>
      </div>

      {/* ── Campaign filter ── */}
      {data && (
        <div className="flex items-center gap-3">
          <label className="text-white/60 text-sm shrink-0">Campaña:</label>
          <select
            value={campaignId}
            onChange={(e) => setCampaignId(e.target.value)}
            className="bg-white/10 border border-white/20 rounded-xl px-3 py-2 text-white text-sm focus:outline-none max-w-xs"
          >
            <option value="">Todas las campañas</option>
            {data.campaigns.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <div className="bg-red-500/15 border border-red-500/30 rounded-xl px-4 py-3">
          <p className="text-red-400 text-sm">⚠️ {error}</p>
        </div>
      )}

      {loading && <SkeletonCards />}

      {!loading && data && (
        <>
          {/* ── Sección 1: Métricas globales ── */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { emoji: "📱", label: "Escaneos", key: "scans" as const, value: data.global.totalScans },
                { emoji: "👥", label: "Leads", key: "leads" as const, value: data.global.totalLeads },
                { emoji: "🏆", label: "Ganadores", key: "winners" as const, value: data.global.totalWinners },
                { emoji: "✅", label: "Canjes", key: "redeemed" as const, value: data.global.totalRedeemed },
              ].map((m) => (
                <div key={m.key} className="bg-white/5 border border-white/10 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-2xl">{m.emoji}</span>
                    <ChangeBadge change={data.comparison[m.key].change} />
                  </div>
                  <p className="text-white font-black text-3xl">{m.value.toLocaleString()}</p>
                  <p className="text-white/50 text-sm mt-1">{m.label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Tasa de conversión</p>
                  <p className="text-white font-bold text-xl mt-0.5">{data.global.conversionRate}%</p>
                  <p className="text-white/40 text-xs">Escaneo → Lead</p>
                </div>
                <span className="text-3xl">📊</span>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-white/60 text-xs">Tasa de canje</p>
                  <p className="text-white font-bold text-xl mt-0.5">{data.global.redemptionRate}%</p>
                  <p className="text-white/40 text-xs">Ganadores que canjearon</p>
                </div>
                <span className="text-3xl">🎟️</span>
              </div>
            </div>
          </div>

          {/* ── Sección 2: Gráficos ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Por hora */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white font-bold mb-4">Participaciones por hora del día</p>
              <BarChart data={data.byHour} labelKey="hour" countKey="count" />
              {/* Hour labels every 3 hours */}
              <div className="flex mt-2">
                {data.byHour.map((h, i) => (
                  <div key={i} className="flex-1 text-center">
                    {i % 3 === 0 && (
                      <span className="text-white/30 text-xs">{h.hour}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Por día de semana */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
              <p className="text-white font-bold mb-4">Actividad por día de la semana</p>
              <BarChart data={data.byWeekday} labelKey="label" countKey="count" />
              <div className="flex mt-2">
                {data.byWeekday.map((d, i) => (
                  <div key={i} className="flex-1 text-center">
                    <span className="text-white/30 text-xs">{d.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Sección 3: Tabla comparativa ── */}
          {data.campaigns.length > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-white/10">
                <p className="text-white font-bold">Comparativa entre campañas</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {["Juego", "Tipo", "Leads", "Escaneos", "Conversión", "Ganadores", "Canjeados", "Stock restante"].map((h) => (
                        <th key={h} className="text-left px-4 py-3 text-white/50 font-medium text-xs">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.campaigns.map((c) => {
                      const totalStock = c.prizes.reduce((a, p) => a + p.stockRemaining, 0);
                      const hasCritical = c.prizes.some((p) => p.isCritical);
                      const convColor =
                        c.conversionRate > 50 ? "text-green-400" :
                        c.conversionRate < 20 ? "text-red-400" : "text-white";
                      return (
                        <tr key={c.id} className="hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 text-white font-medium">{c.name}</td>
                          <td className="px-4 py-3 text-white/60">{GAME_EMOJI[c.gameType] || "🎮"} {c.gameType}</td>
                          <td className="px-4 py-3 text-white">{c.leads.toLocaleString()}</td>
                          <td className="px-4 py-3 text-white">{c.scans.toLocaleString()}</td>
                          <td className={`px-4 py-3 font-bold ${convColor}`}>{c.conversionRate}%</td>
                          <td className="px-4 py-3 text-white">{c.winners.toLocaleString()}</td>
                          <td className="px-4 py-3 text-white">{c.redeemed.toLocaleString()}</td>
                          <td className="px-4 py-3 text-white">
                            {hasCritical && <span className="mr-1">🔴</span>}
                            {totalStock.toLocaleString()}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Sección 4: Cards por campaña ── */}
          {data.campaigns.length > 0 && (
            <div className="space-y-3">
              <p className="text-white font-bold text-lg">Detalle por campaña</p>
              {data.campaigns.map((c) => {
                const expanded = expandedCampaigns.has(c.id);
                return (
                  <div key={c.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
                    <button
                      onClick={() => toggleCampaign(c.id)}
                      className="w-full p-5 flex items-center justify-between hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <span className="text-2xl shrink-0">{GAME_EMOJI[c.gameType] || "🎮"}</span>
                        <div className="min-w-0">
                          <p className="text-white font-bold truncate">{c.name}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.status === "ACTIVE" ? "bg-green-500/20 text-green-400" : c.status === "PAUSED" ? "bg-yellow-500/20 text-yellow-400" : "bg-white/10 text-white/50"}`}>
                              {c.status}
                            </span>
                            <span className="text-white/50 text-xs">{c.leads} leads</span>
                            <span className="text-white/50 text-xs">Conversión: {c.conversionRate}%</span>
                          </div>
                        </div>
                      </div>
                      <span className="text-white/40 ml-4">{expanded ? "▲" : "▼"}</span>
                    </button>

                    {expanded && (
                      <div className="px-5 pb-5 border-t border-white/10 space-y-5">
                        {/* Métricas del período */}
                        <div className="grid grid-cols-4 gap-3 pt-4">
                          {[
                            { label: "Escaneos", value: c.scans },
                            { label: "Leads", value: c.leads },
                            { label: "Ganadores", value: c.winners },
                            { label: "Canjeados", value: c.redeemed },
                          ].map((m) => (
                            <div key={m.label} className="bg-white/5 rounded-xl p-3 text-center">
                              <p className="text-white font-black text-xl">{m.value.toLocaleString()}</p>
                              <p className="text-white/50 text-xs mt-0.5">{m.label}</p>
                            </div>
                          ))}
                        </div>

                        {/* Premios */}
                        {c.prizes.length > 0 && (
                          <div>
                            <p className="text-white/70 text-sm font-medium mb-3">Premios</p>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b border-white/10">
                                    {["Premio", "Entregados", "Disponibles", "Stock %", "Estado"].map((h) => (
                                      <th key={h} className="text-left px-3 py-2 text-white/40 font-medium text-xs">{h}</th>
                                    ))}
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                  {c.prizes.map((p) => (
                                    <tr key={p.id}>
                                      <td className="px-3 py-3">
                                        <p className="text-white text-sm">{p.title}</p>
                                        {p.winnersExpiringSoon > 0 && (
                                          <span className="inline-block mt-1 text-xs bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full">
                                            ⏰ {p.winnersExpiringSoon} vence{p.winnersExpiringSoon !== 1 ? "n" : ""} en 7 días
                                          </span>
                                        )}
                                        {p.winnersExpired > 0 && (
                                          <span className="inline-block mt-1 ml-1 text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">
                                            🚨 {p.winnersExpired} vencido{p.winnersExpired !== 1 ? "s" : ""} sin canjear
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-3 text-white/70">{p.deliveredCount}</td>
                                      <td className="px-3 py-3 text-white/70">{p.stockRemaining}</td>
                                      <td className="px-3 py-3 text-white/70">{p.stockPercentage}%</td>
                                      <td className="px-3 py-3">
                                        {p.stockRemaining === 0 ? (
                                          <span className="text-xs text-red-400 font-medium">❌ Agotado</span>
                                        ) : p.stockPercentage < 20 ? (
                                          <span className="text-xs text-yellow-400 font-medium">⚠️ Crítico</span>
                                        ) : (
                                          <span className="text-xs text-green-400 font-medium">✅ OK</span>
                                        )}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {data.campaigns.length === 0 && (
            <div className="text-center py-16 border border-dashed border-white/20 rounded-2xl">
              <div className="text-5xl mb-4">📊</div>
              <p className="text-white/60 font-medium">No hay datos para el período seleccionado</p>
              <p className="text-white/40 text-sm mt-1">Probá con un rango de fechas diferente</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
