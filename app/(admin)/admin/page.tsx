import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const today = new Date();

  const [orgs, users, plans, coupons, affiliates, expiredTrials, activeOrgsWithPlan] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.plan.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.affiliate.count(),
    prisma.organization.count({
      where: { subscriptionStatus: "TRIAL", trialEndsAt: { lt: today }, isActive: true },
    }),
    prisma.organization.findMany({
      where: { subscriptionStatus: "ACTIVE", isActive: true },
      select: { plan: { select: { price: true } } },
    }),
  ]);

  const mrr = activeOrgsWithPlan.reduce((sum, org) => sum + org.plan.price, 0);
  const dailyRevenue = mrr / 30;
  const weeklyRevenue = dailyRevenue * 7;

  const recentOrgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    select: {
      id: true,
      name: true,
      email: true,
      contactName: true,
      subscriptionStatus: true,
      isActive: true,
      createdAt: true,
      plan: { select: { name: true } },
    },
  });

  const statsByStatus = await prisma.organization.groupBy({
    by: ["subscriptionStatus"],
    _count: { id: true },
  });

  const statusMap: Record<string, number> = {};
  for (const s of statsByStatus) {
    statusMap[s.subscriptionStatus] = s._count.id;
  }

  const stats = [
    { label: "Organizaciones", value: orgs, icon: "🏢", href: "/admin/organizations" },
    { label: "Usuarios", value: users, icon: "👤", href: "/admin/organizations" },
    { label: "Planes", value: plans, icon: "💳", href: "/admin/plans" },
    { label: "Cupones activos", value: coupons, icon: "🎟️", href: "/admin/coupons" },
    { label: "Afiliados", value: affiliates, icon: "🔗", href: "/admin/affiliates" },
    { label: "En Trial", value: statusMap["TRIAL"] ?? 0, icon: "⏳", href: "/admin/organizations?status=TRIAL" },
    { label: "Activos", value: statusMap["ACTIVE"] ?? 0, icon: "✅", href: "/admin/organizations?status=ACTIVE" },
    { label: "Cancelados", value: statusMap["CANCELED"] ?? 0, icon: "❌", href: "/admin/organizations?status=CANCELED" },
  ];

  const monetizationMetrics = [
    { label: "MRR", value: `$${mrr.toFixed(2)}`, icon: "💰", sub: "USD/mes" },
    { label: "Revenue hoy (est.)", value: `$${dailyRevenue.toFixed(2)}`, icon: "📅", sub: "USD" },
    { label: "Revenue semana (est.)", value: `$${weeklyRevenue.toFixed(2)}`, icon: "📆", sub: "USD" },
    { label: "Revenue mes (est.)", value: `$${mrr.toFixed(2)}`, icon: "🗓️", sub: "USD" },
    { label: "Trials no convertidos", value: expiredTrials, icon: "⚠️", sub: "vencidos sin pagar" },
  ];

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Panel Superadmin</h1>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.href}
            className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4 hover:border-purple-500/50 transition-colors"
          >
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-sm text-gray-400">{s.label}</div>
          </Link>
        ))}
      </div>

      {/* Métricas de monetización */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-3">
          <h2 className="font-bold text-lg">Métricas de monetización</h2>
          <a
            href="/api/admin/export/trials-expired"
            className="text-xs bg-white/10 hover:bg-white/20 text-gray-300 px-3 py-1.5 rounded-lg transition-colors"
          >
            ⬇️ Exportar trials vencidos
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {monetizationMetrics.map((m) => (
            <div key={m.label} className="bg-[#1a1a2e] border border-white/10 rounded-xl p-4">
              <div className="text-2xl mb-1">{m.icon}</div>
              <div className="text-2xl font-bold text-green-300">{m.value}</div>
              <div className="text-sm text-gray-400">{m.label}</div>
              <div className="text-xs text-gray-600 mt-0.5">{m.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Últimas organizaciones */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl">
        <div className="p-4 border-b border-white/10 flex justify-between items-center">
          <h2 className="font-bold">Últimas organizaciones</h2>
          <Link href="/admin/organizations" className="text-sm text-purple-400 hover:underline">
            Ver todas →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500 text-xs border-b border-white/10">
              <tr>
                <th className="text-left p-3">Organización</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Titular</th>
                <th className="text-left p-3">Plan</th>
                <th className="text-left p-3">Estado</th>
                <th className="text-left p-3">Creada</th>
              </tr>
            </thead>
            <tbody>
              {recentOrgs.map((org) => (
                <tr key={org.id} className="border-b border-white/5 hover:bg-white/2">
                  <td className="p-3 font-medium">{org.name}</td>
                  <td className="p-3 text-gray-400">{org.email}</td>
                  <td className="p-3 text-gray-400 text-xs">{org.contactName ?? "—"}</td>
                  <td className="p-3">
                    <span className="bg-purple-600/20 text-purple-300 px-2 py-0.5 rounded text-xs">
                      {org.plan.name}
                    </span>
                  </td>
                  <td className="p-3">
                    <StatusBadge status={org.subscriptionStatus} active={org.isActive} />
                  </td>
                  <td className="p-3 text-gray-500">
                    {new Date(org.createdAt).toLocaleDateString("es-AR")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status, active }: { status: string; active: boolean }) {
  if (!active) return <span className="text-xs bg-red-500/20 text-red-300 px-2 py-0.5 rounded">Suspendida</span>;
  const map: Record<string, string> = {
    TRIAL: "bg-yellow-500/20 text-yellow-300",
    ACTIVE: "bg-green-500/20 text-green-300",
    PAST_DUE: "bg-orange-500/20 text-orange-300",
    CANCELED: "bg-red-500/20 text-red-300",
    SUSPENDED: "bg-red-500/20 text-red-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${map[status] ?? "bg-gray-500/20 text-gray-300"}`}>
      {status}
    </span>
  );
}
