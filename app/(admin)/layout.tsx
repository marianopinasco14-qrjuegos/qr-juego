import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;
  if (!token) redirect("/login");

  const payload = verifyToken(token);
  if (!payload || payload.role !== "SUPERADMIN") redirect("/dashboard");

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/organizations", label: "Organizaciones", icon: "🏢" },
    { href: "/admin/plans", label: "Planes", icon: "💳" },
    { href: "/admin/coupons", label: "Cupones", icon: "🎟️" },
    { href: "/admin/affiliates", label: "Afiliados", icon: "🔗" },
  ];

  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a2e] border-r border-white/10 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="text-lg font-bold">⚡ Superadmin</div>
          <div className="text-xs text-gray-500 mt-0.5">{payload.email}</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
          >
            ← Volver al Dashboard
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
