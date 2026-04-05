import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const token = (await import("next/headers")).cookies().get("auth-token")?.value;
  const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const organizationId = (session.user as any).organizationId;
  const campaignId = req.nextUrl.searchParams.get("campaignId");
  const leads = await prisma.lead.findMany({
    where: { campaign: { organizationId }, ...(campaignId ? { campaignId } : {}) },
    include: { campaign: { select: { name: true } }, winner: { include: { prize: { select: { title: true } } } } },
    orderBy: { createdAt: "desc" },
    take: 500,
  });
  return NextResponse.json({ leads });
}
