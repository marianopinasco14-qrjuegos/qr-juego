import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/admin-auth";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const admin = requireSuperAdmin();
  if (!admin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  const mes = req.nextUrl.searchParams.get("mes") ?? new Date().toISOString().slice(0, 7);

  const affiliate = await prisma.affiliate.findUnique({ where: { id: params.id } });
  if (!affiliate) return NextResponse.json({ error: "Afiliado no encontrado" }, { status: 404 });

  // Orgs referidas activas (subscriptionStatus = ACTIVE)
  const referrals = await prisma.affiliateReferral.findMany({
    where: {
      affiliateId: params.id,
      referredOrganization: { subscriptionStatus: "ACTIVE", isActive: true },
    },
    include: {
      referredOrganization: {
        include: { plan: { select: { name: true, price: true } } },
      },
    },
  });

  const [year, month] = mes.split("-").map(Number);
  const monthName = new Date(year, month - 1).toLocaleString("es-AR", { month: "long", year: "numeric" });

  let totalPay = 0;
  const rows = referrals.map((r) => {
    const price = r.referredOrganization.plan.price;
    const commission = (price * affiliate.commissionRate) / 100;
    totalPay += commission;
    return [
      `"${r.referredOrganization.name.replace(/"/g, '""')}"`,
      r.referredOrganization.email,
      `"${r.referredOrganization.plan.name}"`,
      price.toFixed(2),
      commission.toFixed(2),
    ].join(",");
  });

  const header = [
    `"Liquidación ${monthName}"`,
    `"Afiliado: ${affiliate.name} (${affiliate.email})"`,
    `"Comisión: ${affiliate.commissionRate}%"`,
    "",
  ].join("\n");

  const tableHeader = ["Organización", "Email", "Plan", "Precio (USD)", "Comisión (USD)"].join(",");
  const footer = `\n"TOTAL A PAGAR",,,,${totalPay.toFixed(2)}`;

  const csv = [header, tableHeader, ...rows, footer].join("\n");
  const filename = `liquidacion-${affiliate.code}-${mes}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
