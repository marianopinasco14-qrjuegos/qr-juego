import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import { verifyToken } from "@/lib/auth";

export async function GET() {
  const token = cookies().get("auth-token")?.value;
  const user = token ? verifyToken(token) : null;
  if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (user as any).organizationId;
  const [campaigns, totalLeads, totalScans, totalWinners, totalRedeemed] = await Promise.all([
    prisma.campaign.findMany({ where: { organizationId }, include: { prizes: { select: { stock: true, deliveredCount: true, title: true } }, _count: { select: { leads: true, scans: true } } }, orderBy: { createdAt: "desc" } }),
    prisma.lead.count({ where: { campaign: { organizationId } } }),
    prisma.scan.count({ where: { campaign: { organizationId } } }),
    prisma.winner.count({ where: { prize: { campaign: { organizationId } } } }),
    prisma.winner.count({ where: { isRedeemed: true, prize: { campaign: { organizationId } } } }),
  ]);
  return NextResponse.json({ campaigns, stats: { totalLeads, totalScans, totalWinners, totalRedeemed } });
}
