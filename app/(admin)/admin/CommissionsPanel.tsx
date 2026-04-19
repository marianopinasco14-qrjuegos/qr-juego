"use client";

import { useState } from "react";

interface Referral {
  id: string;
  commissionAmount: number;
  commissionStatus: string;
  referredOrganization: { name: string; email: string; subscriptionStatus: string };
}

interface Affiliate {
  id: string;
  name: string;
  email: string;
  paypalEmail: string | null;
  commissionRate: number;
  status: string;
  pendingCommission: number;
  referrals: Referral[];
}

interface Props {
  affiliates: Affiliate[];
}

export default function CommissionsPanel({ affiliates }: Props) {
  const [paying, setPaying] = useState<string | null>(null);
  const [paid, setPaid] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const currentMonth = new Date().toISOString().slice(0, 7);

  const pending = affiliates.filter(
    (a) => a.pendingCommission > 0 && !paid.includes(a.id)
  );

  const markAsPaid = async (affiliateId: string) => {
    setPaying(affiliateId);
    setError(null);
    try {
      const res = await fetch(`/api/admin/affiliates/${affiliateId}/pay-commission`, {
        method: "PATCH",
      });
      if (res.ok) {
        setPaid((prev) => [...prev, affiliateId]);
      } else {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Error al procesar el pago.");
      }
    } catch {
      setError("Error de conexión.");
    } finally {
      setPaying(null);
    }
  };

  if (pending.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-6 text-center">
        <p className="text-green-400 font-medium">Sin comisiones pendientes 🎉</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-red-400 text-sm">
          {error}
        </div>
      )}
      {pending.map((affiliate) => {
        const activeReferrals = affiliate.referrals.filter(
          (r) =>
            r.commissionStatus === "PENDING" &&
            r.referredOrganization.subscriptionStatus === "ACTIVE"
        );
        const isProcessing = paying === affiliate.id;

        return (
          <div key={affiliate.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{affiliate.name}</span>
                  <span className="text-xs bg-green-500/20 text-green-300 px-2 py-0.5 rounded-full">
                    {affiliate.status}
                  </span>
                </div>
                <p className="text-gray-400 text-xs mt-0.5">{affiliate.email}</p>
                {affiliate.paypalEmail && (
                  <p className="text-gray-500 text-xs mt-0.5">
                    PayPal: <span className="font-mono">{affiliate.paypalEmail}</span>
                  </p>
                )}
                <p className="text-gray-500 text-xs mt-0.5">Comisión: {affiliate.commissionRate}%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">Pendiente</p>
                <p className="text-yellow-400 font-black text-xl">
                  ${affiliate.pendingCommission.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Referrals list */}
            {activeReferrals.length > 0 && (
              <div className="px-4 py-3 space-y-1.5">
                <p className="text-xs text-gray-500 uppercase tracking-wider mb-2">Referidos pendientes</p>
                {activeReferrals.map((r) => (
                  <div key={r.id} className="flex justify-between items-center text-sm">
                    <span className="text-gray-300">
                      {r.referredOrganization.name}{" "}
                      <span className="text-gray-500">({r.referredOrganization.email})</span>
                    </span>
                    <span className="text-yellow-300 font-mono text-xs">
                      ${r.commissionAmount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Footer actions */}
            <div className="p-4 border-t border-white/10 flex gap-3">
              <button
                onClick={() => markAsPaid(affiliate.id)}
                disabled={isProcessing}
                className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium py-2.5 rounded-lg transition-colors"
              >
                {isProcessing
                  ? "Procesando..."
                  : `✅ Marcar como pagada $${affiliate.pendingCommission.toFixed(2)}`}
              </button>
              <a
                href={`/api/admin/affiliates/${affiliate.id}/liquidacion?mes=${currentMonth}`}
                className="bg-white/10 hover:bg-white/20 text-gray-200 text-sm px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap"
              >
                ⬇️ Liquidación CSV
              </a>
            </div>
          </div>
        );
      })}
    </div>
  );
}
