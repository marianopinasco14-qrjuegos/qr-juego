import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("auth-token")?.value;
  const { pathname } = req.nextUrl;
  const dashboardRoutes = ["/dashboard", "/campaigns", "/leads", "/staff-pins", "/settings"];
  const isDashboardRoute = dashboardRoutes.some((r) => pathname.startsWith(r));
  if (isDashboardRoute && !token) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = { matcher: ["/((?!api|_next/static|_next/image|favicon.ico|play|staff).*)"] };
