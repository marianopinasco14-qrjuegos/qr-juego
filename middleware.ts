import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;

  const dashboardRoutes = ["/dashboard", "/campaigns", "/leads", "/staff-pins", "/settings"];
  const adminRoutes = ["/admin"];

  const isDashboardRoute = dashboardRoutes.some((r) => pathname.startsWith(r));
  const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));

  if ((isDashboardRoute || isAdminRoute) && !token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|play|staff|register).*)"],
};
