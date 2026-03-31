import { prisma } from "@/lib/prisma";
import AffiliateForm from "./AffiliateForm";

export default async function AffiliatesPage() {
  const affiliates = await prisma.affiliate.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { referrals: true } } },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Afiliados ({affiliates.length})</h1>
        <AffiliateForm mode="create" />
      </div>

      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs border-b border-white/10">
            <tr>
              <th className="text-left p-3">Nombre / Email</th>
              <th className="text-left p-3">Código</th>
              <th className="text-left p-3">Comisión</th>
              <th className="text-left p-3">Referidos</th>
              <th className="text-left p-3">Ganado</th>
              <th className="text-left p-3">Pendiente</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {affiliates.map((a) => (
              <tr key={a.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="p-3">
                  <div className="font-medium">{a.name}</div>
                  <div className="text-xs text-gray-500">{a.email}</div>
                </td>
                <td className="p-3">
                  <code className="bg-white/10 px-2 py-0.5 rounded text-green-300 font-mono text-xs">{a.code}</code>
                  <div className="text-xs text-gray-600 mt-0.5">/register?ref={a.code}</div>
                </td>
                <td className="p-3 font-semibold">{a.commissionRate}%</td>
                <td className="p-3 text-gray-400">{a._count.referrals}</td>
                <td className="p-3 text-green-400">${a.totalCommissionEarned.toFixed(2)}</td>
                <td className="p-3 text-yellow-400">${a.pendingCommission.toFixed(2)}</td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${
                    a.status === "ACTIVE" ? "bg-green-500/20 text-green-300" :
                    a.status === "PENDING" ? "bg-yellow-500/20 text-yellow-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>
                    {a.status}
                  </span>
                </td>
                <td className="p-3">
                  <AffiliateForm mode="edit" affiliate={a} />
                </td>
              </tr>
            ))}
            {affiliates.length === 0 && (
              <tr><td colSpan={8} className="p-6 text-center text-gray-500">No hay afiliados.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
