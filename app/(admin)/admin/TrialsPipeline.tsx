"use client";

import { useState } from "react";

interface Trial {
  id: string;
  name: string;
  email: string;
  contactName: string | null;
  trialEndsAt: string | null;
  createdAt: string;
  plan: { name: string };
  referredByCode: string | null;
}

interface Props {
  expired: Trial[];
  urgent: Trial[];
  healthy: Trial[];
}

function getDaysText(trialEndsAt: string | null, now: Date): string {
  if (!trialEndsAt) return "Sin fecha";
  const end = new Date(trialEndsAt);
  const diffMs = end.getTime() - now.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return `Hace ${Math.abs(diffDays)} días`;
  if (diffDays === 0) return "Hoy";
  return `En ${diffDays} días`;
}

function TrialTable({ trials, showExpiry, now }: { trials: Trial[]; showExpiry: boolean; now: Date }) {
  if (trials.length === 0) {
    return <p className="text-gray-500 text-sm px-4 pb-4">Sin registros en esta categoría.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="text-gray-500 text-xs border-b border-white/10">
          <tr>
            <th className="text-left p-3">Organización</th>
            <th className="text-left p-3">Email</th>
            <th className="text-left p-3">Plan</th>
            <th className="text-left p-3">{showExpiry ? "Vencimiento" : "Venció hace"}</th>
            <th className="text-left p-3">Referido por</th>
          </tr>
        </thead>
        <tbody>
          {trials.map((t) => (
            <tr key={t.id} className="border-b border-white/5 hover:bg-white/2">
              <td className="p-3 font-medium">{t.name}</td>
              <td className="p-3 text-gray-400">{t.email}</td>
              <td className="p-3">
                <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                  {t.plan.name}
                </span>
              </td>
              <td className="p-3 text-gray-400 text-xs">{getDaysText(t.trialEndsAt, now)}</td>
              <td className="p-3 text-gray-500 text-xs">{t.referredByCode ?? "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function TrialsPipeline({ expired, urgent, healthy }: Props) {
  const [expiredOpen, setExpiredOpen] = useState(true);
  const [urgentOpen, setUrgentOpen] = useState(true);
  const [healthyOpen, setHealthyOpen] = useState(false);
  const now = new Date();

  return (
    <div className="space-y-4">
      {/* Vencidos */}
      <div className="rounded-xl border border-red-500/20 bg-red-500/5 overflow-hidden">
        <button
          onClick={() => setExpiredOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-red-500/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span>🔴</span>
            <span className="font-semibold">Vencidos sin convertir</span>
            <span className="bg-red-500/20 text-red-300 text-xs px-2 py-0.5 rounded-full">
              {expired.length}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {expired.length > 0 && (
              <a
                href="/api/admin/export/trials-expired"
                onClick={(e) => e.stopPropagation()}
                className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
              >
                ⬇️ Exportar CSV
              </a>
            )}
            <span className="text-gray-400">{expiredOpen ? "▲" : "▼"}</span>
          </div>
        </button>
        {expiredOpen && <TrialTable trials={expired} showExpiry={false} now={now} />}
      </div>

      {/* Urgentes */}
      <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 overflow-hidden">
        <button
          onClick={() => setUrgentOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-yellow-500/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span>🟡</span>
            <span className="font-semibold">Vencen en 7 días</span>
            <span className="bg-yellow-500/20 text-yellow-300 text-xs px-2 py-0.5 rounded-full">
              {urgent.length}
            </span>
          </div>
          <span className="text-gray-400">{urgentOpen ? "▲" : "▼"}</span>
        </button>
        {urgentOpen && <TrialTable trials={urgent} showExpiry={true} now={now} />}
      </div>

      {/* Saludables */}
      <div className="rounded-xl border border-green-500/10 bg-green-500/5 overflow-hidden">
        <button
          onClick={() => setHealthyOpen((v) => !v)}
          className="w-full flex items-center justify-between p-4 text-left hover:bg-green-500/5 transition-colors"
        >
          <div className="flex items-center gap-3">
            <span>🟢</span>
            <span className="font-semibold">Trials activos</span>
            <span className="bg-green-500/20 text-green-300 text-xs px-2 py-0.5 rounded-full">
              {healthy.length}
            </span>
          </div>
          <span className="text-gray-400">{healthyOpen ? "▲" : "▼"}</span>
        </button>
        {healthyOpen && <TrialTable trials={healthy} showExpiry={true} now={now} />}
      </div>
    </div>
  );
}
