import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executePrizeEngine } from "@/lib/prize-engine";
import { sendWinnerEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { campaignId, leadId } = await req.json();
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { campaign: { include: { organization: true } } } });
    if (!lead || lead.campaignId !== campaignId) return NextResponse.json({ error: "Lead no valido." }, { status: 404 });
    const result = await prisma.$transaction(async (tx) => {
      await tx.scan.create({ data: { campaignId, leadId, ipAddress, attemptNumber: 1 } });
      await tx.organization.update({ where: { id: lead.campaign.organizationId }, data: { totalScans: { increment: 1 } } });
      const prizeResult = await executePrizeEngine(campaignId, leadId, tx);
      if (prizeResult.isWinner) await tx.scan.updateMany({ where: { leadId, campaignId }, data: { isWinner: true } });
      return prizeResult;
    });
    const extra = lead.extraFields as Record<string, string>;
    const name = extra?.nombre || extra?.name || lead.email.split("@")[0];
    if (result.isWinner) {
      await sendWinnerEmail({ campaignId, toEmail: lead.email, toName: name, prizeName: result.prizeTitle!, redemptionCode: result.redemptionCode!, expiresAt: result.expiresAt! });
    }
    return NextResponse.json({ prizeResult: result });
  } catch (error) {
    console.error("Error scratch:", error);
    return NextResponse.json({ error: "Error interno." }, { status: 500 });
  }
}
