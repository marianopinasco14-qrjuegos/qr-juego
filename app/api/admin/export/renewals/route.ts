import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const period = req.nextUrl.searchParams.get("period") ?? "current";
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const in60Days = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);

  const dateFrom = period === "next" ? in30Days : now;
  const dateTo = period === "next" ? in60Days : in30Days;

  const subscriptions = await prisma.subscription.findMany({
    where: { status: "ACTIVE", currentPeriodEnd: { gte: dateFrom, lte: dateTo } },
    include: {
      organization: { select: { name: true, email: true, contactName: true } },
      plan: { select: { name: true, price: true } },
    },
    orderBy: { currentPeriodEnd: "asc" },
  });

  const rows = [
    ["Organización", "Email", "Titular", "Plan", "Monto USD", "Fecha renovación"],
    ...subscriptions.map((s) => [
      s.organization.name,
      s.organization.email,
      s.organization.contactName ?? "",
      s.plan.name,
      (s.amount ?? s.plan.price).toFixed(2),
      s.currentPeriodEnd ? new Date(s.currentPeriodEnd).toLocaleDateString("es-AR") : "",
    ]),
  ];

  const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const fecha = now.toISOString().slice(0, 10);
  const filename = `renovaciones-${period === "next" ? "proximo-mes" : "este-mes"}-${fecha}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
