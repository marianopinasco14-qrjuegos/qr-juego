import { prisma } from "@/lib/prisma";
import CouponForm from "./CouponForm";

export default async function CouponsPage() {
  const coupons = await prisma.coupon.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { uses: true } },
      uses: {
        include: { organization: { select: { name: true, email: true } } },
        orderBy: { usedAt: "desc" },
      },
    },
  });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Cupones ({coupons.length})</h1>
        <CouponForm mode="create" />
      </div>

      <div className="space-y-2">
        {coupons.map((c) => (
          <div key={c.id} className="bg-[#1a1a2e] border border-white/10 rounded-xl overflow-hidden">
            {/* Fila principal */}
            <div className="grid grid-cols-[1fr_80px_80px_80px_120px_80px_120px] gap-2 items-center px-4 py-3 text-sm">
              <div>
                <code className="bg-white/10 px-2 py-0.5 rounded text-purple-300 font-mono">{c.code}</code>
              </div>
              <div className="text-gray-400">{c.type === "PERCENTAGE" ? "Porcentaje" : "Fijo"}</div>
              <div className="font-semibold">
                {c.type === "PERCENTAGE" ? `${c.value}%` : `$${c.value} ${c.currency}`}
              </div>
              <div className="text-gray-400">{c._count.uses} / {c.maxUses ?? "∞"}</div>
              <div className="text-gray-400 text-xs">
                {c.validUntil ? new Date(c.validUntil).toLocaleDateString("es-AR") : "Sin vencimiento"}
              </div>
              <div>
                <span className={`text-xs px-2 py-0.5 rounded ${c.isActive ? "bg-green-500/20 text-green-300" : "bg-red-500/20 text-red-300"}`}>
                  {c.isActive ? "Activo" : "Inactivo"}
                </span>
              </div>
              <div><CouponForm mode="edit" coupon={c} /></div>
            </div>

            {/* Sección expandible de usos */}
            {c.uses.length > 0 && (
              <details className="border-t border-white/5">
                <summary className="px-4 py-2 text-xs text-gray-500 cursor-pointer hover:text-gray-300 select-none list-none flex items-center gap-1">
                  <span className="text-purple-400">▾</span>
                  {c.uses.length} uso{c.uses.length !== 1 ? "s" : ""} — ver organizaciones
                </summary>
                <div className="px-4 pb-3 pt-1">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-gray-600 border-b border-white/5">
                        <th className="text-left py-1.5 font-medium">Organización</th>
                        <th className="text-left py-1.5 font-medium">Email</th>
                        <th className="text-left py-1.5 font-medium">Fecha de uso</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.uses.map((u) => (
                        <tr key={u.id} className="border-b border-white/5">
                          <td className="py-1.5 text-gray-300">{u.organization.name}</td>
                          <td className="py-1.5 text-gray-500">{u.organization.email}</td>
                          <td className="py-1.5 text-gray-500">
                            {new Date(u.usedAt).toLocaleDateString("es-AR")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            )}
          </div>
        ))}

        {coupons.length === 0 && (
          <div className="bg-[#1a1a2e] border border-white/10 rounded-xl p-8 text-center text-gray-500">
            No hay cupones creados.
          </div>
        )}
      </div>
    </div>
  );
}
