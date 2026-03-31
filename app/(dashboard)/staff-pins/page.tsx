
import { prisma } from "@/lib/prisma";
export default async function StaffPinsPage() {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  const organizationId = (session!.user as any).organizationId;
  const pins = await prisma.staffPin.findMany({ where: { organizationId }, orderBy: { createdAt: "desc" } });
  return (
    <div>
      <div className="mb-6"><h1 className="text-white text-2xl font-bold">Staff PINs</h1><p className="text-white/50 text-sm mt-1">PINs para que tu equipo canjee premios</p></div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
        <p className="text-white/60 text-sm mb-1">URL de canje para staff:</p>
        <p className="text-white font-mono text-sm">{process.env.NEXT_PUBLIC_APP_URL}/staff</p>
        <p className="text-white/40 text-xs mt-2">ID de tu organización: <span className="font-mono text-violet-300">{organizationId}</span></p>
      </div>
      <div className="space-y-3">
        {pins.map(pin => (
          <div key={pin.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-violet-600/20 rounded-xl flex items-center justify-center text-violet-400 font-mono font-bold text-lg">{pin.pin}</div>
              <div><p className="text-white font-medium">{pin.staffName}</p><p className="text-white/40 text-xs">{pin.redeemedCount} canjes</p></div>
            </div>
            <span className={`text-xs px-2 py-1 rounded-full ${pin.isActive?"bg-green-500/20 text-green-400":"bg-red-500/20 text-red-400"}`}>{pin.isActive?"Activo":"Inactivo"}</span>
          </div>
        ))}
        {pins.length === 0 && <div className="text-center py-12 border border-dashed border-white/20 rounded-2xl"><p className="text-white/40">No hay PINs configurados</p></div>}
      </div>
    </div>
  );
}
