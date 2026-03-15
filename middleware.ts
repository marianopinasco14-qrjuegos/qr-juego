import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAuthenticated = !!req.auth;
  const userRole = (req.auth?.user as any)?.role;
  const dashboardRoutes = ["/dashboard","/campaigns","/leads","/staff-pins","/settings"];
  const isDashboardRoute = dashboardRoutes.some((r) => pathname.startsWith(r));
  if (isDashboardRoute && !isAuthenticated) return NextResponse.redirect(new URL("/login", req.url));
  if (pathname.startsWith("/admin") && (!isAuthenticated || userRole !== "SUPERADMIN")) return NextResponse.redirect(new URL("/dashboard", req.url));
  return NextResponse.next();
});
export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|play|staff).*)"] };
