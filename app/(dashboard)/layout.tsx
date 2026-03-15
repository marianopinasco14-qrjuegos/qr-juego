import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 bg-gray-900 border-r border-white/10 flex-col">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-600 rounded-xl flex items-center justify-center text-lg">🎯</div>
            <div><p className="text-white font-bold text-sm">QR Juego</p><p className="text-white/40 text-xs truncate">{(session.user as any).email}</p></div>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {[{href:"/dashboard",label:"Dashboard",emoji:"📊"},{href:"/campaigns",label:"QR Juegos",emoji:"🎮"},{href:"/leads",label:"Leads",emoji:"👥"},{href:"/staff-pins",label:"Staff PINs",emoji:"🔑"}].map((item) => (
            <Link key={item.href} href={item.href} className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors">
              <span>{item.emoji}</span>{item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10">
          <Link href="/api/auth/signout" className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/40 hover:text-white hover:bg-white/5 transition-colors"><span>🚪</span>Cerrar sesión</Link>
        </div>
      </aside>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-white/10 z-50 flex">
        {[{href:"/dashboard",label:"Dashboard",emoji:"📊"},{href:"/campaigns",label:"Juegos",emoji:"🎮"},{href:"/leads",label:"Leads",emoji:"👥"},{href:"/staff-pins",label:"Staff",emoji:"🔑"}].map((item) => (
          <Link key={item.href} href={item.href} className="flex-1 flex flex-col items-center py-2 gap-1 text-xs text-white/40 hover:text-white transition-colors">
            <span className="text-lg">{item.emoji}</span><span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 md:pb-8">{children}</main>
    </div>
  );
}
