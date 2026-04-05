import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET() {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const orgs = await prisma.organization.findMany({
    where: { subscriptionStatus: "TRIAL", trialEndsAt: { lt: new Date() } },
    include: { plan: { select: { name: true } } },
    orderBy: { trialEndsAt: "desc" },
  });

  const headers = ["Nombre", "Email", "Plan", "Vencimiento Trial"];
  const rows = orgs.map((org) =>
    [
      `"${org.name.replace(/"/g, '""')}"`,
      org.email,
      `"${org.plan.name}"`,
      org.trialEndsAt ? new Date(org.trialEndsAt).toLocaleDateString("es-AR") : "",
    ].join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const filename = `trials-vencidos-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
