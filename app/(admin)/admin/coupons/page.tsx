import { prisma } from "@/lib/prisma";
import CouponForm from "./CouponForm";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { uses: true } } },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cupones ({coupons.length})</h1>
        <CouponForm mode="create" />
      </div>

      <div className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-gray-500 text-xs border-b border-white/10">
            <tr>
              <th className="text-left p-3">Código</th>
              <th className="text-left p-3">Tipo</th>
              <th className="text-left p-3">Valor</th>
              <th className="text-left p-3">Usos</th>
              <th className="text-left p-3">Válido hasta</th>
              <th className="text-left p-3">Estado</th>
              <th className="text-left p-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} className="border-b border-white/5 hover:bg-white/2">
                <td className="p-3">
                  <code className="bg-white/10 px-2 py-0.5 rounded text-purple-300 font-mono">{c.code}</code>
                </td>
                <td className="p-3 text-gray-400">{c.type === "PERCENTAGE" ? "Porcentaje" : "Fijo"}</td>
                <td className="p-3 font-semibold">
                  {c.type === "PERCENTAGE" ? `${c.value}%` : `$${c.value} ${c.currency}`}
                </td>
                <td className="p-3 text-gray-400">
                  {c._count.uses} / {c.maxUses ?? "∞"}
                </td>
                <td className="p-3 text-gray-400 text-xs">
                  {c.validUntil ? new Date(c.validUntil).toLocaleDateString("es-AR") : "Sin vencimiento"}
                </td>
                <td className="p-3">
                  <span className={`text-xs px-2 py-0.5 rounded ${c.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                    {c.isActive ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="p-3">
                  <CouponForm mode="edit" coupon={c} />
                </td>
              </tr>
            ))}
            {coupons.length === 0 && (
              <tr><td colSpan={7} className="p-6 text-center text-gray-500">No hay cupones.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
