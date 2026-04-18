"use client";
import { useState, useEffect, useRef } from "react";

interface Alert {
  type: "EXPIRING_SOON" | "STOCK_CRITICAL" | "EXPIRED";
  campaignName: string;
  prizeName: string;
  campaignId: string;
  detail: string;
}

const ALERT_ICONS: Record<Alert["type"], string> = {
  EXPIRING_SOON: "⏰",
  STOCK_CRITICAL: "⚠️",
  EXPIRED: "🚨",
};

export default function AlertsBell() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/analytics")
      .then((r) => r.json())
      .then((d) => setAlerts(d.alerts || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const badgeCount = alerts.length > 9 ? "9+" : String(alerts.length);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 text-white/60 hover:text-white transition-colors"
        aria-label="Alertas"
      >
        <span className="text-xl">🔔</span>
        {alerts.length > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
            {badgeCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="p-4 border-b border-white/10 flex items-center justify-between">
            <p className="text-white font-bold text-sm">Alertas</p>
            {alerts.length > 0 && (
              <span className="text-xs text-white/40">{alerts.length} activa{alerts.length !== 1 ? "s" : ""}</span>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {alerts.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-white/50 text-sm">Sin alertas activas 🎉</p>
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {alerts.map((a, i) => (
                  <div key={i} className="p-4 hover:bg-white/5 transition-colors">
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{ALERT_ICONS[a.type]}</span>
                      <div className="min-w-0">
                        <p className="text-white/40 text-xs">{a.campaignName}</p>
                        <p className="text-white text-sm font-medium truncate">{a.prizeName}</p>
                        <p className="text-white/50 text-xs mt-0.5">{a.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
