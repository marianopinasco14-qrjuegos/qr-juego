import { prisma } from "@/lib/prisma";
import Link from "next/link";
import OrgActions from "./OrgActions";

interface Props {
  searchParams: { status?: string; q?: string };
}

export default async function OrganizationsPage({ searchParams }: Props) {
  const where: any = {};
  if (searchParams.status) where.subscriptionStatus = searchParams.status;
  if (searchParams.q) {
    where.OR = [
      { name: { contains: searchParams.q, mode: "insensitive" } },
      { email: { contains: searchParams.q, mode: "insensitive" } },
    ];
  }

  const orgs = await prisma.organization.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      plan: true,
      _count: { select: { campaigns: true, users: true } },
    },
  });

  const plans = await prisma.plan.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Organizaciones ({orgs.length})</h1>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <form className="flex gap-2">
          <input
            name="q"
            defaultValue={searchParams.q}
            placeholder="Buscar por nombre o email..."
            className="bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500 w-64"
          />
          <select
            name="status"
            defaultValue={searchParams.status}
            className="bg-[#1a1a2e] border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
          >
            <option value="">Todos los estados</option>
            <option value="TRIAL">Trial</option>
            <option value="ACTIVE">Activo</option>
            <option value="PAST_DUE">Vencido</option>
            <option value="CANCELED">Cancelado</option>
            <option value="SUSPENDED">Suspendido</option>
          </select>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            Filtrar
          </button>
        </form>
        {(searchParams.q || searchParams.status) && (
          <Link href="/admin/organizations" className="text-sm text-gray-400 hover:text-white py-2">
            Limpiar filtros ✕
          </Link>
        )}
      </div>

      {/* Tabla */}
      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs border-b border-white/10">
            <tr>
              <th className="text-left p-3">Organización</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Plan</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Trial / Vence</th>
              <th className="text-left p-3">Campañas</th>
              <th className="text-left p-3">Leads</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {orgs.map((org) => (
              <tr key={org.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="p-3">
                  <div className="font-medium">{org.name}</div>
                  <div className="text-xs text-gray-500">{org.slug}</div>
                </td>
                <td className="p-3 text-gray-400">{org.email}</td>
                <td className="p-3">
                  <OrgActions
                    orgId={org.id}
                    currentPlanId={org.planId}
                    isActive={org.isActive}
                    plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                    mode="plan"
                  />
                </td>
                <td className="p-3">
                  <StatusBadge status={org.subscriptionStatus} active={org.isActive} />
                </td>
                <td className="p-3 text-xs text-gray-400">
                  {org.trialEndsAt
                    ? new Date(org.trialEndsAt).toLocaleDateString("es-AR")
                    : "—"}
                </td>
                <td className="p-3 text-gray-400">{org._count.campaigns}</td>
                <td className="p-3 text-gray-400">{org.totalLeads}</td>
                <td className="p-3">
                  <OrgActions
                    orgId={org.id}
                    currentPlanId={org.planId}
                    isActive={org.isActive}
                    plans={plans.map((p) => ({ id: p.id, name: p.name }))}
                    mode="actions"
                  />
                </td>
              </tr>
            ))}
            {orgs.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">
                  No se encontraron organizaciones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
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
