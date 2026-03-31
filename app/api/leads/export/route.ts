import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
export async function GET(req: NextRequest) {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const campaignId = req.nextUrl.searchParams.get("campaignId");
  const leads = await prisma.lead.findMany({ where: { campaign: { organizationId }, ...(campaignId ? { campaignId } : {}) }, include: { campaign: { select: { name: true } }, winner: { include: { prize: { select: { title: true } } } } }, orderBy: { createdAt: "desc" }, take: 5000 });
  const headers = ["Email","WhatsApp","Campana","Fecha","Gano","Premio","Canjeo","Codigo"];
  const rows = leads.map((l) => [l.email, l.whatsapp, `"${l.campaign.name}"`, l.createdAt.toLocaleDateString("es-AR"), l.winner ? "SI" : "NO", l.winner?.prize?.title ?? "", l.winner?.isRedeemed ? "SI" : "NO", l.winner?.redemptionCode ?? ""].join(","));
  const csv = [headers.join(","), ...rows].join("\n");
  return new NextResponse(csv, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="leads-${Date.now()}.csv"` } });
}
