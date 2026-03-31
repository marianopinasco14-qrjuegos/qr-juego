import { prisma } from "@/lib/prisma";
import Link from "next/link";

export default async function AdminDashboard() {
  const [orgs, users, plans, coupons, affiliates] = await Promise.all([
    prisma.organization.count(),
    prisma.user.count(),
    prisma.plan.count(),
    prisma.coupon.count({ where: { isActive: true } }),
    prisma.affiliate.count(),
  ]);

  const recentOrgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    take: 8,
    include: { plan: true },
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
