import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import AlertsBell from "@/components/AlertsBell";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = cookies().get("auth-token")?.value;
  const session = token ? { user: verifyToken(token) } : null;
  if (!session?.user) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-white/10 flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src="/jugalo-square-dark.svg" alt="jugalo" className="w-10 h-10" />
              <div><p className="text-white font-bold text-sm">jugalo</p><p className="text-white/40 text-xs truncate">{(session.user as any).email}</p></div>
            </div>
            <AlertsBell />
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[{href:"/dashboard",label:"Dashboard",emoji:"📊"},{href:"/campaigns",label:"QR Juegos",emoji:"🎮"},{href:"/leads",label:"Leads",emoji:"👥"},{href:"/staff-pins",label:"Staff PINs",emoji:"🔑"},{href:"/analytics",label:"Analytics",emoji:"📈"},{href:"/settings",label:"Configuración",emoji:"⚙️"}].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <span>{item.emoji}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
<form action="/api/logout" method="POST"><button type="submit" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors w-full"><span>🚪</span>Cerrar sesión</button></form>
        </div>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 z-50 flex">
        {[{href:"/dashboard",label:"Dashboard",emoji:"📊"},{href:"/campaigns",label:"Juegos",emoji:"🎮"},{href:"/leads",label:"Leads",emoji:"👥"},{href:"/staff-pins",label:"Staff",emoji:"🔑"},{href:"/analytics",label:"Analytics",emoji:"📈"}].map((item) => (
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 gap-1 text-xs text-white/40 hover:text-white transition-colors">
            <span className="text-lg">{item.emoji}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
