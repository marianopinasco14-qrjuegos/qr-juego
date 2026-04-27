import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { executePrizeEngine } from "@/lib/prize-engine";
import { sendWinnerEmail } from "@/lib/email";
import { spinSchema } from "@/lib/validations";
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = spinSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Datos invalidos" }, { status: 400 });
    const { campaignId, leadId, attemptNumber } = parsed.data;
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "0.0.0.0";
    const lead = await prisma.lead.findUnique({ where: { id: leadId }, include: { campaign: { include: { organization: true } } } });
    if (!lead || lead.campaignId !== campaignId) return NextResponse.json({ error: "Lead no valido." }, { status: 404 });
    const existingScans = await prisma.scan.count({ where: { leadId, campaignId } });
    if (existingScans >= lead.campaign.attemptsPerSession) return NextResponse.json({ error: "Ya usaste todos tus intentos." }, { status: 403 });
    const isLastAttempt = attemptNumber >= lead.campaign.attemptsPerSession;
    const result = await prisma.$transaction(async (tx) => {
      await tx.scan.create({ data: { campaignId, leadId, ipAddress, attemptNumber } });
      await tx.organization.update({ where: { id: lead.campaign.organizationId }, data: { totalScans: { increment: 1 } } });
      if (!isLastAttempt) return { isLastAttempt: false, prizeResult: null };
      const prizeResult = await executePrizeEngine(campaignId, leadId, tx);
      if (prizeResult.isWinner) await tx.scan.updateMany({ where: { leadId, campaignId }, data: { isWinner: true } });
      return { isLastAttempt: true, prizeResult };
    });
    if (result.isLastAttempt && result.prizeResult) {
      const extra = lead.extraFields as Record<string, string>;
      const name = extra?.nombre || extra?.name || lead.email.split("@")[0];
      if (result.prizeResult.isWinner) { await sendWinnerEmail({ campaignId, toEmail: lead.email, toName: name, prizeName: result.prizeResult.prizeTitle!, redemptionCode: result.prizeResult.redemptionCode!, expiresAt: result.prizeResult.expiresAt! }); }
    }
    return NextResponse.json({ success: true, isLastAttempt: result.isLastAttempt, prizeResult: result.prizeResult });
  } catch (error) { console.error("Error spin:", error); return NextResponse.json({ error: "Error interno." }, { status: 500 }); }
}
