import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { redirect } from "next/navigation";
import TrialsPipeline from "./TrialsPipeline";
import CommissionsPanel from "./CommissionsPanel";

export default async function AdminDashboard() {
  const admin = requireSuperAdmin();
  if (!admin) redirect("/login");

  const now = new Date();
  const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
  const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const [
    activeOrgs,
    activeOrgsLastMonth,
    canceledThisMonth,
    canceledLastMonth,
    trialsActive,
    trialsConvertedThisMonth,
    trialsStartedThisMonth,
    affiliatesWithPending,
    renewalsThisMonth,
    renewalsNextMonth,
  ] = await Promise.all([
    prisma.organization.findMany({
      where: { subscriptionStatus: "ACTIVE", isActive: true },
      include: {
        plan: { select: { price: true, name: true } },
        subscriptions: {
          where: { status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { currentPeriodEnd: true, amount: true },
        },
      },
    }),
    prisma.organization.count({
      where: { subscriptionStatus: "ACTIVE", isActive: true, createdAt: { lt: firstDayThisMonth } },
    }),
    prisma.organization.count({
      where: { subscriptionStatus: "CANCELED", updatedAt: { gte: firstDayThisMonth, lte: now } },
    }),
    prisma.organization.count({
      where: {
        subscriptionStatus: "CANCELED",
        updatedAt: { gte: firstDayLastMonth, lte: lastDayLastMonth },
      },
    }),
    prisma.organization.findMany({
      where: { subscriptionStatus: "TRIAL", isActive: true },
      select: {
        id: true, name: true, email: true, contactName: true,
        trialEndsAt: true, createdAt: true, referredByCode: true,
        plan: { select: { name: true } },
      },
      orderBy: { trialEndsAt: "asc" },
    }),
    prisma.organization.count({
      where: { subscriptionStatus: "ACTIVE", createdAt: { gte: firstDayThisMonth, lte: now } },
    }),
    prisma.organization.count({
      where: {
        subscriptionStatus: { in: ["TRIAL", "ACTIVE", "CANCELED"] },
        createdAt: { gte: firstDayThisMonth, lte: now },
      },
    }),
    prisma.affiliate.findMany({
      where: { status: "ACTIVE", pendingCommission: { gt: 0 } },
      include: {
        referrals: {
          where: { commissionStatus: "PENDING" },
          include: {
            referredOrganization: { select: { name: true, email: true, subscriptionStatus: true } },
          },
        },
      },
      orderBy: { pendingCommission: "desc" },
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", currentPeriodEnd: { gte: now, lte: in30Days } },
      include: {
        organization: { select: { name: true, email: true } },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { currentPeriodEnd: "asc" },
    }),
    prisma.subscription.findMany({
      where: { status: "ACTIVE", currentPeriodEnd: { gte: in30Days, lte: in60Days } },
      include: {
        organization: { select: { name: true, email: true } },
        plan: { select: { name: true, price: true } },
      },
      orderBy: { currentPeriodEnd: "asc" },
    }),
  ]);

  // ── Cálculos ──────────────────────────────────────────────────────────────────

  const mrr = activeOrgs.reduce((sum, org) => {
    const sub = org.subscriptions[0];
    return sum + (sub?.amount ?? org.plan.price);
  }, 0);

  const mrrLastMonth =
    (activeOrgsLastMonth / Math.max(activeOrgs.length, 1)) * mrr;

  const arr = mrr * 12;

  const churnRate =
    activeOrgs.length > 0
      ? (canceledThisMonth / Math.max(activeOrgs.length + canceledThisMonth, 1)) * 100
      : 0;

  const conversionRate =
    trialsStartedThisMonth > 0
      ? (trialsConvertedThisMonth / trialsStartedThisMonth) * 100
      : 0;

  const totalPendingCommissions = affiliatesWithPending.reduce(
    (sum, a) => sum + a.pendingCommission,
    0
  );

  const totalRenewalsThisMonth = renewalsThisMonth.reduce(
    (sum, s) => sum + (s.amount ?? s.plan.price),
    0
  );

  const totalRenewalsNextMonth = renewalsNextMonth.reduce(
    (sum, s) => sum + (s.amount ?? s.plan.price),
    0
  );

  // Separar trials por urgencia
  const trialsExpired = trialsActive.filter(
    (t) => t.trialEndsAt && new Date(t.trialEndsAt) < now
  );
  const trialsUrgent = trialsActive.filter(
    (t) =>
      t.trialEndsAt &&
      new Date(t.trialEndsAt) >= now &&
      new Date(t.trialEndsAt) <= in7Days
  );
  const trialsHealthy = trialsActive.filter(
    (t) => !t.trialEndsAt || new Date(t.trialEndsAt) > in7Days
  );

  // Serializar fechas para client components
  const serializeTrial = (t: typeof trialsActive[0]) => ({
    ...t,
    trialEndsAt: t.trialEndsAt?.toISOString() ?? null,
    createdAt: t.createdAt.toISOString(),
  });

  return (
    <div className="p-6 space-y-8">
      {/* ── Header ────────────────────────────────────────────────────────────── */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Panel de Negocio</h1>
          <p className="text-gray-400 text-sm mt-1">Métricas en tiempo real de QR Juego</p>
        </div>
        <div className="flex items-center gap-3">
          <form action="/api/admin/send-trial-reminders" method="POST">
            <button
              type="submit"
              className="text-xs bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 px-3 py-1.5 rounded-lg transition-colors border border-yellow-500/30"
            >
              📧 Enviar recordatorios trial
            </button>
          </form>
          <div className="text-xs text-gray-600">
            Actualizado: {now.toLocaleDateString("es-AR")}{" "}
            {now.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </div>

      {/* ── KPIs principales ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* MRR */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">MRR</p>
          <p className="text-xs text-gray-600 mb-3">Ingresos mensuales recurrentes</p>
          <p className="text-3xl font-black text-green-300">${mrr.toFixed(2)}</p>
          <p className="text-xs text-gray-500 mt-0.5">USD</p>
          <div className="mt-3">
            {mrr > mrrLastMonth ? (
              <span className="text-xs text-green-400">↑ estimado creciente</span>
            ) : (
              <span className="text-xs text-gray-500">→ estable</span>
            )}
          </div>
          <p className="text-xs text-gray-600 mt-2">ARR proyectado: ${arr.toFixed(2)} USD</p>
        </div>

        {/* Clientes activos */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Clientes activos</p>
          <p className="text-3xl font-black mt-3">{activeOrgs.length}</p>
          <p className="text-xs text-gray-500 mt-1">{canceledThisMonth} cancelaciones este mes</p>
          <p
            className={`text-xs mt-2 font-medium ${
              churnRate > 5 ? "text-red-400" : "text-green-400"
            }`}
          >
            Churn mensual: {churnRate.toFixed(1)}%
          </p>
        </div>

        {/* Conversión */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Conversión trial→pago</p>
          <p
            className={`text-3xl font-black mt-3 ${
              conversionRate > 20
                ? "text-green-400"
                : conversionRate >= 10
                ? "text-yellow-400"
                : "text-red-400"
            }`}
          >
            {conversionRate.toFixed(1)}%
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {trialsConvertedThisMonth} nuevos pagos este mes
          </p>
        </div>

        {/* Comisiones */}
        <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Comisiones a pagar</p>
          <p
            className={`text-3xl font-black mt-3 ${
              totalPendingCommissions > 0 ? "text-yellow-400" : "text-gray-400"
            }`}
          >
            ${totalPendingCommissions.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {affiliatesWithPending.length} afiliados con saldo pendiente
          </p>
        </div>
      </div>

      {/* ── Renovaciones ──────────────────────────────────────────────────────── */}
      <div>
        <h2 className="font-bold text-lg mb-4">Renovaciones</h2>
        <div className="grid md:grid-cols-2 gap-4">
          {/* Este mes */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Renovaciones este mes</h3>
                <p className="text-xs text-gray-500">Próximos 30 días</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-green-500/20 text-green-300 text-xs px-3 py-1 rounded-full font-bold">
                  ${totalRenewalsThisMonth.toFixed(2)} USD
                </span>
                <a
                  href="/api/admin/export/renewals?period=current"
                  className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1.5 rounded-lg transition-colors"
                >
                  ⬇️ CSV
                </a>
              </div>
            </div>
            {renewalsThisMonth.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">Sin renovaciones próximas.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {renewalsThisMonth.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{s.organization.name}</p>
                      <p className="text-gray-500 text-xs">{s.organization.email} · {s.plan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-green-300 font-mono text-xs">
                        ${(s.amount ?? s.plan.price).toFixed(2)}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString("es-AR")
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mes siguiente */}
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-sm">Renovaciones mes siguiente</h3>
                <p className="text-xs text-gray-500">30–60 días</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-white/10 text-gray-300 text-xs px-3 py-1 rounded-full font-bold">
                  ${totalRenewalsNextMonth.toFixed(2)} USD
                </span>
                <a
                  href="/api/admin/export/renewals?period=next"
                  className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-2 py-1.5 rounded-lg transition-colors"
                >
                  ⬇️ CSV
                </a>
              </div>
            </div>
            {renewalsNextMonth.length === 0 ? (
              <p className="text-gray-500 text-sm p-4">Sin renovaciones en este período.</p>
            ) : (
              <div className="divide-y divide-white/5">
                {renewalsNextMonth.map((s) => (
                  <div key={s.id} className="px-4 py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-medium">{s.organization.name}</p>
                      <p className="text-gray-500 text-xs">{s.organization.email} · {s.plan.name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-gray-300 font-mono text-xs">
                        ${(s.amount ?? s.plan.price).toFixed(2)}
                      </p>
                      <p className="text-gray-600 text-xs">
                        {s.currentPeriodEnd
                          ? new Date(s.currentPeriodEnd).toLocaleDateString("es-AR")
                          : "—"}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Pipeline de trials ────────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-lg">Pipeline de trials</h2>
          <span className="bg-white/10 text-gray-300 text-xs px-2 py-0.5 rounded-full">
            {trialsActive.length} total
          </span>
        </div>
        <TrialsPipeline
          expired={trialsExpired.map(serializeTrial)}
          urgent={trialsUrgent.map(serializeTrial)}
          healthy={trialsHealthy.map(serializeTrial)}
        />
      </div>

      {/* ── Comisiones de afiliados ───────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <h2 className="font-bold text-lg">Comisiones de afiliados</h2>
          {totalPendingCommissions > 0 && (
            <span className="bg-yellow-500/20 text-yellow-300 text-xs px-3 py-0.5 rounded-full font-bold">
              ${totalPendingCommissions.toFixed(2)} pendiente
            </span>
          )}
        </div>
        <CommissionsPanel affiliates={affiliatesWithPending as any} />
      </div>
    </div>
  );
}
