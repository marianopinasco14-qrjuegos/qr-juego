import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const token = (await import("next/headers")).cookies().get("auth-token")?.value;
    const session = token ? { user: (await import("@/lib/auth")).verifyToken(token) } : null;
    if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

    const campaign = await prisma.campaign.findFirst({
      where: { id: params.id, organizationId: session.user.organizationId },
      select: { id: true, gameType: true },
    });
    if (!campaign) return NextResponse.json({ error: "Campaña no encontrada" }, { status: 404 });
    if (campaign.gameType !== "SORTEO") return NextResponse.json({ error: "Solo aplica a campañas tipo SORTEO" }, { status: 400 });

    const winners = await prisma.raffleWinner.findMany({
      where: { campaignId: params.id },
      include: {
        rafflePrize: { select: { title: true } },
        lead: { select: { email: true, whatsapp: true, extraFields: true } },
      },
      orderBy: [{ rafflePrizeId: "asc" }, { isAlternate: "asc" }, { position: "asc" }],
    });

    const result = winners.map(w => ({
      rafflePrizeTitle: w.rafflePrize.title,
      isAlternate: w.isAlternate,
      position: w.position,
      leadName: (w.lead.extraFields as any)?.nombre || "",
      leadEmail: w.lead.email,
      leadWhatsapp: w.lead.whatsapp,
      redemptionCode: w.redemptionCode,
      isRedeemed: w.isRedeemed,
      redeemedAt: w.redeemedAt,
      expiresAt: w.expiresAt,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching raffle results:", error);
    return NextResponse.json({ error: "Error interno" }, { status: 500 });
  }
}
